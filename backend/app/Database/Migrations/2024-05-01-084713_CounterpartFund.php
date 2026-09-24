<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CounterpartFund extends Migration
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
            ],
            'amount' => [
                'type' => 'DECIMAL',
                'constraint' => '12,2',
            ],
            'totalFund' => [
                'type' => 'DECIMAL',
                'constraint' => '12,2',
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
        $this->forge->createTable('counterpartFund_tbl');
    }

    public function down()
    {
        $this->forge->dropTable('counterpartFund_tbl');
    }
}
