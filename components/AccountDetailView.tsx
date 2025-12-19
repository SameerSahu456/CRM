import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Building2, Globe, MapPin, Phone, Mail, Users, DollarSign, TrendingUp,
  Briefcase, FileText, Clock, Edit3, Plus, X, Loader2, AlertCircle, ExternalLink,
  History, Tag, Hash, CreditCard, Package, UserCircle, MapPinned, Send, Calendar,
  CheckCircle2, PhoneCall, MessageSquare, FileUp, Trash2, MoreVertical, ChevronRight
} from 'lucide-react';
import { Account, Contact, Deal } from '../types';
import { accountsApi, contactsApi, dealsApi } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface AccountDetailViewProps {
  accountId: string;
  onBack: () => void;
}

interface AccountActivity {
  id: string;
  activityType: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: string;
}

interface AccountNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

// Card component for sections
const DetailCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon, children, className = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'} ${className}`}>
      <div className={`px-4 py-3 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'} flex items-center gap-2`}>
        <span className="text-brand-600">{icon}</span>
        <h3 className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
};

// Field component for displaying label-value pairs
const Field: React.FC<{
  label: string;
  value: React.ReactNode;
  className?: string;
}> = ({ label, value, className = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={className}>
      <label className={`text-xs font-medium ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{label}</label>
      <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
        {value || <span className={isDark ? 'text-zinc-600' : 'text-slate-400'}>-</span>}
      </p>
    </div>
  );
};

export const AccountDetailView: React.FC<AccountDetailViewProps> = ({ accountId, onBack }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline'>('overview');

  // Related data
  const [relatedContacts, setRelatedContacts] = useState<Contact[]>([]);
  const [relatedDeals, setRelatedDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<AccountActivity[]>([]);
  const [notes, setNotes] = useState<AccountNote[]>([]);

  // Modal states
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Account>>({});

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        setLoading(true);
        const [accountData, allContacts, allDeals] = await Promise.all([
          accountsApi.getById(accountId),
          contactsApi.getAll(),
          dealsApi.getAll()
        ]);

        setAccount(accountData as Account);
        setEditForm(accountData as Account);

        // Filter related contacts
        const contacts = (allContacts as Contact[]).filter(
          c => c.accountId === accountId || c.accountName === (accountData as Account).name
        );
        setRelatedContacts(contacts);

        // Filter related deals
        const deals = (allDeals as Deal[]).filter(
          d => d.accountId === accountId || d.company === (accountData as Account).name
        );
        setRelatedDeals(deals);

        // Mock activities for now
        setActivities([
          { id: '1', activityType: 'note_added', title: 'Note added', description: 'Initial account setup completed', createdBy: 'Sarah Jenkins', createdAt: new Date().toISOString() },
          { id: '2', activityType: 'call_logged', title: 'Call logged', description: 'Introduction call with decision maker', createdBy: 'Michael Chen', createdAt: new Date(Date.now() - 86400000).toISOString() },
        ]);

        setNotes([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch account');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [accountId]);

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const note: AccountNote = {
      id: Date.now().toString(),
      content: newNote,
      createdBy: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      createdAt: new Date().toISOString(),
    };
    setNotes([note, ...notes]);
    setNewNote('');
    setShowNoteModal(false);

    // Add to activities
    setActivities([{
      id: Date.now().toString(),
      activityType: 'note_added',
      title: 'Note added',
      description: newNote.substring(0, 100),
      createdBy: note.createdBy,
      createdAt: note.createdAt,
    }, ...activities]);
  };

  const handleSaveAccount = async () => {
    if (!account) return;
    try {
      await accountsApi.update(accountId, editForm);
      setAccount({ ...account, ...editForm });
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update account:', err);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call_logged': return <PhoneCall size={14} className="text-blue-500" />;
      case 'call_scheduled': return <Calendar size={14} className="text-purple-500" />;
      case 'email_sent': return <Send size={14} className="text-green-500" />;
      case 'note_added': return <MessageSquare size={14} className="text-yellow-500" />;
      case 'deal_created': return <Briefcase size={14} className="text-orange-500" />;
      case 'status_changed': return <CheckCircle2 size={14} className="text-teal-500" />;
      default: return <Clock size={14} className="text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <div className={`p-8 flex items-center justify-center min-h-[400px] ${isDark ? 'bg-zinc-950' : ''}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className={isDark ? 'text-zinc-500' : 'text-slate-500'}>Loading account...</p>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className={`p-8 ${isDark ? 'bg-zinc-950' : ''}`}>
        <div className={`rounded-xl p-6 text-center ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
          <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-red-300' : 'text-red-800'}`}>Failed to load account</h3>
          <p className={`mb-4 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-zinc-950' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 border-b ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
        <div className="px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'}`}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border overflow-hidden ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-100 border-slate-200'}`}>
                  {account.logo ? (
                    <img src={account.logo} alt={account.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className={`w-6 h-6 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  )}
                </div>
                <div>
                  <h1 className={`text-xl font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{account.name}</h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      account.type === 'Customer' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      account.type === 'Prospect' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {account.type}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      account.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {account.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  isDark ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Edit3 size={16} /> Edit
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium text-sm hover:bg-brand-700 transition-colors">
                <Mail size={16} /> Send Email
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-brand-600 text-white'
                  : isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'timeline'
                  ? 'bg-brand-600 text-white'
                  : isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-8 py-6">
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`rounded-xl p-4 text-center ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-slate-200'}`}>
                  <DollarSign className="w-6 h-6 mx-auto text-green-500 mb-2" />
                  <p className={`text-lg font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>${(account.revenue / 1000000).toFixed(1)}M</p>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Annual Revenue</p>
                </div>
                <div className={`rounded-xl p-4 text-center ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-slate-200'}`}>
                  <Users className="w-6 h-6 mx-auto text-blue-500 mb-2" />
                  <p className={`text-lg font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{account.employees}</p>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Employees</p>
                </div>
                <div className={`rounded-xl p-4 text-center ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-slate-200'}`}>
                  <TrendingUp className="w-6 h-6 mx-auto text-purple-500 mb-2" />
                  <p className={`text-lg font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{account.healthScore}%</p>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Health Score</p>
                </div>
                <div className={`rounded-xl p-4 text-center ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-slate-200'}`}>
                  <Briefcase className="w-6 h-6 mx-auto text-orange-500 mb-2" />
                  <p className={`text-lg font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{relatedDeals.length}</p>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Open Deals</p>
                </div>
              </div>

              {/* Description Information */}
              <DetailCard title="Description Information" icon={<FileText size={16} />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Description" value={account.description} className="md:col-span-2" />
                  <Field label="Group" value={account.group} />
                </div>
              </DetailCard>

              {/* Account Information */}
              <DetailCard title="Account Information" icon={<Building2 size={16} />}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="Account Name" value={account.name} />
                  <Field label="Phone" value={account.phone} />
                  <Field label="Website" value={
                    account.website && (
                      <a href={`https://${account.website}`} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline flex items-center gap-1">
                        {account.website} <ExternalLink size={12} />
                      </a>
                    )
                  } />
                  <Field label="Parent Account" value={account.parentAccount} />
                  <Field label="Account Type" value={account.accountType || account.type} />
                  <Field label="Endcustomer Accounts Category" value={account.endcustomerAccountsCategory} />
                  <Field label="Payment Terms" value={account.paymentTerms} />
                  <Field label="Company Industry" value={account.companyIndustry || account.industry} />
                  <Field label="Products We Are Selling Them" value={account.productsWeSelling} />
                  <Field label="Products They Are Selling" value={account.productsTheySelling} />
                  <Field label="Account Owner" value={account.accountOwner || account.owner} />
                  <Field label="PAN" value={account.panNo} />
                  <Field label="GSTIN No" value={account.gstinNo} />
                  <Field label="Account Status" value={account.accountStatus || account.status} />
                  <Field label="Partner" value={account.partner} />
                  <Field label="Lead Category" value={account.leadCategory} />
                  <Field label="New Leads" value={account.newLeads?.toString()} />
                  <Field label="Created By" value={account.createdBy} />
                  <Field label="Modified By" value={account.modifiedBy} />
                </div>
              </DetailCard>

              {/* Other Info */}
              <DetailCard title="Other Info" icon={<Hash size={16} />}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="References" value={account.references} />
                  <Field label="Bank Statement" value={account.bankStatement} />
                  <Field label="Documents" value={account.documents} />
                </div>
              </DetailCard>

              {/* Contact Info */}
              <DetailCard title="Contact Info" icon={<UserCircle size={16} />}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="Name" value={account.contactName} />
                  <Field label="Email" value={account.contactEmail} />
                  <Field label="Contact Phone" value={account.contactPhone || account.contactMobile} />
                  <Field label="Designation" value={account.contactDesignation} />
                  <Field label="Others" value={account.contactOthers} />
                  <Field label="Other Designation Name" value={account.otherDesignationName} />
                </div>
              </DetailCard>

              {/* Address Information */}
              <DetailCard title="Address Information" icon={<MapPinned size={16} />}>
                <div className="mb-4">
                  <Field label="Locate Map" value={account.locateMap} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wide mb-3 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Billing Address</h4>
                    <div className="space-y-3">
                      <Field label="Street" value={account.billingAddress?.street} />
                      <Field label="City" value={account.billingAddress?.city} />
                      <Field label="State" value={account.billingAddress?.state} />
                      <Field label="Code" value={account.billingAddress?.zipCode} />
                      <Field label="Country" value={account.billingAddress?.country} />
                    </div>
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wide mb-3 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Shipping Address</h4>
                    <div className="space-y-3">
                      <Field label="Street" value={account.shippingAddress?.street} />
                      <Field label="City" value={account.shippingAddress?.city} />
                      <Field label="State" value={account.shippingAddress?.state} />
                      <Field label="Code" value={account.shippingAddress?.zipCode} />
                      <Field label="Country" value={account.shippingAddress?.country} />
                    </div>
                  </div>
                </div>
              </DetailCard>
            </div>

            {/* Right Column - Related Data */}
            <div className="space-y-6">
              {/* Notes */}
              <DetailCard title="Notes" icon={<MessageSquare size={16} />}>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowNoteModal(true)}
                    className={`w-full py-2 border-2 border-dashed rounded-lg text-sm font-medium transition-all ${
                      isDark ? 'border-zinc-700 text-zinc-500 hover:border-brand-500 hover:text-brand-400' : 'border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600'
                    }`}
                  >
                    + Add Note
                  </button>
                  {notes.length === 0 ? (
                    <p className={`text-sm text-center py-4 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>No notes yet</p>
                  ) : (
                    notes.map(note => (
                      <div key={note.id} className={`p-3 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-slate-50'}`}>
                        <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{note.content}</p>
                        <p className={`text-xs mt-2 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                          {note.createdBy} • {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </DetailCard>

              {/* Related Contacts */}
              <DetailCard title={`Contacts (${relatedContacts.length})`} icon={<Users size={16} />}>
                <div className="space-y-2">
                  {relatedContacts.length === 0 ? (
                    <p className={`text-sm text-center py-4 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>No contacts linked</p>
                  ) : (
                    relatedContacts.slice(0, 5).map(contact => (
                      <div key={contact.id} className={`flex items-center gap-3 p-2 rounded-lg ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-50'} transition-colors cursor-pointer`}>
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                          {contact.firstName?.[0]}{contact.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
                            {contact.firstName} {contact.lastName}
                          </p>
                          <p className={`text-xs truncate ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{contact.jobTitle}</p>
                        </div>
                        <ChevronRight size={14} className={isDark ? 'text-zinc-600' : 'text-slate-400'} />
                      </div>
                    ))
                  )}
                </div>
              </DetailCard>

              {/* Related Deals */}
              <DetailCard title={`Deals (${relatedDeals.length})`} icon={<Briefcase size={16} />}>
                <div className="space-y-2">
                  {relatedDeals.length === 0 ? (
                    <p className={`text-sm text-center py-4 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>No deals linked</p>
                  ) : (
                    relatedDeals.slice(0, 5).map(deal => (
                      <div key={deal.id} className={`flex items-center gap-3 p-2 rounded-lg ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-50'} transition-colors cursor-pointer`}>
                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                          <DollarSign size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
                            {deal.title}
                          </p>
                          <p className={`text-xs truncate ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                            ${deal.value?.toLocaleString()} • {deal.stage}
                          </p>
                        </div>
                        <ChevronRight size={14} className={isDark ? 'text-zinc-600' : 'text-slate-400'} />
                      </div>
                    ))
                  )}
                </div>
              </DetailCard>

              {/* Emails / Drafts */}
              <DetailCard title="Emails" icon={<Mail size={16} />}>
                <p className={`text-sm text-center py-4 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>No emails yet</p>
              </DetailCard>
            </div>
          </div>
        ) : (
          /* Timeline Tab */
          <div className="max-w-3xl">
            <DetailCard title="Activity Timeline" icon={<History size={16} />}>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className={`text-sm text-center py-8 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>No activities recorded yet</p>
                ) : (
                  activities.map((activity, index) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                          {getActivityIcon(activity.activityType)}
                        </div>
                        {index < activities.length - 1 && (
                          <div className={`w-0.5 flex-1 mt-2 ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <p className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>{activity.title}</p>
                        {activity.description && (
                          <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{activity.description}</p>
                        )}
                        <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                          {activity.createdBy} • {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DetailCard>
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNoteModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-lg ${isDark ? 'bg-zinc-900' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <h2 className={`text-lg font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Add Note</h2>
              <button onClick={() => setShowNoteModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'}`}>
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Write your note here..."
                rows={4}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200 placeholder-zinc-500' : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
            </div>
            <div className={`p-4 border-t flex justify-end gap-3 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <button
                onClick={() => setShowNoteModal(false)}
                className={`px-4 py-2 rounded-lg font-medium ${isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowEditModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-4xl my-8 ${isDark ? 'bg-zinc-900' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className={`p-4 border-b flex justify-between items-center sticky top-0 ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-slate-100 bg-white'}`}>
              <h2 className={`text-lg font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Edit Account</h2>
              <button onClick={() => setShowEditModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'}`}>
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div>
                <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Account Name *</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Phone</label>
                    <input
                      type="text"
                      value={editForm.phone || ''}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Email</label>
                    <input
                      type="email"
                      value={editForm.email || ''}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Website</label>
                    <input
                      type="text"
                      value={editForm.website || ''}
                      onChange={e => setEditForm({ ...editForm, website: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Industry</label>
                    <input
                      type="text"
                      value={editForm.industry || ''}
                      onChange={e => setEditForm({ ...editForm, industry: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Payment Terms</label>
                    <select
                      value={editForm.paymentTerms || ''}
                      onChange={e => setEditForm({ ...editForm, paymentTerms: e.target.value as Account['paymentTerms'] })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                      }`}
                    >
                      <option value="">Select...</option>
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
              </div>

              {/* Tax Info */}
              <div>
                <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Tax & Legal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>PAN No</label>
                    <input
                      type="text"
                      value={editForm.panNo || ''}
                      onChange={e => setEditForm({ ...editForm, panNo: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>GSTIN No</label>
                    <input
                      type="text"
                      value={editForm.gstinNo || ''}
                      onChange={e => setEditForm({ ...editForm, gstinNo: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Contact Name</label>
                    <input
                      type="text"
                      value={editForm.contactName || ''}
                      onChange={e => setEditForm({ ...editForm, contactName: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Contact Email</label>
                    <input
                      type="email"
                      value={editForm.contactEmail || ''}
                      onChange={e => setEditForm({ ...editForm, contactEmail: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Contact Phone</label>
                    <input
                      type="text"
                      value={editForm.contactPhone || ''}
                      onChange={e => setEditForm({ ...editForm, contactPhone: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Designation</label>
                    <input
                      type="text"
                      value={editForm.contactDesignation || ''}
                      onChange={e => setEditForm({ ...editForm, contactDesignation: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Description</h3>
                <textarea
                  value={editForm.description || ''}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-200'
                  }`}
                />
              </div>
            </div>
            <div className={`p-4 border-t flex justify-end gap-3 sticky bottom-0 ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-slate-100 bg-white'}`}>
              <button
                onClick={() => setShowEditModal(false)}
                className={`px-4 py-2 rounded-lg font-medium ${isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAccount}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
