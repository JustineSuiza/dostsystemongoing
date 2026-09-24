<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use App\Models\CounterpartFundModel;
use App\Models\ProjectModel;

class CounterpartFund extends ResourceController
{
    /**
     * Return an array of resource objects, themselves in array format
     *
     * @return ResponseInterface
     */
    public function index()
    {
        $model = new CounterpartFundModel();
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
        $model = new CounterpartFundModel();
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
        $counterparFundModel = new CounterpartFundModel();
        error_log('Received SixPS data: ' . json_encode($counterFundData));

        // Check if budget data is present in the request
        if ($counterFundData && $totalFund) {
            foreach ($counterFundData as $fundItem) {
                error_log('Processing item: ' . json_encode($fundItem));
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
        $counterpartFundModel = new CounterpartFundModel();
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

    /**
     * Import counterpart funds from frontend Excel upload
     * Expects an array of objects with at least: projectTitle, year, amount
     */
    public function importCounterpartFunds()
    {
        helper(['form']);
        $rows = $this->request->getJSON(true);

        if (!is_array($rows) || empty($rows)) {
            return $this->fail('No data provided');
        }

        $counterModel = new CounterpartFundModel();
        $projectModel = new ProjectModel();

        // Helper to pick a field from row using flexible header matching
        $pick = function ($row, $candidates) {
            if (!is_array($row)) return null;
            $keys = array_keys($row);
            foreach ($candidates as $name) {
                // exact
                if (array_key_exists($name, $row)) return $row[$name];
            }
            // case-insensitive exact
            foreach ($keys as $k) {
                foreach ($candidates as $name) {
                    if (mb_strtolower($k) === mb_strtolower($name)) return $row[$k];
                }
            }
            // partial match
            foreach ($keys as $k) {
                $lk = mb_strtolower($k);
                foreach ($candidates as $name) {
                    $ln = mb_strtolower($name);
                    if (strpos($lk, $ln) !== false || strpos($ln, $lk) !== false) return $row[$k];
                }
            }
            return null;
        };

        // Helper to sanitize numeric values (remove commas, currency symbols, parentheses)
        $sanitizeNumber = function ($v) {
            if ($v === null || $v === '') return null;
            // If already numeric
            if (is_numeric($v)) return $v + 0;
            $text = trim((string)$v);
            // Remove common currency symbols and spaces
            $text = str_replace([',', ' ', '₱', '$', '€'], '', $text);
            // Handle parentheses for negative numbers (e.g., (1,000))
            if (preg_match('/^\((.*)\)$/', $text, $m)) {
                $text = '-' . $m[1];
            }
            // Remove any non-numeric except dot and minus
            $text = preg_replace('/[^0-9.\-]/', '', $text);
            if ($text === '' || $text === null) return null;
            return floatval($text);
        };

        try {
            $processed = 0;
            foreach ($rows as $row) {
                // allow rows as objects or associative arrays
                if (is_object($row)) $row = (array)$row;

                $projectTitle = $pick($row, ['projectTitle', 'Project Title', 'Project', 'Project Name', 'project']);
                $yearRaw = $pick($row, ['year', 'Year']);
                $amountRaw = $pick($row, ['amount', 'Amount', 'Value', 'Funding']);
                $totalFundRaw = $pick($row, ['totalFund', 'Total', 'Total Fund', 'total']);

                $year = null;
                if ($yearRaw !== null) {
                    // try numeric year extraction
                    if (is_numeric($yearRaw)) $year = intval($yearRaw);
                    else {
                        $y = preg_match('/(19|20)\d{2}/', $yearRaw, $m) ? intval($m[0]) : null;
                        $year = $y;
                    }
                }

                $amount = $sanitizeNumber($amountRaw);
                $totalFund = $sanitizeNumber($totalFundRaw);

                if (!$projectTitle || !$year || ($amount === null)) continue;

                $projectTitleTrim = trim((string)$projectTitle);

                // Fuzzy project lookup: try exact, then like on various fields
                $project = $projectModel->where('projectTitle', $projectTitleTrim)
                    ->orWhere('programTitle', $projectTitleTrim)
                    ->orWhere('projectCode', $projectTitleTrim)
                    ->first();

                if (!$project) {
                    // try partial matches
                    $project = $projectModel->like('projectTitle', $projectTitleTrim)
                        ->orLike('programTitle', $projectTitleTrim)
                        ->orLike('projectCode', $projectTitleTrim)
                        ->first();
                }

                if (!$project) continue;

                $projectId = $project['id'];

                $existing = $counterModel->where(['project_id' => $projectId, 'year' => $year])->first();

                if ($existing) {
                    $updateData = ['amount' => $amount];
                    if ($totalFund !== null) $updateData['totalFund'] = $totalFund;
                    $counterModel->update($existing['id'], $updateData);
                } else {
                    $saveData = [
                        'project_id' => $projectId,
                        'year' => $year,
                        'amount' => $amount,
                    ];
                    if ($totalFund !== null) $saveData['totalFund'] = $totalFund;
                    $counterModel->save($saveData);
                }

                $processed++;
            }

            $response = [
                'status' => 200,
                'error' => null,
                'messages' => [
                    'success' => "Imported {$processed} counterpart fund rows"
                ]
            ];
            return $this->respond($response);
        } catch (\Exception $e) {
            return $this->fail('Error importing counterpart funds: ' . $e->getMessage());
        }
    }
}
