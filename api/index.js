// Consolidated API handler for Vercel with Supabase integration
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Mock data (fallback when Supabase is not configured)
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
const mockTickets = [
  { id: '1', ticketNumber: 'TKT-001', subject: 'Login issues', status: 'Open', priority: 'High', type: 'Bug', contactName: 'John Anderson', accountName: 'TechFlow Inc.', assignedTo: 'David Kim', createdAt: '2024-12-08' },
  { id: '2', ticketNumber: 'TKT-002', subject: 'Feature request: Dark mode', status: 'In Progress', priority: 'Normal', type: 'Feature Request', contactName: 'Maria Santos', accountName: 'TechFlow Inc.', assignedTo: 'Emily Rodriguez', createdAt: '2024-12-06' },
  { id: '3', ticketNumber: 'TKT-003', subject: 'Integration not working', status: 'Pending', priority: 'Urgent', type: 'Bug', contactName: 'Robert Johnson', accountName: 'Global Dynamics', assignedTo: 'David Kim', createdAt: '2024-12-09' },
  { id: '4', ticketNumber: 'TKT-004', subject: 'Billing question', status: 'Resolved', priority: 'Low', type: 'Question', contactName: 'James Brown', accountName: 'Alpha Wave', assignedTo: 'Sarah Jenkins', createdAt: '2024-12-01' },
];
const mockCampaigns = [
  { id: '1', name: 'Q4 Product Launch', type: 'Email', status: 'Active', budget: 15000, actualRevenue: 45000, owner: 'Emily Rodriguez', metrics: { sent: 5000, opened: 2100, clicked: 420, leads: 45 } },
  { id: '2', name: 'Winter Webinar Series', type: 'Webinar', status: 'Scheduled', budget: 5000, owner: 'Sarah Jenkins', metrics: { sent: 2000, opened: 780, clicked: 195, leads: 0 } },
  { id: '3', name: 'LinkedIn Ads - Tech Leaders', type: 'Social', status: 'Active', budget: 8000, actualRevenue: 12000, owner: 'Emily Rodriguez', metrics: { clicked: 320, leads: 18 } },
  { id: '4', name: 'Customer Success Newsletter', type: 'Email', status: 'Completed', budget: 2000, actualRevenue: 15000, owner: 'Michael Chen', metrics: { sent: 1500, opened: 890, clicked: 445, leads: 0 } },
];
const mockNotifications = [
  { id: '1', type: 'deal', title: 'Deal Updated', message: 'Enterprise License deal moved to Negotiation', read: false, createdAt: '2024-12-09T10:30:00Z' },
  { id: '2', type: 'task', title: 'Task Due Soon', message: 'Follow up with TechFlow on proposal is due tomorrow', read: false, createdAt: '2024-12-09T09:00:00Z' },
  { id: '3', type: 'lead', title: 'New Lead Assigned', message: 'Alice Freeman from Quantum Solutions assigned to you', read: true, createdAt: '2024-12-08T16:45:00Z' },
  { id: '4', type: 'ticket', title: 'Urgent Ticket', message: 'High priority ticket from Global Dynamics needs attention', read: false, createdAt: '2024-12-09T08:15:00Z' },
];
const mockEmails = [
  { id: '1', subject: 'Proposal for Enterprise License', from: 'sarah.jenkins@comprint.com', to: ['john.anderson@techflow.io'], status: 'sent', sentAt: '2024-12-08T14:30:00Z' },
  { id: '2', subject: 'Meeting Follow-up', from: 'michael.chen@comprint.com', to: ['robert@globaldynamics.com'], status: 'sent', sentAt: '2024-12-07T16:00:00Z' },
  { id: '3', subject: 'Product Demo Invitation', from: 'sarah.jenkins@comprint.com', to: ['jennifer@securenet.io'], status: 'scheduled', scheduledAt: '2024-12-12T09:00:00Z' },
  { id: '4', subject: 'Contract Review Request', from: 'michael.chen@comprint.com', to: ['james@alphawave.net'], status: 'draft' },
];
const mockProfiles = [
  { id: 'user-1', email: 'sarah.jenkins@comprint.com', firstName: 'Sarah', lastName: 'Jenkins', avatar: '', role: 'Admin', status: 'Active', phone: '+1 555-0101', department: 'Sales' },
  { id: 'user-2', email: 'michael.chen@comprint.com', firstName: 'Michael', lastName: 'Chen', avatar: '', role: 'Sales Manager', status: 'Active', phone: '+1 555-0102', department: 'Sales' },
  { id: 'user-3', email: 'emily.rodriguez@comprint.com', firstName: 'Emily', lastName: 'Rodriguez', avatar: '', role: 'Sales Rep', status: 'Active', phone: '+1 555-0103', department: 'Sales' },
  { id: 'user-4', email: 'david.kim@comprint.com', firstName: 'David', lastName: 'Kim', avatar: '', role: 'Support', status: 'Active', phone: '+1 555-0104', department: 'Support' },
];
const mockRoles = [
  { id: 'role-1', name: 'Admin', description: 'Full access to all features and settings', permissions: ['view_dashboard', 'view_leads', 'create_leads', 'edit_leads', 'delete_leads', 'view_deals', 'create_deals', 'edit_deals', 'delete_deals', 'view_contacts', 'create_contacts', 'edit_contacts', 'delete_contacts', 'view_accounts', 'create_accounts', 'edit_accounts', 'delete_accounts', 'view_reports', 'export_data', 'manage_users', 'manage_settings'], color: 'purple' },
  { id: 'role-2', name: 'Sales Manager', description: 'Manage sales team and view reports', permissions: ['view_dashboard', 'view_leads', 'create_leads', 'edit_leads', 'delete_leads', 'view_deals', 'create_deals', 'edit_deals', 'delete_deals', 'view_contacts', 'create_contacts', 'edit_contacts', 'delete_contacts', 'view_accounts', 'create_accounts', 'edit_accounts', 'view_reports', 'export_data', 'manage_users'], color: 'blue' },
  { id: 'role-3', name: 'Sales Rep', description: 'Standard sales team member access', permissions: ['view_dashboard', 'view_leads', 'create_leads', 'edit_leads', 'view_deals', 'create_deals', 'edit_deals', 'view_contacts', 'create_contacts', 'edit_contacts', 'view_accounts'], color: 'green' },
  { id: 'role-4', name: 'Marketing', description: 'Access to leads and reporting', permissions: ['view_dashboard', 'view_leads', 'create_leads', 'edit_leads', 'view_reports', 'export_data'], color: 'orange' },
  { id: 'role-5', name: 'Support', description: 'View-only access with contact management', permissions: ['view_dashboard', 'view_contacts', 'create_contacts', 'edit_contacts', 'view_accounts'], color: 'teal' },
];

