import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Trash2, X, ChevronLeft, ChevronRight,
  IndianRupee, ShoppingCart, Clock, CheckCircle, Loader2, AlertCircle,
  Download, Upload
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { salesApi, productsApi, partnersApi, masterDataApi, formatINR } from '../services/api';
import { exportToCsv } from '../utils/exportCsv';
import { SalesEntry, Product, Partner, PaginatedResponse } from '../types';
import { BulkImportModal } from './BulkImportModal';

// ---------------------------------------------------------------------------
// Types
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
  const { setActiveTab: navigate } = useNavigation();
  const isDark = theme === 'dark';

  // Data
  const [showBulkImport, setShowBulkImport] = useState(false);
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
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [filterVertical, setFilterVertical] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [verticals, setVerticals] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  // Loading
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [tableError, setTableError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SalesFormData>({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      if (filterPartner) params.partnerId = filterPartner;
      if (filterProduct) params.productId = filterProduct;
      if (filterPaymentStatus) params.paymentStatus = filterPaymentStatus;
      if (searchTerm) params.search = searchTerm;
      if (filterFromDate) params.fromDate = filterFromDate;
      if (filterToDate) params.toDate = filterToDate;
      if (filterVertical) params.verticalId = filterVertical;
      if (filterLocation) params.locationId = filterLocation;

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
  }, [page, filterPartner, filterProduct, filterPaymentStatus, searchTerm, filterFromDate, filterToDate, filterVertical, filterLocation]);

  const fetchSummary = useCallback(async () => {
    setIsSummaryLoading(true);
    try {
      const data = await salesApi.summary();
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [productsList, partnersResponse, verticalsList, locationsList] = await Promise.all([
        productsApi.list(),
        partnersApi.list({ limit: '100', status: 'approved' }),
        masterDataApi.list('verticals'),
        masterDataApi.list('locations'),
      ]);
      setProducts(Array.isArray(productsList) ? productsList : []);
      const partnerData = partnersResponse?.data ?? partnersResponse;
      setPartners(Array.isArray(partnerData) ? partnerData : []);
      setVerticals(Array.isArray(verticalsList) ? verticalsList : []);
      setLocations(Array.isArray(locationsList) ? locationsList : []);
    } catch {
      // Dropdown data failure is non-critical
    }
  }, []);

  useEffect(() => {
    fetchDropdownData();
    fetchSummary();
  }, [fetchDropdownData, fetchSummary]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  useEffect(() => {
    setPage(1);
  }, [filterPartner, filterProduct, filterPaymentStatus, searchTerm, filterFromDate, filterToDate, filterVertical, filterLocation]);

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
      fetchSummary();
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
      fetchSummary();
    } catch (err: any) {
      setTableError(err.message || 'Failed to delete');
    }
  };

  // ---------------------------------------------------------------------------
  // Filter helpers
  // ---------------------------------------------------------------------------

  const clearFilters = () => {
    setFilterPartner('');
    setFilterProduct('');
    setFilterPaymentStatus('');
    setSearchTerm('');
    setFilterFromDate('');
    setFilterToDate('');
    setFilterVertical('');
    setFilterLocation('');
  };

  const hasActiveFilters = filterPartner || filterProduct || filterPaymentStatus || searchTerm || filterFromDate || filterToDate || filterVertical || filterLocation;

  // ---------------------------------------------------------------------------
  // Lookup helpers
  // ---------------------------------------------------------------------------


  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const cardClass = `${isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-soft'} rounded-xl`;
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
      {/* Compact Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Sales', value: formatINR(summary?.totalAmount ?? 0), icon: IndianRupee, color: 'brand', nav: 'sales-entry' as const },
          { label: 'Entries', value: String(summary?.totalCount ?? 0), icon: ShoppingCart, color: 'emerald', nav: 'sales-entry' as const },
          { label: 'Pending', value: String(summary?.pendingPayments ?? 0), icon: Clock, color: 'amber', nav: 'sales-entry' as const },
          { label: 'Paid', value: String(summary?.paidCount ?? 0), icon: CheckCircle, color: 'green', nav: 'sales-entry' as const },
        ].map(({ label, value, icon: Icon, color, nav }) => (
          <div
            key={label}
            onClick={() => navigate(nav)}
            className={`${cardClass} p-3 flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-transform`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isDark ? `bg-${color}-900/20` : `bg-${color}-50`
            }`}>
              <Icon className={`w-4 h-4 ${isDark ? `text-${color}-400` : `text-${color}-600`}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{label}</p>
              {isSummaryLoading ? (
                <div className={`w-16 h-4 rounded animate-pulse mt-0.5 ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`} />
              ) : (
                <p className={`text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={`${cardClass} px-3 py-2.5 space-y-2`}>
        {/* Row 1: Search + Quick Filters + Export */}
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
          <select value={filterPartner} onChange={e => setFilterPartner(e.target.value)} className={`${selectFilterClass} lg:w-44`}>
            <option value="">All Partners</option>
            {partners.map(p => <option key={p.id} value={p.id}>{p.companyName}</option>)}
          </select>
          <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)} className={`${selectFilterClass} lg:w-40`}>
            <option value="">All Products</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterPaymentStatus} onChange={e => setFilterPaymentStatus(e.target.value)} className={`${selectFilterClass} lg:w-36`}>
            <option value="">All Status</option>
            {PAYMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Row 2: Date Range + Vertical + Location + Clear + Export */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative">
              <input
                type="date"
                value={filterFromDate}
                onChange={e => setFilterFromDate(e.target.value)}
                className={`${selectFilterClass} w-[150px]`}
                title="From date"
              />
            </div>
            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>to</span>
            <div className="relative">
              <input
                type="date"
                value={filterToDate}
                onChange={e => setFilterToDate(e.target.value)}
                className={`${selectFilterClass} w-[150px]`}
                title="To date"
              />
            </div>
          </div>
          <select value={filterVertical} onChange={e => setFilterVertical(e.target.value)} className={`${selectFilterClass} lg:w-40`}>
            <option value="">All Verticals</option>
            {verticals.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className={`${selectFilterClass} lg:w-40`}>
            <option value="">All Locations</option>
            {locations.map((l: any) => <option key={l.id} value={l.id}>{l.city}{l.state ? `, ${l.state}` : ''}</option>)}
          </select>
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
              { header: 'Partner', accessor: (r: SalesEntry) => r.partnerName },
              { header: 'Product', accessor: (r: SalesEntry) => r.productName },
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
            <ShoppingCart className={`w-8 h-8 ${isDark ? 'text-zinc-700' : 'text-slate-300'}`} />
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
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                  {['#', 'Date', 'Partner', 'Product', 'Customer', 'Qty', 'Amount', 'PO #', 'Invoice #', 'Status', 'Actions'].map(h => (
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
                {sales.map((entry, idx) => {
                  const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
                  const isDeleting = deleteConfirmId === entry.id;

                  return (
                    <tr
                      key={entry.id}
                      onClick={() => !isDeleting && openEditModal(entry)}
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
                        {entry.partnerName || '-'}
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {entry.productName || '-'}
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
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        {isDeleting ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(entry.id)}
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
                            onClick={() => setDeleteConfirmId(entry.id)}
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

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        entity="sales_entries"
        entityLabel="Sales Entries"
        isDark={isDark}
        onSuccess={() => fetchSales()}
      />
    </div>
  );
};
