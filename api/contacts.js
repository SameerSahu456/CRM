const data = require('./data');

let contacts = [...data.mockContacts];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(contacts);
  }

  if (req.method === 'POST') {
    const newContact = { id: `contact-${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
    contacts.push(newContact);
    return res.status(201).json(newContact);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
