<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;
use App\Models\ProposalsModel;
use App\Models\ArchiveProposalsModel;

class Proposals extends ResourceController
{
    public static function hasImportableRows(array $rows): bool
    {
        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }

            foreach ($row as $value) {
                if (is_scalar($value)) {
                    $text = trim((string) $value);
                    if ($text !== '' && $text !== 'null' && $text !== 'NULL') {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Return an array of resource objects, themselves in array format
     *
     * @return ResponseInterface
     */
    public function index()
    {
        $model = new ProposalsModel();
        $data = $model->findAll();
        return $this->respond($data);
    }

    /**
     * Return the properties of a resource object
     *
     * @return ResponseInterface
     */
    public function show($id = null)
    {
        $model = new ProposalsModel();
        $data = $model->find(['id' => $id]);
        if(!$data) return $this->failNotFound('No Data Found');
        return $this->respond($data[0]);
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
            'implementingAgency' => '', 
            'programLeader' => '', 
            'leadTRD' => '', 
            'funding' => '', 
            'quarter' => '', 
            'date' => '', 
            'remarks' => '', 
        ];
        $data = [
            'ISP' => $this->request->getVar('ISP'),
            'programTitle' => $this->request->getVar('programTitle'),
            'projectTitle' => $this->request->getVar('projectTitle'),
            'responsiblePerson' => $this->request->getVar('responsiblePerson'),
            'implementingAgency' => $this->request->getVar('implementingAgency'),
            'programLeader' => $this->request->getVar('programLeader'),
            'leadTRD' => $this->request->getVar('leadTRD'),
            'funding' => $this->request->getVar('funding'),
            'quarter' => $this->request->getVar('quarter'),
            'date' => $this->request->getVar('date'),
            'remarks' => $this->request->getVar('remarks'),
        ];
        // if(!$this->validate($rules)) return $this->fail($this->validator->getErrors());
        
        $model = new ProposalsModel();
        $model->save($data);
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
            'implementingAgency' => '', 
            'programLeader' => '', 
            'leadTRD' => '', 
            'funding' => '', 
            'quarter' => '', 
            'date' => '', 
            'remarks' => '', 
        ];
        $data = [
            'ISP' => $this->request->getVar('ISP'),
            'programTitle' => $this->request->getVar('programTitle'),
            'projectTitle' => $this->request->getVar('projectTitle'),
            'responsiblePerson' => $this->request->getVar('responsiblePerson'),
            'implementingAgency' => $this->request->getVar('implementingAgency'),
            'programLeader' => $this->request->getVar('programLeader'),
            'leadTRD' => $this->request->getVar('leadTRD'),
            'funding' => $this->request->getVar('funding'),
            'quarter' => $this->request->getVar('quarter'),
            'date' => $this->request->getVar('date'),
            'remarks' => $this->request->getVar('remarks'),
        ];
        // if(!$this->validate($rules)) return $this->fail($this->validator->getErrors());
        $model = new ProposalsModel();
        $findById = $model->find(['id' => $id]);
        if(!$findById) return $this->failNotFound('No Data Found');
        $model->update($id, $data);
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
     * Import proposals from Excel
     *
     * @return ResponseInterface
     */
    public function importProposals()
    {
        $proposalsData = $this->request->getJSON(true);

        if (!is_array($proposalsData) || empty($proposalsData) || !self::hasImportableRows($proposalsData)) {
            return $this->respond([
                'status' => 200,
                'count' => 0,
                'message' => 'No importable rows were found in the provided data.'
            ]);
        }

        $model = new ProposalsModel();
        $count = 0;

        foreach ($proposalsData as $proposal) {
            if (!is_array($proposal)) {
                continue;
            }

            $data = [
                'ISP' => $proposal['ISP'] ?? null,
                'programTitle' => $proposal['programTitle'] ?? null,
                'projectTitle' => $proposal['projectTitle'] ?? null,
                'responsiblePerson' => $proposal['responsiblePerson'] ?? null,
                'implementingAgency' => $proposal['implementingAgency'] ?? null,
                'programLeader' => $proposal['programLeader'] ?? null,
                'leadTRD' => $proposal['leadTRD'] ?? null,
                'funding' => $proposal['funding'] ?? null,
                'quarter' => $proposal['quarter'] ?? null,
                'date' => $proposal['date'] ?? null,
                'remarks' => $proposal['remarks'] ?? null,
            ];

            $hasMeaningfulValue = false;
            foreach ($data as $value) {
                if (is_scalar($value)) {
                    $text = trim((string) $value);
                    if ($text !== '' && $text !== 'null' && $text !== 'NULL') {
                        $hasMeaningfulValue = true;
                        break;
                    }
                }
            }

            if ($hasMeaningfulValue) {
                $model->save($data);
                $count++;
            }
        }

        return $this->respond(['status' => 200, 'count' => $count, 'message' => "Successfully imported $count proposals"]);
    }

    /**
     * Delete the designated resource object from the model
     *
     * @return ResponseInterface
     */
    public function delete($id = null)
    {
        $model = new ProposalsModel();
        $findById = $model->find(['id' => $id]);
        if(!$findById) return $this->failNotFound('No Data Found');
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
