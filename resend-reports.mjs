import { DateTime } from 'luxon';
import { config } from './src/config.js';
import { buildDailyReport } from './src/report.js';
import { sendTelegramMessageTo } from './src/telegram.js';

const targets = [
  { chatId: '-1003775349340', days: 13 },
  { chatId: '-1004434260494', days: 5 },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resendForChat(chatId, days) {
  console.log(`\n=== ${chatId}: ${days} ta hisobot yuborilmoqda ===`);

  for (let offset = days; offset >= 1; offset -= 1) {
    const reportDay = DateTime.now()
      .setZone(config.timezone)
      .minus({ days: offset })
      .startOf('day');

    const message = await buildDailyReport(reportDay);
    await sendTelegramMessageTo(chatId, message);
    console.log(`✅ ${reportDay.toISODate()} yuborildi`);

    await sleep(1500);
  }
}

async function main() {
  for (const { chatId, days } of targets) {
    await resendForChat(chatId, days);
  }

  console.log('\nBarcha hisobotlar qayta yuborildi.');
}

main().catch((error) => {
  console.error('Xato:', error.message);
  process.exit(1);
});
