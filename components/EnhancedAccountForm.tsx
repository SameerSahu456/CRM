import React, { useState, useEffect } from 'react';
import {
  X, Building2, Phone, Mail, Globe, MapPin, Hash, IndianRupee,
  Users, Loader2, AlertCircle, CheckCircle, FileText, Upload,
  User as UserIcon, Copy, Briefcase
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Account } from '../types';

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
  groupName: string;

  // Account Information
  parentAccountId: string;
  endcustomerCategory: string;
  paymentTerms: string;
  productsSellingToThem: string;
  productsTheySell: string;

  // Financial & Legal
  gstinNo: string;
  panNo: string;
  revenue: number;
  employees: number;

  // Partner & Lead Info
  partnerId: string;
  leadCategory: string;
  newLeads: number;

  // Documents
  accountImage: string;
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
  healthScore: number;
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
  groupName: '',
  parentAccountId: '',
  endcustomerCategory: '',
  paymentTerms: '',
  productsSellingToThem: '',
  productsTheySell: '',
  gstinNo: '',
  panNo: '',
  revenue: 0,
  employees: 0,
  partnerId: '',
  leadCategory: '',
  newLeads: 0,
  accountImage: '',
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
  healthScore: 100,
};

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail',
  'Education', 'Real Estate', 'Telecom', 'Energy', 'Media', 'Government', 'Other'
];

