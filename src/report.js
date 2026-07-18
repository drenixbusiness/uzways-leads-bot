import { DateTime } from 'luxon';
import { config } from './config.js';
import {
  fetchLeads,
  filterLeadsForDay,
  getPlatformLabel,
  getPositionLabel,
  summarizeLeads,
} from './sheets.js';

function formatDayRange(day) {
  const start = day.startOf('day').toFormat('hh:mm a');
  const end = day.endOf('day').toFormat('hh:mm a');
  return `${start} – ${end} UZT`;
}

export async function buildDailyReport(targetDay) {
  const day = targetDay.setZone(config.timezone).startOf('day');

  let allLeads = [];
  try {
    allLeads = await fetchLeads();
  } catch (error) {
    return [
      '📊 <b>Daily Leads Overview</b>',
      '',
      `📅 <b>Date:</b> ${day.toFormat('cccc, LLLL d, yyyy')} (${day.toFormat('MM/dd/yyyy')})`,
      `🕐 <b>Period:</b> ${formatDayRange(day)}`,
      '',
      '<b>Lead data unavailable</b>',
      '',
      `⚠️ Unable to load Google Sheet data: ${error.message}`,
      '',
      'Please make the sheet public or provide a published CSV URL in GOOGLE_SHEET_CSV_URL.',
      '',
      'If you are using Google Sheets API, verify that the API key is valid and the sheet is shared with the appropriate permissions.',
    ].join('\n');
  }

  const dayLeads = filterLeadsForDay(allLeads, day);
  const summary = summarizeLeads(dayLeads);

  const lines = [
    '📊 <b>Daily Leads Overview</b>',
    '',
    `📅 <b>Date:</b> ${day.toFormat('cccc, LLLL d, yyyy')} (${day.toFormat('MM/dd/yyyy')})`,
    `🕐 <b>Period:</b> ${formatDayRange(day)}`,
    '',
    `✅ <b>Total leads:</b> ${summary.total}`,
    '',
    '<b>By platform</b>',
    `• ${getPlatformLabel('fb')}: ${summary.platforms.fb}`,
    `• ${getPlatformLabel('ig')}: ${summary.platforms.ig}`,
  ];

  if (summary.platforms.other > 0) {
    lines.push(`• Other: ${summary.platforms.other}`);
  }

  lines.push(
    '',
    '<b>By lead type</b>',
    `• ${getPositionLabel('owner_operator')}: ${summary.positions.owner_operator}`,
    `• ${getPositionLabel('company_driver')}: ${summary.positions.company_driver}`,
  );

  if (summary.positions.other > 0) {
    lines.push(`• Other: ${summary.positions.other}`);
  }

  if (dayLeads.length === 0) {
    lines.push('', 'No leads received for this day.');
  }

  return lines.join('\n');
}

export function getReportDay({ yesterday = false } = {}) {
  const now = DateTime.now().setZone(config.timezone);

  if (yesterday) {
    return now.minus({ days: 1 }).startOf('day');
  }

  return now.startOf('day');
}
