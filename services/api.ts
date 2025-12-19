// API Service for Comprint CRM
// Use relative /api path - Vite will proxy to localhost:3002 in dev
const API_BASE_URL = '/api';

// Generic fetch wrapper with error handling
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Dashboard API
export const dashboardApi = {
  getStats: () => fetchApi<{
    totalLeads: number;
    totalDeals: number;
    totalAccounts: number;
    totalContacts: number;
    totalRevenue: number;
    openTasks: number;
    openTickets: number;
    conversionRate: number;
  }>('/dashboard/stats'),

  getPipeline: () => fetchApi<Array<{
    stage: string;
    count: number;
    value: number;
  }>>('/dashboard/pipeline'),

  getLeadSources: () => fetchApi<Array<{
    source: string;
    count: number;
  }>>('/dashboard/lead-sources'),
};

// Leads API
export const leadsApi = {
  getAll: () => fetchApi<Array<{
    id: string;
    firstName: string;
    lastName: string;
    company: string;
    email: string;
    phone: string;
    status: string;
    source: string;
    score: number;
    owner: string;
    createdAt: string;
    lastActive: string;
    avatar: string;
    notes: string;
    tags: string[];
    budget: number;
    timeline: string;
    industry: string;
    jobTitle: string;
  }>>('/leads'),

  getById: (id: string) => fetchApi(`/leads/${id}`),

  create: (lead: Record<string, unknown>) => fetchApi('/leads', {
    method: 'POST',
    body: JSON.stringify(lead),
  }),

  update: (id: string, lead: Record<string, unknown>) => fetchApi(`/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(lead),
  }),

  delete: (id: string) => fetchApi(`/leads/${id}`, {
    method: 'DELETE',
  }),
};

// Contacts API
export const contactsApi = {
  getAll: () => fetchApi<Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    mobile: string;
    jobTitle: string;
    department: string;
    accountId: string;
    accountName: string;
    type: string;
    status: string;
    avatar: string;
    lastContacted: string;
    createdAt: string;
    owner: string;
    tags: string[];
    notes: string;
    preferredContact: string;
  }>>('/contacts'),

  getById: (id: string) => fetchApi(`/contacts/${id}`),

  create: (contact: Record<string, unknown>) => fetchApi('/contacts', {
    method: 'POST',
    body: JSON.stringify(contact),
  }),

  update: (id: string, contact: Record<string, unknown>) => fetchApi(`/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(contact),
  }),

  delete: (id: string) => fetchApi(`/contacts/${id}`, {
    method: 'DELETE',
  }),
};

// Accounts API
export const accountsApi = {
  getAll: () => fetchApi<Array<{
    id: string;
    name: string;
    industry: string;
    website: string;
    revenue: number;
    employees: number;
    location: string;
    healthScore: number;
    logo: string;
    type: string;
    status: string;
    phone: string;
    description: string;
    owner: string;
    createdAt: string;
  }>>('/accounts'),

  getById: (id: string) => fetchApi(`/accounts/${id}`),

  create: (account: Record<string, unknown>) => fetchApi('/accounts', {
    method: 'POST',
    body: JSON.stringify(account),
  }),

  update: (id: string, account: Record<string, unknown>) => fetchApi(`/accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(account),
  }),

  delete: (id: string) => fetchApi(`/accounts/${id}`, {
    method: 'DELETE',
  }),
};

// Deals API
export const dealsApi = {
  getAll: () => fetchApi<Array<{
    id: string;
    title: string;
    company: string;
    accountId: string;
    value: number;
    stage: string;
    probability: number;
    owner: string;
    closingDate: string;
    createdAt: string;
    description: string;
    contactId: string;
    contactName: string;
    nextStep: string;
    forecast: string;
    type: string;
    leadSource: string;
  }>>('/deals'),

  getById: (id: string) => fetchApi(`/deals/${id}`),

  create: (deal: Record<string, unknown>) => fetchApi('/deals', {
    method: 'POST',
    body: JSON.stringify(deal),
  }),

  update: (id: string, deal: Record<string, unknown>) => fetchApi(`/deals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(deal),
  }),

  delete: (id: string) => fetchApi(`/deals/${id}`, {
    method: 'DELETE',
  }),
};

