<?php
namespace App\Controllers;

use CodeIgniter\API\ResponseTrait;

class ForgotPassword extends BaseController
{
    use ResponseTrait;

    public function index()
    {
        $email = \Config\Services::email();

        $request = $this->request->getJSON();

        $userEmail = $request->email;

        $email->setFrom('floresmarvin733@gmail.com', 'Marvin');
        $email->setTo($userEmail);
        $email->setSubject('Reset Password');
        $email->setMessage('Here is your password reset link.');

        if ($email->send()) {
            return $this->respond(['status' => 200, 'message' => 'Email sent successfully']);
        } else {
            return $this->respond(['status' => 500, 'message' => 'Failed to send email']);
        }
    }
}
