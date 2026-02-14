import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, ChevronLeft, ChevronRight, Edit2, Trash2,
  IndianRupee, Loader2, AlertCircle, Building2,
  Phone, Mail, Globe, Users, MapPin, Hash,
  TrendingUp, FileText, Briefcase, User as UserIcon,
  Download, Upload, Target, Leaf, Snowflake
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { accountsApi, partnersApi, adminApi, formatINR } from '../services/api';
import { exportToCsv } from '../utils/exportCsv';
import { Account, Contact, Deal, PaginatedResponse, Partner, User } from '../types';
import { EnhancedAccountForm, EnhancedAccountFormData } from './EnhancedAccountForm';
import { BulkImportModal } from './BulkImportModal';
import { useColumnResize } from '../hooks/useColumnResize';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AccountsPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { setActiveTab: navigate, consumeNavParams } = useNavigation();
  const isDark = theme === 'dark';

  // Data state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableError, setTableError] = useState('');

  // Create/Edit modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
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



  // Summary counts
  const [typeSummary, setTypeSummary] = useState<{ hunting: number; farming: number; cold: number; total: number }>({ hunting: 0, farming: 0, cold: 0, total: 0 });

  // Dropdown data for enhanced form
  const [partners, setPartners] = useState<Partner[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [parentAccounts, setParentAccounts] = useState<Account[]>([]);

  // ---------------------------------------------------------------------------
  // Styling helpers
  // ---------------------------------------------------------------------------

  const { colWidths, onMouseDown } = useColumnResize({
    initialWidths: [45, 200, 150, 140, 220, 130, 130],
  });

  const cardClass = `premium-card ${isDark ? '' : 'shadow-soft'}`;

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchSummary = useCallback(async () => {
    try {
      const accountsData = await accountsApi.list({ limit: '1000' });
      const allAccounts = Array.isArray(accountsData?.data) ? accountsData.data : [];
      setParentAccounts(allAccounts);

      let hunting = 0, farming = 0, cold = 0;
      allAccounts.forEach((a: Account) => {
        const t = (a.type || '').toLowerCase();
        if (t === 'hunting') hunting++;
        else if (t === 'farming' || t === 'recurring') farming++;
        else if (t === 'cold') cold++;
      });
      setTypeSummary({ hunting, farming, cold, total: allAccounts.length });
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setTableError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (searchTerm) params.search = searchTerm;

      const response: PaginatedResponse<Account> = await accountsApi.list(params);
      setAccounts(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);

    } catch (err: any) {
      setTableError(err.message || 'Failed to load accounts');
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm]);

  // Consume nav params (e.g. navigated from ContactsPage with accountId)
  useEffect(() => {
    const params = consumeNavParams();
    if (params?.accountId) {
      (async () => {
        try {
          const account = await accountsApi.getById(params.accountId);
          if (account) openDetailModal(account);
        } catch { /* ignore */ }
      })();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial + filter-driven fetch
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Fetch dropdown data for enhanced form + summary counts
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Fetch partners
        const partnersData = await partnersApi.list({ limit: '100' });
        setPartners(Array.isArray(partnersData?.data) ? partnersData.data : []);

        // Fetch users
        const usersData = await adminApi.listUsers();
        setUsers(Array.isArray(usersData) ? usersData : []);

        // Fetch accounts for parent selection + summary counts
        await fetchSummary();
      } catch (err) {
        console.error('Failed to fetch dropdown data:', err);
        setPartners([]);
        setUsers([]);
        setParentAccounts([]);
      }
    };
    fetchDropdownData();
  }, [fetchSummary]);

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  const openCreateModal = () => {
    setEditingAccountId(null);
    setDetailAccount(null);
    setFormError('');
    setShowFormModal(true);
  };

  const openEditModal = (account: Account) => {
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
      fetchSummary();
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
      fetchSummary();
    } catch (err: any) {
      setTableError(err.message || 'Failed to delete account');
    }
  };


  // ---------------------------------------------------------------------------
  // Misc helpers
  // ---------------------------------------------------------------------------

  const hasActiveFilters = searchTerm;


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

        {/* Bulk Import */}
        <button
          onClick={() => setShowBulkImport(true)}
          title="Import from CSV"
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-normal transition-colors whitespace-nowrap ${
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
          onClick={() => exportToCsv('accounts', [
            { header: 'Name', accessor: (r: Account) => r.name },
            { header: 'Industry', accessor: (r: Account) => r.industry },
            { header: 'Type', accessor: (r: Account) => r.type },
            { header: 'Phone', accessor: (r: Account) => r.phone },
            { header: 'Email', accessor: (r: Account) => r.email },
            { header: 'Website', accessor: (r: Account) => r.website },
            { header: 'Location', accessor: (r: Account) => r.location },
            { header: 'Revenue', accessor: (r: Account) => r.revenue },
            { header: 'Employees', accessor: (r: Account) => r.employees },
            { header: 'Status', accessor: (r: Account) => r.status },
            { header: 'Owner', accessor: (r: Account) => r.ownerName },
            { header: 'GSTIN', accessor: (r: Account) => r.gstinNo },
            { header: 'Payment Terms', accessor: (r: Account) => r.paymentTerms },
          ], accounts)}
          disabled={accounts.length === 0}
          title="Export to Excel"
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-normal transition-colors whitespace-nowrap ${
            isDark
              ? 'text-zinc-400 border border-zinc-700 hover:bg-zinc-800 disabled:opacity-30'
              : 'text-slate-500 border border-slate-200 hover:bg-slate-50 disabled:opacity-30'
          }`}
        >
          <Download className="w-4 h-4" />
          Export
        </button>

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

  const cellBase = `px-4 py-3 text-sm ${isDark ? 'border-zinc-800' : 'border-slate-100'}`;
  const hdrCell = `px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400 bg-dark-100' : 'text-slate-500 bg-slate-50'}`;

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
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr className={`border-b ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
                  {['#', 'Name', 'Industry', 'Phone', 'Email', 'Revenue', 'Type'].map((label, i) => (
                    <th
                      key={label}
                      className={`${hdrCell} resizable-th ${i === 0 ? 'text-center' : ''}`}
                      style={{ width: colWidths[i] }}
                    >
                      {label}
                      <div className="col-resize-handle" onMouseDown={e => onMouseDown(i, e)} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Building2 className={`w-8 h-8 mx-auto ${isDark ? 'text-zinc-700' : 'text-slate-300'}`} />
                      <p className={`mt-2 text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        {hasActiveFilters ? 'No accounts match filters' : 'No accounts yet'}
                      </p>
                    </td>
                  </tr>
                ) : accounts.map((account, idx) => (
                    <tr
                      key={account.id}
                      onClick={() => openDetailModal(account)}
                      className={`border-b cursor-pointer transition-colors ${
                        isDark
                          ? 'border-zinc-800 hover:bg-zinc-800/50'
                          : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <td className={`${cellBase} text-center ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        <span className="font-medium">{account.name}</span>
                      </td>
                      <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {account.industry || '-'}
                      </td>
                      <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        <span className="whitespace-nowrap">{account.phone || '-'}</span>
                      </td>
                      <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        <span className="truncate block max-w-[170px]">{account.email || '-'}</span>
                      </td>
                      <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        <span className="font-semibold whitespace-nowrap">{account.revenue ? formatINR(account.revenue) : '-'}</span>
                      </td>
                      <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {account.type || '-'}
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
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 animate-backdrop" onClick={closeDetailModal} />
        <div className={`relative w-full max-w-2xl max-h-[85vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
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
              {deleteConfirmId === account.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { handleDelete(account.id); closeDetailModal(); }}
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
                  onClick={() => setDeleteConfirmId(account.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'text-zinc-400 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
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

          <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6 pb-6">
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
                        onClick={() => { closeDetailModal(); navigate('contacts', { accountId: account.id }); }}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>{contact.status}</span>
                      </div>
                    ))}
                    <button
                      onClick={() => { closeDetailModal(); navigate('contacts', { accountId: account.id }); }}
                      className={`w-full mt-2 py-2 text-xs font-medium rounded-lg transition-colors ${
                        isDark ? 'text-brand-400 hover:bg-zinc-800/50' : 'text-brand-600 hover:bg-slate-50'
                      }`}
                    >
                      View All Contacts →
                    </button>
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
            Manage customer accounts and track revenue
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`${cardClass} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{typeSummary.total}</p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Accounts</p>
          </div>
        </div>
        <div className={`${cardClass} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{typeSummary.hunting}</p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Hunting</p>
          </div>
        </div>
        <div className={`${cardClass} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{typeSummary.farming}</p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Farming</p>
          </div>
        </div>
        <div className={`${cardClass} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
            <Snowflake className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{typeSummary.cold}</p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Cold</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {renderToolbar()}

      {/* Table */}
      {renderTable()}

      {/* Modals */}
      {renderFormModal()}
      {renderDetailModal()}

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        entity="accounts"
        entityLabel="Accounts"
        isDark={isDark}
        onSuccess={() => { fetchAccounts(); fetchSummary(); }}
      />
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
