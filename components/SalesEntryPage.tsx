import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, Edit2, Trash2, X, ChevronLeft, ChevronRight,
  IndianRupee, ShoppingCart, Clock, CheckCircle, Loader2, AlertCircle,
  Calendar, FileText, Package, User as UserIcon
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { salesApi, productsApi, partnersApi, formatINR } from '../services/api';
import { SalesEntry, Product, Partner, PaginatedResponse } from '../types';

// ---------------------------------------------------------------------------
// Types local to this page
// ---------------------------------------------------------------------------

interface SalesSummary {
  totalAmount: number;
  totalCount: number;
  totalCommission: number;
  pendingPayments: number;
  paidCount: number;
}

interface SalesFormData {
  partnerId: string;
  productId: string;
  customerName: string;
  quantity: number;
  amount: number;
  poNumber: string;
  invoiceNo: string;
  paymentStatus: string;
  saleDate: string;
  notes: string;
}

const EMPTY_FORM: SalesFormData = {
  partnerId: '',
  productId: '',
  customerName: '',
  quantity: 1,
  amount: 0,
  poNumber: '',
  invoiceNo: '',
  paymentStatus: 'pending',
  saleDate: new Date().toISOString().split('T')[0],
  notes: '',
};

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function paymentBadge(status: string, isDark: boolean): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  switch (status) {
    case 'paid':
      return `${base} ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`;
    case 'pending':
      return `${base} ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700'}`;
    case 'overdue':
      return `${base} ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'}`;
    case 'cancelled':
      return `${base} ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`;
    default:
      return `${base} ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`;
  }
}

