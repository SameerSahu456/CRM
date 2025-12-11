const data = require('../data');

let accounts = [...data.mockAccounts];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    const account = accounts.find(a => a.id === id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    return res.status(200).json(account);
  }

  if (req.method === 'PUT') {
    const index = accounts.findIndex(a => a.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Account not found' });
    }
    accounts[index] = { ...accounts[index], ...req.body };
    return res.status(200).json(accounts[index]);
  }

  if (req.method === 'DELETE') {
    const index = accounts.findIndex(a => a.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Account not found' });
    }
    accounts.splice(index, 1);
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
