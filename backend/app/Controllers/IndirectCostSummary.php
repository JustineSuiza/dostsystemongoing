<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;
use App\Models\IndirectCostSummaryModel;

class IndirectCostSummary extends ResourceController
{
    /**
     * Return an array of resource objects
     *
     * @return ResponseInterface
     */
    public function index()
    {
        $model = new IndirectCostSummaryModel();
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
        $model = new IndirectCostSummaryModel();
        $data = $model->find($id);

        if (!$data) {
            return $this->failNotFound('No Data Found');
        }

        return $this->respond($data);
    }

    /**
     * Create a new resource object
     *
     * @return ResponseInterface
     */
    public function create()
    {
        $model = new IndirectCostSummaryModel();
        $data = $this->request->getJSON(true);

        if (!$model->save($data)) {
            return $this->fail($model->errors(), 400);
        }

        $response = [
            'status' => 201,
            'error' => null,
            'messages' => [
                'success' => 'Data Created'
            ]
        ];
        return $this->respondCreated($response);
    }

    /**
     * Update a resource object
     *
     * @return ResponseInterface
     */
    public function update($id = null)
    {
        $model = new IndirectCostSummaryModel();
        $data = $this->request->getJSON(true);

        if (!$model->update($id, $data)) {
            return $this->fail($model->errors(), 400);
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
     * Delete a resource object
     *
     * @return ResponseInterface
     */
    public function delete($id = null)
    {
        $model = new IndirectCostSummaryModel();
        $item = $model->find($id);

        if (!$item) {
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
     * Bulk save/update rows (for import and batch operations)
     *
     * @return ResponseInterface
     */
    public function bulkSave()
    {
        $model = new IndirectCostSummaryModel();
        $rows = $this->request->getJSON(true);

        if (!is_array($rows) || empty($rows)) {
            return $this->fail('No data provided');
        }

        try {
            $insertedIds = [];
            foreach ($rows as $index => $row) {
                if (!is_array($row)) {
                    continue;
                }

                // If row has an id and it exists, update; otherwise create
                if (isset($row['id']) && $row['id']) {
                    $existing = $model->find($row['id']);
                    if ($existing) {
                        $model->update($row['id'], $row);
                        continue;
                    }
                }

                // Create new row
                unset($row['id']); // Remove id if exists to let DB auto-generate
                $model->save($row);
                $insertedIds[$index] = $model->getInsertID();
            }

            $response = [
                'status' => 200,
                'error' => null,
                'messages' => [
                    'success' => 'Data saved successfully'
                ],
                'inserted_ids' => $insertedIds,
            ];
            return $this->respond($response);
        } catch (\Exception $e) {
            return $this->fail('Error saving data: ' . $e->getMessage());
        }
    }
}
