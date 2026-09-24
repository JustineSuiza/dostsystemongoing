<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;

class ArchiveCounterpartFund extends ResourceController
{
    /**
     * Return an array of resource objects, themselves in array format
     *
     * @return ResponseInterface
     */
    public function index()
    {
        $model = new ArchiveCounterpartFundModel();
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
        $model = new ArchiveCounterpartFundModel();
        $data = $model->find(['id'  => $id]);
        if (!$data) return $this->failNotFound('No Data Found');
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
        //
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
        $totalFund = $this->request->getVar('totalFund');
        $counterFundData = $this->request->getVar('counterFund');
        $counterparFundModel = new ArchiveCounterpartFundModel();

        // Check if budget data is present in the request
        if ($counterFundData && $totalFund) {
            foreach ($counterFundData as $fundItem) {
                $year = $fundItem->year;
                $amount = $fundItem->amount;                
            
                $existingFund = $counterparFundModel->where([
                    'project_id' => $id,
                    'year' => $year
                ])->first();
            
                if ($existingFund) {
                    $counterparFundModel->update($existingFund['id'], [
                        'totalFund' => $totalFund,
                        'amount' => $amount
                    ]);
                } else {
                    $counterparFundModel->save([
                        'project_id' => $id,
                        'totalFund' => $totalFund,
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
        $counterpartFundModel = new ArchiveCounterpartFundModel();
        $counterpartFundModel->where('project_id', $id)->delete();
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
