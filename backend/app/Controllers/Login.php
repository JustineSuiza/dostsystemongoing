<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use App\Models\UserModel;

class Login extends ResourceController
{
    public function create()
    {
        helper(['form']);

        $rules = [
            'email' => 'required',
            'password' => 'required',
        ];

        $data = [
            'email' => $this->request->getVar('email'),
            'password' => $this->request->getVar('password'),
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $model = new UserModel();
        $user = $model->where('email', $data['email'])
                      ->where('password', $data['password'])
                      ->first();

        if ($user) {
            session()->set('user_id', $user['id']);
            session()->set('logged_in', true);

            // Fetch user_lvl and first name from the database
            $user_lvl = $user['user_lvl'];
            $first_name = $user['first_name'];
            $last_name = $user['last_name'];
            $id = $user['id'];

            return $this->respond(['status' => 200, 'message' => 'Login successful', 'data' => ['user_lvl' => $user_lvl, 'first_name' => $first_name, 'id' => $id, 'last_name' => $last_name]]);
        } else {
            return $this->fail('Invalid email or password', 401);
        }
    }
}
