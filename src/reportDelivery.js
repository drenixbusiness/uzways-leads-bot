import { buildDailyReport, getReportDay } from './report.js';
import { sendTelegramMessage } from './telegram.js';
import { config } from './config.js';

export async function runReport({ send = false, yesterday = false, preview = true } = {}) {
  const reportDay = getReportDay({ yesterday });
  const message = await buildDailyReport(reportDay);

  if (preview) {
    console.log('=== REPORT PREVIEW ===');
    console.log(message);
    console.log('=== END REPORT ===');
  }

  if (send) {
    await sendTelegramMessage(message);
    if (config.testMode) {
      console.log(`TEST REJIMI: Hisobot Telegramga yuborilmadi (${reportDay.toISODate()})`);
    } else {
      console.log(`Report sent to Telegram for ${reportDay.toISODate()}`);
    }
  }

  return { reportDay, message };
}
