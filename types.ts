// Navigation Types
export type NavigationItem =
  | 'dashboard'
  | 'leads'
  | 'deals'
  | 'accounts'
  | 'analytics'
  | 'contacts'
  | 'tasks'
  | 'calendar'
  | 'campaigns'
  | 'tickets'
  | 'email'
  | 'reports'
  | 'settings';

// Lead Management
export interface Lead {
  id: string;
  // Lead Information
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  phone?: string;
  mobileAlternate?: string;
  phoneAlternate?: string;
  campaignSource?: string;
  website?: string;
  leadOwner: string;
  company: string;
  accountType?: 'Customer' | 'Prospect' | 'Partner' | 'Vendor' | 'Competitor' | 'Other';
  source: 'Website' | 'Referral' | 'LinkedIn' | 'Cold Call' | 'Trade Show' | 'Email Campaign' | 'Advertisement' | 'Social Media' | 'Partner' | 'Other';
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Converted' | 'Lost' | 'Not Contacted' | 'Attempted' | 'Junk';
  leadCategory?: 'Hot' | 'Warm' | 'Cold';
  createdBy: string;
  modifiedBy?: string;
  score: number;
  lastActive: string;
  avatar?: string;
  owner: string;
  createdAt: string;
  modifiedAt?: string;
  tags?: string[];
  budget?: number;
  timeline?: string;
  industry?: string;
  jobTitle?: string;

  // Order Information
  orderInfo?: {
    productList?: string[];
    typeOfOrder?: 'New' | 'Renewal' | 'Upgrade' | 'Downgrade';
    billingDeliveryDate?: string;
    poDate?: string;
    poNumber?: string;
    paymentMode?: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'Cheque' | 'Online' | 'Other';
    paymentReceived?: boolean;
    paymentReceivedDate?: string;
    paymentBankName?: string;
    paymentChequeNo?: string;
    paymentOtherDetails?: string;
    paymentRefNo?: string;
  };

  // Forms Information
  formsInfo?: {
    gst?: string;
    dlNo?: string;
    aadharNo?: string;
    panNo?: string;
    fssaiNo?: string;
    tanNo?: string;
    otherText?: string;
    attachDL?: string;
    attachGST?: string;
    attachAadhar?: string;
    attachPAN?: string;
    attachFSSAI?: string;
    attachOther?: string;
    attachPhoto?: string;
    fileUpload?: string;
    groupName?: string;
    mappedBy?: string;
  };

  // Billing Address Information
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    landmark?: string;
    area?: string;
  };

  // Description Information
  description?: string;
  notes?: string;

  // Visit Summary
  visitSummary?: {
    rmName?: string;
    visitDate?: string;
    visitSummary?: string;
    productRequirements?: string;
    enquiryList?: string[];
    currentDealers?: string;
    requirements?: string;
    competition?: string;
    creditDays?: number;
    specialPrice?: string;
    marketCredit?: string;
    remarks?: string;
    finalRemarks?: string;
    potential?: 'High' | 'Medium' | 'Low';
    visitScheduleDate?: string;
    visitScheduleTime?: string;
    orderType?: string;
    orderValue?: number;
    billingDate?: string;
  };
}

// Contact Management
export interface Contact {
  id: string;

  // Contact Information
  salutation?: 'Mr.' | 'Mrs.' | 'Ms.' | 'Dr.' | 'Prof.';
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  secondaryEmail?: string;
  phone: string;
  mobile?: string;
  homePhone?: string;
  otherPhone?: string;
  fax?: string;
  assistant?: string;
  assistantPhone?: string;

  // Professional Info
  jobTitle: string;
  department?: string;
  reportingTo?: string;
  reportingToId?: string;
  dateOfBirth?: string;
  skypeId?: string;
  twitter?: string;

  // Account Relation
  accountId: string;
  accountName: string;
  vendorName?: string;

  // Classification
  type: 'Customer' | 'Prospect' | 'Partner' | 'Vendor' | 'Other';
  status: 'Active' | 'Inactive';
  leadSource?: string;

