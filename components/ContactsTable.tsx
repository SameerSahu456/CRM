import React, { useState, useEffect } from 'react';
import { Filter, Download, MoreVertical, Mail, Phone, Plus, Search, Building2, Linkedin, X, User, Loader2, AlertCircle, Edit2, Trash2, Calendar, ExternalLink } from 'lucide-react';
import { Contact } from '../types';
import { contactsApi } from '../services/api';
import { useNavigation } from '../contexts/NavigationContext';
import { ViewToggle, ViewMode } from './ViewToggle';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const getTypeColor = (type: string, isDark: boolean) => {
  const colors: Record<string, string> = {
    'Customer': isDark ? 'bg-green-900/50 text-green-400 border-green-700' : 'bg-green-50 text-green-700 border-green-200',
    'Prospect': isDark ? 'bg-blue-900/50 text-blue-400 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200',
    'Partner': isDark ? 'bg-purple-900/50 text-purple-400 border-purple-700' : 'bg-purple-50 text-purple-700 border-purple-200',
    'Vendor': isDark ? 'bg-orange-900/50 text-orange-400 border-orange-700' : 'bg-orange-50 text-orange-700 border-orange-200',
  };
  return colors[type] || (isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-slate-50 text-slate-700 border-slate-200');
};

// Mock contact data for offline/development mode
const MOCK_CONTACTS: Contact[] = [
  {
    id: 'contact-1',
    firstName: 'Jennifer',
    lastName: 'Thompson',
    email: 'j.thompson@acmecorp.com',
    phone: '+1 (555) 111-2222',
    mobile: '+1 (555) 111-3333',
    jobTitle: 'VP of Operations',
    department: 'Operations',
    accountId: 'acc-1',
    accountName: 'Acme Corporation',
    type: 'Customer',
    status: 'Active',
    avatar: '',
    lastContacted: '2024-12-18T10:00:00Z',
    createdAt: '2024-03-15T09:00:00Z',
    owner: 'Sarah Jenkins',
    tags: ['Decision Maker', 'VIP'],
    notes: 'Key decision maker for enterprise deals',
    preferredContact: 'Email',
  },
  {
    id: 'contact-2',
    firstName: 'David',
    lastName: 'Lee',
    email: 'd.lee@techstart.io',
    phone: '+1 (555) 222-3333',
    mobile: '+1 (555) 222-4444',
    jobTitle: 'CEO',
    department: 'Executive',
    accountId: 'acc-2',
    accountName: 'TechStart Innovation',
    type: 'Prospect',
    status: 'Active',
    avatar: '',
    lastContacted: '2024-12-17T14:00:00Z',
    createdAt: '2024-08-22T11:00:00Z',
    owner: 'Michael Chen',
    tags: ['Founder', 'Tech'],
    notes: 'Interested in CRM solutions',
    preferredContact: 'Phone',
  },
  {
    id: 'contact-3',
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@globalindustries.com',
    phone: '+91 22 3456 7890',
    mobile: '+91 98765 43210',
    jobTitle: 'Procurement Manager',
    department: 'Procurement',
    accountId: 'acc-3',
    accountName: 'Global Industries Ltd',
    type: 'Customer',
    status: 'Active',
    avatar: '',
    lastContacted: '2024-12-16T08:00:00Z',
    createdAt: '2024-04-10T10:00:00Z',
    owner: 'Sarah Jenkins',
    tags: ['Procurement', 'Enterprise'],
    notes: 'Handles all vendor relationships',
    preferredContact: 'Email',
  },
  {
    id: 'contact-4',
    firstName: 'Mark',
    lastName: 'Anderson',
    email: 'mark.a@printmaster.in',
    phone: '+91 11 5678 9012',
    mobile: '+91 87654 32109',
    jobTitle: 'Operations Director',
    department: 'Operations',
    accountId: 'acc-4',
    accountName: 'PrintMaster Solutions',
    type: 'Customer',
    status: 'Active',
    avatar: '',
    lastContacted: '2024-12-15T12:00:00Z',
    createdAt: '2024-05-20T09:00:00Z',
    owner: 'Emily Rodriguez',
    tags: ['Printing', 'Regular'],
    notes: 'Monthly recurring orders',
    preferredContact: 'Phone',
  },
  {
    id: 'contact-5',
    firstName: 'Lisa',
    lastName: 'Wang',
    email: 'lisa.wang@healthfirstmed.com',
    phone: '+1 (555) 333-4444',
    mobile: '+1 (555) 333-5555',
    jobTitle: 'Partnership Manager',
    department: 'Business Development',
    accountId: 'acc-5',
    accountName: 'HealthFirst Medical',
    type: 'Partner',
    status: 'Active',
    avatar: '',
    lastContacted: '2024-12-18T09:00:00Z',
    createdAt: '2024-07-08T14:00:00Z',
    owner: 'Michael Chen',
    tags: ['Healthcare', 'Partnership'],
    notes: 'Partner integration contact',
    preferredContact: 'Email',
  },
];

export const ContactsTable: React.FC = () => {
  const { canViewAllData, getUserFullName } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [saving, setSaving] = useState(false);
  const { navigateToEntity } = useNavigation();

  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    jobTitle: '',
    department: '',
    accountName: '',
    type: 'Prospect' as Contact['type'],
  });

  const handleCreateContact = async () => {
    if (!newContact.firstName || !newContact.lastName || !newContact.email) return;

    setSaving(true);
    try {
      const createdContact = await contactsApi.create({
        ...newContact,
        owner: getUserFullName() || 'Unassigned',
        accountId: `acc-${Date.now()}`,
      });
      setContacts([...contacts, createdContact as Contact]);
      setNewContact({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        mobile: '',
        jobTitle: '',
        department: '',
        accountName: '',
        type: 'Prospect',
      });
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to create contact:', err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        let fetchedData: Contact[];

        try {
          const data = await contactsApi.getAll();
          fetchedData = data as Contact[];
        } catch {
          // API unavailable, use mock data
          console.log('API unavailable, using mock contact data');
          fetchedData = MOCK_CONTACTS;
        }

        let filteredData = fetchedData;

        // Filter by owner if user cannot view all data
        if (!canViewAllData()) {
          const currentUserName = getUserFullName();
          filteredData = filteredData.filter(contact => contact.owner === currentUserName);
        }

        setContacts(filteredData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch contacts');
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [canViewAllData, getUserFullName]);

  const filteredContacts = contacts.filter(contact =>
    `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.accountName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className={isDark ? 'text-zinc-500' : 'text-slate-500'}>Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className={`rounded-xl p-6 text-center ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-red-300' : 'text-red-800'}`}>Failed to load contacts</h3>
          <p className={isDark ? 'text-red-400' : 'text-red-600'}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className={`rounded-2xl shadow-soft border overflow-hidden ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        {/* Header */}
        <div className={`p-4 lg:p-6 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex items-center gap-3 lg:gap-4">
              <div>
                <h3 className={`text-lg lg:text-xl font-display font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Contacts</h3>
                <p className={`text-sm mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{contacts.length} total contacts</p>
              </div>
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
              <div className="relative flex-1 sm:flex-none">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} size={16} />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-9 pr-4 py-2 w-full sm:w-48 lg:w-64 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    isDark
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                      : 'bg-slate-50 border-slate-200 placeholder-slate-400'
                  }`}
                />
              </div>
              <div className="flex gap-2 lg:gap-3">
                <button className={`hidden sm:flex items-center gap-2 px-3 lg:px-4 py-2 border rounded-lg text-sm transition-colors ${
                  isDark
                    ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}>
                  <Filter size={16} /> <span className="hidden lg:inline">Filter</span>
                </button>
                <button className={`hidden sm:flex items-center gap-2 px-3 lg:px-4 py-2 border rounded-lg text-sm transition-colors ${
                  isDark
                    ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}>
                  <Download size={16} /> <span className="hidden lg:inline">Export</span>
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-glow flex-1 sm:flex-none"
                >
                  <Plus size={16} /> Add Contact
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table or Kanban View */}
        {viewMode === 'list' ? (
        <>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDark ? 'bg-zinc-800 border-b border-zinc-700' : 'bg-slate-50 border-b border-slate-100'}>
              <tr>
                <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Contact</th>
                <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Account</th>
                <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Job Title</th>
                <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Type</th>
                <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Last Contacted</th>
                <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Owner</th>
                <th className={`px-6 py-4 text-right text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-slate-100'}`}>
              {filteredContacts.map((contact) => (
                <tr
                  key={contact.id}
                  className={`transition-colors group cursor-pointer ${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-50/80'}`}
                  onClick={() => { setSelectedContact(contact); setShowModal(true); }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {contact.avatar ? (
                        <img className={`h-10 w-10 rounded-full object-cover border-2 shadow-sm ${isDark ? 'border-zinc-700' : 'border-white'}`} src={contact.avatar} alt="" />
                      ) : (
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border-2 shadow-sm ${
                          isDark ? 'bg-brand-900/50 text-brand-400 border-zinc-700' : 'bg-brand-100 text-brand-600 border-white'
                        }`}>
                          {contact.firstName[0]}{contact.lastName[0]}
                        </div>
                      )}
                      <div className="ml-4">
                        <div className={`text-sm font-bold font-display ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{contact.firstName} {contact.lastName}</div>
                        <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{contact.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (contact.accountId) {
                          navigateToEntity('account', contact.accountId, contact.accountName);
                        }
                      }}
                      className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 hover:underline group/link"
                    >
                      <Building2 size={14} className="text-brand-400 group-hover/link:text-brand-600" />
                      {contact.accountName}
                      <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{contact.jobTitle}</div>
                    {contact.department && (
                      <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{contact.department}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getTypeColor(contact.type, isDark)}`}>
                      {contact.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                    {contact.lastContacted || 'Never'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    {contact.owner}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button className={`p-1.5 rounded-md ${isDark ? 'text-zinc-400 hover:text-brand-400 hover:bg-zinc-800' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'}`}>
                        <Mail size={16} />
                      </button>
                      <button className={`p-1.5 rounded-md ${isDark ? 'text-zinc-400 hover:text-brand-400 hover:bg-zinc-800' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'}`}>
                        <Phone size={16} />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuId(actionMenuId === contact.id ? null : contact.id)}
                          className={`p-1.5 rounded-md ${isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {actionMenuId === contact.id && (
                          <div className={`absolute right-0 top-full mt-1 w-48 rounded-lg shadow-xl border py-1 z-50 ${
                            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                          }`}>
                            <button
                              onClick={() => { setSelectedContact(contact); setShowModal(true); setActionMenuId(null); }}
                              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                                isDark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <User size={14} /> View Details
                            </button>
                            <button className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                              isDark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-slate-700 hover:bg-slate-50'
                            }`}>
                              <Edit2 size={14} /> Edit Contact
                            </button>
                            <button className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                              isDark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-slate-700 hover:bg-slate-50'
                            }`}>
                              <Calendar size={14} /> Schedule Meeting
                            </button>
                            <hr className={isDark ? 'my-1 border-zinc-800' : 'my-1 border-slate-100'} />
                            <button className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                              isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                            }`}>
                              <Trash2 size={14} /> Delete Contact
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={`px-6 py-4 border-t flex items-center justify-between ${
          isDark ? 'bg-zinc-800/50 border-zinc-800' : 'bg-slate-50/50 border-slate-100'
        }`}>
          <span className={`text-sm ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
            Showing <span className={`font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>1-{filteredContacts.length}</span> of <span className={`font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{contacts.length}</span> contacts
          </span>
          <div className="flex gap-2">
            <button className={`px-3 py-1.5 border rounded-lg text-sm transition-all shadow-sm ${
              isDark
                ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-brand-600 hover:text-brand-400'
                : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
            }`}>Previous</button>
            <button className={`px-3 py-1.5 border rounded-lg text-sm transition-all shadow-sm ${
              isDark
                ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-brand-600 hover:text-brand-400'
                : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
            }`}>Next</button>
          </div>
        </div>
        </>
        ) : (
          /* Kanban View */
          <div className="p-4 md:p-6 overflow-x-auto">
            <div className="flex gap-3 md:gap-4 lg:gap-6 pb-4 min-w-max">
              {['Customer', 'Prospect', 'Partner', 'Vendor'].map((type) => {
                const typeContacts = filteredContacts.filter(c => c.type === type);
                return (
                  <div key={type} className="w-[260px] md:w-[280px] lg:w-[300px] flex-shrink-0">
                    <div className={`p-4 rounded-t-xl border-t-4 ${
                      type === 'Customer' ? 'border-green-500' :
                      type === 'Prospect' ? 'border-blue-500' :
                      type === 'Partner' ? 'border-purple-500' :
                      'border-orange-500'
                    } border-x border-b shadow-sm mb-3 ${
                      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className={`font-brand font-bold uppercase tracking-wide text-sm ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{type}s</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-600'}`}>{typeContacts.length}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {typeContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className={`p-4 rounded-xl border shadow-soft transition-all cursor-pointer ${
                            isDark
                              ? 'bg-zinc-900 border-zinc-800 hover:border-brand-600'
                              : 'bg-white border-slate-200 hover:shadow-md hover:border-brand-300'
                          }`}
                          onClick={() => { setSelectedContact(contact); setShowModal(true); }}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            {contact.avatar ? (
                              <img className={`h-10 w-10 rounded-full object-cover border-2 shadow-sm ${isDark ? 'border-zinc-700' : 'border-white'}`} src={contact.avatar} alt="" />
                            ) : (
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border-2 shadow-sm ${
                                isDark ? 'bg-brand-900/50 text-brand-400 border-zinc-700' : 'bg-brand-100 text-brand-600 border-white'
                              }`}>
                                {contact.firstName[0]}{contact.lastName[0]}
                              </div>
                            )}
                            <div>
                              <h5 className={`font-bold font-display ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{contact.firstName} {contact.lastName}</h5>
                              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{contact.jobTitle}</p>
                            </div>
                          </div>
                          <div className={`space-y-1 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                            <p className="flex items-center gap-2">
                              <Building2 size={12} className={isDark ? 'text-zinc-500' : 'text-slate-400'} />
                              {contact.accountName}
                            </p>
                            <p className="flex items-center gap-2">
                              <Mail size={12} className={isDark ? 'text-zinc-500' : 'text-slate-400'} />
                              {contact.email}
                            </p>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setShowAddModal(true)}
                        className={`w-full py-2 border-2 border-dashed rounded-xl font-medium text-sm transition-all ${
                          isDark
                            ? 'border-zinc-700 text-zinc-500 hover:border-brand-600 hover:text-brand-400 hover:bg-brand-900/20'
                            : 'border-slate-200 text-slate-400 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/50'
                        }`}
                      >
                        + Add Contact
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Contact Detail Modal */}
      {showModal && selectedContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-zinc-900' : 'bg-white'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b flex justify-between items-start ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-4">
                {selectedContact.avatar ? (
                  <img className={`h-16 w-16 rounded-full object-cover border-2 shadow-lg ${isDark ? 'border-zinc-700' : 'border-white'}`} src={selectedContact.avatar} alt="" />
                ) : (
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center font-bold text-xl border-2 shadow-lg ${
                    isDark ? 'bg-brand-900/50 text-brand-400 border-zinc-700' : 'bg-brand-100 text-brand-600 border-white'
                  }`}>
                    {selectedContact.firstName[0]}{selectedContact.lastName[0]}
                  </div>
                )}
                <div>
                  <h2 className={`text-xl font-bold font-display ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{selectedContact.firstName} {selectedContact.lastName}</h2>
                  <p className={isDark ? 'text-zinc-400' : 'text-slate-500'}>{selectedContact.jobTitle} at {selectedContact.accountName}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}>
                <X size={20} />
              </button>
            </div>

            <div className="p-4 lg:p-6 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Email</label>
                    <p className={`text-sm mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{selectedContact.email}</p>
                  </div>
                  <div>
                    <label className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Phone</label>
                    <p className={`text-sm mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{selectedContact.phone}</p>
                  </div>
                  {selectedContact.mobile && (
                    <div>
                      <label className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Mobile</label>
                      <p className={`text-sm mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{selectedContact.mobile}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Account</label>
                    <button
                      onClick={() => {
                        if (selectedContact.accountId) {
                          setShowModal(false);
                          navigateToEntity('account', selectedContact.accountId, selectedContact.accountName);
                        }
                      }}
                      className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 hover:underline mt-1 group"
                    >
                      <Building2 size={14} className="text-brand-400 group-hover:text-brand-600" />
                      {selectedContact.accountName}
                      <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                  <div>
                    <label className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Department</label>
                    <p className={`text-sm mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{selectedContact.department || 'N/A'}</p>
                  </div>
                  <div>
                    <label className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Owner</label>
                    <p className={`text-sm mt-1 flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                      <User size={14} className={isDark ? 'text-zinc-500' : 'text-slate-400'} />
                      {selectedContact.owner}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={`flex flex-col sm:flex-row gap-2 lg:gap-3 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                <button className="flex-1 flex items-center justify-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors text-sm">
                  <Mail size={16} /> Send Email
                </button>
                <button className={`flex-1 flex items-center justify-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 border rounded-lg font-medium transition-colors text-sm ${
                  isDark
                    ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}>
                  <Phone size={16} /> Log Call
                </button>
                <button className={`flex items-center justify-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 border rounded-lg font-medium transition-colors text-sm ${
                  isDark
                    ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}>
                  <Linkedin size={16} />
                </button>
              </div>

              {/* Activity Timeline */}
              <div className={`pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                      <Mail size={14} />
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Email sent: Follow-up on proposal</p>
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Dec 8, 2024 at 3:30 PM</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600'}`}>
                      <Phone size={14} />
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Call completed: Demo scheduling</p>
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Dec 5, 2024 at 11:00 AM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-zinc-900' : 'bg-white'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>New Contact</h2>
              <button onClick={() => setShowAddModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'}`}>
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>First Name *</label>
                  <input
                    type="text"
                    value={newContact.firstName}
                    onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                        : 'bg-white border-slate-200 placeholder-slate-400'
                    }`}
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Last Name *</label>
                  <input
                    type="text"
                    value={newContact.lastName}
                    onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                        : 'bg-white border-slate-200 placeholder-slate-400'
                    }`}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Email *</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    isDark
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                      : 'bg-white border-slate-200 placeholder-slate-400'
                  }`}
                  placeholder="john.doe@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Phone</label>
                  <input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                        : 'bg-white border-slate-200 placeholder-slate-400'
                    }`}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Mobile</label>
                  <input
                    type="tel"
                    value={newContact.mobile}
                    onChange={(e) => setNewContact({ ...newContact, mobile: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                        : 'bg-white border-slate-200 placeholder-slate-400'
                    }`}
                    placeholder="+1 (555) 987-6543"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Job Title</label>
                  <input
                    type="text"
                    value={newContact.jobTitle}
                    onChange={(e) => setNewContact({ ...newContact, jobTitle: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                        : 'bg-white border-slate-200 placeholder-slate-400'
                    }`}
                    placeholder="Sales Manager"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Department</label>
                  <input
                    type="text"
                    value={newContact.department}
                    onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                        : 'bg-white border-slate-200 placeholder-slate-400'
                    }`}
                    placeholder="Sales"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Account Name</label>
                  <input
                    type="text"
                    value={newContact.accountName}
                    onChange={(e) => setNewContact({ ...newContact, accountName: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                        : 'bg-white border-slate-200 placeholder-slate-400'
                    }`}
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Type</label>
                  <select
                    value={newContact.type}
                    onChange={(e) => setNewContact({ ...newContact, type: e.target.value as Contact['type'] })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <option value="Prospect">Prospect</option>
                    <option value="Customer">Customer</option>
                    <option value="Partner">Partner</option>
                    <option value="Vendor">Vendor</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <button
                onClick={() => setShowAddModal(false)}
                className={`px-4 py-2 border rounded-lg ${
                  isDark
                    ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateContact}
                disabled={saving || !newContact.firstName || !newContact.lastName || !newContact.email}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Create Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
