<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;
use App\Models\ProjectModel;
use App\Models\BudgetModel;
use App\Models\ReleasesModel;
use App\Models\CounterpartFundModel;
use App\Models\SixPSModel;
use App\Models\UploadModel;
use App\Models\ArchiveProjectsModel;
use App\Models\ArchiveBudgetModel;
use App\Models\ArchiveReleasesModel;
use App\Models\ArchiveCounterpartFundModel;

class Projects extends ResourceController
{
    /**
     * Return an array of resource objects, themselves in array format
     *
     * @return ResponseInterface
     */
    public function index()
    {
        $model = new ProjectModel();
        $data = $model->findAll();

        // Fetch totalBudget and yearly breakdown for each project
        $budgetModel = new BudgetModel();
        $releasesModel = new ReleasesModel(); 
        $counterpartFundModel = new CounterpartFundModel(); 
        $sixPSModel = new SixPSModel(); 
        $fileModel = new UploadModel(); 

        foreach ($data as &$project) {
            // Fetch totalBudget data
            $totalBudgetData = $budgetModel->where('project_id', $project['id'])->first();
            $project['totalBudget'] = $totalBudgetData ? number_format($totalBudgetData['totalBudget'], 2) : null;
        
            // Fetch yearly breakdown data
            $yearlyBreakdownData = $budgetModel->where('project_id', $project['id'])->findAll();
            $yearlyBreakdown = [];
            $budgetArrayData = [];
            foreach ($yearlyBreakdownData as $item) {
                $yearlyBreakdown[$item['year']] = number_format($item['amount'], 2);
                $budgetArrayData[] = [
                    'year' => (int) $item['year'],
                    'amount' => (float) $item['amount'],
                ];
            }
            $project['budget'] = $yearlyBreakdown ? $yearlyBreakdown : null;
            $project['budgetArray'] = !empty($budgetArrayData) ? $budgetArrayData : [];

            // Fetch totalFund data
            $counterpartFundData = $counterpartFundModel->where('project_id', $project['id'])->first();
            if ($counterpartFundData) {
                $counterpartFundData['totalFund'] = isset($counterpartFundData['totalFund']) ? number_format($counterpartFundData['totalFund'], 2) : null;
                $project['counterpartFundData'] = $counterpartFundData;
        
                // Fetch yearly breakdown data
                $yearlyBreakdownData = $counterpartFundModel->where('project_id', $project['id'])->findAll();
                $yearlyBreakdown = [];
                foreach ($yearlyBreakdownData as $item) {
                    $yearlyBreakdown[$item['year']] = number_format($item['amount'], 2);
                }
                $project['counterFund'] = $yearlyBreakdown ? $yearlyBreakdown : null;
            } else {
                $project['counterpartFundData'] = null;
            }
        
            // Fetch release data for the project
            $releaseData = $releasesModel->where('project_id', $project['id'])->first();
            if ($releaseData) {
                // Format programmedAmount if it exists
                
                $project['releaseData'] = $releaseData;
            } else {
                $project['releaseData'] = null;
            }

            // Fetch 6Ps data for the project
            // $sixPSData = $sixPSModel->where('project_id', $project['id'])->first();
            // if ($sixPSData) {
            //     $project['sixPSData'] = $sixPSData;
            // } else {
            //     $project['sixPSData'] = null;
            // }

            // Retrieve main project data
            $sixPSData = $sixPSModel->where('project_id', $project['id'])->first();

            if ($sixPSData) {
                $project['sixPSData'] = $sixPSData;
                
                // Fetch yearly breakdown data
                $yearlyBreakdownData = $sixPSModel->where('project_id', $project['id'])->findAll();
                $yearlyBreakdown = [];

                foreach ($yearlyBreakdownData as $item) {
                    $yearlyBreakdown[$item['year']] = [
                        'year' => $item['year'],
                        'targetPublication' => $item['targetPublication'],
                        'actualaccomplishmentPeer' => $item['actualaccomplishmentPeer'],
                        'actualaccomplishmentJournal' => $item['actualaccomplishmentJournal'],
                        'actualaccomplishmentPresented' => $item['actualaccomplishmentPresented'],
                        'details' => $item['details'],
                        'actualaccomplishmentIEC' => $item['actualaccomplishmentIEC'],
                        'targetProduct' => $item['targetProduct'],
                        'techName' => $item['techName'],
                        'techDescription' => $item['techDescription'],
                        'targetPatent' => $item['targetPatent'],
                        'agency' => $item['agency'],
                        'techNamePro' => $item['techNamePro'],
                        'statusSix' => $item['statusSix'],
                        'dost' => $item['dost'],
                        'patentNumber' => $item['patentNumber'],
                        'targetPeople' => $item['targetPeople'],
                        'namesBS' => $item['namesBS'],
                        'namesMS' => $item['namesMS'],
                        'namesPhD' => $item['namesPhD'],
                        'targetPlaces' => $item['targetPlaces'],
                        'cooperators' => $item['cooperators'],
                        'international' => $item['international'],
                        'privateSixPS' => $item['privateSixPS'],
                        'targetPolicy' => $item['targetPolicy'],
                        'policyRecommendation' => $item['policyRecommendation']
                    ];
                }

                $project['sixPs'] = $yearlyBreakdown ? $yearlyBreakdown : null;
            } else {
                $project['sixPSData'] = null;
            }


            $fileData = $fileModel->where('project_id', $project['id'])->first();
            if ($fileData) {
                $project['fileData'] = $fileData;
            } else {
                $project['fileData'] = null;
            }
        }
        

        return $this->respond($data);
    }


