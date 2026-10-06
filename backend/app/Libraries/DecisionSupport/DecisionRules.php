<?php

namespace App\Libraries\DecisionSupport;

use DateTimeImmutable;

/**
 * Decision Support rule engine.
 *
 * Design constraints (see Decision Support requirements):
 *  - Uses ONLY fields that already exist in projects_tbl / budget_tbl /
 *    releases_tbl. No new columns, no invented milestones or percentages.
 *  - Fully deterministic, transparent rules. No ML, no scoring weights that
 *    a reviewer cannot read.
 *  - Never decides for DOST personnel. It reports evidence and a suggested
 *    action; a human still makes the call.
 *  - Never uses a completion percentage (none is reliably recorded).
 *
 * IMPORTANT DESIGN NOTE ON DATA REALITY
 * -------------------------------------
 * In the live database most projects have an empty `status` field and the
 * releases table is entirely unpopulated. A rule set that treated "end date
 * has passed" as proof of failure classified 65% of all projects as Critical.
 * That is an automated verdict, not decision support.
 *
 * So this engine distinguishes:
 *   - CONFIRMED findings: an active, recorded status contradicts a passed
 *     end date. Real evidence, safe to raise severity on.
 *   - DATA COMPLETENESS findings: the record cannot be verified (status
 *     missing, dates unparseable). Reported as "Needs Attention" with the
 *     reason "record incomplete", never as project failure.
 *
 * Free-text fields (deliverables, beneficiaries, projectAccomplishment) are
 * surfaced as supporting context only. They are never parsed as structured
 * completion data.
 */
class DecisionRules
{
    public const CRITICAL          = 'CRITICAL';
    public const AT_RISK           = 'AT_RISK';
    public const NEEDS_ATTENTION   = 'NEEDS_ATTENTION';
    public const ON_TRACK          = 'ON_TRACK';
    public const INSUFFICIENT_DATA = 'INSUFFICIENT_DATA';

    /**
     * Severity ordering. Higher wins when several rules fire.
     *
     * INSUFFICIENT_DATA outranks NEEDS_ATTENTION deliberately: "we could not
     * evaluate this project" is a more important thing to tell a reviewer than
     * "this project has a minor gap". It must still rank below AT_RISK and
     * CRITICAL, which are evidence of actual problems.
     */
    private const SEVERITY = [
        self::ON_TRACK          => 0,
        self::NEEDS_ATTENTION   => 1,
        self::INSUFFICIENT_DATA => 2,
        self::AT_RISK           => 3,
        self::CRITICAL          => 4,
    ];

    /**
     * Statuses that mean the project is finished and should not be flagged
     * for schedule overrun. Matches the vocabulary already used across the
     * app (Dashboard::normalizeStatus).
     */
    private const CLOSED_STATUSES   = ['completed', 'terminated', 'interminated', 'cleared'];
    private const ACTIVE_STATUSES   = ['ongoing', 'on-going', 'new'];
    private const UNRECOGNIZED_HINT = 'unrecognized status value';

