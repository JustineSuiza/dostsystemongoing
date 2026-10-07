<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddTaggingToProjects extends Migration
{
    private function projectColumns(): array
    {
        $this->db->resetDataCache();

        return $this->db->getFieldNames('projects_tbl');
    }

    public function up()
    {
        if (in_array('tagging', $this->projectColumns(), true)) {
            return;
        }

        $this->forge->addColumn('projects_tbl', [
            'tagging' => ['type' => 'TEXT', 'null' => true],
        ]);
    }

    public function down()
    {
        if (! in_array('tagging', $this->projectColumns(), true)) {
            return;
        }

        $this->forge->dropColumn('projects_tbl', 'tagging');
    }
}
