import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, ChevronLeft, ChevronRight, Edit2, Trash2,
  Loader2, AlertCircle, CheckCircle, Building2,
  Phone, Mail, Briefcase, User as UserIcon,
  Smartphone, Users,
  Download, Upload
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useDropdowns } from '../contexts/DropdownsContext';
import { contactsApi, accountsApi } from '../services/api';
import { exportToCsv } from '../utils/exportCsv';
import { Contact, Account, PaginatedResponse } from '../types';
import { BulkImportModal } from './BulkImportModal';
import { useColumnResize } from '../hooks/useColumnResize';

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
  const { theme } = useTheme();
  const { user } = useAuth();
  const { setActiveTab: navigate, consumeNavParams } = useNavigation();
  const { getValues } = useDropdowns();
  const isDark = theme === 'dark';

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

  const { colWidths, onMouseDown } = useColumnResize({
    initialWidths: [45, 200, 240, 150, 170, 200],
  });

  const cardClass = `premium-card ${isDark ? '' : 'shadow-soft'}`;
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

  const openEditModal = (contact: Contact) => {
    setFormData({
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      phone: contact.phone || '',
      mobile: contact.mobile || '',
      jobTitle: contact.jobTitle || '',
      department: contact.department || '',
      accountId: contact.accountId || '',
      type: contact.type || '',
      preferredContact: contact.preferredContact || '',
      notes: contact.notes || '',
      status: (contact as any).status || 'Active',
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
    <div className={`${cardClass} p-4`}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            isDark ? 'text-zinc-500' : 'text-slate-400'
          }`} />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
              isDark
                ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
            } focus:outline-none focus:ring-1 focus:ring-brand-500`}
          />
        </div>

        {/* Filter: Account */}
        <div className="w-full lg:w-48">
          <select
            value={filterAccountId}
            onChange={e => setFilterAccountId(e.target.value)}
            className={selectClass}
          >
            <option value="">All Accounts</option>
            {accountsList.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* Filter: Type */}
        <div className="w-full lg:w-40">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className={selectClass}
          >
            <option value="">All Types</option>
            {CONTACT_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
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
          onClick={() => exportToCsv('contacts', [
            { header: 'First Name', accessor: (r: Contact) => r.firstName },
            { header: 'Last Name', accessor: (r: Contact) => r.lastName },
            { header: 'Email', accessor: (r: Contact) => r.email },
            { header: 'Phone', accessor: (r: Contact) => r.phone },
            { header: 'Mobile', accessor: (r: Contact) => r.mobile },
            { header: 'Designation', accessor: (r: Contact) => r.designation || r.jobTitle },
            { header: 'Department', accessor: (r: Contact) => r.department },
            { header: 'Account', accessor: (r: Contact) => r.accountName },
            { header: 'Type', accessor: (r: Contact) => r.type },
            { header: 'Status', accessor: (r: Contact) => r.status },
            { header: 'Preferred Contact', accessor: (r: Contact) => r.preferredContact },
            { header: 'Notes', accessor: (r: Contact) => r.notes },
          ], contacts)}
          disabled={contacts.length === 0}
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

        {/* New Contact */}
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Contact
        </button>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Table
  // ---------------------------------------------------------------------------

  const cellBase = `px-3 py-2.5 text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`;
  const hdrCell = `px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`;

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

      {/* Record count */}
      {totalRecords > 0 && (
        <div className={`px-4 py-2 text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
          {totalRecords} contact{totalRecords !== 1 ? 's' : ''} found
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Loading contacts...
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr className={`border-b ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
                  {['#', 'Name', 'Email', 'Phone', 'Designation', 'Account'].map((label, i) => (
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
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Users className={`w-8 h-8 mx-auto ${isDark ? 'text-zinc-700' : 'text-slate-300'}`} />
                      <p className={`mt-2 text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        {hasActiveFilters ? 'No contacts match filters' : 'No contacts yet'}
                      </p>
                    </td>
                  </tr>
                ) : contacts.map((contact, idx) => (
                  <tr
                    key={contact.id}
                    onClick={() => openDetailModal(contact)}
                    className={`border-b cursor-pointer transition-colors ${
                      isDark
                        ? 'border-zinc-800 hover:bg-zinc-800/50'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <td className={`${cellBase} text-center ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className={cellBase}>
                      <span className="font-medium">{contact.firstName} {contact.lastName || ''}</span>
                    </td>
                    <td className={cellBase}>
                      <span className="truncate block max-w-[190px]">{contact.email || '-'}</span>
                    </td>
                    <td className={cellBase}>
                      <span className="whitespace-nowrap">{contact.phone || '-'}</span>
                    </td>
                    <td className={cellBase}>
                      {contact.designation || contact.jobTitle || '-'}
                    </td>
                    <td className={cellBase}>
                      {contact.accountName ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate('accounts', { accountId: contact.accountId }); }}
                          className={`text-left truncate max-w-[150px] font-medium hover:underline ${isDark ? 'text-brand-400 hover:text-brand-300' : 'text-brand-600 hover:text-brand-500'}`}
                        >
                          {contact.accountName}
                        </button>
                      ) : '-'}
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
              {Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords} contacts
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
    if (!showDetailModal || !detailContact) return null;
    const contact = detailContact;

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] overflow-y-auto p-4">
        <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeDetailModal} />
        <div className={`relative w-full max-w-xl max-h-[90vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
          isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
        }`}>
          {/* Header */}
          <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <h2 className={`text-lg font-semibold font-display truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {contact.firstName} {contact.lastName || ''}
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => { closeDetailModal(); openEditModal(contact); }}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              {deleteConfirmId === contact.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { handleDelete(contact.id); closeDetailModal(); }}
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
                  onClick={() => setDeleteConfirmId(contact.id)}
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
            {/* Contact info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="First Name" value={contact.firstName} isDark={isDark} icon={<UserIcon className="w-3.5 h-3.5" />} />
              <InfoRow label="Last Name" value={contact.lastName} isDark={isDark} icon={<UserIcon className="w-3.5 h-3.5" />} />
              <InfoRow label="Email" value={contact.email} isDark={isDark} icon={<Mail className="w-3.5 h-3.5" />} />
              <InfoRow label="Phone" value={contact.phone} isDark={isDark} icon={<Phone className="w-3.5 h-3.5" />} />
              <InfoRow label="Mobile" value={contact.mobile} isDark={isDark} icon={<Smartphone className="w-3.5 h-3.5" />} />
              <InfoRow label="Designation" value={contact.designation || contact.jobTitle} isDark={isDark} icon={<Briefcase className="w-3.5 h-3.5" />} />
              <InfoRow label="Department" value={contact.department} isDark={isDark} icon={<Building2 className="w-3.5 h-3.5" />} />
              {contact.accountName && contact.accountId ? (
                <div
                  onClick={() => { setShowDetailModal(false); setDetailContact(null); navigate('accounts', { accountId: contact.accountId! }); }}
                  className={`flex items-start gap-2 p-2.5 rounded-lg cursor-pointer transition-colors ${isDark ? 'bg-dark-100 hover:bg-zinc-800' : 'bg-slate-50 hover:bg-slate-100'}`}
                >
                  <span className={`mt-0.5 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    <Building2 className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Account</p>
                    <p className={`text-sm font-medium hover:underline ${isDark ? 'text-brand-400' : 'text-brand-600'}`}>
                      {contact.accountName}
                    </p>
                  </div>
                </div>
              ) : (
                <InfoRow label="Account" value={contact.accountName} isDark={isDark} icon={<Building2 className="w-3.5 h-3.5" />} />
              )}
              <InfoRow label="Type" value={contact.type} isDark={isDark} icon={<Users className="w-3.5 h-3.5" />} />
            </div>

            {/* Notes */}
            {contact.notes && (
              <div>
                <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Notes
                </h4>
                <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  {contact.notes}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className={`flex items-center gap-4 text-[11px] pt-2 border-t ${
              isDark ? 'border-zinc-800 text-zinc-600' : 'border-slate-100 text-slate-400'
            }`}>
              {contact.createdAt && <span>Created: {formatDate(contact.createdAt)}</span>}
              {contact.updatedAt && <span>Updated: {formatDate(contact.updatedAt)}</span>}
            </div>
          </div>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Create/Edit Modal
  // ---------------------------------------------------------------------------

  const renderFormModal = () => {
    if (!showFormModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] overflow-y-auto p-4">
        <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeFormModal} />
        <div className={`relative w-full max-w-xl max-h-[90vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
          isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
        }`}>
          {/* Header */}
          <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {editingContactId ? 'Edit Contact' : 'New Contact'}
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
            <div className="p-6 space-y-5 pb-6">
            {formError && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            {/* Row 1: First Name + Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className={labelClass}>
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    className={`${inputClass} pl-10`}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className={labelClass}>
                  Last Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    className={`${inputClass} pl-10`}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Email (full width) */}
            <div>
              <label htmlFor="email" className={labelClass}>
                Email <span className="text-red-500">*</span>
              </label>
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
                  required
                />
              </div>
            </div>

            {/* Row 3: Phone + Mobile */}
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
                <label htmlFor="mobile" className={labelClass}>Mobile</label>
                <div className="relative">
                  <Smartphone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="mobile"
                    name="mobile"
                    type="text"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.mobile}
                    onChange={handleFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Designation + Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="jobTitle" className={labelClass}>Designation</label>
                <div className="relative">
                  <Briefcase className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    placeholder="e.g. Sales Manager"
                    value={formData.jobTitle}
                    onChange={handleFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="department" className={labelClass}>Department</label>
                <div className="relative">
                  <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="department"
                    name="department"
                    type="text"
                    placeholder="e.g. Engineering"
                    value={formData.department}
                    onChange={handleFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            {/* Row 5: Account + Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="accountId" className={labelClass}>Account <span className="text-red-500">*</span></label>
                <select
                  id="accountId"
                  name="accountId"
                  value={formData.accountId}
                  onChange={handleFormChange}
                  className={selectClass}
                  required
                >
                  <option value="">Select Account</option>
                  {accountsList.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
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
                  <option value="Vendor">Vendor</option>
                </select>
              </div>
            </div>

            {/* Row 6: Status + Preferred Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className={labelClass}>Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className={selectClass}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label htmlFor="preferredContact" className={labelClass}>Preferred Contact</label>
                <select
                  id="preferredContact"
                  name="preferredContact"
                  value={formData.preferredContact}
                  onChange={handleFormChange}
                  className={selectClass}
                >
                  <option value="">Select...</option>
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="Mobile">Mobile</option>
                </select>
              </div>
            </div>

            {/* Row 7: Notes */}
            <div>
              <label htmlFor="notes" className={labelClass}>Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
                  <><CheckCircle className="w-4 h-4" /> {editingContactId ? 'Update Contact' : 'Create Contact'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
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
            Contacts
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
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
        isDark={isDark}
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
