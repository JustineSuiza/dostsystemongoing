<?php

namespace App\Models;

use CodeIgniter\Model;

class ArchiveSixPSModel extends Model
{
    protected $table            = 'archive_sixPS_tbl';
    protected $primaryKey       = 'id';
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['project_id', 'year', 'targetPublication', 'actualaccomplishmentPeer', 'actualaccomplishmentJournal', 'actualaccomplishmentPresented', 'details', 'actualaccomplishmentIEC', 'targetProduct', 'techName', 'techDescription', 'targetPatent', 'agency', 'techNamePro', 'statusSix', 'dost', 'patentNumber', 'targetPeople', 'namesBS', 'namesMS', 'namesPhD', 'targetPlaces', 'cooperators', 'international', 'privateSixPS', 'targetPolicy', 'policyRecommendation'];

    protected bool $allowEmptyInserts = false;

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';
}
