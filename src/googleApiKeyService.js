import { config } from './config.js';

export async function fetchGoogleSheetWithApiKey() {
  const apiKey = config.googleApiKey;
  const sheetId = config.googleSheetId;

  if (!apiKey || !sheetId) {
    throw new Error('Missing GOOGLE_API_KEY or GOOGLE_SHEET_ID');
  }

  const range = '33!A:Z';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Google Sheets API request failed (${response.status})${errorText ? `: ${errorText.slice(0, 200)}` : ''}`);
  }

  const data = await response.json();
  const rows = data.values || [];

  if (rows.length === 0) {
    return [];
  }

  const [headers, ...dataRows] = rows;
  return dataRows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ''])));
}
