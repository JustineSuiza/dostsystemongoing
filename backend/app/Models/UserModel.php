<?php

namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table            = 'user';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['first_name', 
                                    'last_name', 
                                    // 'username', 
                                    'password', 
                                    'email', 
                                    'reset_token', 
                                    'user_lvl'];

    protected bool $allowEmptyInserts = false;

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    // Validation
    protected $validationRules      = [];
    protected $validationMessages   = [];
    protected $skipValidation       = false;
    protected $cleanValidationRules = true;

    // Callbacks
    protected $allowCallbacks = true;
    protected $beforeInsert   = [];
    protected $afterInsert    = [];
    protected $beforeUpdate   = [];
    protected $afterUpdate    = [];
    protected $beforeFind     = [];
    protected $afterFind      = [];
    protected $beforeDelete   = [];
    protected $afterDelete    = [];

    public function updatePassword($email, $hashedPassword)
{
    $this->db->set('password', $hashedPassword);
    $this->db->where('email', $email);
    $this->db->update('user');
}

public function clearResetToken($email)
{
    $this->db->set('reset_token', null);
    $this->db->where('email', $email);
    $this->db->update('user');
}

public function getResetTokenByEmail($email)
{
    $user = $this->where('email', $email)->first();
    
    if ($user) {
        return $user['reset_token'];
    }
    
    return null;
}

public function updateResetToken($email, $resetToken)
{
    $this->db->set('reset_token', $resetToken);
    $this->db->where('email', $email);
    $this->db->update('user');
}

}
