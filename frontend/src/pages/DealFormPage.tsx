import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Plus, Search, X, ChevronLeft, Edit2, Trash2,
  IndianRupee, Loader2, AlertCircle, CheckCircle, Calendar,
  TrendingUp, ArrowLeft, Eye,
  ChevronDown, Building2, User as UserIcon,
  Handshake, FileText, Briefcase, DollarSign,
  Layers, Download, Upload,
  MapPin, Phone, Mail, Send, MessageSquare, Flag, Tag
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useDropdowns } from '@/contexts/DropdownsContext';
import { dealsApi, accountsApi, contactsApi, salesApi, quotesApi, productsApi, partnersApi, formatINR } from '@/services/api';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { Deal, DealStage, Account, Contact, Product, Partner, Quote, ActivityLog } from '@/types';
import { Card, Button, Input, Select, Modal, Badge, Alert, Textarea } from '@/components/ui';
import { cx } from '@/utils/cx';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEAL_STAGES: DealStage[] = ['New', 'Proposal', 'Cold', 'Negotiation', 'Closed Won', 'Closed Lost'];

const STAGE_BADGE_VARIANT: Record<DealStage, 'cyan' | 'amber' | 'blue' | 'purple' | 'red' | 'emerald'> = {
  New: 'cyan',
  Proposal: 'amber',
  Cold: 'blue',
  Negotiation: 'purple',
  'Closed Lost': 'red',
  'Closed Won': 'emerald',
};

