<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class CheckLoggedIn extends CI_Controller {
    
    public function __construct() {
        parent::__construct();
        $this->load->library('session');
    }

    public function index() {
        $loggedIn = $this->session->userdata('user_id') ? true : false;

        $response = array(
            'loggedIn' => $loggedIn,
        );

        header('Content-Type: application/json');
        echo json_encode($response);
    }
}
