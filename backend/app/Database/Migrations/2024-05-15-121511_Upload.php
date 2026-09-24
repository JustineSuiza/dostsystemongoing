<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class Upload extends Migration
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
            'implementationFilename' => [
                'type' => 'VARCHAR',
                'constraint' => '200',
            ],
            'implementationFilepath' => [
                'type' => 'VARCHAR',
                'constraint' => '200',
            ],
            'extensionFilename' => [
                'type' => 'VARCHAR',
                'constraint' => '200',
            ],
            'extensionFilepath' => [
                'type' => 'VARCHAR',
                'constraint' => '200',
            ],
            'realignmentFilename' => [
                'type' => 'VARCHAR',
                'constraint' => '200',
            ],
            'realignmentFilepath' => [
                'type' => 'VARCHAR',
                'constraint' => '200',
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
        $this->forge->createTable('files_tbl');
    }

    public function down()
    {
        $this->forge->dropTable('files_tbl');
    }
}
