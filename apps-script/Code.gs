// ============================================================
// VVS Power — Lead Intake (Google Apps Script Web App)
// ============================================================
// Deploy: Extensions > Apps Script > Deploy > Web app
//   Execute as: Me
//   Who has access: Anyone
//
// After deploying, copy the web app URL and paste it into
// index.html where it says PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE
// ============================================================

// --- CONFIG — fill these in before deploying ---
var CONFIG = {
  TELEGRAM_BOT_TOKEN: '8645545256:AAEVNwgEpmT9A9STih40Ybv2K8Uy5yWzE3s',
  TELEGRAM_CHAT_ID:   '-1003834770003',
  TELEGRAM_TOPIC_ID:  3,  // topic/thread ID from group with topics enabled
  SPREADSHEET_ID:     '1ROO9M9awCGycMJzabCqdpsdd0LMsXpaQXscUU_6HZwI',
  SHEET_NAME:         'Leads'
};

// --- Main handler ---
function doPost(e) {
  try {
    var p = e.parameter;

    var firstName   = (p.firstName   || '').trim();
    var lastName    = (p.lastName    || '').trim();
    var email       = (p.email       || '').trim();
    var phone       = (p.phone       || '').trim();
    var honeypot    = (p.website     || '').trim();
    var pageUrl     = (p.pageUrl     || '');
    var submittedAt = (p.submittedAt || '');

    var receivedAt = Utilities.formatDate(
      new Date(),
      'Africa/Nairobi',
      'yyyy-MM-dd HH:mm:ss'
    );

    // --- Spam check ---
    if (honeypot !== '') {
      appendRow(receivedAt, firstName, lastName, email, phone, pageUrl, submittedAt, 'spam');
      return jsonResponse({ ok: true, status: 'spam', message: 'Flagged as spam.' });
    }

    // --- Validation ---
    if (!firstName || !email || !phone) {
      appendRow(receivedAt, firstName, lastName, email, phone, pageUrl, submittedAt, 'error');
      return jsonResponse({ ok: false, status: 'error', message: 'Missing required fields.' });
    }

    // --- Save to Sheet ---
    appendRow(receivedAt, firstName, lastName, email, phone, pageUrl, submittedAt, 'accepted');

    // --- Send Telegram alert ---
    var status = 'accepted';
    try {
      sendTelegram(firstName, lastName, email, phone, pageUrl, receivedAt);
    } catch (tgErr) {
      status = 'error';
      // Row is already written — update status column for this row
      Logger.log('Telegram error: ' + tgErr.message);
    }

    return jsonResponse({ ok: true, status: status, message: 'Lead received.' });

  } catch (err) {
    Logger.log('doPost error: ' + err.message);
    return jsonResponse({ ok: false, status: 'error', message: err.message });
  }
}

// --- Append a row to the Leads sheet ---
function appendRow(receivedAt, firstName, lastName, email, phone, pageUrl, submittedAt, status) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  // Create sheet with headers if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow([
      'receivedAt', 'firstName', 'lastName', 'email',
      'phone', 'pageUrl', 'submittedAt', 'status'
    ]);
  }

  sheet.appendRow([
    receivedAt, firstName, lastName, email,
    phone, pageUrl, submittedAt, status
  ]);
}

// --- Send Telegram message ---
function sendTelegram(firstName, lastName, email, phone, pageUrl, receivedAt) {
  var fullName = firstName + (lastName ? ' ' + lastName : '');

  var text = '⚡ New Solar Lead\n\n'
    + 'Name: ' + fullName + '\n'
    + 'Phone: ' + phone + '\n'
    + 'Email: ' + email + '\n'
    + 'Page: ' + pageUrl + '\n'
    + 'Time: ' + receivedAt + ' (Nairobi)';

  var url = 'https://api.telegram.org/bot' + CONFIG.TELEGRAM_BOT_TOKEN + '/sendMessage';

  var payload = {
    chat_id: CONFIG.TELEGRAM_CHAT_ID,
    message_thread_id: CONFIG.TELEGRAM_TOPIC_ID,
    text: text
  };

  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

// --- JSON response helper ---
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Test function (run manually in Apps Script editor) ---
function testDoPost() {
  var mockEvent = {
    parameter: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+254700000000',
      website: '',
      pageUrl: 'https://vvspower.today',
      submittedAt: new Date().toISOString()
    }
  };
  var result = doPost(mockEvent);
  Logger.log(result.getContent());
}