    /**
     * Return the properties of a resource object
     *
     * @return ResponseInterface
     */
    public function show($id = null)
    {
        // $model = new ProjectModel();
        // $data = $model->find(['id' => $id]);
        // if(!$data) return $this->failNotFound('No Data Found');
        // return $this->respond($data[0]);
        $model = new ProjectModel();
        $data = $model->find(['id' => $id]);

        if (!$data) {
            return $this->failNotFound('No Data Found');
        }

        // Fetch totalBudget for this project
        $budgetModel = new BudgetModel();
        $releasesModel = new ReleasesModel(); 
        $counterpartFundModel = new CounterpartFundModel(); 
        $sixPSModel = new SixPSModel(); 

        foreach ($data as &$project) {
            // Fetch totalBudget data
            $totalBudgetData = $budgetModel->where('project_id', $project['id'])->first();
            $project['totalBudget'] = $totalBudgetData ? number_format($totalBudgetData['totalBudget'], 2) : null;
        
            // Fetch yearly breakdown data
            $yearlyBreakdownData = $budgetModel->where('project_id', $project['id'])->findAll();
            $yearlyBreakdown = [];
            foreach ($yearlyBreakdownData as $item) {
                $yearlyBreakdown[$item['year']] = number_format($item['amount'], 2);
            }
            $project['budget'] = $yearlyBreakdown ? $yearlyBreakdown : null;

            // Fetch totalFund data
            $yearlyBreakdownData = $counterpartFundModel->where('project_id', $project['id'])->findAll();
            $yearlyBreakdown = [];
            foreach ($yearlyBreakdownData as $item) {
                $yearlyBreakdown[$item['year']] = number_format($item['amount'], 2);
            }
            $project['counterFund'] = $yearlyBreakdown ? $yearlyBreakdown : null;

            $yearlyBreakdownData = $sixPSModel->where('project_id', $project['id'])->findAll();
            $yearlyBreakdown = [];
            foreach ($yearlyBreakdownData as $item) {
                $yearlyBreakdown[$item['year']] = [
                    'targetPublication' => $item['targetPublication'],
                    'actualaccomplishmentPeer' => $item['actualaccomplishmentPeer'],
                    'actualaccomplishmentJournal' => $item['actualaccomplishmentJournal'],
                    'actualaccomplishmentPresented' => $item['actualaccomplishmentPresented'],
                    'details' => $item['details'],
                    'actualaccomplishmentIEC' => $item['actualaccomplishmentIEC'],
                    'targetProduct' => $item['targetProduct'],
                    'techName' => $item['techName'],
                    'techDescription' => $item['techDescription'],
                    'targetPatent' => $item['targetPatent'],
                    'agency' => $item['agency'],
                    'techNamePro' => $item['techNamePro'],
                    'statusSix' => $item['statusSix'],
                    'dost' => $item['dost'],
                    'patentNumber' => $item['patentNumber'],
                    'targetPeople' => $item['targetPeople'],
                    'namesBS' => $item['namesBS'],
                    'namesMS' => $item['namesMS'],
                    'namesPhD' => $item['namesPhD'],
                    'targetPlaces' => $item['targetPlaces'],
                    'cooperators' => $item['cooperators'],
                    'international' => $item['international'],
                    'privateSixPS' => $item['privateSixPS'],
                    'targetPolicy' => $item['targetPolicy'],
                    'policyRecommendation' => $item['policyRecommendation']
                ];
            }
            $project['sixPs'] = $yearlyBreakdown ? $yearlyBreakdown : null;
        
            // Fetch release data for the project
            // $releaseData = $releasesModel->where('project_id', $project['id'])->first();
            // if ($releaseData) {
            //     // Format programmedAmount if it exists
                
            //     $project['releaseData'] = $releaseData;
            // } else {
            //     $project['releaseData'] = null;
            // }
        }

        return $this->respond($data);
    }