    /**
     * Assesses a single project.
     *
     * @param array $project Row from projects_tbl (plus optionally
     *                       'budgetRows' and 'releaseRows' aggregates).
     * @param DateTimeImmutable|null $asOf Evaluation date, injectable for tests.
     *
     * @return array{
     *   classification:string, label:string, severity:int,
     *   reasons:array<int,array{code:string,text:string,evidence:string}>,
     *   supportingData:array<string,mixed>,
     *   recommendedActions:array<int,string>,
     *   evidence:array<string,mixed>,
     *   dataCompleteness:array{complete:bool,gaps:array<int,string>}
     * }
     */
    public function assess(array $project, ?DateTimeImmutable $asOf = null): array
    {
        $asOf = $asOf ?? new DateTimeImmutable('today');
        $today = $asOf->setTime(0, 0);

        $status     = $this->normalizeStatus($project['status'] ?? $project['remarks'] ?? '');
        $statusRaw  = trim((string) ($project['status'] ?? $project['remarks'] ?? ''));

        // ---- Parse the schedule defensively -------------------------------
        // These columns are VARCHAR and in practice hold ISO dates, ranges
        // ("2018-04-01 - 2018-06-30") and prose
        // ("1st Extension: July 01, 2016 - September 30, 2016").
        $originalStart = $this->lastDate($project['originalStart'] ?? '');
        $originalEnd   = $this->lastDate($project['originalEnd'] ?? '');
        $extensions    = [
            'firstExtension'          => (string) ($project['firstExtension'] ?? ''),
            'secondExtension'         => (string) ($project['secondExtension'] ?? ''),
            'changeImplementationDate' => (string) ($project['changeImplementationDate'] ?? ''),
        ];
        $extensionEnd   = null;
        $extensionCount = 0;
        foreach ($extensions as $value) {
            $parsed = $this->lastDate($value);
            if ($parsed !== null) {
                $extensionEnd = $extensionEnd === null ? $parsed : ($parsed > $extensionEnd ? $parsed : $extensionEnd);
                $extensionCount++;
            }
            // A single field can describe two separate extensions in prose.
            if (stripos($value, '2nd extension') !== false || stripos($value, 'second extension') !== false) {
                $extensionCount++;
            }
        }

        // The operative end date is the latest approved date on record.
        $operativeEnd = $originalEnd;
        if ($extensionEnd !== null && ($operativeEnd === null || $extensionEnd > $operativeEnd)) {
            $operativeEnd = $extensionEnd;
        }

        $closed  = in_array($status, self::CLOSED_STATUSES, true);
        $active  = in_array($status, self::ACTIVE_STATUSES, true);
        $statusMissing = ($statusRaw === '');

        // ---- Financial aggregates (structured numeric fields only) --------
        $budgetRows  = $project['budgetRows']  ?? [];
        $releaseRows = $project['releaseRows'] ?? [];
        $budget = $this->aggregateBudget($budgetRows);
        $releases = $this->aggregateReleases($releaseRows);

        $reasons = [];
        $actions = [];
        $classification = self::ON_TRACK;
        $gaps = [];

        // ---- RULE 1: schedule data missing ---------------------------------
        if ($originalEnd === null && $extensionEnd === null) {
            $gaps[] = 'No end date on record (originalEnd is empty or unparseable)';
            $reasons[] = [
                'code'     => 'SCHEDULE_DATA_MISSING',
                'text'     => 'No usable end date is recorded, so schedule performance cannot be assessed.',
                'evidence' => 'originalEnd = ' . $this->quote($project['originalEnd'] ?? '')
                    . '; firstExtension = ' . $this->quote($project['firstExtension'] ?? ''),
            ];
            $classification = $this->escalate($classification, self::INSUFFICIENT_DATA);
            $actions[] = 'Enter the project end date so the schedule can be assessed.';
        }

        // ---- RULE 2: active status past the approved end date --------------
        // This is the only schedule finding that is treated as CONFIRMED,
        // because the record itself asserts the project is still running.
        if ($operativeEnd !== null && $active) {
            $daysOverdue = $this->signedDays($operativeEnd, $today);
            if ($daysOverdue > 0) {
                $severity = $daysOverdue > 180 ? self::CRITICAL : self::AT_RISK;
                $classification = $this->escalate($classification, $severity);

                $reasons[] = [
                    'code'     => $daysOverdue > 180 ? 'OVERDUE_BEYOND_EXTENSION' : 'OVERDUE_ACTIVE',
                    'text'     => sprintf(
                        'Status is recorded as "%s" but the approved end date (%s) passed %d days ago.',
                        $statusRaw,
                        $operativeEnd->format('M j, Y'),
                        $daysOverdue
                    ),
                    'evidence' => sprintf(
                        'status = %s; operative end date = %s (originalEnd = %s%s); days overdue = %d',
                        $this->quote($statusRaw),
                        $operativeEnd->format('Y-m-d'),
                        $this->quote($project['originalEnd'] ?? ''),
                        $extensionEnd !== null ? '; latest extension = ' . $extensionEnd->format('Y-m-d') : '',
                        $daysOverdue
                    ),
                ];

                $actions[] = $daysOverdue > 180
                    ? 'Prioritize for review: confirm whether the project is being extended, terminated, or requires a new approval.'
                    : 'Request an updated schedule or a formal extension from the project leader.';

                if ($extensionCount >= 2) {
                    $reasons[] = [
                        'code'     => 'REPEATED_EXTENSION',
                        'text'     => sprintf('%d extension records are on file for this project.', $extensionCount),
                        'evidence' => implode(' | ', array_map(
                            fn ($k, $v) => $k . ' = ' . $this->quote($v),
                            array_keys($extensions),
                            $extensions
                        )),
                    ];
                    $actions[] = 'Review the extension history for repeated slippage and consider a revised implementation plan.';
                }
            }
        }

        // ---- RULE 3: end date passed, status not recorded ------------------
        // Deliberately NOT escalated to At Risk/Critical. The project may be
        // finished with nobody having updated the field. Reported as a
        // record-completeness issue so a human verifies it.
        if ($operativeEnd !== null && $statusMissing && ! $closed) {
            $daysOverdue = $this->signedDays($operativeEnd, $today);
            if ($daysOverdue > 0) {
                $gaps[] = 'Status field is empty, so current project state is unverified';
                $classification = $this->escalate($classification, self::NEEDS_ATTENTION);
                $reasons[] = [
                    'code'     => 'STATUS_UNVERIFIED',
                    'text'     => sprintf(
                        'The approved end date (%s) has passed by %d days, but no project status is recorded. '
                        . 'This may mean the record is out of date rather than that the project is delayed.',
                        $operativeEnd->format('M j, Y'),
                        $daysOverdue
                    ),
                    'evidence' => sprintf(
                        'status = (empty); operative end date = %s; days past = %d',
                        $operativeEnd->format('Y-m-d'),
                        $daysOverdue
                    ),
                ];
                $actions[] = 'Verify the current project status and update the record; classification cannot be confirmed until it is set.';
            }
        }

        // ---- RULE 4: end date approaching ---------------------------------
        if ($operativeEnd !== null && $active && ! $closed) {
            $daysRemaining = $this->signedDays($today, $operativeEnd);
            if ($daysRemaining >= 0 && $daysRemaining <= 90) {
                $classification = $this->escalate($classification, self::NEEDS_ATTENTION);
                $reasons[] = [
                    'code'     => 'DEADLINE_NEAR',
                    'text'     => sprintf(
                        'The approved end date is %d days away (on %s).',
                        $daysRemaining,
                        $operativeEnd->format('M j, Y')
                    ),
                    'evidence' => sprintf(
                        'status = %s; end date = %s; days remaining = %d',
                        $this->quote($statusRaw),
                        $operativeEnd->format('Y-m-d'),
                        $daysRemaining
                    ),
                ];
                $actions[] = 'Confirm that remaining deliverables and fund obligations can still be completed within the approved end date.';
            }
        }

        // ---- RULE 5: recorded as ongoing with no budget on file ------------
        if ($active && $budget['years'] === 0) {
            $gaps[] = 'No budget records on file for an ongoing project';
            $classification = $this->escalate($classification, self::NEEDS_ATTENTION);
            $reasons[] = [
                'code'     => 'BUDGET_DATA_MISSING',
                'text'     => 'The project is recorded as ongoing but no yearly budget allocation is on file.',
                'evidence' => 'budget_tbl rows = 0; totalBudget = ' . $this->quote($project['totalBudget'] ?? ''),
            ];
            $actions[] = 'Load or confirm the yearly budget allocation so fund utilization can be reviewed.';
        }

        // ---- RULE 6: fund utilization -------------------------------------
        // Only evaluated when real release figures exist. In the current
        // database no release rows are populated, so this rule is skipped
        // rather than assumed.
        if ($budget['totalProgrammed'] > 0 && $releases['hasData'] && $releases['totalActual'] > 0) {
            $utilization = ($releases['totalActual'] / $budget['totalProgrammed']) * 100;
            $programmed = $this->sumField($releaseRows, 'programmedAmount');
            if ($programmed > 0) {
                $gap = $programmed - $releases['totalActual'];
                $utilization = ($releases['totalActual'] / $programmed) * 100;
            }

            if ($utilization < 50 && $active) {
                $classification = $this->escalate($classification, self::NEEDS_ATTENTION);
                $reasons[] = [
                    'code'     => 'LOW_FUND_UTILIZATION',
                    'text'     => sprintf(
                        'Actual releases are %.1f%% of the programmed amount while the project is ongoing.',
                        $utilization
                    ),
                    'evidence' => sprintf(
                        'actual releases = %s; programmed = %s; total budget = %s',
                        number_format($releases['totalActual'], 2),
                        $programmed > 0 ? number_format($programmed, 2) : 'not recorded',
                        number_format($budget['totalProgrammed'], 2)
                    ),
                ];
                $actions[] = 'Review the reason for low fund utilization and whether the programmed amount should be realigned.';
            }
        }

        // ---- RULE 7: closed projects --------------------------------------
        if ($closed) {
            $reasons[] = [
                'code'     => 'PROJECT_CLOSED',
                'text'     => sprintf('The project is recorded as "%s".', $statusRaw),
                'evidence' => 'status = ' . $this->quote($statusRaw),
            ];
        }

        // ---- Unrecognized status is a data gap, never an assumption --------
        if ($statusRaw !== '' && ! $active && ! $closed) {
            $gaps[] = self::UNRECOGNIZED_HINT . ': ' . $statusRaw;
            $reasons[] = [
                'code'     => 'STATUS_UNRECOGNIZED',
                'text'     => sprintf(
                    'Status "%s" is not one of the recognized values (New, Ongoing, Completed, Cleared, Interminated, Terminated), '
                    . 'so the project could not be evaluated against schedule rules.',
                    $statusRaw
                ),
                'evidence' => 'status = ' . $this->quote($statusRaw),
            ];
            $classification = $this->escalate($classification, self::INSUFFICIENT_DATA);
            $actions[] = 'Correct the status value to a recognized option so automated checks can evaluate the project.';
        }

        // No rule fired at all -> explicitly record that we found no issue.
        if ($reasons === []) {
            $reasons[] = [
                'code'     => 'NO_ISSUE_DETECTED',
                'text'     => 'No rule was triggered by the recorded data for this project.',
                'evidence' => $this->describeSchedule($originalStart, $operativeEnd, $statusRaw, $budget, $releases),
            ];
            $classification = self::ON_TRACK;
        }

        $actions = $this->uniqueActions($actions);

        if ($classification === self::ON_TRACK && $actions === []) {
            $actions[] = 'No action indicated by the recorded data. Continue routine monitoring.';
        }

        return [
            'classification'   => $classification,
            'label'            => $this->label($classification),
            'severity'         => self::SEVERITY[$classification],
            'reasons'          => $reasons,
            'evidence'         => [
                'asOf'                 => $today->format('Y-m-d'),
                'status'               => $statusRaw,
                'statusNormalized'     => $status,
                'originalStart'        => $originalStart?->format('Y-m-d'),
                'originalEnd'          => $originalEnd?->format('Y-m-d'),
                'operativeEndDate'     => $operativeEnd?->format('Y-m-d'),
                'operativeEndSource'   => $this->endDateSource($originalEnd, $extensionEnd),
                'extensionRecords'     => $extensionCount,
                'daysPastEndDate'      => $operativeEnd === null ? null : $this->signedDays($operativeEnd, $today),
                'totalProgrammedBudget' => $budget['totalProgrammed'],
                'totalActualReleases'  => $releases['totalActual'],
                'releasesDataAvailable' => $releases['hasData'],
            ],
            'supportingData'   => [
                'budgetRows'      => $budget['rows'],
                'budgetYears'     => $budget['years'],
                'budgetByYear'    => $budget['byYear'],
                'releaseRows'     => $releases['rows'],
                'releaseCount'    => $releases['count'],
                'totalProgrammed' => $releases['totalProgrammed'],
                'totalActual'     => $releases['totalActual'],
                'utilizationPct'  => $releases['totalProgrammed'] > 0
                    ? round(($releases['totalActual'] / $releases['totalProgrammed']) * 100, 2)
                    : null,
            ],
            'freeTextContext'  => [
                'deliverables'         => $this->trimForContext($project['deliverables'] ?? ''),
                'beneficiaries'        => $this->trimForContext($project['beneficiaries'] ?? ''),
                'projectAccomplishment' => $this->trimForContext($project['projectAccomplishment'] ?? ''),
            ],
            'recommendedActions' => $actions,
            'dataCompleteness'  => [
                'complete' => $gaps === [],
                'gaps'     => $gaps,
            ],
            'disclaimer' => 'Rule-based indicator generated from recorded data. Not an automated decision — a DOST officer must review and decide.',
        ];
    }

