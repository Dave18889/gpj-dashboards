const REFRESH_MS = 30 * 1000;
const DATA_URL = '/api/shippingNA/data';

document.getElementById('refreshBtn').addEventListener('click', loadAll);

function setStatus(kind, text) {
  document.getElementById('liveDot').className = 'live-dot' + (kind === 'error' ? ' error' : '');
  document.getElementById('subtitleText').textContent = text;
}

function fmtMoney(n) {
  if (n === null || n === undefined) return '<span class="muted">—</span>';
  return '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function deltaCell(delta) {
  if (delta === null || delta === undefined) return '<td class="delta-cell muted">—</td>';
  const cls = delta > 0 ? 'over' : 'under';
  const sign = delta > 0 ? '+' : '';
  return `<td class="delta-cell ${cls}">${sign}${fmtMoney(delta)}</td>`;
}

function renderSummary(items, computedTotal) {
  const el = document.getElementById('summaryRow');
  const overCount = items.filter((i) => i.delta !== null && i.delta > 0).length;
  const underCount = items.filter((i) => i.delta !== null && i.delta < 0).length;
  const deltaClass = computedTotal.delta > 0 ? 'warn' : computedTotal.delta < 0 ? 'good' : '';

  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${fmtMoney(computedTotal.originalEstimate)}</div>
      <div class="stat-label">Total original estimate</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${fmtMoney(computedTotal.updatedEstimate)}</div>
      <div class="stat-label">Total updated estimate / actual</div>
    </div>
    <div class="stat-card">
      <div class="stat-value ${deltaClass}">${computedTotal.delta > 0 ? '+' : ''}${fmtMoney(computedTotal.delta)}</div>
      <div class="stat-label">Total delta</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${overCount} / ${underCount}</div>
      <div class="stat-label">Conferences over / under estimate</div>
    </div>
  `;
}

function renderTable(items, computedTotal) {
  const body = document.getElementById('shippingBody');
  if (!items || items.length === 0) {
    body.innerHTML = '<tr><td colspan="5" class="loading">No data found.</td></tr>';
    return;
  }

  const rows = items
    .map(
      (i) => `
    <tr>
      <td class="item-col">
        <span class="conf-code">${i.code}</span>
        ${i.name ? `<span class="conf-name">${i.name}</span>` : ''}
      </td>
      <td>${fmtMoney(i.actual2025)}</td>
      <td>${fmtMoney(i.originalEstimate)}</td>
      <td>${fmtMoney(i.updatedEstimate)}</td>
      ${deltaCell(i.delta)}
    </tr>`
    )
    .join('');

  const totalRow = `
    <tr class="total-row">
      <td class="item-col">Total</td>
      <td>${fmtMoney(computedTotal.actual2025)}</td>
      <td>${fmtMoney(computedTotal.originalEstimate)}</td>
      <td>${fmtMoney(computedTotal.updatedEstimate)}</td>
      ${deltaCell(computedTotal.delta)}
    </tr>`;

  body.innerHTML = rows + totalRow;
}

function computeTotal(items) {
  return items.reduce(
    (acc, i) => {
      if (i.actual2025 !== null) acc.actual2025 += i.actual2025;
      if (i.originalEstimate !== null) acc.originalEstimate += i.originalEstimate;
      if (i.updatedEstimate !== null) acc.updatedEstimate += i.updatedEstimate;
      if (i.delta !== null) acc.delta += i.delta;
      return acc;
    },
    { actual2025: 0, originalEstimate: 0, updatedEstimate: 0, delta: 0 }
  );
}

async function loadAll() {
  setStatus('', 'Loading latest data\u2026');
  try {
    const res = await fetch(DATA_URL);
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || `HTTP ${res.status}`);
    }

    const items = json.items || [];
    const computedTotal = computeTotal(items);

    renderSummary(items, computedTotal);
    renderTable(items, computedTotal);

    const time = new Date(json.updatedAt || Date.now()).toLocaleTimeString();
    setStatus('live', `Live \u00b7 updated ${time}`);
  } catch (err) {
    console.error(err);
    setStatus('error', `Could not load data \u2014 ${err.message}`);
    document.getElementById('shippingBody').innerHTML =
      `<tr><td colspan="5"><div class="error-box">Couldn't load data: ${err.message}. Check the deployment's environment variables and that the sheet is shared appropriately.</div></td></tr>`;
  }
}

loadAll();
setInterval(loadAll, REFRESH_MS);