    /**
     * Return a new resource object, with default properties
     *
     * @return ResponseInterface
     */
    public function new()
    {
        //
    }

    /**
     * Create a new resource object, from "posted" parameters
     *
     * @return ResponseInterface
     */
    public function create()
    {
        helper(['form']);
        $rules = [
            'projectCode' => '',
            'programCode' => '',
            'ISP' => '', 
            'programTitle' => '', 
            'projectTitle' => '', 
            'responsiblePerson' => '', 
            'funding' => '', 
            'implementingAgency' => '', 
            'programLeader' => '', 
            'projectLeader' => '', 
            'emailAddress' => '', 
            'contactNumber' => '', 
            'postalAddress' => '', 
            'cooperatingAgency' => '', 
            'originalStart' => '', 
            'originalEnd' => '', 
            // 'changeStart' => '', 
            // 'changeImplementationDate' => '', 
            // 'firstExtension' => '', 
            // 'secondExtension' => '', 
            'objectives' => '', 
            'description' => '', 
            'deliverables' => '', 
            'beneficiaries' => '', 
            'status' => '', 
            'remarks' => '', 
            'tagging' => '', 
        ];
        $projectData = [
            'projectCode' => $this->request->getVar('projectCode'),
            'programCode' => $this->request->getVar('programCode'),
            'ISP' => $this->request->getVar('ISP'),
            'programTitle' => $this->request->getVar('programTitle'),
            'projectTitle' => $this->request->getVar('projectTitle'),
            'responsiblePerson' => $this->request->getVar('responsiblePerson'),
            'funding' => $this->request->getVar('funding'),
            'implementingAgency' => $this->request->getVar('implementingAgency'),
            'programLeader' => $this->request->getVar('programLeader'),
            'projectLeader' => $this->request->getVar('projectLeader'),
            'emailAddress' => $this->request->getVar('emailAddress'),
            'contactNumber' => $this->request->getVar('contactNumber'),
            'postalAddress' => $this->request->getVar('postalAddress'),
            'cooperatingAgency' => $this->request->getVar('cooperatingAgency'),
            'originalStart' => $this->request->getVar('originalStart'),
            'originalEnd' => $this->request->getVar('originalEnd'),
            // 'changeStart' => $this->request->getVar('changeStart'),
            // 'changeImplementationDate' => $this->request->getVar('changeImplementationDate'),
            // 'firstExtension' => $this->request->getVar('firstExtension'),
            // 'secondExtension' => $this->request->getVar('secondExtension'),
            'objectives' => $this->request->getVar('objectives'),
            'description' => $this->request->getVar('description'),
            'deliverables' => $this->request->getVar('deliverables'),
            'beneficiaries' => $this->request->getVar('beneficiaries'),
            'status' => $this->request->getVar('status'),
            'remarks' => $this->request->getVar('remarks'),
            'tagging' => $this->request->getVar('tagging'),
            'created_by' => $this->request->getVar('created_by'),
        ];

        // if(!$this->validate($rules)) {
        //     return $this->fail($this->validator->getErrors());
        // }
        
        $model = new ProjectModel();
        $model->save($projectData);
        $projectId = $model->insertID();

        $releaseData = [
            'project_id' => $projectId,
        ];

        $Rmodel = new ReleasesModel();
        $Rmodel->save($releaseData);

        $counterFundData = $this->request->getVar('budget');

        $Cmodel = new CounterpartFundModel();
        foreach ($counterFundData as $index => $counterItem) {
            $year = $counterItem->year;
            
            $Cmodel->save([
                'project_id' => $projectId,
                'year' => $year,
            ]);
        }

        $sixPSData = $this->request->getVar('budget');
        $Smodel = new SixPSModel();

        foreach ($sixPSData as $index => $sixPSItem) {
            $year = $sixPSItem->year;
            // $amount = $budgetItem->amount;
            
            $Smodel->save([
                'project_id' => $projectId,
                // 'totalBudget' => $totalBudget,
                'year' => $year,
                // 'amount' => $amount
            ]);
        }

        // $totalBudget = $this->request->getVar('totalBudget');
        $budgetData = $this->request->getVar('budget');
        $budgetModel = new BudgetModel();

        foreach ($budgetData as $index => $budgetItem) {
            $year = $budgetItem->year;
            // $amount = $budgetItem->amount;
            
            $budgetModel->save([
                'project_id' => $projectId,
                // 'totalBudget' => $totalBudget,
                'year' => $year,
                // 'amount' => $amount
            ]);
        }

        $fileData = [
            'project_id' => $projectId,
        ];

        $Fmodel = new UploadModel();
        $Fmodel->save($fileData);

        $response = [
            'status' => 201,
            'error' => null,
            'messages' => [
                'success' => 'Data Inserted'
            ]
        ];
        return $this->respondCreated($response);
    }


