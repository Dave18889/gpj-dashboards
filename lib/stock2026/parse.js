// Parsing logic for the 2026 Stock Tracker sheet. Tested against a real
// export — see the project README for the layout this assumes.

function normalizeHeader(h) {
  return (h || '').toString().replace(/\s+/g, ' ').trim();
}

// --- Parse the "All Regions" tab: a flat table, one row per region+item ---
function parseAllRegions(rows) {
  if (!rows || rows.length === 0) return [];
  const headerIdx = rows.findIndex((r) => normalizeHeader(r[0]) === 'Region');
  if (headerIdx < 0) return [];
  const header = rows[headerIdx].map(normalizeHeader);
  const col = (name) => header.indexOf(name);

  const regionCol = col('Region');
  const itemCol = col('Item');
  const startingCol = col('Starting stock');
  const sentCol = col('Sent out');
  const backCol = col('Came back');
  const usedCol = col('Used');
  const inStoreCol = col('In store now');
  const perAttendeeCol = col('Used per attendee');
  const neededCol = col('Needed for conferences left');
  const estimateCol = col('Your own estimate');
  const deltaCol = col('Delta');

  const toNum = (v) => (typeof v === 'number' ? v : null);

  const out = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[regionCol] || !row[itemCol]) continue;
    out.push({
      region: String(row[regionCol]).trim(),
      item: String(row[itemCol]).trim(),
      startingStock: toNum(row[startingCol]),
      sentOut: toNum(row[sentCol]),
      cameBack: toNum(row[backCol]),
      used: toNum(row[usedCol]),
      inStoreNow: toNum(row[inStoreCol]),
      usedPerAttendee: toNum(row[perAttendeeCol]),
      neededForConfsLeft: toNum(row[neededCol]),
      yourOwnEstimate: toNum(row[estimateCol]),
      delta: toNum(row[deltaCol]),
    });
  }
  return out;
}

// --- Parse a single region tab (NA, LATAM, EMEA, INDIA, APAC, JAPAN) ---
// Layout: a notes row, an "Attendees at conferences marked Done / still to
// come" row, a header row ("Item" in column A), the master item summary
// (one row per item, stopping once "Sent out" stops being a number — the
// explanatory sentence and any other notes rows that follow don't have
// numeric values in that column), then a "CONFERENCES — N events" marker,
// then one block per conference: a title row (name+code, sub-column
// labels, the date range, and that conference's attendee count / done
// flag), followed by exactly one row per item (same item list and order
// as the master summary, so no separate end-of-block detection is
// needed — each block is always title + item-count rows long).
function parseRegionTab(tabKey, rows) {
  const result = { region: tabKey, attendeesDone: null, attendeesRemaining: null, items: [], conferences: [] };
  if (!rows || rows.length === 0) return result;

  const attendeesRowIdx = rows.findIndex((r) => (r[0] || '').toString().startsWith('Attendees at conferences'));
  if (attendeesRowIdx >= 0) {
    const row = rows[attendeesRowIdx];
    result.attendeesDone = typeof row[3] === 'number' ? row[3] : null;
    result.attendeesRemaining = typeof row[7] === 'number' ? row[7] : null;
  }

  const headerIdx = rows.findIndex((r) => normalizeHeader(r[0]) === 'Item');
  if (headerIdx < 0) return result;
  const header = rows[headerIdx].map(normalizeHeader);
  const col = (name) => header.indexOf(name);
  const sentCol = col('Sent out');
  const backCol = col('Came back');
  const usedCol = col('Used');
  const startingCol = col('Starting stock');
  const inStoreCol = col('In store now');
  const perAttendeeCol = col('Used per attendee');
  const neededCol = col('Needed for conferences left');
  const estimateCol = col('Your own estimate');
  const deltaCol = col('Delta');

  const toNum = (v) => (typeof v === 'number' ? v : null);

  let i = headerIdx + 1;
  const items = [];
  while (i < rows.length && rows[i] && typeof rows[i][sentCol] === 'number') {
    const row = rows[i];
    items.push({
      item: (row[0] || '').toString().trim(),
      startingStock: toNum(row[startingCol]),
      sentOut: toNum(row[sentCol]),
      cameBack: toNum(row[backCol]),
      used: toNum(row[usedCol]),
      inStoreNow: toNum(row[inStoreCol]),
      usedPerAttendee: toNum(row[perAttendeeCol]),
      neededForConfsLeft: toNum(row[neededCol]),
      yourOwnEstimate: toNum(row[estimateCol]),
      delta: toNum(row[deltaCol]),
    });
    i++;
  }
  result.items = items;

  const confHeaderIdx = rows.findIndex((r) => (r[0] || '').toString().trim().startsWith('CONFERENCES'));
  if (confHeaderIdx < 0 || items.length === 0) return result;

  const confHeaderRow = rows[confHeaderIdx].map(normalizeHeader);
  const attendeesCol = confHeaderRow.indexOf('Attendees');
  const doneCol = confHeaderRow.indexOf('Done?');

  let r = confHeaderIdx + 1;
  while (r < rows.length && rows[r] && rows[r][0]) {
    const titleRow = rows[r];
    const raw = String(titleRow[0]).trim();
    const codeMatch = /\(([^)]+)\)\s*$/.exec(raw);
    const code = codeMatch ? codeMatch[1] : null;
    const name = codeMatch ? raw.slice(0, codeMatch.index).trim() : raw;
    const dates = titleRow[4] || null;
    const attendees = attendeesCol >= 0 && typeof titleRow[attendeesCol] === 'number' ? titleRow[attendeesCol] : null;
    const done = doneCol >= 0 ? !!titleRow[doneCol] : false;

    const confItems = [];
    for (let k = 0; k < items.length; k++) {
      const itemRow = rows[r + 1 + k] || [];
      confItems.push({
        item: items[k].item,
        sentOut: toNum(itemRow[sentCol]),
        cameBack: toNum(itemRow[backCol]),
        used: toNum(itemRow[usedCol]),
      });
    }

    result.conferences.push({ code, name, dates, attendees, done, items: confItems });
    r += 1 + items.length;
  }

  return result;
}

module.exports = { parseAllRegions, parseRegionTab };
