<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use App\Models\ArchiveProjectsModel;
use App\Models\ArchiveBudgetModel;
use App\Models\ArchiveReleasesModel;
use App\Models\ArchiveCounterpartFundModel;

class ArchiveProjects extends ResourceController
{
    /**
     * Return an array of resource objects, themselves in array format
     *
     * @return ResponseInterface
     */
    public function index()
    {
        $model = new ArchiveProjectsModel();
        $data = $model->findAll();

        // Fetch totalBudget and yearly breakdown for each project
        $budgetModel = new ArchiveBudgetModel();
        $releasesModel = new ArchiveReleasesModel(); 
        $counterpartFundModel = new ArchiveCounterpartFundModel(); 

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
        $model = new ArchiveProjectsModel();
        $data = $model->find(['id' => $id]);

        if (!$data) {
            return $this->failNotFound('No Data Found');
        }

        // Fetch totalBudget for this project
        $budgetModel = new ArchiveBudgetModel();
        $totalBudgetData = $budgetModel->where('project_id', $data['id'])->first();
        $data['totalBudget'] = $totalBudgetData ? number_format($totalBudgetData['totalBudget'], 2) : null;

        // Fetch yearly breakdown for this project
        $yearlyBreakdownData = $budgetModel->where('project_id', $data['id'])->findAll();
        $yearlyBreakdown = [];
        foreach ($yearlyBreakdownData as $item) {
            $yearlyBreakdown[$item['year']] = $item['amount'];
        }
        $data['budget'] = $yearlyBreakdown ? $yearlyBreakdown : null;

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
            'ISP' => '', 
            'programTitle' => '', 
            'projectTitle' => '', 
            'responsiblePerson' => '', 
            'funding' => '', 
            'implementingAgency' => '', 
            'programLeader' => '', 
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
        ];
        $projectData = [
            'ISP' => $this->request->getVar('ISP'),
            'programTitle' => $this->request->getVar('programTitle'),
            'projectTitle' => $this->request->getVar('projectTitle'),
            'responsiblePerson' => $this->request->getVar('responsiblePerson'),
            'funding' => $this->request->getVar('funding'),
            'implementingAgency' => $this->request->getVar('implementingAgency'),
            'programLeader' => $this->request->getVar('programLeader'),
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
        ];

        // if(!$this->validate($rules)) {
        //     return $this->fail($this->validator->getErrors());
        // }
        
        $model = new ArchiveProjectsModel();
        $model->save($projectData);
        $projectId = $model->insertID();

        $releaseData = [
            'project_id' => $projectId,
        ];

        $Rmodel = new ArchiveReleasesModel();
        $Rmodel->save($releaseData);

        $counterFundData = [
            'project_id' => $projectId,
        ];

        $Cmodel = new ArchiveCounterpartFundModel();
        $Cmodel->save($counterFundData);

        $totalBudget = $this->request->getVar('totalBudget');
        $budgetData = $this->request->getVar('budget');
        $budgetModel = new ArchiveBudgetModel();

        foreach ($budgetData as $index => $budgetItem) {
            $year = $budgetItem->year;
            $amount = $budgetItem->amount;
            
            $budgetModel->save([
                'project_id' => $projectId,
                'totalBudget' => $totalBudget,
                'year' => $year,
                'amount' => $amount
            ]);
        }

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
            'ISP' => '', 
            'programTitle' => '', 
            'projectTitle' => '', 
            'responsiblePerson' => '', 
            'funding' => '', 
            'implementingAgency' => '', 
            'programLeader' => '', 
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
        ];

        $data = [
            'ISP' => $this->request->getVar('ISP'),
            'programTitle' => $this->request->getVar('programTitle'),
            'projectTitle' => $this->request->getVar('projectTitle'),
            'responsiblePerson' => $this->request->getVar('responsiblePerson'),
            'funding' => $this->request->getVar('funding'),
            'implementingAgency' => $this->request->getVar('implementingAgency'),
            'programLeader' => $this->request->getVar('programLeader'),
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

            'status' => $this->request->getVar('status'),
            'remarks' => $this->request->getVar('remarks'),
        ];
        // if(!$this->validate($rules)) return $this->fail($this->validator->getErrors());
        $model = new ArchiveProjectsModel();
        $project = $model->find($id);

        if (!$project) {
            return $this->failNotFound('No Data Found');
        }

        $model->update($id, $data);

        $totalBudget = $this->request->getVar('totalBudget');
        $budgetData = $this->request->getVar('budget');
        $budgetModel = new ArchiveBudgetModel();

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
        $model = new ArchiveProjectsModel();
        $project = $model->find($id);

        if (!$project) {
            return $this->failNotFound('No Data Found');
        }

        // Delete related records first
        $budgetModel = new ArchiveBudgetModel();
        $budgetModel->where('project_id', $id)->delete();

        $releaseModel = new ArchiveReleasesModel();
        $releaseModel->where('project_id', $id)->delete();

        $counterpartFundModel = new ArchiveCounterpartFundModel();
        $counterpartFundModel->where('project_id', $id)->delete();

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
    }
}
