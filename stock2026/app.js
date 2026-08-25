const REFRESH_MS = 30 * 1000;
const DATA_URL = '/api/stock2026/data';

let REGIONS_DATA = [];
let openRegions = new Set();
let openConfLists = new Set();
let openConfItems = new Set();

document.getElementById('refreshBtn').addEventListener('click', loadAll);

function setStatus(kind, text) {
  document.getElementById('liveDot').className = 'live-dot' + (kind === 'error' ? ' error' : '');
  document.getElementById('subtitleText').textContent = text;
}

function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function deltaCell(delta) {
  if (delta === null || delta === undefined) return '<td class="delta-cell muted">—</td>';
  const cls = delta < 0 ? 'shortage' : 'surplus';
  return `<td class="delta-cell ${cls}">${fmt(delta)}</td>`;
}

function renderSummary(regions) {
  const el = document.getElementById('summaryRow');
  const totalConferences = regions.reduce((s, r) => s + r.conferences.length, 0);
  const shortfallCount = regions.reduce(
    (s, r) => s + r.items.filter((i) => i.delta !== null && i.delta < 0).length,
    0
  );
  const attendeesDone = regions.reduce((s, r) => s + (r.attendeesDone || 0), 0);
  const attendeesRemaining = regions.reduce((s, r) => s + (r.attendeesRemaining || 0), 0);

  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${regions.length}</div>
      <div class="stat-label">Regions</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${totalConferences}</div>
      <div class="stat-label">Conferences tracked</div>
    </div>
    <div class="stat-card">
      <div class="stat-value${shortfallCount > 0 ? ' warn' : ''}">${shortfallCount}</div>
      <div class="stat-label">Items showing a shortfall</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${attendeesDone} / ${attendeesDone + attendeesRemaining}</div>
      <div class="stat-label">Attendees done / total</div>
    </div>
  `;
}

function itemTable(items) {
  const rows = items
    .map(
      (i) => `
    <tr>
      <td class="item-col">${i.item}</td>
      <td>${fmt(i.startingStock)}</td>
      <td>${fmt(i.sentOut)}</td>
      <td>${fmt(i.cameBack)}</td>
      <td>${fmt(i.used)}</td>
      <td>${fmt(i.inStoreNow)}</td>
      <td>${fmt(i.usedPerAttendee)}</td>
      <td>${fmt(i.neededForConfsLeft)}</td>
      <td>${fmt(i.yourOwnEstimate)}</td>
      ${deltaCell(i.delta)}
    </tr>`
    )
    .join('');

  return `
    <div class="table-scroll">
    <table>
      <thead>
        <tr>
          <th class="item-col">Item</th>
          <th>Start</th>
          <th>Sent</th>
          <th>Back</th>
          <th>Used</th>
          <th>In Store</th>
          <th>/Attendee</th>
          <th>Needed</th>
          <th>Est.</th>
          <th>Delta</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    </div>`;
}

function conferenceList(region, regionKey) {
  const confs = region.conferences
    .map((c, idx) => {
      const key = `${regionKey}::${idx}`;
      const isOpen = openConfItems.has(key);
      const rows = c.items
        .map(
          (i) => `
        <tr>
          <td class="item-col">${i.item}</td>
          <td>${fmt(i.sentOut)}</td>
          <td>${fmt(i.cameBack)}</td>
          <td>${fmt(i.used)}</td>
        </tr>`
        )
        .join('');

      return `
        <div class="conf-item${isOpen ? ' open' : ''}" data-conf-key="${key}">
          <div class="conf-header">
            <span class="conf-chevron">&#8250;</span>
            <div class="conf-main">
              <div class="conf-title">${c.name}${c.code ? `<span class="conf-code">${c.code}</span>` : ''}${c.done ? '<span class="done-badge">Done</span>' : ''}</div>
              <div class="conf-dates">${c.dates || ''}${c.attendees !== null ? ` &middot; ${fmt(c.attendees)} attendees` : ''}</div>
            </div>
          </div>
          <div class="conf-body">
            <div class="table-scroll">
            <table>
              <thead><tr><th class="item-col">Item</th><th>Sent</th><th>Back</th><th>Used</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
            </div>
          </div>
        </div>`;
    })
    .join('');

  return `<div class="conf-list${openConfLists.has(regionKey) ? ' open' : ''}" data-conf-list-key="${regionKey}">${confs}</div>`;
}

function renderRegions(regions) {
  const el = document.getElementById('regionList');
  if (!regions || regions.length === 0) {
    el.innerHTML = '<div class="loading">No data found.</div>';
    return;
  }

  el.innerHTML = regions
    .map((r, idx) => {
      const key = `${r.region}-${idx}`;
      const isOpen = openRegions.has(key);
      const shortfalls = r.items.filter((i) => i.delta !== null && i.delta < 0).length;

      return `
        <div class="region-item${isOpen ? ' open' : ''}" data-key="${key}">
          <div class="region-header">
            <span class="chevron">&#8250;</span>
            <div class="region-main">
              <div class="region-title">${r.region}</div>
            </div>
            <div class="region-meta">${r.conferences.length} conferences${shortfalls > 0 ? ` &middot; ${shortfalls} shortfall${shortfalls === 1 ? '' : 's'}` : ''}</div>
          </div>
          <div class="region-body">
            ${itemTable(r.items)}
            <button class="conf-toggle" data-toggle-key="${key}">${openConfLists.has(key) ? 'Hide' : 'Show'} conferences (${r.conferences.length})</button>
            ${conferenceList(r, key)}
          </div>
        </div>`;
    })
    .join('');

  attachHandlers(el);
}

function attachHandlers(container) {
  container.querySelectorAll('.region-item[data-key]').forEach((item) => {
    const header = item.querySelector('.region-header');
    header.addEventListener('click', () => {
      const key = item.dataset.key;
      if (openRegions.has(key)) {
        openRegions.delete(key);
        item.classList.remove('open');
      } else {
        openRegions.add(key);
        item.classList.add('open');
      }
    });
  });

  container.querySelectorAll('.conf-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.toggleKey;
      const list = container.querySelector(`.conf-list[data-conf-list-key="${key}"]`);
      if (openConfLists.has(key)) {
        openConfLists.delete(key);
        list.classList.remove('open');
        btn.textContent = `Show conferences (${list.children.length})`;
      } else {
        openConfLists.add(key);
        list.classList.add('open');
        btn.textContent = `Hide conferences (${list.children.length})`;
      }
    });
  });

  container.querySelectorAll('.conf-item[data-conf-key]').forEach((item) => {
    const header = item.querySelector('.conf-header');
    header.addEventListener('click', () => {
      const key = item.dataset.confKey;
      if (openConfItems.has(key)) {
        openConfItems.delete(key);
        item.classList.remove('open');
      } else {
        openConfItems.add(key);
        item.classList.add('open');
      }
    });
  });
}

async function loadAll() {
  setStatus('', 'Loading latest data\u2026');
  try {
    const res = await fetch(DATA_URL);
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || `HTTP ${res.status}`);
    }

    REGIONS_DATA = json.regions || [];
    renderSummary(REGIONS_DATA);
    renderRegions(REGIONS_DATA);

    const time = new Date(json.updatedAt || Date.now()).toLocaleTimeString();
    setStatus('live', `Live \u00b7 updated ${time}`);
  } catch (err) {
    console.error(err);
    setStatus('error', `Could not load data \u2014 ${err.message}`);
    document.getElementById('regionList').innerHTML =
      `<div class="error-box">Couldn't load data: ${err.message}. Check the deployment's environment variables and that the sheet is shared appropriately.</div>`;
  }
}

loadAll();
setInterval(loadAll, REFRESH_MS);