    /**
     * Return the editable properties of a resource object
     *
     * @return ResponseInterface
     */
    public function edit($id = null)
    {
        //
    }

    /**
     * Add or update a model resource, from "posted" properties
     *
     * @return ResponseInterface
     */
    public function update($id = null)
    {
        helper(['form']);
        $rules = [
            'projectCode' => '',
            'programCode' => '',
            'ISP' => '', 
            'programTitle' => '', 
            'projectTitle' => '', 
            'responsiblePerson' => '', 
            'funding' => '', 
            'implementingAgency' => '', 
            'programLeader' => '', 
            'projectLeader' => '', 
            'emailAddress' => '', 
            'contactNumber' => '', 
            'postalAddress' => '', 
            'cooperatingAgency' => '', 
            'originalStart' => '', 
            'originalEnd' => '', 
            'changeStart' => '', 
            'changeImplementationDate' => '', 
            'firstExtension' => '', 
            'secondExtension' => '', 
            'objectives' => '', 
            'description' => '', 
            'deliverables' => '', 
            'beneficiaries' => '', 
            'dcY1Approval' => '',
            'gcY1Approval' => '',
            'execomY1Approval' => '',
            'dcY2Renewal' => '',
            'gcY2Renewal' => '',
            'execomY2Renewal' => '',
            'dcY3Renewal' => '',
            'gcY3Renewal' => '',
            'execomY3Renewal' => '',
            'inceptionMeeting' => '',
            'mande' => '',
            'y1BudgetRealignment' => '',
            'y2BudgetRealignment' => '',
            'y3BudgetRealignment' => '',
            'programReview' => '',
            'terminalReview' => '',
            'status' => '', 
            'remarks' => '', 
            'tagging' => '', 
        ];

        $data = [
            'projectCode' => $this->request->getVar('projectCode'),
            'programCode' => $this->request->getVar('programCode'),
            'ISP' => $this->request->getVar('ISP'),
            'programTitle' => $this->request->getVar('programTitle'),
            'projectTitle' => $this->request->getVar('projectTitle'),
            'responsiblePerson' => $this->request->getVar('responsiblePerson'),
            'funding' => $this->request->getVar('funding'),
            'implementingAgency' => $this->request->getVar('implementingAgency'),
            'programLeader' => $this->request->getVar('programLeader'),
            'projectLeader' => $this->request->getVar('projectLeader'),
            'emailAddress' => $this->request->getVar('emailAddress'),
            'contactNumber' => $this->request->getVar('contactNumber'),
            'postalAddress' => $this->request->getVar('postalAddress'),
            'cooperatingAgency' => $this->request->getVar('cooperatingAgency'),
            'originalStart' => $this->request->getVar('originalStart'),
            'originalEnd' => $this->request->getVar('originalEnd'),
            'changeStart' => $this->request->getVar('changeStart'),
            'changeImplementationDate' => $this->request->getVar('changeImplementationDate'),
            'firstExtension' => $this->request->getVar('firstExtension'),
            'secondExtension' => $this->request->getVar('secondExtension'),
            'objectives' => $this->request->getVar('objectives'),
            'description' => $this->request->getVar('description'),
            'deliverables' => $this->request->getVar('deliverables'),
            'beneficiaries' => $this->request->getVar('beneficiaries'),
            'dcY1Approval' => $this->request->getVar('dcY1Approval'),
            'gcY1Approval' => $this->request->getVar('gcY1Approval'),
            'execomY1Approval' => $this->request->getVar('execomY1Approval'),
            'dcY2Renewal' => $this->request->getVar('dcY2Renewal'),
            'gcY2Renewal' => $this->request->getVar('gcY2Renewal'),
            'execomY2Renewal' => $this->request->getVar('execomY2Renewal'),
            'dcY3Renewal' => $this->request->getVar('dcY3Renewal'),
            'gcY3Renewal' => $this->request->getVar('gcY3Renewal'),
            'execomY3Renewal' => $this->request->getVar('execomY3Renewal'),
            'inceptionMeeting' => $this->request->getVar('inceptionMeeting'),
            'mande' => $this->request->getVar('mande'),
            'y1BudgetRealignment' => $this->request->getVar('y1BudgetRealignment'),
            'y2BudgetRealignment' => $this->request->getVar('y2BudgetRealignment'),
            'y3BudgetRealignment' => $this->request->getVar('y3BudgetRealignment'),
            'programReview' => $this->request->getVar('programReview'),
            'terminalReview' => $this->request->getVar('terminalReview'),
            'region' => $this->request->getVar('region'),
            'submissionTerminal' => $this->request->getVar('submissionTerminal'),
            'status' => $this->request->getVar('status'),
            'remarks' => $this->request->getVar('remarks'),
            'tagging' => $this->request->getVar('tagging'),
            'bannerProgram' => $this->request->getVar('bannerProgram'),
            'pillar' => $this->request->getVar('pillar'),
            'strategy' => $this->request->getVar('strategy'),
        ];
        // if(!$this->validate($rules)) return $this->fail($this->validator->getErrors());
        $model = new ProjectModel();
        $project = $model->find($id);

        if (!$project) {
            return $this->failNotFound('No Data Found');
        }

        $model->update($id, $data);

        $totalBudget = $this->request->getVar('totalBudget');
        $budgetData = $this->request->getVar('budget');
        $budgetModel = new BudgetModel();

        // Check if budget data is present in the request
        if ($budgetData && $totalBudget) {
            foreach ($budgetData as $budgetItem) {
                $year = $budgetItem->year;
                $amount = $budgetItem->amount;                
            
                $existingBudget = $budgetModel->where([
                    'project_id' => $id,
                    'year' => $year
                ])->first();
            
                if ($existingBudget) {
                    $budgetModel->update($existingBudget['id'], [
                        'totalBudget' => $totalBudget,
                        'amount' => $amount
                    ]);
                } else {
                    $budgetModel->save([
                        'project_id' => $id,
                        'totalBudget' => $totalBudget,
                        'year' => $year,
                        'amount' => $amount
                    ]);
                }
            }
        }

        // $budgetRealignmentFile = $this->request->getFile('budgetRealignmentFile');
        // $changeImplementationFile = $this->request->getFile('changeImplementationFile');
        // $extensionFile = $this->request->getFile('extensionFile');

        // // Move uploaded files to the desired directory
        // $budgetRealignmentFileName = $budgetRealignmentFile->getName();
        // $changeImplementationFileName = $changeImplementationFile->getName();
        // $extensionFileName = $extensionFile->getName();

        // $budgetRealignmentFile->move(WRITEPATH . 'uploads', $budgetRealignmentFileName);
        // $changeImplementationFile->move(WRITEPATH . 'uploads', $changeImplementationFileName);
        // $extensionFile->move(WRITEPATH . 'uploads', $extensionFileName);
    

        $response = [
            'status' => 200,
            'error' => null,
            'messages' => [
                'success' => 'Data Updated'
            ]
        ];
        return $this->respond($response);
    }

