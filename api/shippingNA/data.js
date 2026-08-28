const { fetchRows } = require('../../lib/shippingNA/sheets');
const { parseShipping } = require('../../lib/shippingNA/parse');
const { parseRegionTab } = require('../../lib/2026/parse');

// Best-effort lookup of full conference names from the 2026 NA T&E tab,
// since this sheet's codes (CIOS20, HTTP11, etc.) match that tab's
// conferences exactly. If this fetch fails for any reason, the shipping
// data still renders fine with just the codes — this is a nice-to-have
// enrichment, not a dependency.
async function fetchConferenceNames() {
  const API_KEY = process.env.GOOGLE_API_KEY;
  const SPREADSHEET_ID = process.env.SPREADSHEET_ID_2026;
  if (!API_KEY || !SPREADSHEET_ID) return {};

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(
      "'NA'!A1:L500"
    )}?valueRenderOption=UNFORMATTED_VALUE&key=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return {};
    const json = await res.json();
    const records = parseRegionTab('NA', json.values || []);

    const nameByCode = {};
    records.forEach((r) => {
      const match = /^(.*)\s+\(([^)]+)\)\s*$/.exec(r.conference || '');
      if (match) nameByCode[match[2].trim().toUpperCase()] = match[1].trim();
    });
    return nameByCode;
  } catch (e) {
    console.error('Conference name lookup failed (non-fatal):', e.message);
    return {};
  }
}

module.exports = async (req, res) => {
  try {
    const [rows, nameByCode] = await Promise.all([fetchRows(), fetchConferenceNames()]);
    const { items, sheetTotal } = parseShipping(rows);

    const enriched = items.map((i) => ({
      ...i,
      name: nameByCode[i.code.toUpperCase()] || null,
    }));

    res.status(200).json({
      items: enriched,
      sheetTotal,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
