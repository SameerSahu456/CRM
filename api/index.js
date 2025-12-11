// Consolidated API handler for Vercel Hobby plan

// Mock data (inlined)
const mockLeads = [
  { id: '1', firstName: 'Alice', lastName: 'Freeman', company: 'Quantum Solutions', email: 'alice@quantum.io', status: 'New', source: 'Website', score: 85, owner: 'Sarah Jenkins' },
  { id: '2', firstName: 'Bob', lastName: 'Smith', company: 'Design Co.', email: 'bob@design.co', status: 'Contacted', source: 'Referral', score: 62, owner: 'Michael Chen' },
  { id: '3', firstName: 'Charlie', lastName: 'Davis', company: 'FinTech Plus', email: 'c.davis@fintech.com', status: 'Qualified', source: 'LinkedIn', score: 92, owner: 'Sarah Jenkins' },
  { id: '4', firstName: 'Diana', lastName: 'Prince', company: 'Amazone Corp', email: 'diana@amazone.com', status: 'Lost', source: 'Trade Show', score: 24, owner: 'Michael Chen' },
  { id: '5', firstName: 'Evan', lastName: 'Wright', company: 'Wright Logic', email: 'evan@wright.net', status: 'New', source: 'Website', score: 78, owner: 'Sarah Jenkins' },
  { id: '6', firstName: 'Fiona', lastName: 'Garcia', company: 'Health First', email: 'fiona@healthfirst.org', status: 'Contacted', source: 'Cold Call', score: 71, owner: 'Michael Chen' },
  { id: '7', firstName: 'George', lastName: 'Martinez', company: 'EduTech Inc', email: 'george@edutech.com', status: 'Qualified', source: 'Referral', score: 88, owner: 'Sarah Jenkins' },
  { id: '8', firstName: 'Hannah', lastName: 'Lee', company: 'Green Energy Co', email: 'hannah@greenenergy.com', status: 'Proposal', source: 'Email Campaign', score: 55, owner: 'Michael Chen' },
];
const mockContacts = [
  { id: '1', firstName: 'John', lastName: 'Anderson', email: 'john.anderson@techflow.io', jobTitle: 'CEO', accountName: 'TechFlow Inc.', type: 'Customer', status: 'Active', owner: 'Sarah Jenkins' },
  { id: '2', firstName: 'Maria', lastName: 'Santos', email: 'maria.santos@techflow.io', jobTitle: 'VP of Sales', accountName: 'TechFlow Inc.', type: 'Customer', status: 'Active', owner: 'Sarah Jenkins' },
  { id: '3', firstName: 'Robert', lastName: 'Johnson', email: 'robert@globaldynamics.com', jobTitle: 'COO', accountName: 'Global Dynamics', type: 'Customer', status: 'Active', owner: 'Michael Chen' },
  { id: '4', firstName: 'Jennifer', lastName: 'Williams', email: 'jennifer@securenet.io', jobTitle: 'CTO', accountName: 'SecureNet', type: 'Prospect', status: 'Active', owner: 'Sarah Jenkins' },
  { id: '5', firstName: 'James', lastName: 'Brown', email: 'james@alphawave.net', jobTitle: 'Founder', accountName: 'Alpha Wave', type: 'Customer', status: 'Active', owner: 'Michael Chen' },
  { id: '6', firstName: 'Lisa', lastName: 'Taylor', email: 'lisa@nextgen.tech', jobTitle: 'VP of Engineering', accountName: 'NextGen Systems', type: 'Customer', status: 'Active', owner: 'Sarah Jenkins' },
  { id: '7', firstName: 'David', lastName: 'Miller', email: 'david.miller@innovate.io', jobTitle: 'Product Director', accountName: 'Innovate Labs', type: 'Prospect', status: 'Active', owner: 'Michael Chen' },
  { id: '8', firstName: 'Sarah', lastName: 'Davis', email: 'sarah.davis@cloudpeak.com', jobTitle: 'Director of IT', accountName: 'CloudPeak', type: 'Customer', status: 'Inactive', owner: 'Sarah Jenkins' },
];
const mockAccounts = [
  { id: '1', name: 'TechFlow Inc.', industry: 'Software', revenue: 5000000, employees: 120, location: 'San Francisco, CA', healthScore: 92, type: 'Customer', status: 'Active', owner: 'Sarah Jenkins' },
  { id: '2', name: 'Global Dynamics', industry: 'Manufacturing', revenue: 12000000, employees: 450, location: 'Chicago, IL', healthScore: 78, type: 'Customer', status: 'Active', owner: 'Michael Chen' },
  { id: '3', name: 'SecureNet', industry: 'Cybersecurity', revenue: 2500000, employees: 50, location: 'Austin, TX', healthScore: 88, type: 'Prospect', status: 'Active', owner: 'Sarah Jenkins' },
  { id: '4', name: 'Alpha Wave', industry: 'Consulting', revenue: 800000, employees: 15, location: 'New York, NY', healthScore: 65, type: 'Customer', status: 'Active', owner: 'Michael Chen' },
  { id: '5', name: 'NextGen Systems', industry: 'Hardware', revenue: 7500000, employees: 200, location: 'Boston, MA', healthScore: 95, type: 'Customer', status: 'Active', owner: 'Sarah Jenkins' },
  { id: '6', name: 'Innovate Labs', industry: 'Research', revenue: 3200000, employees: 80, location: 'Seattle, WA', healthScore: 71, type: 'Prospect', status: 'Active', owner: 'Michael Chen' },
  { id: '7', name: 'CloudPeak', industry: 'Cloud Services', revenue: 9000000, employees: 300, location: 'Denver, CO', healthScore: 45, type: 'Customer', status: 'Churned', owner: 'Sarah Jenkins' },
  { id: '8', name: 'DataVault', industry: 'Data Storage', revenue: 4500000, employees: 95, location: 'Portland, OR', healthScore: 82, type: 'Customer', status: 'Active', owner: 'Michael Chen' },
];
const mockDeals = [
  { id: '1', title: 'Enterprise License', company: 'TechFlow Inc.', value: 45000, stage: 'Qualification', probability: 20, owner: 'Sarah Jenkins', closingDate: 'Dec 24, 2024', type: 'New Business' },
  { id: '2', title: 'Q4 Marketing Audit', company: 'Global Dynamics', value: 12000, stage: 'Qualification', probability: 30, owner: 'Michael Chen', closingDate: 'Dec 28, 2024', type: 'New Business' },
  { id: '3', title: 'Security Suite Upgrade', company: 'SecureNet', value: 85000, stage: 'Proposal', probability: 60, owner: 'Sarah Jenkins', closingDate: 'Jan 15, 2025', type: 'Existing Business' },
  { id: '4', title: 'Consulting Retainer', company: 'Alpha Wave', value: 24000, stage: 'Negotiation', probability: 85, owner: 'Michael Chen', closingDate: 'Dec 30, 2024', type: 'Renewal' },
  { id: '5', title: 'Cloud Migration Project', company: 'NextGen Systems', value: 120000, stage: 'Closed Won', probability: 100, owner: 'Sarah Jenkins', closingDate: 'Dec 12, 2024', type: 'New Business' },
  { id: '6', title: 'Annual Support Contract', company: 'DataVault', value: 36000, stage: 'Discovery', probability: 40, owner: 'Michael Chen', closingDate: 'Jan 20, 2025', type: 'Renewal' },
  { id: '7', title: 'Platform Integration', company: 'Innovate Labs', value: 65000, stage: 'Proposal', probability: 55, owner: 'Sarah Jenkins', closingDate: 'Feb 01, 2025', type: 'New Business' },
  { id: '8', title: 'Data Analytics Package', company: 'TechFlow Inc.', value: 28000, stage: 'Negotiation', probability: 75, owner: 'Sarah Jenkins', closingDate: 'Dec 20, 2024', type: 'Existing Business' },
  { id: '9', title: 'Training Program', company: 'Global Dynamics', value: 8500, stage: 'Closed Won', probability: 100, owner: 'Michael Chen', closingDate: 'Dec 05, 2024', type: 'Existing Business' },
  { id: '10', title: 'Expansion Deal', company: 'CloudPeak', value: 55000, stage: 'Closed Lost', probability: 0, owner: 'Sarah Jenkins', closingDate: 'Nov 30, 2024', type: 'Existing Business' },
];
const mockTasks = [
  { id: '1', title: 'Follow up with TechFlow on proposal', type: 'Follow-up', status: 'Not Started', priority: 'High', dueDate: '2024-12-12', assignedTo: 'Sarah Jenkins' },
  { id: '2', title: 'Send contract to Alpha Wave', type: 'Email', status: 'In Progress', priority: 'Urgent', dueDate: '2024-12-10', assignedTo: 'Michael Chen' },
  { id: '3', title: 'Schedule demo with SecureNet', type: 'Demo', status: 'Not Started', priority: 'Normal', dueDate: '2024-12-15', assignedTo: 'Sarah Jenkins' },
  { id: '4', title: 'Review Q4 pipeline report', type: 'Task', status: 'Completed', priority: 'Normal', dueDate: '2024-12-05', assignedTo: 'Sarah Jenkins' },
  { id: '5', title: 'Call with new lead', type: 'Call', status: 'Not Started', priority: 'High', dueDate: '2024-12-11', assignedTo: 'Sarah Jenkins' },
  { id: '6', title: 'Prepare quarterly business review', type: 'Task', status: 'In Progress', priority: 'High', dueDate: '2024-12-18', assignedTo: 'Michael Chen' },
  { id: '7', title: 'Update CRM with new contact info', type: 'Task', status: 'Not Started', priority: 'Low', dueDate: '2024-12-20', assignedTo: 'Michael Chen' },
  { id: '8', title: 'Send holiday greetings', type: 'Email', status: 'Not Started', priority: 'Normal', dueDate: '2024-12-22', assignedTo: 'Sarah Jenkins' },
];
const mockCalendarEvents = [
  { id: '1', title: 'TechFlow Enterprise Demo', type: 'Demo', start: '2024-12-11T10:00:00', end: '2024-12-11T11:30:00', location: 'Zoom', owner: 'Sarah Jenkins', color: '#4f46e5' },
  { id: '2', title: 'Alpha Wave Contract Review', type: 'Meeting', start: '2024-12-12T14:00:00', end: '2024-12-12T15:00:00', location: 'Conference Room A', owner: 'Michael Chen', color: '#059669' },
  { id: '3', title: 'Team Standup', type: 'Meeting', start: '2024-12-10T09:00:00', end: '2024-12-10T09:30:00', location: 'Main Office', owner: 'Sarah Jenkins', color: '#7c3aed' },
  { id: '4', title: 'Q4 Pipeline Review', type: 'Meeting', start: '2024-12-13T15:00:00', end: '2024-12-13T16:30:00', location: 'Board Room', owner: 'Sarah Jenkins', color: '#dc2626' },
  { id: '5', title: 'SecureNet Discovery Call', type: 'Call', start: '2024-12-15T11:00:00', end: '2024-12-15T11:45:00', owner: 'Sarah Jenkins', color: '#0891b2' },
  { id: '6', title: 'Sales Training Workshop', type: 'Webinar', start: '2024-12-16T13:00:00', end: '2024-12-16T16:00:00', location: 'Training Room', owner: 'Sarah Jenkins', color: '#ea580c' },
  { id: '7', title: 'Holiday Office Party', type: 'Meeting', start: '2024-12-20T17:00:00', end: '2024-12-20T20:00:00', location: 'Main Lobby', owner: 'Sarah Jenkins', color: '#059669' },
  { id: '8', title: 'Year-End Review Meeting', type: 'Meeting', start: '2024-12-27T10:00:00', end: '2024-12-27T12:00:00', location: 'Board Room', owner: 'Sarah Jenkins', color: '#4f46e5' },
];

// In-memory data stores
let leads = [...mockLeads];
let contacts = [...mockContacts];
let accounts = [...mockAccounts];
let deals = [...mockDeals];
let tasks = [...mockTasks];
let events = [...mockCalendarEvents];

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

export default function handler(req, res) {
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
}
