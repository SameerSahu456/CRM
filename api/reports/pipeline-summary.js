module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const pipelineSummary = [
      { name: 'Discovery', deals: 3, value: 85000 },
      { name: 'Qualification', deals: 5, value: 120000 },
      { name: 'Proposal', deals: 4, value: 210000 },
      { name: 'Negotiation', deals: 2, value: 95000 },
      { name: 'Closed Won', deals: 8, value: 380000 },
      { name: 'Closed Lost', deals: 2, value: 45000 },
    ];
    return res.status(200).json(pipelineSummary);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
