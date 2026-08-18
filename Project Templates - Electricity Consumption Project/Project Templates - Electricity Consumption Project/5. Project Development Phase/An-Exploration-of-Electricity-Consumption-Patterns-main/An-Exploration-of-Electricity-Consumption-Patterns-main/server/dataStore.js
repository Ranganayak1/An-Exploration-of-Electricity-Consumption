import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
import { REGION_MAP, classifyPhase, formatDateISO } from './database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, '..', 'long_data_.csv');

let records = [];

export function loadData(force = false) {
  if (records.length > 0 && !force) {
    return { status: 'exists', records: records.length };
  }

  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

  records = rows.map(row => ({
    state: row.States,
    region_code: row.Regions,
    region_name: REGION_MAP[row.Regions] || row.Regions,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    usage_date: row.Dates.trim(),
    date_iso: formatDateISO(row.Dates),
    usage: parseFloat(row.Usage),
    phase: classifyPhase(row.Dates),
  }));

  return { status: 'loaded', records: records.length };
}

export function getRecords(filters = {}) {
  let result = records;

  if (filters.states?.length) {
    const set = new Set(filters.states);
    result = result.filter(r => set.has(r.state));
  }
  if (filters.regions?.length) {
    const set = new Set(filters.regions);
    result = result.filter(r => set.has(r.region_name));
  }
  if (filters.startDate) {
    result = result.filter(r => r.date_iso >= filters.startDate);
  }
  if (filters.endDate) {
    result = result.filter(r => r.date_iso <= filters.endDate);
  }
  if (filters.phase) {
    result = result.filter(r => r.phase === filters.phase);
  }

  return result;
}

export function getAllRecords() {
  return records;
}

if (process.argv[1]?.endsWith('ingest.js')) {
  const force = process.argv.includes('--force');
  const result = loadData(force);
  console.log('Data load complete:', result);
}
