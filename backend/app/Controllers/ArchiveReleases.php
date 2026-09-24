<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use App\Models\ArchiveReleasesModel;

class ArchiveReleases extends ResourceController
{
    /**
     * Return an array of resource objects, themselves in array format
     *
     * @return ResponseInterface
     */
    public function index()
    {
        $model = new ArchiveReleasesModel();
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
        $model = new ArchiveReleasesModel();
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
        $model = new ArchiveReleasesModel();
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
        $releasesModel = new ArchiveReleasesModel();
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
}
