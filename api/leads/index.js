const data = require('../data');

let leads = [...data.mockLeads];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(leads);
  }

  if (req.method === 'POST') {
    const newLead = { id: `lead-${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
    leads.push(newLead);
    return res.status(201).json(newLead);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
