const data = require('../data');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const sources = {};
    data.mockLeads.forEach(lead => {
      sources[lead.source] = (sources[lead.source] || 0) + 1;
    });
    const leadSources = Object.entries(sources).map(([source, count]) => ({
      source,
      count
    }));
    return res.status(200).json(leadSources);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
