<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;

class Upload extends ResourceController
{
    protected $modelName = 'App\Models\FileModel';

    public function index()
    {
        $fileModel = new \App\Models\FileModel();
        $files = $fileModel->findAll(); // Retrieve all files from the database

        // Construct an array of file details including URLs
        $filesWithUrls = [];
        foreach ($files as $file) {
            $filesWithUrls[] = [
                'filename' => $file['filename'],
                'filepath' => base_url('uploads/' . $file['filename']), // Generate URL
            ];
        }

        return $this->respond($filesWithUrls); // Return the file data with URLs as JSON
    }

    public function create()
    {
        helper(['form', 'url']);

        // Check if a file was uploaded
        if ($this->request->getFile('file')->isValid()) {
            // Process the uploaded file
            $file = $this->request->getFile('file');
            $newName = $file->getRandomName();
            $file->move(WRITEPATH . 'uploads', $newName);

            // Optionally, save file details to the database
            $data = [
                'filename' => $newName, // Save only the filename
                // 'filepath' => WRITEPATH . 'uploads/' . $newName, // Don't save the full path
            ];
            $fileModel = new \App\Models\FileModel();
            $fileModel->insert($data);

            return $this->respondCreated(['message' => 'File uploaded successfully.']);
        } else {
            return $this->fail('Invalid file upload.');
        }
    }

}
