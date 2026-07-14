import 'dotenv/config';

const required = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'GOOGLE_SHEET_ID'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

function parseReportTimes(env) {
  if (!env) return undefined;
  return env
    .split(',')
    .map((t) => {
      const parts = t.trim().split(':');
      const hour = Number(parts[0]);
      const minute = Number(parts[1] ?? 0);
      return { hour, minute };
    })
    .filter(({ hour, minute }) => Number.isFinite(hour) && Number.isFinite(minute));
}

export const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  googleSheetId: process.env.GOOGLE_SHEET_ID,
  googleSheetCsvUrl: process.env.GOOGLE_SHEET_CSV_URL,
  googleSheetProxyUrl: process.env.GOOGLE_SHEET_PROXY_URL,
  googleServiceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
  googleServiceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  googleServiceAccountPrivateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  googleApiKey: process.env.GOOGLE_API_KEY,
  timezone: process.env.TIMEZONE || 'America/Chicago',
  reportHour: Number(process.env.REPORT_HOUR ?? 0),
  reportMinute: Number(process.env.REPORT_MINUTE ?? 1),
  // REPORT_TIMES: comma-separated list like "08:00,12:00,16:30"
  reportTimes: parseReportTimes(process.env.REPORT_TIMES),
};
