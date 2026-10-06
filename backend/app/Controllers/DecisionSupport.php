<?php

namespace App\Controllers;

use App\Libraries\DecisionSupport\DecisionRules;
use App\Models\BudgetModel;
use App\Models\ProjectModel;
use App\Models\ReleasesModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;

/**
 * Decision Support endpoints (read-only).
 *
 * Adds analysis on top of existing tables. Nothing is written, no schema
 * changes, and no existing endpoint behaviour is modified.
 *
 * GET DecisionSupport/summary      -> counts + projects needing attention
 * GET DecisionSupport/project/{id} -> full assessment for one project
 */
class DecisionSupport extends ResourceController
{
    use ResponseTrait;

    /** Upper bound on rows returned by the summary feed. */
    private const MAX_ATTENTION_ROWS = 100;

    /**
     * Dashboard feed: classification counts plus the projects a reviewer
     * should look at, ordered by severity then by how far past the end date.
     */
    public function summary()
    {
        [$rows, $assessments] = $this->loadAssessments();

        $attention = array_values(array_filter(
            $assessments,
            static fn (array $a) => in_array($a['classification'], [
                DecisionRules::CRITICAL,
                DecisionRules::AT_RISK,
                DecisionRules::NEEDS_ATTENTION,
                DecisionRules::INSUFFICIENT_DATA,
            ], true)
        ));

        usort($attention, static function (array $a, array $b): int {
            if ($a['severity'] !== $b['severity']) {
                return $b['severity'] <=> $a['severity'];
            }

            return ($b['evidence']['daysPastEndDate'] ?? -99999) <=> ($a['evidence']['daysPastEndDate'] ?? -99999);
        });

        $total = count($assessments);
        $shown = array_slice($attention, 0, self::MAX_ATTENTION_ROWS);

        $payload = array_map(static function (array $a): array {
            return [
                'id'          => $a['id'],
                'projectCode' => $a['projectCode'],
                'projectTitle' => $a['projectTitle'],
                'ISP'         => $a['ISP'],
                'classification' => $a['classification'],
                'label'       => $a['label'],
                'severity'    => $a['severity'],
                'reasons'     => array_map(static fn ($r) => [
                    'code'     => $r['code'],
                    'text'     => $r['text'],
                    'evidence' => $r['evidence'],
                ], $a['reasons']),
                'recommendedActions' => $a['recommendedActions'],
                'evidence'    => $a['evidence'],
                'dataCompleteness' => $a['dataCompleteness'],
            ];
        }, $shown);

        return $this->respond([
            'counts'    => $this->countBy($assessments),
            'total'     => $total,
            'attentionCount' => $total - $this->countBy($assessments)[DecisionRules::ON_TRACK],
            'returned'  => count($payload),
            'truncated' => count($attention) > count($payload),
            'projects'  => $payload,
            'evaluatedAt' => date('Y-m-d'),
            'disclaimer' => 'Rule-based indicators from recorded data only. These support human review and do not replace a DOST officer’s assessment.',
        ]);
    }

    /**
     * Full assessment for the Project Details page, including supporting
     * figures and the free-text context fields.
     */
    public function project($id = null)
    {
        $id = (int) $id;
        if ($id <= 0) {
            return $this->failValidationError(['id' => 'A valid project id is required.']);
        }

        [, $assessments] = $this->loadAssessments([$id]);

        if ($assessments === []) {
            return $this->failNotFound('Project not found.');
        }

        return $this->respond($assessments[0]);
    }

    /**
     * Loads projects with their budget and release rows in three queries
     * rather than N+1, then runs the rule engine over them.
     *
     * @param array<int,int>|null $ids
     * @return array{0:array,1:array}
     */
    private function loadAssessments(?array $ids = null): array
    {
        $projectModel = new ProjectModel();
        $budgetModel  = new BudgetModel();
        $releasesModel = new ReleasesModel();

        $projects = $ids === null
            ? $projectModel->findAll()
            : $projectModel->find($ids);

        if ($projects === []) {
            return [[], []];
        }

        $projectIds = array_map(static fn (array $p) => (int) $p['id'], $projects);

        $budgetsByProject = [];
        foreach ($budgetModel->whereIn('project_id', $projectIds)->findAll() as $row) {
            $budgetsByProject[(int) $row['project_id']][] = $row;
        }

        $releasesByProject = [];
        foreach ($releasesModel->whereIn('project_id', $projectIds)->findAll() as $row) {
            $releasesByProject[(int) $row['project_id']][] = $row;
        }

        $rules = new DecisionRules();
        $assessments = [];

        foreach ($projects as $project) {
            $pid = (int) $project['id'];
            $project['budgetRows']  = $budgetsByProject[$pid] ?? [];
            $project['releaseRows'] = $releasesByProject[$pid] ?? [];

            $assessment = $rules->assess($project);

            // Identity fields the UI needs, kept alongside the analysis.
            $assessment['id']            = $pid;
            $assessment['projectCode']   = $project['projectCode'] ?? '';
            $assessment['projectTitle']  = $project['projectTitle'] ?? '';
            $assessment['programTitle']  = $project['programTitle'] ?? '';
            $assessment['ISP']           = $project['ISP'] ?? '';
            $assessment['implementingAgency'] = $project['implementingAgency'] ?? '';

            $assessments[] = $assessment;
        }

        return [$projects, $assessments];
    }

    private function countBy(array $assessments): array
    {
        $counts = [
            DecisionRules::CRITICAL          => 0,
            DecisionRules::AT_RISK           => 0,
            DecisionRules::NEEDS_ATTENTION   => 0,
            DecisionRules::ON_TRACK          => 0,
            DecisionRules::INSUFFICIENT_DATA => 0,
        ];

        foreach ($assessments as $a) {
            $counts[$a['classification']] = ($counts[$a['classification']] ?? 0) + 1;
        }

        return $counts;
    }
}