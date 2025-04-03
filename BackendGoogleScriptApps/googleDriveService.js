/**
 * Запись данных в Google Sheets
 */
function writeToSpreadsheet(data, fileUrl) {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
        .getSheetByName(CONFIG.SHEET_NAME);
    
    const recordId = Utilities.formatString('%08d', sheet.getLastRow() + 1);
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm:ss');
    
    sheet.appendRow([
        recordId,          // ID_article
        timestamp,         // date
        data.title,        // title
        data.text,         // text
        fileUrl || '',     // image
        data.study || '',  // study
        data.type,         // type
        'На модерации'     // status
    ]);
    
    return recordId;
}

 /**
 * Загружает Blob в указанную папку Google Drive
 * @param {GoogleAppsScript.Base.Blob} blob - Файл для загрузки
 * @param {string} folderId - ID папки (если не указан - корень Drive)
 * @return {GoogleAppsScript.Drive.File} Загруженный файл
 */
/**
 * Загружает файл в указанную папку Google Drive
 * @param {GoogleAppsScript.Base.Blob} blob - Blob объект файла
 * @param {string} folderId - ID папки в Google Drive
 * @return {GoogleAppsScript.Drive.File} Загруженный файл
 */
function uploadToDrive(blob) {
  try {
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    
    // Правильное создание файла из Blob
    const file = folder.createFile(blob);
    
    console.log('Файл успешно загружен:');
    console.log('↳ Название:', file.getName());
    console.log('↳ URL:', file.getUrl());
    
    return file;
  } catch (error) {
    console.error('Ошибка загрузки:', error.message);
    throw error;
  }
}

function uploadToDriveFile(fileData, folderId) {
  try {
    // 1. Проверка входных данных
    if (!fileData || !fileData.bytes || !fileData.filename) {
      throw new Error("Некорректные данные файла");
    }

    // 2. Создаем Blob
    const blob = Utilities.newBlob(
      fileData.bytes,
      fileData.mimeType || 'application/octet-stream',
      fileData.filename
    );
    return uploadToDrive(blob).getUrl();
  }
  catch(error)
  {
    testLogTelegram(error)
  }
}

 
