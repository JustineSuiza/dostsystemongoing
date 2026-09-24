<?php
namespace App\Controllers;

use CodeIgniter\API\ResponseTrait;
use App\Models\UserModel; // Replace 'YourModel' with your actual model name



class EmailController extends BaseController
{
    use ResponseTrait;

    public function checkEmail()
    {
        $email = $this->request->getVar('email');
        $model = new UserModel(); // Replace 'YourModel' with your actual model name

        $exists = $model->where('email', $email)->countAllResults() > 0;

        return $this->respond(['exists' => $exists], 200);
    }

    public function sendEmail()
{
    $email = \Config\Services::email();
    $model = new UserModel();

    $from = 'dostiarrd@gmail.com';
    $to = $this->request->getVar('to');

    // Retrieve the user from the database
    $user = $model->where('email', $to)->first();

    if (!$user) {
        return $this->respond(['error' => 'User not found'], 404);
    }

    // Generate a random reset token
    $resetToken = bin2hex(random_bytes(50));

    // Store the reset token in the database
    $user['reset_token'] = $resetToken;
    $model->save($user);

    // Create a reset link with the email and token as query parameters
    $resetLink = "http://localhost:3000/reset-password?email=" . urlencode($to) . "&token=" . urlencode($resetToken);

    $resetParagraph = "You recently requested a password reset. To proceed with resetting your password, please click the 'Reset Password' button below. If you did not make this request, you can safely ignore this email.";
    $message = "
    <html>
    <head>
      <style>
        .container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
          text-align: center;
        }
        .header {
          background-color: #007bff;
          color: #ffffff;
          padding: 20px;
          border-top-left-radius: 10px;
          border-top-right-radius: 10px;
        }
        .content {
          padding: 20px;
          background-color: #f4f4f4;
          border-bottom-left-radius: 10px;
          border-bottom-right-radius: 10px;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #007bff;
          color: #ffffff;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class='container'>
        <div class='header'>
          <h2>Password Reset</h2>
        </div>
        <div class='content'>
          <p>Hello,</p>
          <p>You have requested to reset your password. Please click the button below to reset your password:</p>
          <p><a href='{$resetLink}' class='button'>Reset Password</a></p>
          <p>If you didn't initiate this request, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
    ";
    


    $email->setFrom($from);
    $email->setTo($to);
    $email->setSubject('Password Reset');
    $email->setMessage($message);

    $email->setMailType('html'); 

    if ($email->send()) {
        return $this->respond(['message' => 'Email sent successfully', 'resetLink' => $resetLink], 200);
    } else {
        return $this->respond(['error' => $email->printDebugger()], 500);
    }
}

public function resetPassword()
{
    $model = new UserModel();

    $email = $this->request->getVar('email');
    $token = $this->request->getVar('token');
    $password = $this->request->getVar('password');

    // Retrieve the user from the database using the email
    $user = $model->where('email', $email)->first();

    if (!$user || $user['reset_token'] !== $token) {
        return $this->respond(['error' => 'Invalid reset link'], 400);
    }

    // Store the password as plain text
    $user['password'] = $password;
    $user['reset_token'] = null; // Clear the reset token

    $model->save($user);

    return $this->respond(['message' => 'Password reset successfully'], 200);
}

}
