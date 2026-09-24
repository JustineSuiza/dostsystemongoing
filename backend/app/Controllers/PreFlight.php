<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;

class PreFlight extends BaseController
{
    public function index()
    {
        //
    }

    public function options()
    {
      return $this->response->setStatusCode(200);
    }
}