    /**
     * Delete the designated resource object from the model
     *
     * @return ResponseInterface
     */
    public function delete($id = null)
    {
        $model = new ProjectModel();
        $project = $model->find($id);

        if (!$project) {
            return $this->failNotFound('No Data Found');
        }

        try {
            $archiveProjectModel = new ArchiveProjectsModel();
            $archiveProjectFields = [
                'ISP', 'programTitle', 'projectTitle', 'responsiblePerson', 'funding',
                'implementingAgency', 'programLeader', 'emailAddress', 'contactNumber',
                'postalAddress', 'cooperatingAgency', 'originalStart', 'originalEnd',
                'changeStart', 'changeImplementationDate', 'firstExtension', 'secondExtension',
                'objectives', 'description', 'deliverables', 'beneficiaries', 'status', 'remarks',
                'dcY1Approval', 'gcY1Approval', 'execomY1Approval', 'dcY2Renewal',
                'gcY2Renewal', 'execomY2Renewal', 'dcY3Renewal', 'gcY3Renewal',
                'execomY3Renewal', 'inceptionMeeting', 'mande', 'y1BudgetRealignment',
                'y2BudgetRealignment', 'y3BudgetRealignment', 'programReview', 'terminalReview',
            ];
            $archiveProject = array_intersect_key($project, array_flip($archiveProjectFields));
            $archiveProjectModel->insert($archiveProject);
            $archiveProjectId = $archiveProjectModel->insertID();

            $archiveBudgetModel = new ArchiveBudgetModel();
            foreach ((new BudgetModel())->where('project_id', $id)->findAll() as $budget) {
                $archiveBudgetModel->insert([
                    'project_id' => $archiveProjectId,
                    'year' => $budget['year'],
                    'amount' => $budget['amount'] ?? null,
                    'totalBudget' => $budget['totalBudget'] ?? null,
                ]);
            }

            $archiveReleasesModel = new ArchiveReleasesModel();
            foreach ((new ReleasesModel())->where('project_id', $id)->findAll() as $release) {
                unset($release['id'], $release['project_id'], $release['created_at'], $release['updated_at']);
                $release['project_id'] = $archiveProjectId;
                $archiveReleasesModel->insert($release);
            }

            $archiveCounterpartFundModel = new ArchiveCounterpartFundModel();
            foreach ((new CounterpartFundModel())->where('project_id', $id)->findAll() as $fund) {
                unset($fund['id'], $fund['project_id'], $fund['created_at'], $fund['updated_at']);
                $fund['project_id'] = $archiveProjectId;
                $archiveCounterpartFundModel->insert($fund);
            }

            // Delete related records first (cascade delete)
            $budgetModel = new BudgetModel();
            $budgetModel->where('project_id', $id)->delete();

            $releasesModel = new ReleasesModel();
            $releasesModel->where('project_id', $id)->delete();

            $counterpartFundModel = new CounterpartFundModel();
            $counterpartFundModel->where('project_id', $id)->delete();

            $sixPSModel = new SixPSModel();
            $sixPSModel->where('project_id', $id)->delete();

            $uploadModel = new UploadModel();
            $uploadModel->where('project_id', $id)->delete();

            // Then delete the project itself
            $model->delete($id);

            $response = [
                'status' => 200,
                'error' => null,
                'messages' => [
                    'success' => 'Data Deleted'
                ]
            ];
            return $this->respond($response);
        } catch (\Exception $e) {
            return $this->fail('Error deleting project: ' . $e->getMessage());
        }
    }

