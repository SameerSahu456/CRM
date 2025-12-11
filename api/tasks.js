const data = require('./data');

let tasks = [...data.mockTasks];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(tasks);
  }

  if (req.method === 'POST') {
    const newTask = { id: `task-${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
    tasks.push(newTask);
    return res.status(201).json(newTask);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
