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

function getDailyCronExpressions() {
  if (Array.isArray(config.reportTimes) && config.reportTimes.length > 0) {
    return config.reportTimes.map((t) => `${t.minute} ${t.hour} * * *`);
  }

  return [`${config.reportMinute} ${config.reportHour} * * *`];
}

export function startScheduler() {
  const cronExpressions = getDailyCronExpressions();

  console.log(`Scheduler started (${config.timezone})`);
  cronExpressions.forEach((expr, idx) => {
    console.log(`Daily report cron${cronExpressions.length > 1 ? `[${idx + 1}]` : ''}: ${expr}`);
  });

  const displayTimes = cronExpressions
    .map((expr) => {
      const [min, hour] = expr.split(' ');
      return `${String(Number(hour)).padStart(2, '0')}:${String(Number(min)).padStart(2, '0')}`;
    })
    .join(', ');
  console.log(`Daily report interval(s): ${displayTimes}`);

  cronExpressions.forEach((cronExpression) => {
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
  });
}
