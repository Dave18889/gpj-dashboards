// Shared Google Sheets API access for the 2026 Stock Forecast.
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed / not needed (e.g. running on Vercel) — ignore.
}

const API_KEY = process.env.GOOGLE_API_KEY;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID_STOCK_2026;

const REGION_TABS = ['NA', 'LATAM', 'EMEA', 'INDIA', 'APAC', 'JAPAN'];
const REGION_RANGES = REGION_TABS.map((t) => `'${t}'!A1:J400`);
const ALL_REGIONS_RANGE = `'All Regions'!A1:K500`;

const ALL_RANGES = [...REGION_RANGES, ALL_REGIONS_RANGE];

const CACHE_TTL_MS = 15 * 1000;
let cached = null;
let cachedAt = 0;

async function fetchAll() {
  if (!API_KEY || !SPREADSHEET_ID) {
    throw new Error(
      'Missing GOOGLE_API_KEY or SPREADSHEET_ID_STOCK_2026. Set them in .env locally, or in your Vercel project\'s Environment Variables.'
    );
  }

  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  const rangeParams = ALL_RANGES.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?${rangeParams}&valueRenderOption=UNFORMATTED_VALUE&key=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets API error (${res.status}): ${body}`);
  }
  const json = await res.json();
  const valueRanges = json.valueRanges || [];

  const result = { regions: {}, allRegions: [] };
  REGION_TABS.forEach((tab, i) => {
    result.regions[tab] = valueRanges[i]?.values || [];
  });
  result.allRegions = valueRanges[REGION_TABS.length]?.values || [];

  cached = result;
  cachedAt = Date.now();
  return result;
}

module.exports = { fetchAll, REGION_TABS };
