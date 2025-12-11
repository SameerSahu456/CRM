// Consolidated API handler for Vercel Hobby plan (12 function limit)
const data = require('./data');

// In-memory data stores
let leads = [...data.mockLeads];
let contacts = [...data.mockContacts];
let accounts = [...data.mockAccounts];
let deals = [...data.mockDeals];
let tasks = [...data.mockTasks];
let events = [...data.mockCalendarEvents];

const tickets = [
  { id: '1', ticketNumber: 'TKT-001', subject: 'Login issues', status: 'Open', priority: 'High', type: 'Bug', contactName: 'John Anderson', accountName: 'TechFlow Inc.', assignedTo: 'David Kim', createdAt: '2024-12-08' },
  { id: '2', ticketNumber: 'TKT-002', subject: 'Feature request: Dark mode', status: 'In Progress', priority: 'Normal', type: 'Feature Request', contactName: 'Maria Santos', accountName: 'TechFlow Inc.', assignedTo: 'Emily Rodriguez', createdAt: '2024-12-06' },
  { id: '3', ticketNumber: 'TKT-003', subject: 'Integration not working', status: 'Pending', priority: 'Urgent', type: 'Bug', contactName: 'Robert Johnson', accountName: 'Global Dynamics', assignedTo: 'David Kim', createdAt: '2024-12-09' },
  { id: '4', ticketNumber: 'TKT-004', subject: 'Billing question', status: 'Resolved', priority: 'Low', type: 'Question', contactName: 'James Brown', accountName: 'Alpha Wave', assignedTo: 'Sarah Jenkins', createdAt: '2024-12-01' },
];

const campaigns = [
  { id: '1', name: 'Q4 Product Launch', type: 'Email', status: 'Active', budget: 15000, actualRevenue: 45000, owner: 'Emily Rodriguez', metrics: { sent: 5000, opened: 2100, clicked: 420, leads: 45 } },
  { id: '2', name: 'Winter Webinar Series', type: 'Webinar', status: 'Scheduled', budget: 5000, owner: 'Sarah Jenkins', metrics: { sent: 2000, opened: 780, clicked: 195, leads: 0 } },
  { id: '3', name: 'LinkedIn Ads - Tech Leaders', type: 'Social', status: 'Active', budget: 8000, actualRevenue: 12000, owner: 'Emily Rodriguez', metrics: { clicked: 320, leads: 18 } },
  { id: '4', name: 'Customer Success Newsletter', type: 'Email', status: 'Completed', budget: 2000, actualRevenue: 15000, owner: 'Michael Chen', metrics: { sent: 1500, opened: 890, clicked: 445, leads: 0 } },
];

const notifications = [
  { id: '1', type: 'deal', title: 'Deal Updated', message: 'Enterprise License deal moved to Negotiation', read: false, createdAt: '2024-12-09T10:30:00Z' },
  { id: '2', type: 'task', title: 'Task Due Soon', message: 'Follow up with TechFlow on proposal is due tomorrow', read: false, createdAt: '2024-12-09T09:00:00Z' },
  { id: '3', type: 'lead', title: 'New Lead Assigned', message: 'Alice Freeman from Quantum Solutions assigned to you', read: true, createdAt: '2024-12-08T16:45:00Z' },
  { id: '4', type: 'ticket', title: 'Urgent Ticket', message: 'High priority ticket from Global Dynamics needs attention', read: false, createdAt: '2024-12-09T08:15:00Z' },
];

const emails = [
  { id: '1', subject: 'Proposal for Enterprise License', from: 'sarah.jenkins@zenith.com', to: ['john.anderson@techflow.io'], status: 'sent', sentAt: '2024-12-08T14:30:00Z' },
  { id: '2', subject: 'Meeting Follow-up', from: 'michael.chen@zenith.com', to: ['robert@globaldynamics.com'], status: 'sent', sentAt: '2024-12-07T16:00:00Z' },
  { id: '3', subject: 'Product Demo Invitation', from: 'sarah.jenkins@zenith.com', to: ['jennifer@securenet.io'], status: 'scheduled', scheduledAt: '2024-12-12T09:00:00Z' },
  { id: '4', subject: 'Contract Review Request', from: 'michael.chen@zenith.com', to: ['james@alphawave.net'], status: 'draft' },
];

// Helper to parse path
function parsePath(url) {
  const path = url.replace(/^\/api/, '').replace(/\?.*$/, '');
  const segments = path.split('/').filter(Boolean);
  return { segments, path };
}