// In-memory data stores (fallback)
let leads = [...mockLeads];
let contacts = [...mockContacts];
let accounts = [...mockAccounts];
let deals = [...mockDeals];
let tasks = [...mockTasks];
let events = [...mockCalendarEvents];
let tickets = [...mockTickets];
let campaigns = [...mockCampaigns];
let notifications = [...mockNotifications];
let emails = [...mockEmails];
let profiles = [...mockProfiles];
let roles = [...mockRoles];

// Field mapping: API field names -> Database column names
const fieldMappings = {
  leads: {
    firstName: 'first_name',
    lastName: 'last_name',
    leadCategory: 'lead_category',
    accountType: 'account_type',
    jobTitle: 'job_title',
    lastActive: 'last_active',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  contacts: {
    firstName: 'first_name',
    lastName: 'last_name',
    jobTitle: 'job_title',
    accountName: 'account_name',
    accountId: 'account_id',
    preferredContact: 'preferred_contact',
    lastContacted: 'last_contacted',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  accounts: {
    healthScore: 'health_score',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  deals: {
    closingDate: 'closing_date',
    accountId: 'account_id',
    contactId: 'contact_id',
    contactName: 'contact_name',
    leadSource: 'lead_source',
    nextStep: 'next_step',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  tasks: {
    dueDate: 'due_date',
    dueTime: 'due_time',
    assignedTo: 'assigned_to',
    createdBy: 'created_by',
    completedAt: 'completed_at',
    relatedTo: 'related_to',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  'calendar-events': {
    start: 'start_time',
    end: 'end_time',
    allDay: 'all_day',
    meetingLink: 'meeting_link',
    relatedTo: 'related_to',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  tickets: {
    ticketNumber: 'ticket_number',
    contactId: 'contact_id',
    contactName: 'contact_name',
    contactEmail: 'contact_email',
    accountId: 'account_id',
    accountName: 'account_name',
    assignedTo: 'assigned_to',
    assignedTeam: 'assigned_team',
    dueDate: 'due_date',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  campaigns: {
    startDate: 'start_date',
    endDate: 'end_date',
    actualCost: 'actual_cost',
    expectedRevenue: 'expected_revenue',
    actualRevenue: 'actual_revenue',
    targetAudience: 'target_audience',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  emails: {
    from: 'from_address',
    to: 'to_addresses',
    sentAt: 'sent_at',
    scheduledAt: 'scheduled_at',
    openedAt: 'opened_at',
    clickedAt: 'clicked_at',
    trackOpens: 'track_opens',
    trackClicks: 'track_clicks',
    relatedTo: 'related_to',
    templateId: 'template_id',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  profiles: {
    firstName: 'first_name',
    lastName: 'last_name',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  roles: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  notifications: {
    relatedTo: 'related_to',
    createdAt: 'created_at',
  },
};

// Convert API object to DB format
function toDbFormat(resource, obj) {
  const mapping = fieldMappings[resource] || {};
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const dbKey = mapping[key] || key;
    result[dbKey] = value;
  }
  return result;
}

// Convert DB object to API format
function toApiFormat(resource, obj) {
  if (!obj) return obj;
  const reverseMapping = {
    first_name: 'firstName',
    last_name: 'lastName',
    job_title: 'jobTitle',
    account_name: 'accountName',
    account_id: 'accountId',
    health_score: 'healthScore',
    closing_date: 'closingDate',
    contact_id: 'contactId',
    contact_name: 'contactName',
    contact_email: 'contactEmail',
    lead_source: 'leadSource',
    next_step: 'nextStep',
    due_date: 'dueDate',
    due_time: 'dueTime',
    assigned_to: 'assignedTo',
    assigned_team: 'assignedTeam',
    created_by: 'createdBy',
    completed_at: 'completedAt',
    related_to: 'relatedTo',
    start_time: 'start',
    end_time: 'end',
    all_day: 'allDay',
    meeting_link: 'meetingLink',
    ticket_number: 'ticketNumber',
    from_address: 'from',
    to_addresses: 'to',
    sent_at: 'sentAt',
    scheduled_at: 'scheduledAt',
    opened_at: 'openedAt',
    clicked_at: 'clickedAt',
    track_opens: 'trackOpens',
    track_clicks: 'trackClicks',
    template_id: 'templateId',
    start_date: 'startDate',
    end_date: 'endDate',
    actual_cost: 'actualCost',
    expected_revenue: 'expectedRevenue',
    actual_revenue: 'actualRevenue',
    target_audience: 'targetAudience',
    preferred_contact: 'preferredContact',
    last_contacted: 'lastContacted',
    last_active: 'lastActive',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    lead_category: 'leadCategory',
    account_type: 'accountType',
  };
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const apiKey = reverseMapping[key] || key;
    result[apiKey] = value;
  }
  return result;
}

// Helper to parse path
function parsePath(url) {
  const path = url.replace(/^\/api/, '').replace(/\?.*$/, '');
  const segments = path.split('/').filter(Boolean);
  return { segments, path };
}

// Database table names mapping
const tableNames = {
  leads: 'leads',
  contacts: 'contacts',
  accounts: 'accounts',
  deals: 'deals',
  tasks: 'tasks',
  'calendar-events': 'calendar_events',
  tickets: 'tickets',
  campaigns: 'campaigns',
  emails: 'emails',
  notifications: 'notifications',
  profiles: 'profiles',
  roles: 'roles',
};

// Tables that always use in-memory storage (none currently)
const inMemoryOnlyTables = [];

// Supabase CRUD operations
async function supabaseCRUD(resource, req, res, id) {
  const tableName = tableNames[resource];
  if (!tableName) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  try {
    if (req.method === 'GET') {
      if (id) {
        const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
        if (error) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(toApiFormat(resource, data));
      }
      const { data, error } = await supabase.from(tableName).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data.map(item => toApiFormat(resource, item)));
    }

    if (req.method === 'POST') {
      const dbData = toDbFormat(resource, req.body);
      // Only delete id for tables that auto-generate UUIDs
      // profiles and roles use custom string IDs
      const tablesWithCustomIds = ['profiles', 'roles'];
      if (!tablesWithCustomIds.includes(resource)) {
        delete dbData.id;
      }
      const { data, error } = await supabase.from(tableName).insert(dbData).select().single();
      if (error) throw error;
      return res.status(201).json(toApiFormat(resource, data));
    }

    if (req.method === 'PUT' && id) {
      const dbData = toDbFormat(resource, req.body);
      delete dbData.id;
      delete dbData.created_at;
      const { data, error } = await supabase.from(tableName).update(dbData).eq('id', id).select().single();
      if (error) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(toApiFormat(resource, data));
    }

    if (req.method === 'DELETE' && id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ error: 'Database error', details: error.message });
  }
}

// In-memory CRUD helper (fallback)
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

// Get data source (Supabase or in-memory)
async function getData(resource) {
  if (supabase) {
    const tableName = tableNames[resource];
    if (tableName) {
      const { data, error } = await supabase.from(tableName).select('*');
      if (!error && data) {
        return data.map(item => toApiFormat(resource, item));
      }
    }
  }
  // Fallback to in-memory
  const inMemoryData = { leads, contacts, accounts, deals, tasks, 'calendar-events': events, tickets, campaigns, emails, notifications };
  return inMemoryData[resource] || [];
}

export default async function handler(req, res) {
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
    const currentLeads = await getData('leads');
    const currentDeals = await getData('deals');
    const currentAccounts = await getData('accounts');
    const currentContacts = await getData('contacts');
    const currentTasks = await getData('tasks');

    if (id === 'stats') {
      const totalRevenue = currentDeals.filter(d => d.stage === 'Closed Won').reduce((sum, d) => sum + (d.value || 0), 0);
      return res.status(200).json({
        totalLeads: currentLeads.length,
        totalDeals: currentDeals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).length,
        totalAccounts: currentAccounts.length,
        totalContacts: currentContacts.length,
        totalRevenue,
        openTasks: currentTasks.filter(t => t.status !== 'Completed').length,
        openTickets: 4,
        conversionRate: 24.8
      });
    }
    if (id === 'pipeline') {
      const stages = ['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
      return res.status(200).json(stages.map(stage => {
        const stageDeals = currentDeals.filter(d => d.stage === stage);
        return { stage, count: stageDeals.length, value: stageDeals.reduce((sum, d) => sum + (d.value || 0), 0) };
      }));
    }
    if (id === 'lead-sources') {
      const sources = {};
      currentLeads.forEach(lead => { sources[lead.source] = (sources[lead.source] || 0) + 1; });
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
      if (supabase) {
        await supabase.from('notifications').update({ read: true }).neq('read', true);
      } else {
        notifications.forEach(n => n.read = true);
      }
      return res.status(200).json({ success: true });
    }
    if (subResource === 'read' && req.method === 'PUT') {
      if (supabase) {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
      } else {
        const notif = notifications.find(n => n.id === id);
        if (notif) notif.read = true;
      }
      return res.status(200).json({ success: true });
    }
    if (supabase) {
      return supabaseCRUD(resource, req, res, id);
    }
    return handleCRUD(notifications, req, res, id);
  }

  // Standard CRUD resources
  const inMemoryResources = {
    leads, contacts, accounts, deals, tasks,
    'calendar-events': events,
    tickets, campaigns, emails,
    profiles, roles
  };

  // Handle profiles and roles - always use in-memory (auth tables may not exist in Supabase)
  if (inMemoryOnlyTables.includes(resource)) {
    return handleCRUD(inMemoryResources[resource], req, res, id);
  }

  if (tableNames[resource]) {
    if (supabase) {
      return supabaseCRUD(resource, req, res, id);
    }
    if (inMemoryResources[resource]) {
      return handleCRUD(inMemoryResources[resource], req, res, id);
    }
  }

  // Health check / status endpoint
  if (resource === 'status') {
    const dbStatus = {
      connected: false,
      type: 'in-memory',
      message: 'Using mock data'
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('profiles').select('id').limit(1);
        if (!error) {
          dbStatus.connected = true;
          dbStatus.type = 'supabase';
          dbStatus.message = 'Connected to Supabase';
        } else {
          dbStatus.message = `Supabase error: ${error.message}`;
        }
      } catch (e) {
        dbStatus.message = `Connection error: ${e.message}`;
      }
    } else {
      dbStatus.message = 'SUPABASE_URL or SUPABASE_ANON_KEY not configured';
    }

    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY
      }
    });
  }

  // Root API info
  if (!resource) {
    return res.status(200).json({
      message: 'Comprint CRM API',
      version: '1.0.0',
      database: supabase ? 'Supabase' : 'In-memory (mock data)'
    });
  }

  return res.status(404).json({ error: 'Endpoint not found' });
}
