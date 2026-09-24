<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddRegionToProjects extends Migration
{
    public function up()
    {
        $fields = [
            'region' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
            ],
        ];

        $this->forge->addColumn('projects_tbl', $fields);
    }

    public function down()
    {
        $this->forge->dropColumn('projects_tbl', ['region']);
    }
}
