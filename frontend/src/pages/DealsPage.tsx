import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Search, X, ChevronLeft, ChevronRight, Edit2, Trash2,
  IndianRupee, Loader2, AlertCircle, CheckCircle, Calendar,
  Target, TrendingUp, ArrowRight, Eye, LayoutGrid, List,
  XCircle, ChevronDown, Building2, User as UserIcon,
  Handshake, FileText, Briefcase, DollarSign,
  Layers, Snowflake,
  Download, Upload,
  MapPin, Phone, Mail, Send, MessageSquare, Flag, Tag
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useDropdowns } from '@/contexts/DropdownsContext';
import { dealsApi, accountsApi, contactsApi, salesApi, quotesApi, productsApi, partnersApi, formatINR, DEAL_LIST_FIELDS, DEAL_KANBAN_FIELDS } from '@/services/api';
import { exportToCsv } from '@/utils/exportCsv';
import { BulkImportModal } from '@/components/common/BulkImportModal';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { Deal, DealStage, Account, Contact, Product, Partner, PaginatedResponse, ActivityLog } from '@/types';
import { useColumnResize } from '@/hooks/useColumnResize';
import { Card, Button, Input, Select, Modal, Badge, Alert, Pagination, Textarea } from '@/components/ui';
import { cx } from '@/utils/cx';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

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

