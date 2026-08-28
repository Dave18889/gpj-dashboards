// Parsing logic for the "Gartner NA Shipping Estimates" sheet. A single
// flat table: a header row (found dynamically by matching "Conference" in
// some column, not a fixed position), one row per conference code, ending
// at a "TOTAL" row (used only as a sanity check — the real total is
// recomputed from the itemized rows, same defensive approach used
// elsewhere in this project since sheet-provided totals have proven
// unreliable before).

function normalizeHeader(h) {
  return (h || '').toString().replace(/\s+/g, ' ').trim();
}

function parseShipping(rows) {
  if (!rows || rows.length === 0) return { items: [], sheetTotal: null };

  const headerIdx = rows.findIndex((r) => r.some((c) => normalizeHeader(c) === 'Conference'));
  if (headerIdx < 0) return { items: [], sheetTotal: null };

  const header = rows[headerIdx].map(normalizeHeader);
  const col = (name) => header.indexOf(name);

  const confCol = col('Conference');
  const actual2025Col = col('2025 ACTUALS');
  const originalCol = col('Original Shipping Estimate');
  const updatedCol = col('Updated Shipping Estimate/Actual');
  const deltaCol = col('Delta');

  const toNum = (v) => (typeof v === 'number' ? v : null);

  const items = [];
  let sheetTotal = null;

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[confCol]) continue;
    const code = String(row[confCol]).trim();

    if (code.toUpperCase() === 'TOTAL') {
      sheetTotal = {
        actual2025: toNum(row[actual2025Col]),
        originalEstimate: toNum(row[originalCol]),
        updatedEstimate: toNum(row[updatedCol]),
        delta: toNum(row[deltaCol]),
      };
      continue;
    }

    items.push({
      code,
      actual2025: toNum(row[actual2025Col]),
      originalEstimate: toNum(row[originalCol]),
      updatedEstimate: toNum(row[updatedCol]),
      delta: toNum(row[deltaCol]),
    });
  }

  return { items, sheetTotal };
}

module.exports = { parseShipping };