  // Address Information
  mailingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    landmark?: string;
    area?: string;
  };
  otherAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    landmark?: string;
    area?: string;
  };

  // Description
  description?: string;
  notes?: string;

  // System Fields
  avatar: string;
  address?: Address;
  socialProfiles?: SocialProfiles;
  lastContacted?: string;
  createdAt: string;
  modifiedAt?: string;
  createdBy?: string;
  modifiedBy?: string;
  owner: string;
  tags?: string[];
  preferredContact?: 'Email' | 'Phone' | 'Mobile';
  doNotContact?: boolean;
  emailOptOut?: boolean;

  // Hierarchy (for org chart / hierarchy view)
  hierarchy?: {
    level?: number;
    parentContactId?: string;
    childContactIds?: string[];
  };
}

export interface SocialProfiles {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// Account/Company Management
export interface Account {
  id: string;

  // Description Information
  description?: string;
  group?: string;

  // Account Information
  name: string;
  phone?: string;
  website: string;
  accountOwner: string;
  industry: string;
  accountType?: 'Customer' | 'Prospect' | 'Partner' | 'Vendor' | 'Competitor' | 'Analyst' | 'Integrator' | 'Investor' | 'Press' | 'Reseller' | 'Other';
  rating?: 'Hot' | 'Warm' | 'Cold' | 'Acquired' | 'Active' | 'Market Failed' | 'Project Cancelled' | 'Shut Down';
  accountNumber?: string;
  accountSite?: string;
  parentAccount?: string;
  parentAccountId?: string;
  ticker?: string;
  ownership?: 'Public' | 'Private' | 'Subsidiary' | 'Partnership' | 'Government' | 'Other';

  // Other Info
  territory?: string;
  dealClosingDate?: string;
  supportStartDate?: string;
  supportExpiryDate?: string;
  productDetails?: string;
  purchaseOrderNo?: string;
  lockingPeriodEndDate?: string;
  sicCode?: string;
  noOfRetailCounters?: number;

  // Contact Info
  contactName?: string;
  contactEmail?: string;
  contactMobile?: string;
  contactPhone?: string;
  fax?: string;

  // Employees & Revenue
  employees: number;
  revenue: number;
  annualRevenue?: number;

  // Address Information
  location: string;
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    landmark?: string;
    area?: string;
  };
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    landmark?: string;
    area?: string;
  };

  // System Fields
  healthScore: number;
  logo: string;
  type: 'Customer' | 'Prospect' | 'Partner' | 'Vendor' | 'Competitor';
  status: 'Active' | 'Inactive' | 'Churned';
  owner: string;
  createdBy?: string;
  modifiedBy?: string;
  createdAt: string;
  modifiedAt?: string;

  // Relations
  contacts?: string[];
  deals?: string[];
}

// Deal/Opportunity Management
export interface Deal {
  id: string;

  // Deal Information
  title: string;
  dealName: string;
  accountId?: string;
  accountName?: string;
  contactId?: string;
  contactName?: string;
  typeOfOrder?: 'New' | 'Renewal' | 'Upgrade' | 'Downgrade' | 'Cross-sell' | 'Upsell';
  createdByRM?: string;
  dealOwner: string;
  amount: number;
  value: number;
  closingDate: string;
  leadSource?: string;
  stage: 'Qualification' | 'Discovery' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost' | 'Needs Analysis' | 'Value Proposition' | 'Id. Decision Makers' | 'Perception Analysis';
  probability: number;
  expectedRevenue?: number;
  campaignSource?: string;
  nextStep?: string;

  // Product Information
  productInfo?: {
    productList?: string[];
    productName?: string;
    productCode?: string;
    quantity?: number;
    unitPrice?: number;
    discount?: number;
    totalAmount?: number;
  };
  products?: DealProduct[];

  // Forms Information
  formsInfo?: {
    gst?: string;
    dlNo?: string;
    aadharNo?: string;
    panNo?: string;
    fssaiNo?: string;
    tanNo?: string;
    otherText?: string;
    attachDL?: string;
    attachGST?: string;
    attachAadhar?: string;
    attachPAN?: string;
    attachFSSAI?: string;
    attachOther?: string;
    attachPhoto?: string;
    fileUpload?: string;
    groupName?: string;
    mappedBy?: string;
  };

  // Other Info
  territory?: string;
  billingDeliveryDate?: string;
  poDate?: string;
  poNumber?: string;
  paymentMode?: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'Cheque' | 'Online' | 'Other';
  paymentReceived?: boolean;
  paymentReceivedDate?: string;
  paymentBankName?: string;
  paymentChequeNo?: string;
  paymentOtherDetails?: string;
  paymentRefNo?: string;
  supportStartDate?: string;
  supportExpiryDate?: string;
  lockingPeriodEndDate?: string;

