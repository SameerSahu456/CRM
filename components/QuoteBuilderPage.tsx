import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, ChevronLeft, ChevronRight, Edit2, Trash2,
  IndianRupee, Loader2, AlertCircle, CheckCircle, Calendar,
  FileText, Eye, Package, Send, ArrowLeft, Copy, Download,
  User as UserIcon, Building2, Hash
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { quotesApi, productsApi, partnersApi, quoteTermsApi, formatINR } from '../services/api';
import { Quote, QuoteLineItem, QuoteTerm, Product, Partner, PaginatedResponse } from '../types';
import { RichTextEditor } from './RichTextEditor';
import { useColumnResize } from '../hooks/useColumnResize';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

const QUOTE_STATUSES: { value: QuoteStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_COLORS: Record<QuoteStatus, { bg: string; text: string; darkBg: string; darkText: string }> = {
  draft:    { bg: 'bg-slate-100', text: 'text-slate-700', darkBg: 'bg-zinc-800', darkText: 'text-zinc-300' },
  sent:     { bg: 'bg-blue-50', text: 'text-blue-700', darkBg: 'bg-blue-900/30', darkText: 'text-blue-400' },
  accepted: { bg: 'bg-emerald-50', text: 'text-emerald-700', darkBg: 'bg-emerald-900/30', darkText: 'text-emerald-400' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', darkBg: 'bg-red-900/30', darkText: 'text-red-400' },
};

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

interface LineItemFormData {
  id?: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sortOrder: number;
}

interface QuoteFormData {
  partnerId: string;
  customerName: string;
  validUntil: string;
  taxRate: number;
  discountAmount: number;
  selectedTermIds: string[];
  notes: string;
  lineItems: LineItemFormData[];
}

const EMPTY_LINE_ITEM: LineItemFormData = {
  productId: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  lineTotal: 0,
  sortOrder: 0,
};

const EMPTY_FORM: QuoteFormData = {
  partnerId: '',
  customerName: '',
  validUntil: '',
  taxRate: 18,
  discountAmount: 0,
  selectedTermIds: [],
  notes: '',
  lineItems: [{ ...EMPTY_LINE_ITEM, sortOrder: 0 }],
};

// ---------------------------------------------------------------------------
// View modes
// ---------------------------------------------------------------------------

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

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

function statusBadge(status: QuoteStatus, isDark: boolean): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const c = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return `${base} ${isDark ? `${c.darkBg} ${c.darkText}` : `${c.bg} ${c.text}`}`;
}

function calcLineTotal(qty: number, unitPrice: number): number {
  return qty * unitPrice;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const QuoteBuilderPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // List data
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Dropdown data
  const [products, setProducts] = useState<Product[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [availableTerms, setAvailableTerms] = useState<QuoteTerm[]>([]);
  const [newTermText, setNewTermText] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableError, setTableError] = useState('');
  const [formError, setFormError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form data (create/edit)
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<QuoteFormData>({ ...EMPTY_FORM });

  // Detail data
  const [detailQuote, setDetailQuote] = useState<Quote | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // ---------------------------------------------------------------------------
  // Styling helpers
  // ---------------------------------------------------------------------------

  const cardClass = `premium-card ${isDark ? '' : 'shadow-soft'}`;
  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm transition-all ${
    isDark
      ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
  } focus:outline-none focus:ring-1 focus:ring-brand-500`;
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  // Column resize for list table
  const { colWidths: quoteColWidths, onMouseDown: onQuoteMouseDown } = useColumnResize({
    initialWidths: [130, 200, 170, 120, 130, 110, 100],
  });

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchQuotes = useCallback(async () => {
    setIsLoading(true);
    setTableError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (filterStatus) params.status = filterStatus;
      if (searchTerm) params.search = searchTerm;

      const response: PaginatedResponse<Quote> = await quotesApi.list(params);
      setQuotes(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);
    } catch (err: any) {
      setTableError(err.message || 'Failed to load quotes');
      setQuotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterStatus, searchTerm]);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [productsList, partnersResponse, termsList] = await Promise.all([
        productsApi.list(),
        partnersApi.list({ limit: '100', status: 'approved' }),
        quoteTermsApi.list(),
      ]);
      setProducts(Array.isArray(productsList) ? productsList : []);
      const partnerData = partnersResponse?.data ?? partnersResponse;
      setPartners(Array.isArray(partnerData) ? partnerData : []);
      setAvailableTerms(Array.isArray(termsList) ? termsList : []);
    } catch {
      // Dropdown data failure is non-critical
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  // Fetch quotes when on list view
  useEffect(() => {
    if (viewMode === 'list') {
      fetchQuotes();
    }
  }, [viewMode, fetchQuotes]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterStatus, searchTerm]);

  // ---------------------------------------------------------------------------
  // Auto-calculations for form
  // ---------------------------------------------------------------------------

  const recalcTotals = useCallback((items: LineItemFormData[], discountAmt: number, taxRatePct: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const taxableAmount = subtotal - discountAmt;
    const taxAmount = taxableAmount > 0 ? taxableAmount * (taxRatePct / 100) : 0;
    const totalAmount = taxableAmount + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  }, []);

  const getFormTotals = useCallback(() => {
    return recalcTotals(formData.lineItems, formData.discountAmount, formData.taxRate);
  }, [formData.lineItems, formData.discountAmount, formData.taxRate, recalcTotals]);

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  const goToList = () => {
    setViewMode('list');
    setEditingQuoteId(null);
    setDetailQuote(null);
    setFormError('');
  };

  const goToCreate = () => {
    setFormData({
      ...EMPTY_FORM,
      lineItems: [{ ...EMPTY_LINE_ITEM, sortOrder: 0 }],
    });
    setEditingQuoteId(null);
    setFormError('');
    setViewMode('create');
  };

  const goToEdit = async (quoteId: string) => {
    setIsDetailLoading(true);
    setFormError('');
    try {
      const quote: Quote = await quotesApi.getById(quoteId);
      setFormData({
        partnerId: quote.partnerId || '',
        customerName: quote.customerName || '',
        validUntil: quote.validUntil ? quote.validUntil.split('T')[0] : '',
        taxRate: quote.taxRate ?? 18,
        discountAmount: quote.discountAmount ?? 0,
        selectedTermIds: quote.selectedTermIds || [],
        notes: quote.notes || '',
        lineItems: (quote.lineItems && quote.lineItems.length > 0)
          ? quote.lineItems.map((li, idx) => ({
              id: li.id,
              productId: li.productId || '',
              description: li.description || '',
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              lineTotal: li.lineTotal,
              sortOrder: li.sortOrder ?? idx,
            }))
          : [{ ...EMPTY_LINE_ITEM, sortOrder: 0 }],
      });
      setEditingQuoteId(quoteId);
      setViewMode('edit');
    } catch (err: any) {
      setTableError(err.message || 'Failed to load quote for editing');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const goToDetail = async (quoteId: string) => {
    setIsDetailLoading(true);
    try {
      const quote: Quote = await quotesApi.getById(quoteId);
      setDetailQuote(quote);
      setViewMode('detail');
    } catch (err: any) {
      setTableError(err.message || 'Failed to load quote');
    } finally {
      setIsDetailLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Line item handlers
  // ---------------------------------------------------------------------------

  const updateLineItem = (index: number, field: keyof LineItemFormData, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.lineItems];
      const item = { ...newItems[index], [field]: value };

      // If product changed, auto-populate unit price
      if (field === 'productId' && value) {
        const product = products.find(p => p.id === value);
        if (product) {
          item.unitPrice = product.basePrice ?? 0;
          if (!item.description) {
            item.description = product.name;
          }
        }
      }

      // Recalculate line total whenever qty or unitPrice change
      if (field === 'quantity' || field === 'unitPrice' || field === 'productId') {
        item.lineTotal = calcLineTotal(item.quantity, item.unitPrice);
      }

      newItems[index] = item;
      return { ...prev, lineItems: newItems };
    });
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { ...EMPTY_LINE_ITEM, sortOrder: prev.lineItems.length },
      ],
    }));
  };

  const removeLineItem = (index: number) => {
    setFormData(prev => {
      if (prev.lineItems.length <= 1) return prev;
      const newItems = prev.lineItems.filter((_, i) => i !== index).map((item, i) => ({
        ...item,
        sortOrder: i,
      }));
      return { ...prev, lineItems: newItems };
    });
  };

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  const handleFormFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'taxRate' || name === 'discountAmount'
        ? Number(value) || 0
        : value,
    }));
  };

  const handleSave = async (sendAfterSave: boolean = false) => {
    setFormError('');

    if (!formData.customerName.trim()) {
      setFormError('Customer name is required');
      return;
    }
    if (formData.lineItems.length === 0 || formData.lineItems.every(li => !li.productId && !li.description)) {
      setFormError('At least one line item is required');
      return;
    }

    const { subtotal, taxAmount, totalAmount } = getFormTotals();

    const payload: any = {
      partnerId: formData.partnerId || null,
      customerName: formData.customerName,
      validUntil: formData.validUntil || null,
      subtotal,
      taxRate: formData.taxRate,
      taxAmount,
      discountAmount: formData.discountAmount,
      totalAmount,
      status: sendAfterSave ? 'sent' : 'draft',
      selectedTermIds: formData.selectedTermIds,
      notes: formData.notes || null,
      createdBy: user?.id || null,
      lineItems: formData.lineItems
        .filter(li => li.productId || li.description)
        .map(li => ({
          id: li.id || undefined,
          productId: li.productId || null,
          description: li.description || null,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          lineTotal: li.lineTotal,
          sortOrder: li.sortOrder,
        })),
    };

    setIsSubmitting(true);
    try {
      let savedQuote: Quote;
      if (editingQuoteId) {
        savedQuote = await quotesApi.update(editingQuoteId, payload);
      } else {
        savedQuote = await quotesApi.create(payload);
      }
      // Navigate to detail view of saved quote
      setDetailQuote(savedQuote);
      setViewMode('detail');
      setEditingQuoteId(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Status update handlers (detail view)
  // ---------------------------------------------------------------------------

  const handleStatusUpdate = async (newStatus: QuoteStatus) => {
    if (!detailQuote) return;
    setIsStatusUpdating(true);
    try {
      const updated = await quotesApi.update(detailQuote.id, { status: newStatus });
      setDetailQuote(updated);
    } catch (err: any) {
      setTableError(err.message || 'Failed to update status');
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------

  const handleDelete = async (id: string) => {
    try {
      await quotesApi.delete(id);
      setDeleteConfirmId(null);
      if (viewMode === 'detail') {
        goToList();
      }
      fetchQuotes();
    } catch (err: any) {
      setTableError(err.message || 'Failed to delete quote');
    }
  };

  const clearFilters = () => {
    setFilterStatus('');
    setSearchTerm('');
  };

  const hasActiveFilters = filterStatus || searchTerm;

  // ---------------------------------------------------------------------------
  // PDF Download handler (detail view)
  // ---------------------------------------------------------------------------

  const handleDownloadPDF = async (regenerate: boolean = false) => {
    if (!detailQuote) return;
    setIsLoading(true);
    try {
      // If quote already has a PDF and not regenerating, open it directly
      if (!regenerate && detailQuote.pdfUrl) {
        window.open(detailQuote.pdfUrl, '_blank');
        return;
      }
      // Generate/regenerate via server
      const result = await quotesApi.getPdf(detailQuote.id, true);
      if (result.pdfUrl) {
        window.open(result.pdfUrl, '_blank');
        setDetailQuote(prev => prev ? { ...prev, pdfUrl: result.pdfUrl } : prev);
      }
    } catch (err: any) {
      setTableError(err.message || 'Failed to generate PDF');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render: List View
  // ---------------------------------------------------------------------------

  const renderListView = () => (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Quote Builder
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Create, manage, and send quotations to customers
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className={`${cardClass} p-4`}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-zinc-500' : 'text-slate-400'
            }`} />
            <input
              type="text"
              placeholder="Search by customer name or quote number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
                isDark
                  ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
              } focus:outline-none focus:ring-1 focus:ring-brand-500`}
            />
          </div>

          {/* Filter: Status */}
          <div className="w-full lg:w-44">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className={selectClass}
            >
              <option value="">All Statuses</option>
              {QUOTE_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isDark
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}

          {/* New Quote */}
          <button
            onClick={goToCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Quote
          </button>
        </div>
      </div>

      {/* Data Table */}
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

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Loading quotes...
            </p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
              isDark ? 'bg-zinc-800' : 'bg-slate-100'
            }`}>
              <FileText className={`w-7 h-7 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
            </div>
            <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              {hasActiveFilters ? 'No quotes match your filters' : 'No quotes yet'}
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
              {hasActiveFilters ? 'Try adjusting your filters' : 'Click "New Quote" to create one'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                    {['Quote #', 'Customer', 'Partner', 'Date', 'Amount', 'Status', 'Actions'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider resizable-th ${
                          isDark ? 'text-zinc-500' : 'text-slate-400'
                        }`}
                        style={{ width: quoteColWidths[i] }}
                      >
                        {h}
                        <div className="col-resize-handle" onMouseDown={e => onQuoteMouseDown(i, e)} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quotes.map(quote => (
                    <tr
                      key={quote.id}
                      onClick={() => goToDetail(quote.id)}
                      className={`border-b transition-colors cursor-pointer ${
                        isDark
                          ? 'border-zinc-800/50 hover:bg-zinc-800/30'
                          : 'border-slate-50 hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Quote # */}
                      <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <div className="flex items-center gap-2">
                          <Hash className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                          <span className="font-medium">{quote.quoteNumber || quote.id.slice(0, 8)}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        <div className="flex items-center gap-2">
                          <UserIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                          {quote.customerName}
                        </div>
                      </td>

                      {/* Partner */}
                      <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {quote.partnerName || '-'}
                      </td>

                      {/* Date */}
                      <td className={`px-4 py-3 whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        <div className="flex items-center gap-1.5">
                          <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                          {formatDate(quote.createdAt)}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className={`px-4 py-3 whitespace-nowrap font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatINR(quote.totalAmount)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={statusBadge(quote.status, isDark)}>
                          {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => goToDetail(quote.id)}
                            title="View"
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark
                                ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20'
                                : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                            }`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => goToEdit(quote.id)}
                            title="Edit"
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark
                                ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20'
                                : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                            }`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {deleteConfirmId === quote.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(quote.id)}
                                className="px-2 py-1 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  isDark
                                    ? 'text-zinc-400 hover:bg-zinc-800'
                                    : 'text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(quote.id)}
                              title="Delete"
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDark
                                  ? 'text-zinc-400 hover:text-red-400 hover:bg-red-900/20'
                                  : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t ${
              isDark ? 'border-zinc-800' : 'border-slate-100'
            }`}>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                Showing {(page - 1) * PAGE_SIZE + 1}
                {' '}&ndash;{' '}
                {Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords} quotes
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
          </>
        )}
      </div>
    </>
  );

  // ---------------------------------------------------------------------------
  // Render: Create / Edit Form View
  // ---------------------------------------------------------------------------

  const renderFormView = () => {
    const isEdit = viewMode === 'edit';
    const { subtotal, taxAmount, totalAmount } = getFormTotals();

    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={goToList}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isEdit ? 'Edit Quote' : 'New Quote'}
              </h1>
              <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {isEdit ? 'Update quotation details' : 'Build a new quotation for your customer'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Error */}
        {formError && (
          <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
            isDark
              ? 'bg-red-900/20 border border-red-800 text-red-400'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {formError}
          </div>
        )}

        {/* Quote Header Section */}
        <div className={`${cardClass} p-6`}>
          <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
            <FileText className="w-4 h-4" />
            Quote Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Partner */}
            <div>
              <label htmlFor="partnerId" className={labelClass}>Partner</label>
              <select
                id="partnerId"
                name="partnerId"
                value={formData.partnerId}
                onChange={handleFormFieldChange}
                className={selectClass}
              >
                <option value="">Select Partner (Optional)</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.companyName}</option>
                ))}
              </select>
            </div>

            {/* Customer Name */}
            <div>
              <label htmlFor="customerName" className={labelClass}>
                Customer Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  id="customerName"
                  name="customerName"
                  type="text"
                  placeholder="Enter customer name"
                  value={formData.customerName}
                  onChange={handleFormFieldChange}
                  className={`${inputClass} pl-10`}
                  required
                />
              </div>
            </div>

            {/* Valid Until */}
            <div>
              <label htmlFor="validUntil" className={labelClass}>Valid Until</label>
              <div className="relative">
                <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  id="validUntil"
                  name="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={handleFormFieldChange}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
              <Package className="w-4 h-4" />
              Line Items
            </h3>
            <button
              type="button"
              onClick={addLineItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-600 hover:bg-brand-700 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Line Item
            </button>
          </div>

          {/* Line items table */}
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                  {['#', 'Product', 'Description', 'Qty', 'Unit Price', 'Line Total', ''].map(h => (
                    <th
                      key={h}
                      className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider ${
                        isDark ? 'text-zinc-500' : 'text-slate-400'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {formData.lineItems.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`border-b ${isDark ? 'border-zinc-800/50' : 'border-slate-50'}`}
                  >
                    {/* Row number */}
                    <td className={`px-3 py-2 text-center ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {idx + 1}
                    </td>

                    {/* Product */}
                    <td className="px-3 py-2">
                      <select
                        value={item.productId}
                        onChange={e => updateLineItem(idx, 'productId', e.target.value)}
                        className={`w-full px-2 py-1.5 rounded-lg border text-xs transition-all ${
                          isDark
                            ? 'bg-dark-100 border-zinc-700 text-white focus:border-brand-500'
                            : 'bg-white border-slate-200 text-slate-900 focus:border-brand-500'
                        } focus:outline-none focus:ring-1 focus:ring-brand-500 appearance-none cursor-pointer`}
                      >
                        <option value="">Select product</option>
                        {products.filter(p => p.isActive).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Description */}
                    <td className="px-3 py-2" style={{ minWidth: 250 }}>
                      <RichTextEditor
                        value={item.description}
                        onChange={(html) => updateLineItem(idx, 'description', html)}
                        placeholder="Enter description..."
                        isDark={isDark}
                        minHeight="50px"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity || ''}
                        onChange={e => updateLineItem(idx, 'quantity', Number(e.target.value) || 0)}
                        className={`w-20 px-2 py-1.5 rounded-lg border text-xs text-right transition-all ${
                          isDark
                            ? 'bg-dark-100 border-zinc-700 text-white focus:border-brand-500'
                            : 'bg-white border-slate-200 text-slate-900 focus:border-brand-500'
                        } focus:outline-none focus:ring-1 focus:ring-brand-500`}
                      />
                    </td>

                    {/* Unit Price */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice || ''}
                        onChange={e => updateLineItem(idx, 'unitPrice', Number(e.target.value) || 0)}
                        className={`w-28 px-2 py-1.5 rounded-lg border text-xs text-right transition-all ${
                          isDark
                            ? 'bg-dark-100 border-zinc-700 text-white focus:border-brand-500'
                            : 'bg-white border-slate-200 text-slate-900 focus:border-brand-500'
                        } focus:outline-none focus:ring-1 focus:ring-brand-500`}
                      />
                    </td>

                    {/* Line Total */}
                    <td className={`px-3 py-2 text-right whitespace-nowrap font-semibold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {formatINR(item.lineTotal)}
                    </td>

                    {/* Remove button */}
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        disabled={formData.lineItems.length <= 1}
                        title="Remove line item"
                        className={`p-1 rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed ${
                          isDark
                            ? 'text-zinc-500 hover:text-red-400 hover:bg-red-900/20'
                            : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals + Terms/Notes Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Terms & Notes */}
          <div className={`${cardClass} p-6 space-y-4`}>
            <div>
              <label className={labelClass}>Terms &amp; Conditions</label>
              <div className={`rounded-xl border p-3 space-y-2 ${
                isDark ? 'bg-dark-100 border-zinc-700' : 'bg-white border-slate-200'
              }`}>
                {availableTerms.length === 0 && (
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No terms available. Add a custom term below.</p>
                )}
                {availableTerms.map(term => (
                  <div key={term.id} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id={`term-${term.id}`}
                      checked={formData.selectedTermIds.includes(term.id)}
                      onChange={() => {
                        setFormData(prev => ({
                          ...prev,
                          selectedTermIds: prev.selectedTermIds.includes(term.id)
                            ? prev.selectedTermIds.filter(id => id !== term.id)
                            : [...prev.selectedTermIds, term.id],
                        }));
                      }}
                      className="mt-1 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <label htmlFor={`term-${term.id}`} className={`text-sm flex-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {term.content}
                    </label>
                    {!term.isPredefined && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await quoteTermsApi.delete(term.id);
                            setAvailableTerms(prev => prev.filter(t => t.id !== term.id));
                            setFormData(prev => ({
                              ...prev,
                              selectedTermIds: prev.selectedTermIds.filter(id => id !== term.id),
                            }));
                          } catch { /* ignore */ }
                        }}
                        className={`p-0.5 rounded hover:bg-red-100 ${isDark ? 'text-zinc-500 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-500'}`}
                        title="Delete custom term"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add custom term */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newTermText}
                    onChange={e => setNewTermText(e.target.value)}
                    placeholder="Add a custom term..."
                    className={`flex-1 px-2 py-1.5 rounded-lg border text-xs transition-all ${
                      isDark
                        ? 'bg-dark-200 border-zinc-600 text-white placeholder-zinc-500 focus:border-brand-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
                    } focus:outline-none focus:ring-1 focus:ring-brand-500`}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && newTermText.trim()) {
                        e.preventDefault();
                        try {
                          const created = await quoteTermsApi.create({ content: newTermText.trim(), sortOrder: availableTerms.length });
                          setAvailableTerms(prev => [...prev, created]);
                          setFormData(prev => ({ ...prev, selectedTermIds: [...prev.selectedTermIds, created.id] }));
                          setNewTermText('');
                        } catch { /* ignore */ }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newTermText.trim()) return;
                      try {
                        const created = await quoteTermsApi.create({ content: newTermText.trim(), sortOrder: availableTerms.length });
                        setAvailableTerms(prev => [...prev, created]);
                        setFormData(prev => ({ ...prev, selectedTermIds: [...prev.selectedTermIds, created.id] }));
                        setNewTermText('');
                      } catch { /* ignore */ }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-brand-600 hover:bg-brand-700 text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="notes" className={labelClass}>Internal Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Notes visible only to your team..."
                value={formData.notes}
                onChange={handleFormFieldChange}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Totals */}
          <div className={`${cardClass} p-6`}>
            <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
              <IndianRupee className="w-4 h-4" />
              Totals
            </h3>

            <div className="space-y-3">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Subtotal</span>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {formatINR(subtotal)}
                </span>
              </div>

              {/* Discount Amount */}
              <div className="flex items-center justify-between gap-4">
                <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Discount Amount</span>
                <input
                  type="number"
                  name="discountAmount"
                  min="0"
                  step="0.01"
                  value={formData.discountAmount || ''}
                  onChange={handleFormFieldChange}
                  className={`w-36 px-3 py-1.5 rounded-lg border text-sm text-right transition-all ${
                    isDark
                      ? 'bg-dark-100 border-zinc-700 text-white focus:border-brand-500'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-brand-500'
                  } focus:outline-none focus:ring-1 focus:ring-brand-500`}
                />
              </div>

              {/* Tax Rate */}
              <div className="flex items-center justify-between gap-4">
                <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Tax Rate %</span>
                <input
                  type="number"
                  name="taxRate"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.taxRate || ''}
                  onChange={handleFormFieldChange}
                  className={`w-36 px-3 py-1.5 rounded-lg border text-sm text-right transition-all ${
                    isDark
                      ? 'bg-dark-100 border-zinc-700 text-white focus:border-brand-500'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-brand-500'
                  } focus:outline-none focus:ring-1 focus:ring-brand-500`}
                />
              </div>

              {/* Tax Amount */}
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Tax Amount</span>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {formatINR(taxAmount)}
                </span>
              </div>

              {/* Separator */}
              <div className={`border-t pt-3 ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Total Amount
                  </span>
                  <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatINR(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`${cardClass} p-4`}>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goToList}
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isDark
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              } disabled:opacity-50`}
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
                  isDark
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><FileText className="w-4 h-4" /> Save as Draft</>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4" /> Save &amp; Send</>
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Detail View
  // ---------------------------------------------------------------------------

  const renderDetailView = () => {
    if (isDetailLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Loading quote...
          </p>
        </div>
      );
    }

    if (!detailQuote) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className={`w-8 h-8 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
          <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Quote not found
          </p>
          <button
            onClick={goToList}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Quotes
          </button>
        </div>
      );
    }

    const q = detailQuote;

    return (
      <>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={goToList}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className={`text-xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {q.quoteNumber || `Quote #${q.id.slice(0, 8)}`}
                </h1>
                <span className={statusBadge(q.status, isDark)}>
                  {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                </span>
              </div>
              <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Created {formatDate(q.createdAt)}
                {q.validUntil && ` \u00B7 Valid until ${formatDate(q.validUntil)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Edit button */}
            <button
              onClick={() => goToEdit(q.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>

            {/* Download PDF */}
            <button
              onClick={() => handleDownloadPDF(false)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-800'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              <Download className="w-4 h-4" />
              {q.pdfUrl ? 'Download PDF' : 'Generate PDF'}
            </button>

            {q.pdfUrl && (
              <button
                onClick={() => handleDownloadPDF(true)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isDark
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                Regenerate PDF
              </button>
            )}

            {/* Delete */}
            {deleteConfirmId === q.id ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(q.id)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirmId(q.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isDark
                    ? 'text-red-400 hover:bg-red-900/20 border border-zinc-700'
                    : 'text-red-600 hover:bg-red-50 border border-slate-200'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Status Actions */}
        {(q.status === 'draft' || q.status === 'sent') && (
          <div className={`${cardClass} p-4`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Actions:
              </span>

              {q.status === 'draft' && (
                <button
                  onClick={() => handleStatusUpdate('sent')}
                  disabled={isStatusUpdating}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all btn-premium disabled:opacity-50"
                >
                  {isStatusUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Mark as Sent
                </button>
              )}

              {q.status === 'sent' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate('accepted')}
                    disabled={isStatusUpdating}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all btn-premium disabled:opacity-50"
                  >
                    {isStatusUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Mark as Accepted
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={isStatusUpdating}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                  >
                    {isStatusUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Mark as Rejected
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Quote Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Customer & Partner Info */}
          <div className={`${cardClass} p-6 lg:col-span-1`}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              Quote Information
            </h3>

            <div className="space-y-4">
              <div>
                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Customer</p>
                <div className="flex items-center gap-2 mt-1">
                  <UserIcon className={`w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {q.customerName}
                  </p>
                </div>
              </div>

              {q.partnerName && (
                <div>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Partner</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className={`w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {q.partnerName}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Quote Number</p>
                <p className={`text-sm font-medium mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {q.quoteNumber || '-'}
                </p>
              </div>

              <div>
                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Created</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  {formatDateTime(q.createdAt)}
                </p>
              </div>

              {q.validUntil && (
                <div>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Valid Until</p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    {formatDate(q.validUntil)}
                  </p>
                </div>
              )}

              {q.updatedAt && (
                <div>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Last Updated</p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    {formatDateTime(q.updatedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Line items + Totals */}
          <div className="lg:col-span-2 space-y-6">
            {/* Line Items Table */}
            <div className={`${cardClass} overflow-hidden`}>
              <div className={`px-6 py-4 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Line Items
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                      {['#', 'Product / Description', 'Qty', 'Unit Price', 'Total'].map(h => (
                        <th
                          key={h}
                          className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                            isDark ? 'text-zinc-500' : 'text-slate-400'
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(q.lineItems || []).map((li, idx) => (
                      <tr
                        key={li.id || idx}
                        className={`border-b ${isDark ? 'border-zinc-800/50' : 'border-slate-50'}`}
                      >
                        <td className={`px-4 py-3 text-center ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                          {idx + 1}
                        </td>
                        <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <p className="font-medium">{li.productName || '-'}</p>
                          {li.description && li.description !== li.productName && (
                            <div
                              className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'} [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4`}
                              dangerouslySetInnerHTML={{ __html: li.description }}
                            />
                          )}
                        </td>
                        <td className={`px-4 py-3 text-center ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {li.quantity}
                        </td>
                        <td className={`px-4 py-3 text-right whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {formatINR(li.unitPrice)}
                        </td>
                        <td className={`px-4 py-3 text-right whitespace-nowrap font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {formatINR(li.lineTotal)}
                        </td>
                      </tr>
                    ))}

                    {(!q.lineItems || q.lineItems.length === 0) && (
                      <tr>
                        <td colSpan={5} className={`px-4 py-8 text-center ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                          No line items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className={`px-6 py-4 border-t ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Subtotal</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatINR(q.subtotal)}
                      </span>
                    </div>

                    {q.discountAmount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Discount</span>
                        <span className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                          -{formatINR(q.discountAmount)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Tax ({q.taxRate}%)
                      </span>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatINR(q.taxAmount)}
                      </span>
                    </div>

                    <div className={`flex items-center justify-between pt-2 border-t ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
                      <span className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Total
                      </span>
                      <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatINR(q.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms & Notes */}
            {(q.terms || q.notes) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {q.terms && (
                  <div className={`${cardClass} p-6`}>
                    <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      Terms &amp; Conditions
                    </h4>
                    <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {q.terms}
                    </p>
                  </div>
                )}

                {q.notes && (
                  <div className={`${cardClass} p-6`}>
                    <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      Notes
                    </h4>
                    <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {q.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {viewMode === 'list' && renderListView()}
      {(viewMode === 'create' || viewMode === 'edit') && renderFormView()}
      {viewMode === 'detail' && renderDetailView()}
    </div>
  );
};
