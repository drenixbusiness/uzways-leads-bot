import 'dotenv/config';
import { config } from './src/config.js';

console.log('Sheet ID:', config.googleSheetId);
console.log('CSV URL:', config.googleSheetCsvUrl || '(not set)');
console.log('API key:', config.googleApiKey ? 'set' : 'not set');
console.log('');

const urls = [
  config.googleSheetCsvUrl,
  `https://docs.google.com/spreadsheets/d/${config.googleSheetId}/export?format=csv`,
].filter(Boolean);

for (const url of urls) {
  try {
    const res = await fetch(url);
    const text = await res.text();
    const preview = text.slice(0, 80).replace(/\n/g, ' ');
    console.log(`[${res.status}] ${url}`);
    console.log(`  ${preview}`);
  } catch (err) {
    console.log(`[ERR] ${url}`);
    console.log(`  ${err.message}`);
  }
  console.log('');
}
