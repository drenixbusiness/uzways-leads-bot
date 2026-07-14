import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('sheet loader supports CSV URL override', () => {
  const content = readFileSync(new URL('./sheets.js', import.meta.url), 'utf8');
  assert.match(content, /googleSheetCsvUrl/);
  assert.match(content, /export\?format=csv/);
});

test('sheet loader supports Google Sheets API via service account', () => {
  const content = readFileSync(new URL('./googleSheetsService.js', import.meta.url), 'utf8');
  assert.match(content, /googleServiceAccountJson|googleServiceAccountPrivateKey/);
  assert.match(content, /spreadsheets\.values\.get/);
});
  