// Optional: run both years' /api functions locally with plain Node/Express,
// without needing the Vercel CLI.
const express = require('express');

const teForecast2026 = require('./api/2026/te-forecast');
const teForecast2027 = require('./api/2027/te-forecast');
const stock2026 = require('./api/stock2026/data');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/2026/te-forecast', teForecast2026);
app.get('/api/2027/te-forecast', teForecast2027);
app.get('/api/stock2026/data', stock2026);

// Serve the static frontend files (landing page + both dashboards) from
// the project root.
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Gartner T&E Forecast (2026 + 2027) running at http://localhost:${PORT}`);
});
