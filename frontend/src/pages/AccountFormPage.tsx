import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Trash2,
  IndianRupee, Loader2, AlertCircle, CheckCircle,
  Building2, User as UserIcon,
  FileText, Briefcase, Globe,
  MapPin, Phone, Mail, Hash, Users, Copy, Wallet, TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { accountsApi, partnersApi, adminApi, salesApi, formatINR } from '@/services/api';
import { Account, Contact, Deal } from '@/types';
import { Card, Button, Badge, Alert } from '@/components/ui';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail',
  'Education', 'Real Estate', 'Telecom', 'Energy', 'Media', 'Government', 'Other'
];

const ACCOUNT_TYPES = ['Hunting', 'Farming', 'Cold'];
const DESIGNATIONS = ['CEO', 'CFO', 'CTO', 'Manager', 'Director', 'VP', 'Other'];

// ---------------------------------------------------------------------------
// Form Data Interface
// ---------------------------------------------------------------------------

interface AccountFormData {
  name: string;
  industry: string;
  website: string;
  phone: string;
  email: string;
  type: string;
  status: string;
  ownerId?: string;
  description: string;
  parentAccountId: string;
  paymentTerms: string;
  gstinNo: string;
  panNo: string;
  revenue: number;
  employees: number;
  partnerId: string;
  leadCategory: string;
  referencesDoc: string;
  bankStatementDoc: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactDesignation: string;
  contactDesignationOther: string;
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingCode: string;
  billingCountry: string;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingCode: string;
  shippingCountry: string;
  location: string;
  tag: string;
  accountType: string;
}

