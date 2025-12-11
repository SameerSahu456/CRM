const data = require('../data');

let leads = [...data.mockLeads];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    const lead = leads.find(l => l.id === id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    return res.status(200).json(lead);
  }

  if (req.method === 'PUT') {
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    leads[index] = { ...leads[index], ...req.body };
    return res.status(200).json(leads[index]);
  }

  if (req.method === 'DELETE') {
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    leads.splice(index, 1);
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
