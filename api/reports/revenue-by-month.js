module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const revenueByMonth = [
      { name: 'Jan', revenue: 45000, target: 50000 },
      { name: 'Feb', revenue: 52000, target: 50000 },
      { name: 'Mar', revenue: 48000, target: 55000 },
      { name: 'Apr', revenue: 61000, target: 55000 },
      { name: 'May', revenue: 55000, target: 60000 },
      { name: 'Jun', revenue: 67000, target: 60000 },
      { name: 'Jul', revenue: 72000, target: 65000 },
      { name: 'Aug', revenue: 69000, target: 70000 },
      { name: 'Sep', revenue: 78000, target: 70000 },
      { name: 'Oct', revenue: 85000, target: 75000 },
      { name: 'Nov', revenue: 92000, target: 80000 },
      { name: 'Dec', revenue: 88000, target: 85000 },
    ];
    return res.status(200).json(revenueByMonth);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
