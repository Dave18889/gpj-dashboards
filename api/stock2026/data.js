const { fetchAll, REGION_TABS } = require('../../lib/stock2026/sheets');
const { parseAllRegions, parseRegionTab } = require('../../lib/stock2026/parse');

module.exports = async (req, res) => {
  try {
    const data = await fetchAll();

    const allRegions = parseAllRegions(data.allRegions);
    const regions = REGION_TABS.map((tab) => parseRegionTab(tab, data.regions[tab]));

    res.status(200).json({
      allRegions,
      regions,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
