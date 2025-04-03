/**
 * Скачивает изображение по URL и возвращает Blob
 * @param {string} imageUrl - Ссылка на изображение
 * @return {GoogleAppsScript.Base.Blob} Blob изображения
 */
function downloadImage(imageUrl) {
    try {
      const response = UrlFetchApp.fetch(imageUrl, { muteHttpExceptions: true });
      
      if (response.getResponseCode() !== 200) {
        throw new Error(`HTTP ${response.getResponseCode()}`);
      }
      
      const contentType = response.getHeaders()['Content-Type'];
      const fileName = imageUrl.split('/').pop() || `image_${Date.now()}`;
      
      return response.getBlob()
        .setName(fileName)
        .setContentType(contentType);
        
    } catch (error) {
      console.error('Ошибка скачивания:', error.message);
      throw error;
    }
  }
  
  
  // Функция для загрузки файла из base64
  function uploadFileFromBase64(fileData) {
    try {
      const bytes = Utilities.base64Decode(fileData.data);
      const blob = Utilities.newBlob(bytes, fileData.mimeType || 'application/octet-stream', fileData.filename || 'file');
      const folder = DriveApp.getFolderById('YOUR_FOLDER_ID'); // Замените на ваш ID папки
      const file = folder.createFile(blob);
      return file.getUrl();
    } catch (e) {
      throw new Error("File upload failed: " + e.message);
    }
  }
  
  
  function testImageUpload() {
  // 1. Проверка типа файла
    if (!sourceFile || !sourceFile.getId || typeof sourceFile.getId !== 'function') {
      throw new Error("Ожидается объект файла Google Drive. Получите его через DriveApp.getFileById() или аналогичные методы");
    }
  
    // 2. Проверка и получение папки
    const targetFolder = DriveApp.getFolderById(targetFolderId);
    
    // 3. Создание копии
    try {
      const copiedFile = sourceFile.makeCopy(targetFolder);
      console.log(`Файл "${sourceFile.getName()}" скопирован в папку ${targetFolder.getName()}`);
      return copiedFile;
    } catch (error) {
      console.error(`Ошибка копирования: ${error.message}`);
      throw error;
    }
     
  }