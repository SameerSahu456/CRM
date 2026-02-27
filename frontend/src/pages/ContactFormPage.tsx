import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Edit2, Trash2, Loader2, AlertCircle, CheckCircle,
  ArrowLeft, Building2, User as UserIcon,
  Phone, Mail, Briefcase, Smartphone, MessageSquare,
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { contactsApi, accountsApi } from '@/services/api';
import { Contact, Account } from '@/types';
import { Card, Button, Input, Select, Alert, Textarea } from '@/components/ui';

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
  preferredContact: '',
  notes: '',
  status: 'Active',
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ContactFormPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const mode: 'create' | 'edit' | 'view' = location.pathname.includes('/create')
    ? 'create'
    : location.pathname.includes('/edit/')
      ? 'edit'
      : 'view';

  // ---------------------------------------------------------------------------
  // State: Dropdown data
  // ---------------------------------------------------------------------------
  const [accountsList, setAccountsList] = useState<Account[]>([]);

  // ---------------------------------------------------------------------------
  // State: Form (create / edit)
  // ---------------------------------------------------------------------------
  const [formData, setFormData] = useState<ContactFormData>({ ...EMPTY_CONTACT_FORM });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);

  // ---------------------------------------------------------------------------
  // State: Detail (view)
  // ---------------------------------------------------------------------------
  const [detailContact, setDetailContact] = useState<Contact | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  const handleBack = () => navigate('/contacts');

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await accountsApi.list({ limit: '500', fields: 'id,name' });
      const data = response?.data ?? response;
      setAccountsList(Array.isArray(data) ? data : []);
    } catch {
      // Dropdown data failure is non-critical
    }
  }, []);

  const fetchContactForEdit = useCallback(async (contactId: string) => {
    setIsLoadingForm(true);
    try {
      const res = await contactsApi.getById(contactId);
      const full = res?.data ?? res;
      setFormData({
        firstName: full.firstName || '',
        lastName: full.lastName || '',
        email: full.email || '',
        phone: full.phone || '',
        mobile: full.mobile || '',
        jobTitle: full.jobTitle || '',
        department: full.department || '',
        accountId: full.accountId || '',
        preferredContact: full.preferredContact || '',
        notes: full.notes || '',
        status: full.status || 'Active',
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to load contact');
    } finally {
      setIsLoadingForm(false);
    }
  }, []);

  const fetchContactForView = useCallback(async (contactId: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await contactsApi.getById(contactId);
      const contact = res?.data ?? res;
      setDetailContact(contact);
    } catch (err: any) {
      console.error('Failed to load contact', err);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  // Main data loading effect
  useEffect(() => {
    if (mode === 'create') {
      setFormData({ ...EMPTY_CONTACT_FORM });
      setFormError('');
      fetchAccounts();
    } else if (mode === 'edit' && id) {
      setFormError('');
      fetchAccounts();
      fetchContactForEdit(id);
    } else if (mode === 'view' && id) {
      fetchContactForView(id);
    }
  }, [mode, id]);

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

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
      if (mode === 'edit' && id) {
        await contactsApi.update(id, formData);
      } else {
        await contactsApi.create({ ...formData, ownerId: user?.id });
      }
      navigate('/contacts');
    } catch (err: any) {
      setFormError(err.message || 'Failed to save contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------

  const handleDelete = async (contactId: string) => {
    try {
      await contactsApi.delete(contactId);
      navigate('/contacts');
    } catch (err: any) {
      console.error('Failed to delete contact', err);
    }
  };

  // ---------------------------------------------------------------------------
  // Render: Create/Edit Form
  // ---------------------------------------------------------------------------

  const renderForm = () => {
    if (isLoadingForm) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">Loading contact...</p>
        </div>
      );
    }

    return (
      <Card>
        <form id="contact-form" onSubmit={handleFormSubmit} className="space-y-5">
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
              label="Last Name"
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleFormChange}
              icon={<UserIcon className="w-4 h-4" />}
            />
          </div>

          {/* Row 2: Email (full width) */}
          <Input
            label="Email"
            id="email"
            name="email"
            type="email"
            placeholder="contact@company.com"
            value={formData.email}
            onChange={handleFormChange}
            icon={<Mail className="w-4 h-4" />}
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

          {/* Row 5: Account + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Account *" name="accountId" value={formData.accountId} onChange={handleFormChange}>
              <option value="">Select Account</option>
              {accountsList.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
            <Select label="Status" name="status" value={formData.status} onChange={handleFormChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
          </div>

          {/* Row 6: Preferred Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Preferred Contact" name="preferredContact" value={formData.preferredContact} onChange={handleFormChange}>
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

          {/* Form actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              icon={isSubmitting ? undefined : <CheckCircle className="w-4 h-4" />}
              shine
            >
              {isSubmitting ? 'Saving...' : (mode === 'edit' ? 'Update Contact' : 'Create Contact')}
            </Button>
          </div>
        </form>
      </Card>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Detail View
  // ---------------------------------------------------------------------------

  const renderDetail = () => {
    if (isLoadingDetail || !detailContact) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">Loading contact...</p>
        </div>
      );
    }

    const contact = detailContact;

    return (
      <div className="space-y-6">
        {/* Actions bar */}
        <Card padding="none" className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {contact.firstName} {contact.lastName || ''}
              </span>
              {contact.status && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  contact.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}>
                  {contact.status}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Edit */}
              <Button
                variant="ghost"
                size="xs"
                onClick={() => navigate('/contacts/edit/' + contact.id)}
                icon={<Edit2 className="w-4 h-4" />}
                title="Edit"
              />
              {/* Delete */}
              {deleteConfirmId === contact.id ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => handleDelete(contact.id)}
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
                  size="xs"
                  onClick={() => setDeleteConfirmId(contact.id)}
                  icon={<Trash2 className="w-4 h-4" />}
                  className="hover:text-red-600 dark:hover:text-red-400"
                  title="Delete"
                />
              )}
            </div>
          </div>
        </Card>

        {/* Contact info grid */}
        <Card>
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
                onClick={() => navigate(`/accounts/view/${contact.accountId}`)}
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
            <InfoRow label="Preferred Contact" value={contact.preferredContact} icon={<MessageSquare className="w-3.5 h-3.5" />} />
            <InfoRow label="Status" value={contact.status} icon={<Shield className="w-3.5 h-3.5" />} />
          </div>
        </Card>

        {/* Notes */}
        {contact.notes && (
          <Card>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400 dark:text-zinc-500">
              Notes
            </h4>
            <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-zinc-300">
              {contact.notes}
            </p>
          </Card>
        )}

        {/* Timestamps */}
        <div className="flex items-center gap-4 text-[11px] px-1 text-gray-400 dark:text-zinc-600">
          {contact.createdAt && <span>Created: {formatDate(contact.createdAt)}</span>}
          {contact.updatedAt && <span>Updated: {formatDate(contact.updatedAt)}</span>}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 animate-fade-in-up">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBack}
          className="p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
        </button>
        <div>
          <h1 className="text-xl font-bold font-display text-gray-900 dark:text-white">
            {mode === 'create'
              ? 'New Contact'
              : mode === 'edit'
                ? 'Edit Contact'
                : detailContact
                  ? `${detailContact.firstName} ${detailContact.lastName || ''}`
                  : 'Contact Details'}
          </h1>
          <p className="text-sm mt-0.5 text-gray-500 dark:text-zinc-400">
            {mode === 'create'
              ? 'Create a new contact'
              : mode === 'edit'
                ? 'Update contact information'
                : 'View contact details'}
          </p>
        </div>
      </div>

      {(mode === 'create' || mode === 'edit') && renderForm()}
      {mode === 'view' && renderDetail()}
    </div>
  );
};
