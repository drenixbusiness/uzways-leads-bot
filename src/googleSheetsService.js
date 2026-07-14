import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadServiceAccountJson(value) {
  const trimmed = value.trim();

  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }

  const filePath = path.isAbsolute(trimmed)
    ? trimmed
    : path.resolve(process.cwd(), trimmed);

  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function getServiceAccountConfig() {
  if (config.googleServiceAccountJson) {
    return loadServiceAccountJson(config.googleServiceAccountJson);
  }

  if (config.googleServiceAccountEmail && config.googleServiceAccountPrivateKey) {
    return {
      client_email: config.googleServiceAccountEmail,
      private_key: config.googleServiceAccountPrivateKey.replace(/\\n/g, '\n'),
    };
  }

  throw new Error('Missing Google service account credentials');
}

export async function fetchGoogleSheetRows() {
  const serviceAccount = getServiceAccountConfig();

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.googleSheetId,
    range: 'Sheet1!A:D',
  });

  const rows = response.data.values || [];
  if (rows.length === 0) {
    return [];
  }

  const [headers, ...dataRows] = rows;
  return dataRows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ''])));
}
