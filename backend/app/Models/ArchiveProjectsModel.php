<?php

namespace App\Models;

use CodeIgniter\Model;

class ArchiveProjectsModel extends Model
{
    protected $table            = 'archive_projects_tbl';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['ISP', 'programTitle', 'projectTitle', 'responsiblePerson', 'funding', 'implementingAgency', 'programLeader', 'emailAddress', 'contactNumber', 'postalAddress', 'cooperatingAgency', 'originalStart', 'originalEnd', 'changeStart', 'changeImplementationDate', 'firstExtension', 'secondExtension', 'objectives', 'description', 'deliverables', 'beneficiaries', 'status', 'remarks', 'dcY1Approval', 'gcY1Approval', 'execomY1Approval', 'dcY2Renewal', 'gcY2Renewal', 'execomY2Renewal', 'dcY3Renewal', 'gcY3Renewal', 'execomY3Renewal', 'inceptionMeeting', 'mande', 'y1BudgetRealignment', 'y2BudgetRealignment', 'y3BudgetRealignment', 'programReview', 'terminalReview'];

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

    public function budgetData()
    {
        return $this->hasMany('App\Models\ArchiveBudgetModel', 'project_id');
    }

    public function releaseData()
    {
        return $this->hasMany('App\Models\ArchiveReleasesModel', 'project_id');
    }

    public function counterpartFundData()
    {
        return $this->hasMany('App\Models\ArchiveCounterpartFundModel', 'project_id');
    }
}
