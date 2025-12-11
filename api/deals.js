const data = require('./data');

let deals = [...data.mockDeals];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(deals);
  }

  if (req.method === 'POST') {
    const newDeal = { id: `deal-${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
    deals.push(newDeal);
    return res.status(201).json(newDeal);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
