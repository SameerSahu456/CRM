const mockNotifications = [
  { id: '1', type: 'deal', title: 'Deal Updated', message: 'Enterprise License deal moved to Negotiation', link: '/deals/1', read: false, createdAt: '2024-12-09T10:30:00Z' },
  { id: '2', type: 'task', title: 'Task Due Soon', message: 'Follow up with TechFlow on proposal is due tomorrow', link: '/tasks/1', read: false, createdAt: '2024-12-09T09:00:00Z' },
  { id: '3', type: 'lead', title: 'New Lead Assigned', message: 'Alice Freeman from Quantum Solutions assigned to you', link: '/leads/1', read: true, createdAt: '2024-12-08T16:45:00Z' },
  { id: '4', type: 'ticket', title: 'Urgent Ticket', message: 'High priority ticket from Global Dynamics needs attention', link: '/tickets/3', read: false, createdAt: '2024-12-09T08:15:00Z' },
  { id: '5', type: 'meeting', title: 'Meeting Reminder', message: 'TechFlow Enterprise Demo in 1 hour', link: '/calendar', read: true, createdAt: '2024-12-09T09:00:00Z' },
];

let notifications = [...mockNotifications];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(notifications);
  }

  if (req.method === 'POST') {
    const newNotification = { id: `notif-${Date.now()}`, ...req.body, createdAt: new Date().toISOString(), read: false };
    notifications.push(newNotification);
    return res.status(201).json(newNotification);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
