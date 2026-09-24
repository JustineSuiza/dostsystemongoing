<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;

use App\Models\UploadModel;

class UploadFile extends ResourceController
{
    /**
     * Return an array of resource objects, themselves in array format
     *
     * @return ResponseInterface
     */
    public function index()
    {
        //
    }

    /**
     * Return the properties of a resource object
     *
     * @return ResponseInterface
     */
    public function show($id = null)
    {
        //
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
        $files = [
            'implementationFile' => $this->request->getFile('implementationFile'),
            'extensionFile' => $this->request->getFile('extensionFile'),
            'realignmentFile' => $this->request->getFile('realignmentFile')
        ];

        $uploadedFiles = [];

        // Check if at least one file is uploaded
        $validFileUploaded = false;
        foreach ($files as $key => $file) {
            if ($file !== null && $file->isValid()) {
                $validFileUploaded = true;
                break;
            }
        }

        if (!$validFileUploaded) {
            return $this->fail('No valid file uploaded', 400);
        }

        foreach ($files as $key => $file) {
            if ($file === null || !$file->isValid()) {
                continue; // Skip invalid or empty files
            }

            if (!$file->move(WRITEPATH . 'uploads')) {
                return $this->fail("Failed to move file for $key", 500);
            }

            $uploadedFiles[$key] = $file->getName();
        }

        return $this->respondCreated([
            'message' => 'Files uploaded successfully',
            'uploadedFiles' => $uploadedFiles
        ]);
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
        $model = new UploadModel();
        $find = $model->find($id);
        if (!$find) return $this->failNotFound('No Data Found');

        $data = [
            'implementationFilename' => $this->request->getVar('implementationFilename'),
            'implementationFilepath' => $this->request->getVar('implementationFilepath'),
            'extensionFilename' => $this->request->getVar('extensionFilename'),
            'extensionFilepath' => $this->request->getVar('extensionFilepath'),
            'realignmentFilename' => $this->request->getVar('realignmentFilename'),
            'realignmentFilepath' => $this->request->getVar('realignmentFilepath')
        ];

        $model->update($id, $data);

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
        //
    }

    public function showImage($filename)
    {
        // Construct the file path
        $filePath = WRITEPATH . 'uploads/' . $filename;

        // Check if the file exists
        if (!file_exists($filePath)) {
            return $this->failNotFound('Image not found');
        }

        // Set the appropriate headers for serving the image
        header('Content-Type: ' . mime_content_type($filePath));

        // Output the image content
        readfile($filePath);
    }

    public function showFile($filename)
    {
        // Construct the file path
        $filePath = WRITEPATH . 'uploads/' . $filename;

        // Check if the file exists
        if (!file_exists($filePath)) {
            return $this->failNotFound('File not found');
        }

        // Set the appropriate headers for serving the file
        header('Content-Type: ' . mime_content_type($filePath));
        header('Content-Disposition: inline; filename="' . $filename . '"');

        // Output the file content
        readfile($filePath);
    }

}
