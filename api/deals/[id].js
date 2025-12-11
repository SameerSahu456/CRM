const data = require('../data');

let deals = [...data.mockDeals];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    const deal = deals.find(d => d.id === id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    return res.status(200).json(deal);
  }

  if (req.method === 'PUT') {
    const index = deals.findIndex(d => d.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    deals[index] = { ...deals[index], ...req.body };
    return res.status(200).json(deals[index]);
  }

  if (req.method === 'DELETE') {
    const index = deals.findIndex(d => d.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    deals.splice(index, 1);
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
