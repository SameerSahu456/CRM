const data = require('../data');

let events = [...data.mockCalendarEvents];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    const event = events.find(e => e.id === id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    return res.status(200).json(event);
  }

  if (req.method === 'PUT') {
    const index = events.findIndex(e => e.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }
    events[index] = { ...events[index], ...req.body };
    return res.status(200).json(events[index]);
  }

  if (req.method === 'DELETE') {
    const index = events.findIndex(e => e.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }
    events.splice(index, 1);
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
