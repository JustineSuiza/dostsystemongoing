<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddBannerPillarStrategyColumns extends Migration
{
    public function up()
    {
        $this->db->query("ALTER TABLE `projects_tbl` ADD COLUMN `bannerProgram` VARCHAR(255) NULL AFTER `remarks`");
        $this->db->query("ALTER TABLE `projects_tbl` ADD COLUMN `pillar` VARCHAR(255) NULL AFTER `bannerProgram`");
        $this->db->query("ALTER TABLE `projects_tbl` ADD COLUMN `strategy` TEXT NULL AFTER `pillar`");
    }

    public function down()
    {
        $this->db->query("ALTER TABLE `projects_tbl` DROP COLUMN `bannerProgram`");
        $this->db->query("ALTER TABLE `projects_tbl` DROP COLUMN `pillar`");
        $this->db->query("ALTER TABLE `projects_tbl` DROP COLUMN `strategy`");
    }
}
