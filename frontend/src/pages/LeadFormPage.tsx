import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, X, Edit2, Trash2,
  IndianRupee, Loader2, AlertCircle, CheckCircle, Calendar,
  Phone, Mail, MessageSquare, Users, Target, TrendingUp,
  ArrowLeft, Clock, StickyNote, FileText, Zap,
  ChevronDown, Award, Building2, User as UserIcon, Tags,
  Download, Upload, Send, BarChart3, XCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useDropdowns } from '@/contexts/DropdownsContext';
import {
  leadsApi, dealsApi, partnersApi, productsApi, quotesApi, adminApi,
  accountsApi, contactsApi, uploadsApi, salesApi, formatINR,
} from '@/services/api';
import { Lead, LeadStage, Quote, Partner, Product, User, ActivityLog } from '@/types';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { Card, Button, Input, Select, Modal, Badge, Alert, Textarea } from '@/components/ui';
import { inputStyles, labelStyles } from '@/components/ui';
import { cx } from '@/utils/cx';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LEAD_STAGES: LeadStage[] = ['New', 'Proposal', 'Cold', 'Negotiation', 'Closed Won', 'Closed Lost'];

const STAGE_BADGE_VARIANT: Record<LeadStage, 'cyan' | 'purple' | 'blue' | 'amber' | 'red' | 'emerald'> = {
  New: 'cyan',
  Proposal: 'purple',
  Cold: 'blue',
  Negotiation: 'amber',
  'Closed Lost': 'red',
  'Closed Won': 'emerald',
};

const STAGE_DOT_COLORS: Record<LeadStage, string> = {
  New: 'bg-cyan-500',
  Proposal: 'bg-purple-500',
  Cold: 'bg-blue-500',
  Negotiation: 'bg-amber-500',
  'Closed Lost': 'bg-red-500',
  'Closed Won': 'bg-emerald-500',
};

const PRIORITY_BADGE_VARIANT: Record<string, 'red' | 'amber' | 'green'> = {
  High: 'red',
  Medium: 'amber',
  Low: 'green',
};

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

interface LeadFormData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  source: string;
  stage: LeadStage;
  priority: 'Low' | 'Medium' | 'High';
  estimatedValue: number;
  productInterest: string;
  expectedCloseDate: string;
  nextFollowUp: string;
  notes: string;
  assignedTo: string;
  partnerId: string;
  tag: string;
  designation: string;
  location: string;

  // Lead Information (Extended)
  firstName: string;
  lastName: string;
  mobile: string;
  mobileAlternate: string;
  phoneAlternate: string;
  campaignSource: string;
  website: string;
  accountType: string;
  leadCategory: string;

  // Order Info
  productList: string;
  typeOfOrder: string;
  billingDeliveryDate: string;
  orderProductDetails: string;
  payment: string;
  poNumberOrMailConfirmation: string;
  brand: string;
  orcAmount: number;
  productWarranty: string;
  shipBy: string;
  specialInstruction: string;
  thirdPartyDeliveryAddress: string;
  billingCompany: string;

  // Forms Info
  enterProductDetails: string;
  rentalDuration: string;
  productConfiguration: string;
  bandwidthRequired: string;
  productNameAndPartNumber: string;
  specifications: string;
  formName: string;

  // Billing Address
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingCountry: string;
  billingZipCode: string;

  // Description Info
  description: string;
  leadTime: string;
  productName: string;
  receiverMobileNumber: string;
  subject: string;
  senderLandlineNo: string;
  senderLandlineNoAlt: string;
  callDuration: string;
  leadType: string;
  queryId: string;
  mcatName: string;

  // Requirements
  requirement: string;
  quotedRequirement: string;

  // Lead Image
  leadImage: string;
}

interface ConvertFormData {
  partnerId: string;
  productId: string;
  amount: number;
  saleDate: string;
  customerName: string;
}

const EMPTY_LEAD_FORM: LeadFormData = {
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  source: '',
  stage: 'New',
  priority: 'Medium',
  estimatedValue: 0,
  productInterest: '',
  expectedCloseDate: '',
  nextFollowUp: '',
  notes: '',
  assignedTo: '',
  partnerId: '',
  tag: '',
  designation: '',
  location: '',

  // Lead Information (Extended)
  firstName: '',
  lastName: '',
  mobile: '',
  mobileAlternate: '',
  phoneAlternate: '',
  campaignSource: '',
  website: '',
  accountType: '',
  leadCategory: '',

  // Order Info
  productList: '',
  typeOfOrder: '',
  billingDeliveryDate: '',
  orderProductDetails: '',
  payment: '',
  poNumberOrMailConfirmation: '',
  brand: '',
  orcAmount: 0,
  productWarranty: '',
  shipBy: '',
  specialInstruction: '',
  thirdPartyDeliveryAddress: '',
  billingCompany: '',

  // Forms Info
  enterProductDetails: '',
  rentalDuration: '',
  productConfiguration: '',
  bandwidthRequired: '',
  productNameAndPartNumber: '',
  specifications: '',
  formName: '',

  // Billing Address
  billingStreet: '',
  billingCity: '',
  billingState: '',
  billingCountry: '',
  billingZipCode: '',

  // Description Info
  description: '',
  leadTime: '',
  productName: '',
  receiverMobileNumber: '',
  subject: '',
  senderLandlineNo: '',
  senderLandlineNoAlt: '',
  callDuration: '',
  leadType: '',
  queryId: '',
  mcatName: '',

  // Requirements
  requirement: '',
  quotedRequirement: '',

  // Lead Image
  leadImage: '',
};

const EMPTY_CONVERT_FORM: ConvertFormData = {
  partnerId: '',
  productId: '',
  amount: 0,
  saleDate: new Date().toISOString().split('T')[0],
  customerName: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function relativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(dateStr);
  } catch {
    return '';
  }
}

