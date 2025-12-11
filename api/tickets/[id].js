const mockTickets = [
  { id: '1', ticketNumber: 'TKT-001', subject: 'Login issues', description: 'Unable to login to the system', status: 'Open', priority: 'High', type: 'Bug', category: 'Authentication', contactId: '1', contactName: 'John Anderson', contactEmail: 'john.anderson@techflow.io', accountId: '1', accountName: 'TechFlow Inc.', assignedTo: 'David Kim', assignedTeam: 'Support', createdAt: '2024-12-08', updatedAt: '2024-12-09', dueDate: '2024-12-12', tags: ['urgent'] },
  { id: '2', ticketNumber: 'TKT-002', subject: 'Feature request: Dark mode', description: 'Would like dark mode option', status: 'In Progress', priority: 'Normal', type: 'Feature Request', category: 'UI/UX', contactId: '2', contactName: 'Maria Santos', contactEmail: 'maria.santos@techflow.io', accountId: '1', accountName: 'TechFlow Inc.', assignedTo: 'Emily Rodriguez', assignedTeam: 'Product', createdAt: '2024-12-06', updatedAt: '2024-12-08', dueDate: '2024-12-20', tags: [] },
  { id: '3', ticketNumber: 'TKT-003', subject: 'Integration not working', description: 'Slack integration failing', status: 'Pending', priority: 'Urgent', type: 'Bug', category: 'Integration', contactId: '3', contactName: 'Robert Johnson', contactEmail: 'robert@globaldynamics.com', accountId: '2', accountName: 'Global Dynamics', assignedTo: 'David Kim', assignedTeam: 'Support', createdAt: '2024-12-09', updatedAt: '2024-12-09', dueDate: '2024-12-10', tags: ['integration', 'urgent'] },
  { id: '4', ticketNumber: 'TKT-004', subject: 'Billing question', description: 'Need clarification on invoice', status: 'Resolved', priority: 'Low', type: 'Question', category: 'Billing', contactId: '5', contactName: 'James Brown', contactEmail: 'james@alphawave.net', accountId: '4', accountName: 'Alpha Wave', assignedTo: 'Sarah Jenkins', assignedTeam: 'Sales', createdAt: '2024-12-01', updatedAt: '2024-12-05', dueDate: '2024-12-08', tags: ['billing'] },
];

let tickets = [...mockTickets];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    return res.status(200).json(ticket);
  }

  if (req.method === 'PUT') {
    const index = tickets.findIndex(t => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    tickets[index] = { ...tickets[index], ...req.body, updatedAt: new Date().toISOString() };
    return res.status(200).json(tickets[index]);
  }

  if (req.method === 'DELETE') {
    const index = tickets.findIndex(t => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    tickets.splice(index, 1);
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