const ACCOUNT_TYPES = ['Customer', 'Prospect', 'Partner', 'Vendor', 'Competitor'];
const ENDCUSTOMER_CATEGORIES = ['Enterprise', 'SMB', 'Startup', 'Government', 'Education'];
const LEAD_CATEGORIES = ['Hot', 'Warm', 'Cold'];
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
  const { isDark } = useTheme();
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
        groupName: editingAccount.groupName || '',
        parentAccountId: editingAccount.parentAccountId || '',
        endcustomerCategory: editingAccount.endcustomerCategory || '',
        paymentTerms: editingAccount.paymentTerms || '',
        productsSellingToThem: editingAccount.productsSellingToThem || '',
        productsTheySell: editingAccount.productsTheySell || '',
        gstinNo: editingAccount.gstinNo || '',
        panNo: editingAccount.panNo || '',
        revenue: editingAccount.revenue || 0,
        employees: editingAccount.employees || 0,
        partnerId: editingAccount.partnerId || '',
        leadCategory: editingAccount.leadCategory || '',
        newLeads: editingAccount.newLeads || 0,
        accountImage: editingAccount.accountImage || '',
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
        healthScore: editingAccount.healthScore || 100,
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
  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${
    isDark
      ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
  } focus:outline-none focus:ring-1 focus:ring-brand-500`;

  const labelClass = `block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`;

  const selectClass = inputClass;

  const tabClass = (active: boolean) => `px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
    active
      ? 'border-brand-600 text-brand-600'
      : isDark
        ? 'border-transparent text-zinc-500 hover:text-zinc-300'
        : 'border-transparent text-slate-400 hover:text-slate-600'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={onClose} />
      <div className={`relative w-full max-w-5xl max-h-[95vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
        isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
      }`}>
        {/* Header */}
        <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {editingAccount ? 'Edit Account' : 'New Account'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex-shrink-0 flex items-center gap-1 px-6 border-b ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
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
              <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-5">
                {/* Account Image */}
                <div>
                  <label className={labelClass}>Account Image</label>
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center ${
                    isDark ? 'border-zinc-700 hover:border-zinc-600' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'accountImage')}
                      className="hidden"
                      id="accountImage"
                    />
                    <label htmlFor="accountImage" className="cursor-pointer text-sm text-brand-600 hover:text-brand-700">
                      Choose file
                    </label>
                    {formData.accountImage && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        {formData.accountImage}
                      </p>
                    )}
                  </div>
                </div>

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

                {/* Group */}
                <div>
                  <label htmlFor="groupName" className={labelClass}>Group</label>
                  <input
                    id="groupName"
                    name="groupName"
                    type="text"
                    value={formData.groupName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Group name"
                  />
                </div>

                {/* Account Information Section */}
                <div className="pt-4 border-t border-dashed" style={{ borderColor: isDark ? '#27272a' : '#e2e8f0' }}>
                  <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Account Information
                  </h3>

                  <div className="space-y-4">
                    {/* Account Name */}
                    <div>
                      <label htmlFor="name" className={labelClass}>
                        Account Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
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
                      </div>
                    </div>

                    {/* Row: Phone + Website */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="phone" className={labelClass}>Phone</label>
                        <div className="relative">
                          <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                          <input
                            id="phone"
                            name="phone"
                            type="text"
                            value={formData.phone}
                            onChange={handleChange}
                            className={`${inputClass} pl-10`}
                            placeholder="+91 XXXXX XXXXX"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="website" className={labelClass}>Website</label>
                        <div className="relative">
                          <Globe className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                          <input
                            id="website"
                            name="website"
                            type="text"
                            value={formData.website}
                            onChange={handleChange}
                            className={`${inputClass} pl-10`}
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row: Parent Account + Account Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <div>
                        <label htmlFor="type" className={labelClass}>Account Type</label>
                        <select
                          id="type"
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                          className={selectClass}
                        >
                          <option value="">-None-</option>
                          {ACCOUNT_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row: Endcustomer Category + Payment Terms */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="endcustomerCategory" className={labelClass}>Endcustomer Accounts Category</label>
                        <select
                          id="endcustomerCategory"
                          name="endcustomerCategory"
                          value={formData.endcustomerCategory}
                          onChange={handleChange}
                          className={selectClass}
                        >
                          <option value="">-None-</option>
                          {ENDCUSTOMER_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
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

                    {/* Products Section */}
                    <div>
                      <label htmlFor="productsSellingToThem" className={labelClass}>Products we are selling them</label>
                      <textarea
                        id="productsSellingToThem"
                        name="productsSellingToThem"
                        rows={2}
                        value={formData.productsSellingToThem}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="List products..."
                      />
                    </div>

                    <div>
                      <label htmlFor="productsTheySell" className={labelClass}>Products they are selling</label>
                      <textarea
                        id="productsTheySell"
                        name="productsTheySell"
                        rows={2}
                        value={formData.productsTheySell}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="List products..."
                      />
                    </div>

                    {/* Row: Status + Partner */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="status" className={labelClass}>Account Status</label>
                        <select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className={selectClass}
                        >
                          <option value="">-None-</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="partnerId" className={labelClass}>Partner</label>
                        <select
                          id="partnerId"
                          name="partnerId"
                          value={formData.partnerId}
                          onChange={handleChange}
                          className={selectClass}
                        >
                          <option value="">Select Partner</option>
                          {partners.map(partner => (
                            <option key={partner.id} value={partner.id}>{partner.companyName}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row: Lead Category + New Leads */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="leadCategory" className={labelClass}>Lead Category</label>
                        <select
                          id="leadCategory"
                          name="leadCategory"
                          value={formData.leadCategory}
                          onChange={handleChange}
                          className={selectClass}
                        >
                          <option value="">-None-</option>
                          {LEAD_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="newLeads" className={labelClass}>New Leads</label>
                        <input
                          id="newLeads"
                          name="newLeads"
                          type="number"
                          min="0"
                          value={formData.newLeads}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Other Info Section */}
                <div className="pt-4 border-t border-dashed" style={{ borderColor: isDark ? '#27272a' : '#e2e8f0' }}>
                  <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Other Info
                  </h3>

                  <div className="space-y-4">
                    {/* References */}
                    <div>
                      <label className={labelClass}>References</label>
                      <div className={`border rounded-xl p-4 ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileChange(e, 'referencesDoc')}
                          className="text-sm"
                          id="referencesDoc"
                        />
                        {formData.referencesDoc && (
                          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                            {formData.referencesDoc}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bank Statement */}
                    <div>
                      <label className={labelClass}>Bank Statement</label>
                      <div className={`border rounded-xl p-4 ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileChange(e, 'bankStatementDoc')}
                          className="text-sm"
                          id="bankStatementDoc"
                        />
                        {formData.bankStatementDoc && (
                          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
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
                      <Hash className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                      <input
                        id="panNo"
                        name="panNo"
                        type="text"
                        value={formData.panNo}
                        onChange={handleChange}
                        className={`${inputClass} pl-10`}
                        placeholder="ABCDE1234F"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="gstinNo" className={labelClass}>GSTIN No</label>
                    <div className="relative">
                      <Hash className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                      <input
                        id="gstinNo"
                        name="gstinNo"
                        type="text"
                        value={formData.gstinNo}
                        onChange={handleChange}
                        className={`${inputClass} pl-10`}
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                  </div>
                </div>

                {/* Row: Revenue + Employees */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="revenue" className={labelClass}>Revenue (INR)</label>
                    <div className="relative">
                      <IndianRupee className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
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
                    </div>
                  </div>
                  <div>
                    <label htmlFor="employees" className={labelClass}>Employees</label>
                    <div className="relative">
                      <Users className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
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
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className={labelClass}>Location</label>
                  <div className="relative">
                    <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={formData.location}
                      onChange={handleChange}
                      className={`${inputClass} pl-10`}
                      placeholder="City, Country"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contact Info Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="contactName" className={labelClass}>Name</label>
                  <div className="relative">
                    <UserIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                    <input
                      id="contactName"
                      name="contactName"
                      type="text"
                      value={formData.contactName}
                      onChange={handleChange}
                      className={`${inputClass} pl-10`}
                      placeholder="Contact name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contactEmail" className={labelClass}>Email</label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                    <input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      className={`${inputClass} pl-10`}
                      placeholder="contact@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contactPhone" className={labelClass}>Contact Phone</label>
                  <div className="relative">
                    <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                    <input
                      id="contactPhone"
                      name="contactPhone"
                      type="text"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      className={`${inputClass} pl-10`}
                      placeholder="+91 XXXXX XXXXX"
                    />
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
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isDark
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    Copy Billing to Shipping
                  </button>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
          <div className={`sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t ${
            isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <button
              type="button"
              onClick={onClose}
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
                <><CheckCircle className="w-4 h-4" /> {editingAccount ? 'Update Account' : 'Create Account'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
