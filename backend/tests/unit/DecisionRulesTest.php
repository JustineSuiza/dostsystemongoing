<?php

use App\Libraries\DecisionSupport\DecisionRules;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * @internal
 */
final class DecisionRulesTest extends CIUnitTestCase
{
    private DecisionRules $rules;

    /** Fixed evaluation date so results never depend on the clock. */
    private \DateTimeImmutable $asOf;

    protected function setUp(): void
    {
        parent::setUp();
        $this->rules = new DecisionRules();
        $this->asOf  = new \DateTimeImmutable('2026-10-06');
    }

    public function testActiveProjectPastEndDateIsCritical(): void
    {
        $a = $this->rules->assess([
            'status'       => 'On-going',
            'originalStart' => '2018-01-01',
            'originalEnd'  => '2024-12-31',
        ], $this->asOf);

        $this->assertSame(DecisionRules::CRITICAL, $a['classification']);
        $this->assertSame('Critical', $a['label']);
    }

    public function testActiveProjectJustPastEndDateIsAtRiskNotCritical(): void
    {
        $a = $this->rules->assess([
            'status'       => 'Ongoing',
            'originalEnd'  => '2026-08-01', // ~2 months before asOf
        ], $this->asOf);

        $this->assertSame(DecisionRules::AT_RISK, $a['classification']);
    }

    public function testCriticalAndAtRiskAlwaysCarryARuleAndEvidence(): void
    {
        foreach ([['On-going', '2024-12-31'], ['Ongoing', '2026-08-01']] as [$status, $end]) {
            $a = $this->rules->assess(['status' => $status, 'originalEnd' => $end], $this->asOf);

            $this->assertContains($a['classification'], [DecisionRules::CRITICAL, DecisionRules::AT_RISK]);

            $nonEmpty = array_filter($a['reasons'], static fn ($r) => $r['text'] !== '' && $r['evidence'] !== '');
            $this->assertNotEmpty($nonEmpty, 'Every severity finding must carry text and evidence.');

            $this->assertNotEmpty($a['recommendedActions']);
            $this->assertArrayHasKey('code', $a['reasons'][0]);
        }
    }

    /**
     * The critical data-quality guard: a past end date with NO status is a
     * record gap, not proof of delay. It must never become Critical/At Risk.
     */
    public function testOverdueWithoutStatusIsNotTreatedAsFailure(): void
    {
        $a = $this->rules->assess([
            'status'      => '',
            'originalEnd' => '2015-05-31',
        ], $this->asOf);

        $this->assertSame(DecisionRules::NEEDS_ATTENTION, $a['classification']);

        $codes = array_column($a['reasons'], 'code');
        $this->assertContains('STATUS_UNVERIFIED', $codes);
        $this->assertNotContains('OVERDUE_ACTIVE', $codes);
        $this->assertNotContains('OVERDUE_BEYOND_EXTENSION', $codes);

        $this->assertStringContainsString('no project status is recorded', strtolower($a['reasons'][0]['text']));
    }

    public function testMissingEndDateIsInsufficientDataNotFailure(): void
    {
        $a = $this->rules->assess(['status' => 'On-going', 'originalEnd' => ''], $this->asOf);

        $this->assertSame(DecisionRules::INSUFFICIENT_DATA, $a['classification']);
        $this->assertContains('SCHEDULE_DATA_MISSING', array_column($a['reasons'], 'code'));
    }

    public function testActiveProjectWithinScheduleAndBudgetedIsOnTrack(): void
    {
        $a = $this->rules->assess([
            'status'       => 'On-going',
            'originalEnd'  => '2028-06-30',
            'budgetRows'   => [
                ['year' => '1', 'amount' => '1000000.00', 'totalBudget' => '1000000.00'],
            ],
        ], $this->asOf);

        $this->assertSame(DecisionRules::ON_TRACK, $a['classification']);
        $this->assertContains('NO_ISSUE_DETECTED', array_column($a['reasons'], 'code'));
    }

