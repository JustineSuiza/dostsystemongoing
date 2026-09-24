<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Logout extends CI_Controller {
    
    public function __construct() {
        parent::__construct();
        $this->load->library('session');
    }

    public function index() {
        $this->session->sess_destroy();
        
        error_log('Logout successful');
        
        $response = array(
            'success' => true,
            'message' => 'Logout successful'
        );
        header('Content-Type: application/json');
        echo json_encode($response);
    }
}
