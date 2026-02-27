import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, X,
  Building2, Users,
  Download, Upload
} from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { contactsApi, accountsApi, CONTACT_LIST_FIELDS } from '@/services/api';
import { exportToCsv } from '@/utils/exportCsv';
import { Contact, Account, PaginatedResponse } from '@/types';
import { BulkImportModal } from '@/components/common/BulkImportModal';
import { Card, Button, Input, Select, DataTable, DataTableColumn } from '@/components/ui';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;


// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ContactsPage: React.FC = () => {
  const { setActiveTab: navigate, consumeNavParams } = useNavigation();
  const routerNavigate = useNavigate();

  // Data state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [accountsList, setAccountsList] = useState<Account[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAccountId, setFilterAccountId] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [tableError, setTableError] = useState('');

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Styling helpers
  // ---------------------------------------------------------------------------


  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    setTableError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (filterType) params.type = filterType;
      if (filterAccountId) params.accountId = filterAccountId;
      if (searchTerm) params.search = searchTerm;
      params.fields = CONTACT_LIST_FIELDS;

      const response: PaginatedResponse<Contact> = await contactsApi.list(params);
      setContacts(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);
    } catch (err: any) {
      setTableError(err.message || 'Failed to load contacts');
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterType, filterAccountId, searchTerm]);

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await accountsApi.list({ limit: '100' });
      const data = response?.data ?? response;
      setAccountsList(Array.isArray(data) ? data : []);
    } catch {
      // Dropdown data failure is non-critical
    }
  }, []);

  // Consume nav params (e.g. navigated from AccountsPage with accountId)
  useEffect(() => {
    const params = consumeNavParams();
    if (params?.accountId) {
      setFilterAccountId(params.accountId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Fetch contacts when filters/page change
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterType, filterAccountId, searchTerm]);

  // ---------------------------------------------------------------------------
  // Navigation handlers (replaced modals)
  // ---------------------------------------------------------------------------

  const openCreateModal = () => routerNavigate('/contacts/create');

  const openEditModal = (contact: Contact) => routerNavigate('/contacts/edit/' + contact.id);

  const openDetailModal = (contact: Contact) => routerNavigate('/contacts/view/' + contact.id);

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------

  const handleDelete = async (id: string) => {
    try {
      await contactsApi.delete(id);
      setDeleteConfirmId(null);
      fetchContacts();
    } catch (err: any) {
      setTableError(err.message || 'Failed to delete contact');
    }
  };

  // ---------------------------------------------------------------------------
  // Misc helpers
  // ---------------------------------------------------------------------------

  const clearFilters = () => {
    setFilterType('');
    setFilterAccountId('');
    setSearchTerm('');
  };

  const hasActiveFilters = filterType || filterAccountId || searchTerm;

  // ---------------------------------------------------------------------------
  // Render: Toolbar
  // ---------------------------------------------------------------------------

  const renderToolbar = () => (
    <Card padding="none" className="p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Filter: Account — temporarily hidden
        <div className="w-full lg:w-48">
          <Select
            value={filterAccountId}
            onChange={e => setFilterAccountId(e.target.value)}
          >
            <option value="">All Accounts</option>
            {accountsList.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </div>
        */}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="md"
            onClick={clearFilters}
            icon={<X className="w-3.5 h-3.5" />}
          >
            Clear
          </Button>
        )}

        {/* Bulk Import */}
        <Button
          variant="secondary"
          size="md"
          onClick={() => setShowBulkImport(true)}
          title="Import from CSV"
          icon={<Upload className="w-4 h-4" />}
          className="whitespace-nowrap"
        >
          Import
        </Button>

        {/* Export CSV */}
        <Button
          variant="secondary"
          size="md"
          onClick={() => exportToCsv('contacts', [
            { header: 'First Name', accessor: (r: Contact) => r.firstName },
            { header: 'Last Name', accessor: (r: Contact) => r.lastName },
            { header: 'Email', accessor: (r: Contact) => r.email },
            { header: 'Phone', accessor: (r: Contact) => r.phone },
            { header: 'Mobile', accessor: (r: Contact) => r.mobile },
            { header: 'Designation', accessor: (r: Contact) => r.designation || r.jobTitle },
            { header: 'Department', accessor: (r: Contact) => r.department },
            { header: 'Account', accessor: (r: Contact) => r.accountName },
            { header: 'Preferred Contact', accessor: (r: Contact) => r.preferredContact },
            { header: 'Notes', accessor: (r: Contact) => r.notes },
          ], contacts)}
          disabled={contacts.length === 0}
          title="Export to Excel"
          icon={<Download className="w-4 h-4" />}
          className="whitespace-nowrap"
        >
          Export
        </Button>

        {/* New Contact */}
        <Button
          variant="primary"
          size="md"
          onClick={openCreateModal}
          icon={<Plus className="w-4 h-4" />}
          shine
          className="whitespace-nowrap"
        >
          New Contact
        </Button>
      </div>
    </Card>
  );

  // ---------------------------------------------------------------------------
  // Render: Table
  // ---------------------------------------------------------------------------

  const contactColumns: DataTableColumn<Contact>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (c) => <span className="font-medium">{c.firstName} {c.lastName || ''}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      render: (c) => <>{c.email || '-'}</>,
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (c) => <>{c.phone || '-'}</>,
    },
    {
      key: 'designation',
      label: 'Designation',
      render: (c) => <>{c.designation || c.jobTitle || '-'}</>,
    },
    {
      key: 'account',
      label: 'Account',
      render: (c) =>
        c.accountName ? (
          <button
            onClick={(e) => { e.stopPropagation(); navigate('accounts', { accountId: c.accountId! }); }}
            className="text-left truncate max-w-[150px] font-medium hover:underline text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
          >
            {c.accountName}
          </button>
        ) : <>-</>,
    },
  ];

  const renderTable = () => (
    <DataTable<Contact>
      columns={contactColumns}
      data={contacts}
      isLoading={isLoading}
      loadingMessage="Loading contacts..."
      error={tableError}
      emptyIcon={<Users className="w-8 h-8" />}
      emptyMessage={hasActiveFilters ? 'No contacts match filters' : 'No contacts yet'}
      onRowClick={(contact) => routerNavigate('/contacts/view/' + contact.id)}
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
          <h1 className="text-xl font-bold font-display text-gray-900 dark:text-white">
            Contacts
          </h1>
          <p className="text-sm mt-0.5 text-gray-500 dark:text-zinc-400">
            Manage contacts, track communication preferences, and link to accounts
          </p>
        </div>
      </div>

      {/* Toolbar */}
      {renderToolbar()}

      {/* Table */}
      {renderTable()}

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        entity="contacts"
        entityLabel="Contacts"
        onSuccess={() => fetchContacts()}
      />
    </div>
  );
};
