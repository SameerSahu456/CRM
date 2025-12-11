module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const leadsBySource = [
      { name: 'Website', value: 35, color: '#4f46e5' },
      { name: 'Referral', value: 25, color: '#059669' },
      { name: 'LinkedIn', value: 20, color: '#0891b2' },
      { name: 'Cold Call', value: 10, color: '#7c3aed' },
      { name: 'Trade Show', value: 5, color: '#ea580c' },
      { name: 'Email Campaign', value: 5, color: '#dc2626' },
    ];
    return res.status(200).json(leadsBySource);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