    public function testCompletedProjectIsNotFlaggedForOverdue(): void
    {
        $a = $this->rules->assess([
            'status'      => 'Completed',
            'originalEnd' => '2015-05-31',
        ], $this->asOf);

        $this->assertSame(DecisionRules::ON_TRACK, $a['classification']);
        $this->assertContains('PROJECT_CLOSED', array_column($a['reasons'], 'code'));
    }

    /**
     * A later approved extension supersedes the original end date, so an
     * active project inside that window must not be Critical.
     */
    public function testLaterExtensionSupersedesOriginalEndDate(): void
    {
        $a = $this->rules->assess([
            'status'        => 'On-going',
            'originalEnd'   => '2020-03-31',
            'firstExtension' => '2020-04-01 - 2026-12-31',
        ], $this->asOf);

        $this->assertSame(DecisionRules::NEEDS_ATTENTION, $a['classification']);
        $this->assertSame('2026-12-31', $a['evidence']['operativeEndDate']);
        $this->assertSame('latest extension on record', $a['evidence']['operativeEndSource']);
    }

    public function testExtensionRangeTakesLaterDateNotEarlier(): void
    {
        $a = $this->rules->assess([
            'status'         => 'New',
            'originalStart'  => '2016-04-01',
            'firstExtension' => '2018-04-01 - 2018-06-30',
        ], $this->asOf);

        $this->assertSame('2018-06-30', $a['evidence']['operativeEndDate']);
    }

    /** Prose format actually present in the database. */
    public function testProseExtensionWithTwoExtensionsIsCounted(): void
    {
        $a = $this->rules->assess([
            'status'         => 'On-going',
            'originalEnd'    => '2016-06-30',
            'firstExtension' => '1st Extension: July 01, 2016 - September 30, 2016  2nd Extension: October 01, 2016 - December 31, 2016',
        ], $this->asOf);

        $this->assertSame('2016-12-31', $a['evidence']['operativeEndDate']);
        $this->assertSame(2, $a['evidence']['extensionRecords']);
        $this->assertContains('REPEATED_EXTENSION', array_column($a['reasons'], 'code'));
    }

    public function testUnparseableDateYieldsInsufficientData(): void
    {
        $a = $this->rules->assess([
            'status'      => 'On-going',
            'originalEnd' => 'not a date',
        ], $this->asOf);

        $this->assertSame(DecisionRules::INSUFFICIENT_DATA, $a['classification']);
        $this->assertFalse($a['dataCompleteness']['complete']);
    }

    /** Releases are unpopulated in this database; the rule must not fire. */
    public function testLowUtilizationRuleSkippedWhenNoReleaseData(): void
    {
        $a = $this->rules->assess([
            'status'      => 'On-going',
            'originalEnd' => '2028-06-30',
            'budgetRows'  => [['year' => '1', 'amount' => '1000000', 'totalBudget' => '1000000']],
            'releaseRows' => [['programmedAmount' => null, 'actualRelease' => null]],
        ], $this->asOf);

        $this->assertNotContains('LOW_FUND_UTILIZATION', array_column($a['reasons'], 'code'));
        $this->assertSame(DecisionRules::ON_TRACK, $a['classification']);
    }

    public function testLowUtilizationFiresWhenRealReleaseFiguresExist(): void
    {
        $a = $this->rules->assess([
            'status'      => 'On-going',
            'originalEnd' => '2028-06-30',
            'budgetRows'  => [['year' => '1', 'amount' => '1000000', 'totalBudget' => '1000000']],
            'releaseRows' => [['programmedAmount' => '1000000', 'actualRelease' => '200000']],
        ], $this->asOf);

        $this->assertContains('LOW_FUND_UTILIZATION', array_column($a['reasons'], 'code'));
        $this->assertSame(DecisionRules::NEEDS_ATTENTION, $a['classification']);
    }