// Tasks API
export const tasksApi = {
  getAll: () => fetchApi<Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    status: string;
    priority: string;
    dueDate: string;
    dueTime: string;
    assignedTo: string;
    createdBy: string;
    createdAt: string;
    completedAt: string;
    relatedTo: { type: string; id: string; name: string } | null;
  }>>('/tasks'),

  getById: (id: string) => fetchApi(`/tasks/${id}`),

  create: (task: Record<string, unknown>) => fetchApi('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  }),

  update: (id: string, task: Record<string, unknown>) => fetchApi(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(task),
  }),

  delete: (id: string) => fetchApi(`/tasks/${id}`, {
    method: 'DELETE',
  }),
};

// Tickets API
export const ticketsApi = {
  getAll: () => fetchApi<Array<{
    id: string;
    ticketNumber: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    type: string;
    category: string;
    contactId: string;
    contactName: string;
    contactEmail: string;
    accountId: string;
    accountName: string;
    assignedTo: string;
    assignedTeam: string;
    createdAt: string;
    updatedAt: string;
    dueDate: string;
    tags: string[];
  }>>('/tickets'),

  getById: (id: string) => fetchApi(`/tickets/${id}`),

  create: (ticket: Record<string, unknown>) => fetchApi('/tickets', {
    method: 'POST',
    body: JSON.stringify(ticket),
  }),

  update: (id: string, ticket: Record<string, unknown>) => fetchApi(`/tickets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(ticket),
  }),

  delete: (id: string) => fetchApi(`/tickets/${id}`, {
    method: 'DELETE',
  }),
};

// Campaigns API
export const campaignsApi = {
  getAll: () => fetchApi<Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    startDate: string;
    endDate: string;
    budget: number;
    actualCost: number;
    expectedRevenue: number;
    actualRevenue: number;
    description: string;
    owner: string;
    createdAt: string;
    targetAudience: string;
    goals: string;
    metrics: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      converted: number;
      leads: number;
      roi: number;
    } | null;
  }>>('/campaigns'),

  getById: (id: string) => fetchApi(`/campaigns/${id}`),

  create: (campaign: Record<string, unknown>) => fetchApi('/campaigns', {
    method: 'POST',
    body: JSON.stringify(campaign),
  }),

  update: (id: string, campaign: Record<string, unknown>) => fetchApi(`/campaigns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(campaign),
  }),

  delete: (id: string) => fetchApi(`/campaigns/${id}`, {
    method: 'DELETE',
  }),
};

// Notifications API
export const notificationsApi = {
  getAll: () => fetchApi<Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    link: string;
    read: boolean;
    createdAt: string;
  }>>('/notifications'),

  markAsRead: (id: string) => fetchApi(`/notifications/${id}/read`, {
    method: 'PUT',
  }),

  markAllAsRead: () => fetchApi('/notifications/read-all', {
    method: 'PUT',
  }),

  delete: (id: string) => fetchApi(`/notifications/${id}`, {
    method: 'DELETE',
  }),
};