  // Billing Address Information
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    landmark?: string;
    area?: string;
  };

  // Description Information
  description?: string;
  notes?: string;

  // System Fields
  company: string;
  owner: string;
  createdAt?: string;
  modifiedAt?: string;
  createdBy?: string;
  modifiedBy?: string;
  lostReason?: string;
  competitorName?: string;
  forecast?: 'Pipeline' | 'Best Case' | 'Commit' | 'Omitted';
  type?: 'New Business' | 'Existing Business' | 'Renewal';
}

export interface DealProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  discount?: number;
}

// Activity/Task Management
export interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'Call' | 'Email' | 'Meeting' | 'Task' | 'Follow-up' | 'Demo';
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Deferred' | 'Cancelled';
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  dueDate: string;
  dueTime?: string;
  relatedTo?: {
    type: 'Lead' | 'Contact' | 'Account' | 'Deal' | 'Ticket';
    id: string;
    name: string;
  };
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  reminderDate?: string;
  recurring?: {
    frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
    endDate?: string;
  };
}

export interface Activity {
  id: string;
  type: 'Call' | 'Email' | 'Meeting' | 'Note' | 'Task Completed' | 'Deal Update' | 'Status Change';
  subject: string;
  description?: string;
  date: string;
  duration?: number;
  outcome?: 'Successful' | 'Unsuccessful' | 'No Answer' | 'Left Voicemail' | 'Scheduled Follow-up';
  relatedTo: {
    type: 'Lead' | 'Contact' | 'Account' | 'Deal' | 'Ticket';
    id: string;
    name: string;
  };
  performedBy: string;
  createdAt: string;
}

// Calendar Events
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'Meeting' | 'Call' | 'Demo' | 'Webinar' | 'Task' | 'Reminder' | 'Out of Office';
  start: string;
  end: string;
  allDay?: boolean;
  location?: string;
  meetingLink?: string;
  attendees?: Attendee[];
  relatedTo?: {
    type: 'Lead' | 'Contact' | 'Account' | 'Deal';
    id: string;
    name: string;
  };
  owner: string;
  color?: string;
  reminder?: number;
}

export interface Attendee {
  id: string;
  name: string;
  email: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Tentative';
  type: 'Required' | 'Optional';
}

// Marketing Campaigns
export interface Campaign {
  id: string;
  name: string;
  type: 'Email' | 'Social Media' | 'Webinar' | 'Trade Show' | 'Advertisement' | 'Referral Program' | 'Content Marketing';
  status: 'Planning' | 'Active' | 'Paused' | 'Completed' | 'Cancelled';
  startDate: string;
  endDate: string;
  budget: number;
  actualCost?: number;
  expectedRevenue?: number;
  actualRevenue?: number;
  description?: string;
  owner: string;
  createdAt: string;
  targetAudience?: string;
  goals?: string;
  metrics?: CampaignMetrics;
  members?: CampaignMember[];
}

export interface CampaignMetrics {
  sent?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  converted?: number;
  unsubscribed?: number;
  bounced?: number;
  leads?: number;
  roi?: number;
}

export interface CampaignMember {
  id: string;
  type: 'Lead' | 'Contact';
  name: string;
  email: string;
  status: 'Sent' | 'Opened' | 'Clicked' | 'Responded' | 'Converted' | 'Opted Out';
  addedAt: string;
}

// Email Templates
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'Sales' | 'Marketing' | 'Support' | 'Follow-up' | 'Introduction';
  category?: string;
  owner: string;
  createdAt: string;
  lastUsed?: string;
  usageCount?: number;
}

