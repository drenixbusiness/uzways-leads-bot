import { config } from './config.js';

async function sendToChat(chatId, text) {
  const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.description || `Telegram API error (${response.status})`);
  }

  return data;
}

export async function sendTelegramMessageTo(chatId, text) {
  if (config.testMode) {
    console.log(`TEST REJIMI: Xabar yuborilmadi (${chatId})`);
    console.log(text);
    return { ok: true, testMode: true, chatId };
  }

  return sendToChat(chatId, text);
}

export async function sendTelegramMessage(text) {
  if (config.testMode) {
    for (const chatId of config.telegramChatIds) {
      console.log(`TEST REJIMI: Xabar yuborilmadi (${chatId})`);
    }
    console.log(text);
    return config.telegramChatIds.map((chatId) => ({ ok: true, testMode: true, chatId }));
  }

  const results = [];
  const errors = [];

  for (const chatId of config.telegramChatIds) {
    try {
      results.push(await sendToChat(chatId, text));
    } catch (error) {
      errors.push(`${chatId}: ${error.message}`);
    }
  }

  if (results.length === 0) {
    throw new Error(errors.join(' | ') || 'Failed to send Telegram message');
  }

  if (errors.length > 0) {
    console.warn(`Telegram delivery warnings: ${errors.join(' | ')}`);
  }

  return results;
}