// Calendar Events API
export const calendarEventsApi = {
  getAll: () => fetchApi<Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    start: string;
    end: string;
    allDay: boolean;
    location: string;
    meetingLink: string;
    owner: string;
    color: string;
    relatedTo: { type: string; id: string; name: string } | null;
    attendees: Array<{ id: string; name: string; email: string; status: string }>;
  }>>('/calendar-events'),

  getById: (id: string) => fetchApi(`/calendar-events/${id}`),

  create: (event: Record<string, unknown>) => fetchApi('/calendar-events', {
    method: 'POST',
    body: JSON.stringify(event),
  }),

  update: (id: string, event: Record<string, unknown>) => fetchApi(`/calendar-events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(event),
  }),

  delete: (id: string) => fetchApi(`/calendar-events/${id}`, {
    method: 'DELETE',
  }),
};

// Emails API
export const emailsApi = {
  getAll: () => fetchApi<Array<{
    id: string;
    subject: string;
    body: string;
    from: string;
    to: string[];
    cc: string[];
    status: string;
    sentAt: string;
    scheduledAt: string;
    openedAt: string;
    clickedAt: string;
    trackOpens: boolean;
    trackClicks: boolean;
    relatedTo: { type: string; id: string; name: string } | null;
    createdAt: string;
  }>>('/emails'),

  getById: (id: string) => fetchApi(`/emails/${id}`),

  create: (email: Record<string, unknown>) => fetchApi('/emails', {
    method: 'POST',
    body: JSON.stringify(email),
  }),

  update: (id: string, email: Record<string, unknown>) => fetchApi(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify(email),
  }),

  delete: (id: string) => fetchApi(`/emails/${id}`, {
    method: 'DELETE',
  }),
};

// Reports API
export const reportsApi = {
  getRevenueByMonth: () => fetchApi<Array<{
    name: string;
    revenue: number;
    target: number;
  }>>('/reports/revenue-by-month'),

  getLeadsBySource: () => fetchApi<Array<{
    name: string;
    value: number;
    color: string;
  }>>('/reports/leads-by-source'),

  getPipelineSummary: () => fetchApi<Array<{
    name: string;
    deals: number;
    value: number;
  }>>('/reports/pipeline-summary'),

  getSalesActivity: () => fetchApi<Array<{
    name: string;
    calls: number;
    emails: number;
    meetings: number;
  }>>('/reports/sales-activity'),
};

// Profile type
export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: string;
  status: string;
  phone: string;
  department: string;
  createdAt?: string;
  updatedAt?: string;
}

// Role type
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  color: string;
  createdAt?: string;
}

// Profiles API
export const profilesApi = {
  getAll: () => fetchApi<Profile[]>('/profiles'),

  getById: (id: string) => fetchApi<Profile>(`/profiles/${id}`),

  create: (profile: Omit<Profile, 'createdAt' | 'updatedAt'>) => fetchApi<Profile>('/profiles', {
    method: 'POST',
    body: JSON.stringify(profile),
  }),

  update: (id: string, profile: Partial<Profile>) => fetchApi<Profile>(`/profiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(profile),
  }),

  delete: (id: string) => fetchApi(`/profiles/${id}`, {
    method: 'DELETE',
  }),
};

// Roles API
export const rolesApi = {
  getAll: () => fetchApi<Role[]>('/roles'),

  getById: (id: string) => fetchApi<Role>(`/roles/${id}`),

  create: (role: Omit<Role, 'id' | 'createdAt'>) => fetchApi<Role>('/roles', {
    method: 'POST',
    body: JSON.stringify(role),
  }),

  update: (id: string, role: Partial<Role>) => fetchApi<Role>(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(role),
  }),

  delete: (id: string) => fetchApi(`/roles/${id}`, {
    method: 'DELETE',
  }),
};

