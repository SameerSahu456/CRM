const data = require('../data');

let tasks = [...data.mockTasks];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    const task = tasks.find(t => t.id === id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.status(200).json(task);
  }

  if (req.method === 'PUT') {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    tasks[index] = { ...tasks[index], ...req.body };
    return res.status(200).json(tasks[index]);
  }

  if (req.method === 'DELETE') {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    tasks.splice(index, 1);
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
