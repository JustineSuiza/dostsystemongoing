<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class SixPS extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id'    => [
                'type'          => 'INT',
                'constraint'    => 11,
                'auto_increment'    => True
            ],
            'project_id' => [
                'type' => 'INT',
                'constraint' => 11,
            ],
            'year' => [
                'type' => 'INT',
                'constraint' => 4,
            ],
            'targetPublication'    => [
                'type'          => 'TEXT',
                'constraint'    => 1000
            ],
            'actualaccomplishmentPeer'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999,                
            ],
            'actualaccomplishmentJournal'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999,                
            ],
            'actualaccomplishmentPresented'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999,                
            ],
            'details'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999,                
            ],
            'actualaccomplishmentIEC'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999,                
            ],
            'targetProduct'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
            ],
            'techName'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
            ],
            'techDescription'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
            ],
            'targetPatent'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
            ],
            'agency'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
            ],
            'techNamePro'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
            ],
            'statusSix'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
            ],
            'dost'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
            ],
            'patentNumber'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
            ],
            'targetPeople'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
            ],
            'namesBS'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
            ],
            'namesMS'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
            ],
            'namesPhD'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
            ],
            'targetPlaces'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
            ],
            'cooperators'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
            ],
            'international'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
            ],
            'privateSixPS'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
            ],
            'targetPolicy'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
            ],
            'policyRecommendation'    => [
                'type'          => 'TEXT',
                'constraint'    => 9999
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
        $this->forge->createTable('sixPS_tbl', true);
    }

    public function down()
    {
        $this->forge->dropTable('sixPS_tbl');
    }
}
