const API_BASE = '/api';
const TOKEN_KEY = 'sdr-token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    fetchApi<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => fetchApi<any>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    fetchApi<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Products
export const productsApi = {
  list: () => fetchApi<any[]>('/products/'),
  getById: (id: string) => fetchApi<any>(`/products/${id}`),
  create: (data: any) =>
    fetchApi<any>('/products/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<any>(`/products/${id}`, { method: 'DELETE' }),
};

// Partners
export const partnersApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<any>(`/data/partners/${qs}`);
  },
  myPartners: () => fetchApi<any>('/data/partners/my'),
  pending: () => fetchApi<any>('/data/partners/pending'),
  getById: (id: string) => fetchApi<any>(`/data/partners/${id}`),
  create: (data: any) =>
    fetchApi<any>('/data/partners/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/data/partners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<any>(`/data/partners/${id}`, { method: 'DELETE' }),
  approve: (id: string, approved: boolean, reason?: string) =>
    fetchApi<any>(`/data/partners/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved, rejectionReason: reason }),
    }),
};

// Sales Entries
export const salesApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<any>(`/data/sales-entries/${qs}`);
  },
  create: (data: any) =>
    fetchApi<any>('/data/sales-entries/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/data/sales-entries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<any>(`/data/sales-entries/${id}`, { method: 'DELETE' }),
  summary: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<any>(`/data/sales-entries/summary${qs}`);
  },
  breakdown: () => fetchApi<any>('/data/sales-entries/breakdown'),
};

// Leads
export const leadsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<any>(`/leads/${qs}`);
  },
  stats: () => fetchApi<any>('/leads/stats'),
  getById: (id: string) => fetchApi<any>(`/leads/${id}`),
  create: (data: any) =>
    fetchApi<any>('/leads/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<any>(`/leads/${id}`, { method: 'DELETE' }),
  convert: (id: string, data: any) =>
    fetchApi<any>(`/leads/${id}/convert`, { method: 'POST', body: JSON.stringify(data) }),
  getActivities: (id: string) => fetchApi<any[]>(`/leads/${id}/activities`),
  addActivity: (id: string, data: any) =>
    fetchApi<any>(`/leads/${id}/activities`, { method: 'POST', body: JSON.stringify(data) }),
};

// Dashboard
export const dashboardApi = {
  getStats: () => fetchApi<any>('/data/dashboard/'),
  monthlyStats: () => fetchApi<any>('/data/dashboard/monthly-stats'),
  growthStats: () => fetchApi<any>('/data/dashboard/growth-stats'),
  getAll: () => fetchApi<any>('/data/dashboard/all'),
  getPreferences: () => fetchApi<any>('/me/dashboard-preferences'),
  updatePreferences: (prefs: any) =>
    fetchApi<any>('/me/dashboard-preferences', {
      method: 'PUT',
      body: JSON.stringify(prefs),
    }),
};

// Quotes
export const quotesApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<any>(`/quotes/${qs}`);
  },
  getById: (id: string) => fetchApi<any>(`/quotes/${id}`),
  create: (data: any) =>
    fetchApi<any>('/quotes/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/quotes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<any>(`/quotes/${id}`, { method: 'DELETE' }),
};

// Carepacks
export const carepacksApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<any>(`/carepacks/${qs}`);
  },
  expiring: () => fetchApi<any>('/carepacks/expiring'),
  create: (data: any) =>
    fetchApi<any>('/carepacks/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/carepacks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<any>(`/carepacks/${id}`, { method: 'DELETE' }),
};

// Accounts
export const accountsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<any>(`/accounts/${qs}`);
  },
  getById: (id: string) => fetchApi<any>(`/accounts/${id}`),
  create: (data: any) =>
    fetchApi<any>('/accounts/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<any>(`/accounts/${id}`, { method: 'DELETE' }),
  getContacts: (id: string) => fetchApi<any>(`/accounts/${id}/contacts`),
  getDeals: (id: string) => fetchApi<any>(`/accounts/${id}/deals`),
};

// Contacts
export const contactsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<any>(`/contacts/${qs}`);
  },
  getById: (id: string) => fetchApi<any>(`/contacts/${id}`),
  create: (data: any) =>
    fetchApi<any>('/contacts/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<any>(`/contacts/${id}`, { method: 'DELETE' }),
};

// Deals
export const dealsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<any>(`/deals/${qs}`);
  },
  stats: () => fetchApi<any>('/deals/stats'),
  pipeline: () => fetchApi<any>('/deals/pipeline'),
  getById: (id: string) => fetchApi<any>(`/deals/${id}`),
  create: (data: any) =>
    fetchApi<any>('/deals/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<any>(`/deals/${id}`, { method: 'DELETE' }),
};

// Tasks
export const tasksApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<any>(`/tasks/${qs}`);
  },
  stats: () => fetchApi<any>('/tasks/stats'),
  getById: (id: string) => fetchApi<any>(`/tasks/${id}`),
  create: (data: any) =>
    fetchApi<any>('/tasks/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<any>(`/tasks/${id}`, { method: 'DELETE' }),
  complete: (id: string) =>
    fetchApi<any>(`/tasks/${id}/complete`, { method: 'PUT' }),
};

// Calendar Events
export const calendarApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<any>(`/calendar-events/${qs}`);
  },
  range: (start: string, end: string) =>
    fetchApi<any>(`/calendar-events/range?start=${start}&end=${end}`),
  getById: (id: string) => fetchApi<any>(`/calendar-events/${id}`),
  create: (data: any) =>
    fetchApi<any>('/calendar-events/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/calendar-events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<any>(`/calendar-events/${id}`, { method: 'DELETE' }),
};

// Emails
export const emailsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<any>(`/emails/${qs}`);
  },
  getById: (id: string) => fetchApi<any>(`/emails/${id}`),
  create: (data: any) =>
    fetchApi<any>('/emails/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/emails/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<any>(`/emails/${id}`, { method: 'DELETE' }),
  send: (id: string) =>
    fetchApi<any>(`/emails/${id}/send`, { method: 'POST' }),
};

// Email Templates
export const emailTemplatesApi = {
  list: () => fetchApi<any[]>('/email-templates/'),
  getById: (id: string) => fetchApi<any>(`/email-templates/${id}`),
  create: (data: any) =>
    fetchApi<any>('/email-templates/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/email-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<any>(`/email-templates/${id}`, { method: 'DELETE' }),
};

// Notifications
export const notificationsApi = {
  list: () => fetchApi<any[]>('/notifications/'),
  markRead: (id: string) =>
    fetchApi<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () =>
    fetchApi<any>('/notifications/all/read', { method: 'PATCH' }),
};

// Admin
export const adminApi = {
  listUsers: () => fetchApi<any[]>('/admin/users/'),
  createUser: (data: any) =>
    fetchApi<any>('/admin/users/', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) =>
    fetchApi<any>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetPassword: (id: string, newPassword: string) =>
    fetchApi<any>(`/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),
};

// Master Data
export const masterDataApi = {
  list: (entity: string) => fetchApi<any[]>(`/data/master/${entity}`),
  create: (entity: string, data: any) =>
    fetchApi<any>(`/data/master/${entity}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (entity: string, id: string, data: any) =>
    fetchApi<any>(`/data/master/${entity}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (entity: string, id: string) =>
    fetchApi<any>(`/data/master/${entity}/${id}`, { method: 'DELETE' }),
};

// Settings
export const settingsApi = {
  list: () => fetchApi<any[]>('/settings/'),
  update: (key: string, value: string) =>
    fetchApi<any>('/settings/', {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    }),
};


// INR currency formatter
export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
