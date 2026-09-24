<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateIndirectCostSummaryAndDisbursementVoucher extends Migration
{
    public function up()
    {
        // Indirect cost summary table
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'item' => [
                'type'       => 'VARCHAR',
                'constraint' => 500,
                'null'       => false,
            ],
            'totalReleases' => [
                'type'       => 'DECIMAL',
                'constraint' => '15,2',
                'default'    => 0,
            ],
            'totalObligation' => [
                'type'       => 'DECIMAL',
                'constraint' => '15,2',
                'default'    => 0,
            ],
            'runningBalance' => [
                'type'       => 'DECIMAL',
                'constraint' => '15,2',
                'default'    => 0,
            ],
            'forPayment' => [
                'type'       => 'DECIMAL',
                'constraint' => '15,2',
                'default'    => 0,
            ],
            'created_at' => [
                'type'       => 'VARCHAR',
                'constraint' => 200,
                'null'       => true,
                'default'    => null,
            ],
            'updated_at' => [
                'type'       => 'VARCHAR',
                'constraint' => 200,
                'null'       => true,
                'default'    => null,
            ],
            'deleted_at' => [
                'type'       => 'VARCHAR',
                'constraint' => 200,
                'null'       => true,
                'default'    => null,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('indirect_cost_summary_tbl', true);

        // Disbursement voucher table
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'indirect_cost_id' => [
                'type'       => 'INT',
                'constraint' => 11,
                'unsigned'   => true,
                'null'       => false,
            ],
            'project_id' => [
                'type'       => 'INT',
                'constraint' => 200,
                'null'       => true,
                'default'    => null,
            ],
            'dv_number' => [
                'type'       => 'VARCHAR',
                'constraint' => 200,
                'null'       => true,
                'default'    => null,
            ],
            'dv_date' => [
                'type'       => 'DATETIME',
                'null'       => true,
                'default'    => null,
            ],
            'reference_no' => [
                'type'       => 'VARCHAR',
                'constraint' => 200,
                'null'       => true,
                'default'    => null,
            ],
            'payee' => [
                'type'       => 'VARCHAR',
                'constraint' => 200,
                'null'       => true,
                'default'    => null,
            ],
            'item_description' => [
                'type' => 'TEXT',
                'null' => true,
                'default' => null,
            ],
            'amount' => [
                'type'       => 'DECIMAL',
                'constraint' => '15,2',
                'default'    => 0,
            ],
            'status' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'default'    => 'draft',
            ],
            'prepared_by' => [
                'type'       => 'VARCHAR',
                'constraint' => 200,
                'null'       => true,
                'default'    => null,
            ],
            'approved_by' => [
                'type'       => 'VARCHAR',
                'constraint' => 200,
                'null'       => true,
                'default'    => null,
            ],
            'created_at' => [
                'type'       => 'DATETIME',
                'null'       => true,
                'default'    => null,
            ],
            'updated_at' => [
                'type'       => 'DATETIME',
                'null'       => true,
                'default'    => null,
            ],
            'deleted_at' => [
                'type'       => 'DATETIME',
                'null'       => true,
                'default'    => null,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey('dv_number');
        $this->forge->addKey('project_id');
        $this->forge->addForeignKey('indirect_cost_id', 'indirect_cost_summary_tbl', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('project_id', 'projects_tbl', 'id', 'SET NULL', 'CASCADE');
        $this->forge->createTable('disbursement_voucher_tbl', true);
    }

    public function down()
    {
        $this->forge->dropTable('disbursement_voucher_tbl', true);
        $this->forge->dropTable('indirect_cost_summary_tbl', true);
    }
}
