import 'dotenv/config';

const required = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'GOOGLE_SHEET_ID'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  googleSheetId: process.env.GOOGLE_SHEET_ID,
  timezone: process.env.TIMEZONE || 'America/Chicago',
  reportHour: Number(process.env.REPORT_HOUR ?? 0),
  reportMinute: Number(process.env.REPORT_MINUTE ?? 1),
};
