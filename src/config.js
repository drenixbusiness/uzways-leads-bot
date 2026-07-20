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

function parseTelegramChatIds() {
  const ids = [];

  for (const envKey of ['TELEGRAM_CHAT_ID', 'TELEGRAM_CHAT_IDS']) {
    const value = process.env[envKey];
    if (!value) continue;

    ids.push(
      ...value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
    );
  }

  return [...new Set(ids)];
}

const telegramChatIds = parseTelegramChatIds();

if (telegramChatIds.length === 0) {
  throw new Error('Missing required environment variable: TELEGRAM_CHAT_ID');
}

export const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: telegramChatIds[0],
  telegramChatIds,
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
  testMode: process.env.TEST_MODE === 'true',
};
