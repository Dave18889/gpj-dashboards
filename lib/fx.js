// Fetches a live GBP → EUR exchange rate from Frankfurter (a free,
// no-API-key currency API that serves official European Central Bank
// reference rates — xe.com itself doesn't offer a free public API for a
// backend to call, so this is a reliable equivalent, updated on every ECB
// business day). Cached for a few hours since the rate only actually
// changes once a day.
const FX_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
let fxCache = null;
let fxCachedAt = 0;

// Used only if the live fetch fails (e.g. Frankfurter is briefly down) —
// an approximate rate so the toggle still works, clearly flagged as a
// fallback rather than silently passed off as live.
const FALLBACK_GBP_TO_EUR = 1.17;

async function fetchGbpToEurRate() {
  if (fxCache && Date.now() - fxCachedAt < FX_CACHE_TTL_MS) {
    return fxCache;
  }

  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=GBP&to=EUR');
    if (!res.ok) throw new Error(`FX API error (${res.status})`);
    const json = await res.json();
    const rate = json.rates && json.rates.EUR;
    if (typeof rate !== 'number') throw new Error('FX API returned an unexpected shape');

    fxCache = { gbpToEur: rate, asOf: json.date, isLive: true };
    fxCachedAt = Date.now();
    return fxCache;
  } catch (e) {
    console.error('Live FX rate fetch failed, using fallback:', e.message);
    // Don't cache the fallback — keep retrying for a live rate on the next call.
    return { gbpToEur: FALLBACK_GBP_TO_EUR, asOf: null, isLive: false };
  }
}

module.exports = { fetchGbpToEurRate };
