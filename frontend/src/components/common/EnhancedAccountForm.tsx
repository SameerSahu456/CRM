import React, { useState, useEffect } from 'react';
import {
  X, Building2, Phone, Mail, Globe, MapPin, Hash, IndianRupee,
  Users, Loader2, AlertCircle, CheckCircle, FileText,
  User as UserIcon, Copy, Briefcase
} from 'lucide-react';
import { Account } from '@/types';
import { Modal } from '@/components/ui';

// Form Data Interface
export interface EnhancedAccountFormData {
  // Basic Information
  name: string;
  industry: string;
  website: string;
  phone: string;
  email: string;
  type: string;
  status: string;
  ownerId?: string;

  // Description Information
  description: string;

  // Account Information
  parentAccountId: string;
  paymentTerms: string;

  // Financial & Legal
  gstinNo: string;
  panNo: string;
  revenue: number;
  employees: number;

  // Partner & Lead Info
  partnerId: string;
  leadCategory: string;

  // Documents
  referencesDoc: string;
  bankStatementDoc: string;

  // Contact Info
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactDesignation: string;
  contactDesignationOther: string;

  // Billing Address
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingCode: string;
  billingCountry: string;

  // Shipping Address
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingCode: string;
  shippingCountry: string;

  location: string;
  tag: string;
  accountType: string;
}

export const EMPTY_ENHANCED_FORM: EnhancedAccountFormData = {
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

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail',
  'Education', 'Real Estate', 'Telecom', 'Energy', 'Media', 'Government', 'Other'
];

const ACCOUNT_TYPES = ['Hunting', 'Farming', 'Cold'];
const DESIGNATIONS = ['CEO', 'CFO', 'CTO', 'Manager', 'Director', 'VP', 'Other'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EnhancedAccountFormData) => Promise<void>;
  editingAccount?: Account | null;
  isSubmitting: boolean;
  formError?: string;
  partners?: Array<{ id: string; companyName: string }>;
  accounts?: Array<{ id: string; name: string }>;
  users?: Array<{ id: string; name: string }>;
}

export const EnhancedAccountForm: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  editingAccount,
  isSubmitting,
  formError,
  partners = [],
  accounts = [],
  users = [],
}) => {
  const [formData, setFormData] = useState<EnhancedAccountFormData>(EMPTY_ENHANCED_FORM);
  const [activeTab, setActiveTab] = useState<'basic' | 'financial' | 'contact' | 'address'>('basic');

  useEffect(() => {
    if (editingAccount) {
      setFormData({
        name: editingAccount.name || '',
        industry: editingAccount.industry || '',
        website: editingAccount.website || '',
        phone: editingAccount.phone || '',
        email: editingAccount.email || '',
        type: editingAccount.type || '',
        status: editingAccount.status || 'Active',
        ownerId: editingAccount.ownerId,
        description: editingAccount.description || '',
        parentAccountId: editingAccount.parentAccountId || '',
        paymentTerms: editingAccount.paymentTerms || '',
        gstinNo: editingAccount.gstinNo || '',
        panNo: editingAccount.panNo || '',
        revenue: editingAccount.revenue || 0,
        employees: editingAccount.employees || 0,
        partnerId: editingAccount.partnerId || '',
        leadCategory: editingAccount.leadCategory || '',
        referencesDoc: editingAccount.referencesDoc || '',
        bankStatementDoc: editingAccount.bankStatementDoc || '',
        contactName: editingAccount.contactName || '',
        contactEmail: editingAccount.contactEmail || '',
        contactPhone: editingAccount.contactPhone || '',
        contactDesignation: editingAccount.contactDesignation || '',
        contactDesignationOther: editingAccount.contactDesignationOther || '',
        billingStreet: editingAccount.billingStreet || '',
        billingCity: editingAccount.billingCity || '',
        billingState: editingAccount.billingState || '',
        billingCode: editingAccount.billingCode || '',
        billingCountry: editingAccount.billingCountry || '',
        shippingStreet: editingAccount.shippingStreet || '',
        shippingCity: editingAccount.shippingCity || '',
        shippingState: editingAccount.shippingState || '',
        shippingCode: editingAccount.shippingCode || '',
        shippingCountry: editingAccount.shippingCountry || '',
        location: editingAccount.location || '',
        tag: editingAccount.tag || '',
        accountType: editingAccount.accountType || '',
      });
    } else {
      setFormData(EMPTY_ENHANCED_FORM);
    }
  }, [editingAccount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      // In production, upload to cloud storage and get URL
      // For now, just store the filename
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
    await onSubmit(formData);
  };

  if (!isOpen) return null;

  // Styles
  const inputClass = 'w-full px-4 py-2.5 rounded-xl border text-sm transition-all bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500 dark:bg-dark-100 dark:border-zinc-700 dark:text-white dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

  const labelClass = 'block text-xs font-semibold mb-1.5 text-slate-600 dark:text-zinc-400';

  const selectClass = inputClass;

  const tabClass = (active: boolean) => `px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
    active
      ? 'border-brand-600 text-brand-600'
      : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300'
  }`;

  return (
    <Modal open={isOpen} onClose={onClose} size="full" raw className="max-w-5xl">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b bg-white border-gray-100 dark:bg-zinc-900 dark:border-zinc-800">
        <h2 className="text-lg font-semibold font-display text-gray-900 dark:text-white">
          {editingAccount ? 'Edit Account' : 'New Account'}
        </h2>
        <button
          onClick={onClose}
          className="group p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <X className="w-5 h-5 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white transition-colors" />
        </button>
      </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex items-center gap-1 px-6 border-b border-slate-200 dark:border-zinc-800">
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {formError && (
              <div className="p-3 rounded-xl flex items-center gap-2 text-sm bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            {/* Basic Info Tab */}
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
                          {accounts.map(acc => (
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
                          {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
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

            {/* Financial & Legal Tab */}
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

            {/* Contact Info Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="contactName" className={labelClass}>Name {!editingAccount && <span className="text-red-500">*</span>}</label>
                  <div className="relative">
                    <input
                      id="contactName"
                      name="contactName"
                      type="text"
                      value={formData.contactName}
                      onChange={handleChange}
                      className={`${inputClass} pl-10`}
                      placeholder="Contact name"
                      required={!editingAccount}
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

            {/* Address Tab */}
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

          {/* Footer - sticky at bottom */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t bg-white border-slate-200 dark:bg-dark-50 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
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
                <><CheckCircle className="w-4 h-4" /> {editingAccount ? 'Update Account' : 'Create Account'}</>
              )}
            </button>
          </div>
        </form>
    </Modal>
  );
};