    /** totalBudget repeats on every per-year row and must not be summed. */
    public function testTotalBudgetIsNotSummedAcrossYears(): void
    {
        $a = $this->rules->assess([
            'status'     => 'New',
            'originalEnd' => '2028-06-30',
            'budgetRows' => [
                ['year' => '1', 'amount' => '1807780', 'totalBudget' => '1807780'],
                ['year' => '2', 'amount' => '765727',  'totalBudget' => '1807780'],
                ['year' => '3', 'amount' => '1163496', 'totalBudget' => '1807780'],
            ],
        ], $this->asOf);

        $this->assertEqualsWithDelta(1807780.0, $a['evidence']['totalProgrammedBudget'], 0.01);
    }

    public function testOngoingProjectWithoutBudgetRecordsIsFlaggedAsDataGap(): void
    {
        $a = $this->rules->assess([
            'status'      => 'Ongoing',
            'originalEnd' => '2028-06-30',
            'budgetRows'  => [],
        ], $this->asOf);

        $this->assertContains('BUDGET_DATA_MISSING', array_column($a['reasons'], 'code'));
        $this->assertSame(DecisionRules::NEEDS_ATTENTION, $a['classification']);
    }

    public function testUnrecognizedStatusIsAGapNotAnAssumption(): void
    {
        $a = $this->rules->assess([
            'status'      => 'Pending Review',
            'originalEnd' => '2024-01-01',
        ], $this->asOf);

        $this->assertContains('STATUS_UNRECOGNIZED', array_column($a['reasons'], 'code'));
        $this->assertSame(DecisionRules::INSUFFICIENT_DATA, $a['classification']);
    }

    public function testFreeTextIsContextOnlyAndNeverParsedAsCompletion(): void
    {
        $a = $this->rules->assess([
            'status'       => 'On-going',
            'originalEnd'  => '2028-06-30',
            'deliverables' => 'All deliverables completed and turned over.',
            'beneficiaries' => 'Beneficiaries reached.',
            'budgetRows'   => [['year' => '1', 'amount' => '1000000', 'totalBudget' => '1000000']],
        ], $this->asOf);

        // Positive-sounding free text must not change any classification.
        $this->assertSame(DecisionRules::ON_TRACK, $a['classification']);
        $this->assertStringContainsString('completed', $a['freeTextContext']['deliverables']);
    }

    public function testResultNeverAssertsCompletionPercentage(): void
    {
        $a = $this->rules->assess([
            'status'       => 'On-going',
            'originalEnd'  => '2024-01-01',
            'deliverables' => 'done',
        ], $this->asOf);

        $this->assertStringNotContainsStringIgnoringCase('percent', json_encode($a));
        $this->assertStringNotContainsStringIgnoringCase('%', json_encode($a['reasons']));
    }

    public function testEveryAssessmentCarriesADisclaimerAndAction(): void
    {
        $cases = [
            ['status' => 'On-going', 'originalEnd' => '2024-01-01'],
            ['status' => '', 'originalEnd' => '2015-05-31'],
            ['status' => 'Completed', 'originalEnd' => '2015-05-31'],
            ['status' => 'New'],
        ];

        foreach ($cases as $case) {
            $a = $this->rules->assess($case, $this->asOf);
            $this->assertNotEmpty($a['recommendedActions']);
            $this->assertStringContainsString('Not an automated decision', $a['disclaimer']);
            $this->assertArrayHasKey('dataCompleteness', $a);
            $this->assertArrayHasKey('evidence', $a);
        }
    }

    public function testAssessIsDeterministic(): void
    {
        $project = ['status' => 'On-going', 'originalEnd' => '2024-01-01', 'budgetRows' => []];

        $this->assertSame(
            json_encode($this->rules->assess($project, $this->asOf)),
            json_encode($this->rules->assess($project, $this->asOf))
        );
    }
}