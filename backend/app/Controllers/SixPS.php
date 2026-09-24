<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use App\Models\SixPSModel;

class SixPS extends ResourceController
{
    /**
     * Return an array of resource objects, themselves in array format
     *
     * @return ResponseInterface
     */
    public function index()
    {
        $model = new SixPSModel();
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
        $model = new SixPSModel();
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
        // helper(['form']);
        // $rules = [
        //     'targetPublication' => '',
        //     'actualaccomplishmentPeer' => '',
        //     'actualaccomplishmentJournal' => '',
        //     'actualaccomplishmentPresented' => '',
        //     'details' => '',
        //     'actualaccomplishmentIEC' => '',
        //     'targetProduct' => '',
        //     'techName' => '',
        //     'techDescription' => '',
        //     'targetPatent' => '',
        //     'agency' => '',
        //     'techNamePro' => '',
        //     'statusSix' => '',
        //     'dost' => '',
        //     'patentNumber' => '',
        //     'targetPeople' => '',
        //     'namesBS' => '',
        //     'namesMS' => '',
        //     'namesPhD' => '',
        //     'targetPlaces' => '',
        //     'cooperators' => '',
        //     'international' => '',
        //     'privateSixPS' => '',
        //     'targetPolicy' => '',
        //     'policyRecommendation' => ''
        // ];
        // $data = [
        //     'targetPublication' => $this->request->getVar('targetPublication'),
        //     'actualaccomplishmentPeer' => $this->request->getVar('actualaccomplishmentPeer'),
        //     'actualaccomplishmentJournal' => $this->request->getVar('actualaccomplishmentJournal'),
        //     'actualaccomplishmentPresented' => $this->request->getVar('actualaccomplishmentPresented'),
        //     'details' => $this->request->getVar('details'),
        //     'actualaccomplishmentIEC' => $this->request->getVar('actualaccomplishmentIEC'),
        //     'targetProduct' => $this->request->getVar('targetProduct'),
        //     'techName' => $this->request->getVar('techName'),
        //     'techDescription' => $this->request->getVar('techDescription'),
        //     'targetPatent' => $this->request->getVar('targetPatent'),
        //     'agency' => $this->request->getVar('agency'),
        //     'techNamePro' => $this->request->getVar('techNamePro'),
        //     'statusSix' => $this->request->getVar('statusSix'),
        //     'dost' => $this->request->getVar('dost'),
        //     'patentNumber' => $this->request->getVar('patentNumber'),
        //     'targetPeople' => $this->request->getVar('targetPeople'),
        //     'namesBS' => $this->request->getVar('namesBS'),
        //     'namesMS' => $this->request->getVar('namesMS'),
        //     'namesPhD' => $this->request->getVar('namesPhD'),
        //     'targetPlaces' => $this->request->getVar('targetPlaces'),
        //     'cooperators' => $this->request->getVar('cooperators'),
        //     'international' => $this->request->getVar('international'),
        //     'privateSixPS' => $this->request->getVar('privateSixPS'),
        //     'targetPolicy' => $this->request->getVar('targetPolicy'),
        //     'policyRecommendation' => $this->request->getVar('policyRecommendation')
        // ];
        // $model = new SixPSModel();
        // $model->save($data);
        // $response = [
        //     'status' => 201,
        //     'error' => null,
        //     'messages' => [
        //         'success' => 'Data Inserted'
        //     ]
        // ];
        // return $this->respondCreated($response);        
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
    // public function update($id = null)
    // {   
    //     helper(['form']);
    //     $rules = [
    //         'targetPublication' => '',
    //         'actualaccomplishmentPeer' => '',
    //         'actualaccomplishmentJournal' => '',
    //         'actualaccomplishmentPresented' => '',
    //         'details' => '',
    //         'actualaccomplishmentIEC' => '',
    //         'targetProduct' => '',
    //         'techName' => '',
    //         'techDescription' => '',
    //         'targetPatent' => '',
    //         'agency' => '',
    //         'techNamePro' => '',
    //         'statusSix' => '',
    //         'dost' => '',
    //         'patentNumber' => '',
    //         'targetPeople' => '',
    //         'namesBS' => '',
    //         'namesMS' => '',
    //         'namesPhD' => '',
    //         'targetPlaces' => '',
    //         'cooperators' => '',
    //         'international' => '',
    //         'privateSixPS' => '',
    //         'targetPolicy' => '',
    //         'policyRecommendation' => ''
    //     ];
    //     $data = [
    //         'targetPublication' => $this->request->getVar('targetPublication'),
    //         'actualaccomplishmentPeer' => $this->request->getVar('actualaccomplishmentPeer'),
    //         'actualaccomplishmentJournal' => $this->request->getVar('actualaccomplishmentJournal'),
    //         'actualaccomplishmentPresented' => $this->request->getVar('actualaccomplishmentPresented'),
    //         'details' => $this->request->getVar('details'),
    //         'actualaccomplishmentIEC' => $this->request->getVar('actualaccomplishmentIEC'),
    //         'targetProduct' => $this->request->getVar('targetProduct'),
    //         'techName' => $this->request->getVar('techName'),
    //         'techDescription' => $this->request->getVar('techDescription'),
    //         'targetPatent' => $this->request->getVar('targetPatent'),
    //         'agency' => $this->request->getVar('agency'),
    //         'techNamePro' => $this->request->getVar('techNamePro'),
    //         'statusSix' => $this->request->getVar('statusSix'),
    //         'dost' => $this->request->getVar('dost'),
    //         'patentNumber' => $this->request->getVar('patentNumber'),
    //         'targetPeople' => $this->request->getVar('targetPeople'),
    //         'namesBS' => $this->request->getVar('namesBS'),
    //         'namesMS' => $this->request->getVar('namesMS'),
    //         'namesPhD' => $this->request->getVar('namesPhD'),
    //         'targetPlaces' => $this->request->getVar('targetPlaces'),
    //         'cooperators' => $this->request->getVar('cooperators'),
    //         'international' => $this->request->getVar('international'),
    //         'privateSixPS' => $this->request->getVar('privateSixPS'),
    //         'targetPolicy' => $this->request->getVar('targetPolicy'),
    //         'policyRecommendation' => $this->request->getVar('policyRecommendation')
    //     ];
    //     $model = new SixPSModel();
    //     $find = $model->find(['id' => $id]);
    //     if(!$find) return $this->failNotFound('No Data Found');
    //     $model->update($id, $data);
        
    //     $response = [
    //         'status' => 200,
    //         'error' => null,
    //         'messages' => [
    //             'success' => 'Data updated'
    //         ]
    //     ];
    //     return $this->respond($response);
    // }

    public function update($id = null)
    {
        $sixPSData = $this->request->getVar('sixPs');
        $counterparFundModel = new SixPSModel();
        error_log('Received SixPS data: ' . json_encode($sixPSData));

        // Check if SixPS data is present in the request
        if ($sixPSData) {
            foreach ($sixPSData as $item) {
                error_log('Processing item: ' . json_encode($item));
                $year = $item->year;
                $targetPublication = $item->targetPublication;
                $actualaccomplishmentPeer = $item->actualaccomplishmentPeer;
                $actualaccomplishmentJournal = $item->actualaccomplishmentJournal;
                $actualaccomplishmentPresented = $item->actualaccomplishmentPresented;
                $details = $item->details;
                $actualaccomplishmentIEC = $item->actualaccomplishmentIEC;
                $targetProduct = $item->targetProduct;
                $techName = $item->techName;
                $techDescription = $item->techDescription;
                $targetPatent = $item->targetPatent;
                $agency = $item->agency;
                $techNamePro = $item->techNamePro;
                $statusSix = $item->statusSix;
                $dost = $item->dost;
                $patentNumber = $item->patentNumber;
                $targetPeople = $item->targetPeople;
                $namesBS = $item->namesBS;
                $namesMS = $item->namesMS;
                $namesPhD = $item->namesPhD;
                $targetPlaces = $item->targetPlaces;
                $cooperators = $item->cooperators;
                $international = $item->international;
                $privateSixPS = $item->privateSixPS;
                $targetPolicy = $item->targetPolicy;
                $policyRecommendation = $item->policyRecommendation;

                $existingData = $counterparFundModel->where([
                    'project_id' => $id,
                    'year' => $year
                ])->first();

                if ($existingData) {
                    $counterparFundModel->update($existingData['id'], [
                        'targetPublication' => $targetPublication,
                        'actualaccomplishmentPeer' => $actualaccomplishmentPeer,
                        'actualaccomplishmentJournal' => $actualaccomplishmentJournal,
                        'actualaccomplishmentPresented' => $actualaccomplishmentPresented,
                        'details' => $details,
                        'actualaccomplishmentIEC' => $actualaccomplishmentIEC,
                        'targetProduct' => $targetProduct,
                        'techName' => $techName,
                        'techDescription' => $techDescription,
                        'targetPatent' => $targetPatent,
                        'agency' => $agency,
                        'techNamePro' => $techNamePro,
                        'statusSix' => $statusSix,
                        'dost' => $dost,
                        'patentNumber' => $patentNumber,
                        'targetPeople' => $targetPeople,
                        'namesBS' => $namesBS,
                        'namesMS' => $namesMS,
                        'namesPhD' => $namesPhD,
                        'targetPlaces' => $targetPlaces,
                        'cooperators' => $cooperators,
                        'international' => $international,
                        'privateSixPS' => $privateSixPS,
                        'targetPolicy' => $targetPolicy,
                        'policyRecommendation' => $policyRecommendation
                    ]);
                } else {
                    $counterparFundModel->save([
                        'project_id' => $id,
                        'year' => $year,
                        'targetPublication' => $targetPublication,
                        'actualaccomplishmentPeer' => $actualaccomplishmentPeer,
                        'actualaccomplishmentJournal' => $actualaccomplishmentJournal,
                        'actualaccomplishmentPresented' => $actualaccomplishmentPresented,
                        'details' => $details,
                        'actualaccomplishmentIEC' => $actualaccomplishmentIEC,
                        'targetProduct' => $targetProduct,
                        'techName' => $techName,
                        'techDescription' => $techDescription,
                        'targetPatent' => $targetPatent,
                        'agency' => $agency,
                        'techNamePro' => $techNamePro,
                        'statusSix' => $statusSix,
                        'dost' => $dost,
                        'patentNumber' => $patentNumber,
                        'targetPeople' => $targetPeople,
                        'namesBS' => $namesBS,
                        'namesMS' => $namesMS,
                        'namesPhD' => $namesPhD,
                        'targetPlaces' => $targetPlaces,
                        'cooperators' => $cooperators,
                        'international' => $international,
                        'privateSixPS' => $privateSixPS,
                        'targetPolicy' => $targetPolicy,
                        'policyRecommendation' => $policyRecommendation
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
        $sixPSModel = new SixPSModel();
        $sixPSModel->where('project_id', $id)->delete();
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
