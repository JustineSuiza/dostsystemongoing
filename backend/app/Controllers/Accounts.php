<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;
use App\Models\UserModel;

class Accounts extends ResourceController
{
    /**
     * Return an array of resource objects, themselves in array format
     *
     * @return ResponseInterface
     */
    public function index()
    {
        $model = new UserModel();
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
        $model = new UserModel();
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
        'first_name' => 'required', 
        'last_name' => 'required', 
        // 'username' => 'required', 
        'password' => 'required', 
        'email' => 'required', 
        'user_lvl' => 'required', 
    ];
    $data = [
        'first_name' => $this->request->getVar('first_name'),
        'last_name' => $this->request->getVar('last_name'),
        // 'username' => $this->request->getVar('username'),
        'password' => $this->request->getVar('password'),
        'email' => $this->request->getVar('email'),
        'user_lvl' => $this->request->getVar('user_lvl'),
    ];
    if(!$this->validate($rules)) return $this->fail($this->validator->getErrors());
    
    $model = new UserModel(); // <-- Corrected typo here
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
            'first_name' => 'required', 
            'last_name' => 'required', 
            // 'username' => 'required', 
            'password' => 'required', 
            'email' => 'required', 
            'user_lvl' => 'required', 
        ];
        $data = [
            'first_name' => $this->request->getVar('first_name'),
            'last_name' => $this->request->getVar('last_name'),
            // 'username' => $this->request->getVar('username'),
            'password' => $this->request->getVar('password'),
            'email' => $this->request->getVar('email'),
            'user_lvl' => $this->request->getVar('user_lvl'),
        ];
        if(!$this->validate($rules)) return $this->fail($this->validator->getErrors());
        $model = new UserModel();
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
     * Delete the designated resource object from the model
     *
     * @return ResponseInterface
     */
    public function delete($id = null)
    {
        $model = new UserModel();
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