const STAGE_COLORS: Record<DealStage, {
  bg: string; text: string; darkBg: string; darkText: string;
  iconBg: string; darkIconBg: string; border: string; darkBorder: string;
}> = {
  New:            { bg: 'bg-cyan-50', text: 'text-cyan-700', darkBg: 'bg-cyan-900/30', darkText: 'text-cyan-400', iconBg: 'bg-cyan-100', darkIconBg: 'bg-cyan-900/20', border: 'border-cyan-200', darkBorder: 'border-cyan-800' },
  Proposal:       { bg: 'bg-amber-50', text: 'text-amber-700', darkBg: 'bg-amber-900/30', darkText: 'text-amber-400', iconBg: 'bg-amber-100', darkIconBg: 'bg-amber-900/20', border: 'border-amber-200', darkBorder: 'border-amber-800' },
  Cold:           { bg: 'bg-blue-50', text: 'text-blue-700', darkBg: 'bg-blue-900/30', darkText: 'text-blue-400', iconBg: 'bg-blue-100', darkIconBg: 'bg-blue-900/20', border: 'border-blue-200', darkBorder: 'border-blue-800' },
  Negotiation:    { bg: 'bg-purple-50', text: 'text-purple-700', darkBg: 'bg-purple-900/30', darkText: 'text-purple-400', iconBg: 'bg-purple-100', darkIconBg: 'bg-purple-900/20', border: 'border-purple-200', darkBorder: 'border-purple-800' },
  'Closed Lost':  { bg: 'bg-red-50', text: 'text-red-700', darkBg: 'bg-red-900/30', darkText: 'text-red-400', iconBg: 'bg-red-100', darkIconBg: 'bg-red-900/20', border: 'border-red-200', darkBorder: 'border-red-800' },
  'Closed Won':   { bg: 'bg-emerald-50', text: 'text-emerald-700', darkBg: 'bg-emerald-900/30', darkText: 'text-emerald-400', iconBg: 'bg-emerald-100', darkIconBg: 'bg-emerald-900/20', border: 'border-emerald-200', darkBorder: 'border-emerald-800' },
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function relativeTime(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

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

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

interface DealFormData {
  accountId: string;
  value: number;
  stage: DealStage;
  closingDate: string;
  description: string;
  contactId: string;
  nextStep: string;
  forecast: string;
  type: string;
  leadSource: string;
  tag: string;
  contactNo: string;
  designation: string;
  email: string;
  location: string;
  nextFollowUp: string;
  probability: number;
  requirement: string;
  quotedRequirement: string;
  paymentFlag: boolean;
  typeOfOrder: string;
}

const EMPTY_DEAL_FORM: DealFormData = {
  accountId: '',
  value: 0,
  stage: 'New',
  closingDate: '',
  description: '',
  contactId: '',
  nextStep: '',
  forecast: 'Pipeline',
  type: '',
  leadSource: '',
  tag: '',
  contactNo: '',
  designation: '',
  email: '',
  location: '',
  nextFollowUp: '',
  probability: 0,
  requirement: '',
  quotedRequirement: '',
  paymentFlag: false,
  typeOfOrder: '',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const DetailInfoRow: React.FC<{
  label: string;
  value?: string;
  icon?: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-dark-100">
    {icon && (
      <span className="mt-0.5 flex-shrink-0 text-gray-400 dark:text-zinc-500">
        {icon}
      </span>
    )}
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-gray-400 dark:text-zinc-500">{label}</p>
      <p className="text-sm text-gray-900 dark:text-white">
        {value || '-'}
      </p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Inline quote builder types
// ---------------------------------------------------------------------------

interface InlineLineItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

const emptyLineItem: InlineLineItem = { productId: '', description: '', quantity: 1, unitPrice: 0 };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DealFormPage: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab: navToTab } = useNavigation();
  const { getOptions } = useDropdowns();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const mode: 'create' | 'edit' | 'view' = location.pathname.includes('/create')
    ? 'create'
    : location.pathname.includes('/edit/')
      ? 'edit'
      : 'view';

  // Dropdown options
  const DEAL_TYPES = getOptions('deal-types');
  const LEAD_SOURCES = getOptions('lead-sources');
  const FORECAST_OPTIONS = getOptions('forecast-options');

  // ---------------------------------------------------------------------------
  // State: Dropdown data
  // ---------------------------------------------------------------------------
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  // ---------------------------------------------------------------------------
  // State: Form (create / edit)
  // ---------------------------------------------------------------------------
  const [dealFormData, setDealFormData] = useState<DealFormData>({ ...EMPTY_DEAL_FORM });
  const [dealFormError, setDealFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);

  // ---------------------------------------------------------------------------
  // State: Detail (view)
  // ---------------------------------------------------------------------------
  const [detailDeal, setDetailDeal] = useState<Deal | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Stage update
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<ActivityLog[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // Activity state
  const [activityType, setActivityType] = useState('note');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);

  // Closed Won modal state (Sales Order Form)
  const [showClosedWonModal, setShowClosedWonModal] = useState(false);
  const [closedWonDealId, setClosedWonDealId] = useState<string | null>(null);
  const [closedWonPayload, setClosedWonPayload] = useState<any>(null);
  const [closedWonDescription, setClosedWonDescription] = useState('');
  const [closedWonSaving, setClosedWonSaving] = useState(false);
  const [closedWonError, setClosedWonError] = useState('');
  const [closedWonOrderForm, setClosedWonOrderForm] = useState({
    customerName: '', quantity: 1, amount: 0, poNumber: '', invoiceNo: '',
    paymentStatus: 'pending', saleDate: new Date().toISOString().split('T')[0],
    partnerId: '',
    contactName: '', contactNo: '', email: '', gstin: '', panNo: '',
    dispatchMethod: '', paymentTerms: '', orderType: 'New' as 'New' | 'Refurb' | 'Rental',
    serialNumber: '', boq: '', price: 0,
  });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [closedWonExistingEntryId, setClosedWonExistingEntryId] = useState<string | null>(null);

  // Inline quote builder state
  const [inlineQuoteOpen, setInlineQuoteOpen] = useState(false);
  const [inlineLineItems, setInlineLineItems] = useState<InlineLineItem[]>([{ ...emptyLineItem }]);
  const [inlineTaxRate, setInlineTaxRate] = useState(18);
  const [inlineDiscountAmount, setInlineDiscountAmount] = useState(0);
  const [inlineCustomerName, setInlineCustomerName] = useState('');
  const [inlineValidUntil, setInlineValidUntil] = useState('');
  const [inlineQuoteNotes, setInlineQuoteNotes] = useState('');
  const [inlineQuoteTerms, setInlineQuoteTerms] = useState('');
  const [inlineQuoteSaving, setInlineQuoteSaving] = useState(false);
  const [inlineQuoteError, setInlineQuoteError] = useState('');
  const [inlineQuoteSuccess, setInlineQuoteSuccess] = useState('');
  const [editingInlineQuoteId, setEditingInlineQuoteId] = useState<string | null>(null);
  // Existing quotes for the deal
  const [dealQuotes, setDealQuotes] = useState<Quote[]>([]);
  const [dealQuotesLoading, setDealQuotesLoading] = useState(false);
  const [dealQuotePdfLoading, setDealQuotePdfLoading] = useState<string | null>(null);

  // Summarise modal
  const [showSummariseModal, setShowSummariseModal] = useState(false);

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  const handleBack = () => navigate('/deals');

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchDropdownData = useCallback(async () => {
    try {
      const [accountsResponse, contactsResponse, productsList, partnersResponse] = await Promise.all([
        accountsApi.list({ limit: '100' }),
        contactsApi.list({ limit: '100' }),
        productsApi.list(),
        partnersApi.list({ limit: '100', status: 'approved' }),
      ]);
      const acctData = accountsResponse?.data ?? accountsResponse;
      setAccounts(Array.isArray(acctData) ? acctData : []);
      const contData = contactsResponse?.data ?? contactsResponse;
      setContacts(Array.isArray(contData) ? contData : []);
      setProducts(Array.isArray(productsList) ? productsList : []);
      const partData = partnersResponse?.data ?? partnersResponse;
      setPartners(Array.isArray(partData) ? partData : []);
    } catch {
      // Dropdown data failure is non-critical
    }
  }, []);

  const fetchDealForEdit = useCallback(async (dealId: string) => {
    setIsLoadingForm(true);
    try {
      const res = await dealsApi.getById(dealId);
      const full = res?.data ?? res;
      setDealFormData({
        accountId: full.accountId || '',
        value: full.value || 0,
        stage: full.stage,
        closingDate: full.closingDate ? full.closingDate.split('T')[0] : '',
        description: full.description || '',
        contactId: full.contactId || '',
        nextStep: full.nextStep || '',
        forecast: full.forecast || 'Pipeline',
        type: full.type || 'New Business',
        leadSource: full.leadSource || '',
        tag: full.tag || '',
        contactNo: full.contactNo || '',
        designation: full.designation || '',
        email: full.email || '',
        location: full.location || '',
        nextFollowUp: full.nextFollowUp ? full.nextFollowUp.split('T')[0] : '',
        probability: full.probability ?? 0,
        requirement: full.requirement || '',
        quotedRequirement: full.quotedRequirement || '',
        paymentFlag: full.paymentFlag || false,
        typeOfOrder: full.typeOfOrder || '',
      });
    } catch (err: any) {
      setDealFormError(err.message || 'Failed to load deal');
    } finally {
      setIsLoadingForm(false);
    }
  }, []);

  const fetchDealForView = useCallback(async (dealId: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await dealsApi.getById(dealId);
      const deal = res?.data ?? res;
      setDetailDeal(deal);
      setInlineCustomerName(deal.accountName || deal.company || '');

      // Load audit + activities in parallel
      setIsAuditLoading(true);
      const [auditData, actData] = await Promise.all([
        dealsApi.getAuditLog(dealId),
        dealsApi.getActivities(dealId),
      ]);
      setAuditLogs(Array.isArray(auditData) ? auditData : []);
      setActivities(Array.isArray(actData) ? actData : []);
      setIsAuditLoading(false);

      // Load quotes
      await fetchDealQuotes(dealId);
    } catch (err: any) {
      console.error('Failed to load deal', err);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const fetchDealQuotes = useCallback(async (dealId: string) => {
    setDealQuotesLoading(true);
    try {
      const res = await quotesApi.list({ deal_id: dealId, limit: '50' });
      const data = res?.data ?? res ?? [];
      setDealQuotes(Array.isArray(data) ? data : []);
    } catch {
      setDealQuotes([]);
    } finally {
      setDealQuotesLoading(false);
    }
  }, []);

  // Main data loading effect
  useEffect(() => {
    if (mode === 'create') {
      setDealFormData({ ...EMPTY_DEAL_FORM });
      setDealFormError('');
      fetchDropdownData();
    } else if (mode === 'edit' && id) {
      setDealFormError('');
      fetchDropdownData();
      fetchDealForEdit(id);
    } else if (mode === 'view' && id) {
      fetchDropdownData();
      fetchDealForView(id);
    }
  }, [mode, id]);

  // Check for action query params (e.g. ?action=closed-won from kanban drag)
  useEffect(() => {
    if (mode === 'view' && detailDeal) {
      const params = new URLSearchParams(location.search);
      const action = params.get('action');
      if (action === 'closed-won') {
        // Trigger closed-won modal
        handleUpdateStage('Closed Won');
        // Clean up URL param
        navigate(`/deals/view/${id}`, { replace: true });
      }
    }
  }, [mode, detailDeal]);

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  const handleDealFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setDealFormData(prev => {
      const updated = {
        ...prev,
        [name]: name === 'value'
          ? Number(value) || 0
          : value,
      };
      // When account changes, reset contact if it doesn't belong to the new account
      if (name === 'accountId') {
        const currentContact = contacts.find(c => c.id === prev.contactId);
        if (currentContact && currentContact.accountId !== value) {
          updated.contactId = '';
          updated.contactNo = '';
          updated.designation = '';
          updated.email = '';
        }
      }
      // Auto-populate contact details from contacts table
      if (name === 'contactId' && value) {
        const contact = contacts.find(c => c.id === value);
        if (contact) {
          updated.contactNo = contact.phone || contact.mobile || '';
          updated.designation = contact.jobTitle || '';
          updated.email = contact.email || '';
        }
      }
      return updated;
    });
  };

  const handleDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDealFormError('');

    // Intercept Closed Won stage change -> show popup
    if (dealFormData.stage === 'Closed Won') {
      const acct = accounts.find(a => a.id === dealFormData.accountId);
      const payload: any = { ...dealFormData, title: acct?.name || 'Deal' };
      if (!payload.accountId) delete payload.accountId;
      if (!payload.contactId) delete payload.contactId;
      if (!payload.closingDate) delete payload.closingDate;
      if (!payload.nextFollowUp) delete payload.nextFollowUp;
      if (!payload.billingDeliveryDate) delete payload.billingDeliveryDate;
      setClosedWonDealId(mode === 'edit' ? (id || null) : null);
      setClosedWonPayload(payload);
      setClosedWonDescription(dealFormData.description || '');
      setClosedWonOrderForm({
        customerName: acct?.name || '',
        quantity: 1,
        amount: dealFormData.value || 0,
        poNumber: '',
        invoiceNo: '',
        paymentStatus: 'pending',
        saleDate: new Date().toISOString().split('T')[0],
        partnerId: acct?.partnerId || '',
        contactName: dealFormData.contactNo ? '' : '',
        contactNo: dealFormData.contactNo || '',
        email: dealFormData.email || '',
        gstin: acct?.gstinNo || '',
        panNo: acct?.panNo || '',
        dispatchMethod: '',
        paymentTerms: acct?.paymentTerms || '',
        orderType: 'New',
        serialNumber: '',
        boq: '',
        price: 0,
      });
      setShowClosedWonModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const acct = accounts.find(a => a.id === dealFormData.accountId);
      const payload: any = {
        ...dealFormData,
        title: acct?.name || 'Deal',
      };
      if (!payload.accountId) delete payload.accountId;
      if (!payload.contactId) delete payload.contactId;
      if (!payload.closingDate) delete payload.closingDate;

      if (mode === 'edit' && id) {
        await dealsApi.update(id, payload);
      } else {
        await dealsApi.create({ ...payload, ownerId: user?.id });
      }
      navigate('/deals');
    } catch (err: any) {
      setDealFormError(err.message || 'Failed to save deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Stage update from detail view
  // ---------------------------------------------------------------------------

  const handleUpdateStage = async (newStage: DealStage) => {
    if (!detailDeal || detailDeal.stage === newStage) return;

    // Intercept Closed Won -> show sales order form popup
    if (newStage === 'Closed Won') {
      const acct = accounts.find(a => a.id === detailDeal.accountId);
      setClosedWonDealId(detailDeal.id);
      setClosedWonPayload({ stage: 'Closed Won', value: detailDeal.value, accountId: detailDeal.accountId, title: detailDeal.accountName || 'Deal' });
      setClosedWonDescription(detailDeal.description || '');
      setClosedWonOrderForm({
        customerName: detailDeal.accountName || '',
        quantity: 1,
        amount: detailDeal.value || 0,
        poNumber: '',
        invoiceNo: '',
        paymentStatus: 'pending',
        saleDate: new Date().toISOString().split('T')[0],
        partnerId: acct?.partnerId || '',
        contactName: detailDeal.contactName || '',
        contactNo: detailDeal.contactNo || '',
        email: detailDeal.email || '',
        gstin: acct?.gstinNo || '',
        panNo: acct?.panNo || '',
        dispatchMethod: '',
        paymentTerms: acct?.paymentTerms || '',
        orderType: 'New',
        serialNumber: '',
        boq: '',
        price: 0,
      });
      setShowClosedWonModal(true);
      return;
    }

    setIsUpdatingStage(true);
    try {
      const res = await dealsApi.update(detailDeal.id, { stage: newStage });
      setDetailDeal(res?.data ?? res);
    } catch {
      // Revert — re-fetch original
      if (id) {
        try {
          const res = await dealsApi.getById(id);
          setDetailDeal(res?.data ?? res);
        } catch { /* ignore */ }
      }
    } finally {
      setIsUpdatingStage(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Activity handlers
  // ---------------------------------------------------------------------------

  const handleAddDealActivity = async () => {
    if (!detailDeal || !activityTitle.trim()) return;
    setIsAddingActivity(true);
    try {
      await dealsApi.addActivity(detailDeal.id, {
        activity_type: activityType,
        title: activityTitle.trim(),
        description: activityDesc.trim() || undefined,
      });
      setActivityTitle('');
      setActivityDesc('');
      setActivityType('note');
      // Refresh activities list
      const actData = await dealsApi.getActivities(detailDeal.id);
      setActivities(Array.isArray(actData) ? actData : []);
    } catch (err) {
      console.error('Failed to add activity', err);
    }
    setIsAddingActivity(false);
  };

  // ---------------------------------------------------------------------------
  // Quote handlers
  // ---------------------------------------------------------------------------

  const resetInlineQuote = () => {
    setInlineQuoteOpen(false);
    setEditingInlineQuoteId(null);
    setInlineLineItems([{ ...emptyLineItem }]);
    setInlineTaxRate(18);
    setInlineDiscountAmount(0);
    setInlineCustomerName(detailDeal?.accountName || detailDeal?.company || '');
    setInlineValidUntil('');
    setInlineQuoteNotes('');
    setInlineQuoteTerms('');
    setInlineQuoteError('');
    setInlineQuoteSuccess('');
  };

  const handleEditDealQuote = async (quote: Quote) => {
    setInlineQuoteError('');
    setInlineQuoteSuccess('');
    try {
      const full = await quotesApi.getById(quote.id);
      const q: Quote = full?.data ?? full;
      setEditingInlineQuoteId(q.id);
      setInlineCustomerName(q.customerName || '');
      setInlineValidUntil(q.validUntil ? q.validUntil.split('T')[0] : '');
      setInlineTaxRate(q.taxRate ?? 18);
      setInlineDiscountAmount(q.discountAmount ?? 0);
      setInlineQuoteTerms(q.terms || '');
      setInlineQuoteNotes('');
      setInlineLineItems(
        q.lineItems && q.lineItems.length > 0
          ? q.lineItems.map(li => ({
              productId: li.productId || '',
              description: li.description || '',
              quantity: li.quantity,
              unitPrice: li.unitPrice,
            }))
          : [{ ...emptyLineItem }]
      );
      setInlineQuoteOpen(true);
    } catch {
      setInlineQuoteError('Failed to load quote for editing');
    }
  };

  const handleDealQuotePdf = async (quote: Quote) => {
    setDealQuotePdfLoading(quote.id);
    try {
      if (quote.pdfUrl) {
        window.open(quote.pdfUrl, '_blank');
      } else {
        const result = await quotesApi.getPdf(quote.id, true);
        if (result.pdfUrl) {
          window.open(result.pdfUrl, '_blank');
          setDealQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, pdfUrl: result.pdfUrl } : q));
        }
      }
    } catch {
      // silent
    } finally {
      setDealQuotePdfLoading(null);
    }
  };

  const handleInlineLineItemChange = (index: number, field: keyof InlineLineItem, value: string | number) => {
    setInlineLineItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Auto-populate unit price when product is selected
      if (field === 'productId' && value) {
        const product = products.find(p => p.id === value);
        if (product && product.basePrice) {
          updated[index].unitPrice = product.basePrice;
          updated[index].description = product.name || '';
        }
      }
      return updated;
    });
  };

  const handleInlineQuoteSubmit = async () => {
    if (!detailDeal) return;
    if (!inlineCustomerName.trim()) {
      setInlineQuoteError('Account name is required');
      return;
    }
    const validItems = inlineLineItems.filter(li => li.productId || (li.description && li.quantity > 0 && li.unitPrice > 0));
    if (validItems.length === 0) {
      setInlineQuoteError('Add at least one line item with product or description, quantity, and price');
      return;
    }

    setInlineQuoteSaving(true);
    setInlineQuoteError('');
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
      const taxable = subtotal - inlineDiscountAmount;
      const taxAmount = taxable > 0 ? taxable * (inlineTaxRate / 100) : 0;

      const payload = {
        customerName: inlineCustomerName,
        dealId: detailDeal.id,
        validUntil: inlineValidUntil || null,
        taxRate: inlineTaxRate,
        discountAmount: inlineDiscountAmount,
        subtotal,
        taxAmount,
        totalAmount: taxable + taxAmount,
        terms: inlineQuoteTerms,
        lineItems,
      };

      if (editingInlineQuoteId) {
        await quotesApi.update(editingInlineQuoteId, payload);
        setInlineQuoteSuccess('Quote updated successfully!');
      } else {
        const created = await quotesApi.create({ ...payload, status: 'draft' });
        setInlineQuoteSuccess('Quote created successfully!');
        if (created) setDealQuotes(prev => [created, ...prev]);
      }

      setTimeout(() => setInlineQuoteSuccess(''), 4000);
      setEditingInlineQuoteId(null);
      setInlineLineItems([{ ...emptyLineItem }]);
      setInlineDiscountAmount(0);
      setInlineValidUntil('');
      setInlineQuoteTerms('');
      setInlineQuoteOpen(false);
      await fetchDealQuotes(detailDeal.id);
    } catch (err: any) {
      setInlineQuoteError(err.message || (editingInlineQuoteId ? 'Failed to update quote' : 'Failed to create quote'));
    } finally {
      setInlineQuoteSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------

  const handleDelete = async (dealId: string) => {
    try {
      await dealsApi.delete(dealId);
      setDeleteConfirmId(null);
      navigate('/deals');
    } catch (err: any) {
      console.error('Failed to delete deal', err);
    }
  };

  // ---------------------------------------------------------------------------
  // Closed Won modal handlers
  // ---------------------------------------------------------------------------

  const closeClosedWonModal = () => {
    setShowClosedWonModal(false);
    setClosedWonDealId(null);
    setClosedWonPayload(null);
    setClosedWonDescription('');
    setClosedWonError('');
    setSelectedProductIds([]);
    setProductSearch('');
    setClosedWonExistingEntryId(null);
  };

  const handleClosedWonSubmit = async () => {
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

    setClosedWonSaving(true);
    setClosedWonError('');

    try {
      // Step 1: Update deal stage to Closed Won
      const updatedPayload = {
        ...closedWonPayload,
        stage: 'Closed Won',
        description: closedWonDescription,
      };

      if (closedWonDealId) {
        await dealsApi.update(closedWonDealId, updatedPayload);
      } else {
        await dealsApi.create({ ...updatedPayload, ownerId: user?.id });
      }

      // Step 2: Create or update Sales Entry from order form
      const salesEntryData: any = {
        partnerId: closedWonOrderForm.partnerId || undefined,
        salespersonId: user?.id,
        customerName: closedWonOrderForm.customerName || undefined,
        quantity: closedWonOrderForm.quantity,
        amount: closedWonOrderForm.amount,
        poNumber: closedWonOrderForm.poNumber || undefined,
        invoiceNo: closedWonOrderForm.invoiceNo || undefined,
        paymentStatus: closedWonOrderForm.paymentStatus,
        saleDate: closedWonOrderForm.saleDate,
        description: closedWonDescription || undefined,
        dealId: closedWonDealId || undefined,
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
      };

      if (closedWonExistingEntryId) {
        await salesApi.update(closedWonExistingEntryId, salesEntryData);
      } else {
        await salesApi.create(salesEntryData);
      }

      closeClosedWonModal();
      navToTab('sales-entry');
    } catch (err: any) {
      setClosedWonError(err.message || 'Failed to complete deal');
    } finally {
      setClosedWonSaving(false);
    }
  };

  // Reinitiate Sales Order -- open modal pre-filled from existing sales entry
  const handleReinitiateSalesOrder = async (deal: Deal) => {
    const acct = accounts.find(a => a.id === deal.accountId);
    setClosedWonDealId(deal.id);
    setClosedWonPayload({ stage: 'Closed Won', value: deal.value, accountId: deal.accountId, title: deal.accountName || 'Deal' });
    setClosedWonDescription(deal.description || '');
    setClosedWonError('');

    const newFieldsFromDeal = {
      contactName: deal.contactName || '',
      contactNo: deal.contactNo || '',
      email: deal.email || '',
      gstin: acct?.gstinNo || '',
      panNo: acct?.panNo || '',
      dispatchMethod: '',
      paymentTerms: acct?.paymentTerms || '',
      orderType: 'New' as const,
      serialNumber: '',
      boq: '',
      price: 0,
    };

    try {
      const res = await salesApi.list({ deal_id: deal.id, limit: '1' });
      const entries = res?.data || res || [];
      if (entries.length > 0) {
        const entry = entries[0];
        setClosedWonOrderForm({
          customerName: entry.customerName || deal.accountName || '',
          quantity: entry.quantity || 1,
          amount: entry.amount || deal.value || 0,
          poNumber: entry.poNumber || '',
          invoiceNo: entry.invoiceNo || '',
          paymentStatus: entry.paymentStatus || 'pending',
          saleDate: entry.saleDate || new Date().toISOString().split('T')[0],
          partnerId: entry.partnerId || acct?.partnerId || '',
          contactName: entry.contactName || newFieldsFromDeal.contactName,
          contactNo: entry.contactNo || newFieldsFromDeal.contactNo,
          email: entry.email || newFieldsFromDeal.email,
          gstin: entry.gstin || newFieldsFromDeal.gstin,
          panNo: entry.panNo || newFieldsFromDeal.panNo,
          dispatchMethod: entry.dispatchMethod || '',
          paymentTerms: entry.paymentTerms || newFieldsFromDeal.paymentTerms,
          orderType: entry.orderType || 'New',
          serialNumber: entry.serialNumber || '',
          boq: entry.boq || '',
          price: entry.price || 0,
        });
        setSelectedProductIds(entry.productIds || []);
        setClosedWonExistingEntryId(entry.id);
        setClosedWonDescription(entry.description || deal.description || '');
      } else {
        setClosedWonOrderForm({
          customerName: deal.accountName || '',
          quantity: 1,
          amount: deal.value || 0,
          poNumber: '',
          invoiceNo: '',
          paymentStatus: 'pending',
          saleDate: new Date().toISOString().split('T')[0],
          partnerId: acct?.partnerId || '',
          ...newFieldsFromDeal,
        });
        setSelectedProductIds([]);
        setClosedWonExistingEntryId(null);
      }
    } catch {
      setClosedWonOrderForm({
        customerName: deal.accountName || '',
        quantity: 1,
        amount: deal.value || 0,
        poNumber: '',
        invoiceNo: '',
        paymentStatus: 'pending',
        saleDate: new Date().toISOString().split('T')[0],
        partnerId: acct?.partnerId || '',
        ...newFieldsFromDeal,
      });
      setSelectedProductIds([]);
      setClosedWonExistingEntryId(null);
    }
    setShowClosedWonModal(true);
  };

  // ---------------------------------------------------------------------------
  // Render: Create/Edit Form (page, not modal)
  // ---------------------------------------------------------------------------

  const renderForm = () => {
    if (isLoadingForm) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">Loading deal...</p>
        </div>
      );
    }

    return (
      <Card>
        <form id="deal-form" onSubmit={handleDealSubmit} className="space-y-5">
          {dealFormError && (
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {dealFormError}
            </Alert>
          )}

          {/* Row: Account + Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Account"
              name="accountId"
              value={dealFormData.accountId}
              onChange={handleDealFormChange}
            >
              <option value="">Select account...</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
            <Select
              label="Contact"
              name="contactId"
              value={dealFormData.contactId}
              onChange={handleDealFormChange}
            >
              <option value="">Select contact...</option>
              {(dealFormData.accountId
                ? contacts.filter(c => c.accountId === dealFormData.accountId)
                : contacts
              ).map(c => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </Select>
          </div>

          {/* Row: Closing Date + Next Follow-up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Closing Date"
              name="closingDate"
              type="date"
              value={dealFormData.closingDate}
              onChange={handleDealFormChange}
              icon={<Calendar className="w-4 h-4" />}
            />
            <Input
              label="Next Follow-up"
              name="nextFollowUp"
              type="date"
              value={dealFormData.nextFollowUp}
              onChange={handleDealFormChange}
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>

          {/* Row: Contact No + Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact No"
              name="contactNo"
              type="text"
              placeholder="Phone number"
              value={dealFormData.contactNo}
              onChange={handleDealFormChange}
              icon={<Phone className="w-4 h-4" />}
            />
            <Input
              label="Designation"
              name="designation"
              type="text"
              placeholder="e.g. Manager, Director"
              value={dealFormData.designation}
              onChange={handleDealFormChange}
            />
          </div>

          {/* Row: Email + Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="email@example.com"
              value={dealFormData.email}
              onChange={handleDealFormChange}
              icon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Location"
              name="location"
              type="text"
              placeholder="City, State"
              value={dealFormData.location}
              onChange={handleDealFormChange}
              icon={<MapPin className="w-4 h-4" />}
            />
          </div>

          {/* Row: Type + Lead Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Type"
              name="tag"
              value={dealFormData.tag}
              onChange={handleDealFormChange}
            >
              <option value="">Select type...</option>
              <option value="Channel">Channel</option>
              <option value="End Customer">End Customer</option>
            </Select>
            <Select
              label="Lead Source"
              name="leadSource"
              value={dealFormData.leadSource}
              onChange={handleDealFormChange}
            >
              <option value="">Select source...</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Cold Call">Cold Call</option>
              <option value="Event">Event</option>
              <option value="Partner">Partner</option>
              <option value="Other">Other</option>
            </Select>
          </div>

          {/* Order Type */}
          <Select
            label="Order Type"
            name="typeOfOrder"
            value={dealFormData.typeOfOrder}
            onChange={handleDealFormChange}
          >
            <option value="">Select order type...</option>
            <option value="New">New</option>
            <option value="Refurb">Refurb</option>
            <option value="Rental">Rental</option>
          </Select>

          {/* Requirements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Textarea
              label="Requirement (User Provided)"
              name="requirement"
              rows={3}
              placeholder="What the user/lead requires..."
              value={dealFormData.requirement}
              onChange={(e) => setDealFormData(prev => ({ ...prev, requirement: e.target.value }))}
            />
            <Textarea
              label="Quoted Requirement (What We Serve)"
              name="quotedRequirement"
              rows={3}
              placeholder="What we are offering/serving..."
              value={dealFormData.quotedRequirement}
              onChange={(e) => setDealFormData(prev => ({ ...prev, quotedRequirement: e.target.value }))}
            />
          </div>

          {/* Value */}
          <Input
            label="Value (INR)"
            name="value"
            type="number"
            min={0}
            step={1}
            placeholder="0"
            value={dealFormData.value || ''}
            onChange={handleDealFormChange}
            icon={<IndianRupee className="w-4 h-4" />}
          />

          {/* Description (Rich Text) */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Description</label>
            <RichTextEditor
              value={dealFormData.description}
              onChange={(html) => setDealFormData(prev => ({ ...prev, description: html }))}
              placeholder="Deal description..."
              minHeight="80px"
            />
          </div>

          {/* Form actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              icon={isSubmitting ? undefined : <CheckCircle className="w-4 h-4" />}
              shine
            >
              {isSubmitting ? 'Saving...' : (mode === 'edit' ? 'Update Deal' : 'Create Deal')}
            </Button>
          </div>
        </form>
      </Card>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Detail View (page, not modal)
  // ---------------------------------------------------------------------------

  const renderDetail = () => {
    if (isLoadingDetail || !detailDeal) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">Loading deal...</p>
        </div>
      );
    }

    const deal = detailDeal;
    const stageColor = STAGE_COLORS[deal.stage] || STAGE_COLORS['New'];

    return (
      <div className="space-y-6">
        {/* Stage + Actions bar */}
        <Card padding="none" className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium whitespace-nowrap text-gray-500 dark:text-zinc-400">Stage:</label>
                <select
                  value={deal.stage}
                  onChange={e => handleUpdateStage(e.target.value as DealStage)}
                  disabled={isUpdatingStage}
                  className={cx(
                    'px-2 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer',
                    stageColor.bg, stageColor.text, 'border-gray-200',
                    `dark:${stageColor.darkBg}`, `dark:${stageColor.darkText}`, 'dark:border-zinc-700 dark:bg-dark-100',
                    'focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50'
                  )}
                >
                  {DEAL_STAGES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {isUpdatingStage && <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Summarise */}
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowSummariseModal(true)}
                icon={<FileText className="w-4 h-4" />}
                title="Summarise"
              />
              {/* Edit */}
              <Button
                variant="ghost"
                size="xs"
                onClick={() => navigate('/deals/edit/' + deal.id)}
                icon={<Edit2 className="w-4 h-4" />}
                title="Edit"
              />
              {/* Reinitiate Sales Order for Closed Won */}
              {deal.stage === 'Closed Won' && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleReinitiateSalesOrder(deal)}
                  icon={<FileText className="w-4 h-4" />}
                  title="Reinitiate Sales Order"
                  className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                >
                  Reinitiate Sales Order
                </Button>
              )}
              {/* Delete */}
              {deleteConfirmId === deal.id ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => handleDelete(deal.id)}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setDeleteConfirmId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setDeleteConfirmId(deal.id)}
                  icon={<Trash2 className="w-4 h-4" />}
                  className="hover:text-red-600 dark:hover:text-red-400"
                  title="Delete"
                />
              )}
            </div>
          </div>
        </Card>

        {/* Deal Value Highlight */}
        {deal.value ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30">
            <IndianRupee className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70">Deal Value</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatINR(deal.value)}</p>
            </div>
          </div>
        ) : null}

        {/* Info Grid */}
        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailInfoRow label="Account" value={deal.accountName} icon={<Building2 className="w-3.5 h-3.5" />} />
            <DetailInfoRow label="Contact" value={deal.contactName} icon={<UserIcon className="w-3.5 h-3.5" />} />
            <DetailInfoRow label="Contact No" value={deal.contactNo} icon={<Phone className="w-3.5 h-3.5" />} />
            <DetailInfoRow label="Email" value={deal.email} icon={<Mail className="w-3.5 h-3.5" />} />
            <DetailInfoRow label="Designation" value={deal.designation} icon={<Briefcase className="w-3.5 h-3.5" />} />
            <DetailInfoRow label="Owner" value={deal.ownerName} icon={<UserIcon className="w-3.5 h-3.5" />} />
            <DetailInfoRow label="Closing Date" value={deal.closingDate ? formatDate(deal.closingDate) : undefined} icon={<Calendar className="w-3.5 h-3.5" />} />
            <DetailInfoRow label="Type" value={deal.type} icon={<Briefcase className="w-3.5 h-3.5" />} />
            <DetailInfoRow label="Tag" value={deal.tag} icon={<Layers className="w-3.5 h-3.5" />} />
            <DetailInfoRow label="Source" value={deal.leadSource} icon={<TrendingUp className="w-3.5 h-3.5" />} />
            <DetailInfoRow label="Order Type" value={deal.typeOfOrder} icon={<Tag className="w-3.5 h-3.5" />} />
          </div>
        </Card>

        {/* Requirements */}
        {(deal.requirement || deal.quotedRequirement) && (
          <Card>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 text-gray-400 dark:text-zinc-500">
              Requirements
            </h4>
            <div className="space-y-3">
              {deal.requirement && (
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">Requirement (User Provided)</span>
                  <p className="text-sm whitespace-pre-wrap mt-1 text-gray-700 dark:text-zinc-300">
                    {deal.requirement}
                  </p>
                </div>
              )}
              {deal.quotedRequirement && (
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">Quoted Requirement (What We Serve)</span>
                  <p className="text-sm whitespace-pre-wrap mt-1 text-gray-700 dark:text-zinc-300">
                    {deal.quotedRequirement}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Next Step */}
        {deal.nextStep && (
          <Card>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400 dark:text-zinc-500">
              Next Step
            </h4>
            <p className="text-sm text-gray-700 dark:text-zinc-300">{deal.nextStep}</p>
          </Card>
        )}

        {/* Description */}
        {deal.description && (
          <Card>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400 dark:text-zinc-500">
              Description
            </h4>
            <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-zinc-300">{deal.description}</p>
          </Card>
        )}

        {/* Quote Builder */}
        <Card>
          {/* Existing Quotes */}
          {(dealQuotesLoading || dealQuotes.length > 0) && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 text-gray-400 dark:text-zinc-500">
                <FileText className="w-3.5 h-3.5" /> Quotes
              </h4>
              {dealQuotesLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-500 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading quotes...
                </div>
              ) : (
                <div className="space-y-2">
                  {dealQuotes.map(q => (
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
                          onClick={() => handleEditDealQuote(q)}
                          className="p-1.5 rounded-lg transition-colors text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
                          title="Edit Quote"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDealQuotePdf(q)}
                          disabled={dealQuotePdfLoading === q.id}
                          className="p-1.5 rounded-lg transition-colors text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 disabled:opacity-50"
                          title="Download PDF"
                        >
                          {dealQuotePdfLoading === q.id
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
              if (inlineQuoteOpen && editingInlineQuoteId) {
                resetInlineQuote();
              } else {
                setInlineQuoteOpen(prev => !prev);
                if (!inlineQuoteOpen) setEditingInlineQuoteId(null);
              }
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl border transition-all border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/10 dark:hover:bg-indigo-900/20 dark:text-indigo-400"
          >
            <div className="flex items-center gap-2">
              {editingInlineQuoteId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span className="text-sm font-semibold">{editingInlineQuoteId ? 'Edit Quote' : 'Create Quote'}</span>
            </div>
            <ChevronDown className={cx('w-4 h-4 transition-transform', inlineQuoteOpen && 'rotate-180')} />
          </button>

          {inlineQuoteOpen && (
            <div className="mt-3 p-4 rounded-xl border space-y-4 border-gray-200 bg-gray-50 dark:border-zinc-800 dark:bg-dark-100">
              {inlineQuoteError && (
                <Alert variant="error" icon={<AlertCircle className="w-3.5 h-3.5" />}>
                  {inlineQuoteError}
                </Alert>
              )}
              {inlineQuoteSuccess && (
                <Alert variant="success" icon={<CheckCircle className="w-3.5 h-3.5" />}>
                  {inlineQuoteSuccess}
                </Alert>
              )}

              {/* Quote Header */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium text-gray-500 dark:text-zinc-400">Account Name *</label>
                  <Input
                    type="text"
                    placeholder="Account name..."
                    value={inlineCustomerName}
                    onChange={e => setInlineCustomerName(e.target.value)}
                    className="!text-xs !py-1.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-500 dark:text-zinc-400">Valid Until</label>
                  <Input
                    type="date"
                    value={inlineValidUntil}
                    onChange={e => setInlineValidUntil(e.target.value)}
                    className="!text-xs !py-1.5"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  Line Items
                </h5>
                {inlineLineItems.map((li, idx) => (
                  <div key={idx} className="p-3 rounded-lg border space-y-2 border-gray-200 bg-white dark:border-zinc-700 dark:bg-dark-50">
                    <div className="flex items-center justify-between gap-2">
                      <Select
                        value={li.productId}
                        onChange={e => handleInlineLineItemChange(idx, 'productId', e.target.value)}
                        className="flex-1 !text-xs !py-1.5"
                      >
                        <option value="">Select product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </Select>
                      {inlineLineItems.length > 1 && (
                        <button
                          onClick={() => setInlineLineItems(prev => prev.filter((_, i) => i !== idx))}
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
                        onChange={val => handleInlineLineItemChange(idx, 'description', val)}
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
                          onChange={e => handleInlineLineItemChange(idx, 'quantity', Number(e.target.value) || 0)}
                          className="!text-xs !py-1.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 dark:text-zinc-500">Unit Price (₹)</label>
                        <Input
                          type="number"
                          min={0}
                          value={li.unitPrice}
                          onChange={e => handleInlineLineItemChange(idx, 'unitPrice', Number(e.target.value) || 0)}
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
                  onClick={() => setInlineLineItems(prev => [...prev, { ...emptyLineItem }])}
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
                      value={inlineTaxRate}
                      onChange={e => setInlineTaxRate(Number(e.target.value) || 0)}
                      className="!text-xs !py-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 dark:text-zinc-400">Discount (₹)</label>
                    <Input
                      type="number"
                      min={0}
                      value={inlineDiscountAmount}
                      onChange={e => setInlineDiscountAmount(Number(e.target.value) || 0)}
                      className="!text-xs !py-1.5"
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-end text-right text-xs space-y-1 text-gray-700 dark:text-zinc-300 pb-1">
                  {(() => {
                    const subtotal = inlineLineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
                    const taxable = subtotal - inlineDiscountAmount;
                    const tax = taxable > 0 ? taxable * (inlineTaxRate / 100) : 0;
                    return (
                      <>
                        <span>Subtotal: {formatINR(subtotal)}</span>
                        {inlineDiscountAmount > 0 && <span className="text-emerald-600 dark:text-emerald-400">Discount: -{formatINR(inlineDiscountAmount)}</span>}
                        <span>Tax ({inlineTaxRate}%): {formatINR(tax)}</span>
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
                  value={inlineQuoteTerms}
                  onChange={e => setInlineQuoteTerms(e.target.value)}
                  className="!text-xs !py-1.5"
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleInlineQuoteSubmit}
                loading={inlineQuoteSaving}
                icon={<FileText className="w-3.5 h-3.5" />}
                className="w-full"
                size="sm"
              >
                {inlineQuoteSaving
                  ? (editingInlineQuoteId ? 'Saving...' : 'Creating...')
                  : (editingInlineQuoteId ? 'Save Changes & Regenerate PDF' : 'Create Quote & Generate PDF')
                }
              </Button>
            </div>
          )}
        </Card>

        {/* Add Activity */}
        <Card>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5 text-gray-400 dark:text-zinc-500">
            <MessageSquare className="w-3.5 h-3.5" /> Add Activity
          </h4>
          <div className="p-3 rounded-xl border space-y-2 border-gray-100 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex gap-2">
              <Select
                value={activityType}
                onChange={e => setActivityType(e.target.value)}
                className="!text-xs !px-2 !py-1.5 !w-auto"
              >
                <option value="note">Note</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
                <option value="follow_up">Follow-up</option>
                <option value="task">Task</option>
              </Select>
              <Input
                type="text"
                placeholder="Activity title..."
                value={activityTitle}
                onChange={e => setActivityTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddDealActivity()}
                className="flex-1 !text-xs !py-1.5"
              />
            </div>
            <Textarea
              rows={2}
              placeholder="Description (optional)..."
              value={activityDesc}
              onChange={e => setActivityDesc(e.target.value)}
              className="!text-xs !py-1.5 !min-h-0 !resize-none"
            />
            <Button
              size="xs"
              onClick={handleAddDealActivity}
              disabled={!activityTitle.trim()}
              loading={isAddingActivity}
              icon={isAddingActivity ? undefined : <Send className="w-3 h-3" />}
            >
              {isAddingActivity ? 'Adding...' : 'Add Activity'}
            </Button>
          </div>
        </Card>

        {/* Activities */}
        {activities.length > 0 && (
          <Card>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 text-gray-400 dark:text-zinc-500">
              Activities
            </h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {activities.map((act: any) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl border text-xs border-gray-100 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700 dark:text-zinc-300">
                      {act.title}
                    </span>
                    <Badge variant="gray" size="sm">
                      {act.activityType || act.activity_type}
                    </Badge>
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
          </Card>
        )}

        {/* Audit Trail */}
        <Card>
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
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
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
        </Card>

        {/* Timestamps */}
        <div className="flex items-center gap-4 text-[11px] text-gray-400 dark:text-zinc-600">
          {deal.createdAt && <span>Created: {formatDate(deal.createdAt)}</span>}
          {deal.updatedAt && <span>Updated: {formatDate(deal.updatedAt)}</span>}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Closed Won Modal
  // ---------------------------------------------------------------------------

  const renderClosedWonModal = () => {
    if (!showClosedWonModal) return null;

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
        onClose={closeClosedWonModal}
        title="Sales Order Form"
        icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={closeClosedWonModal} disabled={closedWonSaving}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleClosedWonSubmit}
              loading={closedWonSaving}
              icon={closedWonSaving ? undefined : <CheckCircle className="w-4 h-4" />}
            >
              {closedWonSaving
                ? (closedWonExistingEntryId ? 'Updating...' : 'Creating Sale...')
                : (closedWonExistingEntryId ? 'Update Sales Order' : 'Close Deal & Create Sale')
              }
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {closedWonError && (
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {closedWonError}
            </Alert>
          )}

          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {closedWonExistingEntryId ? 'Update the sales order for this deal.' : 'Fill in the sales order details. A sales entry will be created for this deal.'}
          </p>

          {/* Company Name */}
          <Input
            label="Company Name"
            name="customerName"
            value={closedWonOrderForm.customerName}
            onChange={handleOrderChange}
            placeholder="Company name"
            readOnly
            className="bg-gray-50 dark:bg-dark-200"
          />

          {/* Product Selection */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Products <span className="text-red-500">*</span></label>
            <button
              type="button"
              onClick={() => setProductDropdownOpen(prev => !prev)}
              className={cx(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm text-left transition-colors',
                'bg-white border-gray-200 text-gray-700 hover:border-gray-400',
                'dark:bg-dark-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500'
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
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
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
                            prev.includes(product.id) ? prev.filter(pid => pid !== product.id) : [...prev, product.id]
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
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Order Type</label>
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
          <Textarea
            label="BOQ (Bill of Quantities)"
            name="boq"
            rows={3}
            placeholder="Enter BOQ details..."
            value={closedWonOrderForm.boq}
            onChange={handleOrderChange}
          />

          {/* Description */}
          <Textarea
            label="Description"
            rows={2}
            placeholder="Description of the sales order..."
            value={closedWonDescription}
            onChange={e => setClosedWonDescription(e.target.value)}
          />
        </div>
      </Modal>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Summarise Modal
  // ---------------------------------------------------------------------------

  const renderSummariseModal = () => {
    if (!showSummariseModal || !detailDeal) return null;
    const deal = detailDeal;

    return (
      <Modal
        open={showSummariseModal}
        onClose={() => setShowSummariseModal(false)}
        title="Deal Summary"
        size="lg"
      >
        <div className="space-y-3">
          {[
            { label: 'Company', value: deal.company || deal.accountName },
            { label: 'Contact Name', value: deal.contactName },
            { label: 'Contact No', value: deal.contactNo },
            { label: 'Designation', value: deal.designation },
            { label: 'Email', value: deal.email },
            { label: 'Location', value: deal.location },
            { label: 'Stage', value: deal.stage },
            { label: 'Value', value: deal.value ? formatINR(deal.value) : undefined },
            { label: 'Type', value: deal.tag },
            { label: 'Requirement', value: deal.requirement },
            { label: 'Quoted Requirement', value: deal.quotedRequirement },
            { label: 'Follow-up Date', value: deal.nextFollowUp ? formatDate(deal.nextFollowUp) : undefined },
            { label: 'Description', value: deal.description },
            { label: 'Next Step', value: deal.nextStep },
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
        <div>
          <h1 className="text-xl font-bold font-display text-gray-900 dark:text-white">
            {mode === 'create' ? 'New Deal' : mode === 'edit' ? 'Edit Deal' : detailDeal?.accountName || detailDeal?.title || 'Deal Details'}
          </h1>
          <p className="text-sm mt-0.5 text-gray-500 dark:text-zinc-400">
            {mode === 'create' ? 'Create a new deal opportunity' : mode === 'edit' ? 'Update deal information' : 'View deal details and activity'}
          </p>
        </div>
      </div>

      {(mode === 'create' || mode === 'edit') && renderForm()}
      {mode === 'view' && renderDetail()}

      {/* Sub-modals */}
      {renderClosedWonModal()}
      {renderSummariseModal()}
    </div>
  );
};
