import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, ChevronLeft, ChevronRight, Edit2, Trash2,
  IndianRupee, Loader2, AlertCircle, CheckCircle, Calendar,
  Target, TrendingUp, ArrowRight, Eye, LayoutGrid, List,
  XCircle, ChevronDown, Building2, User as UserIcon,
  Handshake, FileText, Briefcase, DollarSign,
  Layers, Snowflake,
  Download, Upload,
  MapPin, Phone, Mail, Send, MessageSquare
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { dealsApi, accountsApi, contactsApi, salesApi, quotesApi, productsApi, formatINR } from '../services/api';
import { exportToCsv } from '../utils/exportCsv';
import { BulkImportModal } from './BulkImportModal';
import { Deal, DealStage, Account, Contact, Product, PaginatedResponse, ActivityLog } from '../types';
import { useColumnResize } from '../hooks/useColumnResize';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

const DEAL_STAGES: DealStage[] = [
  'Cold', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost',
];

const PIPELINE_STAGES: DealStage[] = ['Cold', 'Proposal', 'Negotiation'];
const TERMINAL_STAGES: DealStage[] = ['Closed Won', 'Closed Lost'];

const STAGE_COLORS: Record<DealStage, {
  bg: string; text: string; darkBg: string; darkText: string;
  iconBg: string; darkIconBg: string; border: string; darkBorder: string;
}> = {
  Cold:           { bg: 'bg-blue-50', text: 'text-blue-700', darkBg: 'bg-blue-900/30', darkText: 'text-blue-400', iconBg: 'bg-blue-100', darkIconBg: 'bg-blue-900/20', border: 'border-blue-200', darkBorder: 'border-blue-800' },
  Proposal:       { bg: 'bg-amber-50', text: 'text-amber-700', darkBg: 'bg-amber-900/30', darkText: 'text-amber-400', iconBg: 'bg-amber-100', darkIconBg: 'bg-amber-900/20', border: 'border-amber-200', darkBorder: 'border-amber-800' },
  Negotiation:    { bg: 'bg-purple-50', text: 'text-purple-700', darkBg: 'bg-purple-900/30', darkText: 'text-purple-400', iconBg: 'bg-purple-100', darkIconBg: 'bg-purple-900/20', border: 'border-purple-200', darkBorder: 'border-purple-800' },
  'Closed Won':   { bg: 'bg-emerald-50', text: 'text-emerald-700', darkBg: 'bg-emerald-900/30', darkText: 'text-emerald-400', iconBg: 'bg-emerald-100', darkIconBg: 'bg-emerald-900/20', border: 'border-emerald-200', darkBorder: 'border-emerald-800' },
  'Closed Lost':  { bg: 'bg-red-50', text: 'text-red-700', darkBg: 'bg-red-900/30', darkText: 'text-red-400', iconBg: 'bg-red-100', darkIconBg: 'bg-red-900/20', border: 'border-red-200', darkBorder: 'border-red-800' },
};

const NEXT_STAGE: Record<string, DealStage> = {
  Cold: 'Proposal',
  Proposal: 'Negotiation',
  Negotiation: 'Closed Won',
};

const DEAL_TYPES = [
  { value: 'New Business', label: 'New Business' },
  { value: 'Existing Business', label: 'Existing Business' },
  { value: 'Renewal', label: 'Renewal' },
  { value: 'Upsell', label: 'Upsell' },
];

const LEAD_SOURCES = [
  { value: 'Website', label: 'Website' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Cold Call', label: 'Cold Call' },
  { value: 'Event', label: 'Event' },
  { value: 'Partner', label: 'Partner' },
  { value: 'Other', label: 'Other' },
];

const FORECAST_OPTIONS = [
  { value: 'Pipeline', label: 'Pipeline' },
  { value: 'Best Case', label: 'Best Case' },
  { value: 'Commit', label: 'Commit' },
  { value: 'Omitted', label: 'Omitted' },
];


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
}

