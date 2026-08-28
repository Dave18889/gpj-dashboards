// Shared Google Sheets API access for the North America Shipping tracker.
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed / not needed (e.g. running on Vercel) — ignore.
}

const API_KEY = process.env.GOOGLE_API_KEY;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID_SHIPPING_NA;

const SHEET_RANGE = `'Sheet1'!A1:H60`;

const CACHE_TTL_MS = 15 * 1000;
let cached = null;
let cachedAt = 0;

async function fetchRows() {
  if (!API_KEY || !SPREADSHEET_ID) {
    throw new Error(
      'Missing GOOGLE_API_KEY or SPREADSHEET_ID_SHIPPING_NA. Set them in .env locally, or in your Vercel project\'s Environment Variables.'
    );
  }

  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(
    SHEET_RANGE
  )}?valueRenderOption=UNFORMATTED_VALUE&key=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets API error (${res.status}): ${body}`);
  }
  const json = await res.json();
  const rows = json.values || [];

  cached = rows;
  cachedAt = Date.now();
  return rows;
}

module.exports = { fetchRows };
