import { DateTime } from 'luxon';
import { config } from './config.js';

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

export async function fetchLeads() {
  const url = `https://docs.google.com/spreadsheets/d/${config.googleSheetId}/export?format=csv`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Sheet (${response.status})`);
  }

  const csv = await response.text();
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length <= 1) {
    return [];
  }

  const leads = [];

  for (const line of lines.slice(1)) {
    const [name, dateCreated, platform, position] = parseCsvLine(line);
    const createdAt = parseLeadDate(dateCreated);

    if (!createdAt) {
      continue;
    }

    leads.push({
      name: name || 'Unknown',
      createdAt,
      platform: (platform || '').trim().toLowerCase(),
      position: (position || '').trim().toLowerCase(),
    });
  }

  return leads;
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
