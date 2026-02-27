import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, X,
  Building2, Users, Briefcase,
  Download, Upload, Target, Leaf, Snowflake,
  Filter
} from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { accountsApi, salesApi, formatINR, ACCOUNT_LIST_FIELDS } from '@/services/api';
import { exportToCsv } from '@/utils/exportCsv';
import { Account, PaginatedResponse } from '@/types';
import { BulkImportModal } from '@/components/common/BulkImportModal';
import { Card, Button, Input, Select, Badge, DataTable, DataTableColumn } from '@/components/ui';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail',
  'Education', 'Real Estate', 'Telecom', 'Energy', 'Media', 'Government', 'Other'
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AccountsPage: React.FC = () => {
  const routerNavigate = useNavigate();
  const { consumeNavParams } = useNavigation();

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
  const [tableError, setTableError] = useState('');


  // Summary counts
  const [typeSummary, setTypeSummary] = useState<{ channel: number; endCustomer: number; hunting: number; farming: number; cold: number; total: number }>({ channel: 0, endCustomer: 0, hunting: 0, farming: 0, cold: 0, total: 0 });

  // Collections data mapped by account name
  const [collectionsMap, setCollectionsMap] = useState<Record<string, { pending: number; partial: number; paid: number }>>({});

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
      routerNavigate('/accounts/view/' + params.accountId);
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

  // ---------------------------------------------------------------------------
  // Navigation handlers
  // ---------------------------------------------------------------------------

  const openCreateModal = () => routerNavigate('/accounts/create');

  const openEditModal = (account: Account) => routerNavigate('/accounts/edit/' + account.id);

  const openDetailModal = (account: Account) => routerNavigate('/accounts/view/' + account.id);

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
    { key: 'name', label: 'Name', render: (a) => <span className="font-medium">{a.name}</span> },
    { key: 'industry', label: 'Industry', render: (a) => <>{a.industry || '-'}</> },
    {
      key: 'tag1', label: 'Tag 1',
      render: (a) => {
        const tag1 = a.tag || '';
        if (!tag1) return <span className="text-gray-300 dark:text-zinc-600">-</span>;
        return <Badge variant={tag1.toLowerCase().includes('digital') ? 'blue' : 'purple'} size="sm">{tag1}</Badge>;
      },
    },
    {
      key: 'tag2', label: 'Tag 2',
      render: (a) => {
        const t = (a.type || '').toLowerCase();
        if (!t) return <span className="text-gray-300 dark:text-zinc-600">-</span>;
        const variant = t === 'hunting' ? 'amber' : t === 'farming' ? 'emerald' : 'cyan';
        return <Badge variant={variant} size="sm">{a.type}</Badge>;
      },
    },
    {
      key: 'accountType', label: 'Account Type',
      render: (a) => {
        const at = (a.accountType || '').toLowerCase();
        if (!at) return <span className="text-gray-300 dark:text-zinc-600">-</span>;
        return <Badge variant={at === 'channel partner' ? 'emerald' : 'warning'} size="sm">{a.accountType}</Badge>;
      },
    },
    { key: 'phone', label: 'Phone', render: (a) => <>{a.phone || '-'}</> },
    { key: 'email', label: 'Email', render: (a) => <>{a.email || '-'}</> },
    { key: 'revenue', label: 'Revenue', render: (a) => <span className="font-semibold">{a.revenue ? formatINR(a.revenue) : '-'}</span> },
    {
      key: 'overdue', label: 'Overdue',
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