    /**
     * Summarises a list of projects. Dashboard-facing.
     *
     * @return array{counts:array<string,int>,total:int,attention:array}
     */
    public function summarise(array $assessments): array
    {
        $counts = array_fill_keys([
            self::CRITICAL, self::AT_RISK, self::NEEDS_ATTENTION,
            self::ON_TRACK, self::INSUFFICIENT_DATA,
        ], 0);

        foreach ($assessments as $a) {
            $counts[$a['classification']] = ($counts[$a['classification']] ?? 0) + 1;
        }

        return ['counts' => $counts, 'total' => count($assessments)];
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /**
     * Whole days from $from to $to. Positive when $to is later than $from,
     * negative when it is earlier, 0 on the same day.
     *
     * Daylight-saving transitions make naive second arithmetic unreliable, so
     * this counts whole calendar days between midnight-aligned dates.
     */
    private function signedDays(DateTimeImmutable $from, DateTimeImmutable $to): int
    {
        $utcFrom = $from->setTimezone(new \DateTimeZone('UTC'));
        $utcTo   = $to->setTimezone(new \DateTimeZone('UTC'));

        $seconds = $utcTo->getTimestamp() - $utcFrom->getTimestamp();

        return (int) round($seconds / 86400);
    }

    /**
     * Extracts the LATEST date mentioned in a free-form VARCHAR date field.
     *
     * Date columns in this schema are VARCHAR and hold at least three shapes:
     *   "2018-04-01"
     *   "2018-04-01 - 2018-06-30"
     *   "1st Extension: July 01, 2016 - September 30, 2016  2nd Extension: October 01, 2016 - December 31, 2016"
     * Taking the maximum is correct for an end date and for extensions.
     *
     * @return DateTimeImmutable|null
     */
    private function lastDate(string $raw): ?DateTimeImmutable
    {
        $raw = trim($raw);
        if ($raw === '') {
            return null;
        }

        $best = null;
        $consider = static function (?DateTimeImmutable $d) use (&$best): void {
            if ($d !== null && ($best === null || $d > $best)) {
                $best = $d;
            }
        };

        // ISO: YYYY-MM-DD
        if (preg_match_all('/(\d{4})-(\d{1,2})-(\d{1,2})/', $raw, $m, PREG_SET_ORDER)) {
            foreach ($m as $match) {
                $consider($this->safeDate($match[1], $match[2], $match[3]));
            }
        }

        // Prose: "July 01, 2016" / "01 July 2016"
        if (preg_match_all('/([A-Z][a-z]{2,8})\s+(\d{1,2}),?\s+(\d{4})/', $raw, $m, PREG_SET_ORDER)) {
            foreach ($m as $match) {
                $consider($this->safeEnglishDate($match[1], $match[2], $match[3]));
            }
        }

        if ($best !== null) {
            return $best;
        }

        // Year-only: "2016" -> treat as end of that year, which is the
        // conservative (latest) reading for an end date.
        if (preg_match_all('/\b(\d{4})\b/', $raw, $m)) {
            $years = array_map('intval', $m[1]);
            if ($years !== []) {
                $consider($this->safeDate((string) max($years), '12', '31'));
            }
        }

        return $best;
    }

    private function safeDate(string $y, string $m, string $d): ?DateTimeImmutable
    {
        if (! checkdate((int) $m, (int) $d, (int) $y)) {
            return null;
        }

        try {
            return new DateTimeImmutable(sprintf('%04d-%02d-%02d', (int) $y, (int) $m, (int) $d));
        } catch (\Exception $e) {
            return null;
        }
    }

    private function safeEnglishDate(string $month, string $day, string $year): ?DateTimeImmutable
    {
        $key = strtolower(substr($month, 0, 3));
        $map = [
            'jan' => 1, 'feb' => 2, 'mar' => 3, 'apr' => 4, 'may' => 5, 'jun' => 6,
            'jul' => 7, 'aug' => 8, 'sep' => 9, 'oct' => 10, 'nov' => 11, 'dec' => 12,
        ];
        if (! isset($map[$key])) {
            return null;
        }

        return $this->safeDate($year, (string) $map[$key], $day);
    }

    /** Mirrors Dashboard::normalizeStatus so both sides agree. */
    private function normalizeStatus(string $raw): string
    {
        $r = strtolower(str_replace(['-', ' '], '', trim($raw)));
        if ($r === '') {
            return '';
        }
        if (str_contains($r, 'ongoing')) {
            return 'ongoing';
        }
        if (str_contains($r, 'new')) {
            return 'new';
        }
        if (str_contains($r, 'completed') || str_contains($r, 'complete')) {
            return 'completed';
        }
        if (str_contains($r, 'interminat')) {
            return 'interminated';
        }
        if (str_contains($r, 'terminated')) {
            return 'terminated';
        }
        if (str_contains($r, 'cleared')) {
            return 'cleared';
        }

        return strtolower(trim($raw));
    }

    private function aggregateBudget(array $rows): array
    {
        $byYear = [];
        foreach ($rows as $row) {
            $year = $row['year'] ?? null;
            $amount = (float) ($row['amount'] ?? 0);
            if ($year !== null && $amount > 0) {
                $byYear[(string) $year] = ($byYear[(string) $year] ?? 0) + $amount;
            }
        }
        ksort($byYear);

        // totalBudget is duplicated across the per-year rows, so take the
        // largest single value rather than summing (which would multiply it).
        $totalProgrammed = 0.0;
        foreach ($rows as $row) {
            $totalProgrammed = max($totalProgrammed, (float) ($row['totalBudget'] ?? 0));
        }

        return [
            'rows'            => count($rows),
            'years'           => count($byYear),
            'byYear'          => $byYear,
            'totalProgrammed' => $totalProgrammed,
        ];
    }

    private function aggregateReleases(array $rows): array
    {
        $hasData = false;
        $totalActual = 0.0;
        $totalProgrammed = 0.0;

        foreach ($rows as $row) {
            $actual = (float) ($row['actualRelease'] ?? 0);
            $programmed = (float) ($row['programmedAmount'] ?? 0);
            if ($actual !== 0.0 || $programmed !== 0.0) {
                $hasData = true;
            }
            $totalActual     += $actual;
            $totalProgrammed += $programmed;
        }

        return [
            'rows'            => count($rows),
            'count'           => count($rows),
            'hasData'         => $hasData,
            'totalActual'     => $totalActual,
            'totalProgrammed' => $totalProgrammed,
        ];
    }

    private function sumField(array $rows, string $field): float
    {
        $sum = 0.0;
        foreach ($rows as $row) {
            $sum += (float) ($row[$field] ?? 0);
        }

        return $sum;
    }

    private function escalate(string $current, string $candidate): string
    {
        return (self::SEVERITY[$candidate] ?? 0) > (self::SEVERITY[$current] ?? 0)
            ? $candidate
            : $current;
    }

    private function label(string $classification): string
    {
        return [
            self::CRITICAL          => 'Critical',
            self::AT_RISK           => 'At Risk',
            self::NEEDS_ATTENTION   => 'Needs Attention',
            self::ON_TRACK          => 'On Track',
            self::INSUFFICIENT_DATA => 'Insufficient Data',
        ][$classification] ?? $classification;
    }

    private function endDateSource(?DateTimeImmutable $original, ?DateTimeImmutable $extension): string
    {
        if ($original === null && $extension === null) {
            return 'none';
        }

        return ($extension !== null && ($original === null || $extension > $original))
            ? 'latest extension on record'
            : 'original end date';
    }

    private function describeSchedule(
        ?DateTimeImmutable $start,
        ?DateTimeImmutable $end,
        string $status,
        array $budget,
        array $releases
    ): string {
        return sprintf(
            'start = %s; end = %s; status = %s; budget years = %d; release rows with data = %d',
            $start?->format('Y-m-d') ?? 'not recorded',
            $end?->format('Y-m-d') ?? 'not recorded',
            $this->quote($status),
            $budget['years'],
            $releases['hasData'] ? $releases['rows'] : 0
        );
    }

    /** Free text is context only; truncated so the payload stays small. */
    private function trimForContext(string $value, int $limit = 600): string
    {
        $value = trim($value);
        if ($value === '') {
            return '';
        }

        return mb_strlen($value) > $limit
            ? mb_substr($value, 0, $limit) . '…'
            : $value;
    }

    private function quote($value): string
    {
        $value = trim((string) $value);

        return $value === '' ? '(empty)' : '"' . $value . '"';
    }

    private function uniqueActions(array $actions): array
    {
        return array_values(array_unique(array_filter(array_map('trim', $actions))));
    }
}