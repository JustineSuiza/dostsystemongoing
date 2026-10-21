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

    $from = 'justinesuiza1@gmail.com';
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
    $frontendBase = rtrim(getenv('frontend.baseURL') ?: 'https://justinez.web.app', '/');
    $resetLink = $frontendBase . "/reset-password?email=" . urlencode($to) . "&token=" . urlencode($resetToken);

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

    /**
     * Sends the DOST projects Excel file (built by the frontend) to an
     * account email address as an attachment. Used by the automatic
     * scheduled "auto-send Project Excel" feature on the Accounts page.
     */
    public function sendEmailExcel()
    {
        $to = $this->request->getVar('to');
        $subject = $this->request->getVar('subject') ?: 'DOST Projects Report';
        $message = $this->request->getVar('message') ?: 'Please find attached the DOST projects Excel report.';
        $fileName = $this->request->getVar('fileName') ?: 'DOST-Projects.xlsx';
        $contentBase64 = $this->request->getVar('contentBase64');

        if (!$to || !$contentBase64) {
            return $this->respond(['error' => 'Recipient email and Excel file are required'], 400);
        }

        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return $this->respond(['error' => 'Invalid recipient email address'], 400);
        }

        $binary = base64_decode($contentBase64, true);
        if ($binary === false || $binary === '') {
            return $this->respond(['error' => 'Invalid Excel file content'], 400);
        }

        if (strlen($binary) > 8 * 1024 * 1024) {
            return $this->respond(['error' => 'Excel file is too large (max 8MB)'], 400);
        }

        $attachDir = WRITEPATH . 'attachments' . DIRECTORY_SEPARATOR;
        if (!is_dir($attachDir)) {
            mkdir($attachDir, 0777, true);
        }

        $safeName = preg_replace('/[^A-Za-z0-9._-]/', '_', basename($fileName));
        if (substr(strtolower($safeName), -5) !== '.xlsx') {
            $safeName .= '.xlsx';
        }
        $filePath = $attachDir . uniqid('report_', true) . '_' . $safeName;
        file_put_contents($filePath, $binary);

        $email = \Config\Services::email();
        $email->setFrom('justinesuiza1@gmail.com', 'DOST-iARRD System');
        $email->setTo($to);
        $email->setSubject($subject);
        $email->setMessage(
            '<html><body style="font-family: Arial, sans-serif;">'
            . '<h2>DOST Projects Report</h2>'
            . '<p>' . nl2br(htmlspecialchars($message)) . '</p>'
            . '<p>This report was generated automatically by the DOST System.</p>'
            . '</body></html>'
        );
        $email->setMailType('html');
        $email->attach($filePath, 'attachment', $safeName);

        $sent = $email->send();

        if (is_file($filePath)) {
            @unlink($filePath);
        }

        if ($sent) {
            return $this->respond(['message' => 'Email sent successfully'], 200);
        }

        return $this->respond(['error' => 'Unable to send email'], 500);
    }

}
