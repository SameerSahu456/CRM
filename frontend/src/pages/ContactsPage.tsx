import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, Edit2, Trash2,
  AlertCircle, CheckCircle, Building2,
  Phone, Mail, Briefcase, User as UserIcon,
  Smartphone, Users,
  Download, Upload
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useDropdowns } from '@/contexts/DropdownsContext';
import { contactsApi, accountsApi, CONTACT_LIST_FIELDS } from '@/services/api';
import { exportToCsv } from '@/utils/exportCsv';
import { Contact, Account, PaginatedResponse } from '@/types';
import { BulkImportModal } from '@/components/common/BulkImportModal';
import { Card, Button, Input, Select, Modal, Alert, Textarea, DataTable, DataTableColumn } from '@/components/ui';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;


// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  jobTitle: string;
  department: string;
  accountId: string;
  type: string;
  preferredContact: string;
  notes: string;
  status: string;
}

const EMPTY_CONTACT_FORM: ContactFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  mobile: '',
  jobTitle: '',
  department: '',
  accountId: '',
  type: '',
  preferredContact: '',
  notes: '',
  status: 'Active',
};

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

export const ContactsPage: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab: navigate, consumeNavParams } = useNavigation();
  const { getValues } = useDropdowns();

  // Dropdown data from DB
  const CONTACT_TYPES = getValues('contact-types');

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableError, setTableError] = useState('');

  // Create/Edit modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContactFormData>({ ...EMPTY_CONTACT_FORM });
  const [formError, setFormError] = useState('');

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailContact, setDetailContact] = useState<Contact | null>(null);

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
  // Form handlers
  // ---------------------------------------------------------------------------

  const openCreateModal = () => {
    setFormData({ ...EMPTY_CONTACT_FORM });
    setEditingContactId(null);
    setFormError('');
    setShowFormModal(true);
  };

  const openEditModal = async (contact: Contact) => {
    // Fetch full record to avoid partial-field overwrites
    let full: any = contact;
    try {
      const res = await contactsApi.getById(contact.id);
      full = res?.data ?? res;
    } catch { /* fall back to list data */ }
    setFormData({
      firstName: full.firstName || '',
      lastName: full.lastName || '',
      email: full.email || '',
      phone: full.phone || '',
      mobile: full.mobile || '',
      jobTitle: full.jobTitle || '',
      department: full.department || '',
      accountId: full.accountId || '',
      type: full.type || '',
      preferredContact: full.preferredContact || '',
      notes: full.notes || '',
      status: (full as any).status || 'Active',
    });
    setEditingContactId(contact.id);
    setFormError('');
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingContactId(null);
    setFormError('');
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.firstName.trim()) {
      setFormError('First name is required');
      return;
    }
    if (!formData.accountId) {
      setFormError('Account is required. Every contact must be linked to an account.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingContactId) {
        await contactsApi.update(editingContactId, formData);
      } else {
        await contactsApi.create({ ...formData, ownerId: user?.id });
      }
      closeFormModal();
      fetchContacts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Detail handlers
  // ---------------------------------------------------------------------------

  const openDetailModal = (contact: Contact) => {
    setDetailContact(contact);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailContact(null);
  };

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
      onRowClick={(contact) => openDetailModal(contact)}
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

  const renderDetailModal = () => {
    if (!detailContact) return null;
    const contact = detailContact;

    return (
      <Modal
        open={showDetailModal}
        onClose={closeDetailModal}
        title={`${contact.firstName} ${contact.lastName || ''}`}
        size="lg"
      >
        {/* Action buttons row */}
        <div className="flex items-center gap-2 mb-6 -mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { closeDetailModal(); openEditModal(contact); }}
            icon={<Edit2 className="w-4 h-4" />}
            title="Edit"
          >
            Edit
          </Button>
          {deleteConfirmId === contact.id ? (
            <div className="flex items-center gap-1">
              <Button
                variant="danger"
                size="xs"
                onClick={() => { handleDelete(contact.id); closeDetailModal(); }}
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
              size="sm"
              onClick={() => setDeleteConfirmId(contact.id)}
              icon={<Trash2 className="w-4 h-4" />}
              title="Delete"
              className="text-gray-400 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
            >
              Delete
            </Button>
          )}
        </div>

        {/* Contact info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow label="First Name" value={contact.firstName} icon={<UserIcon className="w-3.5 h-3.5" />} />
          <InfoRow label="Last Name" value={contact.lastName} icon={<UserIcon className="w-3.5 h-3.5" />} />
          <InfoRow label="Email" value={contact.email} icon={<Mail className="w-3.5 h-3.5" />} />
          <InfoRow label="Phone" value={contact.phone} icon={<Phone className="w-3.5 h-3.5" />} />
          <InfoRow label="Mobile" value={contact.mobile} icon={<Smartphone className="w-3.5 h-3.5" />} />
          <InfoRow label="Designation" value={contact.designation || contact.jobTitle} icon={<Briefcase className="w-3.5 h-3.5" />} />
          <InfoRow label="Department" value={contact.department} icon={<Building2 className="w-3.5 h-3.5" />} />
          {contact.accountName && contact.accountId ? (
            <div
              onClick={() => { setShowDetailModal(false); setDetailContact(null); navigate('accounts', { accountId: contact.accountId! }); }}
              className="flex items-start gap-2 p-2.5 rounded-lg cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100 dark:bg-dark-100 dark:hover:bg-zinc-800"
            >
              <span className="mt-0.5 flex-shrink-0 text-gray-400 dark:text-zinc-500">
                <Building2 className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-gray-400 dark:text-zinc-500">Account</p>
                <p className="text-sm font-medium hover:underline text-brand-600 dark:text-brand-400">
                  {contact.accountName}
                </p>
              </div>
            </div>
          ) : (
            <InfoRow label="Account" value={contact.accountName} icon={<Building2 className="w-3.5 h-3.5" />} />
          )}
        </div>

        {/* Notes */}
        {contact.notes && (
          <div className="mt-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400 dark:text-zinc-500">
              Notes
            </h4>
            <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-zinc-300">
              {contact.notes}
            </p>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex items-center gap-4 text-[11px] pt-4 mt-6 border-t border-gray-100 text-gray-400 dark:border-zinc-800 dark:text-zinc-600">
          {contact.createdAt && <span>Created: {formatDate(contact.createdAt)}</span>}
          {contact.updatedAt && <span>Updated: {formatDate(contact.updatedAt)}</span>}
        </div>
      </Modal>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Create/Edit Modal
  // ---------------------------------------------------------------------------

  const renderFormModal = () => {
    return (
      <Modal
        open={showFormModal}
        onClose={closeFormModal}
        title={editingContactId ? 'Edit Contact' : 'New Contact'}
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={closeFormModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleFormSubmit as any}
              loading={isSubmitting}
              icon={!isSubmitting ? <CheckCircle className="w-4 h-4" /> : undefined}
              shine
            >
              {isSubmitting ? 'Saving...' : editingContactId ? 'Update Contact' : 'Create Contact'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} id="contact-form">
          <div className="space-y-5">
            {formError && (
              <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
                {formError}
              </Alert>
            )}

            {/* Row 1: First Name + Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                id="firstName"
                name="firstName"
                type="text"
                placeholder="First name"
                value={formData.firstName}
                onChange={handleFormChange}
                icon={<UserIcon className="w-4 h-4" />}
                required
              />
              <Input
                label="Last Name *"
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleFormChange}
                icon={<UserIcon className="w-4 h-4" />}
                required
              />
            </div>

            {/* Row 2: Email (full width) */}
            <Input
              label="Email *"
              id="email"
              name="email"
              type="email"
              placeholder="contact@company.com"
              value={formData.email}
              onChange={handleFormChange}
              icon={<Mail className="w-4 h-4" />}
              required
            />

            {/* Row 3: Phone + Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone"
                id="phone"
                name="phone"
                type="text"
                placeholder="+91 XXXXX XXXXX"
                value={formData.phone}
                onChange={handleFormChange}
                icon={<Phone className="w-4 h-4" />}
              />
              <Input
                label="Mobile"
                id="mobile"
                name="mobile"
                type="text"
                placeholder="+91 XXXXX XXXXX"
                value={formData.mobile}
                onChange={handleFormChange}
                icon={<Smartphone className="w-4 h-4" />}
              />
            </div>

            {/* Row 4: Designation + Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Designation"
                id="jobTitle"
                name="jobTitle"
                type="text"
                placeholder="e.g. Sales Manager"
                value={formData.jobTitle}
                onChange={handleFormChange}
                icon={<Briefcase className="w-4 h-4" />}
              />
              <Input
                label="Department"
                id="department"
                name="department"
                type="text"
                placeholder="e.g. Engineering"
                value={formData.department}
                onChange={handleFormChange}
                icon={<Building2 className="w-4 h-4" />}
              />
            </div>

            {/* Row 5: Account */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Account *"
                id="accountId"
                name="accountId"
                value={formData.accountId}
                onChange={handleFormChange}
                required
              >
                <option value="">Select Account</option>
                {accountsList.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </div>

            {/* Row 6: Preferred Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Preferred Contact"
                id="preferredContact"
                name="preferredContact"
                value={formData.preferredContact}
                onChange={handleFormChange}
              >
                <option value="">Select...</option>
                <option value="Email">Email</option>
                <option value="Phone">Phone</option>
                <option value="Mobile">Mobile</option>
              </Select>
            </div>

            {/* Row 7: Notes */}
            <Textarea
              label="Notes"
              id="notes"
              name="notes"
              rows={3}
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </form>
      </Modal>
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

      {/* Modals */}
      {renderFormModal()}
      {renderDetailModal()}

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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const InfoRow: React.FC<{
  label: string;
  value?: string;
  icon?: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-dark-100">
    {icon && (
      <span className="mt-0.5 flex-shrink-0 text-gray-400 dark:text-zinc-500">
        {icon}
      </span>
    )}
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-gray-400 dark:text-zinc-500">{label}</p>
      <p className="text-sm text-gray-900 dark:text-white">
        {value || '-'}
      </p>
    </div>
  </div>
);
