import { Lead, Contact, Account, Deal, Task, CalendarEvent, Campaign, Ticket, Email, Notification, User } from '../types';

// Users
export const mockUsers: User[] = [
  { id: '1', firstName: 'Sarah', lastName: 'Jenkins', email: 'sarah.jenkins@zenith.com', avatar: 'https://randomuser.me/api/portraits/women/1.jpg', role: 'Sales Manager', department: 'Sales', isActive: true, createdAt: '2024-01-15' },
  { id: '2', firstName: 'Michael', lastName: 'Chen', email: 'michael.chen@zenith.com', avatar: 'https://randomuser.me/api/portraits/men/2.jpg', role: 'Sales Rep', department: 'Sales', isActive: true, createdAt: '2024-02-01' },
  { id: '3', firstName: 'Emily', lastName: 'Rodriguez', email: 'emily.rodriguez@zenith.com', avatar: 'https://randomuser.me/api/portraits/women/3.jpg', role: 'Marketing', department: 'Marketing', isActive: true, createdAt: '2024-01-20' },
  { id: '4', firstName: 'David', lastName: 'Kim', email: 'david.kim@zenith.com', avatar: 'https://randomuser.me/api/portraits/men/4.jpg', role: 'Support', department: 'Customer Success', isActive: true, createdAt: '2024-03-10' },
  { id: '5', firstName: 'Alex', lastName: 'Thompson', email: 'alex.thompson@zenith.com', avatar: 'https://randomuser.me/api/portraits/men/5.jpg', role: 'Admin', department: 'IT', isActive: true, createdAt: '2024-01-01' },
];

// Leads
export const mockLeads: Lead[] = [
  { id: '1', firstName: 'Alice', lastName: 'Freeman', company: 'Quantum Solutions', email: 'alice@quantum.io', phone: '+1 555-0101', status: 'New', source: 'Website', score: 85, lastActive: '2m ago', avatar: 'https://randomuser.me/api/portraits/women/10.jpg', owner: 'Sarah Jenkins', createdAt: '2024-12-01', industry: 'Technology', jobTitle: 'VP of Engineering', budget: 75000 },
  { id: '2', firstName: 'Bob', lastName: 'Smith', company: 'Design Co.', email: 'bob@design.co', phone: '+1 555-0102', status: 'Contacted', source: 'Referral', score: 62, lastActive: '1h ago', avatar: 'https://randomuser.me/api/portraits/men/11.jpg', owner: 'Michael Chen', createdAt: '2024-11-28', industry: 'Creative', jobTitle: 'Creative Director', budget: 25000 },
  { id: '3', firstName: 'Charlie', lastName: 'Davis', company: 'FinTech Plus', email: 'c.davis@fintech.com', phone: '+1 555-0103', status: 'Qualified', source: 'LinkedIn', score: 92, lastActive: '3h ago', avatar: 'https://randomuser.me/api/portraits/men/12.jpg', owner: 'Sarah Jenkins', createdAt: '2024-11-25', industry: 'Finance', jobTitle: 'CTO', budget: 150000, tags: ['Enterprise', 'Hot Lead'] },
  { id: '4', firstName: 'Diana', lastName: 'Prince', company: 'Amazone Corp', email: 'diana@amazone.com', phone: '+1 555-0104', status: 'Lost', source: 'Trade Show', score: 24, lastActive: '2d ago', avatar: 'https://randomuser.me/api/portraits/women/13.jpg', owner: 'Michael Chen', createdAt: '2024-11-20', industry: 'Retail', jobTitle: 'Procurement Manager' },
  { id: '5', firstName: 'Evan', lastName: 'Wright', company: 'Wright Logic', email: 'evan@wright.net', phone: '+1 555-0105', status: 'New', source: 'Website', score: 78, lastActive: '5m ago', avatar: 'https://randomuser.me/api/portraits/men/14.jpg', owner: 'Sarah Jenkins', createdAt: '2024-12-05', industry: 'Technology', jobTitle: 'Product Manager', budget: 45000 },
  { id: '6', firstName: 'Fiona', lastName: 'Garcia', company: 'Health First', email: 'fiona@healthfirst.org', phone: '+1 555-0106', status: 'Contacted', source: 'Cold Call', score: 71, lastActive: '30m ago', avatar: 'https://randomuser.me/api/portraits/women/15.jpg', owner: 'Michael Chen', createdAt: '2024-12-03', industry: 'Healthcare', jobTitle: 'Operations Director', budget: 60000 },
  { id: '7', firstName: 'George', lastName: 'Martinez', company: 'EduTech Inc', email: 'george@edutech.com', phone: '+1 555-0107', status: 'Qualified', source: 'Referral', score: 88, lastActive: '1d ago', avatar: 'https://randomuser.me/api/portraits/men/16.jpg', owner: 'Sarah Jenkins', createdAt: '2024-11-30', industry: 'Education', jobTitle: 'CEO', budget: 120000, tags: ['Enterprise'] },
  { id: '8', firstName: 'Hannah', lastName: 'Lee', company: 'Green Energy Co', email: 'hannah@greenenergy.com', phone: '+1 555-0108', status: 'Proposal', source: 'Email Campaign', score: 55, lastActive: '4h ago', avatar: 'https://randomuser.me/api/portraits/women/17.jpg', owner: 'Michael Chen', createdAt: '2024-12-06', industry: 'Energy', jobTitle: 'Sustainability Manager', budget: 35000 },
];

