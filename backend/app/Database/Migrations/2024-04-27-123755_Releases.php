<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class Releases extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'project_id' => [
                'type' => 'INT',
                'constraint' => 11,
            ],
            'programmedAmount' => [
                'type' => 'DECIMAL',
                'constraint' => '12,2',
            ],
            'regionIA' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ], 
            'particulars' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ], 
            'dvNo' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ], 
            'dateOfRelease' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ], 
            'month' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ], 
            'actualRelease' => [
                'type' => 'DECIMAL',
                'constraint' => '12,2',
            ], 
            'remarksReleases' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'statusReleases' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'created_at' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ], 
            'updated_at' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ], 
            'deleted_at' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],    
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('project_id', 'projects_tbl', 'id');
        $this->forge->createTable('releases_tbl');
    }

    public function down()
    {
        $this->forge->dropTable('releases_tbl');
    }
}
