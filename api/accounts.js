const data = require('./data');

let accounts = [...data.mockAccounts];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(accounts);
  }

  if (req.method === 'POST') {
    const newAccount = { id: `account-${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
    accounts.push(newAccount);
    return res.status(201).json(newAccount);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
