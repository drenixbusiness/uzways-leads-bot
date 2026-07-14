import { startScheduler } from './src/scheduler.js';
import { runReport } from './src/reportDelivery.js';

const args = new Set(process.argv.slice(2));
const sendNow = args.has('--report');
const useYesterday = args.has('--yesterday');
const sendToTelegram = args.has('--send');

async function sendManualReport() {
  await runReport({
    send: sendToTelegram || sendNow,
    yesterday: useYesterday,
    preview: true,
  });
}

async function main() {
  if (sendNow || sendToTelegram) {
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