const NEXT_STAGE: Record<string, DealStage> = {
  New: 'Proposal',
  Proposal: 'Cold',
  Cold: 'Negotiation',
  Negotiation: 'Closed Won',
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DealsPage: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab: navigate } = useNavigation();
  const { getOptions } = useDropdowns();
  const canSeeAssignee = true; // Always show — backend controls data visibility via manager hierarchy

  // Stage definitions (hardcoded to guarantee all stages always render)
  const DEAL_STAGES: DealStage[] = ['New', 'Cold', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  const PIPELINE_STAGES: DealStage[] = ['New', 'Cold', 'Proposal', 'Negotiation'];
  const TERMINAL_STAGES: DealStage[] = ['Closed Won', 'Closed Lost'];
  // Other dropdown data from DB
  const DEAL_TYPES = getOptions('deal-types');
  const LEAD_SOURCES = getOptions('lead-sources');
  const FORECAST_OPTIONS = getOptions('forecast-options');

  // Data state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelineDeals, setPipelineDeals] = useState<Deal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  // Summary counts
  const [dealSummary, setDealSummary] = useState<{ total: number; new: number; proposal: number; cold: number; negotiation: number; closedLost: number; closedWon: number }>({ total: 0, new: 0, proposal: 0, cold: 0, negotiation: 0, closedLost: 0, closedWon: 0 });

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('pipeline');

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
  const tableLoadedRef = useRef(false);
  const [isPipelineLoading, setIsPipelineLoading] = useState(true);
  const pipelineLoadedRef = useRef(false);
  const dropdownsLoadedRef = useRef(false);
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
    partnerId: '',
    contactName: '', contactNo: '', email: '', gstin: '', panNo: '',
    dispatchMethod: '', paymentTerms: '', orderType: 'New' as 'New' | 'Refurb' | 'Rental',
    serialNumber: '', boq: '', price: 0,
  });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [closedWonExistingEntryId, setClosedWonExistingEntryId] = useState<string | null>(null);

  // Overdue amount map: dealId → overdue amount (only for non-paid sales entries)
  const [dealOverdueMap, setDealOverdueMap] = useState<Record<string, number>>({});

  // Inline quote builder state (inside deal detail for Channel tag)
  interface InlineLineItem {
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }
  const emptyLineItem: InlineLineItem = { productId: '', description: '', quantity: 1, unitPrice: 0 };
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

  const dealInitialWidths = canSeeAssignee
    ? [45, 70, 170, 120, 150, 130, 130, 220, 130, 160, 160, 110, 120, 100, 120, 120]
    : [45, 70, 170, 120, 150, 130, 130, 220, 130, 160, 160, 110, 120, 100, 120];
  const { colWidths: dealColWidths, onMouseDown: onDealMouseDown } = useColumnResize({
    initialWidths: dealInitialWidths,
  });

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchDeals = useCallback(async () => {
    if (!tableLoadedRef.current) setIsLoading(true);
    setTableError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (filterStage) params.stage = filterStage;
      if (filterAccount) params.accountId = filterAccount;
      if (searchTerm) params.search = searchTerm;
      params.fields = DEAL_LIST_FIELDS;

      const response: PaginatedResponse<Deal> = await dealsApi.list(params);
      setDeals(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);
      tableLoadedRef.current = true;
    } catch (err: any) {
      setTableError(err.message || 'Failed to load deals');
      setDeals([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterStage, filterAccount, searchTerm]);

  const fetchPipelineDeals = useCallback(async () => {
    if (!pipelineLoadedRef.current) setIsPipelineLoading(true);
    try {
      const data = await dealsApi.pipeline({ fields: DEAL_KANBAN_FIELDS });
      const allDeals: Deal[] = Array.isArray(data) ? data : (data?.data ?? []);
      setPipelineDeals(allDeals);
      pipelineLoadedRef.current = true;
    } catch {
      setPipelineDeals([]);
    } finally {
      setIsPipelineLoading(false);
    }
  }, []);

  const fetchDropdownData = useCallback(async () => {
    if (dropdownsLoadedRef.current) return;
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
      dropdownsLoadedRef.current = true;
    } catch {
      // Dropdown data failure is non-critical
    }
  }, []);

  // Fetch based on view mode — always fetch pipeline for summary cards
  useEffect(() => {
    fetchPipelineDeals();
    if (viewMode === 'table') {
      fetchDeals();
    }
  }, [viewMode, fetchDeals, fetchPipelineDeals]);

  // Fetch overdue amounts for deals shown in the table
  useEffect(() => {
    if (deals.length === 0) { setDealOverdueMap({}); return; }
    (async () => {
      try {
        const res = await salesApi.list({ limit: '100', fields: 'id,dealId,paymentStatus,amount' });
        const entries: any[] = res?.data ?? res ?? [];
        const m: Record<string, number> = {};
        for (const e of entries) {
          if (e.dealId && e.paymentStatus !== 'paid') {
            m[e.dealId] = (m[e.dealId] || 0) + (Number(e.amount) || 0);
          }
        }
        setDealOverdueMap(m);
      } catch {
        // non-critical
      }
    })();
  }, [deals]);

  // Compute deal summary counts from pipelineDeals
  useEffect(() => {
    const newDeals = pipelineDeals.filter(d => d.stage === 'New').length;
    const proposal = pipelineDeals.filter(d => d.stage === 'Proposal').length;
    const cold = pipelineDeals.filter(d => d.stage === 'Cold').length;
    const negotiation = pipelineDeals.filter(d => d.stage === 'Negotiation').length;
    const closedLost = pipelineDeals.filter(d => d.stage === 'Closed Lost').length;
    const closedWon = pipelineDeals.filter(d => d.stage === 'Closed Won').length;
    setDealSummary({ total: pipelineDeals.length, new: newDeals, proposal, cold, negotiation, closedLost, closedWon });
  }, [pipelineDeals]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterStage, filterAccount, searchTerm]);

  // ---------------------------------------------------------------------------
  // Deal form handlers
  // ---------------------------------------------------------------------------

  const openCreateDealModal = () => {
    fetchDropdownData();
    setDealFormData({ ...EMPTY_DEAL_FORM });
    setEditingDealId(null);
    setDealFormError('');
    setShowDealModal(true);
  };

  const openEditDealModal = async (deal: Deal) => {
    fetchDropdownData();
    // Fetch full record to avoid partial-field overwrites
    let full = deal;
    try {
      const res = await dealsApi.getById(deal.id);
      full = res?.data ?? res;
    } catch { /* fall back to list data */ }
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
        lineTotal: li.quantity * li.unitPrice,
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

    // Intercept Closed Won stage change → show popup
    if (dealFormData.stage === 'Closed Won') {
      const isAlreadyClosedWon = editingDealId && deals.find(d => d.id === editingDealId)?.stage === 'Closed Won';
      if (!isAlreadyClosedWon) {
        const acct = accounts.find(a => a.id === dealFormData.accountId);
        const payload: any = { ...dealFormData, title: acct?.name || 'Deal' };
        if (!payload.accountId) delete payload.accountId;
        if (!payload.contactId) delete payload.contactId;
        if (!payload.closingDate) delete payload.closingDate;
        if (!payload.nextFollowUp) delete payload.nextFollowUp;
        if (!payload.billingDeliveryDate) delete payload.billingDeliveryDate;
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
        const res = await dealsApi.update(editingDealId, payload);
        const updated = res?.data ?? res;
        // Keep detail view in sync if open
        if (detailDeal && detailDeal.id === editingDealId) {
          setDetailDeal({ ...detailDeal, ...updated });
        }
      } else {
        await dealsApi.create({ ...payload, ownerId: user?.id });
      }
      closeDealModal();
      await Promise.all([fetchDeals(), fetchPipelineDeals()]);
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
      closeDealDetailModal();
      return;
    }

    setIsUpdatingStage(true);

    // Optimistic update for both views
    const oldStage = detailDeal.stage;
    setPipelineDeals(prev =>
      prev.map(d => d.id === detailDeal.id ? { ...d, stage: newStage } : d)
    );
    setDeals(prev =>
      prev.map(d => d.id === detailDeal.id ? { ...d, stage: newStage } : d)
    );

    try {
      const res = await dealsApi.update(detailDeal.id, { stage: newStage });
      setDetailDeal(res?.data ?? res);
      // Re-sync from server to ensure consistency
      fetchPipelineDeals();
    } catch {
      // Revert on failure
      setPipelineDeals(prev =>
        prev.map(d => d.id === detailDeal.id ? { ...d, stage: oldStage } : d)
      );
      setDeals(prev =>
        prev.map(d => d.id === detailDeal.id ? { ...d, stage: oldStage } : d)
      );
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
      const acct = accounts.find(a => a.id === deal.accountId);
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
        partnerId: acct?.partnerId || '',
        contactName: deal.contactName || '',
        contactNo: deal.contactNo || '',
        email: deal.email || '',
        gstin: acct?.gstinNo || '',
        panNo: acct?.panNo || '',
        dispatchMethod: '',
        paymentTerms: acct?.paymentTerms || '',
        orderType: 'New',
        serialNumber: '',
        boq: '',
        price: 0,
      });
      setSelectedProductIds([]);
      setClosedWonExistingEntryId(null);
      setShowClosedWonModal(true);
      return;
    }

    // Optimistic update — move card instantly in both views
    const oldStage = deal.stage;
    setPipelineDeals(prev =>
      prev.map(d => d.id === deal.id ? { ...d, stage: newStage } : d)
    );
    setDeals(prev =>
      prev.map(d => d.id === deal.id ? { ...d, stage: newStage } : d)
    );

    try {
      await dealsApi.update(deal.id, { stage: newStage });
      // Re-sync from server to ensure consistency
      fetchPipelineDeals();
    } catch {
      // Revert on failure
      setPipelineDeals(prev =>
        prev.map(d => d.id === deal.id ? { ...d, stage: oldStage } : d)
      );
      setDeals(prev =>
        prev.map(d => d.id === deal.id ? { ...d, stage: oldStage } : d)
      );
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

  const refreshData = async () => {
    await Promise.all([fetchDeals(), fetchPipelineDeals()]);
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
      refreshData();
      navigate('sales-entry');
    } catch (err: any) {
      setClosedWonError(err.message || 'Failed to complete deal');
    } finally {
      setClosedWonSaving(false);
    }
  };

  // Reinitiate Sales Order — open modal pre-filled from existing sales entry
  const handleReinitiateSalesOrder = async (deal: Deal) => {
    const acct = accounts.find(a => a.id === deal.accountId);
    setClosedWonDealId(deal.id);
    setClosedWonPayload({ stage: 'Closed Won', value: deal.value, accountId: deal.accountId, title: deal.accountName || 'Deal' });
    setClosedWonDescription(deal.description || '');
    setClosedWonError('');

    // Default new fields from deal/account
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

    // Try to load existing sales entry for this deal
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


  const renderReadCell = (deal: Deal, colKey: string) => {
    switch (colKey) {
      case 'accountId':
        return <span className="font-medium truncate block max-w-[200px]">{deal.accountName || '-'}</span>;
      case 'value':
        return <span className="font-semibold whitespace-nowrap">{deal.value ? formatINR(deal.value) : '-'}</span>;
      case 'stage':
        return <Badge variant={STAGE_BADGE_VARIANT[deal.stage] || 'gray'}>{deal.stage}</Badge>;
      case 'closingDate':
        return <span className="whitespace-nowrap">{deal.closingDate ? formatDate(deal.closingDate) : '-'}</span>;
      case 'type':
        return deal.type || '-';
      case 'tag':
        if (!deal.tag) return '-';
        return (
          <Badge variant={deal.tag === 'Channel' ? 'purple' : 'cyan'}>
            {deal.tag}
          </Badge>
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
    <Card padding="none" className="p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* View Toggle */}
        <div className="flex items-center rounded-xl border p-0.5 border-gray-200 bg-gray-50 dark:border-zinc-700 dark:bg-dark-100">
          <button
            onClick={() => setViewMode('table')}
            className={cx(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
              viewMode === 'table'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-white'
            )}
          >
            <List className="w-3.5 h-3.5" />
            List View
          </button>
          <button
            onClick={() => setViewMode('pipeline')}
            className={cx(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
              viewMode === 'pipeline'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-white'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Kanban Board
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Input
            type="text"
            placeholder="Search deals..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Filter: Stage */}
        <div className="w-full lg:w-44">
          <Select
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
          >
            <option value="">All Stages</option>
            {DEAL_STAGES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>

        {/* Filter: Account */}
        <div className="w-full lg:w-44">
          <Select
            value={filterAccount}
            onChange={e => setFilterAccount(e.target.value)}
          >
            <option value="">All Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} icon={<X className="w-3.5 h-3.5" />}>
            Clear
          </Button>
        )}

        {/* Bulk Import */}
        <Button variant="secondary" size="sm" onClick={() => setShowBulkImport(true)} icon={<Upload className="w-4 h-4" />}>
          Import
        </Button>

        {/* Export CSV */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => exportToCsv('deals', [
            { header: 'Company', accessor: (r: Deal) => r.company || r.accountName },
            { header: 'Contact Name', accessor: (r: Deal) => r.contactName },
            { header: 'Contact No', accessor: (r: Deal) => r.contactNo },
            { header: 'Designation', accessor: (r: Deal) => r.designation },
            { header: 'Email', accessor: (r: Deal) => r.email },
            { header: 'Location', accessor: (r: Deal) => r.location },
            { header: 'Requirement', accessor: (r: Deal) => r.requirement },
            { header: 'Quoted Requirement', accessor: (r: Deal) => r.quotedRequirement },
            { header: 'Value', accessor: (r: Deal) => r.value },
            { header: 'Stage', accessor: (r: Deal) => r.stage },
            { header: 'Type', accessor: (r: Deal) => r.tag },
            { header: 'Follow-up Date', accessor: (r: Deal) => r.nextFollowUp },
            { header: 'Closing Date', accessor: (r: Deal) => r.closingDate },
            { header: 'Type', accessor: (r: Deal) => r.type },
            { header: 'Forecast', accessor: (r: Deal) => r.forecast },
            { header: 'Lead Source', accessor: (r: Deal) => r.leadSource },
            ...(canSeeAssignee ? [{ header: 'Owner', accessor: (r: Deal) => r.ownerName }] : []),
            { header: 'Next Step', accessor: (r: Deal) => r.nextStep },
            { header: 'Description', accessor: (r: Deal) => r.description },
          ], deals)}
          disabled={deals.length === 0}
          icon={<Download className="w-4 h-4" />}
        >
          Export
        </Button>

        {/* New Deal */}
        <Button onClick={openCreateDealModal} icon={<Plus className="w-4 h-4" />} shine>
          New Deal
        </Button>
      </div>
    </Card>
  );

  // ---------------------------------------------------------------------------
  // Render: Table View
  // ---------------------------------------------------------------------------

  const renderTableView = () => {
    const cellBase = 'px-3 py-2.5 text-sm border-gray-100 dark:border-zinc-800';
    const hdrCell = 'px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-50 dark:text-zinc-400 dark:bg-dark-100';

    return (
      <Card padding="none" className="overflow-hidden">
        {tableError && (
          <div className="m-4">
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {tableError}
            </Alert>
          </div>
        )}

        {/* Record count */}
        {totalRecords > 0 && (
          <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100 dark:text-zinc-500 dark:border-zinc-800">
            {totalRecords} deal{totalRecords !== 1 ? 's' : ''} total
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">
              Loading deals...
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="premium-table" style={{ minWidth: dealColWidths.reduce((a, b) => a + b, 0) }}>
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-700">
                    {(['#', 'Summarise', 'Company', 'Overdue', 'Contact Name', 'Contact No', 'Designation', 'Email', 'Location', 'Requirement', 'Quoted Requirement', 'Value', 'Stage', 'Order Type', ...(canSeeAssignee ? ['Assignee'] : []), 'Follow-up Date'] as string[]).map((label, i, arr) => (
                      <th
                        key={label}
                        className={`${hdrCell} resizable-th ${i === 0 || i === 1 ? 'text-center' : ''}`}
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
                      <td colSpan={canSeeAssignee ? 16 : 15} className="py-16 text-center">
                        <Briefcase className="w-8 h-8 mx-auto text-gray-300 dark:text-zinc-700" />
                        <p className="mt-2 text-sm text-gray-400 dark:text-zinc-500">
                          {hasActiveFilters ? 'No deals match filters' : 'No deals yet'}
                        </p>
                      </td>
                    </tr>
                  ) : deals.map((deal, idx) => (
                    <tr
                      key={deal.id}
                      onClick={() => openDealDetailModal(deal)}
                      className="border-b cursor-pointer transition-colors border-gray-100 hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                    >
                      {/* # */}
                      <td className={cx(cellBase, 'text-center text-gray-400 dark:text-zinc-500')}>
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      {/* Summarise */}
                      <td className={cx(cellBase, 'text-center')}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSummariseDeal(deal); setShowSummariseModal(true); }}
                          title="Summarise"
                          className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:text-zinc-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                      {/* Company */}
                      <td className={cx(cellBase, 'text-gray-700 dark:text-zinc-300')}>
                        <span className="font-medium">{deal.company || deal.accountName || '-'}</span>
                        {deal.paymentFlag && <span title="Payment pending"><Flag className="w-3.5 h-3.5 text-red-500 fill-red-500 inline-block ml-1" /></span>}
                      </td>
                      {/* Overdue */}
                      <td className={cellBase}>
                        {dealOverdueMap[deal.id]
                          ? <span className="font-medium text-red-600 dark:text-red-400">{formatINR(dealOverdueMap[deal.id])}</span>
                          : <span className="text-gray-300 dark:text-zinc-600">-</span>
                        }
                      </td>
                      {/* Contact Name */}
                      <td className={cx(cellBase, 'text-gray-700 dark:text-zinc-300')}>
                        {deal.contactName || '-'}
                      </td>
                      {/* Contact No */}
                      <td className={cx(cellBase, 'text-gray-700 dark:text-zinc-300')}>
                        {deal.contactNo || '-'}
                      </td>
                      {/* Designation */}
                      <td className={cx(cellBase, 'text-gray-700 dark:text-zinc-300')}>
                        {deal.designation || '-'}
                      </td>
                      {/* Email */}
                      <td className={cx(cellBase, 'text-gray-700 dark:text-zinc-300')}>
                        <span className="truncate block max-w-[140px]">{deal.email || '-'}</span>
                      </td>
                      {/* Location */}
                      <td className={cx(cellBase, 'text-gray-700 dark:text-zinc-300')}>
                        {deal.location || '-'}
                      </td>
                      {/* Requirement */}
                      <td className={cx(cellBase, 'text-gray-700 dark:text-zinc-300')}>
                        <span className="truncate block max-w-[150px]">{deal.requirement || '-'}</span>
                      </td>
                      {/* Quoted Requirement */}
                      <td className={cx(cellBase, 'text-gray-700 dark:text-zinc-300')}>
                        <span className="truncate block max-w-[150px]">{deal.quotedRequirement || '-'}</span>
                      </td>
                      {/* Value */}
                      <td className={cellBase}>
                        {renderReadCell(deal, 'value')}
                      </td>
                      {/* Stage */}
                      <td className={cellBase}>
                        {renderReadCell(deal, 'stage')}
                      </td>
                      {/* Order Type */}
                      <td className={cx(cellBase, 'text-gray-700 dark:text-zinc-300')}>
                        {deal.typeOfOrder || '-'}
                      </td>
                      {/* Assignee - only visible to admin/superadmin/managers */}
                      {canSeeAssignee && (
                        <td className={cx(cellBase, 'text-gray-700 dark:text-zinc-300')}>
                          {deal.ownerName || '-'}
                        </td>
                      )}
                      {/* Follow-up Date */}
                      <td className={cx(cellBase, 'text-gray-700 dark:text-zinc-300')}>
                        {deal.nextFollowUp ? formatDate(deal.nextFollowUp) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {deals.length > 0 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalRecords}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                className="border-t border-gray-100 dark:border-zinc-800"
              />
            )}
          </>
        )}
      </Card>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Pipeline / Kanban View
  // ---------------------------------------------------------------------------

  const renderPipelineCard = (deal: Deal) => {
    return (
      <div
        key={deal.id}
        draggable
        onDragStart={e => { e.dataTransfer.setData('text/plain', deal.id); setDraggedDealId(deal.id); }}
        onDragEnd={() => { setDraggedDealId(null); setDragOverStage(null); }}
        onClick={() => openDealDetailModal(deal)}
        className={cx(
          'p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all hover:shadow-md',
          draggedDealId === deal.id && 'opacity-40 scale-95',
          'bg-white border-gray-200 hover:border-gray-300 dark:bg-dark-100 dark:border-zinc-700 dark:hover:border-zinc-600'
        )}
      >
        {/* Product Detail (Title) & Edit */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h4 className="text-sm font-semibold truncate flex items-center gap-1 text-gray-900 dark:text-white">
            {deal.title || 'Untitled Deal'}
            {deal.paymentFlag && <span title="Payment pending"><Flag className="w-3.5 h-3.5 text-red-500 fill-red-500 flex-shrink-0" /></span>}
          </h4>
          <button
            onClick={(e) => { e.stopPropagation(); openEditDealModal(deal); }}
            className="p-1 rounded-lg flex-shrink-0 transition-colors text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:text-zinc-500 dark:hover:text-brand-400 dark:hover:bg-brand-900/20"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        </div>

        {/* Company Name */}
        {deal.accountName && (
          <p className="text-[11px] flex items-center gap-1 mb-1 text-gray-500 dark:text-zinc-400">
            <Briefcase className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{deal.accountName}</span>
          </p>
        )}

        {/* Company SPOC */}
        {deal.contactName && (
          <p className="text-[11px] flex items-center gap-1 mb-1 text-gray-500 dark:text-zinc-400">
            <UserIcon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{deal.contactName}</span>
          </p>
        )}

        {/* Pricing */}
        {deal.value ? (
          <p className="text-xs font-semibold mb-1 text-emerald-600 dark:text-emerald-400">
            {formatINR(deal.value)}
          </p>
        ) : null}

        {/* Order Type */}
        {deal.typeOfOrder && (
          <Badge
            size="sm"
            variant={deal.typeOfOrder === 'New' ? 'blue' : deal.typeOfOrder === 'Rental' ? 'purple' : 'amber'}
            className="mb-1"
          >
            <Tag className="w-3 h-3 flex-shrink-0" />
            {deal.typeOfOrder}
          </Badge>
        )}

        {/* Assignee */}
        {deal.ownerName && (
          <p className="text-[11px] flex items-center gap-1 text-gray-400 dark:text-zinc-500">
            <UserIcon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{deal.ownerName}</span>
          </p>
        )}

        {/* Reinitiate Sales Order for Closed Won */}
        {deal.stage === 'Closed Won' && (
          <div className="pt-2 mt-2 border-t border-dashed border-gray-200 dark:border-zinc-700">
            <button
              onClick={(e) => { e.stopPropagation(); handleReinitiateSalesOrder(deal); }}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
            >
              <FileText className="w-3 h-3" />
              Reinitiate Sales Order
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
          <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">
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
        {/* All 6 stages as kanban columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 min-w-[1100px]">
          {DEAL_STAGES.map(stage => {
            const stageDeals = (groupedDeals[stage] || []).filter(filterDeal);
            const c = STAGE_COLORS[stage] || STAGE_COLORS['New'];
            const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
            const isOver = dragOverStage === stage;
            const isTerminal = stage === 'Closed Won' || stage === 'Closed Lost';
            return (
              <Card
                key={stage}
                padding="none"
                className={cx(
                  'p-3 min-h-[200px] transition-all',
                  isOver && 'ring-2 ring-brand-500 ring-inset',
                  isTerminal && (stage === 'Closed Won'
                    ? 'border-emerald-200 dark:border-emerald-900/50'
                    : 'border-red-200 dark:border-red-900/50')
                )}
                onDragOver={e => { e.preventDefault(); setDragOverStage(stage); }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={e => {
                  e.preventDefault();
                  setDragOverStage(null);
                  setDraggedDealId(null);
                  const dealId = e.dataTransfer.getData('text/plain');
                  if (!dealId) return;
                  const deal = pipelineDeals.find(d => d.id === dealId);
                  if (deal && deal.stage !== stage) {
                    handleMoveStage(deal, stage as DealStage);
                  }
                }}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isTerminal ? (
                      stage === 'Closed Won'
                        ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        : <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    ) : (
                      <div className={cx('w-2 h-2 rounded-full', c.text.replace('text-', 'bg-'), `dark:${c.darkText.replace('text-', 'bg-')}`)} />
                    )}
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{stage}</h3>
                  </div>
                  <Badge variant="gray" size="sm">{stageDeals.length}</Badge>
                </div>

                {/* Stage total */}
                {stageTotal > 0 && (
                  <p className={cx(
                    'text-xs font-semibold mb-3',
                    stage === 'Closed Lost'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  )}>
                    {formatINR(stageTotal)}
                  </p>
                )}

                {/* Cards */}
                <div className="space-y-2">
                  {stageDeals.length === 0 ? (
                    <p className="text-xs text-center py-6 text-gray-300 dark:text-zinc-600">
                      {isOver ? 'Drop here' : 'No deals'}
                    </p>
                  ) : (
                    stageDeals.map(deal => renderPipelineCard(deal))
                  )}
                </div>
              </Card>
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
    const stageColor = STAGE_COLORS[deal.stage] || STAGE_COLORS['New'];

    return (
      <Modal open={showDetailModal} onClose={closeDealDetailModal} size="xl" raw>
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <h2 className="text-lg font-semibold font-display truncate text-gray-900 dark:text-white">
                {deal.accountName || 'Deal Details'}
              </h2>
              <div className="flex items-center gap-2 flex-shrink-0">
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
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => { closeDealDetailModal(); openEditDealModal(deal); }}
                icon={<Edit2 className="w-4 h-4" />}
                title="Edit"
              />
              {deleteConfirmId === deal.id ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => { handleDelete(deal.id); closeDealDetailModal(); }}
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
              <button
                onClick={closeDealDetailModal}
                className="group p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailInfoRow label="Account" value={deal.accountName} icon={<Building2 className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Contact" value={deal.contactName} icon={<UserIcon className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Contact No" value={deal.contactNo} icon={<Phone className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Email" value={deal.email} icon={<Mail className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Designation" value={deal.designation} icon={<Briefcase className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Location" value={deal.location} icon={<MapPin className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Owner" value={deal.ownerName} icon={<UserIcon className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Closing Date" value={deal.closingDate ? formatDate(deal.closingDate) : undefined} icon={<Calendar className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Type" value={deal.type} icon={<Briefcase className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Type" value={deal.tag} icon={<Layers className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Forecast" value={deal.forecast} icon={<Target className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Lead Source" value={deal.leadSource} icon={<TrendingUp className="w-3.5 h-3.5" />} />
                <DetailInfoRow label="Order Type" value={deal.typeOfOrder} icon={<Tag className="w-3.5 h-3.5" />} />
              </div>

              {/* Requirements */}
              {(deal.requirement || deal.quotedRequirement) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    Requirements
                  </h4>
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
              )}

              {/* Next Step */}
              {deal.nextStep && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400 dark:text-zinc-500">
                    Next Step
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-zinc-300">{deal.nextStep}</p>
                </div>
              )}

              {/* Description */}
              {deal.description && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400 dark:text-zinc-500">
                    Description
                  </h4>
                  <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-zinc-300">{deal.description}</p>
                </div>
              )}

              {/* Inline Quote Builder — End Customer only */}
              {deal.tag === 'End Customer' && (
                <div>
                  <button
                    onClick={() => setInlineQuoteOpen(prev => !prev)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border transition-all border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/10 dark:hover:bg-indigo-900/20 dark:text-indigo-400"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-semibold">Quote Builder</span>
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

                      {/* Line Items */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                            Line Items
                          </h5>
                        </div>
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
                            <Input
                              type="text"
                              placeholder="Description"
                              value={li.description}
                              onChange={e => handleInlineLineItemChange(idx, 'description', e.target.value)}
                              className="!text-xs !py-1.5"
                            />
                            <div className="grid grid-cols-3 gap-2">
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
                                <label className="text-[10px] text-gray-400 dark:text-zinc-500">Unit Price</label>
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

                      {/* Tax & Notes */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-medium text-gray-400 dark:text-zinc-500">Tax Rate %</label>
                          <Input
                            type="number"
                            min={0}
                            value={inlineTaxRate}
                            onChange={e => setInlineTaxRate(Number(e.target.value) || 0)}
                            className="!text-xs !py-1.5"
                          />
                        </div>
                        <div className="flex flex-col justify-end text-right text-xs space-y-0.5 text-gray-700 dark:text-zinc-300">
                          {(() => {
                            const subtotal = inlineLineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
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
                        <label className="text-[10px] font-medium text-gray-400 dark:text-zinc-500">Notes</label>
                        <Textarea
                          rows={2}
                          placeholder="Quote notes..."
                          value={inlineQuoteNotes}
                          onChange={e => setInlineQuoteNotes(e.target.value)}
                          className="!text-xs !py-1.5"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-medium text-gray-400 dark:text-zinc-500">Terms & Conditions</label>
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
                        {inlineQuoteSaving ? 'Creating...' : 'Create Quote'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Add Activity */}
              <div>
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
                {deal.createdAt && <span>Created: {formatDate(deal.createdAt)}</span>}
                {deal.updatedAt && <span>Updated: {formatDate(deal.updatedAt)}</span>}
              </div>
            </div>
          </div>
      </Modal>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Create/Edit Deal Modal
  // ---------------------------------------------------------------------------

  const renderDealModal = () => {
    if (!showDealModal) return null;

    return (
      <Modal
        open={showDealModal}
        onClose={closeDealModal}
        title={editingDealId ? 'Edit Deal' : 'New Deal'}
        size="xl"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={closeDealModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="deal-form"
              loading={isSubmitting}
              icon={isSubmitting ? undefined : <CheckCircle className="w-4 h-4" />}
              shine
            >
              {isSubmitting ? 'Saving...' : (editingDealId ? 'Update Deal' : 'Create Deal')}
            </Button>
          </>
        }
      >
        <form id="deal-form" onSubmit={handleDealSubmit} className="space-y-5">
          {dealFormError && (
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {dealFormError}
            </Alert>
          )}

          {/* Row 4: Account + Contact */}
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

          {/* Row 5: Closing Date + Next Follow-up */}
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

          {/* Row 5b: Contact No + Designation */}
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

          {/* Row 5c: Email + Location */}
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

          {/* Row 7: Type + Lead Source */}
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

          {/* Value (non-mandatory, below quoted requirement) */}
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

          {/* Row 8: Description (Rich Text) */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Description</label>
            <RichTextEditor
              value={dealFormData.description}
              onChange={(html) => setDealFormData(prev => ({ ...prev, description: html }))}
              placeholder="Deal description..."
              minHeight="80px"
            />
          </div>

        </form>
      </Modal>
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

          {/* Company Name (auto-filled from account) */}
          <Input
            label="Company Name"
            name="customerName"
            value={closedWonOrderForm.customerName}
            onChange={handleOrderChange}
            placeholder="Company name"
            readOnly
            className="bg-gray-50 dark:bg-dark-200"
          />

          {/* Product Selection (click-to-open dropdown) */}
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

          {/* Order Type Toggle: New / Refurb / Rental */}
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

          {/* BOQ - shown for both New and Refurb */}
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
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-gray-900 dark:text-white">
            Deals
          </h1>
          <p className="text-sm mt-0.5 text-gray-500 dark:text-zinc-400">
            Track and manage deal opportunities through your sales stages
          </p>
        </div>
      </div>

      {/* Stage Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { icon: <Handshake className="w-5 h-5" />, count: dealSummary.total, label: 'Total', color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
          { icon: <Plus className="w-5 h-5" />, count: dealSummary.new, label: 'New', color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400' },
          { icon: <FileText className="w-5 h-5" />, count: dealSummary.proposal, label: 'Proposal', color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
          { icon: <Snowflake className="w-5 h-5" />, count: dealSummary.cold, label: 'Cold', color: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400' },
          { icon: <TrendingUp className="w-5 h-5" />, count: dealSummary.negotiation, label: 'Negotiation', color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' },
          { icon: <XCircle className="w-5 h-5" />, count: dealSummary.closedLost, label: 'Closed Lost', color: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' },
          { icon: <CheckCircle className="w-5 h-5" />, count: dealSummary.closedWon, label: 'Closed Won', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
        ].map(({ icon, count, label, color }) => (
          <Card key={label} padding="none" className="p-4 flex items-center gap-3">
            <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
              {icon}
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-gray-900 dark:text-white">{count}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{label}</p>
            </div>
          </Card>
        ))}
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
        onSuccess={() => fetchDeals()}
      />

      {/* Summarise Modal */}
      <Modal
        open={showSummariseModal && !!summariseDeal}
        onClose={() => setShowSummariseModal(false)}
        title="Deal Summary"
        size="lg"
      >
        {summariseDeal && (
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
                <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">{item.label}</span>
                <span className="text-sm text-right max-w-[60%] text-gray-700 dark:text-zinc-200">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
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
