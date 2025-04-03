
function testLogTelegram()
{
  sendTelegramLog("log1");
}


/**
 * Отправка уведомления в Telegram
 */

function sendTelegramLog(logText)
{

    try
    {
             const response = UrlFetchApp.fetch(
            `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'post',
                contentType: 'application/json',
                payload: JSON.stringify({
                    chat_id: CONFIG.ADMIN_CHAT_ID,
                    text: logText,
                    parse_mode: 'Markdown',
                    disable_web_page_preview: false
                }),
                muteHttpExceptions: true
            });
        
        if (response.getResponseCode() !== 200) {
            console.error('Ошибка Telegram API:', response.getContentText());
        }
    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
    }

}


function sendTelegramNotification(data, recordId, fileUrl) {
    if (!CONFIG.TELEGRAM_BOT_TOKEN || !CONFIG.ADMIN_CHAT_ID) return;

    try {
        const text = `📌 Новая статья на модерации\n\n` +
                                 `📝 *${data.title}*\n` +
                                 `🆔 ID: ${recordId}\n` +
                                 `📂 Тип: ${data.type}\n` +
                                 (fileUrl ? `📎 Файл: [Открыть](${fileUrl})\n` : '') +
                                 `\n_${data.text.substring(0, 100)}..._`;
        
        const response = UrlFetchApp.fetch(
            `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'post',
                contentType: 'application/json',
                payload: JSON.stringify({
                    chat_id: CONFIG.ADMIN_CHAT_ID,
                    text: text,
                    parse_mode: 'Markdown',
                    disable_web_page_preview: false
                }),
                muteHttpExceptions: true
            });
        
        if (response.getResponseCode() !== 200) {
            console.error('Ошибка Telegram API:', response.getContentText());
        }
    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
    }
}
