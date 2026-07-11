import { buildDailyReport, getReportDay } from './src/report.js';
import { startScheduler } from './src/scheduler.js';
import { sendTelegramMessage } from './src/telegram.js';

const args = new Set(process.argv.slice(2));
const sendNow = args.has('--report');
const useYesterday = args.has('--yesterday');

async function sendManualReport() {
  const reportDay = getReportDay({ yesterday: useYesterday });
  const message = await buildDailyReport(reportDay);
  await sendTelegramMessage(message);
  console.log(`Report sent for ${reportDay.toISODate()}`);
}

async function main() {
  if (sendNow) {
    await sendManualReport();
    return;
  }

  startScheduler();
  console.log('Bot is running. Press Ctrl+C to stop.');
}

main().catch((error) => {
  console.error('Bot failed to start:', error.message);
  process.exit(1);
});
