import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, Edit2, Trash2,
  IndianRupee, Loader2, AlertCircle, Building2,
  Phone, Mail, Globe, Users, MapPin, Hash,
  TrendingUp, FileText, Briefcase, User as UserIcon,
  Download, Upload, Wallet, Target, Leaf, Snowflake,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { accountsApi, partnersApi, adminApi, salesApi, formatINR, ACCOUNT_LIST_FIELDS } from '@/services/api';
import { exportToCsv } from '@/utils/exportCsv';
import { Account, Contact, Deal, PaginatedResponse, Partner, User } from '@/types';
import { EnhancedAccountForm, EnhancedAccountFormData } from '@/components/common/EnhancedAccountForm';
import { BulkImportModal } from '@/components/common/BulkImportModal';
import { Card, Button, Input, Select, Modal, Badge, Alert, Tabs, DataTable, DataTableColumn } from '@/components/ui';
import { cx } from '@/utils/cx';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail',
  'Education', 'Real Estate', 'Telecom', 'Energy', 'Media', 'Government', 'Other'
];

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
  const { user } = useAuth();
  const { setActiveTab: navigate, consumeNavParams } = useNavigation();

  // Data state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
  const [detailTab, setDetailTab] = useState<'contacts' | 'deals' | 'collections'>('contacts');
  const [detailContacts, setDetailContacts] = useState<Contact[]>([]);
  const [detailDeals, setDetailDeals] = useState<Deal[]>([]);
  const [detailCollections, setDetailCollections] = useState<any[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);



  // Summary counts
  const [typeSummary, setTypeSummary] = useState<{ channel: number; endCustomer: number; hunting: number; farming: number; cold: number; total: number }>({ channel: 0, endCustomer: 0, hunting: 0, farming: 0, cold: 0, total: 0 });

  // Collections data mapped by account name
  const [collectionsMap, setCollectionsMap] = useState<Record<string, { pending: number; partial: number; paid: number }>>({});

  // Dropdown data for enhanced form
  const [partners, setPartners] = useState<Partner[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [parentAccounts, setParentAccounts] = useState<Account[]>([]);

  // ---------------------------------------------------------------------------
  // Styling helpers
  // ---------------------------------------------------------------------------


  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchCollections = useCallback(async () => {
    try {
      const colRes = await salesApi.collections();
      const colData = colRes?.data ?? colRes;
      const cMap: Record<string, { pending: number; partial: number; paid: number }> = {};
      const addToMap = (items: any[], key: 'pending' | 'partial' | 'paid') => {
        (items || []).forEach((item: any) => {
          const name = (item.customerName || '').toLowerCase();
          if (!name) return;
          if (!cMap[name]) cMap[name] = { pending: 0, partial: 0, paid: 0 };
          cMap[name][key] += item.totalAmount || 0;
        });
      };
      addToMap(colData.pending, 'pending');
      addToMap(colData.partialPending, 'partial');
      addToMap(colData.paid, 'paid');
      setCollectionsMap(cMap);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const accountsData = await accountsApi.list({ limit: '1000', fields: 'id,name,tag,accountType,type' });
      const allAccounts = Array.isArray(accountsData?.data) ? accountsData.data : [];
      setParentAccounts(allAccounts);

      let channel = 0, endCustomer = 0, hunting = 0, farming = 0, cold = 0;
      allAccounts.forEach((a: Account) => {
        const tag = (a.tag || '').toLowerCase();
        const at = (a.accountType || '').toLowerCase();
        const t = (a.type || '').toLowerCase();
        // Tag-based (Channel / End Customer)
        if (tag === 'channel' || at === 'channel partner' || at === 'channel') channel++;
        else if (tag === 'endcustomer' || tag === 'end customer' || at === 'end customer' || at === 'endcustomer') endCustomer++;
        // Type-based (Hunting / Farming / Cold)
        if (t === 'hunting') hunting++;
        else if (t === 'farming' || t === 'recurring') farming++;
        else if (t === 'cold') cold++;
      });
      setTypeSummary({ channel, endCustomer, hunting, farming, cold, total: allAccounts.length });
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
      if (industryFilter) params.industry = industryFilter;
      if (accountTypeFilter) params.account_type = accountTypeFilter;
      if (tagFilter) params.tag = tagFilter;
      if (typeFilter) params.type = typeFilter;
      params.fields = ACCOUNT_LIST_FIELDS;

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
  }, [page, searchTerm, industryFilter, accountTypeFilter, tagFilter, typeFilter]);

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
  }, [searchTerm, industryFilter, accountTypeFilter, tagFilter, typeFilter]);

  // Fetch summary + collections independently
  useEffect(() => {
    fetchSummary();
    fetchCollections();
  }, [fetchSummary, fetchCollections]);

  // Fetch dropdown data for enhanced form
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const partnersData = await partnersApi.list({ limit: '100' });
        setPartners(Array.isArray(partnersData?.data) ? partnersData.data : []);
      } catch { setPartners([]); }

      try {
        const usersRes = await adminApi.listUsers();
        const usersArr = usersRes?.data ?? usersRes;
        setUsers(Array.isArray(usersArr) ? usersArr : []);
      } catch { setUsers([]); }
    };
    fetchDropdownData();
  }, []);

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  const openCreateModal = () => {
    setEditingAccountId(null);
    setDetailAccount(null);
    setFormError('');
    setShowFormModal(true);
  };

  const openEditModal = async (account: Account) => {
    // Fetch full record to avoid partial-field overwrites
    let full = account;
    try {
      const res = await accountsApi.getById(account.id);
      full = res?.data ?? res;
    } catch { /* fall back to list data */ }
    setEditingAccountId(account.id);
    setDetailAccount(full);
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

    // When creating (not editing), contact is mandatory
    if (!editingAccountId && !formData.contactName.trim()) {
      setFormError('Contact name is required when creating an account');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...formData, ownerId: formData.ownerId || user?.id };
      if (editingAccountId) {
        await accountsApi.update(editingAccountId, payload);
      } else {
        // Create account with contact atomically
        const contactData: Record<string, any> = {
          firstName: formData.contactName.split(' ')[0],
          lastName: formData.contactName.split(' ').slice(1).join(' ') || undefined,
          email: formData.contactEmail || undefined,
          phone: formData.contactPhone || undefined,
          designation: formData.contactDesignation === 'Other'
            ? formData.contactDesignationOther || 'Other'
            : formData.contactDesignation || undefined,
          status: 'active',
          ownerId: formData.ownerId || user?.id,
        };
        await accountsApi.createWithContact({ account: payload, contact: contactData });
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
    setDetailCollections([]);
    setShowDetailModal(true);
    setIsDetailLoading(true);
    try {
      const [contacts, deals, collectionsRes] = await Promise.all([
        accountsApi.getContacts(account.id),
        accountsApi.getDeals(account.id),
        salesApi.list({ search: account.name, limit: '100' }),
      ]);
      setDetailContacts(Array.isArray(contacts) ? contacts : []);
      setDetailDeals(Array.isArray(deals) ? deals : []);
      const entries = collectionsRes?.data ?? collectionsRes;
      setDetailCollections(Array.isArray(entries) ? entries : []);
    } catch {
      setDetailContacts([]);
      setDetailDeals([]);
      setDetailCollections([]);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailAccount(null);
    setDetailContacts([]);
    setDetailDeals([]);
    setDetailCollections([]);
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

  const hasActiveFilters = searchTerm || industryFilter || accountTypeFilter || tagFilter || typeFilter;

  const clearAllFilters = () => {
    setSearchTerm('');
    setIndustryFilter('');
    setAccountTypeFilter('');
    setTagFilter('');
    setTypeFilter('');
  };


  // ---------------------------------------------------------------------------
  // Render: Toolbar
  // ---------------------------------------------------------------------------

  const renderToolbar = () => (
    <Card padding="none" className="p-4 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Input
            type="text"
            placeholder="Search by account name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Filters Toggle */}
        <Button
          variant={showFilters || hasActiveFilters ? 'primary' : 'secondary'}
          size="md"
          icon={<Filter className="w-4 h-4" />}
          onClick={() => setShowFilters(!showFilters)}
          className="whitespace-nowrap font-normal"
        >
          Filters{hasActiveFilters ? ' (active)' : ''}
        </Button>

        {/* Bulk Import */}
        <Button
          variant="secondary"
          size="md"
          icon={<Upload className="w-4 h-4" />}
          onClick={() => setShowBulkImport(true)}
          title="Import from CSV"
          className="whitespace-nowrap font-normal"
        >
          Import
        </Button>

        {/* Export CSV */}
        <Button
          variant="secondary"
          size="md"
          icon={<Download className="w-4 h-4" />}
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
            { header: 'Account Type', accessor: (r: Account) => r.accountType },
            { header: 'Status', accessor: (r: Account) => r.status },
            { header: 'Owner', accessor: (r: Account) => r.ownerName },
            { header: 'GSTIN', accessor: (r: Account) => r.gstinNo },
            { header: 'Payment Terms', accessor: (r: Account) => r.paymentTerms },
          ], accounts)}
          disabled={accounts.length === 0}
          title="Export to Excel"
          className="whitespace-nowrap font-normal"
        >
          Export
        </Button>

        {/* New Account */}
        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={openCreateModal}
          shine
          className="whitespace-nowrap"
        >
          New Account
        </Button>
      </div>

      {/* Filter Row */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3">
          <Select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}>
            <option value="">All Industries</option>
            {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
          </Select>
          <Select value={accountTypeFilter} onChange={e => setAccountTypeFilter(e.target.value)}>
            <option value="">All Account Types</option>
            <option value="Channel Partner">Channel Partner</option>
            <option value="End Customer">End Customer</option>
          </Select>
          <Select value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
            <option value="">All Tags (Tag 1)</option>
            <option value="Digital Account">Digital Account</option>
            <option value="Existing Account">Existing Account</option>
          </Select>
          <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types (Tag 2)</option>
            <option value="Hunting">Hunting</option>
            <option value="Farming">Farming</option>
            <option value="Cold">Cold</option>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="md"
              icon={<X className="w-3.5 h-3.5" />}
              onClick={clearAllFilters}
              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Clear
            </Button>
          )}
        </div>
      )}
    </Card>
  );

  // ---------------------------------------------------------------------------
  // Render: Table
  // ---------------------------------------------------------------------------

  const accountColumns: DataTableColumn<Account>[] = [
    { key: 'name', label: 'Name', width: '14%', render: (a) => <span className="font-medium">{a.name}</span> },
    { key: 'industry', label: 'Industry', width: '10%', render: (a) => <>{a.industry || '-'}</> },
    {
      key: 'tag1', label: 'Tag 1', width: '9%',
      render: (a) => {
        const tag1 = a.tag || '';
        if (!tag1) return <span className="text-gray-300 dark:text-zinc-600">-</span>;
        return <Badge variant={tag1.toLowerCase().includes('digital') ? 'blue' : 'purple'} size="sm">{tag1}</Badge>;
      },
    },
    {
      key: 'tag2', label: 'Tag 2', width: '9%',
      render: (a) => {
        const t = (a.type || '').toLowerCase();
        if (!t) return <span className="text-gray-300 dark:text-zinc-600">-</span>;
        const variant = t === 'hunting' ? 'amber' : t === 'farming' ? 'emerald' : 'cyan';
        return <Badge variant={variant} size="sm">{a.type}</Badge>;
      },
    },
    {
      key: 'accountType', label: 'Account Type', width: '11%',
      render: (a) => {
        const at = (a.accountType || '').toLowerCase();
        if (!at) return <span className="text-gray-300 dark:text-zinc-600">-</span>;
        return <Badge variant={at === 'channel partner' ? 'emerald' : 'warning'} size="sm">{a.accountType}</Badge>;
      },
    },
    { key: 'phone', label: 'Phone', width: '10%', render: (a) => <span className="whitespace-nowrap">{a.phone || '-'}</span> },
    { key: 'email', label: 'Email', width: '13%', render: (a) => <span className="truncate block max-w-[170px]">{a.email || '-'}</span> },
    { key: 'revenue', label: 'Revenue', width: '10%', render: (a) => <span className="font-semibold whitespace-nowrap">{a.revenue ? formatINR(a.revenue) : '-'}</span> },
    {
      key: 'overdue', label: 'Overdue', width: '10%',
      render: (a) => {
        const col = collectionsMap[(a.name || '').toLowerCase()];
        if (!col) return <span className="text-gray-300 dark:text-zinc-600">-</span>;
        const overdue = (col.pending || 0) + (col.partial || 0);
        if (overdue <= 0) return <span className="text-gray-300 dark:text-zinc-600">-</span>;
        return <Badge variant="red" size="sm" className="text-[10px]">{formatINR(overdue)}</Badge>;
      },
    },
  ];

  const renderTable = () => (
    <DataTable<Account>
      columns={accountColumns}
      data={accounts}
      isLoading={isLoading}
      loadingMessage="Loading accounts..."
      error={tableError}
      emptyIcon={<Building2 className="w-8 h-8" />}
      emptyMessage={hasActiveFilters ? 'No accounts match filters' : 'No accounts yet'}
      onRowClick={(account) => openDetailModal(account)}
      showIndex
      page={page}
      pageSize={PAGE_SIZE}
      pagination={{
        currentPage: page,
        totalPages,
        totalItems: totalRecords,
        pageSize: PAGE_SIZE,
        onPageChange: setPage,
      }}
    />
  );

  // ---------------------------------------------------------------------------
  // Render: Detail Modal
  // ---------------------------------------------------------------------------

  const detailTabs = [
    { id: 'contacts', label: `Contacts (${detailContacts.length})`, icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'deals', label: `Deals (${detailDeals.length})`, icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'collections', label: `Collections (${detailCollections.length})`, icon: <Wallet className="w-3.5 h-3.5" /> },
  ];

  const renderDetailModal = () => {
    if (!detailAccount) return null;
    const account = detailAccount;

    return (
      <Modal
        open={showDetailModal}
        onClose={closeDetailModal}
        title={account.name}
        size="xl"
        footer={
          <div className="flex items-center gap-2 w-full justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<Edit2 className="w-4 h-4" />}
                onClick={() => { closeDetailModal(); openEditModal(account); }}
              >
                Edit
              </Button>
              {deleteConfirmId === account.id ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => { handleDelete(account.id); closeDetailModal(); }}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirmId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setDeleteConfirmId(account.id)}
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                >
                  Delete
                </Button>
              )}
            </div>
            <div className={cx(
              'flex items-center gap-4 text-[11px]',
              'text-slate-400 dark:text-zinc-600'
            )}>
              {account.createdAt && <span>Created: {formatDate(account.createdAt)}</span>}
              {account.updatedAt && <span>Updated: {formatDate(account.updatedAt)}</span>}
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Account info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label="Industry" value={account.industry} icon={<Briefcase className="w-3.5 h-3.5" />} />
            <InfoRow label="Type" value={account.type} icon={<Building2 className="w-3.5 h-3.5" />} />
            <InfoRow label="Phone" value={account.phone} icon={<Phone className="w-3.5 h-3.5" />} />
            <InfoRow label="Email" value={account.email} icon={<Mail className="w-3.5 h-3.5" />} />
            <InfoRow label="Website" value={account.website} icon={<Globe className="w-3.5 h-3.5" />} />
            <InfoRow label="Location" value={account.location} icon={<MapPin className="w-3.5 h-3.5" />} />
            <InfoRow label="Revenue" value={account.revenue ? formatINR(account.revenue) : undefined} icon={<IndianRupee className="w-3.5 h-3.5" />} />
            <InfoRow label="Employees" value={account.employees ? String(account.employees) : undefined} icon={<Users className="w-3.5 h-3.5" />} />
            <InfoRow label="Owner" value={account.ownerName} icon={<UserIcon className="w-3.5 h-3.5" />} />
            <InfoRow label="GSTIN" value={account.gstinNo} icon={<Hash className="w-3.5 h-3.5" />} />
            <InfoRow label="Payment Terms" value={account.paymentTerms} icon={<FileText className="w-3.5 h-3.5" />} />
            <InfoRow label="Account Type" value={account.accountType} icon={<Building2 className="w-3.5 h-3.5" />} />
            <InfoRow label="Tag" value={account.tag} icon={<Building2 className="w-3.5 h-3.5" />} />
          </div>

          {/* Description */}
          {account.description && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-slate-400 dark:text-zinc-500">
                Description
              </h4>
              <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-zinc-300">
                {account.description}
              </p>
            </div>
          )}

          {/* Tabs: Contacts, Deals & Collections */}
          <div>
            <Tabs
              tabs={detailTabs}
              activeTab={detailTab}
              onTabChange={(tabId) => setDetailTab(tabId as 'contacts' | 'deals' | 'collections')}
              className="mb-4"
            />

            {isDetailLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
              </div>
            ) : detailTab === 'contacts' ? (
              detailContacts.length === 0 ? (
                <p className="text-sm py-4 text-center text-slate-400 dark:text-zinc-600">
                  No contacts linked to this account
                </p>
              ) : (
                <div className="space-y-2 pr-1">
                  {detailContacts.map((contact: any) => (
                    <div
                      key={contact.id}
                      onClick={() => { closeDetailModal(); navigate('contacts', { accountId: account.id }); }}
                      className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors border-slate-100 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-800/30"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-100 dark:bg-zinc-800">
                        <UserIcon className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {contact.firstName} {contact.lastName || ''}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {contact.email && (
                            <span className="text-xs text-slate-400 dark:text-zinc-500">
                              {contact.email}
                            </span>
                          )}
                          {contact.jobTitle && (
                            <span className="text-xs text-slate-400 dark:text-zinc-500">
                              {contact.jobTitle}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="gray" size="sm">{contact.status}</Badge>
                    </div>
                  ))}
                  <button
                    onClick={() => { closeDetailModal(); navigate('contacts', { accountId: account.id }); }}
                    className="w-full mt-2 py-2 text-xs font-medium rounded-lg transition-colors text-brand-600 hover:bg-slate-50 dark:text-brand-400 dark:hover:bg-zinc-800/50"
                  >
                    View All Contacts &rarr;
                  </button>
                </div>
              )
            ) : detailTab === 'deals' ? (
              detailDeals.length === 0 ? (
                <p className="text-sm py-4 text-center text-slate-400 dark:text-zinc-600">
                  No deals linked to this account
                </p>
              ) : (
                <div className="space-y-2 pr-1">
                  {detailDeals.map((deal: any) => (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors border-slate-100 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-800/30"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {deal.title}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-slate-400 dark:text-zinc-500">
                            {deal.stage}
                          </span>
                          {deal.closingDate && (
                            <span className="text-xs text-slate-400 dark:text-zinc-500">
                              Close: {formatDate(deal.closingDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      {deal.value !== undefined && deal.value !== null && (
                        <p className="text-sm font-semibold whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                          {formatINR(deal.value)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Collections tab */
              detailCollections.length === 0 ? (
                <p className="text-sm py-4 text-center text-slate-400 dark:text-zinc-600">
                  No collections for this account
                </p>
              ) : (
                <div className="space-y-3 pr-1">
                  {/* Collection summary */}
                  {(() => {
                    const pending = detailCollections.filter((e: any) => e.paymentStatus === 'pending');
                    const partial = detailCollections.filter((e: any) => e.paymentStatus === 'partial');
                    const paid = detailCollections.filter((e: any) => e.paymentStatus === 'paid');
                    const pendingTotal = pending.reduce((s: number, e: any) => s + (e.amount || 0), 0);
                    const partialTotal = partial.reduce((s: number, e: any) => s + (e.amount || 0), 0);
                    const paidTotal = paid.reduce((s: number, e: any) => s + (e.amount || 0), 0);
                    return (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg p-2.5 text-center bg-red-50 dark:bg-red-900/20">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-red-600 dark:text-red-400">Pending</p>
                          <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatINR(pendingTotal)}</p>
                          <p className="text-[10px] text-slate-400 dark:text-zinc-500">{pending.length} orders</p>
                        </div>
                        <div className="rounded-lg p-2.5 text-center bg-amber-50 dark:bg-amber-900/20">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400">Partial</p>
                          <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatINR(partialTotal)}</p>
                          <p className="text-[10px] text-slate-400 dark:text-zinc-500">{partial.length} orders</p>
                        </div>
                        <div className="rounded-lg p-2.5 text-center bg-emerald-50 dark:bg-emerald-900/20">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">Collected</p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatINR(paidTotal)}</p>
                          <p className="text-[10px] text-slate-400 dark:text-zinc-500">{paid.length} orders</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Orders table */}
                  <div className="rounded-lg border overflow-hidden border-slate-200 dark:border-zinc-800">
                    <table className="premium-table text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-zinc-900/50">
                          <th className="text-left px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Date</th>
                          <th className="text-left px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Product</th>
                          <th className="text-right px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Amount</th>
                          <th className="text-center px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailCollections.map((entry: any, j: number) => (
                          <tr key={j} className="border-t border-slate-100 dark:border-zinc-800">
                            <td className="px-2.5 py-1.5 text-slate-700 dark:text-zinc-300">{entry.saleDate ? formatDate(entry.saleDate) : '-'}</td>
                            <td className="px-2.5 py-1.5 text-slate-700 dark:text-zinc-300">{entry.productName || '-'}</td>
                            <td className="px-2.5 py-1.5 text-right font-medium text-slate-900 dark:text-white">{formatINR(entry.amount || 0)}</td>
                            <td className="px-2.5 py-1.5 text-center">
                              <Badge
                                variant={
                                  entry.paymentStatus === 'paid' ? 'emerald'
                                  : entry.paymentStatus === 'partial' ? 'amber'
                                  : 'red'
                                }
                                size="sm"
                                className="text-[9px]"
                              >
                                {entry.paymentStatus || 'pending'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </Modal>
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
          <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white">
            Accounts
          </h1>
          <p className="text-sm mt-0.5 text-slate-500 dark:text-zinc-400">
            Manage customer accounts and track revenue
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <Card padding="none" className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display text-slate-900 dark:text-white">{typeSummary.total}</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500">Total</p>
          </div>
        </Card>
        <Card padding="none" className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display text-slate-900 dark:text-white">{typeSummary.channel}</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500">Channel</p>
          </div>
        </Card>
        <Card padding="none" className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display text-slate-900 dark:text-white">{typeSummary.endCustomer}</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500">End Customer</p>
          </div>
        </Card>
        <Card padding="none" className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display text-slate-900 dark:text-white">{typeSummary.hunting}</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500">Hunting</p>
          </div>
        </Card>
        <Card padding="none" className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display text-slate-900 dark:text-white">{typeSummary.farming}</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500">Farming</p>
          </div>
        </Card>
        <Card padding="none" className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
            <Snowflake className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold font-display text-slate-900 dark:text-white">{typeSummary.cold}</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500">Cold</p>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      {renderToolbar()}

      {/* Content */}
      {renderTable()}

      {/* Modals */}
      {renderFormModal()}
      {renderDetailModal()}

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        entity="accounts"
        entityLabel="Accounts"
        onSuccess={() => { fetchAccounts(); fetchSummary(); fetchCollections(); }}
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
  icon?: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-dark-100">
    {icon && (
      <span className="mt-0.5 flex-shrink-0 text-slate-400 dark:text-zinc-500">
        {icon}
      </span>
    )}
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">{label}</p>
      <p className="text-sm text-slate-900 dark:text-white">
        {value || '-'}
      </p>
    </div>
  </div>
);
