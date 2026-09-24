<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class User extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'INT',
                'constraint' => 11,
                'auto_increment' => true,
            ],
            // 'username' => [
            //     'type' => 'VARCHAR',
            //     'constraint' => 200,
            // ],
            'first_name' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'last_name' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'password' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'email' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'user_lvl' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'reset_token' => [
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
        $this->forge->createTable('user');
    }

    public function down()
    {
        //
    }
}
