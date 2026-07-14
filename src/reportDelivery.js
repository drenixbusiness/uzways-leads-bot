import { buildDailyReport, getReportDay } from './report.js';
import { sendTelegramMessage } from './telegram.js';

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
    console.log(`Report sent to Telegram for ${reportDay.toISODate()}`);
  }

  return { reportDay, message };
}
