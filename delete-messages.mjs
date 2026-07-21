import 'dotenv/config';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_IDS = [process.env.TELEGRAM_CHAT_ID, ...(process.env.TELEGRAM_CHAT_IDS ? process.env.TELEGRAM_CHAT_IDS.split(',') : [])];
const DATE_PATTERNS = [/07\/21\/2026/i, /07 21 2026/i, /july 21, 2026/i, /2026-07-21/i];

function matchesDate(text) {
  if (!text) return false;
  const normalized = text.replace(/\s+/g, ' ').trim();
  return DATE_PATTERNS.some((pattern) => pattern.test(normalized));
}

async function fetchAllUpdates() {
  const allUpdates = [];
  let offset = 0;

  while (true) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=100&offset=${offset}&allowed_updates=%5B%22message%22,%22channel_post%22%5D`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.description || 'Failed to fetch Telegram updates');
    }

    const updates = data.result || [];
    if (updates.length === 0) {
      break;
    }

    allUpdates.push(...updates);
    offset = updates[updates.length - 1].update_id + 1;
  }

  return allUpdates;
}

async function deleteMsg(chatId, msgId) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: msgId }),
  });

  return res.json();
}

async function main() {
  const updates = await fetchAllUpdates();
  const uniqueChatIds = [...new Set(CHAT_IDS.filter(Boolean))];

  for (const chatId of uniqueChatIds) {
    console.log(`\n--- Chat: ${chatId} ---`);

    const matchingMessages = updates
      .filter((update) => update.message?.chat?.id?.toString() === chatId.toString())
      .map((update) => update.message)
      .filter((message) => {
        const text = message?.text || message?.caption || '';
        return matchesDate(text);
      });

    if (matchingMessages.length === 0) {
      console.log('Hech qanday mos xabar topilmadi.');
      continue;
    }

    for (const message of matchingMessages) {
      const result = await deleteMsg(chatId, message.message_id);
      if (result.ok) {
        console.log(`Xabar #${message.message_id} o'chirildi ✅`);
      } else {
        console.log(`Xabar #${message.message_id} o'chirishda xatolik: ${result.description || 'unknown error'}`);
      }
    }
  }

  console.log('\nTayyor!');
}

main().catch(console.error);
