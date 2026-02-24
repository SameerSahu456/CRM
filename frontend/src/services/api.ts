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
  list: async () => { const res = await fetchApi<any>('/products/'); return res?.data ?? res; },
  listAll: async () => { const res = await fetchApi<any>('/products/?include_inactive=true'); return res?.data ?? res; },
  getById: async (id: string) => { const res = await fetchApi<any>(`/products/${id}`); return res?.data ?? res; },
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
  getTargets: () => fetchApi<any>('/data/partners/targets'),
  saveTargets: (targets: { elite: string; growth: string; new: string }) =>
    fetchApi<any>('/data/partners/targets', {
      method: 'PUT',
      body: JSON.stringify(targets),
    }),
};

// Field constants for list views (reduces API payload ~85%)
export const DEAL_LIST_FIELDS = 'id,title,company,accountName,contactName,contactNo,designation,email,location,requirement,quotedRequirement,value,stage,typeOfOrder,ownerName,nextFollowUp,paymentFlag';
export const DEAL_KANBAN_FIELDS = 'id,title,accountName,contactName,value,typeOfOrder,ownerName,stage,paymentFlag';
export const LEAD_LIST_FIELDS = 'id,companyName,contactPerson,phone,designation,email,location,source,requirement,quotedRequirement,estimatedValue,stage,tag,assignedToName,nextFollowUp';
export const LEAD_KANBAN_FIELDS = 'id,companyName,contactPerson,estimatedValue,stage,priority,nextFollowUp';
export const ACCOUNT_LIST_FIELDS = 'id,name,industry,tag,type,accountType,phone,email,revenue';
export const CONTACT_LIST_FIELDS = 'id,firstName,lastName,email,phone,designation,jobTitle,accountName,accountId';
export const SALES_LIST_FIELDS = 'id,saleDate,customerName,productName,productNames,quantity,amount,poNumber,invoiceNo,paymentStatus';

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
  collections: () => fetchApi<any>('/data/sales-entries/collections'),
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
  getAuditLog: (id: string) => fetchApi<any[]>(`/leads/${id}/audit-log`),
};

// Dashboard
export const dashboardApi = {
  getStats: async () => { const res = await fetchApi<any>('/data/dashboard/'); return res?.data ?? res; },
  monthlyStats: async () => { const res = await fetchApi<any>('/data/dashboard/monthly-stats'); return res?.data ?? res; },
  growthStats: async () => { const res = await fetchApi<any>('/data/dashboard/growth-stats'); return res?.data ?? res; },
  getAll: async () => { const res = await fetchApi<any>('/data/dashboard/all'); return res?.data ?? res; },
  getAssigneeDetail: async (userId: string) => { const res = await fetchApi<any>(`/data/dashboard/assignee/${userId}`); return res?.data ?? res; },
  getPreferences: () => fetchApi<any>('/auth/me/dashboard-preferences'),
  updatePreferences: (prefs: any) =>
    fetchApi<any>('/auth/me/dashboard-preferences', {
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
  getPdf: (id: string, regenerate?: boolean) => {
    const qs = regenerate ? '?regenerate=true' : '';
    return fetchApi<{ pdfUrl: string }>(`/quotes/${id}/pdf${qs}`);
  },
};

// Quote Terms
export const quoteTermsApi = {
  list: () => fetchApi<any[]>('/quote-terms/'),
  create: (data: any) =>
    fetchApi<any>('/quote-terms/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/quote-terms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<any>(`/quote-terms/${id}`, { method: 'DELETE' }),
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
  createWithContact: (data: { account: any; contact: any }) =>
    fetchApi<any>('/accounts/with-contact', { method: 'POST', body: JSON.stringify(data) }),
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
  pipeline: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<any>(`/deals/pipeline${qs}`);
  },
  getById: (id: string) => fetchApi<any>(`/deals/${id}`),
  create: (data: any) =>
    fetchApi<any>('/deals/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<any>(`/deals/${id}`, { method: 'DELETE' }),
  getActivities: (id: string) => fetchApi<any[]>(`/deals/${id}/activities`),
  addActivity: (id: string, data: any) =>
    fetchApi<any>(`/deals/${id}/activities`, { method: 'POST', body: JSON.stringify(data) }),
  getAuditLog: (id: string) => fetchApi<any[]>(`/deals/${id}/audit-log`),
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

// Snake-case to camelCase converter for raw SQL responses
function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, val]) => [
        key.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase()),
        val,
      ])
    );
  }
  return obj;
}

// Master Data
export const masterDataApi = {
  list: async (entity: string) => {
    const response = await fetchApi<any>(`/data/master/${entity}`);
    const data = response?.data ?? response;
    return Array.isArray(data) ? data.map(snakeToCamel) : snakeToCamel(data);
  },
  create: async (entity: string, data: any) => {
    const result = await fetchApi<any>(`/data/master/${entity}`, { method: 'POST', body: JSON.stringify(data) });
    return snakeToCamel(result?.data ?? result);
  },
  update: async (entity: string, id: string, data: any) => {
    const result = await fetchApi<any>(`/data/master/${entity}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return snakeToCamel(result?.data ?? result);
  },
  delete: (entity: string, id: string) =>
    fetchApi<any>(`/data/master/${entity}/${id}`, { method: 'DELETE' }),
};

// Dropdowns (all dropdown entities in one call)
export const dropdownsApi = {
  getAll: async () => {
    const response = await fetchApi<any>('/data/master/dropdowns/all');
    const data = response?.data ?? response;
    // Convert snake_case keys in each dropdown item
    const result: Record<string, any[]> = {};
    for (const [entity, items] of Object.entries(data)) {
      if (Array.isArray(items)) {
        result[entity] = items.map(snakeToCamel);
      }
    }
    return result;
  },
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


// Roles & Permissions
export const rolesApi = {
  list: () => fetchApi<any[]>('/admin/roles/'),
  create: (data: any) =>
    fetchApi<any>('/admin/roles/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/admin/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<any>(`/admin/roles/${id}`, { method: 'DELETE' }),
  updatePermissions: (id: string, permissions: any[]) =>
    fetchApi<any>(`/admin/roles/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify(permissions),
    }),
};

// Activity Logs
export const activityLogApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<any>(`/admin/activity-logs/${qs}`);
  },
  create: (data: { action: string; entityType: string; entityName?: string }) =>
    fetchApi<any>('/admin/activity-logs/', {
      method: 'POST',
      body: JSON.stringify({
        action: data.action,
        entity_type: data.entityType,
        entity_name: data.entityName,
      }),
    }),
};

// Bulk Import
export const bulkImportApi = {
  downloadTemplate: async (entity: string) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/bulk/template/${entity}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to download template');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entity}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
  import: async (entity: string, file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/bulk/import/${entity}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Import failed');
    }
    return res.json();
  },
};

// Uploads (file upload)
export const uploadsApi = {
  upload: async (file: File): Promise<{ url: string; filename: string }> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/uploads/`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.detail || 'Upload failed');
    }
    const json = await res.json();
    return json?.data ?? json;
  },
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