// CRUD helper
function handleCRUD(collection, req, res, id) {
  if (req.method === 'GET') {
    if (id) {
      const item = collection.find(i => i.id === id);
      return item ? res.status(200).json(item) : res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json(collection);
  }
  if (req.method === 'POST') {
    const newItem = { id: `${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
    collection.push(newItem);
    return res.status(201).json(newItem);
  }
  if (req.method === 'PUT' && id) {
    const index = collection.findIndex(i => i.id === id);
    if (index === -1) return res.status(404).json({ error: 'Not found' });
    collection[index] = { ...collection[index], ...req.body };
    return res.status(200).json(collection[index]);
  }
  if (req.method === 'DELETE' && id) {
    const index = collection.findIndex(i => i.id === id);
    if (index === -1) return res.status(404).json({ error: 'Not found' });
    collection.splice(index, 1);
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

module.exports = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { segments } = parsePath(req.url);
  const resource = segments[0];
  const id = segments[1];
  const subResource = segments[2];

  // Dashboard endpoints
  if (resource === 'dashboard') {
    if (id === 'stats') {
      const totalRevenue = deals.filter(d => d.stage === 'Closed Won').reduce((sum, d) => sum + d.value, 0);
      return res.status(200).json({
        totalLeads: leads.length,
        totalDeals: deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).length,
        totalAccounts: accounts.length,
        totalContacts: contacts.length,
        totalRevenue,
        openTasks: tasks.filter(t => t.status !== 'Completed').length,
        openTickets: 4,
        conversionRate: 24.8
      });
    }
    if (id === 'pipeline') {
      const stages = ['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
      return res.status(200).json(stages.map(stage => {
        const stageDeals = deals.filter(d => d.stage === stage);
        return { stage, count: stageDeals.length, value: stageDeals.reduce((sum, d) => sum + d.value, 0) };
      }));
    }
    if (id === 'lead-sources') {
      const sources = {};
      leads.forEach(lead => { sources[lead.source] = (sources[lead.source] || 0) + 1; });
      return res.status(200).json(Object.entries(sources).map(([source, count]) => ({ source, count })));
    }
    return res.status(404).json({ error: 'Dashboard endpoint not found' });
  }

  // Reports endpoints
  if (resource === 'reports') {
    if (id === 'revenue-by-month') {
      return res.status(200).json([
        { name: 'Jan', revenue: 45000, target: 50000 }, { name: 'Feb', revenue: 52000, target: 50000 },
        { name: 'Mar', revenue: 48000, target: 55000 }, { name: 'Apr', revenue: 61000, target: 55000 },
        { name: 'May', revenue: 55000, target: 60000 }, { name: 'Jun', revenue: 67000, target: 60000 },
        { name: 'Jul', revenue: 72000, target: 65000 }, { name: 'Aug', revenue: 69000, target: 70000 },
        { name: 'Sep', revenue: 78000, target: 70000 }, { name: 'Oct', revenue: 85000, target: 75000 },
        { name: 'Nov', revenue: 92000, target: 80000 }, { name: 'Dec', revenue: 88000, target: 85000 },
      ]);
    }
    if (id === 'leads-by-source') {
      return res.status(200).json([
        { name: 'Website', value: 35, color: '#4f46e5' }, { name: 'Referral', value: 25, color: '#059669' },
        { name: 'LinkedIn', value: 20, color: '#0891b2' }, { name: 'Cold Call', value: 10, color: '#7c3aed' },
        { name: 'Trade Show', value: 5, color: '#ea580c' }, { name: 'Email Campaign', value: 5, color: '#dc2626' },
      ]);
    }
    if (id === 'pipeline-summary') {
      return res.status(200).json([
        { name: 'Discovery', deals: 3, value: 85000 }, { name: 'Qualification', deals: 5, value: 120000 },
        { name: 'Proposal', deals: 4, value: 210000 }, { name: 'Negotiation', deals: 2, value: 95000 },
        { name: 'Closed Won', deals: 8, value: 380000 }, { name: 'Closed Lost', deals: 2, value: 45000 },
      ]);
    }
    if (id === 'sales-activity') {
      return res.status(200).json([
        { name: 'Mon', calls: 12, emails: 25, meetings: 3 }, { name: 'Tue', calls: 15, emails: 30, meetings: 4 },
        { name: 'Wed', calls: 10, emails: 22, meetings: 2 }, { name: 'Thu', calls: 18, emails: 35, meetings: 5 },
        { name: 'Fri', calls: 8, emails: 20, meetings: 2 },
      ]);
    }
    return res.status(404).json({ error: 'Report not found' });
  }

  // Notifications special endpoints
  if (resource === 'notifications') {
    if (id === 'read-all' && req.method === 'PUT') {
      notifications.forEach(n => n.read = true);
      return res.status(200).json({ success: true });
    }
    if (subResource === 'read' && req.method === 'PUT') {
      const notif = notifications.find(n => n.id === id);
      if (notif) notif.read = true;
      return res.status(200).json({ success: true });
    }
    return handleCRUD(notifications, req, res, id);
  }

  // Standard CRUD resources
  const resources = {
    leads, contacts, accounts, deals, tasks,
    'calendar-events': events,
    tickets, campaigns, emails, notifications
  };

  if (resources[resource]) {
    return handleCRUD(resources[resource], req, res, id);
  }

  // Root API info
  if (!resource) {
    return res.status(200).json({ message: 'Zenith CRM API', version: '1.0.0' });
  }

  return res.status(404).json({ error: 'Endpoint not found' });
};
