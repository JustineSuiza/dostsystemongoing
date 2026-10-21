/**
 * DOST System — Excel email sender (Google Apps Script web app)
 * -------------------------------------------------------------
 * The live site (Firebase Hosting) is static and has no PHP backend, so the
 * scheduled/manual "Send Now" Excel report is sent through this web app
 * instead. It emails from your Gmail account, so each report appears in your
 * Gmail Sent folder.
 *
 * SETUP (about 2 minutes):
 *  1. Go to https://script.google.com  (use the justinesuiza1@gmail.com account)
 *  2. New project → rename it "DOST Excel Email" (optional)
 *  3. Delete the default Code.gs contents and paste this whole file in.
 *  4. Deploy → New deployment → click the gear icon → "Web app":
 *       - Execute as:  Me (justinesuiza1@gmail.com)
 *       - Who has access:  Anyone
 *     → Deploy
 *  5. Authorize when prompted (Advanced → Go to "DOST Excel Email" (unsafe)
 *     is normal — it's your own script).
 *  6. Copy the Web app URL (it ends with /exec) and give it to the developer
 *     to put in frontend/src/autoSendScheduler.js (EXCEL_EMAIL_ENDPOINT).
 *
 * VERIFY: open the /exec URL in a browser — you should see
 *   {"ok":true,"service":"dost-excel-email"}
 */

var SHARED_TOKEN = 'dost-excel-send-2026'; // must match EXCEL_EMAIL_ENDPOINT request in autoSendScheduler.js
var MAX_BASE64_CHARS = 12 * 1024 * 1024; // ~8MB of Excel data after base64

function doGet() {
  return json_({ ok: true, service: 'dost-excel-email' });
}

function doPost(e) {
  try {
    var payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (payload.token !== SHARED_TOKEN) {
      return json_({ ok: false, error: 'Unauthorized request.' });
    }
    if (!payload.to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(payload.to))) {
      return json_({ ok: false, error: 'Valid recipient email is required.' });
    }
    if (!payload.contentBase64 || String(payload.contentBase64).length > MAX_BASE64_CHARS) {
      return json_({ ok: false, error: 'Excel file content is missing or too large (max 8MB).' });
    }

    var fileName = String(payload.fileName || 'DOST-Projects.xlsx').replace(/[^A-Za-z0-9._-]/g, '_');
    if (!/\.xlsx$/i.test(fileName)) {
      fileName += '.xlsx';
    }

    var bytes = Utilities.base64Decode(String(payload.contentBase64));
    var attachment = Utilities.newBlob(
      bytes,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileName
    );

    var message = String(payload.message || 'Please find attached the DOST projects Excel report.');
    var html =
      '<html><body style="font-family: Arial, sans-serif;">' +
      '<h2>DOST Projects Report</h2>' +
      '<p>' + message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>') + '</p>' +
      '<p>This report was generated automatically by the DOST System.</p>' +
      '</body></html>';

    MailApp.sendEmail({
      to: payload.to,
      subject: String(payload.subject || 'DOST Projects Report'),
      htmlBody: html,
      attachments: [attachment],
    });

    return json_({ ok: true, message: 'Email sent successfully' });
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
