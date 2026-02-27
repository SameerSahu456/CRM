// Navigation Types
export type NavigationItem =
  | 'dashboard'
  | 'sales-entry'
  | 'leads'
  | 'collections'
  | 'accounts'
  | 'contacts'
  | 'deals'
  | 'inventory'
  | 'tasks'
  | 'calendar'
  | 'meetings'
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
  viewAccess?: 'presales' | 'postsales' | 'both';
  tag?: 'channel' | 'endcustomer' | 'both';
  managerId?: string;
  managerName?: string;
  dashboardPreferences?: DashboardPreferences;
}

export type ViewAccess = 'presales' | 'postsales' | 'both';

export type UserRole =
  | 'admin'
  | 'superadmin'
  | 'sales'
  | 'manager'
  | 'presales'
  | 'support'
  | 'businesshead'
  | 'productmanager';

// Dashboard Widget Types
export interface WidgetMetadata {
  id: string;
  label: string;
  description: string;
  category: 'presales' | 'postsales' | 'both' | 'analytics' | 'tasks';
  icon: React.ReactNode;
  requiredView?: 'presales' | 'postsales' | 'both';
  requiredRoles?: UserRole[];
  defaultVisible: boolean;
  defaultOrder: number;
  component: React.ComponentType<WidgetProps>;
  navigateTo?: NavigationItem;
}

export interface WidgetPlacement {
  id: string;
  visible: boolean;
  order: number;
  gridPosition?: { row: number; col: number; width: number };
}

export interface DashboardPreferences {
  widgets: WidgetPlacement[];
  lastModified?: string;
}

export interface WidgetProps {
  user: User | null;
  currentView: ViewAccess;
  navigate: (tab: NavigationItem) => void;
  onDetailClick?: () => void;
}

// Products
export interface Product {
  id: string;
  name: string;
  category?: string;
  basePrice?: number;
  commissionRate?: number;
  stock: number;
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
  assignedToName?: string;
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
  description?: string;
  dealId?: string;
  productIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  // Joined data
  partnerName?: string;
  productName?: string;
  productNames?: string[];
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

  // Lead Information (Extended)
  firstName?: string;
  lastName?: string;
  mobile?: string;
  mobileAlternate?: string;
  phoneAlternate?: string;
  campaignSource?: string;
  website?: string;
  accountType?: string;
  leadCategory?: string;

  // Order Info
  productList?: string;
  typeOfOrder?: string;
  billingDeliveryDate?: string;
  orderProductDetails?: string;
  payment?: string;
  poNumberOrMailConfirmation?: string;
  brand?: string;
  orcAmount?: number;
  productWarranty?: string;
  shipBy?: string;
  specialInstruction?: string;
  thirdPartyDeliveryAddress?: string;
  billingCompany?: string;

  // Forms Info
  enterProductDetails?: string;
  rentalDuration?: string;
  productConfiguration?: string;
  bandwidthRequired?: string;
  productNameAndPartNumber?: string;
  specifications?: string;
  formName?: string;

  // Billing Address
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingCountry?: string;
  billingZipCode?: string;

  // Description Info
  description?: string;
  leadTime?: string;
  productName?: string;
  receiverMobileNumber?: string;
  subject?: string;
  senderLandlineNo?: string;
  senderLandlineNoAlt?: string;
  callDuration?: string;
  leadType?: string;
  queryId?: string;
  mcatName?: string;

  // Tag
  tag?: 'Channel' | 'End Customer';

  // Designation and Location
  designation?: string;
  location?: string;

  // Requirements
  requirement?: string;
  quotedRequirement?: string;

  // Lead Image
  leadImage?: string;

  createdAt?: string;
  updatedAt?: string;
}

export type LeadStage = 'New' | 'Proposal' | 'Cold' | 'Negotiation' | 'Closed Lost' | 'Closed Won';

export interface LeadActivity {
  id: string;
  leadId: string;
  activityType: string;
  title: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
  createdByName?: string;
}

// Quotes
export interface Quote {
  id: string;
  quoteNumber?: string;
  leadId?: string;
  dealId?: string;
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
  pdfUrl?: string;
  selectedTermIds?: string[];
}

export interface QuoteLineItem {
  id?: string;
  quoteId?: string;
  productId?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sortOrder?: number;
  productName?: string;
}

// Quote Terms
export interface QuoteTerm {
  id: string;
  content: string;
  isPredefined: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
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

  // Additional fields
  accountImage?: string;
  groupName?: string;
  parentAccountId?: string;
  endcustomerCategory?: string;
  productsSellingToThem?: string;
  productsTheySell?: string;
  panNo?: string;
  partnerId?: string;
  leadCategory?: string;
  newLeads?: number;
  referencesDoc?: string;
  bankStatementDoc?: string;
  tag?: string;
  accountType?: 'Channel Partner' | 'End Customer';

  // Contact Information
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactDesignation?: string;
  contactDesignationOther?: string;

  // Billing Address
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingCode?: string;
  billingCountry?: string;

  // Shipping Address
  shippingStreet?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingCode?: string;
  shippingCountry?: string;

  createdAt?: string;
  updatedAt?: string;
  ownerName?: string;
  partnerName?: string;
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

  // Contact Image
  image?: string;

  // Description Information
  description?: string;
  contactGroup?: string;

  // Extended Contact Information
  ctsiplEmail?: string;
  pan?: string;
  gstinNo?: string;
  productInterested?: string;
  productInterestedText?: string;
  leadSource?: string;
  leadCategory?: string;
  designation?: string;
  vendorName?: string;
  partnerId?: string;
  newLeads?: boolean;
  gstCertificateUrl?: string;
  msmeCertificateUrl?: string;
  panCardUrl?: string;
  aadharCardUrl?: string;

  // Forms Info
  bandwidthRequired?: string;
  productConfiguration?: string;
  productDetails?: string;
  rentalDuration?: string;
  productNamePartNumber?: string;
  specifications?: string;

  // Mailing Address
  mailingStreet?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingZip?: string;
  mailingCountry?: string;

  // Other Address
  otherStreet?: string;
  otherCity?: string;
  otherState?: string;
  otherZip?: string;
  otherCountry?: string;
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
  tag?: 'Channel' | 'End Customer';
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
  // New display fields
  contactNo?: string;
  designation?: string;
  email?: string;
  location?: string;
  nextFollowUp?: string;
  // Requirements
  requirement?: string;
  quotedRequirement?: string;
  paymentFlag?: boolean;
  typeOfOrder?: string;
}

export type DealStage = 'New' | 'Proposal' | 'Cold' | 'Negotiation' | 'Closed Lost' | 'Closed Won';

export interface DealActivity {
  id: string;
  dealId: string;
  activityType: string;
  title: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
  createdByName?: string;
}

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
  productManagerId?: string;
  productManagerIds?: string; // JSON string: '["uuid1","uuid2"]'
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

// Roles & Permissions
export interface Role {
  id: string;
  name: string;
  label: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  permissions: RolePermission[];
  createdAt?: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  entity: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// Activity Logs
export interface ActivityLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  changes?: ActivityChange[];
  ipAddress?: string;
  createdAt?: string;
}

export interface ActivityChange {
  field: string;
  old?: string;
  new?: string;
}

// Bulk Import
export interface BulkImportResult {
  total: number;
  imported: number;
  errors: BulkImportError[];
}

export interface BulkImportError {
  row: number;
  field: string;
  message: string;
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
