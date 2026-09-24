<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddProjectColumns extends Migration
{
    public function up()
    {
        $fields = [
            'bannerProgram' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
            ],
            'pillar' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
            ],
            'strategy' => [
                'type' => 'TEXT',
                'null' => true,
            ],
        ];

        $this->forge->addColumn('projects_tbl', $fields);
    }

    public function down()
    {
        $this->forge->dropColumn('projects_tbl', ['bannerProgram', 'pillar', 'strategy']);
    }
}
