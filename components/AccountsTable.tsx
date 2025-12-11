import React, { useState, useEffect } from 'react';
import { Filter, Download, MoreVertical, Globe, MapPin, Building, ExternalLink, Plus, Search, X, Users, DollarSign, Activity, Loader2, AlertCircle, Phone, Mail, TrendingUp, Briefcase, Contact } from 'lucide-react';
import { Account } from '../types';
import { accountsApi, contactsApi, dealsApi } from '../services/api';
import { useNavigation } from '../contexts/NavigationContext';

const getHealthColor = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};

interface RelatedContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
}

interface RelatedDeal {
  id: string;
  title: string;
  value: number;
  stage: string;
}

export const AccountsTable: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [relatedContacts, setRelatedContacts] = useState<RelatedContact[]>([]);
  const [relatedDeals, setRelatedDeals] = useState<RelatedDeal[]>([]);
  const { navigateToEntity } = useNavigation();

  // Fetch related contacts and deals when an account is selected
  useEffect(() => {
    if (selectedAccount && showModal) {
      const fetchRelated = async () => {
        try {
          const [allContacts, allDeals] = await Promise.all([
            contactsApi.getAll(),
            dealsApi.getAll()
          ]);

          // Filter contacts by accountId or accountName
          const accountContacts = (allContacts as RelatedContact[]).filter(
            (c: { accountId?: string; accountName?: string }) =>
              c.accountId === selectedAccount.id || c.accountName === selectedAccount.name
          );
          setRelatedContacts(accountContacts);

          // Filter deals by accountId or company name
          const accountDeals = (allDeals as RelatedDeal[]).filter(
            (d: { accountId?: string; company?: string }) =>
              d.accountId === selectedAccount.id || d.company === selectedAccount.name
          );
          setRelatedDeals(accountDeals);
        } catch (err) {
          console.error('Failed to fetch related data:', err);
        }
      };
      fetchRelated();
    }
  }, [selectedAccount, showModal]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const data = await accountsApi.getAll();
        setAccounts(data as Account[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-slate-500">Loading accounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to load accounts</h3>
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
        {/* Table Header Controls */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-display font-bold text-slate-900">Active Accounts</h3>
            <p className="text-sm text-slate-500 mt-1">Manage your enterprise relationships</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter size={16} /> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white border border-transparent rounded-lg text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
              <Download size={16} /> Export Report
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Account Name</th>
                <th className="px-6 py-4 text-left text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Industry</th>
                <th className="px-6 py-4 text-left text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-4 text-left text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Health</th>
                <th className="px-6 py-4 text-right text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((account) => (
                <tr
                  key={account.id}
                  className="hover:bg-brand-50/30 transition-colors group cursor-pointer"
                  onClick={() => { setSelectedAccount(account); setShowModal(true); }}
                >
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
                        <img src={account.logo} alt={account.name} className="w-full h-full object-cover opacity-90" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
                          {account.name}
                          <a href={`https://${account.website}`} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-brand-600 transition-colors">
                            <ExternalLink size={12} />
                          </a>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Globe size={10} /> {account.website}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200">
                        {account.industry}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-500">
                      <MapPin size={14} className="mr-1.5 text-slate-400" />
                      {account.location}
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900 font-display">
                      ${(account.revenue / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {account.employees} employees
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getHealthColor(account.healthScore)}`}
                          style={{ width: `${account.healthScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{account.healthScore}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                    <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-sm text-slate-500">Showing <span className="font-bold text-slate-900">1-{accounts.length}</span> of <span className="font-bold text-slate-900">{accounts.length}</span> accounts</span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-brand-300 hover:text-brand-600 transition-all shadow-sm">Previous</button>
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-brand-300 hover:text-brand-600 transition-all shadow-sm">Next</button>
          </div>
        </div>
      </div>

      {/* Account Detail Modal */}
      {showModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
                  <img src={selectedAccount.logo} alt={selectedAccount.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
                    {selectedAccount.name}
                    <a href={`https://${selectedAccount.website}`} target="_blank" rel="noreferrer" className="text-brand-600 hover:text-brand-700">
                      <ExternalLink size={16} />
                    </a>
                  </h2>
                  <p className="text-slate-500">{selectedAccount.industry}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      selectedAccount.type === 'Customer' ? 'bg-green-100 text-green-700' :
                      selectedAccount.type === 'Prospect' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedAccount.type}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      selectedAccount.status === 'Active' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {selectedAccount.status}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <DollarSign className="w-6 h-6 mx-auto text-green-600 mb-2" />
                  <p className="text-lg font-bold text-slate-900">${(selectedAccount.revenue / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-slate-500">Annual Revenue</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <Users className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                  <p className="text-lg font-bold text-slate-900">{selectedAccount.employees}</p>
                  <p className="text-xs text-slate-500">Employees</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                  <p className="text-lg font-bold text-slate-900">{selectedAccount.healthScore}%</p>
                  <p className="text-xs text-slate-500">Health Score</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <Briefcase className="w-6 h-6 mx-auto text-orange-600 mb-2" />
                  <p className="text-lg font-bold text-slate-900">3</p>
                  <p className="text-xs text-slate-500">Open Deals</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Account Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-500">Website</label>
                      <p className="text-sm text-slate-900 flex items-center gap-1">
                        <Globe size={14} className="text-slate-400" />
                        {selectedAccount.website}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Location</label>
                      <p className="text-sm text-slate-900 flex items-center gap-1">
                        <MapPin size={14} className="text-slate-400" />
                        {selectedAccount.location}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Phone</label>
                      <p className="text-sm text-slate-900">{selectedAccount.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Owner</label>
                      <p className="text-sm text-slate-900">{selectedAccount.owner}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Health Score Breakdown</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">Engagement</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full">
                        <div className="h-2 bg-green-500 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">Payment History</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full">
                        <div className="h-2 bg-green-500 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">Support Tickets</span>
                        <span className="font-medium">78%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full">
                        <div className="h-2 bg-yellow-500 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Contacts */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Users size={16} className="text-brand-600" />
                    Related Contacts ({relatedContacts.length})
                  </h3>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      navigateToEntity('contact', '', selectedAccount.name);
                    }}
                    className="text-xs text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    View All
                  </button>
                </div>
                {relatedContacts.length > 0 ? (
                  <div className="space-y-2">
                    {relatedContacts.slice(0, 3).map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => {
                          setShowModal(false);
                          navigateToEntity('contact', contact.id, `${contact.firstName} ${contact.lastName}`);
                        }}
                        className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-brand-50 transition-colors group text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                          {contact.firstName[0]}{contact.lastName[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 group-hover:text-brand-600">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{contact.jobTitle}</p>
                        </div>
                        <ExternalLink size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No contacts linked to this account</p>
                )}
              </div>

              {/* Related Deals */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Briefcase size={16} className="text-green-600" />
                    Related Deals ({relatedDeals.length})
                  </h3>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      navigateToEntity('deal', '', selectedAccount.name);
                    }}
                    className="text-xs text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    View All
                  </button>
                </div>
                {relatedDeals.length > 0 ? (
                  <div className="space-y-2">
                    {relatedDeals.slice(0, 3).map((deal) => (
                      <button
                        key={deal.id}
                        onClick={() => {
                          setShowModal(false);
                          navigateToEntity('deal', deal.id, deal.title);
                        }}
                        className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-green-50 transition-colors group text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                          <DollarSign size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 group-hover:text-green-600">
                            {deal.title}
                          </p>
                          <p className="text-xs text-slate-500">${deal.value.toLocaleString()} • {deal.stage}</p>
                        </div>
                        <ExternalLink size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No deals linked to this account</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3 pt-6 mt-6 border-t border-slate-100">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors">
                  <Mail size={16} /> Send Email
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                  <Phone size={16} /> Call
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                  <Briefcase size={16} /> New Deal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
