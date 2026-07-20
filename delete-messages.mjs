import 'dotenv/config';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_IDS = [process.env.TELEGRAM_CHAT_ID, ...( process.env.TELEGRAM_CHAT_IDS ? process.env.TELEGRAM_CHAT_IDS.split(',') : [])];

async function sendTemp(chatId) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: '.' }),
  });
  const data = await res.json();
  return data.result.message_id;
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
  for (const chatId of [...new Set(CHAT_IDS)]) {
    console.log(`\n--- Chat: ${chatId} ---`);
    const tempMsgId = await sendTemp(chatId);
    console.log(`Oxirgi xabar ID: ${tempMsgId}`);

    // Oxirgi 20 ta xabarni o'chirishga harakat qilamiz
    for (let id = tempMsgId; id > tempMsgId - 20; id--) {
      const result = await deleteMsg(chatId, id);
      if (result.ok) {
        console.log(`Xabar #${id} o'chirildi ✅`);
      }
    }
  }
  console.log('\nTayyor!');
}

main().catch(console.error);