const EMPTY_FORM: AccountFormData = {
  name: '',
  industry: '',
  website: '',
  phone: '',
  email: '',
  type: '',
  status: 'Active',
  description: '',
  parentAccountId: '',
  paymentTerms: '',
  gstinNo: '',
  panNo: '',
  revenue: 0,
  employees: 0,
  partnerId: '',
  leadCategory: '',
  referencesDoc: '',
  bankStatementDoc: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  contactDesignation: '',
  contactDesignationOther: '',
  billingStreet: '',
  billingCity: '',
  billingState: '',
  billingCode: '',
  billingCountry: '',
  shippingStreet: '',
  shippingCity: '',
  shippingState: '',
  shippingCode: '',
  shippingCountry: '',
  location: '',
  tag: '',
  accountType: '',
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
// Styling constants
// ---------------------------------------------------------------------------

const inputClass = 'w-full px-4 py-2.5 rounded-xl border text-sm transition-all bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500 dark:bg-dark-100 dark:border-zinc-700 dark:text-white dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500';
const labelClass = 'block text-xs font-semibold mb-1.5 text-slate-600 dark:text-zinc-400';
const selectClass = inputClass;

const tabClass = (active: boolean) => `px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
  active
    ? 'border-brand-600 text-brand-600'
    : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300'
}`;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const InfoRow: React.FC<{ label: string; value?: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-dark-100">
    {icon && <span className="mt-0.5 flex-shrink-0 text-slate-400 dark:text-zinc-500">{icon}</span>}
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">{label}</p>
      <p className="text-sm text-slate-900 dark:text-white">{value || '-'}</p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AccountFormPage: React.FC = () => {
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
  const [partners, setPartners] = useState<Array<{ id: string; companyName: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [parentAccounts, setParentAccounts] = useState<Array<{ id: string; name: string }>>([]);

  // ---------------------------------------------------------------------------
  // State: Form (create / edit)
  // ---------------------------------------------------------------------------
  const [formData, setFormData] = useState<AccountFormData>({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'financial' | 'contact' | 'address'>('basic');

  // ---------------------------------------------------------------------------
  // State: Detail (view)
  // ---------------------------------------------------------------------------
  const [detailAccount, setDetailAccount] = useState<Account | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Related records (view)
  const [detailTab, setDetailTab] = useState<'contacts' | 'deals' | 'collections'>('contacts');
  const [detailContacts, setDetailContacts] = useState<Contact[]>([]);
  const [detailDeals, setDetailDeals] = useState<Deal[]>([]);
  const [detailCollections, setDetailCollections] = useState<any[]>([]);
  const [isRelatedLoading, setIsRelatedLoading] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  const handleBack = () => navigate('/accounts');

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchDropdownData = useCallback(async () => {
    try {
      const [partnersRes, usersRes, accountsRes] = await Promise.all([
        partnersApi.list({ limit: '100' }),
        adminApi.listUsers(),
        accountsApi.list({ limit: '1000', fields: 'id,name' }),
      ]);
      const pData = partnersRes?.data ?? partnersRes;
      setPartners(Array.isArray(pData) ? pData.map((p: any) => ({ id: p.id, companyName: p.companyName })) : []);
      const uData = (usersRes as any)?.data ?? usersRes;
      setUsers(Array.isArray(uData) ? uData.map((u: any) => ({ id: u.id, name: u.name })) : []);
      const aData = accountsRes?.data ?? accountsRes;
      setParentAccounts(Array.isArray(aData) ? aData.map((a: any) => ({ id: a.id, name: a.name })) : []);
    } catch {
      // non-critical
    }
  }, []);

  const fetchAccountForEdit = useCallback(async (accountId: string) => {
    setIsLoadingForm(true);
    try {
      const res = await accountsApi.getById(accountId);
      const full = res?.data ?? res;
      setFormData({
        name: full.name || '',
        industry: full.industry || '',
        website: full.website || '',
        phone: full.phone || '',
        email: full.email || '',
        type: full.type || '',
        status: full.status || 'Active',
        ownerId: full.ownerId,
        description: full.description || '',
        parentAccountId: full.parentAccountId || '',
        paymentTerms: full.paymentTerms || '',
        gstinNo: full.gstinNo || '',
        panNo: full.panNo || '',
        revenue: full.revenue || 0,
        employees: full.employees || 0,
        partnerId: full.partnerId || '',
        leadCategory: full.leadCategory || '',
        referencesDoc: full.referencesDoc || '',
        bankStatementDoc: full.bankStatementDoc || '',
        contactName: full.contactName || '',
        contactEmail: full.contactEmail || '',
        contactPhone: full.contactPhone || '',
        contactDesignation: full.contactDesignation || '',
        contactDesignationOther: full.contactDesignationOther || '',
        billingStreet: full.billingStreet || '',
        billingCity: full.billingCity || '',
        billingState: full.billingState || '',
        billingCode: full.billingCode || '',
        billingCountry: full.billingCountry || '',
        shippingStreet: full.shippingStreet || '',
        shippingCity: full.shippingCity || '',
        shippingState: full.shippingState || '',
        shippingCode: full.shippingCode || '',
        shippingCountry: full.shippingCountry || '',
        location: full.location || '',
        tag: full.tag || '',
        accountType: full.accountType || '',
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to load account');
    } finally {
      setIsLoadingForm(false);
    }
  }, []);

  const fetchAccountForView = useCallback(async (accountId: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await accountsApi.getById(accountId);
      const full = res?.data ?? res;
      setDetailAccount(full);
    } catch (err: any) {
      setFormError(err.message || 'Failed to load account');
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const fetchRelatedRecords = useCallback(async (accountId: string, accountName: string) => {
    setIsRelatedLoading(true);
    try {
      const [contactsRes, dealsRes, collectionsRes] = await Promise.all([
        accountsApi.getContacts(accountId),
        accountsApi.getDeals(accountId),
        salesApi.list({ search: accountName, limit: '100' }),
      ]);
      const contactsData = contactsRes?.data ?? contactsRes;
      setDetailContacts(Array.isArray(contactsData) ? contactsData : []);
      const dealsData = dealsRes?.data ?? dealsRes;
      setDetailDeals(Array.isArray(dealsData) ? dealsData : []);
      const entries = collectionsRes?.data ?? collectionsRes;
      setDetailCollections(Array.isArray(entries) ? entries : []);
    } catch {
      setDetailContacts([]);
      setDetailDeals([]);
      setDetailCollections([]);
    } finally {
      setIsRelatedLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (mode === 'create' || mode === 'edit') {
      fetchDropdownData();
    }
  }, [mode, fetchDropdownData]);

  useEffect(() => {
    if (mode === 'edit' && id) {
      fetchAccountForEdit(id);
    } else if (mode === 'view' && id) {
      fetchAccountForView(id);
    } else if (mode === 'create') {
      setFormData({ ...EMPTY_FORM });
      setFormError('');
      setActiveTab('basic');
    }
  }, [mode, id, fetchAccountForEdit, fetchAccountForView]);

  useEffect(() => {
    if (mode === 'view' && detailAccount?.id && detailAccount?.name) {
      fetchRelatedRecords(detailAccount.id, detailAccount.name);
    }
  }, [mode, detailAccount?.id, detailAccount?.name, fetchRelatedRecords]);

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file.name }));
    }
  };

  const copyBillingToShipping = () => {
    setFormData(prev => ({
      ...prev,
      shippingStreet: prev.billingStreet,
      shippingCity: prev.billingCity,
      shippingState: prev.billingState,
      shippingCode: prev.billingCode,
      shippingCountry: prev.billingCountry,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Account name is required');
      return;
    }

    if (mode === 'create' && !formData.contactName.trim()) {
      setFormError('Contact name is required when creating an account');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...formData, ownerId: formData.ownerId || user?.id };

      if (mode === 'edit' && id) {
        await accountsApi.update(id, payload);
      } else {
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
      navigate('/accounts');
    } catch (err: any) {
      setFormError(err.message || 'Failed to save account');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------

  const handleDelete = async () => {
    if (!id) return;
    try {
      await accountsApi.delete(id);
      navigate('/accounts');
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete account');
    }
  };

  // ---------------------------------------------------------------------------
  // Render: Page Header
  // ---------------------------------------------------------------------------

  const pageTitle = mode === 'create'
    ? 'New Account'
    : mode === 'edit'
      ? 'Edit Account'
      : detailAccount?.name || 'Account';

  const renderHeader = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-2 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-zinc-400" />
        </button>
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white">
            {pageTitle}
          </h1>
          {mode === 'view' && detailAccount?.industry && (
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              {detailAccount.industry}
            </p>
          )}
        </div>
      </div>

      {mode === 'view' && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            icon={<Edit2 className="w-4 h-4" />}
            onClick={() => navigate(`/accounts/edit/${id}`)}
            title="Edit"
          />
          {deleteConfirmId === id ? (
            <div className="flex items-center gap-1">
              <Button variant="danger" size="xs" onClick={handleDelete}>
                Confirm
              </Button>
              <Button variant="ghost" size="xs" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="xs"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => setDeleteConfirmId(id || null)}
              className="hover:text-red-600 dark:hover:text-red-400"
              title="Delete"
            />
          )}
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Form (Create / Edit)
  // ---------------------------------------------------------------------------

  const renderForm = () => {
    if (isLoadingForm) {
      return (
        <Card className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
          <span className="ml-3 text-sm text-slate-500 dark:text-zinc-400">Loading account...</span>
        </Card>
      );
    }

    return (
      <Card padding="none">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 dark:border-zinc-800">
          <button onClick={() => setActiveTab('basic')} className={tabClass(activeTab === 'basic')}>
            Basic Info
          </button>
          <button onClick={() => setActiveTab('financial')} className={tabClass(activeTab === 'financial')}>
            Financial & Legal
          </button>
          <button onClick={() => setActiveTab('contact')} className={tabClass(activeTab === 'contact')}>
            Contact Info
          </button>
          <button onClick={() => setActiveTab('address')} className={tabClass(activeTab === 'address')}>
            Address
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {formError && (
              <div className="p-3 rounded-xl flex items-center gap-2 text-sm bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            {/* ---- Tab 1: Basic Info ---- */}
            {activeTab === 'basic' && (
              <div className="space-y-5">
                {/* Description */}
                <div>
                  <label htmlFor="description" className={labelClass}>Description</label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Account description..."
                  />
                </div>

                {/* Account Information Section */}
                <div className="pt-4 border-t border-dashed border-[#e2e8f0] dark:border-[#1a2535]">
                  <h3 className="text-sm font-semibold mb-4 text-slate-900 dark:text-white">
                    Account Information
                  </h3>

                  <div className="space-y-4">
                    {/* Account Name */}
                    <div>
                      <label htmlFor="name" className={labelClass}>
                        Account Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          className={`${inputClass} pl-10`}
                          placeholder="Enter account name"
                          required
                        />
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                      </div>
                    </div>

                    {/* Row: Phone + Website */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="phone" className={labelClass}>Phone</label>
                        <div className="relative">
                          <input
                            id="phone"
                            name="phone"
                            type="text"
                            value={formData.phone}
                            onChange={handleChange}
                            className={`${inputClass} pl-10`}
                            placeholder="+91 XXXXX XXXXX"
                          />
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="website" className={labelClass}>Website</label>
                        <div className="relative">
                          <input
                            id="website"
                            name="website"
                            type="text"
                            value={formData.website}
                            onChange={handleChange}
                            className={`${inputClass} pl-10`}
                            placeholder="https://example.com"
                          />
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Row: Tag 1 + Tag 2 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="tag" className={labelClass}>Tag 1</label>
                        <select
                          id="tag"
                          name="tag"
                          value={formData.tag}
                          onChange={handleChange}
                          className={selectClass}
                        >
                          <option value="">-None-</option>
                          <option value="Digital Account">Digital Account</option>
                          <option value="Existing Account">Existing Account</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="type" className={labelClass}>Tag 2</label>
                        <select
                          id="type"
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                          className={selectClass}
                        >
                          <option value="">-None-</option>
                          {ACCOUNT_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row: Account Type + Parent Account */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="accountType" className={labelClass}>Account Type</label>
                        <select
                          id="accountType"
                          name="accountType"
                          value={formData.accountType}
                          onChange={handleChange}
                          className={selectClass}
                        >
                          <option value="">-None-</option>
                          <option value="Channel Partner">Channel Partner</option>
                          <option value="End Customer">End Customer</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="parentAccountId" className={labelClass}>Parent Account</label>
                        <select
                          id="parentAccountId"
                          name="parentAccountId"
                          value={formData.parentAccountId}
                          onChange={handleChange}
                          className={selectClass}
                        >
                          <option value="">-None-</option>
                          {parentAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row: Payment Terms */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="paymentTerms" className={labelClass}>Payment Terms</label>
                        <select
                          id="paymentTerms"
                          name="paymentTerms"
                          value={formData.paymentTerms}
                          onChange={handleChange}
                          className={selectClass}
                        >
                          <option value="">CDC</option>
                          <option value="Net 15">Net 15</option>
                          <option value="Net 30">Net 30</option>
                          <option value="Net 45">Net 45</option>
                          <option value="Net 60">Net 60</option>
                          <option value="Due on Receipt">Due on Receipt</option>
                          <option value="Advance Payment">Advance Payment</option>
                          <option value="COD">COD</option>
                        </select>
                      </div>
                    </div>

                    {/* Row: Industry + Owner */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="industry" className={labelClass}>
                          Company Industry <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="industry"
                          name="industry"
                          value={formData.industry}
                          onChange={handleChange}
                          className={selectClass}
                          required
                        >
                          <option value="">None</option>
                          {INDUSTRIES.map(ind => (
                            <option key={ind} value={ind}>{ind}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="ownerId" className={labelClass}>Account Owner</label>
                        <select
                          id="ownerId"
                          name="ownerId"
                          value={formData.ownerId || ''}
                          onChange={handleChange}
                          className={selectClass}
                        >
                          <option value="">Select Owner</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Other Info Section */}
                <div className="pt-4 border-t border-dashed border-[#e2e8f0] dark:border-[#1a2535]">
                  <h3 className="text-sm font-semibold mb-4 text-slate-900 dark:text-white">
                    Other Info
                  </h3>

                  <div className="space-y-4">
                    {/* References */}
                    <div>
                      <label className={labelClass}>References</label>
                      <div className="border rounded-xl p-4 border-slate-200 dark:border-zinc-700">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileChange(e, 'referencesDoc')}
                          className="text-sm"
                          id="referencesDoc"
                        />
                        {formData.referencesDoc && (
                          <p className="text-xs mt-1 text-slate-400 dark:text-zinc-500">
                            {formData.referencesDoc}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bank Statement */}
                    <div>
                      <label className={labelClass}>Bank Statement</label>
                      <div className="border rounded-xl p-4 border-slate-200 dark:border-zinc-700">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileChange(e, 'bankStatementDoc')}
                          className="text-sm"
                          id="bankStatementDoc"
                        />
                        {formData.bankStatementDoc && (
                          <p className="text-xs mt-1 text-slate-400 dark:text-zinc-500">
                            {formData.bankStatementDoc}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---- Tab 2: Financial & Legal ---- */}
            {activeTab === 'financial' && (
              <div className="space-y-5">
                {/* Row: PAN + GSTIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="panNo" className={labelClass}>PAN</label>
                    <div className="relative">
                      <input
                        id="panNo"
                        name="panNo"
                        type="text"
                        value={formData.panNo}
                        onChange={handleChange}
                        className={`${inputClass} pl-10`}
                        placeholder="ABCDE1234F"
                      />
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="gstinNo" className={labelClass}>GSTIN No</label>
                    <div className="relative">
                      <input
                        id="gstinNo"
                        name="gstinNo"
                        type="text"
                        value={formData.gstinNo}
                        onChange={handleChange}
                        className={`${inputClass} pl-10`}
                        placeholder="22AAAAA0000A1Z5"
                      />
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Row: Revenue + Employees */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="revenue" className={labelClass}>Revenue (INR)</label>
                    <div className="relative">
                      <input
                        id="revenue"
                        name="revenue"
                        type="number"
                        min="0"
                        value={formData.revenue || ''}
                        onChange={handleChange}
                        className={`${inputClass} pl-10`}
                        placeholder="0"
                      />
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="employees" className={labelClass}>Employees</label>
                    <div className="relative">
                      <input
                        id="employees"
                        name="employees"
                        type="number"
                        min="0"
                        value={formData.employees || ''}
                        onChange={handleChange}
                        className={`${inputClass} pl-10`}
                        placeholder="0"
                      />
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className={labelClass}>Location</label>
                  <div className="relative">
                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={formData.location}
                      onChange={handleChange}
                      className={`${inputClass} pl-10`}
                      placeholder="City, Country"
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {/* ---- Tab 3: Contact Info ---- */}
            {activeTab === 'contact' && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="contactName" className={labelClass}>
                    Name {mode === 'create' && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      id="contactName"
                      name="contactName"
                      type="text"
                      value={formData.contactName}
                      onChange={handleChange}
                      className={`${inputClass} pl-10`}
                      placeholder="Contact name"
                      required={mode === 'create'}
                    />
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="contactEmail" className={labelClass}>Email</label>
                  <div className="relative">
                    <input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      className={`${inputClass} pl-10`}
                      placeholder="contact@example.com"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="contactPhone" className={labelClass}>Contact Phone</label>
                  <div className="relative">
                    <input
                      id="contactPhone"
                      name="contactPhone"
                      type="text"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      className={`${inputClass} pl-10`}
                      placeholder="+91 XXXXX XXXXX"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="contactDesignation" className={labelClass}>Designation</label>
                  <select
                    id="contactDesignation"
                    name="contactDesignation"
                    value={formData.contactDesignation}
                    onChange={handleChange}
                    className={selectClass}
                  >
                    <option value="">-None-</option>
                    {DESIGNATIONS.map(des => (
                      <option key={des} value={des}>{des}</option>
                    ))}
                  </select>
                </div>

                {formData.contactDesignation === 'Other' && (
                  <div>
                    <label htmlFor="contactDesignationOther" className={labelClass}>
                      Please add other designation name
                    </label>
                    <input
                      id="contactDesignationOther"
                      name="contactDesignationOther"
                      type="text"
                      value={formData.contactDesignationOther}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter designation"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ---- Tab 4: Address ---- */}
            {activeTab === 'address' && (
              <div className="space-y-5">
                {/* Billing Address */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Billing Address
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="billingStreet" className={labelClass}>Billing Street</label>
                      <textarea
                        id="billingStreet"
                        name="billingStreet"
                        rows={2}
                        value={formData.billingStreet}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Street address"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="billingCity" className={labelClass}>Billing City</label>
                        <input
                          id="billingCity"
                          name="billingCity"
                          type="text"
                          value={formData.billingCity}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label htmlFor="billingState" className={labelClass}>Billing State</label>
                        <input
                          id="billingState"
                          name="billingState"
                          type="text"
                          value={formData.billingState}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="State"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="billingCode" className={labelClass}>Billing Code</label>
                        <input
                          id="billingCode"
                          name="billingCode"
                          type="text"
                          value={formData.billingCode}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="Postal code"
                        />
                      </div>
                      <div>
                        <label htmlFor="billingCountry" className={labelClass}>Billing Country</label>
                        <input
                          id="billingCountry"
                          name="billingCountry"
                          type="text"
                          value={formData.billingCountry}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="Country"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Copy Button */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={copyBillingToShipping}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Billing to Shipping
                  </button>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-white">
                    Shipping Address
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="shippingStreet" className={labelClass}>Shipping Street</label>
                      <textarea
                        id="shippingStreet"
                        name="shippingStreet"
                        rows={2}
                        value={formData.shippingStreet}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Street address"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="shippingCity" className={labelClass}>Shipping City</label>
                        <input
                          id="shippingCity"
                          name="shippingCity"
                          type="text"
                          value={formData.shippingCity}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label htmlFor="shippingState" className={labelClass}>Shipping State</label>
                        <input
                          id="shippingState"
                          name="shippingState"
                          type="text"
                          value={formData.shippingState}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="State"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="shippingCode" className={labelClass}>Shipping Code</label>
                        <input
                          id="shippingCode"
                          name="shippingCode"
                          type="text"
                          value={formData.shippingCode}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="Postal code"
                        />
                      </div>
                      <div>
                        <label htmlFor="shippingCountry" className={labelClass}>Shipping Country</label>
                        <input
                          id="shippingCountry"
                          name="shippingCountry"
                          type="text"
                          value={formData.shippingCountry}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="Country"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t bg-white border-slate-200 dark:bg-dark-50 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 disabled:opacity-50"
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
                <><CheckCircle className="w-4 h-4" /> {mode === 'edit' ? 'Update Account' : 'Create Account'}</>
              )}
            </button>
          </div>
        </form>
      </Card>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: View Mode
  // ---------------------------------------------------------------------------

  const renderView = () => {
    if (isLoadingDetail) {
      return (
        <Card className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
          <span className="ml-3 text-sm text-slate-500 dark:text-zinc-400">Loading account...</span>
        </Card>
      );
    }

    if (!detailAccount) {
      return (
        <Card className="flex items-center justify-center py-20">
          <AlertCircle className="w-6 h-6 text-slate-400 dark:text-zinc-500" />
          <span className="ml-3 text-sm text-slate-500 dark:text-zinc-400">Account not found</span>
        </Card>
      );
    }

    const account = detailAccount;

    return (
      <div className="space-y-6">
        {formError && (
          <Alert variant="error">{formError}</Alert>
        )}

        {/* Account Info Grid */}
        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <InfoRow label="Description" value={account.description} />
            </div>
          )}
        </Card>

        {/* Related Records Tabs */}
        <Card padding="none">
          {/* Tab bar */}
          <div className="flex items-center gap-1 px-6 border-b border-slate-200 dark:border-zinc-800">
            <button
              onClick={() => setDetailTab('contacts')}
              className={tabClass(detailTab === 'contacts')}
            >
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Contacts ({detailContacts.length})
              </span>
            </button>
            <button
              onClick={() => setDetailTab('deals')}
              className={tabClass(detailTab === 'deals')}
            >
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Deals ({detailDeals.length})
              </span>
            </button>
            <button
              onClick={() => setDetailTab('collections')}
              className={tabClass(detailTab === 'collections')}
            >
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                Collections ({detailCollections.length})
              </span>
            </button>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {isRelatedLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
              </div>
            ) : detailTab === 'contacts' ? (
              detailContacts.length === 0 ? (
                <p className="text-sm py-4 text-center text-slate-400 dark:text-zinc-600">
                  No contacts linked to this account
                </p>
              ) : (
                <div className="space-y-2">
                  {detailContacts.map((contact: any) => (
                    <div
                      key={contact.id}
                      onClick={() => navigate('/contacts')}
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
                    onClick={() => navigate('/contacts')}
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
                <div className="space-y-2">
                  {detailDeals.map((deal: any) => (
                    <div
                      key={deal.id}
                      onClick={() => navigate(`/deals/view/${deal.id}`)}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-colors border-slate-100 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-800/30"
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
                <div className="space-y-3">
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
                    <table className="premium-table text-xs w-full">
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
        </Card>

        {/* Timestamps */}
        <div className="flex items-center justify-end gap-4 text-[11px] text-slate-400 dark:text-zinc-600 px-2">
          {account.createdAt && <span>Created: {formatDate(account.createdAt)}</span>}
          {account.updatedAt && <span>Updated: {formatDate(account.updatedAt)}</span>}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {renderHeader()}
      {mode === 'view' ? renderView() : renderForm()}

    </div>
  );
};
