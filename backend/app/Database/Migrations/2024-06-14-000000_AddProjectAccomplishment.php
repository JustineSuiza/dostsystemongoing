<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddProjectAccomplishment extends Migration
{
    public function up()
    {
        $this->forge->addColumn('projects_tbl', [
            'projectAccomplishment' => [
                'type' => 'TEXT',
                'constraint' => 9999,
                'null' => true,
                'after' => 'remarks'
            ]
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('projects_tbl', 'projectAccomplishment');
    }
}
