const data = require('../data');

let contacts = [...data.mockContacts];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    const contact = contacts.find(c => c.id === id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    return res.status(200).json(contact);
  }

  if (req.method === 'PUT') {
    const index = contacts.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    contacts[index] = { ...contacts[index], ...req.body };
    return res.status(200).json(contacts[index]);
  }

  if (req.method === 'DELETE') {
    const index = contacts.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    contacts.splice(index, 1);
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
