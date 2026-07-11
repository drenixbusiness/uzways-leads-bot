import { config } from './config.js';
import cron from 'node-cron';
import { buildDailyReport, getReportDay } from './report.js';
import { sendTelegramMessage } from './telegram.js';

export async function sendScheduledReport() {
  const reportDay = getReportDay();
  const message = await buildDailyReport(reportDay);
  await sendTelegramMessage(message);
  console.log(`[${new Date().toISOString()}] Daily report sent for ${reportDay.toISODate()}`);
}

function getDailyCronExpression() {
  return `${config.reportMinute} ${config.reportHour} * * *`;
}

export function startScheduler() {
  const cronExpression = getDailyCronExpression();

  console.log(`Scheduler started (${config.timezone})`);
  console.log(`Daily report cron: ${cronExpression}`);
  console.log(
    `Daily report interval: every 24 hours at ${String(config.reportHour).padStart(2, '0')}:${String(config.reportMinute).padStart(2, '0')}`,
  );

  cron.schedule(
    cronExpression,
    async () => {
      try {
        await sendScheduledReport();
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Failed to send daily report:`, error.message);
      }
    },
    {
      scheduled: true,
      timezone: config.timezone,
    },
  );
}
