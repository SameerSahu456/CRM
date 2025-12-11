const data = require('./data');

let events = [...data.mockCalendarEvents];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(events);
  }

  if (req.method === 'POST') {
    const newEvent = { id: `event-${Date.now()}`, ...req.body };
    events.push(newEvent);
    return res.status(201).json(newEvent);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
