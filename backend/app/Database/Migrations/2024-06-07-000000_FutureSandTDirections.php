<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class FutureSandTDirections extends Migration
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
            'industrySituation' => [
                'type' => 'TEXT',
            ],
            'goals' => [
                'type' => 'TEXT',
            ],
            'bannerProgram' => [
                'type' => 'VARCHAR',
                'constraint' => '255',
            ],
            'programProject' => [
                'type' => 'TEXT',
            ],
            'year' => [
                'type' => 'INT',
                'constraint' => 4,
            ],
            'budget' => [
                'type' => 'VARCHAR',
                'constraint' => '255',
            ],
            'pillar' => [
                'type' => 'VARCHAR',
                'constraint' => '255',
            ],
            'strategy' => [
                'type' => 'TEXT',
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'deleted_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->createTable('future_sandt_directions_tbl');
    }

    public function down()
    {
        $this->forge->dropTable('future_sandt_directions_tbl');
    }
}
