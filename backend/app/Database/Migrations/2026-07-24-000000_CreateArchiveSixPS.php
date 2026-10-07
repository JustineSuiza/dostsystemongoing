<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Projects::delete() removed sixPS_tbl rows without archiving them, so
 * archiving a project destroyed its sixPS records permanently. The table is
 * created lazily to match the other archive tables being created with $ifNotExists.
 */
class CreateArchiveSixPS extends Migration
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
            'year' => [
                'type' => 'INT',
                'constraint' => 4,
                'null' => true,
            ],
            'targetPublication' => ['type' => 'TEXT', 'null' => true],
            'actualaccomplishmentPeer' => ['type' => 'TEXT', 'null' => true],
            'actualaccomplishmentJournal' => ['type' => 'TEXT', 'null' => true],
            'actualaccomplishmentPresented' => ['type' => 'TEXT', 'null' => true],
            'details' => ['type' => 'TEXT', 'null' => true],
            'actualaccomplishmentIEC' => ['type' => 'TEXT', 'null' => true],
            'targetProduct' => ['type' => 'TEXT', 'null' => true],
            'techName' => ['type' => 'TEXT', 'null' => true],
            'techDescription' => ['type' => 'TEXT', 'null' => true],
            'targetPatent' => ['type' => 'TEXT', 'null' => true],
            'agency' => ['type' => 'TEXT', 'null' => true],
            'techNamePro' => ['type' => 'TEXT', 'null' => true],
            'statusSix' => ['type' => 'TEXT', 'null' => true],
            'dost' => ['type' => 'TEXT', 'null' => true],
            'patentNumber' => ['type' => 'TEXT', 'null' => true],
            'targetPeople' => ['type' => 'TEXT', 'null' => true],
            'namesBS' => ['type' => 'TEXT', 'null' => true],
            'namesMS' => ['type' => 'TEXT', 'null' => true],
            'namesPhD' => ['type' => 'TEXT', 'null' => true],
            'targetPlaces' => ['type' => 'TEXT', 'null' => true],
            'cooperators' => ['type' => 'TEXT', 'null' => true],
            'international' => ['type' => 'TEXT', 'null' => true],
            'privateSixPS' => ['type' => 'TEXT', 'null' => true],
            'targetPolicy' => ['type' => 'TEXT', 'null' => true],
            'policyRecommendation' => ['type' => 'TEXT', 'null' => true],
            'created_at' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
                'null' => true,
            ],
            'deleted_at' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('project_id', 'archive_projects_tbl', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('archive_sixPS_tbl', true);
    }

    public function down()
    {
        $this->forge->dropTable('archive_sixPS_tbl', true);
    }
}
