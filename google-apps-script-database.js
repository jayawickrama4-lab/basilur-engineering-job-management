const SHEET_NAME = "BasilurSharedDatabase";

function doGet() {
  const sheet = getDatabaseSheet();
  const storedJson = sheet.getRange("A1").getValue();
  const data = storedJson ? JSON.parse(storedJson) : createEmptyDatabase();

  return jsonResponse(data);
}

function doPost(event) {
  const sheet = getDatabaseSheet();
  const payload = event?.postData?.contents ? JSON.parse(event.postData.contents) : createEmptyDatabase();

  payload.updatedAt = new Date().toISOString();
  sheet.getRange("A1").setValue(JSON.stringify(payload));

  return jsonResponse({
    ok: true,
    updatedAt: payload.updatedAt
  });
}

function getDatabaseSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.hideSheet();
  }

  return sheet;
}

function createEmptyDatabase() {
  return {
    app: "basilur-engineering-job-management",
    version: 1,
    updatedAt: new Date().toISOString(),
    jobs: [],
    technicians: [],
    emailRoles: []
  };
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
