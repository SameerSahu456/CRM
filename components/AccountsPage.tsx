import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, ChevronLeft, ChevronRight, Edit2, Trash2,
  IndianRupee, Loader2, AlertCircle, CheckCircle, Building2,
  Phone, Mail, Globe, Users, Eye, MapPin, Hash,
  TrendingUp, Heart, FileText, Briefcase, User as UserIcon
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { accountsApi, contactsApi, partnersApi, adminApi, formatINR } from '../services/api';
import { Account, Contact, Deal, PaginatedResponse, Partner, User } from '../types';
import { EnhancedAccountForm, EnhancedAccountFormData } from './EnhancedAccountForm';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Real Estate',
  'Telecom',
  'Energy',
  'Media',
  'Government',
  'Other',
];

const ACCOUNT_TYPES = [
  'Customer',
  'Prospect',
  'Partner',
  'Vendor',
  'Competitor',
];

const STATUSES = ['Active', 'Inactive'];

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

interface AccountFormData {
  name: string;
  industry: string;
  website: string;
  revenue: number;
  employees: number;
  location: string;
  type: string;
  status: string;
  phone: string;
  email: string;
  healthScore: number;
  description: string;
  gstinNo: string;
  paymentTerms: string;
}

const EMPTY_ACCOUNT_FORM: AccountFormData = {
  name: '',
  industry: '',
  website: '',
  revenue: 0,
  employees: 0,
  location: '',
  type: '',
  status: 'Active',
  phone: '',
  email: '',
  healthScore: 100,
  description: '',
  gstinNo: '',
  paymentTerms: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function healthScoreBadge(score: number | undefined, isDark: boolean): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  if (score === undefined || score === null) {
    return `${base} ${isDark ? 'bg-zinc-800 text-zinc-500' : 'bg-slate-100 text-slate-400'}`;
  }
  if (score >= 80) {
    return `${base} ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`;
  }
  if (score >= 60) {
    return `${base} ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700'}`;
  }
  return `${base} ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'}`;
}

