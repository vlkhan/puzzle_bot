

/**
 * Обработчик GET запросов (для веб-интерфейса)
 */
function doGet(e) { 
    
  var dataJson = JSON.stringify(e);
  sendTelegramLog(dataJson);

}

/**
 * Основной обработчик POST запросов
 */
function doPost(e) {
  try {
    // Логируем входящий запрос
    console.log("Received request:", JSON.stringify(e));
    //sendTelegramLog("Incoming request type: " + (e.postData?.type || "unknown"));

    let data = {};
    let fileUrl = null;

   
    // 1. Определяем тип контента и парсим данные
    const contentType = e.postData.type || 'text/plain';
    
    if (contentType.includes('multipart/form-data')) {
      // Обработка формы с файлом
      const parsedData = parseMultipartFormData(e);
      data = parsedData.fields;
      
      if (parsedData.file) {
        fileUrl =  uploadToDriveFile(parsedData.file);
        sendTelegramLog("File uploaded to:", fileUrl);
      }
    } 
    else if (contentType.includes('application/json') || contentType.includes('text/plain')) {
      // Обработка JSON или plain text
      try {
        data = JSON.parse(e.postData.contents);
      } catch (e) {
        // Если не JSON, пробуем прочитать как plain text
        data = { content: e.postData.contents };
      }
      
      // Обработка файла в base64, если есть
      if (data.file && data.file.data) {
        fileUrl = uploadFileFromBase64(data.file);
        console.log("File from JSON uploaded to:", fileUrl);
      }
    } 
    else {
      throw new Error("Unsupported content type: " + contentType);
    }

    // 2. Валидация обязательных полей
    const requiredFields = ['title', 'text', 'type'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error("Missing required fields: " + missingFields.join(', '));
    }

    // 3. Запись в таблицу
    const recordId = writeToSpreadsheet(data, fileUrl);

    sendTelegramNotification(data,fileUrl);

    console.log("Data saved, record ID:", recordId);

    // 4. Успешный ответ
    const response = { 
      success: true,
      recordId: recordId,
      fileUrl: fileUrl 
    };
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error("Error:", error.message);
    sendTelegramLog("ERROR: " + error.message);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}




/**
 * Парсит multipart/form-data запрос
 * @param {Object} e - Объект запроса
 * @return {Object} Распарсенные данные формы
 */
function parseMultipartFormData(e) {
  const boundary = e.postData.type.split('boundary=')[1];
  const parts = e.postData.contents.split('--' + boundary);
  const result = {
    fields: {},
    file: null
  };

  parts.forEach(part => {
    if (!part.trim()) return;

    // Обработка заголовков
    const headers = {};
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) return;

    const headerText = part.substring(0, headerEnd);
    headerText.split('\r\n').forEach(line => {
      if (line.includes(':')) {
        const [name, value] = line.split(':');
        headers[name.trim().toLowerCase()] = value.trim();
      }
    });

    // Извлечение содержимого
    const body = part.substring(headerEnd + 4, part.lastIndexOf('\r\n'));

    // Проверка на файл
    const disposition = headers['content-disposition'];
    if (!disposition) return;

    const nameMatch = disposition.match(/name="([^"]+)"/);
    if (!nameMatch) return;

    const fieldName = nameMatch[1];

    if (disposition.includes('filename="')) {
      // Это файл
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const contentType = headers['content-type'] || 'application/octet-stream';
      
      result.file = {
        fieldName: fieldName,
        filename: filenameMatch ? filenameMatch[1] : 'file',
        mimeType: contentType,
        bytes: Utilities.newBlob(body).getBytes()
      };
    } else {
      // Текстовое поле
      result.fields[fieldName] = body;
    }
  });

  return result;
}

/**
 * Тестовая функция с полной имитацией multipart запроса
 */
function testDoPostWithMockImage() {
  try {
    // 1. Загружаем тестовое изображение
    const imageUrl = "https://upload.wikimedia.org/wikipedia/en/a/a6/Pok%C3%A9mon_Pikachu_art.png";
    const imageResponse = UrlFetchApp.fetch(imageUrl);
    const imageData = imageResponse.getContent();
    
    // 2. Создаем границу для multipart
    const boundary = "----WebKitFormBoundary" + Utilities.getUuid();
    const crlf = "\r\n";
    
    // 3. Тестовые данные для полей формы
    const formData = {
      title: "Тестовый заголовок",
      text: "Это тестовое содержимое",
      type: "Мероприятие"
    };
    
    // 4. Формируем тело запроса
    const payload = [
      // Поле title
      `--${boundary}${crlf}` +
      `Content-Disposition: form-data; name="title"${crlf}${crlf}` +
      `${formData.title}${crlf}`,
      
      // Поле text
      `--${boundary}${crlf}` +
      `Content-Disposition: form-data; name="text"${crlf}${crlf}` +
      `${formData.text}${crlf}`,
      
      // Поле type
      `--${boundary}${crlf}` +
      `Content-Disposition: form-data; name="type"${crlf}${crlf}` +
      `${formData.type}${crlf}`,
      
      // Файл изображения
      `--${boundary}${crlf}` +
      `Content-Disposition: form-data; name="file"; filename="pikachu.png"${crlf}` +
      `Content-Type: image/png${crlf}${crlf}`,
      
      imageData,
      
      `${crlf}--${boundary}--${crlf}`
    ].join("");

    // 5. Создаем моковый запрос
    const mockRequest = {
      postData: {
        type: `multipart/form-data; boundary=${boundary}`,
        contents: payload,
        length: payload.length
      }
    };

    // 6. Вызываем doPost
    const result = doPost(mockRequest);
    const response = JSON.parse(result.getContent());
    
    console.log("Тест успешен. Результат:", response);
    console.log("Отправленные данные:", formData);
    
    return {
      response: response,
      sentData: formData
    };
    
  } catch (error) {
    console.error("Ошибка тестирования:", error);
    throw error;
  }
}