<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * archive_projects_tbl was missing columns that projects_tbl has, so archiving
 * silently dropped projectCode, programCode, projectLeader, projectAccomplishment,
 * bannerProgram, pillar, strategy, region, tagging and submissionTerminal.
 */
class SyncArchiveProjectsColumns extends Migration
{
    private array $fields = [
        'projectCode'          => ['type' => 'VARCHAR', 'constraint' => 200, 'null' => true],
        'programCode'          => ['type' => 'VARCHAR', 'constraint' => 200, 'null' => true],
        'projectLeader'        => ['type' => 'VARCHAR', 'constraint' => 200, 'null' => true],
        'projectAccomplishment' => ['type' => 'TEXT', 'null' => true],
        'bannerProgram'        => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
        'pillar'               => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
        'strategy'             => ['type' => 'TEXT', 'null' => true],
        'region'               => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
        'tagging'              => ['type' => 'TEXT', 'null' => true],
        'submissionTerminal'   => ['type' => 'VARCHAR', 'constraint' => 200, 'null' => true],
    ];

    private function archiveColumns(): array
    {
        $this->db->resetDataCache();

        return $this->db->getFieldNames('archive_projects_tbl');
    }

    public function up()
    {
        $existing = $this->archiveColumns();

        foreach ($this->fields as $column => $definition) {
            if (in_array($column, $existing, true)) {
                continue;
            }

            $this->forge->addColumn('archive_projects_tbl', [$column => $definition]);
        }
    }

    public function down()
    {
        $existing = $this->archiveColumns();

        foreach (array_keys($this->fields) as $column) {
            if (! in_array($column, $existing, true)) {
                continue;
            }

            $this->forge->dropColumn('archive_projects_tbl', $column);
        }
    }
}