function statusBadge(status: string, isDark: boolean): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const isActive = status?.toLowerCase() === 'active';
  if (isActive) {
    return `${base} ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`;
  }
  return `${base} ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`;
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AccountsPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  // Data state
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableError, setTableError] = useState('');

  // Create/Edit modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AccountFormData>({ ...EMPTY_ACCOUNT_FORM });
  const [formError, setFormError] = useState('');

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailAccount, setDetailAccount] = useState<Account | null>(null);
  const [detailTab, setDetailTab] = useState<'contacts' | 'deals'>('contacts');
  const [detailContacts, setDetailContacts] = useState<Contact[]>([]);
  const [detailDeals, setDetailDeals] = useState<Deal[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Stats
  const [statsActive, setStatsActive] = useState(0);
  const [statsTotalRevenue, setStatsTotalRevenue] = useState(0);

  // Dropdown data for enhanced form
  const [partners, setPartners] = useState<Partner[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [parentAccounts, setParentAccounts] = useState<Account[]>([]);

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
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setTableError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (filterStatus) params.status = filterStatus;
      if (filterIndustry) params.industry = filterIndustry;
      if (searchTerm) params.search = searchTerm;

      const response: PaginatedResponse<Account> = await accountsApi.list(params);
      setAccounts(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);

      // Compute stats from current page data (best effort)
      const active = response.data.filter(a => a.status?.toLowerCase() === 'active').length;
      setStatsActive(active);
      const rev = response.data.reduce((sum, a) => sum + (a.revenue || 0), 0);
      setStatsTotalRevenue(rev);
    } catch (err: any) {
      setTableError(err.message || 'Failed to load accounts');
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterStatus, filterIndustry, searchTerm]);

  // Initial + filter-driven fetch
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterStatus, filterIndustry, searchTerm]);

  // Fetch dropdown data for enhanced form
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Fetch partners
        const partnersData = await partnersApi.list({ limit: '100' });
        setPartners(Array.isArray(partnersData?.data) ? partnersData.data : []);

        // Fetch users
        const usersData = await adminApi.listUsers();
        setUsers(Array.isArray(usersData) ? usersData : []);

        // Fetch accounts for parent selection
        const accountsData = await accountsApi.list({ limit: '100' });
        setParentAccounts(Array.isArray(accountsData?.data) ? accountsData.data : []);
      } catch (err) {
        console.error('Failed to fetch dropdown data:', err);
        // Ensure arrays are set even on error
        setPartners([]);
        setUsers([]);
        setParentAccounts([]);
      }
    };
    fetchDropdownData();
  }, []);

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  const openCreateModal = () => {
    setFormData({ ...EMPTY_ACCOUNT_FORM });
    setEditingAccountId(null);
    setDetailAccount(null);
    setFormError('');
    setShowFormModal(true);
  };

  const openEditModal = (account: Account) => {
    setFormData({
      name: account.name || '',
      industry: account.industry || '',
      website: account.website || '',
      revenue: account.revenue || 0,
      employees: account.employees || 0,
      location: account.location || '',
      type: account.type || '',
      status: account.status || 'Active',
      phone: account.phone || '',
      email: account.email || '',
      healthScore: account.healthScore ?? 100,
      description: account.description || '',
      gstinNo: account.gstinNo || '',
      paymentTerms: account.paymentTerms || '',
    });
    setEditingAccountId(account.id);
    setDetailAccount(account);
    setFormError('');
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingAccountId(null);
    setDetailAccount(null);
    setFormError('');
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['revenue', 'employees', 'healthScore'].includes(name)
        ? Number(value) || 0
        : value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Account name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAccountId) {
        await accountsApi.update(editingAccountId, formData);
      } else {
        await accountsApi.create({ ...formData, ownerId: user?.id });
      }
      closeFormModal();
      fetchAccounts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save account');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced form submit handler
  const handleEnhancedFormSubmit = async (formData: EnhancedAccountFormData) => {
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Account name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...formData, ownerId: formData.ownerId || user?.id };
      if (editingAccountId) {
        await accountsApi.update(editingAccountId, payload);
      } else {
        await accountsApi.create(payload);
      }
      closeFormModal();
      fetchAccounts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save account');
      throw err; // Re-throw so the form knows submission failed
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Detail handlers
  // ---------------------------------------------------------------------------

  const openDetailModal = async (account: Account) => {
    setDetailAccount(account);
    setDetailTab('contacts');
    setDetailContacts([]);
    setDetailDeals([]);
    setShowDetailModal(true);
    setIsDetailLoading(true);
    try {
      const [contacts, deals] = await Promise.all([
        accountsApi.getContacts(account.id),
        accountsApi.getDeals(account.id),
      ]);
      setDetailContacts(Array.isArray(contacts) ? contacts : []);
      setDetailDeals(Array.isArray(deals) ? deals : []);
    } catch {
      setDetailContacts([]);
      setDetailDeals([]);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailAccount(null);
    setDetailContacts([]);
    setDetailDeals([]);
  };

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------

  const handleDelete = async (id: string) => {
    try {
      await accountsApi.delete(id);
      setDeleteConfirmId(null);
      fetchAccounts();
    } catch (err: any) {
      setTableError(err.message || 'Failed to delete account');
    }
  };

  // ---------------------------------------------------------------------------
  // Misc helpers
  // ---------------------------------------------------------------------------

  const clearFilters = () => {
    setFilterStatus('');
    setFilterIndustry('');
    setSearchTerm('');
  };

  const hasActiveFilters = filterStatus || filterIndustry || searchTerm;

  // ---------------------------------------------------------------------------
  // Render: Stats Bar
  // ---------------------------------------------------------------------------

  const renderStatsBar = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Total Accounts */}
      <div className={`${cardClass} p-4 hover-lift animate-fade-in-up`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
          isDark ? 'bg-brand-900/20' : 'bg-brand-50'
        }`}>
          <Building2 className={`w-5 h-5 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
        </div>
        <p className={`text-xs font-medium ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Total Accounts</p>
        <p className={`text-2xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalRecords}</p>
      </div>

      {/* Active Accounts */}
      <div className={`${cardClass} p-4 hover-lift animate-fade-in-up`} style={{ animationDelay: '50ms' }}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
          isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'
        }`}>
          <CheckCircle className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
        </div>
        <p className={`text-xs font-medium ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Active Accounts</p>
        <p className={`text-2xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{statsActive}</p>
      </div>

      {/* Total Revenue */}
      <div className={`${cardClass} p-4 hover-lift animate-fade-in-up`} style={{ animationDelay: '100ms' }}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
          isDark ? 'bg-amber-900/20' : 'bg-amber-50'
        }`}>
          <IndianRupee className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
        </div>
        <p className={`text-xs font-medium ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Total Revenue</p>
        <p className={`text-2xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {formatINR(statsTotalRevenue)}
        </p>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Toolbar
  // ---------------------------------------------------------------------------

  const renderToolbar = () => (
    <div className={`${cardClass} p-4`}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            isDark ? 'text-zinc-500' : 'text-slate-400'
          }`} />
          <input
            type="text"
            placeholder="Search by account name..."
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
        <div className="w-full lg:w-40">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className={selectClass}
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Filter: Industry */}
        <div className="w-full lg:w-44">
          <select
            value={filterIndustry}
            onChange={e => setFilterIndustry(e.target.value)}
            className={selectClass}
          >
            <option value="">All Industries</option>
            {INDUSTRIES.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
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

        {/* New Account */}
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Account
        </button>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Table
  // ---------------------------------------------------------------------------

  const renderTable = () => (
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
            Loading accounts...
          </p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
            isDark ? 'bg-zinc-800' : 'bg-slate-100'
          }`}>
            <Building2 className={`w-7 h-7 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
          </div>
          <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            {hasActiveFilters ? 'No accounts match your filters' : 'No accounts yet'}
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
            {hasActiveFilters ? 'Try adjusting your filters' : 'Click "New Account" to create one'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                  {['Name', 'Industry', 'Phone', 'Email', 'Revenue', 'Status', 'Health', 'Owner', 'Actions'].map(h => (
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
                {accounts.map(account => (
                  <tr
                    key={account.id}
                    onClick={() => openDetailModal(account)}
                    className={`border-b transition-colors cursor-pointer ${
                      isDark
                        ? 'border-zinc-800/50 hover:bg-gray-800/50'
                        : 'border-slate-50 hover:bg-gray-50'
                    }`}
                  >
                    {/* Name */}
                    <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <div className="flex items-center gap-2">
                        <Building2 className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                        <span className="font-medium">
                          {account.name}
                        </span>
                      </div>
                    </td>

                    {/* Industry */}
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {account.industry || '-'}
                    </td>

                    {/* Phone */}
                    <td className={`px-4 py-3 whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {account.phone || '-'}
                    </td>

                    {/* Email */}
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <span className="truncate block max-w-[180px]">{account.email || '-'}</span>
                    </td>

                    {/* Revenue */}
                    <td className={`px-4 py-3 whitespace-nowrap font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {account.revenue ? formatINR(account.revenue) : '-'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={statusBadge(account.status, isDark)}>
                        {account.status || '-'}
                      </span>
                    </td>

                    {/* Health Score */}
                    <td className="px-4 py-3">
                      <span className={healthScoreBadge(account.healthScore, isDark)}>
                        {account.healthScore !== undefined && account.healthScore !== null
                          ? `${account.healthScore}%`
                          : '-'}
                      </span>
                    </td>

                    {/* Owner */}
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {account.ownerName || '-'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); openDetailModal(account); }}
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
                          onClick={(e) => { e.stopPropagation(); openEditModal(account); }}
                          title="Edit"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark
                              ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20'
                              : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                          }`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {deleteConfirmId === account.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(account.id); }}
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
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(account.id); }}
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
              {Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords} accounts
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
  );

  // ---------------------------------------------------------------------------
  // Render: Detail Modal
  // ---------------------------------------------------------------------------

  const renderDetailModal = () => {
    if (!showDetailModal || !detailAccount) return null;
    const account = detailAccount;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeDetailModal} />
        <div className={`relative w-full max-w-3xl max-h-[85vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
          isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
        }`}>
          {/* Header */}
          <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <h2 className={`text-lg font-semibold font-display truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {account.name}
              </h2>
              <span className={statusBadge(account.status, isDark)}>{account.status}</span>
              {account.healthScore !== undefined && account.healthScore !== null && (
                <span className={healthScoreBadge(account.healthScore, isDark)}>
                  {account.healthScore}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => { closeDetailModal(); openEditModal(account); }}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
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

          <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6 pb-20">
            {/* Account info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Industry" value={account.industry} isDark={isDark} icon={<Briefcase className="w-3.5 h-3.5" />} />
              <InfoRow label="Type" value={account.type} isDark={isDark} icon={<Building2 className="w-3.5 h-3.5" />} />
              <InfoRow label="Phone" value={account.phone} isDark={isDark} icon={<Phone className="w-3.5 h-3.5" />} />
              <InfoRow label="Email" value={account.email} isDark={isDark} icon={<Mail className="w-3.5 h-3.5" />} />
              <InfoRow label="Website" value={account.website} isDark={isDark} icon={<Globe className="w-3.5 h-3.5" />} />
              <InfoRow label="Location" value={account.location} isDark={isDark} icon={<MapPin className="w-3.5 h-3.5" />} />
              <InfoRow label="Revenue" value={account.revenue ? formatINR(account.revenue) : undefined} isDark={isDark} icon={<IndianRupee className="w-3.5 h-3.5" />} />
              <InfoRow label="Employees" value={account.employees ? String(account.employees) : undefined} isDark={isDark} icon={<Users className="w-3.5 h-3.5" />} />
              <InfoRow label="Health Score" value={account.healthScore !== undefined && account.healthScore !== null ? `${account.healthScore}%` : undefined} isDark={isDark} icon={<Heart className="w-3.5 h-3.5" />} />
              <InfoRow label="Owner" value={account.ownerName} isDark={isDark} icon={<UserIcon className="w-3.5 h-3.5" />} />
              <InfoRow label="GSTIN" value={account.gstinNo} isDark={isDark} icon={<Hash className="w-3.5 h-3.5" />} />
              <InfoRow label="Payment Terms" value={account.paymentTerms} isDark={isDark} icon={<FileText className="w-3.5 h-3.5" />} />
            </div>

            {/* Description */}
            {account.description && (
              <div>
                <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Description
                </h4>
                <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  {account.description}
                </p>
              </div>
            )}

            {/* Tabs: Contacts & Deals */}
            <div>
              <div className={`flex items-center gap-1 border-b mb-4 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                <button
                  onClick={() => setDetailTab('contacts')}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    detailTab === 'contacts'
                      ? 'border-brand-600 text-brand-600'
                      : isDark
                        ? 'border-transparent text-zinc-500 hover:text-zinc-300'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Contacts ({detailContacts.length})
                  </span>
                </button>
                <button
                  onClick={() => setDetailTab('deals')}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    detailTab === 'deals'
                      ? 'border-brand-600 text-brand-600'
                      : isDark
                        ? 'border-transparent text-zinc-500 hover:text-zinc-300'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Deals ({detailDeals.length})
                  </span>
                </button>
              </div>

              {isDetailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
                </div>
              ) : detailTab === 'contacts' ? (
                detailContacts.length === 0 ? (
                  <p className={`text-sm py-4 text-center ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                    No contacts linked to this account
                  </p>
                ) : (
                  <div className="space-y-2 pr-1">
                    {detailContacts.map((contact: any) => (
                      <div
                        key={contact.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                          isDark ? 'border-zinc-800 hover:bg-zinc-800/30' : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isDark ? 'bg-zinc-800' : 'bg-slate-100'
                        }`}>
                          <UserIcon className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {contact.firstName} {contact.lastName || ''}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {contact.email && (
                              <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                                {contact.email}
                              </span>
                            )}
                            {contact.jobTitle && (
                              <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                                {contact.jobTitle}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={statusBadge(contact.status, isDark)}>{contact.status}</span>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                detailDeals.length === 0 ? (
                  <p className={`text-sm py-4 text-center ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                    No deals linked to this account
                  </p>
                ) : (
                  <div className="space-y-2 pr-1">
                    {detailDeals.map((deal: any) => (
                      <div
                        key={deal.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                          isDark ? 'border-zinc-800 hover:bg-zinc-800/30' : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {deal.title}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                              {deal.stage}
                            </span>
                            {deal.closingDate && (
                              <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                                Close: {formatDate(deal.closingDate)}
                              </span>
                            )}
                          </div>
                        </div>
                        {deal.value !== undefined && deal.value !== null && (
                          <p className={`text-sm font-semibold whitespace-nowrap ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {formatINR(deal.value)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Timestamps */}
            <div className={`flex items-center gap-4 text-[11px] pt-2 border-t ${
              isDark ? 'border-zinc-800 text-zinc-600' : 'border-slate-100 text-slate-400'
            }`}>
              {account.createdAt && <span>Created: {formatDate(account.createdAt)}</span>}
              {account.updatedAt && <span>Updated: {formatDate(account.updatedAt)}</span>}
            </div>
          </div>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Create/Edit Modal (Enhanced Form)
  // ---------------------------------------------------------------------------

  const renderFormModal = () => {
    return (
      <EnhancedAccountForm
        isOpen={showFormModal}
        onClose={closeFormModal}
        onSubmit={handleEnhancedFormSubmit}
        editingAccount={detailAccount}
        isSubmitting={isSubmitting}
        formError={formError}
        partners={Array.isArray(partners) ? partners.map(p => ({ id: p.id, companyName: p.companyName })) : []}
        accounts={Array.isArray(parentAccounts) ? parentAccounts.map(a => ({ id: a.id, name: a.name })) : []}
        users={Array.isArray(users) ? users.map(u => ({ id: u.id, name: u.name })) : []}
      />
    );
  };

  // OLD FORM MODAL (keeping for reference, can be deleted later)
  const renderOldFormModal_BACKUP = () => {
    if (!showFormModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeFormModal} />
        <div className={`relative w-full max-w-2xl max-h-[90vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
          isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
        }`}>
          {/* Header */}
          <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {editingAccountId ? 'Edit Account' : 'New Account'}
            </h2>
            <button
              onClick={closeFormModal}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-5">
            {formError && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            {/* Row 1: Account Name (full width) */}
            <div>
              <label htmlFor="name" className={labelClass}>
                Account Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter account name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className={`${inputClass} pl-10`}
                  required
                />
              </div>
            </div>

            {/* Row 2: Industry + Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="industry" className={labelClass}>
                  Industry <span className="text-red-500">*</span>
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleFormChange}
                  className={selectClass}
                  required
                >
                  <option value="">Select Industry</option>
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="type" className={labelClass}>Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  className={selectClass}
                >
                  <option value="">Select Type</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Customer">Customer</option>
                  <option value="Partner">Partner</option>
                </select>
              </div>
            </div>

            {/* Row 3: Phone + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className={labelClass}>Phone</label>
                <div className="relative">
                  <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>Email</label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="contact@company.com"
                    value={formData.email}
                    onChange={handleFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Website + GSTIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="website" className={labelClass}>Website</label>
                <div className="relative">
                  <Globe className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="website"
                    name="website"
                    type="text"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={handleFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="gstinNo" className={labelClass}>GSTIN No.</label>
                <div className="relative">
                  <Hash className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="gstinNo"
                    name="gstinNo"
                    type="text"
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    value={formData.gstinNo}
                    onChange={handleFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            {/* Row 5: Payment Terms + Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="paymentTerms" className={labelClass}>Payment Terms</label>
                <select
                  id="paymentTerms"
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleFormChange}
                  className={selectClass}
                >
                  <option value="">Select Terms</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Advance Payment">Advance Payment</option>
                  <option value="COD">COD</option>
                </select>
              </div>
              <div>
                <label htmlFor="location" className={labelClass}>Location</label>
                <div className="relative">
                  <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="City, Country"
                    value={formData.location}
                    onChange={handleFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            {/* Row 6: Revenue + Employees */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="revenue" className={labelClass}>Revenue (INR)</label>
                <div className="relative">
                  <IndianRupee className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="revenue"
                    name="revenue"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={formData.revenue || ''}
                    onChange={handleFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="employees" className={labelClass}>Employees</label>
                <div className="relative">
                  <Users className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="employees"
                    name="employees"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={formData.employees || ''}
                    onChange={handleFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            {/* Row 7: Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className={labelClass}>Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className={inputClass}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Row 8: Description */}
            <div>
              <label htmlFor="description" className={labelClass}>Description</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Brief description of the account..."
                value={formData.description}
                onChange={handleFormChange}
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
                onClick={closeFormModal}
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
                  <><CheckCircle className="w-4 h-4" /> {editingAccountId ? 'Update Account' : 'Create Account'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }; // END renderOldFormModal_BACKUP

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Accounts
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Manage customer accounts, track revenue, and monitor account health
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      {renderStatsBar()}

      {/* Toolbar */}
      {renderToolbar()}

      {/* Table */}
      {renderTable()}

      {/* Modals */}
      {renderFormModal()}
      {renderDetailModal()}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const InfoRow: React.FC<{
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