// Lead Notes API
export const leadNotesApi = {
  getByLeadId: (leadId: string) => fetchApi<Array<{
    id: string;
    leadId: string;
    content: string;
    createdBy: string;
    createdAt: string;
    updatedAt?: string;
  }>>(`/leads/${leadId}/notes`),

  create: (leadId: string, note: { content: string; createdBy: string }) => fetchApi(`/leads/${leadId}/notes`, {
    method: 'POST',
    body: JSON.stringify(note),
  }),

  update: (leadId: string, noteId: string, note: { content: string }) => fetchApi(`/leads/${leadId}/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(note),
  }),

  delete: (leadId: string, noteId: string) => fetchApi(`/leads/${leadId}/notes/${noteId}`, {
    method: 'DELETE',
  }),
};

// Lead Activities API (Timeline)
export const leadActivitiesApi = {
  getByLeadId: (leadId: string) => fetchApi<Array<{
    id: string;
    leadId: string;
    activityType: string;
    title: string;
    description?: string;
    scheduledAt?: string;
    completedAt?: string;
    durationMinutes?: number;
    outcome?: string;
    createdBy: string;
    createdAt: string;
  }>>(`/leads/${leadId}/activities`),

  create: (leadId: string, activity: Record<string, unknown>) => fetchApi(`/leads/${leadId}/activities`, {
    method: 'POST',
    body: JSON.stringify(activity),
  }),
};

// Lead Calls API
export const leadCallsApi = {
  getByLeadId: (leadId: string) => fetchApi<Array<{
    id: string;
    leadId: string;
    callType: string;
    subject: string;
    callPurpose?: string;
    scheduledAt?: string;
    startTime?: string;
    durationMinutes?: number;
    callResult?: string;
    description?: string;
    createdBy: string;
    createdAt: string;
  }>>(`/leads/${leadId}/calls`),

  scheduleCall: (leadId: string, call: {
    subject: string;
    callPurpose?: string;
    scheduledAt: string;
    description?: string;
    createdBy: string;
  }) => fetchApi(`/leads/${leadId}/calls/schedule`, {
    method: 'POST',
    body: JSON.stringify(call),
  }),

  logCall: (leadId: string, call: {
    subject: string;
    callPurpose?: string;
    startTime: string;
    durationMinutes?: number;
    callResult?: string;
    description?: string;
    createdBy: string;
  }) => fetchApi(`/leads/${leadId}/calls/log`, {
    method: 'POST',
    body: JSON.stringify(call),
  }),

  update: (leadId: string, callId: string, call: Record<string, unknown>) => fetchApi(`/leads/${leadId}/calls/${callId}`, {
    method: 'PUT',
    body: JSON.stringify(call),
  }),

  delete: (leadId: string, callId: string) => fetchApi(`/leads/${leadId}/calls/${callId}`, {
    method: 'DELETE',
  }),
};

// Lead Tasks API
export const leadTasksApi = {
  getByLeadId: (leadId: string) => fetchApi<Array<{
    id: string;
    leadId: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string;
    dueTime?: string;
    assignedTo?: string;
    createdBy: string;
    createdAt: string;
    updatedAt?: string;
    completedAt?: string;
  }>>(`/leads/${leadId}/tasks`),

  create: (leadId: string, task: {
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
    dueTime?: string;
    assignedTo?: string;
    createdBy: string;
  }) => fetchApi(`/leads/${leadId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(task),
  }),

  update: (leadId: string, taskId: string, task: Record<string, unknown>) => fetchApi(`/leads/${leadId}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(task),
  }),

  delete: (leadId: string, taskId: string) => fetchApi(`/leads/${leadId}/tasks/${taskId}`, {
    method: 'DELETE',
  }),
};

// Email Templates API
export const emailTemplatesApi = {
  getAll: () => fetchApi<Array<{
    id: string;
    name: string;
    subject: string;
    body: string;
    category?: string;
    isActive: boolean;
    createdBy?: string;
    createdAt: string;
    updatedAt?: string;
  }>>('/email-templates'),

  getById: (id: string) => fetchApi(`/email-templates/${id}`),

  create: (template: {
    name: string;
    subject: string;
    body: string;
    category?: string;
    createdBy?: string;
  }) => fetchApi('/email-templates', {
    method: 'POST',
    body: JSON.stringify(template),
  }),

  update: (id: string, template: Record<string, unknown>) => fetchApi(`/email-templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(template),
  }),

  delete: (id: string) => fetchApi(`/email-templates/${id}`, {
    method: 'DELETE',
  }),
};