    /**
     * Import budgets from Excel file
     *
     * @return ResponseInterface
     */
    public function importBudgets()
    {
        helper(['form']);
        $rows = $this->request->getJSON(true);

        if (!is_array($rows) || empty($rows)) {
            return $this->fail('No data provided');
        }

        $budgetModel = new BudgetModel();
        $projectModel = new ProjectModel();

        try {
            $processed = 0;
            $skipped = 0;

            foreach ($rows as $row) {
                if (!is_array($row)) {
                    continue;
                }

                $projectTitle = trim((string) ($row['projectTitle'] ?? ''));
                $year = isset($row['year']) ? intval($row['year']) : null;
                $amount = isset($row['amount']) ? str_replace(',', '', (string) $row['amount']) : null;
                $totalBudget = isset($row['totalBudget']) ? str_replace(',', '', (string) $row['totalBudget']) : null;

                if ($projectTitle === '' || !$year || $amount === null || $amount === '') {
                    $skipped++;
                    continue;
                }

                $project = $projectModel
                    ->groupStart()
                        ->where('projectTitle', $projectTitle)
                        ->orWhere('programTitle', $projectTitle)
                    ->groupEnd()
                    ->first();

                if (!$project) {
                    $allProjects = $projectModel->findAll();
                    foreach ($allProjects as $candidate) {
                        if (strcasecmp(trim((string) ($candidate['projectTitle'] ?? '')), $projectTitle) === 0 || strcasecmp(trim((string) ($candidate['programTitle'] ?? '')), $projectTitle) === 0) {
                            $project = $candidate;
                            break;
                        }
                    }
                }

                if (!$project) {
                    $project = $projectModel
                        ->groupStart()
                            ->like('projectTitle', $projectTitle)
                            ->orLike('programTitle', $projectTitle)
                        ->groupEnd()
                        ->first();
                }

                if (!$project) {
                    $skipped++;
                    continue;
                }

                $projectId = $project['id'];
                $amountValue = is_numeric($amount) ? (float) $amount : (float) str_replace(',', '', $amount);
                $budgetData = ['amount' => $amountValue];

                if ($totalBudget !== null && $totalBudget !== '') {
                    $budgetData['totalBudget'] = is_numeric($totalBudget) ? (float) $totalBudget : (float) str_replace(',', '', $totalBudget);
                }

                $existingBudget = $budgetModel->where([
                    'project_id' => $projectId,
                    'year' => $year
                ])->first();

                if ($existingBudget) {
                    $budgetModel->update($existingBudget['id'], array_merge($existingBudget, $budgetData));
                } else {
                    $budgetData['project_id'] = $projectId;
                    $budgetData['year'] = $year;
                    $budgetModel->save($budgetData);
                }

                $processed++;
            }

            $message = "Imported {$processed} budget rows";
            if ($skipped > 0) {
                $message .= " ({$skipped} rows skipped — missing or invalid project/year data)";
            }

            $response = [
                'status' => 200,
                'error' => null,
                'messages' => [
                    'success' => $message
                ]
            ];
            return $this->respond($response);
        } catch (\Exception $e) {
            return $this->fail('Error importing budgets: ' . $e->getMessage());
        }
    }

