<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class ArchiveProposals extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'INT',
                'constraint' => 200,
                'auto_increment' => true
            ],
            'ISP' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'programTitle' => [
                'type' => 'TEXT',
                'constraint' => 9999,
            ],
            'projectTitle' => [
                'type' => 'TEXT',
                'constraint' => 9999,
            ],
            'responsiblePerson' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'implementingAgency' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'leadTRD' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'funding' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'quarter' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'date' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'remarks' => [
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
        $this->forge->createTable('archive_proposals_tbl', true);
    }

    public function down()
    {
        //
    }
}
