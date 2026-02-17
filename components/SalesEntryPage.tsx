import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Trash2, X, ChevronLeft, ChevronRight,
  IndianRupee, CheckCircle, Loader2, AlertCircle,
  Download, Upload, Edit2, List as ListIcon,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { salesApi, productsApi, partnersApi, formatINR } from '../services/api';
import { exportToCsv } from '../utils/exportCsv';
import { SalesEntry, Product, Partner, PaginatedResponse } from '../types';
import { BulkImportModal } from './BulkImportModal';
import { useColumnResize } from '../hooks/useColumnResize';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function paymentBadge(status: string, isDark: boolean): string {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium';
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
  if (!dateStr) return '';
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

  // Data
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [sales, setSales] = useState<SalesEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  // Loading
  const [isLoading, setIsLoading] = useState(true);
  const [tableError, setTableError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SalesFormData>({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailEntry, setDetailEntry] = useState<SalesEntry | null>(null);

  // Delete
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);


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
      if (filterPaymentStatus) params.paymentStatus = filterPaymentStatus;
      if (searchTerm) params.search = searchTerm;
      if (filterFromDate) params.fromDate = filterFromDate;
      if (filterToDate) params.toDate = filterToDate;

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
  }, [page, filterPaymentStatus, searchTerm, filterFromDate, filterToDate]);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [productsList, partnersResponse] = await Promise.all([
        productsApi.list(),
        partnersApi.list({ limit: '100', status: 'approved' }),
      ]);
      setProducts(Array.isArray(productsList) ? productsList : []);
      const partnerData = partnersResponse?.data ?? partnersResponse;
      setPartners(Array.isArray(partnerData) ? partnerData : []);
    } catch {
      // Dropdown data failure is non-critical
    }
  }, []);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  useEffect(() => {
    setPage(1);
  }, [filterPaymentStatus, searchTerm, filterFromDate, filterToDate]);

  // Auto-clear success message
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // ---------------------------------------------------------------------------
  // Modal handlers
  // ---------------------------------------------------------------------------

  const openCreateModal = () => {
    setFormData({ ...EMPTY_FORM });
    setEditingId(null);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (entry: SalesEntry) => {
    setFormData({
      partnerId: entry.partnerId || '',
      productId: entry.productId || '',
      customerName: entry.customerName || '',
      quantity: entry.quantity || 1,
      amount: entry.amount || 0,
      poNumber: entry.poNumber || '',
      invoiceNo: entry.invoiceNo || '',
      paymentStatus: entry.paymentStatus || 'pending',
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

  const openDetailModal = (entry: SalesEntry) => {
    setDetailEntry(entry);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailEntry(null);
    setDeleteConfirmId(null);
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

    if (!formData.partnerId || !formData.productId || !formData.saleDate) {
      setFormError('Partner, Product, and Date are required');
      return;
    }
    if (formData.amount <= 0) {
      setFormError('Amount must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await salesApi.update(editingId, { ...formData, salespersonId: user?.id });
        setSuccessMsg('Entry updated');
      } else {
        await salesApi.create({ ...formData, salespersonId: user?.id });
        setSuccessMsg('Entry added');
      }
      closeModal();
      fetchSales();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  const handleDelete = async (id: string) => {
    try {
      await salesApi.delete(id);
      setDeleteConfirmId(null);
      setSuccessMsg('Entry deleted');
      fetchSales();
    } catch (err: any) {
      setTableError(err.message || 'Failed to delete');
    }
  };

  // ---------------------------------------------------------------------------
  // Filter helpers
  // ---------------------------------------------------------------------------

  const clearFilters = () => {
    setFilterPaymentStatus('');
    setSearchTerm('');
    setFilterFromDate('');
    setFilterToDate('');
  };

  const hasActiveFilters = filterPaymentStatus || searchTerm || filterFromDate || filterToDate;

  // ---------------------------------------------------------------------------
  // Lookup helpers
  // ---------------------------------------------------------------------------


  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const { colWidths: salesColWidths, onMouseDown: onSalesMouseDown } = useColumnResize({
    initialWidths: [50, 120, 160, 140, 130, 70, 130, 120, 110, 100],
  });

  const cardClass = `premium-card ${isDark ? '' : 'shadow-soft'}`;
  const selectFilterClass = `w-full px-3 py-2 rounded-xl border text-sm transition-all appearance-none cursor-pointer ${
    isDark
      ? 'bg-dark-100 border-zinc-700 text-white focus:border-brand-500'
      : 'bg-white border-slate-200 text-slate-900 focus:border-brand-500'
  } focus:outline-none focus:ring-1 focus:ring-brand-500`;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 animate-fade-in-up">
      {/* Toolbar */}
      <div className={`${cardClass} px-3 py-2.5 space-y-2`}>
        {/* Row 1: Search + Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search customer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm ${
                isDark
                  ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
              } focus:outline-none`}
            />
          </div>
          <select value={filterPaymentStatus} onChange={e => setFilterPaymentStatus(e.target.value)} className={`${selectFilterClass} lg:w-36`}>
            <option value="">All Status</option>
            {PAYMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterFromDate}
              onChange={e => setFilterFromDate(e.target.value)}
              className={`${selectFilterClass} w-[150px]`}
              title="From date"
            />
            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>to</span>
            <input
              type="date"
              value={filterToDate}
              onChange={e => setFilterToDate(e.target.value)}
              className={`${selectFilterClass} w-[150px]`}
              title="To date"
            />
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}>
              <X className="w-3 h-3" /> Clear Filters
            </button>
          )}
          <button
            onClick={() => setShowBulkImport(true)}
            title="Import from CSV"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              isDark
                ? 'text-zinc-400 border border-zinc-700 hover:bg-zinc-800'
                : 'text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
          <button
            onClick={() => exportToCsv('sales_entries', [
              { header: 'Date', accessor: (r: SalesEntry) => r.saleDate ? r.saleDate.split('T')[0] : '' },
              { header: 'Account', accessor: (r: SalesEntry) => r.customerName },
              { header: 'Product', accessor: (r: SalesEntry) => r.productNames && r.productNames.length > 0 ? r.productNames.map((n, i) => `${i + 1}. ${n}`).join(', ') : r.productName },
              { header: 'Customer', accessor: (r: SalesEntry) => r.customerName },
              { header: 'Quantity', accessor: (r: SalesEntry) => r.quantity },
              { header: 'Amount', accessor: (r: SalesEntry) => r.amount },
              { header: 'PO Number', accessor: (r: SalesEntry) => r.poNumber },
              { header: 'Invoice No', accessor: (r: SalesEntry) => r.invoiceNo },
              { header: 'Payment Status', accessor: (r: SalesEntry) => r.paymentStatus },
              { header: 'Notes', accessor: (r: SalesEntry) => r.notes },
            ], sales)}
            disabled={sales.length === 0}
            title="Export to CSV"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              isDark
                ? 'text-zinc-400 border border-zinc-700 hover:bg-zinc-800 disabled:opacity-30'
                : 'text-slate-500 border border-slate-200 hover:bg-slate-50 disabled:opacity-30'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Status messages */}
      {tableError && (
        <div className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
          isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {tableError}
          <button onClick={() => setTableError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {successMsg && (
        <div className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
          isDark ? 'bg-emerald-900/20 border border-emerald-800 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        }`}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Data Table */}
      <div className={`${cardClass} overflow-hidden`}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
            <p className={`mt-2 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Loading...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <IndianRupee className={`w-8 h-8 ${isDark ? 'text-zinc-700' : 'text-slate-300'}`} />
            <p className={`mt-2 text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              {hasActiveFilters ? 'No entries match filters' : 'No entries yet'}
            </p>
            {!hasActiveFilters && (
              <button
                onClick={openCreateModal}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Entry
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                  {['#', 'Date', 'Account', 'Product', 'Customer', 'Qty', 'Amount', 'PO #', 'Invoice #', 'Status'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider resizable-th ${
                        isDark ? 'text-zinc-500' : 'text-slate-400'
                      }`}
                      style={{ width: salesColWidths[i] }}
                    >
                      {h}
                      <div className="col-resize-handle" onMouseDown={e => onSalesMouseDown(i, e)} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((entry, idx) => {
                  const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
                  const isDeleting = deleteConfirmId === entry.id;

                  return (
                    <tr
                      key={entry.id}
                      onClick={() => !isDeleting && openDetailModal(entry)}
                      className={`border-b transition-colors cursor-pointer ${
                        isDark
                          ? 'border-zinc-800/50 hover:bg-zinc-800/30'
                          : 'border-slate-50 hover:bg-slate-50/80'
                      }`}
                    >
                      <td className={`px-4 py-3 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{rowNum}</td>
                      <td className={`px-4 py-3 whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {formatDate(entry.saleDate)}
                      </td>
                      <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {entry.customerName || '-'}
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {entry.productNames && entry.productNames.length > 0
                          ? entry.productNames.length === 1
                            ? entry.productNames[0]
                            : entry.productNames.map((name, i) => `${i + 1}. ${name}`).join(', ')
                          : entry.productName || '-'}
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {entry.customerName || '-'}
                      </td>
                      <td className={`px-4 py-3 text-center ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {entry.quantity}
                      </td>
                      <td className={`px-4 py-3 font-semibold whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatINR(entry.amount)}
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {entry.poNumber || '-'}
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {entry.invoiceNo || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={paymentBadge(entry.paymentStatus, isDark)}>
                          {entry.paymentStatus.charAt(0).toUpperCase() + entry.paymentStatus.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between px-4 py-3 border-t text-xs ${
            isDark ? 'border-zinc-800 text-zinc-500' : 'border-slate-100 text-slate-400'
          }`}>
            <span>
              {(page - 1) * PAGE_SIZE + 1}&ndash;{Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={`p-1.5 rounded transition-colors disabled:opacity-30 ${
                  isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | 'dots')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1]) > 1) acc.push('dots');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'dots' ? (
                    <span key={`d-${idx}`} className="px-1">...</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item as number)}
                      className={`min-w-[28px] h-7 rounded text-xs font-medium transition-colors ${
                        page === item
                          ? 'bg-brand-600 text-white'
                          : isDark
                            ? 'hover:bg-zinc-800 text-zinc-400'
                            : 'hover:bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={`p-1.5 rounded transition-colors disabled:opacity-30 ${
                  isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && detailEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeDetailModal} />
          <div className={`relative w-full max-w-lg max-h-[90vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
            isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
          }`}>
            {/* Header */}
            <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Sales Entry Details
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { openEditModal(detailEntry); closeDetailModal(); }}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {deleteConfirmId === detailEntry.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { handleDelete(detailEntry.id); closeDetailModal(); }}
                      className="px-2 py-1 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                        isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(detailEntry.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark ? 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800' : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'
                    }`}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={closeDetailModal}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span className={paymentBadge(detailEntry.paymentStatus, isDark)}>
                  {detailEntry.paymentStatus.charAt(0).toUpperCase() + detailEntry.paymentStatus.slice(1)}
                </span>
              </div>

              {/* Info grid */}
              <div className={`grid grid-cols-2 gap-3 text-sm rounded-xl p-4 ${isDark ? 'bg-dark-100' : 'bg-slate-50'}`}>
                <div>
                  <p className={`text-xs mb-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Date</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatDate(detailEntry.saleDate)}</p>
                </div>
                <div>
                  <p className={`text-xs mb-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Account</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{detailEntry.customerName || '-'}</p>
                </div>
                <div>
                  <p className={`text-xs mb-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Product</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{detailEntry.productNames && detailEntry.productNames.length > 0
                    ? detailEntry.productNames.length === 1
                      ? detailEntry.productNames[0]
                      : detailEntry.productNames.map((name: string, i: number) => `${i + 1}. ${name}`).join(', ')
                    : detailEntry.productName || '-'}</p>
                </div>
                <div>
                  <p className={`text-xs mb-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Customer</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{detailEntry.customerName || '-'}</p>
                </div>
                <div>
                  <p className={`text-xs mb-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Quantity</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{detailEntry.quantity}</p>
                </div>
                <div>
                  <p className={`text-xs mb-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Amount</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatINR(detailEntry.amount)}</p>
                </div>
                <div>
                  <p className={`text-xs mb-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>PO #</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{detailEntry.poNumber || '-'}</p>
                </div>
                <div>
                  <p className={`text-xs mb-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Invoice #</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{detailEntry.invoiceNo || '-'}</p>
                </div>
              </div>

              {/* Notes */}
              {detailEntry.notes && (
                <div>
                  <p className={`text-xs mb-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Notes</p>
                  <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>{detailEntry.notes}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className={`pt-3 border-t text-xs ${isDark ? 'border-zinc-800 text-zinc-600' : 'border-slate-100 text-slate-400'}`}>
                {detailEntry.createdAt && <p>Created: {new Date(detailEntry.createdAt).toLocaleString()}</p>}
                {detailEntry.updatedAt && <p>Updated: {new Date(detailEntry.updatedAt).toLocaleString()}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        entity="sales_entries"
        entityLabel="Sales Entries"
        isDark={isDark}
        onSuccess={() => fetchSales()}
      />

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeModal} />
          <div className={`relative w-full max-w-lg max-h-[90vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
            isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
          }`}>
            {/* Header */}
            <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {editingId ? 'Edit Entry' : 'New Sales Entry'}
              </h2>
              <button
                onClick={closeModal}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                {formError && (
                  <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                    isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {formError}
                  </div>
                )}

                {/* Partner + Product */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Partner <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="partnerId"
                      value={formData.partnerId}
                      onChange={handleFormChange}
                      className={selectFilterClass}
                      required
                    >
                      <option value="">Select partner...</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>{p.companyName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Product <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="productId"
                      value={formData.productId}
                      onChange={handleFormChange}
                      className={selectFilterClass}
                      required
                    >
                      <option value="">Select product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Customer + Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Customer Name</label>
                    <input
                      name="customerName"
                      type="text"
                      placeholder="Customer name"
                      value={formData.customerName}
                      onChange={handleFormChange}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        isDark ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
                      } focus:outline-none focus:ring-1 focus:ring-brand-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Sale Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="saleDate"
                      type="date"
                      value={formData.saleDate}
                      onChange={handleFormChange}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        isDark ? 'bg-dark-100 border-zinc-700 text-white focus:border-brand-500' : 'bg-white border-slate-200 text-slate-900 focus:border-brand-500'
                      } focus:outline-none focus:ring-1 focus:ring-brand-500`}
                      required
                    />
                  </div>
                </div>

                {/* Quantity + Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Quantity</label>
                    <input
                      name="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={handleFormChange}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        isDark ? 'bg-dark-100 border-zinc-700 text-white focus:border-brand-500' : 'bg-white border-slate-200 text-slate-900 focus:border-brand-500'
                      } focus:outline-none focus:ring-1 focus:ring-brand-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Amount (INR) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <IndianRupee className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                      <input
                        name="amount"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={formData.amount || ''}
                        onChange={handleFormChange}
                        className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm transition-all ${
                          isDark ? 'bg-dark-100 border-zinc-700 text-white focus:border-brand-500' : 'bg-white border-slate-200 text-slate-900 focus:border-brand-500'
                        } focus:outline-none focus:ring-1 focus:ring-brand-500`}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* PO + Invoice */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>PO Number</label>
                    <input
                      name="poNumber"
                      type="text"
                      placeholder="PO number"
                      value={formData.poNumber}
                      onChange={handleFormChange}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        isDark ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
                      } focus:outline-none focus:ring-1 focus:ring-brand-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Invoice No</label>
                    <input
                      name="invoiceNo"
                      type="text"
                      placeholder="Invoice number"
                      value={formData.invoiceNo}
                      onChange={handleFormChange}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        isDark ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
                      } focus:outline-none focus:ring-1 focus:ring-brand-500`}
                    />
                  </div>
                </div>

                {/* Payment Status */}
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Payment Status</label>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleFormChange}
                    className={selectFilterClass}
                  >
                    {PAYMENT_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Notes</label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Optional notes..."
                    value={formData.notes}
                    onChange={handleFormChange}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all resize-none ${
                      isDark ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
                    } focus:outline-none focus:ring-1 focus:ring-brand-500`}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className={`sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t ${
                isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={closeModal}
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
                    <><CheckCircle className="w-4 h-4" /> {editingId ? 'Update Entry' : 'Add Entry'}</>
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
