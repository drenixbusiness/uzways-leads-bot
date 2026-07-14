import { DateTime } from 'luxon';
import { config } from './config.js';
import { fetchGoogleSheetRows } from './googleSheetsService.js';
import { fetchGoogleSheetWithApiKey } from './googleApiKeyService.js';

function normalizeHeaderValue(value) {
  return (value || '').toString().trim().toLowerCase();
}

function findColumnIndex(headers, candidates) {
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeHeaderValue(candidate);
    const index = headers.findIndex((header) => normalizeHeaderValue(header) === normalizedCandidate);
    if (index >= 0) {
      return index;
    }
  }

  return -1;
}

function parseRowToLead(row, headers) {
  const nameIndex = findColumnIndex(headers, ['name', 'full name', 'lead name', 'contact name']);
  const dateIndex = findColumnIndex(headers, ['date', 'created at', 'date created', 'time']);
  const platformIndex = findColumnIndex(headers, ['platform', 'source', 'channel']);
  const positionIndex = findColumnIndex(headers, ['position', 'role', 'lead type']);

  const name = nameIndex >= 0 ? (row[nameIndex] || '').trim() : '';
  const dateCreated = dateIndex >= 0 ? (row[dateIndex] || '').trim() : '';
  const platform = platformIndex >= 0 ? (row[platformIndex] || '').trim() : '';
  const position = positionIndex >= 0 ? (row[positionIndex] || '').trim() : '';

  const createdAt = parseLeadDate(dateCreated);

  if (!createdAt) {
    return null;
  }

  return {
    name: name || 'Unknown',
    createdAt,
    platform: (platform || '').trim().toLowerCase(),
    position: (position || '').trim().toLowerCase(),
  };
}

async function fetchGoogleSheetsApiData() {
  const rows = await fetchGoogleSheetRows();

  if (rows.length === 0) {
    return [];
  }

  const [headers, ...dataRows] = rows;
  return dataRows
    .map((row) => parseRowToLead(Object.values(row), headers || []))
    .filter(Boolean);
}

const PLATFORM_LABELS = {
  fb: 'Facebook',
  ig: 'Instagram',
};

const POSITION_LABELS = {
  owner_operator: 'Owner Operator',
  company_driver: 'Company Driver',
};

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseLeadDate(rawValue) {
  const cleaned = rawValue.replace(/^Time:\s*/i, '').trim();
  const parsed = DateTime.fromFormat(cleaned, 'MM/dd/yyyy hh:mm a', {
    zone: config.timezone,
  });

  if (!parsed.isValid) {
    return null;
  }

  return parsed;
}

function buildDirectSheetExportUrl() {
  if (!config.googleSheetId) {
    throw new Error('Missing Google Sheet config');
  }

  if (/^https?:\/\//i.test(config.googleSheetId)) {
    return config.googleSheetId.replace(/\/edit.*$/i, '/export?format=csv');
  }

  return `https://docs.google.com/spreadsheets/d/${config.googleSheetId}/export?format=csv`;
}

function buildSheetExportUrlCandidates() {
  const candidates = [];

  if (config.googleSheetCsvUrl) {
    candidates.push(config.googleSheetCsvUrl);
  }

  candidates.push(buildDirectSheetExportUrl());

  return [...new Set(candidates)];
}

function parseCsvLeads(csv) {
  if (!csv) {
    return [];
  }

  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length <= 1) {
    return [];
  }

  const leads = [];
  const [headers, ...dataLines] = lines.map((line) => parseCsvLine(line));

  for (const line of dataLines) {
    const lead = parseRowToLead(line, headers);
    if (lead) {
      leads.push(lead);
    }
  }

  return leads;
}

async function fetchLeadsFromCsvUrls() {
  const urls = buildSheetExportUrlCandidates();
  const errors = [];

  for (const url of urls) {
    try {
      const csv = await fetchCsvFromUrl(url);
      return parseCsvLeads(csv);
    } catch (error) {
      errors.push(error.message);
    }
  }

  throw new Error(errors.join(' | ') || 'Failed to fetch Google Sheet CSV');
}

async function fetchLeadsFromApiKey() {
  const apiRows = await fetchGoogleSheetWithApiKey();

  return apiRows.map((row) => ({
    name: row.Name || row.name || 'Unknown',
    createdAt: parseLeadDate(row.Date || row.date || ''),
    platform: (row.Platform || row.platform || '').trim().toLowerCase(),
    position: (row.Position || row.position || '').trim().toLowerCase(),
  })).filter((lead) => lead.createdAt);
}

async function fetchCsvFromUrl(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/csv,text/plain,*/*',
    },
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`CSV URL failed (${response.status}): ${url}`);
  }

  if (body.trimStart().startsWith('<!DOCTYPE') || body.trimStart().startsWith('<html')) {
    throw new Error(`CSV URL returned HTML instead of CSV: ${url}`);
  }

  return normalizeCsvText(body);
}

function normalizeCsvText(csv) {
  if (!csv) return '';
  return csv
    .replace(/\uFEFF/g, '')
    .trim();
}

export async function fetchLeads() {
  const errors = [];

  if (config.googleSheetCsvUrl) {
    try {
      return await fetchLeadsFromCsvUrls();
    } catch (error) {
      errors.push(error.message);
    }
  }

  if (config.googleApiKey) {
    try {
      const apiLeads = await fetchLeadsFromApiKey();
      if (apiLeads.length > 0) {
        return apiLeads;
      }
    } catch (error) {
      errors.push(error.message);
    }
  }

  try {
    return await fetchGoogleSheetsApiData();
  } catch (error) {
    errors.push(error.message);
  }

  if (!config.googleSheetCsvUrl) {
    try {
      return await fetchLeadsFromCsvUrls();
    } catch (error) {
      errors.push(error.message);
    }
  }

  throw new Error(errors.join(' | ') || 'Failed to fetch Google Sheet');
}

export function filterLeadsForDay(leads, day) {
  const dayStart = day.startOf('day');
  const dayEnd = day.endOf('day');

  return leads.filter((lead) => {
    const timestamp = lead.createdAt.toMillis();
    return timestamp >= dayStart.toMillis() && timestamp <= dayEnd.toMillis();
  });
}

export function summarizeLeads(leads) {
  const summary = {
    total: leads.length,
    platforms: {
      fb: 0,
      ig: 0,
      other: 0,
    },
    positions: {
      owner_operator: 0,
      company_driver: 0,
      other: 0,
    },
  };

  for (const lead of leads) {
    if (lead.platform === 'fb' || lead.platform === 'ig') {
      summary.platforms[lead.platform] += 1;
    } else {
      summary.platforms.other += 1;
    }

    if (lead.position === 'owner_operator' || lead.position === 'company_driver') {
      summary.positions[lead.position] += 1;
    } else {
      summary.positions.other += 1;
    }
  }

  return summary;
}

export function getPlatformLabel(platform) {
  return PLATFORM_LABELS[platform] || platform;
}

export function getPositionLabel(position) {
  return POSITION_LABELS[position] || position;
}
