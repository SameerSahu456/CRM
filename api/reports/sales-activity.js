module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const salesActivity = [
      { name: 'Mon', calls: 12, emails: 25, meetings: 3 },
      { name: 'Tue', calls: 15, emails: 30, meetings: 4 },
      { name: 'Wed', calls: 10, emails: 22, meetings: 2 },
      { name: 'Thu', calls: 18, emails: 35, meetings: 5 },
      { name: 'Fri', calls: 8, emails: 20, meetings: 2 },
    ];
    return res.status(200).json(salesActivity);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
