<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class ArchiveProjects extends Migration
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
            'funding' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'implementingAgency' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'programLeader' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'emailAddress' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'contactNumber' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'postalAddress' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'cooperatingAgency' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'originalStart' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'originalEnd' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'changeStart' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'changeImplementationDate' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'firstExtension' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'secondExtension' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'objectives' => [
                'type' => 'TEXT',
                'constraint' => 9999,
            ],
            'description' => [
                'type' => 'TEXT',
                'constraint' => 9999,
            ],
            'deliverables' => [
                'type' => 'TEXT',
                'constraint' => 9999,
            ],
            'beneficiaries' => [
                'type' => 'TEXT',
                'constraint' => 9999,
            ],
            'status' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'remarks' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'dcY1Approval' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'gcY1Approval' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'execomY1Approval' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'dcY2Renewal' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'gcY2Renewal' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'execomY2Renewal' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'dcY3Renewal' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'gcY3Renewal' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'execomY3Renewal' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'inceptionMeeting' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'mande' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'y1BudgetRealignment' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'y2BudgetRealignment' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'y3BudgetRealignment' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'programReview' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'terminalReview' => [
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
        $this->forge->createTable('archive_projects_tbl');
    }

    public function down()
    {
        $this->forge->dropTable('archive_projects_tbl');
    }
}
