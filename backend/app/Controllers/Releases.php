<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use App\Models\ReleasesModel;
use App\Models\ProjectModel;

class Releases extends ResourceController
{
    /**
     * Return an array of resource objects, themselves in array format
     *
     * @return ResponseInterface
     */
    public function index()
    {
        $model = new ReleasesModel();
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
        $model = new ReleasesModel();
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
        $releaseData = [
            'programmedAmount' => $this->request->getVar('programmedAmount'),
            'regionIA' => $this->request->getVar('regionIA'),
            'particulars' => $this->request->getVar('particulars'),
            'dvNo' => $this->request->getVar('dvNo'),
            'dateOfRelease' => $this->request->getVar('dateOfRelease'),
            'month' => $this->request->getVar('month'),
            'actualRelease' => $this->request->getVar('actualRelease'),
            'remarksReleases' => $this->request->getVar('remarksReleases'),
            'statusReleases' => $this->request->getVar('statusReleases')
        ];

        // if(!$this->validate($rules)) return $this->fail($this->validator->getErrors());
        $model = new ReleasesModel();
        $find = $model->find(['id' => $id]);
        if(!$find) return $this->failNotFound('No Data Found');
        $model->update($id, $releaseData);
        
        $response = [
            'status' => 200,
            'error' => null,
            'messages' => [
                'success' => 'Data updated'
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
        $releasesModel = new ReleasesModel();
        $releasesModel->where('project_id', $id)->delete();
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
     * Import releases from frontend Excel upload
     * Expects an array of objects with projectTitle and release fields
     */
    public function importReleases()
    {
        helper(['form']);
        $rows = $this->request->getJSON(true);

        if (!is_array($rows) || empty($rows)) {
            return $this->fail('No data provided');
        }

        $releasesModel = new ReleasesModel();
        $projectModel = new ProjectModel();

        try {
            $processed = 0;
            $skipped = 0;

            foreach ($rows as $row) {
                if (!is_array($row)) {
                    continue;
                }

                $projectTitle = trim((string) ($row['projectTitle'] ?? ''));
                if ($projectTitle === '') {
                    continue;
                }

                $normalizedTitle = strtolower(preg_replace('/\s+/', ' ', $projectTitle));

                $project = $projectModel
                    ->groupStart()
                        ->where('projectTitle', $projectTitle)
                        ->orWhere('programTitle', $projectTitle)
                    ->groupEnd()
                    ->first();

                if (!$project) {
                    $allProjects = $projectModel->findAll();
                    foreach ($allProjects as $candidate) {
                        $candidateTitle = strtolower(preg_replace('/\s+/', ' ', trim((string) ($candidate['projectTitle'] ?? ''))));
                        $candidateProgram = strtolower(preg_replace('/\s+/', ' ', trim((string) ($candidate['programTitle'] ?? ''))));

                        if ($normalizedTitle !== '' && ($candidateTitle === $normalizedTitle || $candidateProgram === $normalizedTitle)) {
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
                $existing = $releasesModel->where('project_id', $projectId)->first();

                $releaseData = [];
                if (isset($row['programmedAmount']) && $row['programmedAmount'] !== '') {
                    $releaseData['programmedAmount'] = is_numeric($row['programmedAmount'])
                        ? (float) $row['programmedAmount']
                        : (float) str_replace(',', '', (string) $row['programmedAmount']);
                }
                if (isset($row['regionIA']) && $row['regionIA'] !== '') {
                    $releaseData['regionIA'] = (string) $row['regionIA'];
                }
                if (isset($row['particulars']) && $row['particulars'] !== '') {
                    $releaseData['particulars'] = (string) $row['particulars'];
                }
                if (isset($row['dvNo']) && $row['dvNo'] !== '') {
                    $releaseData['dvNo'] = (string) $row['dvNo'];
                }
                if (isset($row['dateOfRelease']) && $row['dateOfRelease'] !== '') {
                    $releaseData['dateOfRelease'] = (string) $row['dateOfRelease'];
                }
                if (isset($row['month']) && $row['month'] !== '') {
                    $releaseData['month'] = (string) $row['month'];
                }
                if (isset($row['actualRelease']) && $row['actualRelease'] !== '') {
                    $releaseData['actualRelease'] = is_numeric($row['actualRelease'])
                        ? (float) $row['actualRelease']
                        : (float) str_replace(',', '', (string) $row['actualRelease']);
                }
                if (isset($row['remarksReleases']) && $row['remarksReleases'] !== '') {
                    $releaseData['remarksReleases'] = (string) $row['remarksReleases'];
                }
                if (isset($row['statusReleases']) && $row['statusReleases'] !== '') {
                    $releaseData['statusReleases'] = (string) $row['statusReleases'];
                }

                if (empty($releaseData)) {
                    continue;
                }

                if ($existing) {
                    $releasesModel->update($existing['id'], $releaseData);
                } else {
                    $releaseData['project_id'] = $projectId;
                    $releasesModel->save($releaseData);
                }

                $processed++;
            }

            $message = "Imported {$processed} release rows";
            if ($skipped > 0) {
                $message .= " ({$skipped} rows skipped — project title not found in database)";
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
            return $this->fail('Error importing releases: ' . $e->getMessage());
        }
    }
}