function formatDate(dateStr: string): string {
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SalesEntryPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  // Data state
  const [sales, setSales] = useState<SalesEntry[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [filterPartner, setFilterPartner] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SalesFormData>({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [tableError, setTableError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailEntry, setDetailEntry] = useState<SalesEntry | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    setTableError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (filterPartner) params.partnerId = filterPartner;
      if (filterProduct) params.productId = filterProduct;
      if (filterPaymentStatus) params.paymentStatus = filterPaymentStatus;
      if (searchTerm) params.search = searchTerm;

      const response: PaginatedResponse<SalesEntry> = await salesApi.list(params);
      setSales(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);
    } catch (err: any) {
      setTableError(err.message || 'Failed to load sales entries');
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterPartner, filterProduct, filterPaymentStatus, searchTerm]);

  const fetchSummary = useCallback(async () => {
    setIsSummaryLoading(true);
    try {
      const data = await salesApi.summary();
      setSummary(data);
    } catch {
      // Summary is non-critical, fail silently
      setSummary(null);
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [productsList, partnersResponse] = await Promise.all([
        productsApi.list(),
        partnersApi.list({ limit: '100', status: 'approved' }),
      ]);
      setProducts(Array.isArray(productsList) ? productsList : []);
      // partnersApi.list returns paginated
      const partnerData = partnersResponse?.data ?? partnersResponse;
      setPartners(Array.isArray(partnerData) ? partnerData : []);
    } catch {
      // Dropdown data failure is non-critical
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDropdownData();
    fetchSummary();
  }, [fetchDropdownData, fetchSummary]);

  // Re-fetch on pagination / filter change
  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterPartner, filterProduct, filterPaymentStatus, searchTerm]);

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  const openCreateModal = () => {
    setFormData({ ...EMPTY_FORM });
    setEditingId(null);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (entry: SalesEntry) => {
    setFormData({
      partnerId: entry.partnerId,
      productId: entry.productId,
      customerName: entry.customerName || '',
      quantity: entry.quantity,
      amount: entry.amount,
      poNumber: entry.poNumber || '',
      invoiceNo: entry.invoiceNo || '',
      paymentStatus: entry.paymentStatus,
      saleDate: entry.saleDate ? entry.saleDate.split('T')[0] : '',
      notes: entry.notes || '',
    });
    setEditingId(entry.id);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormError('');
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'amount' ? Number(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.partnerId) {
      setFormError('Please select a partner');
      return;
    }
    if (!formData.productId) {
      setFormError('Please select a product');
      return;
    }
    if (formData.quantity <= 0) {
      setFormError('Quantity must be greater than 0');
      return;
    }
    if (formData.amount <= 0) {
      setFormError('Amount must be greater than 0');
      return;
    }
    if (!formData.saleDate) {
      setFormError('Please enter the sale date');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        salespersonId: user?.id,
      };

      if (editingId) {
        await salesApi.update(editingId, payload);
      } else {
        await salesApi.create(payload);
      }

      closeModal();
      fetchSales();
      fetchSummary();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save sales entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await salesApi.delete(id);
      setDeleteConfirmId(null);
      fetchSales();
      fetchSummary();
    } catch (err: any) {
      setTableError(err.message || 'Failed to delete entry');
    }
  };

  const clearFilters = () => {
    setFilterPartner('');
    setFilterProduct('');
    setFilterPaymentStatus('');
    setSearchTerm('');
  };

  const hasActiveFilters = filterPartner || filterProduct || filterPaymentStatus || searchTerm;

  // ---------------------------------------------------------------------------
  // Detail modal handlers
  // ---------------------------------------------------------------------------

  const openDetailModal = (entry: SalesEntry) => {
    setDetailEntry(entry);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailEntry(null);
  };

  // ---------------------------------------------------------------------------
  // Styling helpers
  // ---------------------------------------------------------------------------

  const cardClass = `premium-card ${isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-soft'}`;
  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm transition-all ${
    isDark
      ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
  } focus:outline-none focus:ring-1 focus:ring-brand-500`;
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales Amount */}
        <div className={`${cardClass} p-4 hover-lift animate-fade-in-up stagger-1`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            isDark ? 'bg-brand-900/20' : 'bg-brand-50'
          }`}>
            <IndianRupee className={`w-5 h-5 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
          </div>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Total Sales Amount</p>
          {isSummaryLoading ? (
            <div className="h-7 mt-0.5 flex items-center">
              <div className={`w-24 h-5 rounded animate-pulse ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`} />
            </div>
          ) : (
            <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatINR(summary?.totalAmount ?? 0)}
            </p>
          )}
        </div>

        {/* Total Entries */}
        <div className={`${cardClass} p-4 hover-lift animate-fade-in-up stagger-2`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'
          }`}>
            <ShoppingCart className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </div>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Total Entries</p>
          {isSummaryLoading ? (
            <div className="h-7 mt-0.5 flex items-center">
              <div className={`w-16 h-5 rounded animate-pulse ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`} />
            </div>
          ) : (
            <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {summary?.totalCount ?? 0}
            </p>
          )}
        </div>

        {/* Pending Payments */}
        <div className={`${cardClass} p-4 hover-lift animate-fade-in-up stagger-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            isDark ? 'bg-amber-900/20' : 'bg-amber-50'
          }`}>
            <Clock className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Pending Payments</p>
          {isSummaryLoading ? (
            <div className="h-7 mt-0.5 flex items-center">
              <div className={`w-12 h-5 rounded animate-pulse ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`} />
            </div>
          ) : (
            <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {summary?.pendingPayments ?? 0}
            </p>
          )}
        </div>

        {/* Paid Count */}
        <div className={`${cardClass} p-4 hover-lift animate-fade-in-up stagger-4`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            isDark ? 'bg-green-900/20' : 'bg-green-50'
          }`}>
            <CheckCircle className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          </div>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Paid</p>
          {isSummaryLoading ? (
            <div className="h-7 mt-0.5 flex items-center">
              <div className={`w-12 h-5 rounded animate-pulse ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`} />
            </div>
          ) : (
            <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {summary?.paidCount ?? 0}
            </p>
          )}
        </div>
      </div>

      {/* Toolbar: Search + Filters + New Entry */}
      <div className={`${cardClass} p-4`}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-zinc-500' : 'text-slate-400'
            }`} />
            <input
              type="text"
              placeholder="Search by customer name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
                isDark
                  ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
              } focus:outline-none focus:ring-1 focus:ring-brand-500`}
            />
          </div>

          {/* Filter: Partner */}
          <div className="w-full lg:w-48">
            <select
              value={filterPartner}
              onChange={e => setFilterPartner(e.target.value)}
              className={selectClass}
            >
              <option value="">All Partners</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.companyName}</option>
              ))}
            </select>
          </div>

          {/* Filter: Product */}
          <div className="w-full lg:w-48">
            <select
              value={filterProduct}
              onChange={e => setFilterProduct(e.target.value)}
              className={selectClass}
            >
              <option value="">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Filter: Payment Status */}
          <div className="w-full lg:w-44">
            <select
              value={filterPaymentStatus}
              onChange={e => setFilterPaymentStatus(e.target.value)}
              className={selectClass}
            >
              <option value="">All Statuses</option>
              {PAYMENT_STATUSES.map(s => (
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

          {/* New Entry */}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Entry
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className={`${cardClass} overflow-hidden`}>
        {/* Table Error */}
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
              Loading sales entries...
            </p>
          </div>
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
              isDark ? 'bg-zinc-800' : 'bg-slate-100'
            }`}>
              <ShoppingCart className={`w-7 h-7 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
            </div>
            <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              {hasActiveFilters ? 'No sales entries match your filters' : 'No sales entries yet'}
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
              {hasActiveFilters ? 'Try adjusting your filters' : 'Click "New Entry" to create one'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                    {['Sale Date', 'Partner', 'Product', 'Customer', 'Qty', 'Amount', 'Payment', 'Actions'].map(h => (
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
                  {sales.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      onClick={() => openDetailModal(entry)}
                      className={`border-b transition-colors cursor-pointer ${
                        isDark
                          ? 'border-zinc-800/50 hover:bg-zinc-800/30'
                          : 'border-slate-50 hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Sale Date */}
                      <td className={`px-4 py-3 whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        <div className="flex items-center gap-2">
                          <Calendar className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                          {formatDate(entry.saleDate)}
                        </div>
                      </td>

                      {/* Partner */}
                      <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <span className="font-medium">{entry.partnerName || '-'}</span>
                      </td>

                      {/* Product */}
                      <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {entry.productName || '-'}
                      </td>

                      {/* Customer */}
                      <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {entry.customerName || '-'}
                      </td>

                      {/* Quantity */}
                      <td className={`px-4 py-3 text-center ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {entry.quantity}
                      </td>

                      {/* Amount */}
                      <td className={`px-4 py-3 whitespace-nowrap font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatINR(entry.amount)}
                      </td>

                      {/* Payment Status */}
                      <td className="px-4 py-3">
                        <span className={paymentBadge(entry.paymentStatus, isDark)}>
                          {entry.paymentStatus.charAt(0).toUpperCase() + entry.paymentStatus.slice(1)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(entry); }}
                            title="Edit"
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark
                                ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20'
                                : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                            }`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {deleteConfirmId === entry.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                                className="px-2 py-1 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
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
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(entry.id); }}
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
                {Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords} entries
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

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => {
                    // Show first, last, current and adjacent pages
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-backdrop"
            onClick={closeModal}
          />

          {/* Modal content */}
          <div
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl animate-fade-in-up ${
              isDark
                ? 'bg-dark-50 border border-zinc-800'
                : 'bg-white shadow-premium'
            }`}
          >
            {/* Header */}
            <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {editingId ? 'Edit Sales Entry' : 'New Sales Entry'}
              </h2>
              <button
                onClick={closeModal}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
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

              {/* Row 1: Partner + Product */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="partnerId" className={labelClass}>
                    Partner <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="partnerId"
                    name="partnerId"
                    value={formData.partnerId}
                    onChange={handleFormChange}
                    className={selectClass}
                    required
                  >
                    <option value="">Select Partner</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.companyName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="productId" className={labelClass}>
                    Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="productId"
                    name="productId"
                    value={formData.productId}
                    onChange={handleFormChange}
                    className={selectClass}
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Customer Name + Sale Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customerName" className={labelClass}>Customer Name</label>
                  <div className="relative">
                    <UserIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? 'text-zinc-500' : 'text-slate-400'
                    }`} />
                    <input
                      id="customerName"
                      name="customerName"
                      type="text"
                      placeholder="Enter customer name"
                      value={formData.customerName}
                      onChange={handleFormChange}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="saleDate" className={labelClass}>
                    Sale Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? 'text-zinc-500' : 'text-slate-400'
                    }`} />
                    <input
                      id="saleDate"
                      name="saleDate"
                      type="date"
                      value={formData.saleDate}
                      onChange={handleFormChange}
                      className={`${inputClass} pl-10`}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Quantity + Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quantity" className={labelClass}>
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Package className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? 'text-zinc-500' : 'text-slate-400'
                    }`} />
                    <input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="1"
                      value={formData.quantity || ''}
                      onChange={handleFormChange}
                      className={`${inputClass} pl-10`}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="amount" className={labelClass}>
                    Amount (INR) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <IndianRupee className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? 'text-zinc-500' : 'text-slate-400'
                    }`} />
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount || ''}
                      onChange={handleFormChange}
                      className={`${inputClass} pl-10`}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: PO Number + Invoice No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="poNumber" className={labelClass}>PO Number</label>
                  <div className="relative">
                    <FileText className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? 'text-zinc-500' : 'text-slate-400'
                    }`} />
                    <input
                      id="poNumber"
                      name="poNumber"
                      type="text"
                      placeholder="PO-XXXX"
                      value={formData.poNumber}
                      onChange={handleFormChange}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="invoiceNo" className={labelClass}>Invoice No</label>
                  <div className="relative">
                    <FileText className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? 'text-zinc-500' : 'text-slate-400'
                    }`} />
                    <input
                      id="invoiceNo"
                      name="invoiceNo"
                      type="text"
                      placeholder="INV-XXXX"
                      value={formData.invoiceNo}
                      onChange={handleFormChange}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Payment Status */}
              <div>
                <label htmlFor="paymentStatus" className={labelClass}>
                  Payment Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="paymentStatus"
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleFormChange}
                  className={selectClass}
                  required
                >
                  {PAYMENT_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Row 6: Notes */}
              <div>
                <label htmlFor="notes" className={labelClass}>Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Any additional notes..."
                  value={formData.notes}
                  onChange={handleFormChange}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Footer actions */}
              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${
                isDark ? 'border-zinc-800' : 'border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isDark
                      ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {editingId ? 'Update Entry' : 'Create Entry'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