export interface Email {
  id: string;
  subject: string;
  body: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  status: 'Draft' | 'Sent' | 'Scheduled' | 'Failed';
  sentAt?: string;
  scheduledAt?: string;
  openedAt?: string;
  clickedAt?: string;
  relatedTo?: {
    type: 'Lead' | 'Contact' | 'Account' | 'Deal' | 'Ticket' | 'Campaign';
    id: string;
    name: string;
  };
  templateId?: string;
  attachments?: Attachment[];
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

// Customer Support Tickets
export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Pending' | 'On Hold' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  type: 'Question' | 'Problem' | 'Feature Request' | 'Bug' | 'Task';
  category?: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  accountId?: string;
  accountName?: string;
  assignedTo?: string;
  assignedTeam?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  dueDate?: string;
  sla?: {
    responseTime: number;
    resolutionTime: number;
    breached: boolean;
  };
  comments?: TicketComment[];
  tags?: string[];
  satisfaction?: {
    rating: number;
    feedback?: string;
  };
}

export interface TicketComment {
  id: string;
  content: string;
  author: string;
  authorType: 'Agent' | 'Customer';
  createdAt: string;
  isInternal?: boolean;
  attachments?: Attachment[];
}

// Knowledge Base
export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  subcategory?: string;
  status: 'Draft' | 'Published' | 'Archived';
  author: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  views?: number;
  helpfulVotes?: number;
  notHelpfulVotes?: number;
  tags?: string[];
  relatedArticles?: string[];
}

// Reports
export interface Report {
  id: string;
  name: string;
  description?: string;
  type: 'Lead' | 'Contact' | 'Account' | 'Deal' | 'Activity' | 'Campaign' | 'Ticket' | 'Custom';
  chartType: 'Bar' | 'Line' | 'Pie' | 'Funnel' | 'Table' | 'KPI';
  filters?: ReportFilter[];
  columns?: string[];
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  owner: string;
  createdAt: string;
  lastRun?: string;
  schedule?: {
    frequency: 'Daily' | 'Weekly' | 'Monthly';
    recipients: string[];
    nextRun: string;
  };
  isPublic?: boolean;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'is_empty' | 'is_not_empty';
  value: string | number | string[] | number[];
}

// Dashboard & Analytics
export interface ChartData {
  name: string;
  value: number;
  value2?: number;
}

export interface KpiStat {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon?: string;
  color?: string;
}

export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'list' | 'funnel';
  title: string;
  dataSource: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  config?: Record<string, unknown>;
}

// Users & Settings
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: 'Admin' | 'Sales Manager' | 'Sales Rep' | 'Marketing' | 'Support' | 'Read Only';
  department?: string;
  phone?: string;
  timezone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  permissions?: Permission[];
  notificationPreferences?: NotificationPreferences;
}

export interface Permission {
  module: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  push: boolean;
  digest: 'realtime' | 'daily' | 'weekly' | 'none';
}

// Notifications
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'task' | 'mention' | 'reminder';
  title: string;
  message: string;
  link?: string;
  relatedTo?: {
    type: string;
    id: string;
  };
  read: boolean;
  createdAt: string;
}

// Settings
export interface CompanySettings {
  name: string;
  logo?: string;
  website?: string;
  phone?: string;
  address?: Address;
  timezone?: string;
  currency?: string;
  fiscalYearStart?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
}

export interface SalesSettings {
  defaultCurrency: string;
  dealStages: { name: string; probability: number; order: number }[];
  leadStatuses: string[];
  leadSources: string[];
  forecastCategories: string[];
  roundRobinAssignment: boolean;
}

// Workflow Automation
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  conditions?: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  lastTriggered?: string;
  executionCount?: number;
}

export interface WorkflowTrigger {
  type: 'record_created' | 'record_updated' | 'field_changed' | 'scheduled' | 'manual';
  module: string;
  field?: string;
  schedule?: string;
}

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: string | number | boolean;
  logic?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: 'send_email' | 'create_task' | 'update_field' | 'notify_user' | 'webhook' | 'assign_owner';
  config: Record<string, unknown>;
}

// Quote/Proposal
export interface Quote {
  id: string;
  quoteNumber: string;
  name: string;
  dealId: string;
  accountId: string;
  contactId: string;
  status: 'Draft' | 'Pending' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
  validUntil: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  terms?: string;
  notes?: string;
  lineItems: QuoteLineItem[];
  owner: string;
  createdAt: string;
  sentAt?: string;
  acceptedAt?: string;
}

export interface QuoteLineItem {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

// Products/Services
export interface Product {
  id: string;
  name: string;
  code?: string;
  description?: string;
  category?: string;
  unitPrice: number;
  currency: string;
  isActive: boolean;
  taxable?: boolean;
  taxRate?: number;
}
