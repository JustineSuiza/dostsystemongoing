<?php

namespace App\Models;

use CodeIgniter\Model;

class SixPSModel extends Model
{
    protected $table            = 'sixPS_tbl';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['project_id', 'year', 'targetPublication', 'actualaccomplishmentPeer', 'actualaccomplishmentJournal', 'actualaccomplishmentPresented', 'details', 'actualaccomplishmentIEC', 'targetProduct', 'techName', 'techDescription', 'targetPatent', 'agency', 'techNamePro', 'statusSix', 'dost', 'patentNumber', 'targetPeople', 'namesBS', 'namesMS', 'namesPhD', 'targetPlaces', 'cooperators', 'international', 'privateSixPS', 'targetPolicy', 'policyRecommendation'];

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
}
