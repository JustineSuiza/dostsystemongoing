<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddLatestRealignmentToIndirectCostSummary extends Migration
{
    public function up()
    {
        $fields = [
            'latestRealignment' => [
                'type' => 'DECIMAL',
                'constraint' => '15,2',
                'default' => 0,
                'after' => 'totalObligation'
            ]
        ];
        $this->forge->addColumn('indirect_cost_summary_tbl', $fields);
    }

    public function down()
    {
        $this->forge->dropColumn('indirect_cost_summary_tbl', 'latestRealignment');
    }
}