const EMPTY_DEAL_FORM: DealFormData = {
  accountId: '',
  value: 0,
  stage: 'Cold',
  closingDate: '',
  description: '',
  contactId: '',
  nextStep: '',
  forecast: 'Pipeline',
  type: 'New Business',
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

function stageBadge(stage: DealStage, isDark: boolean): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const c = STAGE_COLORS[stage] || STAGE_COLORS['Cold']; // Fallback to Cold if stage not found
  return `${base} ${isDark ? `${c.darkBg} ${c.darkText}` : `${c.bg} ${c.text}`}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DealsPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { setActiveTab: navigate } = useNavigation();
  const isDark = theme === 'dark';

  // Data state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelineDeals, setPipelineDeals] = useState<Deal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Summary counts
  const [dealSummary, setDealSummary] = useState<{ total: number; cold: number; proposal: number; negotiation: number; closedWon: number; closedLost: number }>({ total: 0, cold: 0, proposal: 0, negotiation: 0, closedWon: 0, closedLost: 0 });

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('table');

  // Pagination (table view)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterAccount, setFilterAccount] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isPipelineLoading, setIsPipelineLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableError, setTableError] = useState('');

  // Drag-and-drop state
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Deal form modal
  const [showDealModal, setShowDealModal] = useState(false);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [dealFormData, setDealFormData] = useState<DealFormData>({ ...EMPTY_DEAL_FORM });
  const [dealFormError, setDealFormError] = useState('');

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailDeal, setDetailDeal] = useState<Deal | null>(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Stage update from detail modal
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);


  // Summarise (per-deal) modal
  const [showSummariseModal, setShowSummariseModal] = useState(false);
  const [summariseDeal, setSummariseDeal] = useState<Deal | null>(null);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<ActivityLog[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // Manual activity entry
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
  });

  // Inline quote builder state (inside deal detail for Channel tag)
  interface InlineLineItem {
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPct: number;
  }
  const emptyLineItem: InlineLineItem = { productId: '', description: '', quantity: 1, unitPrice: 0, discountPct: 0 };
  const [inlineQuoteOpen, setInlineQuoteOpen] = useState(false);
  const [inlineLineItems, setInlineLineItems] = useState<InlineLineItem[]>([{ ...emptyLineItem }]);
  const [inlineTaxRate, setInlineTaxRate] = useState(18);
  const [inlineQuoteNotes, setInlineQuoteNotes] = useState('');
  const [inlineQuoteTerms, setInlineQuoteTerms] = useState('');
  const [inlineQuoteSaving, setInlineQuoteSaving] = useState(false);
  const [inlineQuoteError, setInlineQuoteError] = useState('');
  const [inlineQuoteSuccess, setInlineQuoteSuccess] = useState('');


  // ---------------------------------------------------------------------------
  // Styling helpers
  // ---------------------------------------------------------------------------

  const { colWidths: dealColWidths, onMouseDown: onDealMouseDown } = useColumnResize({
    initialWidths: [45, 170, 150, 130, 130, 220, 130, 120, 110, 100, 160, 160, 120, 120, 70],
  });

  const cardClass = `premium-card ${isDark ? '' : 'shadow-soft'}`;
  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm transition-all ${
    isDark
      ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
  } focus:outline-none focus:ring-1 focus:ring-brand-500`;
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchDeals = useCallback(async () => {
    setIsLoading(true);
    setTableError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (filterStage) params.stage = filterStage;
      if (filterAccount) params.accountId = filterAccount;
      if (searchTerm) params.search = searchTerm;

      const response: PaginatedResponse<Deal> = await dealsApi.list(params);
      setDeals(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);
    } catch (err: any) {
      setTableError(err.message || 'Failed to load deals');
      setDeals([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterStage, filterAccount, searchTerm]);

  const fetchPipelineDeals = useCallback(async () => {
    setIsPipelineLoading(true);
    try {
      const data = await dealsApi.pipeline();
      const allDeals: Deal[] = Array.isArray(data) ? data : (data?.data ?? []);
      setPipelineDeals(allDeals);
    } catch {
      setPipelineDeals([]);
    } finally {
      setIsPipelineLoading(false);
    }
  }, []);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [accountsResponse, contactsResponse, productsList] = await Promise.all([
        accountsApi.list({ limit: '100' }),
        contactsApi.list({ limit: '100' }),
        productsApi.list(),
      ]);
      const acctData = accountsResponse?.data ?? accountsResponse;
      setAccounts(Array.isArray(acctData) ? acctData : []);
      const contData = contactsResponse?.data ?? contactsResponse;
      setContacts(Array.isArray(contData) ? contData : []);
      setProducts(Array.isArray(productsList) ? productsList : []);
    } catch {
      // Dropdown data failure is non-critical
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  // Fetch based on view mode — always fetch pipeline for summary cards
  useEffect(() => {
    fetchPipelineDeals();
    if (viewMode === 'table') {
      fetchDeals();
    }
  }, [viewMode, fetchDeals, fetchPipelineDeals]);

  // Compute deal summary counts from pipelineDeals
  useEffect(() => {
    const cold = pipelineDeals.filter(d => d.stage === 'Cold').length;
    const proposal = pipelineDeals.filter(d => d.stage === 'Proposal').length;
    const negotiation = pipelineDeals.filter(d => d.stage === 'Negotiation').length;
    const closedWon = pipelineDeals.filter(d => d.stage === 'Closed Won').length;
    const closedLost = pipelineDeals.filter(d => d.stage === 'Closed Lost').length;
    setDealSummary({ total: pipelineDeals.length, cold, proposal, negotiation, closedWon, closedLost });
  }, [pipelineDeals]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterStage, filterAccount, searchTerm]);

  // ---------------------------------------------------------------------------
  // Deal form handlers
  // ---------------------------------------------------------------------------

  const openCreateDealModal = () => {
    setDealFormData({ ...EMPTY_DEAL_FORM });
    setEditingDealId(null);
    setDealFormError('');
    setShowDealModal(true);
  };

  const openEditDealModal = (deal: Deal) => {
    setDealFormData({
      accountId: deal.accountId || '',
      value: deal.value || 0,
      stage: deal.stage,
      closingDate: deal.closingDate ? deal.closingDate.split('T')[0] : '',
      description: deal.description || '',
      contactId: deal.contactId || '',
      nextStep: deal.nextStep || '',
      forecast: deal.forecast || 'Pipeline',
      type: deal.type || 'New Business',
      leadSource: deal.leadSource || '',
      tag: deal.tag || '',
      contactNo: deal.contactNo || '',
      designation: deal.designation || '',
      email: deal.email || '',
      location: deal.location || '',
      nextFollowUp: deal.nextFollowUp ? deal.nextFollowUp.split('T')[0] : '',
      probability: deal.probability ?? 0,
      requirement: deal.requirement || '',
      quotedRequirement: deal.quotedRequirement || '',
    });
    setEditingDealId(deal.id);
    setDealFormError('');
    setShowDealModal(true);
  };

  const closeDealModal = () => {
    setShowDealModal(false);
    setEditingDealId(null);
    setDealFormError('');
  };

  const openDealDetailModal = async (deal: Deal) => {
    setDetailDeal(deal);
    setShowDetailModal(true);
    setAuditLogs([]);
    setActivities([]);

    setIsAuditLoading(true);
    try {
      const [auditData, actData] = await Promise.all([
        dealsApi.getAuditLog(deal.id),
        dealsApi.getActivities(deal.id),
      ]);
      setAuditLogs(Array.isArray(auditData) ? auditData : []);
      setActivities(Array.isArray(actData) ? actData : []);
    } catch (err) { console.error('Failed to load audit logs', err); }
    setIsAuditLoading(false);
  };

  const closeDealDetailModal = () => {
    setShowDetailModal(false);
    setDetailDeal(null);
    resetInlineQuote();
    setActivityType('note');
    setActivityTitle('');
    setActivityDesc('');
  };

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

  const resetInlineQuote = () => {
    setInlineQuoteOpen(false);
    setInlineLineItems([{ ...emptyLineItem }]);
    setInlineTaxRate(18);
    setInlineQuoteNotes('');
    setInlineQuoteTerms('');
    setInlineQuoteError('');
    setInlineQuoteSuccess('');
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
    const validItems = inlineLineItems.filter(li => li.productId && li.quantity > 0 && li.unitPrice > 0);
    if (validItems.length === 0) {
      setInlineQuoteError('Add at least one line item with product, quantity, and price');
      return;
    }

    setInlineQuoteSaving(true);
    setInlineQuoteError('');
    try {
      const lineItems = validItems.map((li, idx) => ({
        productId: li.productId,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        discountPct: li.discountPct,
        lineTotal: li.quantity * li.unitPrice * (1 - li.discountPct / 100),
        sortOrder: idx,
      }));
      const subtotal = lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
      const taxAmount = subtotal * (inlineTaxRate / 100);

      await quotesApi.create({
        customerName: detailDeal.accountName || detailDeal.company || 'Deal',
        leadId: detailDeal.id,
        validUntil: null,
        taxRate: inlineTaxRate,
        discountAmount: 0,
        subtotal,
        taxAmount,
        totalAmount: subtotal + taxAmount,
        terms: inlineQuoteTerms,
        notes: inlineQuoteNotes,
        status: 'draft',
        lineItems,
      });
      setInlineQuoteSuccess('Quote created successfully!');
      setTimeout(() => setInlineQuoteSuccess(''), 3000);
      setInlineLineItems([{ ...emptyLineItem }]);
      setInlineQuoteNotes('');
      setInlineQuoteTerms('');
    } catch (err: any) {
      setInlineQuoteError(err.message || 'Failed to create quote');
    } finally {
      setInlineQuoteSaving(false);
    }
  };

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

    if (!dealFormData.value) {
      setDealFormError('Deal value is required');
      return;
    }

    // Intercept Closed Won stage change → show popup
    if (dealFormData.stage === 'Closed Won') {
      const isAlreadyClosedWon = editingDealId && deals.find(d => d.id === editingDealId)?.stage === 'Closed Won';
      if (!isAlreadyClosedWon) {
        const acct = accounts.find(a => a.id === dealFormData.accountId);
        const payload: any = { ...dealFormData, title: acct?.name || 'Deal' };
        if (!payload.accountId) delete payload.accountId;
        if (!payload.contactId) delete payload.contactId;
        if (!payload.closingDate) delete payload.closingDate;
        setClosedWonDealId(editingDealId);
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
        });
        setShowClosedWonModal(true);
        closeDealModal();
        return;
      }
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

      if (editingDealId) {
        await dealsApi.update(editingDealId, payload);
      } else {
        await dealsApi.create({ ...payload, ownerId: user?.id });
      }
      closeDealModal();
      refreshData();
    } catch (err: any) {
      setDealFormError(err.message || 'Failed to save deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Stage update from detail modal
  // ---------------------------------------------------------------------------

  const handleUpdateStage = async (newStage: DealStage) => {
    if (!detailDeal || detailDeal.stage === newStage) return;

    // Intercept Closed Won → show sales order form popup
    if (newStage === 'Closed Won') {
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
      });
      setShowClosedWonModal(true);
      closeDealDetailModal();
      return;
    }

    setIsUpdatingStage(true);
    try {
      const updated = await dealsApi.update(detailDeal.id, { stage: newStage });
      setDetailDeal(updated);
      refreshData();
    } catch {
      // Fail silently
    } finally {
      setIsUpdatingStage(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Stage move handler (pipeline)
  // ---------------------------------------------------------------------------

  const handleMoveStage = async (deal: Deal, newStage: DealStage) => {
    if (deal.stage === newStage) return;

    // Intercept Closed Won → show popup
    if (newStage === 'Closed Won') {
      setClosedWonDealId(deal.id);
      setClosedWonPayload({ stage: 'Closed Won', value: deal.value, accountId: deal.accountId, title: deal.accountName || 'Deal' });
      setClosedWonDescription(deal.description || '');
      setClosedWonOrderForm({
        customerName: deal.accountName || '',
        quantity: 1,
        amount: deal.value || 0,
        poNumber: '',
        invoiceNo: '',
        paymentStatus: 'pending',
        saleDate: new Date().toISOString().split('T')[0],
      });
      setShowClosedWonModal(true);
      return;
    }

    try {
      await dealsApi.update(deal.id, {
        stage: newStage,
      });
      refreshData();
    } catch {
      // Fail silently
    }
  };

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------

  const handleDelete = async (id: string) => {
    try {
      await dealsApi.delete(id);
      setDeleteConfirmId(null);
      refreshData();
    } catch (err: any) {
      setTableError(err.message || 'Failed to delete deal');
    }
  };

  // ---------------------------------------------------------------------------
  // Refresh helper
  // ---------------------------------------------------------------------------

  const refreshData = () => {
    if (viewMode === 'table') {
      fetchDeals();
    } else {
      fetchPipelineDeals();
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
  };

  const handleClosedWonSubmit = async () => {
    if (!closedWonOrderForm.customerName.trim()) {
      setClosedWonError('Customer name is required');
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

      // Create Sales Entry from order form
      await salesApi.create({
        salespersonId: user?.id,
        customerName: closedWonOrderForm.customerName,
        quantity: closedWonOrderForm.quantity,
        amount: closedWonOrderForm.amount,
        poNumber: closedWonOrderForm.poNumber || undefined,
        invoiceNo: closedWonOrderForm.invoiceNo || undefined,
        paymentStatus: closedWonOrderForm.paymentStatus,
        saleDate: closedWonOrderForm.saleDate,
        notes: closedWonDescription ? `Deal closed: ${closedWonDescription}` : undefined,
      });

      closeClosedWonModal();
      refreshData();
    } catch (err: any) {
      setClosedWonError(err.message || 'Failed to complete deal');
    } finally {
      setClosedWonSaving(false);
    }
  };


  const renderReadCell = (deal: Deal, colKey: string) => {
    switch (colKey) {
      case 'accountId':
        return <span className="font-medium truncate block max-w-[200px]">{deal.accountName || '-'}</span>;
      case 'value':
        return <span className="font-semibold whitespace-nowrap">{deal.value ? formatINR(deal.value) : '-'}</span>;
      case 'stage':
        return <span className={stageBadge(deal.stage, isDark)}>{deal.stage}</span>;
      case 'closingDate':
        return <span className="whitespace-nowrap">{deal.closingDate ? formatDate(deal.closingDate) : '-'}</span>;
      case 'type':
        return deal.type || '-';
      case 'tag':
        if (!deal.tag) return '-';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            deal.tag === 'Channel'
              ? (isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-700')
              : (isDark ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-50 text-teal-700')
          }`}>
            {deal.tag}
          </span>
        );
      default: return '-';
    }
  };

  // ---------------------------------------------------------------------------
  // Misc helpers
  // ---------------------------------------------------------------------------

  const clearFilters = () => {
    setFilterStage('');
    setFilterAccount('');
    setSearchTerm('');
  };

  const hasActiveFilters = filterStage || filterAccount || searchTerm;

  // ---------------------------------------------------------------------------
  // Render: Toolbar
  // ---------------------------------------------------------------------------

  const renderToolbar = () => (
    <div className={`${cardClass} p-4`}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* View Toggle */}
        <div className={`flex items-center rounded-xl border p-0.5 ${
          isDark ? 'border-zinc-700 bg-dark-100' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'table'
                ? 'bg-brand-600 text-white shadow-sm'
                : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Table
          </button>
          <button
            onClick={() => setViewMode('pipeline')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'pipeline'
                ? 'bg-brand-600 text-white shadow-sm'
                : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Kanban Board
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            isDark ? 'text-zinc-500' : 'text-slate-400'
          }`} />
          <input
            type="text"
            placeholder="Search deals..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
              isDark
                ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
            } focus:outline-none focus:ring-1 focus:ring-brand-500`}
          />
        </div>

        {/* Filter: Stage */}
        <div className="w-full lg:w-44">
          <select
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
            className={selectClass}
          >
            <option value="">All Stages</option>
            {DEAL_STAGES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Filter: Account */}
        <div className="w-full lg:w-44">
          <select
            value={filterAccount}
            onChange={e => setFilterAccount(e.target.value)}
            className={selectClass}
          >
            <option value="">All Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              isDark
                ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}

        {/* Bulk Import */}
        <button
          onClick={() => setShowBulkImport(true)}
          title="Import from CSV"
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-normal transition-colors whitespace-nowrap ${
            isDark
              ? 'text-zinc-400 border border-zinc-700 hover:bg-zinc-800'
              : 'text-slate-500 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Upload className="w-4 h-4" />
          Import
        </button>

        {/* Export CSV */}
        <button
          onClick={() => exportToCsv('deals', [
            { header: 'Company', accessor: (r: Deal) => r.company || r.accountName },
            { header: 'Contact Name', accessor: (r: Deal) => r.contactName },
            { header: 'Contact No', accessor: (r: Deal) => r.contactNo },
            { header: 'Designation', accessor: (r: Deal) => r.designation },
            { header: 'Email', accessor: (r: Deal) => r.email },
            { header: 'Location', accessor: (r: Deal) => r.location },
            { header: 'Stage', accessor: (r: Deal) => r.stage },
            { header: 'Value', accessor: (r: Deal) => r.value },
            { header: 'Type', accessor: (r: Deal) => r.tag },
            { header: 'Requirement', accessor: (r: Deal) => r.requirement },
            { header: 'Quoted Requirement', accessor: (r: Deal) => r.quotedRequirement },
            { header: 'Follow-up Date', accessor: (r: Deal) => r.nextFollowUp },
            { header: 'Closing Date', accessor: (r: Deal) => r.closingDate },
            { header: 'Type', accessor: (r: Deal) => r.type },
            { header: 'Forecast', accessor: (r: Deal) => r.forecast },
            { header: 'Lead Source', accessor: (r: Deal) => r.leadSource },
            { header: 'Owner', accessor: (r: Deal) => r.ownerName },
            { header: 'Next Step', accessor: (r: Deal) => r.nextStep },
            { header: 'Description', accessor: (r: Deal) => r.description },
          ], deals)}
          disabled={deals.length === 0}
          title="Export to Excel"
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-normal transition-colors whitespace-nowrap ${
            isDark
              ? 'text-zinc-400 border border-zinc-700 hover:bg-zinc-800 disabled:opacity-30'
              : 'text-slate-500 border border-slate-200 hover:bg-slate-50 disabled:opacity-30'
          }`}
        >
          <Download className="w-4 h-4" />
          Export
        </button>

        {/* New Deal */}
        <button
          onClick={openCreateDealModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Deal
        </button>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Table View
  // ---------------------------------------------------------------------------

  const renderTableView = () => {
    const cellBase = `px-3 py-2.5 text-sm ${isDark ? 'border-zinc-800' : 'border-slate-100'}`;
    const hdrCell = `px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400 bg-dark-100' : 'text-slate-500 bg-slate-50'}`;

    return (
      <div className={`${cardClass} overflow-hidden`}>
        {tableError && (
          <div className={`m-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
            isDark
              ? 'bg-red-900/20 border border-red-800 text-red-400'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {tableError}
          </div>
        )}

        {/* Record count */}
        {totalRecords > 0 && (
          <div className={`px-4 py-2 text-xs ${isDark ? 'text-zinc-500 border-b border-zinc-800' : 'text-slate-400 border-b border-slate-100'}`}>
            {totalRecords} deal{totalRecords !== 1 ? 's' : ''} total
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Loading deals...
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="premium-table" style={{ minWidth: dealColWidths.reduce((a, b) => a + b, 0) }}>
                <thead>
                  <tr className={`border-b ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
                    {['#', 'Company', 'Contact Name', 'Contact No', 'Designation', 'Email', 'Location', 'Stage', 'Value', 'Type', 'Requirement', 'Quoted Requirement', 'Assignee', 'Follow-up Date', 'Summarise'].map((label, i) => (
                      <th
                        key={label}
                        className={`${hdrCell} resizable-th ${i === 0 || i === 14 ? 'text-center' : ''}`}
                        style={{ width: dealColWidths[i] }}
                      >
                        {label}
                        <div className="col-resize-handle" onMouseDown={e => onDealMouseDown(i, e)} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deals.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="py-16 text-center">
                        <Briefcase className={`w-8 h-8 mx-auto ${isDark ? 'text-zinc-700' : 'text-slate-300'}`} />
                        <p className={`mt-2 text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                          {hasActiveFilters ? 'No deals match filters' : 'No deals yet'}
                        </p>
                      </td>
                    </tr>
                  ) : deals.map((deal, idx) => (
                    <tr
                      key={deal.id}
                      onClick={() => openDealDetailModal(deal)}
                      className={`border-b cursor-pointer transition-colors ${
                        isDark
                          ? 'border-zinc-800 hover:bg-zinc-800/50'
                          : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      {/* # */}
                      <td className={`${cellBase} text-center ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      {/* Company */}
                      <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        <span className="font-medium">{deal.company || deal.accountName || '-'}</span>
                      </td>
                      {/* Contact Name */}
                      <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {deal.contactName || '-'}
                      </td>
                      {/* Contact No */}
                      <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {deal.contactNo || '-'}
                      </td>
                      {/* Designation */}
                      <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {deal.designation || '-'}
                      </td>
                      {/* Email */}
                      <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        <span className="truncate block max-w-[140px]">{deal.email || '-'}</span>
                      </td>
                      {/* Location */}
                      <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {deal.location || '-'}
                      </td>
                      {/* Stage */}
                      <td className={`${cellBase}`}>
                        {renderReadCell(deal, 'stage')}
                      </td>
                      {/* Value */}
                      <td className={`${cellBase}`}>
                        {renderReadCell(deal, 'value')}
                      </td>
                      {/* Type */}
                      <td className={`${cellBase}`}>
                        {renderReadCell(deal, 'tag')}
                      </td>
                      {/* Requirement */}
                      <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        <span className="truncate block max-w-[150px]">{deal.requirement || '-'}</span>
                      </td>
                      {/* Quoted Requirement */}
                      <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        <span className="truncate block max-w-[150px]">{deal.quotedRequirement || '-'}</span>
                      </td>
                      {/* Assignee */}
                      <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {deal.ownerName || '-'}
                      </td>
                      {/* Follow-up Date */}
                      <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {deal.nextFollowUp ? formatDate(deal.nextFollowUp) : '-'}
                      </td>
                      {/* Summarise */}
                      <td className={`${cellBase} text-center`}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSummariseDeal(deal); setShowSummariseModal(true); }}
                          title="Summarise"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark
                              ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20'
                              : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {deals.length > 0 && (
              <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t ${
                isDark ? 'border-zinc-800' : 'border-slate-100'
              }`}>
                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Showing {(page - 1) * PAGE_SIZE + 1}
                  {' '}&ndash;{' '}
                  {Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords} deals
                </p>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      isDark
                        ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => {
                      if (p === 1 || p === totalPages) return true;
                      if (Math.abs(p - page) <= 1) return true;
                      return false;
                    })
                    .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                      if (idx > 0) {
                        const prev = arr[idx - 1];
                        if (p - prev > 1) acc.push('ellipsis');
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === 'ellipsis' ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className={`px-1 text-xs ${isDark ? 'text-zinc-600' : 'text-slate-300'}`}
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setPage(item as number)}
                          className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors ${
                            page === item
                              ? 'bg-brand-600 text-white'
                              : isDark
                                ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      isDark
                        ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Pipeline / Kanban View
  // ---------------------------------------------------------------------------

  const renderPipelineCard = (deal: Deal) => {
    const nextStage = NEXT_STAGE[deal.stage];

    return (
      <div
        key={deal.id}
        draggable
        onDragStart={e => { e.dataTransfer.setData('text/plain', deal.id); setDraggedDealId(deal.id); }}
        onDragEnd={() => { setDraggedDealId(null); setDragOverStage(null); }}
        onClick={() => openDealDetailModal(deal)}
        className={`p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
          draggedDealId === deal.id ? 'opacity-40 scale-95' : ''
        } ${
          isDark
            ? 'bg-dark-100 border-zinc-700 hover:border-zinc-600'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        {/* Account & Edit */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h4 className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {deal.accountName || 'Untitled Deal'}
          </h4>
          <button
            onClick={(e) => { e.stopPropagation(); openEditDealModal(deal); }}
            className={`p-1 rounded-lg flex-shrink-0 transition-colors ${
              isDark ? 'text-zinc-500 hover:text-brand-400 hover:bg-brand-900/20' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
            }`}
          >
            <Edit2 className="w-3 h-3" />
          </button>
        </div>

        {/* Value */}
        {deal.value ? (
          <p className={`text-xs font-semibold mb-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {formatINR(deal.value)}
          </p>
        ) : null}

        {/* Contact Person */}
        {deal.contactName && (
          <p className={`text-[11px] flex items-center gap-1 mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            <UserIcon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{deal.contactName}</span>
          </p>
        )}

        {/* Owner */}
        {deal.ownerName && (
          <p className={`text-[11px] flex items-center gap-1 mb-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
            <Briefcase className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{deal.ownerName}</span>
          </p>
        )}

        {/* Closing Date & Probability */}
        <div className="flex items-center gap-2 flex-wrap">
          {deal.closingDate && (
            <p className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              <Calendar className="w-3 h-3" />
              {formatDate(deal.closingDate)}
            </p>
          )}
          {deal.probability != null && deal.probability > 0 && (
            <p className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              <Target className="w-3 h-3" />
              {deal.probability}%
            </p>
          )}
        </div>

        {/* Move to next stage button */}
        {nextStage && (
          <div className={`pt-2 mt-2 border-t border-dashed ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
            <button
              onClick={(e) => { e.stopPropagation(); handleMoveStage(deal, nextStage); }}
              className={`w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                isDark
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <ArrowRight className="w-3 h-3" />
              Move to {nextStage}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderPipelineView = () => {
    if (isPipelineLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Loading kanban board...
          </p>
        </div>
      );
    }

    // Group pipeline deals by stage
    const groupedDeals: Record<string, Deal[]> = {};
    DEAL_STAGES.forEach(s => { groupedDeals[s] = []; });
    pipelineDeals.forEach(deal => {
      if (groupedDeals[deal.stage]) {
        groupedDeals[deal.stage].push(deal);
      }
    });

    // Apply search filter to pipeline
    const filterDeal = (deal: Deal): boolean => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!(deal.accountName || '').toLowerCase().includes(q)) return false;
      }
      if (filterAccount && deal.accountId !== filterAccount) return false;
      return true;
    };

    return (
      <div className="overflow-x-auto">
        {/* All 5 stages as kanban columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-w-[900px]">
          {DEAL_STAGES.map(stage => {
            const stageDeals = (groupedDeals[stage] || []).filter(filterDeal);
            const c = STAGE_COLORS[stage] || STAGE_COLORS['Cold'];
            const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
            const isOver = dragOverStage === stage;
            const isTerminal = stage === 'Closed Won' || stage === 'Closed Lost';
            return (
              <div
                key={stage}
                onDragOver={e => { e.preventDefault(); setDragOverStage(stage); }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={e => {
                  e.preventDefault();
                  setDragOverStage(null);
                  const dealId = e.dataTransfer.getData('text/plain');
                  if (!dealId) return;
                  const deal = pipelineDeals.find(d => d.id === dealId);
                  if (deal && deal.stage !== stage) {
                    handleMoveStage(deal, stage as DealStage);
                  }
                }}
                className={`${cardClass} p-3 min-h-[200px] transition-all ${isOver ? 'ring-2 ring-brand-500 ring-inset' : ''} ${
                  isTerminal ? (stage === 'Closed Won'
                    ? (isDark ? 'border-emerald-900/50' : 'border-emerald-200')
                    : (isDark ? 'border-red-900/50' : 'border-red-200')
                  ) : ''
                }`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isTerminal ? (
                      stage === 'Closed Won'
                        ? <CheckCircle className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        : <XCircle className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                    ) : (
                      <div className={`w-2 h-2 rounded-full ${isDark ? c.darkText.replace('text-', 'bg-') : c.text.replace('text-', 'bg-')}`} />
                    )}
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stage}</h3>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {stageDeals.length}
                  </span>
                </div>

                {/* Stage total */}
                {stageTotal > 0 && (
                  <p className={`text-xs font-semibold mb-3 ${
                    stage === 'Closed Lost'
                      ? (isDark ? 'text-red-400' : 'text-red-600')
                      : (isDark ? 'text-emerald-400' : 'text-emerald-600')
                  }`}>
                    {formatINR(stageTotal)}
                  </p>
                )}

                {/* Cards */}
                <div className="space-y-2">
                  {stageDeals.length === 0 ? (
                    <p className={`text-xs text-center py-6 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`}>
                      {isOver ? 'Drop here' : 'No deals'}
                    </p>
                  ) : (
                    stageDeals.map(deal => renderPipelineCard(deal))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Deal Detail Modal
  // ---------------------------------------------------------------------------

  const renderDealDetailModal = () => {
    if (!showDetailModal || !detailDeal) return null;
    const deal = detailDeal;
    const stageColor = STAGE_COLORS[deal.stage] || STAGE_COLORS['Cold'];

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 animate-backdrop" onClick={closeDealDetailModal} />
        <div className={`relative w-full max-w-2xl max-h-[85vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
          isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
        }`}>
          {/* Header */}
          <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <h2 className={`text-lg font-semibold font-display truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {deal.accountName || 'Deal Details'}
              </h2>
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className={`text-xs font-medium whitespace-nowrap ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Stage:</label>
                <select
                  value={deal.stage}
                  onChange={e => handleUpdateStage(e.target.value as DealStage)}
                  disabled={isUpdatingStage}
                  className={`px-2 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    isDark
                      ? `${stageColor.darkBg} ${stageColor.darkText} border-zinc-700 bg-dark-100`
                      : `${stageColor.bg} ${stageColor.text} border-slate-200`
                  } focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50`}
                >
                  {DEAL_STAGES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {isUpdatingStage && <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => { closeDealDetailModal(); openEditDealModal(deal); }}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              {deleteConfirmId === deal.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { handleDelete(deal.id); closeDealDetailModal(); }}
                    className="px-2 py-1 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                      isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirmId(deal.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'text-zinc-400 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={closeDealDetailModal}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Deal Value Highlight */}
              {deal.value ? (
                <div className={`flex items-center gap-3 p-4 rounded-xl ${
                  isDark ? 'bg-emerald-900/10 border border-emerald-900/30' : 'bg-emerald-50 border border-emerald-100'
                }`}>
                  <IndianRupee className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <div>
                    <p className={`text-xs font-medium ${isDark ? 'text-emerald-400/70' : 'text-emerald-600/70'}`}>Deal Value</p>
                    <p className={`text-xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{formatINR(deal.value)}</p>
                  </div>
                </div>
              ) : null}

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailInfoRow label="Account" value={deal.accountName} isDark={isDark} icon={<Building2 className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Contact" value={deal.contactName} isDark={isDark} icon={<UserIcon className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Contact No" value={deal.contactNo} isDark={isDark} icon={<Phone className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Email" value={deal.email} isDark={isDark} icon={<Mail className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Designation" value={deal.designation} isDark={isDark} icon={<Briefcase className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Location" value={deal.location} isDark={isDark} icon={<MapPin className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Owner" value={deal.ownerName} isDark={isDark} icon={<UserIcon className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Closing Date" value={deal.closingDate ? formatDate(deal.closingDate) : undefined} isDark={isDark} icon={<Calendar className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Type" value={deal.type} isDark={isDark} icon={<Briefcase className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Type" value={deal.tag} isDark={isDark} icon={<Layers className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Forecast" value={deal.forecast} isDark={isDark} icon={<Target className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Lead Source" value={deal.leadSource} isDark={isDark} icon={<TrendingUp className="w-3.5 h-3.5" />} />
              </div>

              {/* Requirements */}
              {(deal.requirement || deal.quotedRequirement) && (
                <div className="space-y-3">
                  <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Requirements
                  </h4>
                  {deal.requirement && (
                    <div>
                      <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Requirement (User Provided)</span>
                      <p className={`text-sm whitespace-pre-wrap mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {deal.requirement}
                      </p>
                    </div>
                  )}
                  {deal.quotedRequirement && (
                    <div>
                      <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Quoted Requirement (What We Serve)</span>
                      <p className={`text-sm whitespace-pre-wrap mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {deal.quotedRequirement}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Next Step */}
              {deal.nextStep && (
                <div>
                  <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Next Step
                  </h4>
                  <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{deal.nextStep}</p>
                </div>
              )}

              {/* Description */}
              {deal.description && (
                <div>
                  <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Description
                  </h4>
                  <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{deal.description}</p>
                </div>
              )}

              {/* Inline Quote Builder — End Customer only */}
              {deal.tag === 'End Customer' && (
                <div>
                  <button
                    onClick={() => setInlineQuoteOpen(prev => !prev)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isDark
                        ? 'border-indigo-800 bg-indigo-900/10 hover:bg-indigo-900/20 text-indigo-400'
                        : 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-semibold">Quote Builder</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${inlineQuoteOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {inlineQuoteOpen && (
                    <div className={`mt-3 p-4 rounded-xl border space-y-4 ${
                      isDark ? 'border-zinc-800 bg-dark-100' : 'border-slate-200 bg-slate-50'
                    }`}>
                      {inlineQuoteError && (
                        <div className={`p-2 rounded-lg flex items-center gap-2 text-xs ${
                          isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
                        }`}>
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          {inlineQuoteError}
                        </div>
                      )}
                      {inlineQuoteSuccess && (
                        <div className={`p-2 rounded-lg flex items-center gap-2 text-xs ${
                          isDark ? 'bg-emerald-900/20 border border-emerald-800 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        }`}>
                          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          {inlineQuoteSuccess}
                        </div>
                      )}

                      {/* Line Items */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                            Line Items
                          </h5>
                        </div>
                        {inlineLineItems.map((li, idx) => (
                          <div key={idx} className={`p-3 rounded-lg border space-y-2 ${
                            isDark ? 'border-zinc-700 bg-dark-50' : 'border-slate-200 bg-white'
                          }`}>
                            <div className="flex items-center justify-between gap-2">
                              <select
                                value={li.productId}
                                onChange={e => handleInlineLineItemChange(idx, 'productId', e.target.value)}
                                className={`flex-1 px-2 py-1.5 rounded-lg border text-xs ${
                                  isDark ? 'bg-dark-100 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                                }`}
                              >
                                <option value="">Select product...</option>
                                {products.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                              {inlineLineItems.length > 1 && (
                                <button
                                  onClick={() => setInlineLineItems(prev => prev.filter((_, i) => i !== idx))}
                                  className={`p-1 rounded-lg transition-colors ${
                                    isDark ? 'text-zinc-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'
                                  }`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder="Description"
                              value={li.description}
                              onChange={e => handleInlineLineItemChange(idx, 'description', e.target.value)}
                              className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                                isDark ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                              }`}
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Qty</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={li.quantity}
                                  onChange={e => handleInlineLineItemChange(idx, 'quantity', Number(e.target.value) || 0)}
                                  className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                                    isDark ? 'bg-dark-100 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                                  }`}
                                />
                              </div>
                              <div>
                                <label className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Unit Price</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={li.unitPrice}
                                  onChange={e => handleInlineLineItemChange(idx, 'unitPrice', Number(e.target.value) || 0)}
                                  className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                                    isDark ? 'bg-dark-100 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                                  }`}
                                />
                              </div>
                              <div>
                                <label className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Disc %</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={li.discountPct}
                                  onChange={e => handleInlineLineItemChange(idx, 'discountPct', Number(e.target.value) || 0)}
                                  className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                                    isDark ? 'bg-dark-100 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                                  }`}
                                />
                              </div>
                            </div>
                            <div className={`text-right text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                              Line Total: {formatINR(li.quantity * li.unitPrice * (1 - li.discountPct / 100))}
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={() => setInlineLineItems(prev => [...prev, { ...emptyLineItem }])}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isDark ? 'text-zinc-400 border border-zinc-700 hover:bg-zinc-800' : 'text-slate-500 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Plus className="w-3 h-3" /> Add Item
                        </button>
                      </div>

                      {/* Tax & Notes */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-[10px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Tax Rate %</label>
                          <input
                            type="number"
                            min="0"
                            value={inlineTaxRate}
                            onChange={e => setInlineTaxRate(Number(e.target.value) || 0)}
                            className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                              isDark ? 'bg-dark-100 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                            }`}
                          />
                        </div>
                        <div className={`flex flex-col justify-end text-right text-xs space-y-0.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {(() => {
                            const subtotal = inlineLineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice * (1 - li.discountPct / 100), 0);
                            const tax = subtotal * (inlineTaxRate / 100);
                            return (
                              <>
                                <span>Subtotal: {formatINR(subtotal)}</span>
                                <span>Tax: {formatINR(tax)}</span>
                                <span className="font-bold text-sm">Total: {formatINR(subtotal + tax)}</span>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      <div>
                        <label className={`text-[10px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Notes</label>
                        <textarea
                          rows={2}
                          placeholder="Quote notes..."
                          value={inlineQuoteNotes}
                          onChange={e => setInlineQuoteNotes(e.target.value)}
                          className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                            isDark ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`text-[10px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Terms & Conditions</label>
                        <textarea
                          rows={2}
                          placeholder="Terms..."
                          value={inlineQuoteTerms}
                          onChange={e => setInlineQuoteTerms(e.target.value)}
                          className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                            isDark ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                          }`}
                        />
                      </div>

                      {/* Submit */}
                      <button
                        onClick={handleInlineQuoteSubmit}
                        disabled={inlineQuoteSaving}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                      >
                        {inlineQuoteSaving ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...</>
                        ) : (
                          <><FileText className="w-3.5 h-3.5" /> Create Quote</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Add Activity */}
              <div>
                <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  <MessageSquare className="w-3.5 h-3.5" /> Add Activity
                </h4>
                <div className={`p-3 rounded-xl border space-y-2 ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50'}`}>
                  <div className="flex gap-2">
                    <select
                      value={activityType}
                      onChange={e => setActivityType(e.target.value)}
                      className={`text-xs px-2 py-1.5 rounded-lg border appearance-none cursor-pointer ${
                        isDark ? 'bg-dark-100 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                      } focus:outline-none focus:border-brand-500`}
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
                      onKeyDown={e => e.key === 'Enter' && handleAddDealActivity()}
                      className={`flex-1 text-xs px-2 py-1.5 rounded-lg border ${
                        isDark ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                      } focus:outline-none focus:border-brand-500`}
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Description (optional)..."
                    value={activityDesc}
                    onChange={e => setActivityDesc(e.target.value)}
                    className={`w-full text-xs px-2 py-1.5 rounded-lg border resize-none ${
                      isDark ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    } focus:outline-none focus:border-brand-500`}
                  />
                  <button
                    onClick={handleAddDealActivity}
                    disabled={!activityTitle.trim() || isAddingActivity}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                  >
                    {isAddingActivity ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    {isAddingActivity ? 'Adding...' : 'Add Activity'}
                  </button>
                </div>
              </div>

              {/* Activities */}
              {activities.length > 0 && (
                <div>
                  <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Activities
                  </h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {activities.map((act: any) => (
                      <div
                        key={act.id}
                        className={`p-3 rounded-xl border text-xs ${
                          isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                            {act.title}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {act.activityType || act.activity_type}
                          </span>
                        </div>
                        {act.description && (
                          <p className={`${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{act.description}</p>
                        )}
                        <div className={`flex items-center justify-between mt-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
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
                <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Audit Trail
                </h4>
                {isAuditLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <p className={`text-sm py-4 text-center ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                    No audit history
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {auditLogs.map(log => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-xl border text-xs ${
                          isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                            {log.action}
                          </span>
                          <span className={isDark ? 'text-zinc-600' : 'text-slate-400'}>
                            {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        {log.userName && (
                          <p className={isDark ? 'text-zinc-500' : 'text-slate-400'}>
                            by {log.userName}
                          </p>
                        )}
                        {log.changes && log.changes.length > 0 && (
                          <div className={`mt-1 space-y-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
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
              <div className={`flex items-center gap-4 text-[11px] pt-2 border-t ${
                isDark ? 'border-zinc-800 text-zinc-600' : 'border-slate-100 text-slate-400'
              }`}>
                {deal.createdAt && <span>Created: {formatDate(deal.createdAt)}</span>}
                {deal.updatedAt && <span>Updated: {formatDate(deal.updatedAt)}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Create/Edit Deal Modal
  // ---------------------------------------------------------------------------

  const renderDealModal = () => {
    if (!showDealModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] overflow-y-auto p-4">
        <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeDealModal} />
        <div className={`relative w-full max-w-xl max-h-[85vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
          isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
        }`}>
          {/* Header */}
          <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {editingDealId ? 'Edit Deal' : 'New Deal'}
            </h2>
            <button
              onClick={closeDealModal}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleDealSubmit} className="flex-1 overflow-y-auto pb-6">
            <div className="p-6 space-y-5">
            {dealFormError && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {dealFormError}
              </div>
            )}

            {/* Value */}
            <div>
              <label htmlFor="deal-value" className={labelClass}>
                Value (INR) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <IndianRupee className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  id="deal-value"
                  name="value"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={dealFormData.value || ''}
                  onChange={handleDealFormChange}
                  className={`${inputClass} pl-10`}
                  required
                />
              </div>
            </div>

            {/* Row 4: Account + Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deal-accountId" className={labelClass}>Account</label>
                <select
                  id="deal-accountId"
                  name="accountId"
                  value={dealFormData.accountId}
                  onChange={handleDealFormChange}
                  className={selectClass}
                >
                  <option value="">Select account...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="deal-contactId" className={labelClass}>Contact</label>
                <select
                  id="deal-contactId"
                  name="contactId"
                  value={dealFormData.contactId}
                  onChange={handleDealFormChange}
                  className={selectClass}
                >
                  <option value="">Select contact...</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 5: Closing Date + Next Follow-up */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deal-closingDate" className={labelClass}>Closing Date</label>
                <div className="relative">
                  <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="deal-closingDate"
                    name="closingDate"
                    type="date"
                    value={dealFormData.closingDate}
                    onChange={handleDealFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="deal-nextFollowUp" className={labelClass}>Next Follow-up</label>
                <div className="relative">
                  <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="deal-nextFollowUp"
                    name="nextFollowUp"
                    type="date"
                    value={dealFormData.nextFollowUp}
                    onChange={handleDealFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            {/* Row 5b: Contact No + Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deal-contactNo" className={labelClass}>Contact No</label>
                <div className="relative">
                  <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="deal-contactNo"
                    name="contactNo"
                    type="text"
                    placeholder="Phone number"
                    value={dealFormData.contactNo}
                    onChange={handleDealFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="deal-designation" className={labelClass}>Designation</label>
                <input
                  id="deal-designation"
                  name="designation"
                  type="text"
                  placeholder="e.g. Manager, Director"
                  value={dealFormData.designation}
                  onChange={handleDealFormChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Row 5c: Email + Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deal-email" className={labelClass}>Email</label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="deal-email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={dealFormData.email}
                    onChange={handleDealFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="deal-location" className={labelClass}>Location</label>
                <div className="relative">
                  <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="deal-location"
                    name="location"
                    type="text"
                    placeholder="City, State"
                    value={dealFormData.location}
                    onChange={handleDealFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            {/* Row 6: Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deal-type" className={labelClass}>Type</label>
                <select
                  id="deal-type"
                  name="type"
                  value={dealFormData.type}
                  onChange={handleDealFormChange}
                  className={selectClass}
                >
                  <option value="New Business">New Business</option>
                  <option value="Existing Business">Existing Business</option>
                  <option value="Renewal">Renewal</option>
                  <option value="Upsell">Upsell</option>
                </select>
              </div>
            </div>

            {/* Row 7: Type + Lead Source */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deal-tag" className={labelClass}>Type</label>
                <select
                  id="deal-tag"
                  name="tag"
                  value={dealFormData.tag}
                  onChange={handleDealFormChange}
                  className={selectClass}
                >
                  <option value="">Select type...</option>
                  <option value="Channel">Channel</option>
                  <option value="End Customer">End Customer</option>
                </select>
              </div>
              <div>
                <label htmlFor="deal-leadSource" className={labelClass}>Lead Source</label>
                <select
                  id="deal-leadSource"
                  name="leadSource"
                  value={dealFormData.leadSource}
                  onChange={handleDealFormChange}
                  className={selectClass}
                >
                  <option value="">Select source...</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Event">Event</option>
                  <option value="Partner">Partner</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Requirements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deal-requirement" className={labelClass}>Requirement (User Provided)</label>
                <textarea
                  id="deal-requirement"
                  name="requirement"
                  rows={3}
                  placeholder="What the user/lead requires..."
                  value={dealFormData.requirement}
                  onChange={(e) => setDealFormData(prev => ({ ...prev, requirement: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="deal-quotedRequirement" className={labelClass}>Quoted Requirement (What We Serve)</label>
                <textarea
                  id="deal-quotedRequirement"
                  name="quotedRequirement"
                  rows={3}
                  placeholder="What we are offering/serving..."
                  value={dealFormData.quotedRequirement}
                  onChange={(e) => setDealFormData(prev => ({ ...prev, quotedRequirement: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Row 8: Description */}
            <div>
              <label htmlFor="deal-description" className={labelClass}>Description</label>
              <textarea
                id="deal-description"
                name="description"
                rows={3}
                placeholder="Deal description..."
                value={dealFormData.description}
                onChange={(e) => setDealFormData(prev => ({ ...prev, description: e.target.value }))}
                className={inputClass}
              />
            </div>

            </div>
            {/* Footer - sticky at bottom */}
            <div className={`sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t ${
              isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <button
                type="button"
                onClick={closeDealModal}
                disabled={isSubmitting}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                } disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> {editingDealId ? 'Update Deal' : 'Create Deal'}</>
                )}
              </button>
            </div>
          </form>
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
        [name]: (name === 'quantity' || name === 'amount') ? Number(value) || 0 : value,
      }));
    };

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 animate-backdrop" onClick={closeClosedWonModal} />
        <div className={`relative w-full max-w-lg rounded-2xl animate-fade-in-up ${
          isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-zinc-800' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Sales Order Form
              </h2>
            </div>
            <button onClick={closeClosedWonModal} className={`p-2 rounded-lg transition-colors ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            {closedWonError && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {closedWonError}
              </div>
            )}

            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Fill in the sales order details. A sales entry will be created for this deal.
            </p>

            {/* Customer Name */}
            <div>
              <label className={labelClass}>Customer Name <span className="text-red-500">*</span></label>
              <input name="customerName" value={closedWonOrderForm.customerName} onChange={handleOrderChange} className={inputClass} required />
            </div>

            {/* Quantity & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Quantity</label>
                <input name="quantity" type="number" min="1" value={closedWonOrderForm.quantity} onChange={handleOrderChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Amount <span className="text-red-500">*</span></label>
                <input name="amount" type="number" min="0" step="0.01" value={closedWonOrderForm.amount} onChange={handleOrderChange} className={inputClass} required />
              </div>
            </div>

            {/* PO Number & Invoice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>PO Number</label>
                <input name="poNumber" value={closedWonOrderForm.poNumber} onChange={handleOrderChange} className={inputClass} placeholder="PO-XXXX" />
              </div>
              <div>
                <label className={labelClass}>Invoice No</label>
                <input name="invoiceNo" value={closedWonOrderForm.invoiceNo} onChange={handleOrderChange} className={inputClass} placeholder="INV-XXXX" />
              </div>
            </div>

            {/* Payment Status & Sale Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Payment Status</label>
                <select name="paymentStatus" value={closedWonOrderForm.paymentStatus} onChange={handleOrderChange} className={selectClass}>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Sale Date <span className="text-red-500">*</span></label>
                <input name="saleDate" type="date" value={closedWonOrderForm.saleDate} onChange={handleOrderChange} className={inputClass} required />
              </div>
            </div>

            {/* Notes / Description */}
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                rows={2}
                placeholder="Additional notes about this sale..."
                value={closedWonDescription}
                onChange={e => setClosedWonDescription(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
            isDark ? 'border-zinc-800' : 'border-slate-200'
          }`}>
            <button
              onClick={closeClosedWonModal}
              disabled={closedWonSaving}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              } disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              onClick={handleClosedWonSubmit}
              disabled={closedWonSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              {closedWonSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating Sale...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Close Deal & Create Sale</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Deals
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Track and manage deal opportunities through your sales stages
          </p>
        </div>
      </div>

      {/* Stage Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className={`${cardClass} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <Handshake className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{dealSummary.total}</p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total</p>
          </div>
        </div>
        <div className={`${cardClass} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
            <Snowflake className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{dealSummary.cold}</p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Cold</p>
          </div>
        </div>
        <div className={`${cardClass} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{dealSummary.proposal}</p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Proposal</p>
          </div>
        </div>
        <div className={`${cardClass} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{dealSummary.negotiation}</p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Negotiation</p>
          </div>
        </div>
        <div className={`${cardClass} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{dealSummary.closedWon}</p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Closed Won</p>
          </div>
        </div>
        <div className={`${cardClass} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{dealSummary.closedLost}</p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Closed Lost</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {renderToolbar()}

      {/* Content */}
      {viewMode === 'table' ? renderTableView() : renderPipelineView()}

      {/* Modals */}
      {renderDealModal()}
      {renderDealDetailModal()}
      {renderClosedWonModal()}

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        entity="deals"
        entityLabel="Deals"
        isDark={isDark}
        onSuccess={() => fetchDeals()}
      />

      {/* Summarise Modal */}
      {showSummariseModal && summariseDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowSummariseModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className={`relative w-full max-w-lg rounded-2xl shadow-2xl border p-6 ${
              isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Deal Summary
              </h3>
              <button
                onClick={() => setShowSummariseModal(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Company', value: summariseDeal.company || summariseDeal.accountName },
                { label: 'Contact Name', value: summariseDeal.contactName },
                { label: 'Contact No', value: summariseDeal.contactNo },
                { label: 'Designation', value: summariseDeal.designation },
                { label: 'Email', value: summariseDeal.email },
                { label: 'Location', value: summariseDeal.location },
                { label: 'Stage', value: summariseDeal.stage },
                { label: 'Value', value: summariseDeal.value ? formatINR(summariseDeal.value) : undefined },
                { label: 'Type', value: summariseDeal.tag },
                { label: 'Requirement', value: summariseDeal.requirement },
                { label: 'Quoted Requirement', value: summariseDeal.quotedRequirement },
                { label: 'Follow-up Date', value: summariseDeal.nextFollowUp ? formatDate(summariseDeal.nextFollowUp) : undefined },
                { label: 'Description', value: summariseDeal.description },
                { label: 'Next Step', value: summariseDeal.nextStep },
              ].filter(item => item.value).map(item => (
                <div key={item.label} className="flex justify-between">
                  <span className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{item.label}</span>
                  <span className={`text-sm text-right max-w-[60%] ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const DetailInfoRow: React.FC<{
  label: string;
  value?: string;
  isDark: boolean;
  icon?: React.ReactNode;
}> = ({ label, value, isDark, icon }) => (
  <div className={`flex items-start gap-2 p-2.5 rounded-lg ${isDark ? 'bg-dark-100' : 'bg-slate-50'}`}>
    {icon && (
      <span className={`mt-0.5 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
        {icon}
      </span>
    )}
    <div className="min-w-0">
      <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{label}</p>
      <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {value || '-'}
      </p>
    </div>
  </div>
);
