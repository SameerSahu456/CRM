// Navigation Types
export type NavigationItem =
  | 'dashboard'
  | 'sales-entry'
  | 'partners'
  | 'crm'
  | 'accounts'
  | 'contacts'
  | 'deals'
  | 'quote-builder'
  | 'carepacks'
  | 'tasks'
  | 'calendar'
  | 'emails'
  | 'reports'
  | 'admin'
  | 'settings';

// User / Auth
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  phone?: string;
  employeeId?: string;
  isActive: boolean;
  monthlyTarget?: number;
  lastLogin?: string;
  createdAt?: string;
}

export type UserRole =
  | 'admin'
  | 'superadmin'
  | 'salesperson'
  | 'branchhead'
  | 'producthead'
  | 'businesshead'
  | 'salesmanager';

// Products
export interface Product {
  id: string;
  name: string;
  category?: string;
  basePrice?: number;
  commissionRate?: number;
  isActive: boolean;
  createdAt?: string;
}

// Partners
export interface Partner {
  id: string;
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  gstNumber?: string;
  panNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  partnerType?: string;
  vertical?: string;
  status: 'pending' | 'approved' | 'rejected';
  tier: 'elite' | 'growth' | 'new';
  assignedTo?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Sales Entries
export interface SalesEntry {
  id: string;
  partnerId: string;
  productId: string;
  salespersonId: string;
  customerName?: string;
  quantity: number;
  amount: number;
  poNumber?: string;
  invoiceNo?: string;
  paymentStatus: string;
  commissionAmount?: number;
  saleDate: string;
  locationId?: string;
  verticalId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  // Joined data
  partnerName?: string;
  productName?: string;
  salespersonName?: string;
}

// Leads / CRM
export interface Lead {
  id: string;
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  source?: string;
  stage: LeadStage;
  priority: 'Low' | 'Medium' | 'High';
  estimatedValue?: number;
  productInterest?: string;
  assignedTo?: string;
  partnerId?: string;
  notes?: string;
  expectedCloseDate?: string;
  lostReason?: string;
  wonSaleId?: string;
  nextFollowUp?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type LeadStage = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export interface LeadActivity {
  id: string;
  leadId: string;
  activityType: string;
  title: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
}

// Quotes
export interface Quote {
  id: string;
  quoteNumber?: string;
  leadId?: string;
  partnerId?: string;
  customerName: string;
  validUntil?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  terms?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  partnerName?: string;
  lineItems?: QuoteLineItem[];
}

export interface QuoteLineItem {
  id?: string;
  quoteId?: string;
  productId?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  lineTotal: number;
  sortOrder?: number;
  productName?: string;
}

// Carepacks
export interface Carepack {
  id: string;
  partnerId?: string;
  productType?: string;
  serialNumber?: string;
  carepackSku?: string;
  customerName?: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'expired' | 'cancelled';
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  partnerName?: string;
}

// Accounts
export interface Account {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  revenue?: number;
  employees?: number;
  location?: string;
  type?: string;
  status: string;
  phone?: string;
  email?: string;
  healthScore?: number;
  description?: string;
  ownerId?: string;
  gstinNo?: string;
  paymentTerms?: string;
  createdAt?: string;
  updatedAt?: string;
  ownerName?: string;
}

// Contacts
export interface Contact {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  accountId?: string;
  type?: string;
  status: string;
  notes?: string;
  preferredContact?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  accountName?: string;
  ownerName?: string;
}

// Deals
export interface Deal {
  id: string;
  title: string;
  company?: string;
  accountId?: string;
  value?: number;
  stage: DealStage;
  probability?: number;
  ownerId?: string;
  closingDate?: string;
  description?: string;
  contactId?: string;
  nextStep?: string;
  forecast?: string;
  type?: string;
  leadSource?: string;
  createdAt?: string;
  updatedAt?: string;
  accountName?: string;
  contactName?: string;
  ownerName?: string;
}

export type DealStage = 'Qualification' | 'Discovery' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';

// Tasks
export interface Task {
  id: string;
  title: string;
  description?: string;
  type?: string;
  status: string;
  priority: string;
  dueDate?: string;
  dueTime?: string;
  assignedTo?: string;
  createdBy?: string;
  completedAt?: string;
  relatedToType?: string;
  relatedToId?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedToName?: string;
  createdByName?: string;
}

// Calendar Events
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type?: string;
  startTime: string;
  endTime?: string;
  allDay?: boolean;
  location?: string;
  meetingLink?: string;
  ownerId?: string;
  color?: string;
  relatedToType?: string;
  relatedToId?: string;
  createdAt?: string;
  updatedAt?: string;
  ownerName?: string;
}

// Emails
export interface Email {
  id: string;
  subject: string;
  body?: string;
  fromAddress?: string;
  toAddress?: string;
  cc?: string;
  bcc?: string;
  status: string;
  sentAt?: string;
  scheduledAt?: string;
  relatedToType?: string;
  relatedToId?: string;
  templateId?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  ownerName?: string;
  templateName?: string;
}

// Email Templates
export interface EmailTemplate {
  id: string;
  name: string;
  subject?: string;
  body?: string;
  category?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
  ownerName?: string;
}

// Notifications
export interface Notification {
  id: string;
  userId: string;
  type?: string;
  title?: string;
  message?: string;
  link?: string;
  isRead: boolean;
  createdAt?: string;
}

// Settings
export interface Setting {
  id: string;
  key: string;
  value: string;
  category?: string;
}

// Announcements
export interface Announcement {
  id: string;
  title: string;
  message?: string;
  priority?: string;
  createdBy?: string;
  isActive: boolean;
  createdAt?: string;
}

// Master Data
export interface MasterItem {
  id: string;
  name: string;
  isActive: boolean;
}

export interface MasterLocation {
  id: string;
  city: string;
  state: string;
  region?: string;
  isActive: boolean;
}

export interface MasterCategory {
  id: string;
  name: string;
  oemId?: string;
  isActive: boolean;
}

// Dashboard
export interface DashboardStats {
  totalSales: number;
  totalPartners: number;
  activeLeads: number;
  monthlyRevenue: number;
  pendingPartners: number;
  pendingPayments: number;
}

export interface MonthlyStat {
  month: string;
  revenue: number;
  count: number;
}

// Pagination
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