    /**
     * Import projects from Excel file
     *
     * @return ResponseInterface
     */
    public function importProjects()
    {
        helper(['form']);
        $projectData = $this->request->getJSON(true);

        if (!is_array($projectData) || empty($projectData)) {
            return $this->respond([
                'status' => 200,
                'count' => 0,
                'message' => 'No importable project rows were found in the provided data.'
            ]);
        }

        $hasMeaningfulRows = false;
        foreach ($projectData as $project) {
            if (!is_array($project)) {
                continue;
            }

            $projectTitle = trim((string) ($project['projectTitle'] ?? ''));
            $programTitle = trim((string) ($project['programTitle'] ?? ''));
            if ($projectTitle !== '' || $programTitle !== '') {
                $hasMeaningfulRows = true;
                break;
            }
        }

        if (!$hasMeaningfulRows) {
            return $this->respond([
                'status' => 200,
                'count' => 0,
                'message' => 'No importable project rows were found in the provided data.'
            ]);
        }

        $model = new ProjectModel();
        $budgetModel = new BudgetModel();
        $counterFundModel = new CounterpartFundModel();
        $sixPSModel = new SixPSModel();
        $releasesModel = new ReleasesModel();
        $fileModel = new UploadModel();

        try {
            $insertedCount = 0;

            foreach ($projectData as $project) {
                if (!is_array($project)) {
                    continue;
                }

                // Skip rows without a project or program title
                $projectTitle = trim((string) ($project['projectTitle'] ?? ''));
                $programTitle = trim((string) ($project['programTitle'] ?? ''));
                if ($projectTitle === '' && $programTitle === '') {
                    continue;
                }

                // Use empty strings for missing values — DB columns do not allow NULL
                $newProject = [
                    'projectCode' => $project['projectCode'] ?? '',
                    'programCode' => $project['programCode'] ?? '',
                    'ISP' => $project['ISP'] ?? '',
                    'programTitle' => $programTitle,
                    'projectTitle' => $projectTitle !== '' ? $projectTitle : $programTitle,
                    'responsiblePerson' => $project['responsiblePerson'] ?? '',
                    'funding' => $project['funding'] ?? '',
                    'implementingAgency' => $project['implementingAgency'] ?? '',
                    'programLeader' => $project['programLeader'] ?? '',
                    'projectLeader' => $project['projectLeader'] ?? '',
                    'emailAddress' => $project['emailAddress'] ?? '',
                    'contactNumber' => (string) ($project['contactNumber'] ?? ''),
                    'postalAddress' => $project['postalAddress'] ?? '',
                    'cooperatingAgency' => $project['cooperatingAgency'] ?? '',
                    'originalStart' => $project['originalStart'] ?? '',
                    'originalEnd' => $project['originalEnd'] ?? '',
                    'changeStart' => $project['changeStart'] ?? '',
                    'changeImplementationDate' => $project['changeImplementationDate'] ?? '',
                    'firstExtension' => $project['firstExtension'] ?? '',
                    'secondExtension' => $project['secondExtension'] ?? '',
                    'objectives' => $project['objectives'] ?? '',
                    'description' => $project['description'] ?? '',
                    'deliverables' => $project['deliverables'] ?? '',
                    'beneficiaries' => $project['beneficiaries'] ?? '',
                    'dcY1Approval' => $project['dcY1Approval'] ?? '',
                    'gcY1Approval' => $project['gcY1Approval'] ?? '',
                    'execomY1Approval' => $project['execomY1Approval'] ?? '',
                    'dcY2Renewal' => $project['dcY2Renewal'] ?? '',
                    'gcY2Renewal' => $project['gcY2Renewal'] ?? '',
                    'execomY2Renewal' => $project['execomY2Renewal'] ?? '',
                    'region' => $project['region'] ?? '',
                    'dcY3Renewal' => $project['dcY3Renewal'] ?? '',
                    'gcY3Renewal' => $project['gcY3Renewal'] ?? '',
                    'execomY3Renewal' => $project['execomY3Renewal'] ?? '',
                    'inceptionMeeting' => $project['inceptionMeeting'] ?? '',
                    'mande' => $project['mande'] ?? '',
                    'y1BudgetRealignment' => $project['y1BudgetRealignment'] ?? '',
                    'y2BudgetRealignment' => $project['y2BudgetRealignment'] ?? '',
                    'y3BudgetRealignment' => $project['y3BudgetRealignment'] ?? '',
                    'programReview' => $project['programReview'] ?? '',
                    'terminalReview' => $project['terminalReview'] ?? '',
                    'status' => $project['status'] ?? '',
                    'remarks' => $project['remarks'] ?? '',
                    'projectAccomplishment' => $project['projectAccomplishment'] ?? '',
                    'created_by' => 'Import',
                ];

                // Save the project
                $model->save($newProject);
                $projectId = $model->insertID();
                $insertedCount++;

                // Create related records
                $releasesModel->save([
                    'project_id' => $projectId,
                ]);

                // Don't create empty records - let users create them via "Add" buttons or "Generate Fields"
                // Empty records with year = 0 cause issues in the frontend
                // $counterFundModel->save([
                //     'project_id' => $projectId,
                // ]);

                // $sixPSModel->save([
                //     'project_id' => $projectId,
                // ]);

                // $budgetModel->save([
                //     'project_id' => $projectId,
                // ]);

                $fileModel->save([
                    'project_id' => $projectId,
                ]);

                // Handle budget data - can be array of {year, amount} or legacy single year/amount
                $budgetData = $project['budgetData'] ?? null;
                
                if ($budgetData && is_array($budgetData)) {
                    // New format: array of budget entries
                    foreach ($budgetData as $budgetEntry) {
                        if (isset($budgetEntry['year']) && isset($budgetEntry['amount'])) {
                            $budgetModel->save([
                                'project_id' => $projectId,
                                'year' => (int) $budgetEntry['year'],
                                'amount' => (float) $budgetEntry['amount'],
                                'totalBudget' => (float) $budgetEntry['amount'],
                            ]);
                        }
                    }
                } else {
                    // Legacy format: single year/amount
                    $budgetYear = $project['budgetYear'] ?? null;
                    $budgetAmount = $project['budgetAmount'] ?? null;
                    if ($budgetYear !== null && $budgetYear !== '' && $budgetAmount !== null && $budgetAmount !== '') {
                        $amount = (float) $budgetAmount;
                        $budgetModel->save([
                            'project_id' => $projectId,
                            'year' => (int) $budgetYear,
                            'amount' => $amount,
                            'totalBudget' => $amount,
                        ]);
                    }
                }
            }

            $response = [
                'status' => 200,
                'error' => null,
                'messages' => [
                    'success' => "Successfully imported {$insertedCount} projects"
                ]
            ];
            return $this->respond($response);

        } catch (\Exception $e) {
            return $this->fail('Error importing projects: ' . $e->getMessage());
        }
    }

}
