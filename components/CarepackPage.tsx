import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, ChevronLeft, ChevronRight, Edit2, Trash2,
  Loader2, AlertCircle, CheckCircle, Shield, Clock, Calendar,
  Package, Hash, FileText, User as UserIcon, AlertTriangle
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { carepacksApi, partnersApi } from '../services/api';
import { Carepack, Partner, PaginatedResponse } from '../types';

// ---------------------------------------------------------------------------
// Types local to this page
// ---------------------------------------------------------------------------

type TabKey = 'all' | 'expiring';

interface CarepackFormData {
  partnerId: string;
  customerName: string;
  productType: string;
  serialNumber: string;
  carepackSku: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled';
  notes: string;
}

const EMPTY_FORM: CarepackFormData = {
  partnerId: '',
  customerName: '',
  productType: '',
  serialNumber: '',
  carepackSku: '',
  startDate: '',
  endDate: '',
  status: 'active',
  notes: '',
};

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadge(status: string, isDark: boolean): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  switch (status) {
    case 'active':
      return `${base} ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`;
    case 'expired':
      return `${base} ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'}`;
    case 'cancelled':
      return `${base} ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`;
    default:
      return `${base} ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`;
  }
}

function formatDate(dateStr: string | undefined): string {
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

function capitalize(s: string): string {
  if (!s) return '-';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getDaysRemaining(endDate: string | undefined): number | null {
  if (!endDate) return null;
  try {
    const end = new Date(endDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function daysRemainingBadge(days: number | null, isDark: boolean): string {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';
  if (days === null) return `${base} ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`;
  if (days < 0) return `${base} ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'}`;
  if (days <= 30) return `${base} ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'}`;
  if (days <= 90) return `${base} ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700'}`;
  return `${base} ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`;
}

function getDaysLabel(days: number | null): string {
  if (days === null) return '-';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Expires today';
  if (days === 1) return '1 day left';
  return `${days}d left`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CarepackPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  // All Carepacks tab state
  const [carepacks, setCarepacks] = useState<Carepack[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPartner, setFilterPartner] = useState('');

  // Expiring tab state
  const [expiringCarepacks, setExpiringCarepacks] = useState<Carepack[]>([]);
  const [expiringLoading, setExpiringLoading] = useState(false);
  const [expiringError, setExpiringError] = useState('');

  // Dropdown data
  const [partners, setPartners] = useState<Partner[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [tableError, setTableError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CarepackFormData>({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Summary counts
  const [totalActive, setTotalActive] = useState(0);
  const [expiringThisMonth, setExpiringThisMonth] = useState(0);
  const [totalExpired, setTotalExpired] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchCarepacks = useCallback(async () => {
    setIsLoading(true);
    setTableError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (filterStatus) params.status = filterStatus;
      if (filterPartner) params.partnerId = filterPartner;
      if (searchTerm) params.search = searchTerm;

      const response: PaginatedResponse<Carepack> = await carepacksApi.list(params);
      setCarepacks(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);
    } catch (err: any) {
      setTableError(err.message || 'Failed to load carepacks');
      setCarepacks([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterStatus, filterPartner, searchTerm]);

  const fetchSummaryCounts = useCallback(async () => {
    try {
      const [allRes, activeRes, expiredRes] = await Promise.all([
        carepacksApi.list({ limit: '1' }),
        carepacksApi.list({ limit: '1', status: 'active' }),
        carepacksApi.list({ limit: '1', status: 'expired' }),
      ]);
      setTotalCount((allRes as PaginatedResponse<Carepack>).pagination.total);
      setTotalActive((activeRes as PaginatedResponse<Carepack>).pagination.total);
      setTotalExpired((expiredRes as PaginatedResponse<Carepack>).pagination.total);
    } catch {
      // Summary counts are non-critical
    }

    try {
      const expiring: Carepack[] = await carepacksApi.expiring();
      setExpiringThisMonth(Array.isArray(expiring) ? expiring.length : 0);
    } catch {
      // Non-critical
    }
  }, []);

  const fetchExpiringCarepacks = useCallback(async () => {
    setExpiringLoading(true);
    setExpiringError('');
    try {
      const data: Carepack[] = await carepacksApi.expiring();
      const sorted = (Array.isArray(data) ? data : []).sort((a, b) => {
        if (!a.endDate) return 1;
        if (!b.endDate) return -1;
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      });
      setExpiringCarepacks(sorted);
    } catch (err: any) {
      setExpiringError(err.message || 'Failed to load expiring carepacks');
      setExpiringCarepacks([]);
    } finally {
      setExpiringLoading(false);
    }
  }, []);

  const fetchDropdownData = useCallback(async () => {
    try {
      const partnersResponse = await partnersApi.list({ limit: '100', status: 'approved' });
      const partnerData = (partnersResponse as PaginatedResponse<Partner>)?.data ?? partnersResponse;
      setPartners(Array.isArray(partnerData) ? partnerData : []);
    } catch {
      // Dropdown data failure is non-critical
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDropdownData();
    fetchSummaryCounts();
  }, [fetchDropdownData, fetchSummaryCounts]);

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'all') {
      fetchCarepacks();
    } else if (activeTab === 'expiring') {
      fetchExpiringCarepacks();
    }
  }, [activeTab, fetchCarepacks, fetchExpiringCarepacks]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterStatus, filterPartner, searchTerm]);

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  const openCreateModal = () => {
    setFormData({ ...EMPTY_FORM });
    setEditingId(null);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (carepack: Carepack) => {
    setFormData({
      partnerId: carepack.partnerId || '',
      customerName: carepack.customerName || '',
      productType: carepack.productType || '',
      serialNumber: carepack.serialNumber || '',
      carepackSku: carepack.carepackSku || '',
      startDate: carepack.startDate ? carepack.startDate.split('T')[0] : '',
      endDate: carepack.endDate ? carepack.endDate.split('T')[0] : '',
      status: carepack.status || 'active',
      notes: carepack.notes || '',
    });
    setEditingId(carepack.id);
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.customerName.trim()) {
      setFormError('Customer name is required');
      return;
    }
    if (!formData.serialNumber.trim()) {
      setFormError('Serial number is required');
      return;
    }
    if (!formData.startDate) {
      setFormError('Start date is required');
      return;
    }
    if (!formData.endDate) {
      setFormError('End date is required');
      return;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setFormError('End date must be after start date');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await carepacksApi.update(editingId, formData);
      } else {
        await carepacksApi.create(formData);
      }

      closeModal();
      if (activeTab === 'all') fetchCarepacks();
      if (activeTab === 'expiring') fetchExpiringCarepacks();
      fetchSummaryCounts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save carepack');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await carepacksApi.delete(id);
      setDeleteConfirmId(null);
      if (activeTab === 'all') fetchCarepacks();
      if (activeTab === 'expiring') fetchExpiringCarepacks();
      fetchSummaryCounts();
    } catch (err: any) {
      setTableError(err.message || 'Failed to delete carepack');
    }
  };

  const clearFilters = () => {
    setFilterStatus('');
    setFilterPartner('');
    setSearchTerm('');
  };

  const hasActiveFilters = filterStatus || filterPartner || searchTerm;

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
  // Pagination renderer
  // ---------------------------------------------------------------------------

  const renderPagination = () => {
    if (totalRecords === 0) return null;

    return (
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t ${
        isDark ? 'border-zinc-800' : 'border-slate-100'
      }`}>
        <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
          Showing {(page - 1) * PAGE_SIZE + 1}
          {' '}&ndash;{' '}
          {Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords} carepacks
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
    );
  };

  // ---------------------------------------------------------------------------
  // Shared renderers
  // ---------------------------------------------------------------------------

  const renderEmptyState = (message: string, subMessage: string) => (
    <div className="flex flex-col items-center justify-center py-20">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
        isDark ? 'bg-zinc-800' : 'bg-slate-100'
      }`}>
        <Shield className={`w-7 h-7 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
      </div>
      <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
        {message}
      </p>
      <p className={`text-xs mt-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
        {subMessage}
      </p>
    </div>
  );

  const renderLoadingState = (message: string) => (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
        {message}
      </p>
    </div>
  );

  const renderErrorBanner = (error: string) => (
    <div className={`m-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
      isDark
        ? 'bg-red-900/20 border border-red-800 text-red-400'
        : 'bg-red-50 border border-red-200 text-red-700'
    }`}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {error}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Action buttons renderer (shared between tabs)
  // ---------------------------------------------------------------------------

  const renderActions = (carepack: Carepack) => (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); openEditModal(carepack); }}
        title="Edit"
        className={`p-1.5 rounded-lg transition-colors ${
          isDark
            ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20'
            : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
        }`}
      >
        <Edit2 className="w-4 h-4" />
      </button>

      {deleteConfirmId === carepack.id ? (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(carepack.id); }}
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
          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(carepack.id); }}
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
  );

  // ---------------------------------------------------------------------------
  // Render: All Carepacks Tab
  // ---------------------------------------------------------------------------

  const renderAllCarepacks = () => (
    <>
      {/* Toolbar: Search + Filters + New Carepack */}
      <div className={`${cardClass} p-4`}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-zinc-500' : 'text-slate-400'
            }`} />
            <input
              type="text"
              placeholder="Search by customer name or serial number..."
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
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
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

          {/* New Carepack */}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Carepack
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className={`${cardClass} overflow-hidden`}>
        {tableError && renderErrorBanner(tableError)}

        {isLoading ? (
          renderLoadingState('Loading carepacks...')
        ) : carepacks.length === 0 ? (
          renderEmptyState(
            hasActiveFilters ? 'No carepacks match your filters' : 'No carepacks yet',
            hasActiveFilters ? 'Try adjusting your filters' : 'Click "New Carepack" to register one'
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                    {['Partner', 'Customer', 'Product Type', 'Serial #', 'SKU', 'Start Date', 'End Date', 'Status', 'Days Left', 'Actions'].map(h => (
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
                  {carepacks.map(cp => {
                    const days = cp.status === 'active' ? getDaysRemaining(cp.endDate) : null;
                    return (
                      <tr
                        key={cp.id}
                        className={`border-b transition-colors ${
                          isDark
                            ? 'border-zinc-800/50 hover:bg-zinc-800/30'
                            : 'border-slate-50 hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Partner */}
                        <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <span className="font-medium">{cp.partnerName || '-'}</span>
                        </td>

                        {/* Customer */}
                        <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {cp.customerName || '-'}
                        </td>

                        {/* Product Type */}
                        <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {cp.productType || '-'}
                        </td>

                        {/* Serial # */}
                        <td className={`px-4 py-3 whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          <div className="flex items-center gap-1.5">
                            <Hash className={`w-3 h-3 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                            <span className="font-mono text-xs">{cp.serialNumber || '-'}</span>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className={`px-4 py-3 whitespace-nowrap font-mono text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {cp.carepackSku || '-'}
                        </td>

                        {/* Start Date */}
                        <td className={`px-4 py-3 whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {formatDate(cp.startDate)}
                        </td>

                        {/* End Date */}
                        <td className={`px-4 py-3 whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {formatDate(cp.endDate)}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={statusBadge(cp.status, isDark)}>
                            {capitalize(cp.status)}
                          </span>
                        </td>

                        {/* Days Remaining */}
                        <td className="px-4 py-3">
                          {cp.status === 'active' ? (
                            <span className={daysRemainingBadge(days, isDark)}>
                              {getDaysLabel(days)}
                            </span>
                          ) : (
                            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          {renderActions(cp)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {renderPagination()}
          </>
        )}
      </div>
    </>
  );

  // ---------------------------------------------------------------------------
  // Render: Expiring Soon Tab
  // ---------------------------------------------------------------------------

  const renderExpiringTab = () => (
    <div className={`${cardClass} overflow-hidden`}>
      {expiringError && renderErrorBanner(expiringError)}

      {expiringLoading ? (
        renderLoadingState('Loading expiring carepacks...')
      ) : expiringCarepacks.length === 0 ? (
        renderEmptyState(
          'No carepacks expiring soon',
          'All active carepacks have more than 30 days remaining'
        )
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                {['Partner', 'Customer', 'Product Type', 'Serial #', 'SKU', 'End Date', 'Days Left', 'Actions'].map(h => (
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
              {expiringCarepacks.map(cp => {
                const days = getDaysRemaining(cp.endDate);
                const isUrgent = days !== null && days <= 7;
                return (
                  <tr
                    key={cp.id}
                    className={`border-b transition-colors ${
                      isUrgent
                        ? isDark
                          ? 'border-zinc-800/50 bg-red-900/10 hover:bg-red-900/20'
                          : 'border-slate-50 bg-red-50/40 hover:bg-red-50/70'
                        : isDark
                          ? 'border-zinc-800/50 hover:bg-zinc-800/30'
                          : 'border-slate-50 hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Partner */}
                    <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isUrgent
                            ? isDark ? 'bg-red-900/20' : 'bg-red-50'
                            : isDark ? 'bg-amber-900/20' : 'bg-amber-50'
                        }`}>
                          <AlertTriangle className={`w-4 h-4 ${
                            isUrgent
                              ? isDark ? 'text-red-400' : 'text-red-600'
                              : isDark ? 'text-amber-400' : 'text-amber-600'
                          }`} />
                        </div>
                        <span className="font-medium">{cp.partnerName || '-'}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {cp.customerName || '-'}
                    </td>

                    {/* Product Type */}
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {cp.productType || '-'}
                    </td>

                    {/* Serial # */}
                    <td className={`px-4 py-3 whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <div className="flex items-center gap-1.5">
                        <Hash className={`w-3 h-3 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                        <span className="font-mono text-xs">{cp.serialNumber || '-'}</span>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className={`px-4 py-3 whitespace-nowrap font-mono text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {cp.carepackSku || '-'}
                    </td>

                    {/* End Date */}
                    <td className={`px-4 py-3 whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <div className="flex items-center gap-2">
                        <Calendar className={`w-3.5 h-3.5 flex-shrink-0 ${
                          isUrgent
                            ? isDark ? 'text-red-400' : 'text-red-500'
                            : isDark ? 'text-zinc-500' : 'text-slate-400'
                        }`} />
                        {formatDate(cp.endDate)}
                      </div>
                    </td>

                    {/* Days Left */}
                    <td className="px-4 py-3">
                      <span className={daysRemainingBadge(days, isDark)}>
                        {getDaysLabel(days)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {renderActions(cp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active */}
        <div className={`${cardClass} p-4 hover-lift animate-fade-in-up stagger-1`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'
          }`}>
            <CheckCircle className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </div>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Total Active</p>
          <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {totalActive}
          </p>
        </div>

        {/* Expiring This Month */}
        <div className={`${cardClass} p-4 hover-lift animate-fade-in-up stagger-2`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            isDark ? 'bg-amber-900/20' : 'bg-amber-50'
          }`}>
            <AlertTriangle className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Expiring Soon</p>
          <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {expiringThisMonth}
          </p>
        </div>

        {/* Total Expired */}
        <div className={`${cardClass} p-4 hover-lift animate-fade-in-up stagger-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            isDark ? 'bg-red-900/20' : 'bg-red-50'
          }`}>
            <Clock className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          </div>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Total Expired</p>
          <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {totalExpired}
          </p>
        </div>

        {/* Total Carepacks */}
        <div className={`${cardClass} p-4 hover-lift animate-fade-in-up stagger-4`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            isDark ? 'bg-brand-900/20' : 'bg-brand-50'
          }`}>
            <Shield className={`w-5 h-5 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
          </div>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Total Carepacks</p>
          <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {totalCount}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`${cardClass} p-1 inline-flex rounded-xl`}>
        {[
          { key: 'all' as TabKey, label: 'All Carepacks', icon: Shield },
          { key: 'expiring' as TabKey, label: 'Expiring Soon', icon: AlertTriangle },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? isDark
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-brand-600 text-white shadow-md'
                  : isDark
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.key === 'expiring' && expiringThisMonth > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isDark
                      ? 'bg-amber-900/30 text-amber-400'
                      : 'bg-amber-100 text-amber-700'
                }`}>
                  {expiringThisMonth}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'all' && renderAllCarepacks()}
      {activeTab === 'expiring' && renderExpiringTab()}

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
                {editingId ? 'Edit Carepack' : 'New Carepack'}
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

              {/* Section: Carepack Info */}
              <div>
                <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                  <Shield className="w-4 h-4" />
                  Carepack Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Partner */}
                  <div className="sm:col-span-2">
                    <label htmlFor="partnerId" className={labelClass}>Partner</label>
                    <select
                      id="partnerId"
                      name="partnerId"
                      value={formData.partnerId}
                      onChange={handleFormChange}
                      className={selectClass}
                    >
                      <option value="">Select Partner</option>
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
                        required
                      />
                    </div>
                  </div>

                  {/* Product Type */}
                  <div>
                    <label htmlFor="productType" className={labelClass}>Product Type</label>
                    <div className="relative">
                      <Package className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-zinc-500' : 'text-slate-400'
                      }`} />
                      <input
                        id="productType"
                        name="productType"
                        type="text"
                        placeholder="e.g. HP ProLiant, HPE Aruba"
                        value={formData.productType}
                        onChange={handleFormChange}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  {/* Serial Number */}
                  <div>
                    <label htmlFor="serialNumber" className={labelClass}>
                      Serial Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-zinc-500' : 'text-slate-400'
                      }`} />
                      <input
                        id="serialNumber"
                        name="serialNumber"
                        type="text"
                        placeholder="e.g. CZ12345678"
                        value={formData.serialNumber}
                        onChange={handleFormChange}
                        className={`${inputClass} pl-10`}
                        required
                      />
                    </div>
                  </div>

                  {/* Carepack SKU */}
                  <div>
                    <label htmlFor="carepackSku" className={labelClass}>Carepack SKU</label>
                    <div className="relative">
                      <FileText className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-zinc-500' : 'text-slate-400'
                      }`} />
                      <input
                        id="carepackSku"
                        name="carepackSku"
                        type="text"
                        placeholder="e.g. U8PL9E"
                        value={formData.carepackSku}
                        onChange={handleFormChange}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Dates & Status */}
              <div>
                <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                  <Calendar className="w-4 h-4" />
                  Dates &amp; Status
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Start Date */}
                  <div>
                    <label htmlFor="startDate" className={labelClass}>
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-zinc-500' : 'text-slate-400'
                      }`} />
                      <input
                        id="startDate"
                        name="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={handleFormChange}
                        className={`${inputClass} pl-10`}
                        required
                      />
                    </div>
                  </div>

                  {/* End Date */}
                  <div>
                    <label htmlFor="endDate" className={labelClass}>
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-zinc-500' : 'text-slate-400'
                      }`} />
                      <input
                        id="endDate"
                        name="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={handleFormChange}
                        className={`${inputClass} pl-10`}
                        required
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label htmlFor="status" className={labelClass}>Status</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      className={selectClass}
                    >
                      {STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Notes */}
              <div>
                <label htmlFor="notes" className={labelClass}>Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Any additional notes about this carepack..."
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
                      {editingId ? 'Update Carepack' : 'Create Carepack'}
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
