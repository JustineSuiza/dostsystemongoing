<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;
use App\Models\DisbursementVoucherModel;

class DisbursementVoucher extends ResourceController
{
    /**
     * Get all vouchers for a specific indirect cost item
     */
    public function getByIndirectCost($indirectCostId)
    {
        $model = new DisbursementVoucherModel();
        $data = $model->where('indirect_cost_id', $indirectCostId)->findAll();

        return $this->respond($data);
    }

    /**
     * Return an array of all vouchers
     */
    public function index()
    {
        $model = new DisbursementVoucherModel();
        $data = $model->findAll();

        return $this->respond($data);
    }

    /**
     * Return a single voucher
     */
    public function show($id = null)
    {
        $model = new DisbursementVoucherModel();
        $data = $model->find($id);

        if (!$data) {
            return $this->failNotFound('No Data Found');
        }

        return $this->respond($data);
    }

    /**
     * Create a new voucher
     */
    public function create()
    {
        $model = new DisbursementVoucherModel();
        $data = $this->request->getJSON(true);

        if (!$model->save($data)) {
            return $this->fail($model->errors(), 400);
        }

        $response = [
            'status' => 201,
            'error' => null,
            'messages' => [
                'success' => 'Voucher Created'
            ]
        ];
        return $this->respondCreated($response);
    }

    /**
     * Update a voucher
     */
    public function update($id = null)
    {
        $model = new DisbursementVoucherModel();
        $data = $this->request->getJSON(true);

        if (!$model->update($id, $data)) {
            return $this->fail($model->errors(), 400);
        }

        $response = [
            'status' => 200,
            'error' => null,
            'messages' => [
                'success' => 'Voucher Updated'
            ]
        ];
        return $this->respond($response);
    }

    /**
     * Delete a voucher
     */
    public function delete($id = null)
    {
        $model = new DisbursementVoucherModel();
        $voucher = $model->find($id);

        if (!$voucher) {
            return $this->failNotFound('No Data Found');
        }

        $model->delete($id);

        $response = [
            'status' => 200,
            'error' => null,
            'messages' => [
                'success' => 'Voucher Deleted'
            ]
        ];
        return $this->respond($response);
    }

    /**
     * Bulk save/update vouchers
     */
    public function bulkSave()
    {
        $model = new DisbursementVoucherModel();
        $vouchers = $this->request->getJSON(true);

        if (!is_array($vouchers) || empty($vouchers)) {
            return $this->fail('No data provided');
        }

        try {
            foreach ($vouchers as $voucher) {
                if (!is_array($voucher)) {
                    continue;
                }

                if (isset($voucher['id']) && $voucher['id']) {
                    $existing = $model->find($voucher['id']);
                    if ($existing) {
                        $model->update($voucher['id'], $voucher);
                        continue;
                    }
                }

                unset($voucher['id']);
                $model->save($voucher);
            }

            $response = [
                'status' => 200,
                'error' => null,
                'messages' => [
                    'success' => 'Vouchers saved successfully'
                ]
            ];
            return $this->respond($response);
        } catch (\Exception $e) {
            return $this->fail('Error saving vouchers: ' . $e->getMessage());
        }
    }
}
