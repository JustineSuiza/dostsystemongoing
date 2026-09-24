<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;
use App\Models\FutureSandTDirectionsModel;

class FutureSandTDirections extends ResourceController
{
    /**
     * Return an array of resource objects, themselves in array format
     *
     * @return ResponseInterface
     */
    public function index()
    {
        $model = new FutureSandTDirectionsModel();
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
        $model = new FutureSandTDirectionsModel();
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
            'industrySituation' => '',
            'goals' => '',
            'bannerProgram' => '',
            'programProject' => '',
            'year' => '',
            'budget' => '',
            'pillar' => '',
            'strategy' => '',
        ];

        $directionData = [
            'industrySituation' => $this->request->getVar('industrySituation'),
            'goals' => $this->request->getVar('goals'),
            'bannerProgram' => $this->request->getVar('bannerProgram'),
            'programProject' => $this->request->getVar('programProject'),
            'year' => $this->request->getVar('year'),
            'budget' => $this->request->getVar('budget'),
            'pillar' => $this->request->getVar('pillar'),
            'strategy' => $this->request->getVar('strategy'),
        ];

        $model = new FutureSandTDirectionsModel();
        $model->save($directionData);

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
            'industrySituation' => '',
            'goals' => '',
            'bannerProgram' => '',
            'programProject' => '',
            'year' => '',
            'budget' => '',
            'pillar' => '',
            'strategy' => '',
        ];

        $directionData = [
            'id' => $id,
            'industrySituation' => $this->request->getVar('industrySituation'),
            'goals' => $this->request->getVar('goals'),
            'bannerProgram' => $this->request->getVar('bannerProgram'),
            'programProject' => $this->request->getVar('programProject'),
            'year' => $this->request->getVar('year'),
            'budget' => $this->request->getVar('budget'),
            'pillar' => $this->request->getVar('pillar'),
            'strategy' => $this->request->getVar('strategy'),
        ];

        $model = new FutureSandTDirectionsModel();
        $model->save($directionData);

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
        $model = new FutureSandTDirectionsModel();
        $data = $model->find($id);

        if (!$data) {
            return $this->failNotFound('No Data Found');
        }

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

    /**
     * Import Future S&T Directions from Excel file
     *
     * @return ResponseInterface
     */
    public function importDirections()
    {
        helper(['form']);
        $directionsData = $this->request->getJSON(true);

        if (!is_array($directionsData) || empty($directionsData)) {
            return $this->fail('No directions data provided');
        }

        $model = new FutureSandTDirectionsModel();

        try {
            $insertedCount = 0;

            foreach ($directionsData as $direction) {
                $newDirection = [
                    'industrySituation' => $direction['industrySituation'] ?? null,
                    'goals' => $direction['goals'] ?? null,
                    'bannerProgram' => $direction['bannerProgram'] ?? null,
                    'programProject' => $direction['programProject'] ?? null,
                    'year' => $direction['year'] ?? null,
                    'budget' => $direction['budget'] ?? null,
                    'pillar' => $direction['pillar'] ?? null,
                    'strategy' => $direction['strategy'] ?? null,
                ];

                $model->save($newDirection);
                $insertedCount++;
            }

            $response = [
                'status' => 200,
                'error' => null,
                'messages' => [
                    'success' => "Successfully imported {$insertedCount} directions"
                ]
            ];
            return $this->respond($response);

        } catch (\Exception $e) {
            return $this->fail('Error importing directions: ' . $e->getMessage());
        }
    }
}