// Contacts
export const mockContacts: Contact[] = [
  { id: '1', firstName: 'John', lastName: 'Anderson', email: 'john.anderson@techflow.io', phone: '+1 555-1001', jobTitle: 'CEO', department: 'Executive', accountId: '1', accountName: 'TechFlow Inc.', type: 'Customer', status: 'Active', avatar: 'https://randomuser.me/api/portraits/men/20.jpg', createdAt: '2024-06-15', owner: 'Sarah Jenkins', lastContacted: '2024-12-05' },
  { id: '2', firstName: 'Maria', lastName: 'Santos', email: 'maria.santos@techflow.io', phone: '+1 555-1002', jobTitle: 'VP of Sales', department: 'Sales', accountId: '1', accountName: 'TechFlow Inc.', type: 'Customer', status: 'Active', avatar: 'https://randomuser.me/api/portraits/women/21.jpg', createdAt: '2024-06-20', owner: 'Sarah Jenkins', lastContacted: '2024-12-08' },
  { id: '3', firstName: 'Robert', lastName: 'Johnson', email: 'robert@globaldynamics.com', phone: '+1 555-1003', jobTitle: 'COO', department: 'Operations', accountId: '2', accountName: 'Global Dynamics', type: 'Customer', status: 'Active', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', createdAt: '2024-05-10', owner: 'Michael Chen', lastContacted: '2024-12-01' },
  { id: '4', firstName: 'Jennifer', lastName: 'Williams', email: 'jennifer@securenet.io', phone: '+1 555-1004', jobTitle: 'CTO', department: 'Technology', accountId: '3', accountName: 'SecureNet', type: 'Prospect', status: 'Active', avatar: 'https://randomuser.me/api/portraits/women/23.jpg', createdAt: '2024-08-01', owner: 'Sarah Jenkins', lastContacted: '2024-12-03' },
  { id: '5', firstName: 'James', lastName: 'Brown', email: 'james@alphawave.net', phone: '+1 555-1005', jobTitle: 'Founder', department: 'Executive', accountId: '4', accountName: 'Alpha Wave', type: 'Customer', status: 'Active', avatar: 'https://randomuser.me/api/portraits/men/24.jpg', createdAt: '2024-07-15', owner: 'Michael Chen', lastContacted: '2024-12-07' },
  { id: '6', firstName: 'Lisa', lastName: 'Taylor', email: 'lisa@nextgen.tech', phone: '+1 555-1006', jobTitle: 'VP of Engineering', department: 'Engineering', accountId: '5', accountName: 'NextGen Systems', type: 'Customer', status: 'Active', avatar: 'https://randomuser.me/api/portraits/women/25.jpg', createdAt: '2024-04-20', owner: 'Sarah Jenkins', lastContacted: '2024-12-09' },
  { id: '7', firstName: 'David', lastName: 'Miller', email: 'david.miller@innovate.io', phone: '+1 555-1007', jobTitle: 'Product Director', department: 'Product', accountId: '6', accountName: 'Innovate Labs', type: 'Prospect', status: 'Active', avatar: 'https://randomuser.me/api/portraits/men/26.jpg', createdAt: '2024-09-05', owner: 'Michael Chen', lastContacted: '2024-11-28' },
  { id: '8', firstName: 'Sarah', lastName: 'Davis', email: 'sarah.davis@cloudpeak.com', phone: '+1 555-1008', jobTitle: 'Director of IT', department: 'IT', accountId: '7', accountName: 'CloudPeak', type: 'Customer', status: 'Inactive', avatar: 'https://randomuser.me/api/portraits/women/27.jpg', createdAt: '2024-03-10', owner: 'Sarah Jenkins', lastContacted: '2024-10-15' },
];

// Accounts
export const mockAccounts: Account[] = [
  { id: '1', name: 'TechFlow Inc.', industry: 'Software', website: 'techflow.io', revenue: 5000000, employees: 120, location: 'San Francisco, CA', healthScore: 92, logo: 'https://ui-avatars.com/api/?name=TF&background=4f46e5&color=fff', type: 'Customer', status: 'Active', owner: 'Sarah Jenkins', createdAt: '2024-01-15', phone: '+1 555-2001' },
  { id: '2', name: 'Global Dynamics', industry: 'Manufacturing', website: 'globaldynamics.com', revenue: 12000000, employees: 450, location: 'Chicago, IL', healthScore: 78, logo: 'https://ui-avatars.com/api/?name=GD&background=059669&color=fff', type: 'Customer', status: 'Active', owner: 'Michael Chen', createdAt: '2024-02-20', phone: '+1 555-2002' },
  { id: '3', name: 'SecureNet', industry: 'Cybersecurity', website: 'securenet.io', revenue: 2500000, employees: 50, location: 'Austin, TX', healthScore: 88, logo: 'https://ui-avatars.com/api/?name=SN&background=dc2626&color=fff', type: 'Prospect', status: 'Active', owner: 'Sarah Jenkins', createdAt: '2024-03-10', phone: '+1 555-2003' },
  { id: '4', name: 'Alpha Wave', industry: 'Consulting', website: 'alphawave.net', revenue: 800000, employees: 15, location: 'New York, NY', healthScore: 65, logo: 'https://ui-avatars.com/api/?name=AW&background=7c3aed&color=fff', type: 'Customer', status: 'Active', owner: 'Michael Chen', createdAt: '2024-04-05', phone: '+1 555-2004' },
  { id: '5', name: 'NextGen Systems', industry: 'Hardware', website: 'nextgen.tech', revenue: 7500000, employees: 200, location: 'Boston, MA', healthScore: 95, logo: 'https://ui-avatars.com/api/?name=NG&background=0891b2&color=fff', type: 'Customer', status: 'Active', owner: 'Sarah Jenkins', createdAt: '2024-01-25', phone: '+1 555-2005' },
  { id: '6', name: 'Innovate Labs', industry: 'Research', website: 'innovate.io', revenue: 3200000, employees: 80, location: 'Seattle, WA', healthScore: 71, logo: 'https://ui-avatars.com/api/?name=IL&background=ea580c&color=fff', type: 'Prospect', status: 'Active', owner: 'Michael Chen', createdAt: '2024-05-15', phone: '+1 555-2006' },
  { id: '7', name: 'CloudPeak', industry: 'Cloud Services', website: 'cloudpeak.com', revenue: 9000000, employees: 300, location: 'Denver, CO', healthScore: 45, logo: 'https://ui-avatars.com/api/?name=CP&background=0284c7&color=fff', type: 'Customer', status: 'Churned', owner: 'Sarah Jenkins', createdAt: '2023-11-20', phone: '+1 555-2007' },
  { id: '8', name: 'DataVault', industry: 'Data Storage', website: 'datavault.io', revenue: 4500000, employees: 95, location: 'Portland, OR', healthScore: 82, logo: 'https://ui-avatars.com/api/?name=DV&background=4338ca&color=fff', type: 'Customer', status: 'Active', owner: 'Michael Chen', createdAt: '2024-06-01', phone: '+1 555-2008' },
];

// Deals
export const mockDeals: Deal[] = [
  { id: '1', title: 'Enterprise License', company: 'TechFlow Inc.', accountId: '1', value: 45000, stage: 'Qualification', probability: 20, owner: 'Sarah Jenkins', closingDate: 'Dec 24, 2024', createdAt: '2024-11-01', contactName: 'John Anderson', forecast: 'Pipeline', type: 'New Business' },
  { id: '2', title: 'Q4 Marketing Audit', company: 'Global Dynamics', accountId: '2', value: 12000, stage: 'Qualification', probability: 30, owner: 'Michael Chen', closingDate: 'Dec 28, 2024', createdAt: '2024-11-15', contactName: 'Robert Johnson', forecast: 'Pipeline', type: 'New Business' },
  { id: '3', title: 'Security Suite Upgrade', company: 'SecureNet', accountId: '3', value: 85000, stage: 'Proposal', probability: 60, owner: 'Sarah Jenkins', closingDate: 'Jan 15, 2025', createdAt: '2024-10-20', contactName: 'Jennifer Williams', forecast: 'Best Case', type: 'Existing Business' },
  { id: '4', title: 'Consulting Retainer', company: 'Alpha Wave', accountId: '4', value: 24000, stage: 'Negotiation', probability: 85, owner: 'Michael Chen', closingDate: 'Dec 30, 2024', createdAt: '2024-09-15', contactName: 'James Brown', forecast: 'Commit', type: 'Renewal' },
  { id: '5', title: 'Cloud Migration Project', company: 'NextGen Systems', accountId: '5', value: 120000, stage: 'Closed Won', probability: 100, owner: 'Sarah Jenkins', closingDate: 'Dec 12, 2024', createdAt: '2024-08-01', contactName: 'Lisa Taylor', forecast: 'Commit', type: 'New Business' },
  { id: '6', title: 'Annual Support Contract', company: 'DataVault', accountId: '8', value: 36000, stage: 'Discovery', probability: 40, owner: 'Michael Chen', closingDate: 'Jan 20, 2025', createdAt: '2024-11-20', contactName: 'Sarah Davis', forecast: 'Pipeline', type: 'Renewal' },
  { id: '7', title: 'Platform Integration', company: 'Innovate Labs', accountId: '6', value: 65000, stage: 'Proposal', probability: 55, owner: 'Sarah Jenkins', closingDate: 'Feb 01, 2025', createdAt: '2024-10-10', contactName: 'David Miller', forecast: 'Best Case', type: 'New Business' },
  { id: '8', title: 'Data Analytics Package', company: 'TechFlow Inc.', accountId: '1', value: 28000, stage: 'Negotiation', probability: 75, owner: 'Sarah Jenkins', closingDate: 'Dec 20, 2024', createdAt: '2024-10-25', contactName: 'Maria Santos', forecast: 'Commit', type: 'Existing Business' },
  { id: '9', title: 'Training Program', company: 'Global Dynamics', accountId: '2', value: 8500, stage: 'Closed Won', probability: 100, owner: 'Michael Chen', closingDate: 'Dec 05, 2024', createdAt: '2024-10-01', contactName: 'Robert Johnson', forecast: 'Commit', type: 'Existing Business' },
  { id: '10', title: 'Expansion Deal', company: 'CloudPeak', accountId: '7', value: 55000, stage: 'Closed Lost', probability: 0, owner: 'Sarah Jenkins', closingDate: 'Nov 30, 2024', createdAt: '2024-09-01', contactName: 'Sarah Davis', lostReason: 'Lost to competitor', forecast: 'Omitted', type: 'Existing Business' },
];

// Tasks
export const mockTasks: Task[] = [
  { id: '1', title: 'Follow up with TechFlow on proposal', type: 'Follow-up', status: 'Not Started', priority: 'High', dueDate: '2024-12-12', dueTime: '10:00', assignedTo: 'Sarah Jenkins', createdBy: 'Sarah Jenkins', createdAt: '2024-12-08', relatedTo: { type: 'Deal', id: '1', name: 'Enterprise License' } },
  { id: '2', title: 'Send contract to Alpha Wave', type: 'Email', status: 'In Progress', priority: 'Urgent', dueDate: '2024-12-10', dueTime: '14:00', assignedTo: 'Michael Chen', createdBy: 'Sarah Jenkins', createdAt: '2024-12-07', relatedTo: { type: 'Deal', id: '4', name: 'Consulting Retainer' } },
  { id: '3', title: 'Schedule demo with SecureNet', type: 'Demo', status: 'Not Started', priority: 'Normal', dueDate: '2024-12-15', assignedTo: 'Sarah Jenkins', createdBy: 'Michael Chen', createdAt: '2024-12-06', relatedTo: { type: 'Contact', id: '4', name: 'Jennifer Williams' } },
  { id: '4', title: 'Review Q4 pipeline report', type: 'Task', status: 'Completed', priority: 'Normal', dueDate: '2024-12-05', assignedTo: 'Sarah Jenkins', createdBy: 'Sarah Jenkins', createdAt: '2024-12-01', completedAt: '2024-12-05' },
  { id: '5', title: 'Call with new lead - Quantum Solutions', type: 'Call', status: 'Not Started', priority: 'High', dueDate: '2024-12-11', dueTime: '11:00', assignedTo: 'Sarah Jenkins', createdBy: 'Sarah Jenkins', createdAt: '2024-12-08', relatedTo: { type: 'Lead', id: '1', name: 'Alice Freeman' } },
  { id: '6', title: 'Prepare quarterly business review', type: 'Task', status: 'In Progress', priority: 'High', dueDate: '2024-12-18', assignedTo: 'Michael Chen', createdBy: 'Sarah Jenkins', createdAt: '2024-12-05' },
  { id: '7', title: 'Update CRM with new contact info', type: 'Task', status: 'Not Started', priority: 'Low', dueDate: '2024-12-20', assignedTo: 'Michael Chen', createdBy: 'Michael Chen', createdAt: '2024-12-07', relatedTo: { type: 'Account', id: '2', name: 'Global Dynamics' } },
  { id: '8', title: 'Send holiday greetings to top accounts', type: 'Email', status: 'Not Started', priority: 'Normal', dueDate: '2024-12-22', assignedTo: 'Sarah Jenkins', createdBy: 'Sarah Jenkins', createdAt: '2024-12-08' },
];

// Calendar Events
export const mockCalendarEvents: CalendarEvent[] = [
  { id: '1', title: 'TechFlow Enterprise Demo', type: 'Demo', start: '2024-12-11T10:00:00', end: '2024-12-11T11:30:00', location: 'Zoom Meeting', owner: 'Sarah Jenkins', color: '#4f46e5', relatedTo: { type: 'Deal', id: '1', name: 'Enterprise License' }, attendees: [{ id: '1', name: 'John Anderson', email: 'john@techflow.io', status: 'Accepted', type: 'Required' }] },
  { id: '2', title: 'Alpha Wave Contract Review', type: 'Meeting', start: '2024-12-12T14:00:00', end: '2024-12-12T15:00:00', location: 'Conference Room A', owner: 'Michael Chen', color: '#059669', relatedTo: { type: 'Deal', id: '4', name: 'Consulting Retainer' } },
  { id: '3', title: 'Team Standup', type: 'Meeting', start: '2024-12-10T09:00:00', end: '2024-12-10T09:30:00', location: 'Main Office', owner: 'Sarah Jenkins', color: '#7c3aed' },
  { id: '4', title: 'Q4 Pipeline Review', type: 'Meeting', start: '2024-12-13T15:00:00', end: '2024-12-13T16:30:00', location: 'Board Room', owner: 'Sarah Jenkins', color: '#dc2626' },
  { id: '5', title: 'SecureNet Discovery Call', type: 'Call', start: '2024-12-15T11:00:00', end: '2024-12-15T11:45:00', owner: 'Sarah Jenkins', color: '#0891b2', relatedTo: { type: 'Account', id: '3', name: 'SecureNet' } },
  { id: '6', title: 'Sales Training Workshop', type: 'Webinar', start: '2024-12-16T13:00:00', end: '2024-12-16T16:00:00', location: 'Training Room', owner: 'Sarah Jenkins', color: '#ea580c' },
  { id: '7', title: 'Holiday Office Party', type: 'Meeting', start: '2024-12-20T17:00:00', end: '2024-12-20T20:00:00', location: 'Main Lobby', owner: 'Sarah Jenkins', color: '#059669', allDay: false },
  { id: '8', title: 'Year-End Review Meeting', type: 'Meeting', start: '2024-12-27T10:00:00', end: '2024-12-27T12:00:00', location: 'Board Room', owner: 'Sarah Jenkins', color: '#4f46e5' },
];

// Campaigns
export const mockCampaigns: Campaign[] = [
  { id: '1', name: 'Q4 Product Launch', type: 'Email', status: 'Active', startDate: '2024-10-01', endDate: '2024-12-31', budget: 25000, actualCost: 18500, expectedRevenue: 150000, actualRevenue: 95000, owner: 'Emily Rodriguez', createdAt: '2024-09-15', targetAudience: 'Enterprise IT Directors', goals: 'Generate 500 MQLs', metrics: { sent: 5000, delivered: 4850, opened: 2180, clicked: 890, converted: 45, leads: 320 } },
  { id: '2', name: 'Winter Webinar Series', type: 'Webinar', status: 'Active', startDate: '2024-11-15', endDate: '2025-01-31', budget: 15000, actualCost: 8200, expectedRevenue: 75000, owner: 'Emily Rodriguez', createdAt: '2024-10-20', targetAudience: 'SMB Decision Makers', goals: '1000 registrations, 50% attendance', metrics: { sent: 8000, delivered: 7800, opened: 3900, clicked: 1560, converted: 78, leads: 450 } },
  { id: '3', name: 'LinkedIn Lead Gen', type: 'Social Media', status: 'Active', startDate: '2024-09-01', endDate: '2024-12-31', budget: 20000, actualCost: 16800, expectedRevenue: 100000, actualRevenue: 62000, owner: 'Emily Rodriguez', createdAt: '2024-08-15', targetAudience: 'C-Level Executives', goals: 'Generate 200 SQLs', metrics: { sent: 15000, delivered: 14500, opened: 5800, clicked: 2320, converted: 116, leads: 580 } },
  { id: '4', name: 'Trade Show - TechExpo 2024', type: 'Trade Show', status: 'Completed', startDate: '2024-09-15', endDate: '2024-09-18', budget: 50000, actualCost: 48500, expectedRevenue: 200000, actualRevenue: 185000, owner: 'Emily Rodriguez', createdAt: '2024-06-01', targetAudience: 'Industry Professionals', goals: '500 booth visits, 100 demos', metrics: { leads: 320, converted: 28 } },
  { id: '5', name: 'Customer Referral Program', type: 'Referral Program', status: 'Active', startDate: '2024-01-01', endDate: '2024-12-31', budget: 30000, actualCost: 22000, expectedRevenue: 250000, actualRevenue: 180000, owner: 'Sarah Jenkins', createdAt: '2023-12-01', targetAudience: 'Existing Customers', goals: '50 referrals per quarter', metrics: { leads: 145, converted: 42 } },
  { id: '6', name: 'Holiday Promotion', type: 'Email', status: 'Planning', startDate: '2024-12-15', endDate: '2024-12-31', budget: 10000, owner: 'Emily Rodriguez', createdAt: '2024-11-20', targetAudience: 'All Prospects', goals: '20% discount uptake' },
];

// Tickets
export const mockTickets: Ticket[] = [
  { id: '1', ticketNumber: 'TKT-001234', subject: 'Unable to access dashboard', description: 'User reports that the dashboard is not loading after login.', status: 'In Progress', priority: 'High', type: 'Problem', category: 'Technical', contactId: '1', contactName: 'John Anderson', contactEmail: 'john.anderson@techflow.io', accountId: '1', accountName: 'TechFlow Inc.', assignedTo: 'David Kim', createdAt: '2024-12-08T09:30:00', updatedAt: '2024-12-08T14:20:00', sla: { responseTime: 4, resolutionTime: 24, breached: false } },
  { id: '2', ticketNumber: 'TKT-001235', subject: 'Feature request: Export to PDF', description: 'Would like to be able to export reports directly to PDF format.', status: 'Open', priority: 'Low', type: 'Feature Request', category: 'Product', contactId: '2', contactName: 'Maria Santos', contactEmail: 'maria.santos@techflow.io', accountId: '1', accountName: 'TechFlow Inc.', assignedTo: 'David Kim', createdAt: '2024-12-07T11:15:00', updatedAt: '2024-12-07T11:15:00', sla: { responseTime: 8, resolutionTime: 72, breached: false } },
  { id: '3', ticketNumber: 'TKT-001236', subject: 'Billing discrepancy', description: 'Invoice shows incorrect amount for November.', status: 'Pending', priority: 'Medium', type: 'Question', category: 'Billing', contactId: '3', contactName: 'Robert Johnson', contactEmail: 'robert@globaldynamics.com', accountId: '2', accountName: 'Global Dynamics', assignedTo: 'David Kim', createdAt: '2024-12-06T16:45:00', updatedAt: '2024-12-08T10:00:00', sla: { responseTime: 4, resolutionTime: 48, breached: false } },
  { id: '4', ticketNumber: 'TKT-001237', subject: 'Integration with Slack not working', description: 'Slack notifications stopped working after last update.', status: 'Resolved', priority: 'High', type: 'Bug', category: 'Integration', contactId: '6', contactName: 'Lisa Taylor', contactEmail: 'lisa@nextgen.tech', accountId: '5', accountName: 'NextGen Systems', assignedTo: 'David Kim', createdAt: '2024-12-04T08:20:00', updatedAt: '2024-12-06T15:30:00', resolvedAt: '2024-12-06T15:30:00', sla: { responseTime: 4, resolutionTime: 24, breached: false }, satisfaction: { rating: 5, feedback: 'Quick resolution, great support!' } },
  { id: '5', ticketNumber: 'TKT-001238', subject: 'Need help with API setup', description: 'Requesting assistance with REST API configuration.', status: 'Open', priority: 'Medium', type: 'Question', category: 'Technical', contactId: '4', contactName: 'Jennifer Williams', contactEmail: 'jennifer@securenet.io', accountId: '3', accountName: 'SecureNet', createdAt: '2024-12-08T13:00:00', updatedAt: '2024-12-08T13:00:00', sla: { responseTime: 4, resolutionTime: 48, breached: false } },
  { id: '6', ticketNumber: 'TKT-001239', subject: 'Account upgrade request', description: 'Would like to upgrade from Standard to Professional plan.', status: 'Closed', priority: 'Low', type: 'Task', category: 'Account', contactId: '5', contactName: 'James Brown', contactEmail: 'james@alphawave.net', accountId: '4', accountName: 'Alpha Wave', assignedTo: 'David Kim', createdAt: '2024-12-02T10:00:00', updatedAt: '2024-12-03T09:30:00', resolvedAt: '2024-12-03T09:00:00', closedAt: '2024-12-03T09:30:00', sla: { responseTime: 8, resolutionTime: 48, breached: false }, satisfaction: { rating: 4 } },
];

// Emails (Sent/Scheduled)
export const mockEmails: Email[] = [
  { id: '1', subject: 'Follow-up: TechFlow Enterprise Demo', body: 'Hi John, Thank you for attending the demo...', from: 'sarah.jenkins@zenith.com', to: ['john.anderson@techflow.io'], status: 'Sent', sentAt: '2024-12-08T15:30:00', relatedTo: { type: 'Deal', id: '1', name: 'Enterprise License' }, trackOpens: true, trackClicks: true, openedAt: '2024-12-08T16:45:00' },
  { id: '2', subject: 'Proposal: Security Suite Upgrade', body: 'Dear Jennifer, Please find attached our proposal...', from: 'sarah.jenkins@zenith.com', to: ['jennifer@securenet.io'], status: 'Sent', sentAt: '2024-12-07T10:00:00', relatedTo: { type: 'Deal', id: '3', name: 'Security Suite Upgrade' }, trackOpens: true },
  { id: '3', subject: 'Contract for Review - Alpha Wave', body: 'Hi James, Attached is the contract for your review...', from: 'michael.chen@zenith.com', to: ['james@alphawave.net'], status: 'Scheduled', scheduledAt: '2024-12-10T09:00:00', relatedTo: { type: 'Deal', id: '4', name: 'Consulting Retainer' } },
  { id: '4', subject: 'Welcome to Zenith CRM!', body: 'Welcome aboard! We are excited to have you...', from: 'support@zenith.com', to: ['new.customer@example.com'], status: 'Sent', sentAt: '2024-12-06T08:00:00' },
  { id: '5', subject: 'Q4 Newsletter', body: 'Check out what is new this quarter...', from: 'marketing@zenith.com', to: ['all-customers@zenith.com'], status: 'Sent', sentAt: '2024-12-01T10:00:00', relatedTo: { type: 'Campaign', id: '1', name: 'Q4 Product Launch' } },
];

// Notifications
export const mockNotifications: Notification[] = [
  { id: '1', type: 'success', title: 'Deal Won!', message: 'Cloud Migration Project with NextGen Systems has been closed.', read: false, createdAt: '2024-12-08T14:30:00', relatedTo: { type: 'Deal', id: '5' } },
  { id: '2', type: 'task', title: 'Task Due Soon', message: 'Follow up with TechFlow on proposal is due in 2 hours.', read: false, createdAt: '2024-12-08T08:00:00', relatedTo: { type: 'Task', id: '1' } },
  { id: '3', type: 'info', title: 'New Lead Assigned', message: 'Alice Freeman from Quantum Solutions has been assigned to you.', read: true, createdAt: '2024-12-07T16:45:00', relatedTo: { type: 'Lead', id: '1' } },
  { id: '4', type: 'warning', title: 'SLA Warning', message: 'Ticket TKT-001234 response SLA due in 1 hour.', read: false, createdAt: '2024-12-08T10:30:00', relatedTo: { type: 'Ticket', id: '1' } },
  { id: '5', type: 'mention', title: 'You were mentioned', message: 'Sarah Jenkins mentioned you in a comment on Deal: Consulting Retainer.', read: true, createdAt: '2024-12-07T11:20:00', relatedTo: { type: 'Deal', id: '4' } },
  { id: '6', type: 'reminder', title: 'Meeting Reminder', message: 'TechFlow Enterprise Demo starts in 30 minutes.', read: true, createdAt: '2024-12-08T09:30:00', relatedTo: { type: 'CalendarEvent', id: '1' } },
];

// Dashboard Stats
export const dashboardStats = {
  totalRevenue: { value: '$2.4M', change: 12.5, trend: 'up' as const },
  activeDeals: { value: '47', change: 8.2, trend: 'up' as const },
  newLeads: { value: '156', change: 15.3, trend: 'up' as const },
  conversionRate: { value: '24.8%', change: -2.1, trend: 'down' as const },
  avgDealSize: { value: '$52,400', change: 5.4, trend: 'up' as const },
  openTickets: { value: '12', change: -18.5, trend: 'up' as const },
  salesCycle: { value: '32 days', change: -8.2, trend: 'up' as const },
  winRate: { value: '34%', change: 4.2, trend: 'up' as const },
};

// Pipeline Summary
export const pipelineSummary = [
  { stage: 'Qualification', count: 12, value: 245000, color: '#4f46e5' },
  { stage: 'Discovery', count: 8, value: 186000, color: '#0891b2' },
  { stage: 'Proposal', count: 15, value: 520000, color: '#7c3aed' },
  { stage: 'Negotiation', count: 6, value: 312000, color: '#ea580c' },
  { stage: 'Closed Won', count: 24, value: 1850000, color: '#059669' },
  { stage: 'Closed Lost', count: 8, value: 280000, color: '#dc2626' },
];

// Revenue by Month
export const revenueByMonth = [
  { name: 'Jan', revenue: 185000, target: 200000 },
  { name: 'Feb', revenue: 220000, target: 200000 },
  { name: 'Mar', revenue: 195000, target: 220000 },
  { name: 'Apr', revenue: 280000, target: 250000 },
  { name: 'May', revenue: 245000, target: 260000 },
  { name: 'Jun', revenue: 310000, target: 280000 },
  { name: 'Jul', revenue: 295000, target: 300000 },
  { name: 'Aug', revenue: 350000, target: 320000 },
  { name: 'Sep', revenue: 380000, target: 350000 },
  { name: 'Oct', revenue: 420000, target: 380000 },
  { name: 'Nov', revenue: 395000, target: 400000 },
  { name: 'Dec', revenue: 285000, target: 420000 },
];

// Leads by Source
export const leadsBySource = [
  { name: 'Website', value: 420, color: '#4f46e5' },
  { name: 'Referral', value: 280, color: '#059669' },
  { name: 'LinkedIn', value: 195, color: '#0891b2' },
  { name: 'Trade Show', value: 150, color: '#7c3aed' },
  { name: 'Cold Call', value: 85, color: '#dc2626' },
  { name: 'Advertisement', value: 120, color: '#ea580c' },
];

// Sales Activity
export const salesActivity = [
  { name: 'Mon', calls: 45, emails: 120, meetings: 8 },
  { name: 'Tue', calls: 52, emails: 98, meetings: 12 },
  { name: 'Wed', calls: 38, emails: 145, meetings: 6 },
  { name: 'Thu', calls: 61, emails: 110, meetings: 15 },
  { name: 'Fri', calls: 42, emails: 85, meetings: 10 },
];

// Top Performers
export const topPerformers = [
  { name: 'Sarah Jenkins', deals: 18, revenue: 485000, avatar: 'https://randomuser.me/api/portraits/women/1.jpg', change: 15.2 },
  { name: 'Michael Chen', deals: 14, revenue: 320000, avatar: 'https://randomuser.me/api/portraits/men/2.jpg', change: 8.5 },
  { name: 'Emily Rodriguez', deals: 11, revenue: 275000, avatar: 'https://randomuser.me/api/portraits/women/3.jpg', change: 12.8 },
];
