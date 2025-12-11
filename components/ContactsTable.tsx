import React, { useState, useEffect } from 'react';
import { Filter, Download, MoreVertical, Mail, Phone, Plus, Search, Building2, Linkedin, X, User, Loader2, AlertCircle, Edit2, Trash2, Calendar, ExternalLink } from 'lucide-react';
import { Contact } from '../types';
import { contactsApi } from '../services/api';
import { useNavigation } from '../contexts/NavigationContext';

const getTypeColor = (type: string) => {
  switch (type) {
    case 'Customer': return 'bg-green-50 text-green-700 border-green-200';
    case 'Prospect': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Partner': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Vendor': return 'bg-orange-50 text-orange-700 border-orange-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export const ContactsTable: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const { navigateToEntity } = useNavigation();

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const data = await contactsApi.getAll();
        setContacts(data as Contact[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch contacts');
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

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
          <p className="text-slate-500">Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to load contacts</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-display font-bold text-slate-900">Contacts</h3>
            <p className="text-sm text-slate-500 mt-1">{contacts.length} total contacts</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter size={16} /> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <Download size={16} /> Export
            </button>
            <button className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-glow">
              <Plus size={16} /> Add Contact
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Account</th>
                <th className="px-6 py-4 text-left text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Job Title</th>
                <th className="px-6 py-4 text-left text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Last Contacted</th>
                <th className="px-6 py-4 text-left text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-4 text-right text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => { setSelectedContact(contact); setShowModal(true); }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm" src={contact.avatar} alt="" />
                      <div className="ml-4">
                        <div className="text-sm font-bold text-slate-900 font-display">{contact.firstName} {contact.lastName}</div>
                        <div className="text-xs text-slate-500">{contact.email}</div>
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
                    <div className="text-sm text-slate-700">{contact.jobTitle}</div>
                    {contact.department && (
                      <div className="text-xs text-slate-500">{contact.department}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getTypeColor(contact.type)}`}>
                      {contact.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {contact.lastContacted || 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {contact.owner}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button className="p-1.5 text-slate-400 hover:text-brand-600 rounded-md hover:bg-brand-50">
                        <Mail size={16} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-brand-600 rounded-md hover:bg-brand-50">
                        <Phone size={16} />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuId(actionMenuId === contact.id ? null : contact.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {actionMenuId === contact.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50">
                            <button
                              onClick={() => { setSelectedContact(contact); setShowModal(true); setActionMenuId(null); }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <User size={14} /> View Details
                            </button>
                            <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                              <Edit2 size={14} /> Edit Contact
                            </button>
                            <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                              <Calendar size={14} /> Schedule Meeting
                            </button>
                            <hr className="my-1 border-slate-100" />
                            <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
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
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-sm text-slate-500">
            Showing <span className="font-bold text-slate-900">1-{filteredContacts.length}</span> of <span className="font-bold text-slate-900">{contacts.length}</span> contacts
          </span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-brand-300 hover:text-brand-600 transition-all shadow-sm">Previous</button>
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-brand-300 hover:text-brand-600 transition-all shadow-sm">Next</button>
          </div>
        </div>
      </div>

      {/* Contact Detail Modal */}
      {showModal && selectedContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <img className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-lg" src={selectedContact.avatar} alt="" />
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-display">{selectedContact.firstName} {selectedContact.lastName}</h2>
                  <p className="text-slate-500">{selectedContact.jobTitle} at {selectedContact.accountName}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                    <p className="text-sm text-slate-900 mt-1">{selectedContact.email}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phone</label>
                    <p className="text-sm text-slate-900 mt-1">{selectedContact.phone}</p>
                  </div>
                  {selectedContact.mobile && (
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mobile</label>
                      <p className="text-sm text-slate-900 mt-1">{selectedContact.mobile}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Account</label>
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Department</label>
                    <p className="text-sm text-slate-900 mt-1">{selectedContact.department || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Owner</label>
                    <p className="text-sm text-slate-900 mt-1 flex items-center gap-2">
                      <User size={14} className="text-slate-400" />
                      {selectedContact.owner}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors">
                  <Mail size={16} /> Send Email
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                  <Phone size={16} /> Log Call
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                  <Linkedin size={16} />
                </button>
              </div>

              {/* Activity Timeline */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Mail size={14} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900">Email sent: Follow-up on proposal</p>
                      <p className="text-xs text-slate-500">Dec 8, 2024 at 3:30 PM</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                      <Phone size={14} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900">Call completed: Demo scheduling</p>
                      <p className="text-xs text-slate-500">Dec 5, 2024 at 11:00 AM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