// File input styles helper
const fileInputStyles = cx(
  inputStyles,
  'file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium',
  'file:bg-gray-100 file:text-gray-700 dark:file:bg-zinc-700 dark:file:text-zinc-200'
);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const InfoRow: React.FC<{
  label: string;
  value?: string;
  icon?: React.ReactNode;
  capitalize?: boolean;
}> = ({ label, value, icon, capitalize }) => (
  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-dark-100">
    {icon && (
      <span className="mt-0.5 flex-shrink-0 text-gray-400 dark:text-zinc-500">
        {icon}
      </span>
    )}
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-gray-400 dark:text-zinc-500">{label}</p>
      <p className={cx('text-sm text-gray-900 dark:text-white', capitalize && 'capitalize')}>
        {value || '-'}
      </p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const LeadFormPage: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab: navNavigate } = useNavigation();
  const { getOptions, getValues } = useDropdowns();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Detect mode from URL path
  const mode: 'create' | 'edit' | 'view' = location.pathname.includes('/create')
    ? 'create'
    : location.pathname.includes('/edit/')
      ? 'edit'
      : 'view';

  const PRIORITIES = getValues('priorities');
  const SOURCES = getOptions('lead-sources');

  // Dropdown data
  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const dropdownsLoadedRef = React.useRef(false);

  // Loading state
  const [pageLoading, setPageLoading] = useState(mode !== 'create');

  // Lead form state
  const [leadFormData, setLeadFormData] = useState<LeadFormData>({ ...EMPTY_LEAD_FORM });
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [leadFormError, setLeadFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    leadInfo: true,
    orderInfo: false,
    formsInfo: false,
    billingAddress: false,
    descriptionInfo: false,
    leadImage: false,
    opportunityDetails: false,
    requirements: true,
    classification: false,
  });

  // Detail/view state
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [auditLogs, setAuditLogs] = useState<ActivityLog[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  // Activity state
  const [activityType, setActivityType] = useState('note');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);

  // Convert modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertLeadId, setConvertLeadId] = useState<string | null>(null);
  const [convertForm, setConvertForm] = useState<ConvertFormData>({ ...EMPTY_CONVERT_FORM });
  const [convertError, setConvertError] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  // Closed Won modal
  const [showClosedWonModal, setShowClosedWonModal] = useState(false);
  const [closedWonLeadRef, setClosedWonLeadRef] = useState<{ lead: Lead; source: 'detail' | 'pipeline' } | null>(null);
  const [closedWonForm, setClosedWonForm] = useState({
    accountName: '', industry: '', type: 'Hunting', phone: '', email: '', location: '',
    contactFirstName: '', contactLastName: '', contactEmail: '', contactPhone: '',
    contactDesignation: '', contactDepartment: '',
  });
  const [closedWonError, setClosedWonError] = useState('');
  const [isClosedWonSubmitting, setIsClosedWonSubmitting] = useState(false);
  const [gstFile, setGstFile] = useState<File | null>(null);
  const [msmeFile, setMsmeFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [closedWonOrderForm, setClosedWonOrderForm] = useState({
    quantity: 1, amount: 0, poNumber: '', invoiceNo: '',
    paymentStatus: 'pending', saleDate: new Date().toISOString().split('T')[0],
    partnerId: '',
    contactName: '', contactNo: '', email: '', gstin: '', panNo: '',
    dispatchMethod: '', paymentTerms: '', orderType: 'New' as 'New' | 'Refurb' | 'Rental',
    serialNumber: '', boq: '', price: 0,
  });
  const [closedWonDescription, setClosedWonDescription] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Summarise modal
  const [showSummariseModal, setShowSummariseModal] = useState(false);

  // Inline quote builder state
  interface LeadInlineLineItem {
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }
  const emptyLeadLineItem: LeadInlineLineItem = { productId: '', description: '', quantity: 1, unitPrice: 0 };
  const [leadQuoteOpen, setLeadQuoteOpen] = useState(false);
  const [leadQuoteLineItems, setLeadQuoteLineItems] = useState<LeadInlineLineItem[]>([{ ...emptyLeadLineItem }]);
  const [leadQuoteTaxRate, setLeadQuoteTaxRate] = useState(18);
  const [leadQuoteDiscountAmount, setLeadQuoteDiscountAmount] = useState(0);
  const [leadQuoteCustomerName, setLeadQuoteCustomerName] = useState('');
  const [leadQuoteValidUntil, setLeadQuoteValidUntil] = useState('');
  const [leadQuoteNotes, setLeadQuoteNotes] = useState('');
  const [leadQuoteTerms, setLeadQuoteTerms] = useState('');
  const [leadQuoteSaving, setLeadQuoteSaving] = useState(false);
  const [leadQuoteError, setLeadQuoteError] = useState('');
  const [leadQuoteSuccess, setLeadQuoteSuccess] = useState('');
  const [leadQuotes, setLeadQuotes] = useState<Quote[]>([]);
  const [leadQuotesLoading, setLeadQuotesLoading] = useState(false);
  const [leadQuotePdfLoading, setLeadQuotePdfLoading] = useState<string | null>(null);
  const [editingLeadQuoteId, setEditingLeadQuoteId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchDropdownData = useCallback(async () => {
    if (dropdownsLoadedRef.current) return;
    try {
      const [productsList, partnersResponse, usersList] = await Promise.all([
        productsApi.list(),
        partnersApi.list({ limit: '100', status: 'approved' }),
        adminApi.listUsers(),
      ]);
      setProducts(Array.isArray(productsList) ? productsList : []);
      const partnerData = partnersResponse?.data ?? partnersResponse;
      setPartners(Array.isArray(partnerData) ? partnerData : []);
      setUsers(Array.isArray(usersList) ? usersList : []);
      dropdownsLoadedRef.current = true;
    } catch {
      // Dropdown data failure is non-critical
    }
  }, []);

  const fetchLeadQuotes = useCallback(async (leadId: string) => {
    setLeadQuotesLoading(true);
    try {
      const res = await quotesApi.list({ lead_id: leadId, limit: '50' });
      const data = res?.data ?? res ?? [];
      setLeadQuotes(Array.isArray(data) ? data : []);
    } catch {
      setLeadQuotes([]);
    } finally {
      setLeadQuotesLoading(false);
    }
  }, []);

  const fetchLeadForEdit = useCallback(async (leadId: string) => {
    setPageLoading(true);
    try {
      const res = await leadsApi.getById(leadId);
      const full = res?.data ?? res;
      setLeadFormData({
        ...EMPTY_LEAD_FORM,
        companyName: full.companyName || '',
        contactPerson: full.contactPerson || '',
        email: full.email || '',
        phone: full.phone || '',
        source: full.source || '',
        stage: full.stage,
        priority: full.priority,
        estimatedValue: full.estimatedValue || 0,
        productInterest: full.productInterest || '',
        expectedCloseDate: full.expectedCloseDate ? full.expectedCloseDate.split('T')[0] : '',
        nextFollowUp: full.nextFollowUp ? full.nextFollowUp.split('T')[0] : '',
        notes: full.notes || '',
        assignedTo: full.assignedTo || '',
        partnerId: full.partnerId || '',
        tag: full.tag || '',
        designation: full.designation || '',
        location: full.location || '',
        firstName: full.firstName || '',
        lastName: full.lastName || '',
        mobile: full.mobile || '',
        mobileAlternate: full.mobileAlternate || '',
        phoneAlternate: full.phoneAlternate || '',
        campaignSource: full.campaignSource || '',
        website: full.website || '',
        accountType: full.accountType || '',
        leadCategory: full.leadCategory || '',
        productList: full.productList || '',
        typeOfOrder: full.typeOfOrder || '',
        billingDeliveryDate: full.billingDeliveryDate ? full.billingDeliveryDate.split('T')[0] : '',
        orderProductDetails: full.orderProductDetails || '',
        payment: full.payment || '',
        poNumberOrMailConfirmation: full.poNumberOrMailConfirmation || '',
        brand: full.brand || '',
        orcAmount: full.orcAmount || 0,
        productWarranty: full.productWarranty || '',
        shipBy: full.shipBy || '',
        specialInstruction: full.specialInstruction || '',
        thirdPartyDeliveryAddress: full.thirdPartyDeliveryAddress || '',
        billingCompany: full.billingCompany || '',
        enterProductDetails: full.enterProductDetails || '',
        rentalDuration: full.rentalDuration || '',
        productConfiguration: full.productConfiguration || '',
        bandwidthRequired: full.bandwidthRequired || '',
        productNameAndPartNumber: full.productNameAndPartNumber || '',
        specifications: full.specifications || '',
        formName: full.formName || '',
        billingStreet: full.billingStreet || '',
        billingCity: full.billingCity || '',
        billingState: full.billingState || '',
        billingCountry: full.billingCountry || '',
        billingZipCode: full.billingZipCode || '',
        description: full.description || '',
        leadTime: full.leadTime || '',
        productName: full.productName || '',
        receiverMobileNumber: full.receiverMobileNumber || '',
        subject: full.subject || '',
        senderLandlineNo: full.senderLandlineNo || '',
        senderLandlineNoAlt: full.senderLandlineNoAlt || '',
        callDuration: full.callDuration || '',
        leadType: full.leadType || '',
        queryId: full.queryId || '',
        mcatName: full.mcatName || '',
        requirement: full.requirement || '',
        quotedRequirement: full.quotedRequirement || '',
        leadImage: full.leadImage || '',
      });
      setEditingLeadId(leadId);
    } catch {
      setLeadFormError('Failed to load lead for editing');
    } finally {
      setPageLoading(false);
    }
  }, []);

  const fetchLeadForView = useCallback(async (leadId: string) => {
    setPageLoading(true);
    setAuditLogs([]);
    setActivities([]);
    setLeadQuotes([]);
    try {
      const res = await leadsApi.getById(leadId);
      const lead = res?.data ?? res;
      setDetailLead(lead);
      setLeadQuoteCustomerName(lead.companyName || lead.contactPerson || '');

      // Load audit and activities in parallel
      setIsAuditLoading(true);
      try {
        const [auditData, actData] = await Promise.all([
          leadsApi.getAuditLog(leadId),
          leadsApi.getActivities(leadId),
        ]);
        setAuditLogs(Array.isArray(auditData) ? auditData : []);
        setActivities(Array.isArray(actData) ? actData : []);
      } catch {
        setAuditLogs([]);
        setActivities([]);
      } finally {
        setIsAuditLoading(false);
      }

      // Load quotes
      await fetchLeadQuotes(leadId);
    } catch {
      setDetailLead(null);
    } finally {
      setPageLoading(false);
    }
  }, [fetchLeadQuotes]);

  // Data loading based on mode
  useEffect(() => {
    fetchDropdownData();
    if (mode === 'create') {
      setLeadFormData({ ...EMPTY_LEAD_FORM });
      setEditingLeadId(null);
      setLeadFormError('');
    } else if (mode === 'edit' && id) {
      fetchLeadForEdit(id);
    } else if (mode === 'view' && id) {
      fetchLeadForView(id);
    }
  }, [mode, id, fetchDropdownData, fetchLeadForEdit, fetchLeadForView]);

  // Auto-open Closed Won modal when action=closed-won is in URL
  useEffect(() => {
    if (mode === 'view' && detailLead && searchParams.get('action') === 'closed-won') {
      openClosedWonModal(detailLead, 'pipeline');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, detailLead, searchParams]);

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const handleBack = () => navigate('/leads');
  const handleSaveSuccess = () => navigate('/leads');

  // ---------------------------------------------------------------------------
  // Lead form handlers
  // ---------------------------------------------------------------------------

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  const handleLeadFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setLeadFormData(prev => ({
      ...prev,
      [name]: name === 'estimatedValue' || name === 'orcAmount' ? Number(value) || 0 : value,
    }));
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadFormError('');

    if (!leadFormData.companyName.trim()) {
      setLeadFormError('Company name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...leadFormData,
        assignedTo: leadFormData.assignedTo || user?.id
      };

      if (editingLeadId) {
        await leadsApi.update(editingLeadId, payload);
      } else {
        await leadsApi.create(payload);
      }
      handleSaveSuccess();
    } catch (err: any) {
      setLeadFormError(err.message || 'Failed to save lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Lead detail handlers
  // ---------------------------------------------------------------------------

  const handleUpdateStage = async (newStage: LeadStage) => {
    if (!detailLead || detailLead.stage === newStage) return;
    // Intercept Closed Won to show account creation popup
    if (newStage === 'Closed Won' && detailLead.stage !== 'Closed Won') {
      openClosedWonModal(detailLead, 'detail');
      return;
    }
    setIsUpdatingStage(true);
    try {
      const res = await leadsApi.update(detailLead.id, { stage: newStage });
      setDetailLead(res?.data ?? res);
    } catch {
      // Revert on failure - no-op, we just don't update
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleAddLeadActivity = async () => {
    if (!detailLead || !activityTitle.trim()) return;
    setIsAddingActivity(true);
    try {
      await leadsApi.addActivity(detailLead.id, {
        activity_type: activityType,
        title: activityTitle.trim(),
        description: activityDesc.trim() || undefined,
      });
      setActivityTitle('');
      setActivityDesc('');
      setActivityType('note');
      // Refresh activities list
      const actData = await leadsApi.getActivities(detailLead.id);
      setActivities(Array.isArray(actData) ? actData : []);
    } catch (err) {
      console.error('Failed to add activity', err);
    }
    setIsAddingActivity(false);
  };

  // ---------------------------------------------------------------------------
  // Quote handlers
  // ---------------------------------------------------------------------------

  const handleLeadQuotePdf = async (quote: Quote) => {
    setLeadQuotePdfLoading(quote.id);
    try {
      if (quote.pdfUrl) {
        window.open(quote.pdfUrl, '_blank');
      } else {
        const result = await quotesApi.getPdf(quote.id, true);
        if (result.pdfUrl) {
          window.open(result.pdfUrl, '_blank');
          setLeadQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, pdfUrl: result.pdfUrl } : q));
        }
      }
    } catch {
      // silent
    } finally {
      setLeadQuotePdfLoading(null);
    }
  };

  const handleEditLeadQuote = async (quote: Quote) => {
    setLeadQuoteError('');
    setLeadQuoteSuccess('');
    try {
      const full = await quotesApi.getById(quote.id);
      const q: Quote = full?.data ?? full;
      setEditingLeadQuoteId(q.id);
      setLeadQuoteCustomerName(q.customerName || '');
      setLeadQuoteValidUntil(q.validUntil ? q.validUntil.split('T')[0] : '');
      setLeadQuoteTaxRate(q.taxRate ?? 18);
      setLeadQuoteDiscountAmount(q.discountAmount ?? 0);
      setLeadQuoteTerms(q.terms || '');
      setLeadQuoteNotes('');
      setLeadQuoteLineItems(
        q.lineItems && q.lineItems.length > 0
          ? q.lineItems.map(li => ({
              productId: li.productId || '',
              description: li.description || '',
              quantity: li.quantity,
              unitPrice: li.unitPrice,
            }))
          : [{ ...emptyLeadLineItem }]
      );
      setLeadQuoteOpen(true);
    } catch {
      setLeadQuoteError('Failed to load quote for editing');
    }
  };

  const handleLeadInlineLineItemChange = (index: number, field: keyof LeadInlineLineItem, value: string | number) => {
    setLeadQuoteLineItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'productId' && value) {
        const product = products.find(p => p.id === value);
        if (product && product.basePrice) {
          updated[index].unitPrice = product.basePrice;
          if (!updated[index].description) updated[index].description = product.name || '';
        }
      }
      return updated;
    });
  };

  const handleLeadQuoteSubmit = async () => {
    if (!detailLead) return;
    if (!leadQuoteCustomerName.trim()) {
      setLeadQuoteError('Account name is required');
      return;
    }
    const validItems = leadQuoteLineItems.filter(li => li.productId || (li.description && li.quantity > 0 && li.unitPrice > 0));
    if (validItems.length === 0) {
      setLeadQuoteError('Add at least one line item with product or description, quantity, and price');
      return;
    }

    setLeadQuoteSaving(true);
    setLeadQuoteError('');
    try {
      const lineItems = validItems.map((li, idx) => ({
        productId: li.productId || null,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        lineTotal: li.quantity * li.unitPrice,
        sortOrder: idx,
      }));
      const subtotal = lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
      const taxable = subtotal - leadQuoteDiscountAmount;
      const taxAmount = taxable > 0 ? taxable * (leadQuoteTaxRate / 100) : 0;

      const payload = {
        customerName: leadQuoteCustomerName,
        leadId: detailLead.id,
        validUntil: leadQuoteValidUntil || null,
        taxRate: leadQuoteTaxRate,
        discountAmount: leadQuoteDiscountAmount,
        subtotal,
        taxAmount,
        totalAmount: taxable + taxAmount,
        terms: leadQuoteTerms,
        lineItems,
      };

      if (editingLeadQuoteId) {
        await quotesApi.update(editingLeadQuoteId, payload);
        setLeadQuoteSuccess('Quote updated successfully!');
      } else {
        const created = await quotesApi.create({ ...payload, status: 'draft' });
        setLeadQuoteSuccess('Quote created successfully!');
        if (created) setLeadQuotes(prev => [created, ...prev]);
      }

      setTimeout(() => setLeadQuoteSuccess(''), 4000);
      setEditingLeadQuoteId(null);
      setLeadQuoteLineItems([{ ...emptyLeadLineItem }]);
      setLeadQuoteDiscountAmount(0);
      setLeadQuoteValidUntil('');
      setLeadQuoteTerms('');
      setLeadQuoteOpen(false);
      await fetchLeadQuotes(detailLead.id);
    } catch (err: any) {
      setLeadQuoteError(err.message || (editingLeadQuoteId ? 'Failed to update quote' : 'Failed to create quote'));
    } finally {
      setLeadQuoteSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Convert handlers
  // ---------------------------------------------------------------------------

  const openConvertModal = (lead: Lead) => {
    setConvertLeadId(lead.id);
    setConvertForm({
      ...EMPTY_CONVERT_FORM,
      customerName: lead.companyName || '',
      amount: lead.estimatedValue || 0,
    });
    setConvertError('');
    setShowConvertModal(true);
  };

  const closeConvertModal = () => {
    setShowConvertModal(false);
    setConvertLeadId(null);
    setConvertError('');
  };

  const handleConvertFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setConvertForm(prev => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) || 0 : value,
    }));
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertLeadId) return;
    setConvertError('');

    if (!convertForm.partnerId) {
      setConvertError('Please select an account');
      return;
    }
    if (!convertForm.productId) {
      setConvertError('Please select a product');
      return;
    }
    if (convertForm.amount <= 0) {
      setConvertError('Amount must be greater than 0');
      return;
    }
    if (!convertForm.saleDate) {
      setConvertError('Please enter the sale date');
      return;
    }

    setIsConverting(true);
    try {
      await leadsApi.convert(convertLeadId, convertForm);
      closeConvertModal();
      handleSaveSuccess();
    } catch (err: any) {
      setConvertError(err.message || 'Failed to convert lead');
    } finally {
      setIsConverting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Closed Won handlers
  // ---------------------------------------------------------------------------

  const openClosedWonModal = (lead: Lead, source: 'detail' | 'pipeline') => {
    setClosedWonLeadRef({ lead, source });
    setClosedWonForm({
      accountName: lead.companyName || '',
      industry: '',
      type: 'Hunting',
      phone: lead.phone || '',
      email: lead.email || '',
      location: '',
      contactFirstName: lead.contactPerson?.split(' ')[0] || '',
      contactLastName: lead.contactPerson?.split(' ').slice(1).join(' ') || '',
      contactEmail: lead.email || '',
      contactPhone: lead.phone || '',
      contactDesignation: lead.designation || '',
      contactDepartment: '',
    });
    setGstFile(null);
    setMsmeFile(null);
    setPanFile(null);
    setAadharFile(null);
    setClosedWonOrderForm({
      quantity: 1, amount: lead.estimatedValue || 0, poNumber: '', invoiceNo: '',
      paymentStatus: 'pending', saleDate: new Date().toISOString().split('T')[0],
      partnerId: '',
      contactName: lead.contactPerson || '', contactNo: lead.phone || '', email: lead.email || '',
      gstin: '', panNo: '',
      dispatchMethod: '', paymentTerms: '', orderType: 'New',
      serialNumber: '', boq: '', price: 0,
    });
    setClosedWonDescription(lead.description || '');
    setSelectedProductIds([]);
    setProductSearch('');
    setProductDropdownOpen(false);
    setClosedWonError('');
    setShowClosedWonModal(true);
  };

  const handleClosedWonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closedWonLeadRef) return;
    const { lead } = closedWonLeadRef;

    if (!closedWonForm.accountName.trim()) {
      setClosedWonError('Account name is required');
      return;
    }
    if (!closedWonForm.contactFirstName.trim()) {
      setClosedWonError('Contact first name is required');
      return;
    }
    if (!gstFile) {
      setClosedWonError('GST Certificate is mandatory');
      return;
    }
    if (!panFile) {
      setClosedWonError('PAN Card is mandatory');
      return;
    }
    if (!aadharFile) {
      setClosedWonError('Aadhar Card is mandatory');
      return;
    }
    if (selectedProductIds.length === 0) {
      setClosedWonError('Please select at least one product');
      return;
    }
    if (closedWonOrderForm.amount <= 0) {
      setClosedWonError('Amount must be greater than 0');
      return;
    }
    if (!closedWonOrderForm.saleDate) {
      setClosedWonError('Sale date is required');
      return;
    }

    setIsClosedWonSubmitting(true);
    setClosedWonError('');
    try {
      // 1. Upload documents
      let gstResult, panResult, aadharResult;
      try {
        [gstResult, panResult, aadharResult] = await Promise.all([
          uploadsApi.upload(gstFile),
          uploadsApi.upload(panFile),
          uploadsApi.upload(aadharFile),
        ]);
      } catch (e: any) {
        throw new Error(`Upload failed: ${e.message}`);
      }
      let msmeUrl: string | undefined;
      if (msmeFile) {
        const msmeResult = await uploadsApi.upload(msmeFile);
        msmeUrl = msmeResult.url;
      }

      // 2. Create account
      let account;
      try {
        const accountRes = await accountsApi.create({
          name: closedWonForm.accountName,
          industry: closedWonForm.industry || undefined,
          type: closedWonForm.type || undefined,
          phone: closedWonForm.phone || undefined,
          email: closedWonForm.email || undefined,
          location: closedWonForm.location || undefined,
          status: 'active',
          ownerId: user?.id,
        });
        account = accountRes?.data ?? accountRes;
      } catch (e: any) {
        throw new Error(`Account creation failed: ${e.message}`);
      }

      // 3. Create contact with document URLs
      try {
        await contactsApi.create({
          firstName: closedWonForm.contactFirstName,
          lastName: closedWonForm.contactLastName || undefined,
          email: closedWonForm.contactEmail || undefined,
          phone: closedWonForm.contactPhone || undefined,
          designation: closedWonForm.contactDesignation || undefined,
          department: closedWonForm.contactDepartment || undefined,
          accountId: account.id,
          status: 'active',
          ownerId: user?.id,
          gstCertificateUrl: gstResult.url,
          panCardUrl: panResult.url,
          aadharCardUrl: aadharResult.url,
          msmeCertificateUrl: msmeUrl,
        });
      } catch (e: any) {
        throw new Error(`Contact creation failed: ${e.message}`);
      }

      // 4. Create a deal in "Closed Won" stage
      let deal;
      try {
        const dealRes = await dealsApi.create({
          title: lead.companyName || closedWonForm.accountName,
          company: lead.companyName || closedWonForm.accountName,
          accountId: account.id,
          value: closedWonOrderForm.amount || lead.estimatedValue || 0,
          stage: 'Closed Won',
          description: closedWonDescription || lead.description || '',
          leadSource: lead.source || '',
          ownerId: user?.id,
          typeOfOrder: lead.typeOfOrder || undefined,
          lineItems: [],
        });
        deal = dealRes?.data ?? dealRes;
      } catch (e: any) {
        throw new Error(`Deal creation failed: ${e.message}`);
      }

      // 5. Create sales entry
      try {
        await salesApi.create({
          partnerId: closedWonOrderForm.partnerId || undefined,
          salespersonId: user?.id,
          customerName: closedWonForm.accountName || undefined,
          quantity: closedWonOrderForm.quantity,
          amount: closedWonOrderForm.amount,
          poNumber: closedWonOrderForm.poNumber || undefined,
          invoiceNo: closedWonOrderForm.invoiceNo || undefined,
          paymentStatus: closedWonOrderForm.paymentStatus,
          saleDate: closedWonOrderForm.saleDate,
          description: closedWonDescription || undefined,
          dealId: deal?.id || undefined,
          productIds: selectedProductIds,
          contactName: closedWonOrderForm.contactName || undefined,
          contactNo: closedWonOrderForm.contactNo || undefined,
          email: closedWonOrderForm.email || undefined,
          gstin: closedWonOrderForm.gstin || undefined,
          panNo: closedWonOrderForm.panNo || undefined,
          dispatchMethod: closedWonOrderForm.dispatchMethod || undefined,
          paymentTerms: closedWonOrderForm.paymentTerms || undefined,
          orderType: closedWonOrderForm.orderType || undefined,
          serialNumber: closedWonOrderForm.serialNumber || undefined,
          boq: closedWonOrderForm.boq || undefined,
          price: closedWonOrderForm.price || undefined,
        });
      } catch (e: any) {
        throw new Error(`Sales entry creation failed: ${e.message}`);
      }

      // 6. Delete the lead so it no longer appears in leads
      try {
        await leadsApi.delete(lead.id);
      } catch (e: any) {
        console.warn('Lead delete failed (non-blocking):', e.message);
      }

      setShowClosedWonModal(false);
      setClosedWonLeadRef(null);

      // Navigate to Deals page
      navNavigate('deals');
    } catch (err: any) {
      setClosedWonError(err.message || 'Failed to create account');
    } finally {
      setIsClosedWonSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------

  const handleDelete = async (leadId: string) => {
    try {
      await leadsApi.delete(leadId);
      setDeleteConfirmId(null);
      navigate('/leads');
    } catch (err: any) {
      console.error('Failed to delete lead', err);
    }
  };

  const canConvert = (stage: LeadStage) => {
    return stage === 'Proposal' || stage === 'Negotiation';
  };

  // ---------------------------------------------------------------------------
  // Render: Collapsible Section
  // ---------------------------------------------------------------------------

  const renderCollapsibleSection = (
    key: string,
    icon: React.ReactNode,
    title: string,
    expanded: boolean,
    children: React.ReactNode
  ) => (
    <div className="border rounded-lg border-gray-200 dark:border-zinc-700">
      <button
        type="button"
        onClick={() => toggleSection(key)}
        className="w-full p-4 flex justify-between items-center transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/50"
      >
        <div className="flex items-center gap-2">
          <span className="text-brand-600 dark:text-brand-400">{icon}</span>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-200">{title}</h3>
        </div>
        <ChevronDown className={cx(
          'w-4 h-4 transition-transform text-gray-400 dark:text-zinc-400',
          expanded && 'rotate-180'
        )} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Create/Edit Form
  // ---------------------------------------------------------------------------

  const renderForm = () => (
    <form id="lead-form" onSubmit={handleLeadSubmit} className="space-y-4">
      {leadFormError && (
        <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
          {leadFormError}
        </Alert>
      )}

      {/* Lead Information Section */}
      {renderCollapsibleSection('leadInfo', <UserIcon className="w-4 h-4" />, 'Lead Information', expandedSections.leadInfo, (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Name *"
              name="companyName"
              placeholder="Enter company name"
              value={leadFormData.companyName}
              onChange={handleLeadFormChange}
              icon={<Building2 className="w-4 h-4" />}
              required
            />
            <Input
              label="Contact Person"
              name="contactPerson"
              placeholder="Contact person name"
              value={leadFormData.contactPerson}
              onChange={handleLeadFormChange}
              icon={<UserIcon className="w-4 h-4" />}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name" name="firstName" placeholder="First name" value={leadFormData.firstName} onChange={handleLeadFormChange} />
            <Input label="Last Name" name="lastName" placeholder="Last name" value={leadFormData.lastName} onChange={handleLeadFormChange} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email" name="email" type="email" placeholder="contact@company.com" value={leadFormData.email} onChange={handleLeadFormChange} icon={<Mail className="w-4 h-4" />} />
            <Input label="Phone" name="phone" placeholder="+91 XXXXX XXXXX" value={leadFormData.phone} onChange={handleLeadFormChange} icon={<Phone className="w-4 h-4" />} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone Alternate" name="phoneAlternate" placeholder="Alternate phone" value={leadFormData.phoneAlternate} onChange={handleLeadFormChange} />
            <Input label="Campaign Source" name="campaignSource" placeholder="Campaign source" value={leadFormData.campaignSource} onChange={handleLeadFormChange} />
          </div>
          <Input label="Website" name="website" type="url" placeholder="https://company.com" value={leadFormData.website} onChange={handleLeadFormChange} />
        </>
      ))}

      {/* Order Info Section */}
      {renderCollapsibleSection('orderInfo', <FileText className="w-4 h-4" />, 'Order Information', expandedSections.orderInfo, (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Product List" name="productList" placeholder="Product list" value={leadFormData.productList} onChange={handleLeadFormChange} />
            <Select label="Type of Order" name="typeOfOrder" value={leadFormData.typeOfOrder} onChange={handleLeadFormChange}>
              <option value="">Select order type</option>
              <option value="New">New</option>
              <option value="Refurb">Refurb</option>
              <option value="Rental">Rental</option>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Billing Delivery Date" name="billingDeliveryDate" type="date" value={leadFormData.billingDeliveryDate} onChange={handleLeadFormChange} />
            <Input label="Payment" name="payment" placeholder="Payment details" value={leadFormData.payment} onChange={handleLeadFormChange} />
          </div>
          <Textarea label="Order Product Details" name="orderProductDetails" rows={3} placeholder="Order product details..." value={leadFormData.orderProductDetails} onChange={handleLeadFormChange} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="PO Number / Mail Confirmation" name="poNumberOrMailConfirmation" placeholder="PO number" value={leadFormData.poNumberOrMailConfirmation} onChange={handleLeadFormChange} />
            <Input label="Brand" name="brand" placeholder="Brand" value={leadFormData.brand} onChange={handleLeadFormChange} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="ORC Amount (INR)" name="orcAmount" type="number" min={0} step={1} placeholder="0" value={leadFormData.orcAmount || ''} onChange={handleLeadFormChange} icon={<IndianRupee className="w-4 h-4" />} />
            <Input label="Product Warranty" name="productWarranty" placeholder="Warranty" value={leadFormData.productWarranty} onChange={handleLeadFormChange} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Ship By" name="shipBy" placeholder="Shipping method" value={leadFormData.shipBy} onChange={handleLeadFormChange} />
            <Input label="Billing Company" name="billingCompany" placeholder="Billing company" value={leadFormData.billingCompany} onChange={handleLeadFormChange} />
          </div>
          <Textarea label="Special Instructions" name="specialInstruction" rows={2} placeholder="Special instructions..." value={leadFormData.specialInstruction} onChange={handleLeadFormChange} />
          <Textarea label="3rd Party Delivery Address" name="thirdPartyDeliveryAddress" rows={2} placeholder="Delivery address..." value={leadFormData.thirdPartyDeliveryAddress} onChange={handleLeadFormChange} />
        </>
      ))}

      {/* Forms Info Section */}
      {renderCollapsibleSection('formsInfo', <FileText className="w-4 h-4" />, 'Forms Info', expandedSections.formsInfo, (
        <>
          <Textarea label="Enter Product Details" name="enterProductDetails" rows={3} placeholder="Product details..." value={leadFormData.enterProductDetails} onChange={handleLeadFormChange} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Rental Duration" name="rentalDuration" placeholder="e.g., 12 months" value={leadFormData.rentalDuration} onChange={handleLeadFormChange} />
            <Input label="Bandwidth Required" name="bandwidthRequired" placeholder="Bandwidth" value={leadFormData.bandwidthRequired} onChange={handleLeadFormChange} />
          </div>
          <Textarea label="Product Configuration" name="productConfiguration" rows={3} placeholder="Configuration details..." value={leadFormData.productConfiguration} onChange={handleLeadFormChange} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Product Name & Part Number" name="productNameAndPartNumber" placeholder="Product & part number" value={leadFormData.productNameAndPartNumber} onChange={handleLeadFormChange} />
            <Input label="Form Name" name="formName" placeholder="Form name" value={leadFormData.formName} onChange={handleLeadFormChange} />
          </div>
          <Textarea label="Specifications" name="specifications" rows={3} placeholder="Specifications..." value={leadFormData.specifications} onChange={handleLeadFormChange} />
        </>
      ))}

      {/* Billing Address Section */}
      {renderCollapsibleSection('billingAddress', <Building2 className="w-4 h-4" />, 'Billing Address', expandedSections.billingAddress, (
        <>
          <Input label="Street" name="billingStreet" placeholder="Street address" value={leadFormData.billingStreet} onChange={handleLeadFormChange} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="City" name="billingCity" placeholder="City" value={leadFormData.billingCity} onChange={handleLeadFormChange} />
            <Input label="State" name="billingState" placeholder="State" value={leadFormData.billingState} onChange={handleLeadFormChange} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Country" name="billingCountry" placeholder="Country" value={leadFormData.billingCountry} onChange={handleLeadFormChange} />
            <Input label="Zip Code" name="billingZipCode" placeholder="Zip code" value={leadFormData.billingZipCode} onChange={handleLeadFormChange} />
          </div>
        </>
      ))}

      {/* Description Info Section */}
      {renderCollapsibleSection('descriptionInfo', <StickyNote className="w-4 h-4" />, 'Description Info', expandedSections.descriptionInfo, (
        <>
          <div>
            <label className={labelStyles}>Description</label>
            <RichTextEditor
              value={leadFormData.description}
              onChange={(html) => setLeadFormData(prev => ({ ...prev, description: html }))}
              placeholder="Description..."
              minHeight="80px"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Lead Time" name="leadTime" placeholder="Lead time" value={leadFormData.leadTime} onChange={handleLeadFormChange} />
            <Input label="Product Name" name="productName" placeholder="Product name" value={leadFormData.productName} onChange={handleLeadFormChange} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Receiver Mobile Number" name="receiverMobileNumber" placeholder="Receiver mobile" value={leadFormData.receiverMobileNumber} onChange={handleLeadFormChange} />
            <Input label="Call Duration" name="callDuration" placeholder="Call duration" value={leadFormData.callDuration} onChange={handleLeadFormChange} />
          </div>
          <Input label="Subject" name="subject" placeholder="Subject" value={leadFormData.subject} onChange={handleLeadFormChange} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Sender Landline No" name="senderLandlineNo" placeholder="Landline" value={leadFormData.senderLandlineNo} onChange={handleLeadFormChange} />
            <Input label="Sender Landline No (Alt)" name="senderLandlineNoAlt" placeholder="Alt landline" value={leadFormData.senderLandlineNoAlt} onChange={handleLeadFormChange} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Lead Type" name="leadType" placeholder="Lead type" value={leadFormData.leadType} onChange={handleLeadFormChange} />
            <Input label="Query ID" name="queryId" placeholder="Query ID" value={leadFormData.queryId} onChange={handleLeadFormChange} />
            <Input label="MCAT Name" name="mcatName" placeholder="MCAT name" value={leadFormData.mcatName} onChange={handleLeadFormChange} />
          </div>
        </>
      ))}

      {/* Requirements Section */}
      {renderCollapsibleSection('requirements', <FileText className="w-4 h-4" />, 'Requirements', expandedSections.requirements, (
        <>
          <Textarea label="Requirement (User Provided)" name="requirement" rows={3} placeholder="What the user/lead requires..." value={leadFormData.requirement} onChange={handleLeadFormChange} />
          <Textarea label="Quoted Requirement (What We Serve)" name="quotedRequirement" rows={3} placeholder="What we are offering/serving..." value={leadFormData.quotedRequirement} onChange={handleLeadFormChange} />
        </>
      ))}

      {/* Lead Classification Section */}
      {renderCollapsibleSection('classification', <Tags className="w-4 h-4" />, 'Lead Classification', expandedSections.classification, (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Source" name="source" value={leadFormData.source} onChange={handleLeadFormChange}>
              <option value="">Select Source</option>
              {SOURCES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
            <Select label="Stage" name="stage" value={leadFormData.stage} onChange={handleLeadFormChange}>
              {LEAD_STAGES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <Select label="Priority" name="priority" value={leadFormData.priority} onChange={handleLeadFormChange}>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelStyles}>Assigned To</label>
              <div className="relative">
                <select name="assignedTo" value={leadFormData.assignedTo} onChange={handleLeadFormChange} className={cx(inputStyles, 'appearance-none cursor-pointer pl-10')}>
                  <option value="">Auto-assign (Me)</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
              </div>
            </div>
            <Select label="Account" name="partnerId" value={leadFormData.partnerId} onChange={handleLeadFormChange}>
              <option value="">Select Account (Optional)</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.companyName}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Type" name="tag" value={leadFormData.tag} onChange={handleLeadFormChange}>
              <option value="">Select Type</option>
              <option value="Channel">Channel</option>
              <option value="End Customer">End Customer</option>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Designation" name="designation" placeholder="e.g. Manager, Director" value={(leadFormData as any).designation || ''} onChange={handleLeadFormChange} />
            <Input label="Location" name="location" placeholder="e.g. Mumbai, Delhi" value={(leadFormData as any).location || ''} onChange={handleLeadFormChange} />
          </div>
        </>
      ))}

      {/* Notes */}
      <Textarea label="Notes" name="notes" rows={3} placeholder="Additional notes about this lead..." value={leadFormData.notes} onChange={handleLeadFormChange} />

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-700">
        <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>Cancel</Button>
        <Button
          variant="primary"
          shine
          loading={isSubmitting}
          icon={!isSubmitting ? <CheckCircle className="w-4 h-4" /> : undefined}
          onClick={() => {
            const form = document.getElementById('lead-form') as HTMLFormElement;
            form?.requestSubmit();
          }}
        >
          {isSubmitting ? 'Saving...' : editingLeadId ? 'Update Lead' : 'Create Lead'}
        </Button>
      </div>
    </form>
  );

  // ---------------------------------------------------------------------------
  // Render: Detail/View
  // ---------------------------------------------------------------------------

  const renderDetail = () => {
    if (!detailLead) return null;
    const lead = detailLead;

    return (
      <div className="space-y-6">
        {/* Custom header content - stage selector + actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium whitespace-nowrap text-gray-500 dark:text-zinc-400">Stage:</label>
            <select
              value={lead.stage}
              onChange={e => handleUpdateStage(e.target.value as LeadStage)}
              disabled={isUpdatingStage}
              className={cx(inputStyles, 'px-2 py-1 text-xs font-medium w-auto')}
            >
              {LEAD_STAGES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {isUpdatingStage && <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />}
          </div>
          <Badge variant={PRIORITY_BADGE_VARIANT[lead.priority] || 'green'}>{lead.priority}</Badge>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate('/leads/edit/' + lead.id)}
              icon={<Edit2 className="w-4 h-4" />}
              title="Edit"
            />
            {deleteConfirmId === lead.id ? (
              <div className="flex items-center gap-1">
                <Button variant="danger" size="xs" onClick={() => handleDelete(lead.id)}>Confirm</Button>
                <Button variant="ghost" size="xs" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setDeleteConfirmId(lead.id)}
                icon={<Trash2 className="w-4 h-4" />}
                className="hover:text-red-600 dark:hover:text-red-400"
                title="Delete"
              />
            )}
          </div>
        </div>

        {/* Lead info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow label="Contact Person" value={lead.contactPerson} icon={<UserIcon className="w-3.5 h-3.5" />} />
          <InfoRow label="Email" value={lead.email} icon={<Mail className="w-3.5 h-3.5" />} />
          <InfoRow label="Phone" value={lead.phone} icon={<Phone className="w-3.5 h-3.5" />} />
          <InfoRow label="Source" value={lead.source} icon={<BarChart3 className="w-3.5 h-3.5" />} capitalize />
          <InfoRow label="Product Interest" value={lead.productInterest} icon={<Target className="w-3.5 h-3.5" />} />
          <InfoRow label="Type" value={(lead as any).tag} icon={<Tags className="w-3.5 h-3.5" />} />
        </div>

        {/* Requirements */}
        {(lead.requirement || lead.quotedRequirement) && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Requirements
            </h4>
            {lead.requirement && (
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">Requirement (User Provided)</span>
                <p className="text-sm whitespace-pre-wrap mt-1 text-gray-700 dark:text-zinc-300">
                  {lead.requirement}
                </p>
              </div>
            )}
            {lead.quotedRequirement && (
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">Quoted Requirement (What We Serve)</span>
                <p className="text-sm whitespace-pre-wrap mt-1 text-gray-700 dark:text-zinc-300">
                  {lead.quotedRequirement}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {lead.notes && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400 dark:text-zinc-500">
              Notes
            </h4>
            <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-zinc-300">
              {lead.notes}
            </p>
          </div>
        )}

        {/* Lost reason */}
        {lead.stage === 'Closed Lost' && lead.lostReason && (
          <Alert variant="error" title="Lost Reason">
            {lead.lostReason}
          </Alert>
        )}

        {/* Won reference */}
        {lead.stage === 'Closed Won' && lead.wonSaleId && (
          <Alert variant="success" title="Converted to Sale">
            Sale ID: {lead.wonSaleId}
          </Alert>
        )}

        {/* Quote Builder */}
        <div>
          {/* Existing Quotes */}
          {(leadQuotesLoading || leadQuotes.length > 0) && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 text-gray-400 dark:text-zinc-500">
                <FileText className="w-3.5 h-3.5" /> Quotes
              </h4>
              {leadQuotesLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-500 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading quotes...
                </div>
              ) : (
                <div className="space-y-2">
                  {leadQuotes.map(q => (
                    <div key={q.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 bg-white dark:border-zinc-700 dark:bg-dark-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                            {q.quoteNumber || q.id.slice(0, 8)}
                          </span>
                          <span className={cx('text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                            q.status === 'draft' ? 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400' :
                            q.status === 'sent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            q.status === 'accepted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          )}>
                            {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-zinc-500 mt-0.5">
                          {q.customerName} · {formatINR(q.totalAmount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleEditLeadQuote(q)}
                          className="p-1.5 rounded-lg transition-colors text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
                          title="Edit Quote"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleLeadQuotePdf(q)}
                          disabled={leadQuotePdfLoading === q.id}
                          className="p-1.5 rounded-lg transition-colors text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 disabled:opacity-50"
                          title="Download PDF"
                        >
                          {leadQuotePdfLoading === q.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Download className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create / Edit Quote toggle */}
          <button
            onClick={() => {
              if (leadQuoteOpen && editingLeadQuoteId) {
                setLeadQuoteOpen(false);
                setEditingLeadQuoteId(null);
                setLeadQuoteLineItems([{ ...emptyLeadLineItem }]);
                setLeadQuoteCustomerName(detailLead?.companyName || detailLead?.contactPerson || '');
                setLeadQuoteValidUntil('');
                setLeadQuoteTaxRate(18);
                setLeadQuoteDiscountAmount(0);
                setLeadQuoteTerms('');
              } else {
                setLeadQuoteOpen(prev => !prev);
                if (!leadQuoteOpen) setEditingLeadQuoteId(null);
              }
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl border transition-all border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/10 dark:hover:bg-indigo-900/20 dark:text-indigo-400"
          >
            <div className="flex items-center gap-2">
              {editingLeadQuoteId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span className="text-sm font-semibold">{editingLeadQuoteId ? 'Edit Quote' : 'Create Quote'}</span>
            </div>
            <ChevronDown className={cx('w-4 h-4 transition-transform', leadQuoteOpen && 'rotate-180')} />
          </button>

          {leadQuoteOpen && (
            <div className="mt-3 p-4 rounded-xl border space-y-4 border-gray-200 bg-gray-50 dark:border-zinc-800 dark:bg-dark-100">
              {leadQuoteError && (
                <Alert variant="error" icon={<AlertCircle className="w-3.5 h-3.5" />}>
                  {leadQuoteError}
                </Alert>
              )}
              {leadQuoteSuccess && (
                <Alert variant="success" icon={<CheckCircle className="w-3.5 h-3.5" />}>
                  {leadQuoteSuccess}
                </Alert>
              )}

              {/* Quote Header */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium text-gray-500 dark:text-zinc-400">Account Name *</label>
                  <Input
                    type="text"
                    placeholder="Account name..."
                    value={leadQuoteCustomerName}
                    onChange={e => setLeadQuoteCustomerName(e.target.value)}
                    className="!text-xs !py-1.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-500 dark:text-zinc-400">Valid Until</label>
                  <Input
                    type="date"
                    value={leadQuoteValidUntil}
                    onChange={e => setLeadQuoteValidUntil(e.target.value)}
                    className="!text-xs !py-1.5"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  Line Items
                </h5>
                {leadQuoteLineItems.map((li, idx) => (
                  <div key={idx} className="p-3 rounded-lg border space-y-2 border-gray-200 bg-white dark:border-zinc-700 dark:bg-dark-50">
                    <div className="flex items-center justify-between gap-2">
                      <Select
                        value={li.productId}
                        onChange={e => handleLeadInlineLineItemChange(idx, 'productId', e.target.value)}
                        className="flex-1 !text-xs !py-1.5"
                      >
                        <option value="">Select product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </Select>
                      {leadQuoteLineItems.length > 1 && (
                        <button
                          onClick={() => setLeadQuoteLineItems(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1 rounded-lg transition-colors text-gray-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 dark:text-zinc-500">Description</label>
                      <RichTextEditor
                        value={li.description}
                        onChange={val => handleLeadInlineLineItemChange(idx, 'description', val)}
                        placeholder="Description -- supports paste from Word/Excel..."
                        minHeight="50px"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-400 dark:text-zinc-500">Qty</label>
                        <Input
                          type="number"
                          min={1}
                          value={li.quantity}
                          onChange={e => handleLeadInlineLineItemChange(idx, 'quantity', Number(e.target.value) || 0)}
                          className="!text-xs !py-1.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 dark:text-zinc-500">Unit Price (₹)</label>
                        <Input
                          type="number"
                          min={0}
                          value={li.unitPrice}
                          onChange={e => handleLeadInlineLineItemChange(idx, 'unitPrice', Number(e.target.value) || 0)}
                          className="!text-xs !py-1.5"
                        />
                      </div>
                    </div>
                    <div className="text-right text-xs font-medium text-gray-700 dark:text-zinc-300">
                      Line Total: {formatINR(li.quantity * li.unitPrice)}
                    </div>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => setLeadQuoteLineItems(prev => [...prev, { ...emptyLeadLineItem }])}
                  icon={<Plus className="w-3 h-3" />}
                >
                  Add Item
                </Button>
              </div>

              {/* Tax, Discount & Totals */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 dark:text-zinc-400">Tax Rate %</label>
                    <Input
                      type="number"
                      min={0}
                      value={leadQuoteTaxRate}
                      onChange={e => setLeadQuoteTaxRate(Number(e.target.value) || 0)}
                      className="!text-xs !py-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 dark:text-zinc-400">Discount (₹)</label>
                    <Input
                      type="number"
                      min={0}
                      value={leadQuoteDiscountAmount}
                      onChange={e => setLeadQuoteDiscountAmount(Number(e.target.value) || 0)}
                      className="!text-xs !py-1.5"
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-end text-right text-xs space-y-1 text-gray-700 dark:text-zinc-300 pb-1">
                  {(() => {
                    const subtotal = leadQuoteLineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
                    const taxable = subtotal - leadQuoteDiscountAmount;
                    const tax = taxable > 0 ? taxable * (leadQuoteTaxRate / 100) : 0;
                    return (
                      <>
                        <span>Subtotal: {formatINR(subtotal)}</span>
                        {leadQuoteDiscountAmount > 0 && <span className="text-emerald-600 dark:text-emerald-400">Discount: -{formatINR(leadQuoteDiscountAmount)}</span>}
                        <span>Tax ({leadQuoteTaxRate}%): {formatINR(tax)}</span>
                        <span className="font-bold text-sm border-t pt-1 border-gray-200 dark:border-zinc-700">Total: {formatINR(taxable + tax)}</span>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium text-gray-500 dark:text-zinc-400">Terms & Conditions</label>
                <Textarea
                  rows={2}
                  placeholder="Terms..."
                  value={leadQuoteTerms}
                  onChange={e => setLeadQuoteTerms(e.target.value)}
                  className="!text-xs !py-1.5"
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleLeadQuoteSubmit}
                loading={leadQuoteSaving}
                icon={<FileText className="w-3.5 h-3.5" />}
                className="w-full"
                size="sm"
              >
                {leadQuoteSaving
                  ? (editingLeadQuoteId ? 'Saving...' : 'Creating...')
                  : (editingLeadQuoteId ? 'Save Changes & Regenerate PDF' : 'Create Quote & Generate PDF')
                }
              </Button>
            </div>
          )}
        </div>

        {/* Add Activity */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5 text-gray-400 dark:text-zinc-500">
            <MessageSquare className="w-3.5 h-3.5" /> Add Activity
          </h4>
          <div className="p-3 rounded-xl border space-y-2 border-gray-100 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex gap-2">
              <select
                value={activityType}
                onChange={e => setActivityType(e.target.value)}
                className={cx(inputStyles, 'text-xs px-2 py-1.5 w-auto')}
              >
                <option value="note">Note</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
                <option value="follow_up">Follow-up</option>
                <option value="task">Task</option>
              </select>
              <input
                type="text"
                placeholder="Activity title..."
                value={activityTitle}
                onChange={e => setActivityTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddLeadActivity()}
                className={cx(inputStyles, 'flex-1 text-xs px-2 py-1.5')}
              />
            </div>
            <textarea
              rows={2}
              placeholder="Description (optional)..."
              value={activityDesc}
              onChange={e => setActivityDesc(e.target.value)}
              className={cx(inputStyles, 'w-full text-xs px-2 py-1.5 resize-none')}
            />
            <Button
              variant="primary"
              size="xs"
              onClick={handleAddLeadActivity}
              disabled={!activityTitle.trim() || isAddingActivity}
              loading={isAddingActivity}
              icon={!isAddingActivity ? <Send className="w-3 h-3" /> : undefined}
            >
              {isAddingActivity ? 'Adding...' : 'Add Activity'}
            </Button>
          </div>
        </div>

        {/* Activities */}
        {activities.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 text-gray-400 dark:text-zinc-500">
              Activities
            </h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {activities.map((act: any) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl border text-xs border-gray-100 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700 dark:text-zinc-300">
                      {act.title}
                    </span>
                    <Badge variant="gray" size="sm">{act.activityType || act.activity_type}</Badge>
                  </div>
                  {act.description && (
                    <p className="text-gray-400 dark:text-zinc-500">{act.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-1 text-gray-400 dark:text-zinc-600">
                    {act.createdByName && <span>by {act.createdByName}</span>}
                    {act.createdAt && <span>{new Date(act.createdAt).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Trail */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 text-gray-400 dark:text-zinc-500">
            Audit Trail
          </h4>
          {isAuditLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-sm py-4 text-center text-gray-400 dark:text-zinc-600">
              No audit history
            </p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {auditLogs.map(log => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border text-xs border-gray-100 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700 dark:text-zinc-300">
                      {log.action}
                    </span>
                    <span className="text-gray-400 dark:text-zinc-600">
                      {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  {log.userName && (
                    <p className="text-gray-400 dark:text-zinc-500">
                      by {log.userName}
                    </p>
                  )}
                  {log.changes && log.changes.length > 0 && (
                    <div className="mt-1 space-y-0.5 text-gray-400 dark:text-zinc-500">
                      {log.changes.map((c, i) => (
                        <p key={i}>{c.field}: {c.old || '(empty)'} → {c.new || '(empty)'}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="flex items-center gap-4 text-[11px] pt-2 border-t border-gray-100 text-gray-400 dark:border-zinc-800 dark:text-zinc-600">
          {lead.createdAt && <span>Created: {formatDateTime(lead.createdAt)}</span>}
          {lead.updatedAt && <span>Updated: {formatDateTime(lead.updatedAt)}</span>}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Convert to Sale Modal
  // ---------------------------------------------------------------------------

  const renderConvertModal = () => {
    if (!showConvertModal) return null;

    return (
      <Modal
        open={showConvertModal}
        onClose={closeConvertModal}
        title="Convert to Sale"
        icon={<Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={closeConvertModal} disabled={isConverting}>Cancel</Button>
            <Button
              variant="success"
              shine
              loading={isConverting}
              icon={!isConverting ? <Award className="w-4 h-4" /> : undefined}
              onClick={() => {
                const form = document.getElementById('convert-form') as HTMLFormElement;
                form?.requestSubmit();
              }}
            >
              {isConverting ? 'Converting...' : 'Convert to Sale'}
            </Button>
          </>
        }
      >
        <form id="convert-form" onSubmit={handleConvertSubmit} className="space-y-5">
          {convertError && (
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {convertError}
            </Alert>
          )}

          <Select label="Account *" name="partnerId" value={convertForm.partnerId} onChange={handleConvertFormChange} required>
            <option value="">Select Account</option>
            {partners.map(p => (
              <option key={p.id} value={p.id}>{p.companyName}</option>
            ))}
          </Select>

          <Select label="Product *" name="productId" value={convertForm.productId} onChange={handleConvertFormChange} required>
            <option value="">Select Product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>

          <Input
            label="Amount (INR) *"
            name="amount"
            type="number"
            min={0}
            step={1}
            placeholder="0"
            value={convertForm.amount || ''}
            onChange={handleConvertFormChange}
            icon={<IndianRupee className="w-4 h-4" />}
            required
          />

          <Input
            label="Sale Date *"
            name="saleDate"
            type="date"
            value={convertForm.saleDate}
            onChange={handleConvertFormChange}
            icon={<Calendar className="w-4 h-4" />}
            required
          />

          <Input
            label="Account Name"
            name="customerName"
            placeholder="Account name"
            value={convertForm.customerName}
            onChange={handleConvertFormChange}
            icon={<UserIcon className="w-4 h-4" />}
          />
        </form>
      </Modal>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Closed Won Modal
  // ---------------------------------------------------------------------------

  const renderClosedWonModal = () => {
    if (!showClosedWonModal || !closedWonLeadRef) return null;
    const { lead } = closedWonLeadRef;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setClosedWonForm(prev => ({ ...prev, [name]: value }));
    };

    const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setClosedWonOrderForm(prev => ({
        ...prev,
        [name]: (name === 'quantity' || name === 'amount' || name === 'price') ? Number(value) || 0 : value,
      }));
    };

    return (
      <Modal
        open={showClosedWonModal}
        onClose={() => setShowClosedWonModal(false)}
        title="Closed Won -- Create Account & Sales Order"
        icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
        size="2xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowClosedWonModal(false)}>Cancel</Button>
            <Button
              variant="success"
              shine
              loading={isClosedWonSubmitting}
              icon={!isClosedWonSubmitting ? <CheckCircle className="w-4 h-4" /> : undefined}
              onClick={() => {
                const form = document.getElementById('closed-won-form') as HTMLFormElement;
                form?.requestSubmit();
              }}
            >
              {isClosedWonSubmitting ? 'Creating...' : 'Create Account & Sales Order'}
            </Button>
          </>
        }
      >
        <form id="closed-won-form" onSubmit={handleClosedWonSubmit} className="space-y-5">
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Lead "<strong>{lead.companyName}</strong>" is being marked as Closed Won. Create an account, contact, and sales order.
          </p>

          {closedWonError && (
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {closedWonError}
            </Alert>
          )}

          {/* Account Details Section */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5 text-gray-900 dark:text-white">
              <Building2 className="w-4 h-4" /> Account Details
            </h3>
            <div className="space-y-3">
              <Input label="Account Name *" name="accountName" value={closedWonForm.accountName} onChange={handleChange} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select label="Industry" name="industry" value={closedWonForm.industry} onChange={handleChange}>
                  <option value="">-None-</option>
                  {['Technology','Healthcare','Finance','Manufacturing','Retail','Education','Real Estate','Telecom','Energy','Media','Other'].map(i => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </Select>
                <Select label="Type" name="type" value={closedWonForm.type} onChange={handleChange}>
                  <option value="">-None-</option>
                  <option value="Hunting">Hunting</option>
                  <option value="Farming">Farming</option>
                  <option value="Cold">Cold</option>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Phone" name="phone" value={closedWonForm.phone} onChange={handleChange} />
                <Input label="Email" name="email" type="email" value={closedWonForm.email} onChange={handleChange} />
              </div>
              <Input label="Location" name="location" value={closedWonForm.location} onChange={handleChange} />
            </div>
          </div>

          {/* Contact Details Section */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5 text-gray-900 dark:text-white">
              <UserIcon className="w-4 h-4" /> Contact Details
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="First Name *" name="contactFirstName" value={closedWonForm.contactFirstName} onChange={handleChange} required />
                <Input label="Last Name" name="contactLastName" value={closedWonForm.contactLastName} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Email" name="contactEmail" type="email" value={closedWonForm.contactEmail} onChange={handleChange} />
                <Input label="Contact No" name="contactPhone" value={closedWonForm.contactPhone} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Designation" name="contactDesignation" value={closedWonForm.contactDesignation} onChange={handleChange} />
                <Input label="Department" name="contactDepartment" value={closedWonForm.contactDepartment} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Document Uploads Section */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5 text-gray-900 dark:text-white">
              <Upload className="w-4 h-4" /> Document Uploads
            </h3>
            <div className="space-y-3">
              <div>
                <label className={labelStyles}>GST Certificate *</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setGstFile(e.target.files?.[0] || null)} className={fileInputStyles} />
                {gstFile && <span className="text-xs mt-1 block text-emerald-600 dark:text-emerald-400">{gstFile.name}</span>}
              </div>
              <div>
                <label className={labelStyles}>MSME Certificate <span className="text-xs text-gray-400 dark:text-zinc-500">(optional)</span></label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setMsmeFile(e.target.files?.[0] || null)} className={fileInputStyles} />
                {msmeFile && <span className="text-xs mt-1 block text-emerald-600 dark:text-emerald-400">{msmeFile.name}</span>}
              </div>
              <div>
                <label className={labelStyles}>PAN Card *</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setPanFile(e.target.files?.[0] || null)} className={fileInputStyles} />
                {panFile && <span className="text-xs mt-1 block text-emerald-600 dark:text-emerald-400">{panFile.name}</span>}
              </div>
              <div>
                <label className={labelStyles}>Aadhar Card *</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setAadharFile(e.target.files?.[0] || null)} className={fileInputStyles} />
                {aadharFile && <span className="text-xs mt-1 block text-emerald-600 dark:text-emerald-400">{aadharFile.name}</span>}
              </div>
            </div>
          </div>

          {/* Sales Order Form */}
          <Card glass={false} padding="md" className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Sales Order Details</h3>

            {/* Product Selection */}
            <div className="relative">
              <label className={labelStyles}>Products <span className="text-red-500">*</span></label>
              <button
                type="button"
                onClick={() => setProductDropdownOpen(prev => !prev)}
                className={cx(
                  inputStyles,
                  'w-full flex items-center justify-between text-left cursor-pointer'
                )}
              >
                <span className={selectedProductIds.length === 0 ? 'text-gray-400 dark:text-zinc-500' : ''}>
                  {selectedProductIds.length === 0
                    ? '-- Select Products --'
                    : `${selectedProductIds.length} product(s) selected`}
                </span>
                <ChevronDown className={cx('w-4 h-4 transition-transform text-gray-400 dark:text-zinc-500', productDropdownOpen && 'rotate-180')} />
              </button>
              {productDropdownOpen && (
                <div className="absolute z-10 left-0 right-0 mt-1 rounded-xl border shadow-lg bg-white border-gray-200 dark:bg-dark-100 dark:border-zinc-700">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      className={cx(inputStyles, 'text-sm')}
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto px-2 pb-2 space-y-1">
                    {products.length === 0 ? (
                      <p className="text-xs px-2 py-3 text-center text-gray-400 dark:text-zinc-500">No products found</p>
                    ) : products.filter(p => p.isActive && p.name.toLowerCase().includes(productSearch.toLowerCase())).map(product => (
                      <label key={product.id} className={cx(
                        'flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors',
                        selectedProductIds.includes(product.id)
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                          : 'hover:bg-gray-100 text-gray-700 dark:hover:bg-zinc-800 dark:text-zinc-300'
                      )}>
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => {
                            setSelectedProductIds(prev =>
                              prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id]
                            );
                          }}
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-sm">{product.name}</span>
                        {product.basePrice ? <span className="text-xs ml-auto text-gray-400 dark:text-zinc-500">{formatINR(product.basePrice)}</span> : null}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="Contact Name" name="contactName" value={closedWonOrderForm.contactName} onChange={handleOrderChange} placeholder="Contact person" />
              <Input label="Contact No" name="contactNo" value={closedWonOrderForm.contactNo} onChange={handleOrderChange} placeholder="+91..." />
              <Input label="Email" name="email" type="email" value={closedWonOrderForm.email} onChange={handleOrderChange} placeholder="email@example.com" />
            </div>

            {/* Company Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="GSTIN" name="gstin" value={closedWonOrderForm.gstin} onChange={handleOrderChange} placeholder="22AAAAA0000A1Z5" />
              <Input label="PAN No" name="panNo" value={closedWonOrderForm.panNo} onChange={handleOrderChange} placeholder="AAAAA0000A" />
            </div>

            {/* Quantity, Price & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="Quantity" name="quantity" type="number" min={1} value={closedWonOrderForm.quantity} onChange={handleOrderChange} />
              <Input label="Price (per unit)" name="price" type="number" min={0} step={0.01} value={closedWonOrderForm.price} onChange={handleOrderChange} />
              <Input label="Amount *" name="amount" type="number" min={0} step={0.01} value={closedWonOrderForm.amount} onChange={handleOrderChange} required />
            </div>

            {/* Dispatch Method & Payment Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Dispatch Method" name="dispatchMethod" value={closedWonOrderForm.dispatchMethod} onChange={handleOrderChange}>
                <option value="">-- Select --</option>
                <option value="Air">Air</option>
                <option value="Road">Road</option>
              </Select>
              <Input label="Payment Terms" name="paymentTerms" value={closedWonOrderForm.paymentTerms} onChange={handleOrderChange} placeholder="e.g. Net 30" />
            </div>

            {/* Sale Date */}
            <Input label="Sale Date *" name="saleDate" type="date" value={closedWonOrderForm.saleDate} onChange={handleOrderChange} required />

            {/* Order Type Toggle */}
            <div>
              <label className={labelStyles}>Order Type</label>
              <div className="flex gap-2">
                {(['New', 'Refurb', 'Rental'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setClosedWonOrderForm(prev => ({ ...prev, orderType: t }))}
                    className={cx(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      closedWonOrderForm.orderType === t
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* BOQ */}
            <Textarea label="BOQ (Bill of Quantities)" name="boq" rows={3} placeholder="Enter BOQ details..." value={closedWonOrderForm.boq} onChange={handleOrderChange} />

            {/* Description */}
            <Textarea label="Description" rows={2} placeholder="Description of the sales order..." value={closedWonDescription} onChange={e => setClosedWonDescription(e.target.value)} />
          </Card>
        </form>
      </Modal>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Summarise Modal
  // ---------------------------------------------------------------------------

  const renderSummariseModal = () => {
    if (!showSummariseModal || !detailLead) return null;
    return (
      <Modal
        open={showSummariseModal}
        onClose={() => setShowSummariseModal(false)}
        title="Lead Summary"
        size="md"
      >
        <div className="space-y-3">
          {[
            { label: 'Company', value: detailLead.companyName },
            { label: 'Contact Name', value: detailLead.contactPerson },
            { label: 'Contact No', value: detailLead.phone },
            { label: 'Designation', value: (detailLead as any).designation },
            { label: 'Email', value: detailLead.email },
            { label: 'Location', value: (detailLead as any).location },
            { label: 'Stage', value: detailLead.stage },
            { label: 'Value', value: detailLead.estimatedValue ? formatINR(detailLead.estimatedValue) : undefined },
            { label: 'Source', value: detailLead.source },
            { label: 'Type', value: (detailLead as any).tag },
            { label: 'Requirement', value: detailLead.requirement },
            { label: 'Quoted Requirement', value: detailLead.quotedRequirement },
            { label: 'Follow-up Date', value: detailLead.nextFollowUp ? formatDate(detailLead.nextFollowUp) : undefined },
            { label: 'Notes', value: detailLead.notes },
          ].filter(item => item.value).map(item => (
            <div key={item.label} className="flex justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">{item.label}</span>
              <span className="text-sm text-right max-w-[60%] text-gray-700 dark:text-zinc-200">{item.value}</span>
            </div>
          ))}
        </div>
      </Modal>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  if (pageLoading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6 animate-fade-in-up">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 animate-fade-in-up">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBack}
          className="p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
        </button>
        <h1 className="text-xl font-bold font-display text-gray-900 dark:text-white">
          {mode === 'create' ? 'New Lead' : mode === 'edit' ? 'Edit Lead' : detailLead?.companyName || 'Lead Details'}
        </h1>
      </div>

      {/* Content based on mode */}
      <Card padding="md">
        {(mode === 'create' || mode === 'edit') && renderForm()}
        {mode === 'view' && renderDetail()}
      </Card>

      {/* Modals that stay as modals */}
      {renderConvertModal()}
      {renderClosedWonModal()}
      {renderSummariseModal()}
    </div>
  );
};
