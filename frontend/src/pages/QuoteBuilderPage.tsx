import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, Edit2, Trash2,
  IndianRupee, Loader2, AlertCircle, CheckCircle, Calendar,
  FileText, Eye, Package, Send, ArrowLeft, Download,
  User as UserIcon, Building2, Hash
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { quotesApi, productsApi, partnersApi, quoteTermsApi, formatINR } from '@/services/api';
import { Quote, QuoteTerm, Product, Partner, PaginatedResponse } from '@/types';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { useColumnResize } from '@/hooks/useColumnResize';
import {
  Card, Button, Input, Select, Badge, Alert, Textarea,
  Pagination,
} from '@/components/ui';

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

const STATUS_BADGE_VARIANT: Record<QuoteStatus, 'gray' | 'blue' | 'emerald' | 'red'> = {
  draft: 'gray',
  sent: 'blue',
  accepted: 'emerald',
  rejected: 'red',
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

function calcLineTotal(qty: number, unitPrice: number): number {
  return qty * unitPrice;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const QuoteBuilderPage: React.FC = () => {
  const { user } = useAuth();

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
      fetchQuotes();
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
          <h1 className="text-xl font-bold font-display text-gray-900 dark:text-white">
            Quote Builder
          </h1>
          <p className="text-sm mt-0.5 text-gray-500 dark:text-zinc-400">
            Create, manage, and send quotations to customers
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <Card padding="none" className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Search by customer name or quote number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Filter: Status */}
          <div className="w-full lg:w-44">
            <Select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {QUOTE_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="md"
              icon={<X className="w-3.5 h-3.5" />}
              onClick={clearFilters}
            >
              Clear
            </Button>
          )}

          {/* New Quote */}
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={goToCreate}
            shine
            className="whitespace-nowrap"
          >
            New Quote
          </Button>
        </div>
      </Card>

      {/* Data Table */}
      <Card padding="none" className="overflow-hidden">
        {tableError && (
          <div className="m-4">
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />} onClose={() => setTableError('')}>
              {tableError}
            </Alert>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">
              Loading quotes...
            </p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gray-100 dark:bg-zinc-800">
              <FileText className="w-7 h-7 text-gray-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">
              {hasActiveFilters ? 'No quotes match your filters' : 'No quotes yet'}
            </p>
            <p className="text-xs mt-1 text-gray-400 dark:text-zinc-500">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Click "New Quote" to create one'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-zinc-800">
                    {['Quote #', 'Customer', 'Partner', 'Date', 'Amount', 'Status', 'Actions'].map((h, i) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 resizable-th"
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
                      className="border-b transition-colors cursor-pointer border-gray-50 hover:bg-gray-50/80 dark:border-zinc-800/50 dark:hover:bg-zinc-800/30"
                    >
                      {/* Quote # */}
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Hash className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
                          <span className="font-medium">{quote.quoteNumber || quote.id.slice(0, 8)}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
                          {quote.customerName}
                        </div>
                      </td>

                      {/* Partner */}
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {quote.partnerName || '-'}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                          {formatDate(quote.createdAt)}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-900 dark:text-white">
                        {formatINR(quote.totalAmount)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGE_VARIANT[quote.status]}>
                          {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={<Eye className="w-4 h-4" />}
                            onClick={() => goToDetail(quote.id)}
                            title="View"
                            className="p-1.5"
                          />
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={<Edit2 className="w-4 h-4" />}
                            onClick={() => goToEdit(quote.id)}
                            title="Edit"
                            className="p-1.5"
                          />

                          {deleteConfirmId === quote.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="danger"
                                size="xs"
                                onClick={() => handleDelete(quote.id)}
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
                              icon={<Trash2 className="w-4 h-4" />}
                              onClick={() => setDeleteConfirmId(quote.id)}
                              title="Delete"
                              className="p-1.5 hover:text-red-600 dark:hover:text-red-400"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-gray-100 dark:border-zinc-800">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalRecords}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>
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
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="w-5 h-5" />}
              onClick={goToList}
              className="p-2"
            />
            <div>
              <h1 className="text-xl font-bold font-display text-gray-900 dark:text-white">
                {isEdit ? 'Edit Quote' : 'New Quote'}
              </h1>
              <p className="text-sm mt-0.5 text-gray-500 dark:text-zinc-400">
                {isEdit ? 'Update quotation details' : 'Build a new quotation for your customer'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Error */}
        {formError && (
          <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />} onClose={() => setFormError('')}>
            {formError}
          </Alert>
        )}

        {/* Quote Header Section */}
        <Card>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <FileText className="w-4 h-4" />
            Quote Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Partner */}
            <Select
              label="Partner"
              id="partnerId"
              name="partnerId"
              value={formData.partnerId}
              onChange={handleFormFieldChange}
            >
              <option value="">Select Partner (Optional)</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.companyName}</option>
              ))}
            </Select>

            {/* Customer Name */}
            <Input
              label="Customer Name *"
              id="customerName"
              name="customerName"
              type="text"
              placeholder="Enter customer name"
              value={formData.customerName}
              onChange={handleFormFieldChange}
              icon={<UserIcon className="w-4 h-4" />}
              required
            />

            {/* Valid Until */}
            <Input
              label="Valid Until"
              id="validUntil"
              name="validUntil"
              type="date"
              value={formData.validUntil}
              onChange={handleFormFieldChange}
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>
        </Card>

        {/* Line Items Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Package className="w-4 h-4" />
              Line Items
            </h3>
            <Button
              variant="primary"
              size="xs"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={addLineItem}
            >
              Add Line Item
            </Button>
          </div>

          {/* Line items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800">
                  {['#', 'Product', 'Description', 'Qty', 'Unit Price', 'Line Total', ''].map(h => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400"
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
                    className="border-b border-gray-50 dark:border-zinc-800/50"
                  >
                    {/* Row number */}
                    <td className="px-3 py-2 text-center text-gray-400 dark:text-zinc-500">
                      {idx + 1}
                    </td>

                    {/* Product */}
                    <td className="px-3 py-2">
                      <Select
                        value={item.productId}
                        onChange={e => updateLineItem(idx, 'productId', e.target.value)}
                        className="text-xs py-1.5"
                      >
                        <option value="">Select product</option>
                        {products.filter(p => p.isActive).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </Select>
                    </td>

                    {/* Description */}
                    <td className="px-3 py-2" style={{ minWidth: 250 }}>
                      <RichTextEditor
                        value={item.description}
                        onChange={(html) => updateLineItem(idx, 'description', html)}
                        placeholder="Enter description..."
                        minHeight="50px"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={item.quantity || ''}
                        onChange={e => updateLineItem(idx, 'quantity', Number(e.target.value) || 0)}
                        className="w-20 text-xs text-right py-1.5"
                      />
                    </td>

                    {/* Unit Price */}
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice || ''}
                        onChange={e => updateLineItem(idx, 'unitPrice', Number(e.target.value) || 0)}
                        className="w-28 text-xs text-right py-1.5"
                      />
                    </td>

                    {/* Line Total */}
                    <td className="px-3 py-2 text-right whitespace-nowrap font-semibold text-gray-900 dark:text-white">
                      {formatINR(item.lineTotal)}
                    </td>

                    {/* Remove button */}
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => removeLineItem(idx)}
                        disabled={formData.lineItems.length <= 1}
                        title="Remove line item"
                        className="p-1 hover:text-red-600 dark:hover:text-red-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Totals + Terms/Notes Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Terms & Notes */}
          <Card className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Terms &amp; Conditions
              </label>
              <div className="rounded-xl border p-3 space-y-2 bg-white border-gray-200 dark:bg-dark-100 dark:border-zinc-700">
                {availableTerms.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-zinc-500">No terms available. Add a custom term below.</p>
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
                      className="mt-1 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <label htmlFor={`term-${term.id}`} className="text-sm flex-1 text-gray-700 dark:text-gray-300">
                      {term.content}
                    </label>
                    {!term.isPredefined && (
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={<X className="w-3.5 h-3.5" />}
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
                        title="Delete custom term"
                        className="p-0.5 hover:text-red-500 dark:hover:text-red-400"
                      />
                    )}
                  </div>
                ))}

                {/* Add custom term */}
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    value={newTermText}
                    onChange={e => setNewTermText(e.target.value)}
                    placeholder="Add a custom term..."
                    className="flex-1 text-xs py-1.5"
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
                  <Button
                    variant="primary"
                    size="xs"
                    icon={<Plus className="w-3 h-3" />}
                    onClick={async () => {
                      if (!newTermText.trim()) return;
                      try {
                        const created = await quoteTermsApi.create({ content: newTermText.trim(), sortOrder: availableTerms.length });
                        setAvailableTerms(prev => [...prev, created]);
                        setFormData(prev => ({ ...prev, selectedTermIds: [...prev.selectedTermIds, created.id] }));
                        setNewTermText('');
                      } catch { /* ignore */ }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
            <Textarea
              label="Internal Notes"
              id="notes"
              name="notes"
              rows={3}
              placeholder="Notes visible only to your team..."
              value={formData.notes}
              onChange={handleFormFieldChange}
              className="resize-none"
            />
          </Card>

          {/* Totals */}
          <Card>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <IndianRupee className="w-4 h-4" />
              Totals
            </h3>

            <div className="space-y-3">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-zinc-400">Subtotal</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatINR(subtotal)}
                </span>
              </div>

              {/* Discount Amount */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500 dark:text-zinc-400">Discount Amount</span>
                <Input
                  type="number"
                  name="discountAmount"
                  min={0}
                  step={0.01}
                  value={formData.discountAmount || ''}
                  onChange={handleFormFieldChange}
                  className="w-36 text-sm text-right py-1.5"
                />
              </div>

              {/* Tax Rate */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500 dark:text-zinc-400">Tax Rate %</span>
                <Input
                  type="number"
                  name="taxRate"
                  min={0}
                  max={100}
                  step={0.1}
                  value={formData.taxRate || ''}
                  onChange={handleFormFieldChange}
                  className="w-36 text-sm text-right py-1.5"
                />
              </div>

              {/* Tax Amount */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-zinc-400">Tax Amount</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatINR(taxAmount)}
                </span>
              </div>

              {/* Separator */}
              <div className="border-t pt-3 border-gray-200 dark:border-zinc-700">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-gray-900 dark:text-white">
                    Total Amount
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatINR(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card padding="none" className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={goToList}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                icon={<FileText className="w-4 h-4" />}
                onClick={() => handleSave(false)}
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save as Draft'}
              </Button>

              <Button
                variant="primary"
                icon={<Send className="w-4 h-4" />}
                onClick={() => handleSave(true)}
                disabled={isSubmitting}
                loading={isSubmitting}
                shine
              >
                {isSubmitting ? 'Sending...' : 'Save & Send'}
              </Button>
            </div>
          </div>
        </Card>
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
          <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">
            Loading quote...
          </p>
        </div>
      );
    }

    if (!detailQuote) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">
            Quote not found
          </p>
          <Button
            variant="primary"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={goToList}
            className="mt-4"
          >
            Back to Quotes
          </Button>
        </div>
      );
    }

    const q = detailQuote;

    return (
      <>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="w-5 h-5" />}
              onClick={goToList}
              className="p-2"
            />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold font-display text-gray-900 dark:text-white">
                  {q.quoteNumber || `Quote #${q.id.slice(0, 8)}`}
                </h1>
                <Badge variant={STATUS_BADGE_VARIANT[q.status]}>
                  {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm mt-0.5 text-gray-500 dark:text-zinc-400">
                Created {formatDate(q.createdAt)}
                {q.validUntil && ` \u00B7 Valid until ${formatDate(q.validUntil)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Edit button */}
            <Button
              variant="secondary"
              icon={<Edit2 className="w-4 h-4" />}
              onClick={() => goToEdit(q.id)}
            >
              Edit
            </Button>

            {/* Download PDF */}
            <Button
              variant="success"
              icon={<Download className="w-4 h-4" />}
              onClick={() => handleDownloadPDF(false)}
            >
              {q.pdfUrl ? 'Download PDF' : 'Generate PDF'}
            </Button>

            {q.pdfUrl && (
              <Button
                variant="secondary"
                icon={<FileText className="w-4 h-4" />}
                onClick={() => handleDownloadPDF(true)}
              >
                Regenerate PDF
              </Button>
            )}

            {/* Delete */}
            {deleteConfirmId === q.id ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  onClick={() => handleDelete(q.id)}
                >
                  Confirm Delete
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => setDeleteConfirmId(q.id)}
                className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-zinc-700 dark:hover:bg-red-900/20"
              >
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Status Actions */}
        {(q.status === 'draft' || q.status === 'sent') && (
          <Card padding="none" className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">
                Actions:
              </span>

              {q.status === 'draft' && (
                <Button
                  variant="primary"
                  icon={isStatusUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  onClick={() => handleStatusUpdate('sent')}
                  disabled={isStatusUpdating}
                  shine
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Mark as Sent
                </Button>
              )}

              {q.status === 'sent' && (
                <>
                  <Button
                    variant="success"
                    icon={isStatusUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    onClick={() => handleStatusUpdate('accepted')}
                    disabled={isStatusUpdating}
                    shine
                  >
                    Mark as Accepted
                  </Button>
                  <Button
                    variant="danger"
                    icon={isStatusUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={isStatusUpdating}
                  >
                    Mark as Rejected
                  </Button>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Quote Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Customer & Partner Info */}
          <Card className="lg:col-span-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-gray-500 dark:text-zinc-400">
              Quote Information
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 dark:text-zinc-500">Customer</p>
                <div className="flex items-center gap-2 mt-1">
                  <UserIcon className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {q.customerName}
                  </p>
                </div>
              </div>

              {q.partnerName && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Partner</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {q.partnerName}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400 dark:text-zinc-500">Quote Number</p>
                <p className="text-sm font-medium mt-1 text-gray-900 dark:text-white">
                  {q.quoteNumber || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 dark:text-zinc-500">Created</p>
                <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                  {formatDateTime(q.createdAt)}
                </p>
              </div>

              {q.validUntil && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Valid Until</p>
                  <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                    {formatDate(q.validUntil)}
                  </p>
                </div>
              )}

              {q.updatedAt && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Last Updated</p>
                  <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                    {formatDateTime(q.updatedAt)}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Right: Line items + Totals */}
          <div className="lg:col-span-2 space-y-6">
            {/* Line Items Table */}
            <Card padding="none" className="overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                  Line Items
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-zinc-800">
                      {['#', 'Product / Description', 'Qty', 'Unit Price', 'Total'].map(h => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400"
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
                        className="border-b border-gray-50 dark:border-zinc-800/50"
                      >
                        <td className="px-4 py-3 text-center text-gray-400 dark:text-zinc-500">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          <p className="font-medium">{li.productName || '-'}</p>
                          {li.description && li.description !== li.productName && (
                            <div
                              className="text-xs mt-0.5 text-gray-500 dark:text-zinc-400 [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
                              dangerouslySetInnerHTML={{ __html: li.description }}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                          {li.quantity}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {formatINR(li.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-gray-900 dark:text-white">
                          {formatINR(li.lineTotal)}
                        </td>
                      </tr>
                    ))}

                    {(!q.lineItems || q.lineItems.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-zinc-500">
                          No line items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-zinc-400">Subtotal</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatINR(q.subtotal)}
                      </span>
                    </div>

                    {q.discountAmount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">Discount</span>
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">
                          -{formatINR(q.discountAmount)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-zinc-400">
                        Tax ({q.taxRate}%)
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatINR(q.taxAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-zinc-700">
                      <span className="text-base font-bold text-gray-900 dark:text-white">
                        Total
                      </span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatINR(q.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Terms & Notes */}
            {(q.terms || q.notes) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {q.terms && (
                  <Card>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500 dark:text-zinc-400">
                      Terms &amp; Conditions
                    </h4>
                    <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {q.terms}
                    </p>
                  </Card>
                )}

                {q.notes && (
                  <Card>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500 dark:text-zinc-400">
                      Notes
                    </h4>
                    <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {q.notes}
                    </p>
                  </Card>
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
