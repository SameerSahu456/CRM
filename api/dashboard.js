const data = require('./data');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const totalRevenue = data.mockDeals
      .filter(d => d.stage === 'Closed Won')
      .reduce((sum, d) => sum + d.value, 0);

    const stats = {
      totalLeads: data.mockLeads.length,
      totalDeals: data.mockDeals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).length,
      totalAccounts: data.mockAccounts.length,
      totalContacts: data.mockContacts.length,
      totalRevenue: totalRevenue,
      openTasks: data.mockTasks.filter(t => t.status !== 'Completed').length,
      openTickets: 4,
      conversionRate: 24.8
    };
    return res.status(200).json(stats);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
