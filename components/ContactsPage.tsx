import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, ChevronLeft, ChevronRight, Edit2, Trash2,
  Loader2, AlertCircle, CheckCircle, Building2,
  Phone, Mail, Eye, Briefcase, User as UserIcon,
  MessageSquare, Smartphone, Users
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { contactsApi, accountsApi } from '../services/api';
import { Contact, Account, PaginatedResponse } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

const CONTACT_TYPES = [
  'Customer',
  'Prospect',
  'Partner',
  'Vendor',
];

const STATUSES = ['Active', 'Inactive'];

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
  status: string;
  preferredContact: string;
  notes: string;
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
  status: 'Active',
  preferredContact: '',
  notes: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

export const ContactsPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  // Data state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [accountsList, setAccountsList] = useState<Account[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
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

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    setTableError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (filterStatus) params.status = filterStatus;
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
  }, [page, filterStatus, filterType, filterAccountId, searchTerm]);

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await accountsApi.list({ limit: '200' });
      const data = response?.data ?? response;
      setAccountsList(Array.isArray(data) ? data : []);
    } catch {
      // Dropdown data failure is non-critical
    }
  }, []);

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
  }, [filterStatus, filterType, filterAccountId, searchTerm]);

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
      status: contact.status || 'Active',
      preferredContact: contact.preferredContact || '',
      notes: contact.notes || '',
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
    setFilterStatus('');
    setFilterType('');
    setFilterAccountId('');
    setSearchTerm('');
  };

  const hasActiveFilters = filterStatus || filterType || filterAccountId || searchTerm;

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

        {/* Filter: Status */}
        <div className="w-full lg:w-36">
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
            Loading contacts...
          </p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
            isDark ? 'bg-zinc-800' : 'bg-slate-100'
          }`}>
            <Users className={`w-7 h-7 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
          </div>
          <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            {hasActiveFilters ? 'No contacts match your filters' : 'No contacts yet'}
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
            {hasActiveFilters ? 'Try adjusting your filters' : 'Click "New Contact" to create one'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                  {['Name', 'Email', 'Phone', 'Job Title', 'Account', 'Status', 'Actions'].map(h => (
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
                {contacts.map(contact => (
                  <tr
                    key={contact.id}
                    onClick={() => openDetailModal(contact)}
                    className={`border-b transition-colors cursor-pointer ${
                      isDark
                        ? 'border-zinc-800/50 hover:bg-gray-800/50'
                        : 'border-slate-50 hover:bg-gray-50'
                    }`}
                  >
                    {/* Name */}
                    <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <div className="flex items-center gap-2">
                        <UserIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                        <span className="font-medium">
                          {contact.firstName} {contact.lastName || ''}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <span className="truncate block max-w-[200px]">{contact.email || '-'}</span>
                    </td>

                    {/* Phone */}
                    <td className={`px-4 py-3 whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {contact.phone || '-'}
                    </td>

                    {/* Job Title */}
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {contact.jobTitle || '-'}
                    </td>

                    {/* Account */}
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {contact.accountName || '-'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={statusBadge(contact.status, isDark)}>
                        {contact.status || '-'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); openDetailModal(contact); }}
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
                          onClick={(e) => { e.stopPropagation(); openEditModal(contact); }}
                          title="Edit"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark
                              ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20'
                              : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                          }`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {deleteConfirmId === contact.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(contact.id); }}
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
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(contact.id); }}
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeDetailModal} />
        <div className={`relative w-full max-w-2xl max-h-[85vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
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
              <span className={statusBadge(contact.status, isDark)}>{contact.status}</span>
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
            {/* Contact info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="First Name" value={contact.firstName} isDark={isDark} icon={<UserIcon className="w-3.5 h-3.5" />} />
              <InfoRow label="Last Name" value={contact.lastName} isDark={isDark} icon={<UserIcon className="w-3.5 h-3.5" />} />
              <InfoRow label="Email" value={contact.email} isDark={isDark} icon={<Mail className="w-3.5 h-3.5" />} />
              <InfoRow label="Phone" value={contact.phone} isDark={isDark} icon={<Phone className="w-3.5 h-3.5" />} />
              <InfoRow label="Mobile" value={contact.mobile} isDark={isDark} icon={<Smartphone className="w-3.5 h-3.5" />} />
              <InfoRow label="Job Title" value={contact.jobTitle} isDark={isDark} icon={<Briefcase className="w-3.5 h-3.5" />} />
              <InfoRow label="Department" value={contact.department} isDark={isDark} icon={<Building2 className="w-3.5 h-3.5" />} />
              <InfoRow label="Account" value={contact.accountName} isDark={isDark} icon={<Building2 className="w-3.5 h-3.5" />} />
              <InfoRow label="Type" value={contact.type} isDark={isDark} icon={<Users className="w-3.5 h-3.5" />} />
              <InfoRow label="Preferred Contact" value={contact.preferredContact} isDark={isDark} icon={<MessageSquare className="w-3.5 h-3.5" />} />
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeFormModal} />
        <div className={`relative w-full max-w-2xl max-h-[85vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
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
            <div className="p-6 space-y-5 pb-20">
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

            {/* Row 4: Job Title + Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="jobTitle" className={labelClass}>Job Title</label>
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
                <label htmlFor="accountId" className={labelClass}>Account</label>
                <select
                  id="accountId"
                  name="accountId"
                  value={formData.accountId}
                  onChange={handleFormChange}
                  className={selectClass}
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
