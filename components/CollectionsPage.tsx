import React, { useState, useEffect, useCallback } from 'react';
import {
  IndianRupee, Loader2, Building2, Phone, Mail, MapPin,
  ChevronDown, ChevronUp, FileText
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { salesApi, accountsApi, formatINR } from '../services/api';

interface CollectionGroup {
  customerName: string;
  totalAmount: number;
  entryCount: number;
}

export const CollectionsPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  const [collections, setCollections] = useState<{ pending: CollectionGroup[]; partialPending: CollectionGroup[]; paid: CollectionGroup[] }>({ pending: [], partialPending: [], paid: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'partial' | 'paid'>('pending');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [customerAccount, setCustomerAccount] = useState<any>(null);
  const [customerEntries, setCustomerEntries] = useState<any[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await salesApi.collections();
      setCollections(data);
    } catch {
      setCollections({ pending: [], partialPending: [], paid: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleExpandCustomer = useCallback(async (customerName: string) => {
    const key = `${activeTab}-${customerName}`;
    if (expandedCustomer === key) {
      setExpandedCustomer(null);
      return;
    }
    setExpandedCustomer(key);
    setIsLoadingDetail(true);
    setCustomerAccount(null);
    setCustomerEntries([]);
    try {
      const [accountsRes, entriesRes] = await Promise.all([
        accountsApi.list({ search: customerName, limit: '5' }),
        salesApi.list({ search: customerName, limit: '50' }),
      ]);
      const accounts = accountsRes?.data || accountsRes?.items || accountsRes || [];
      const match = Array.isArray(accounts) ? accounts.find((a: any) => a.name?.toLowerCase() === customerName.toLowerCase()) || accounts[0] : null;
      setCustomerAccount(match || null);
      const entries = entriesRes?.data || entriesRes?.items || entriesRes || [];
      setCustomerEntries(Array.isArray(entries) ? entries : []);
    } catch {
      setCustomerAccount(null);
      setCustomerEntries([]);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [expandedCustomer, activeTab]);

  // Tab config
  const tabConfig = {
    pending: { data: collections.pending, label: 'Pending', accent: 'red' as const, badgeText: 'Pending' },
    partial: { data: collections.partialPending, label: 'Partial', accent: 'amber' as const, badgeText: 'Partial' },
    paid: { data: collections.paid, label: 'Collected', accent: 'emerald' as const, badgeText: 'Collected' },
  };

  const accentClasses = {
    red: { border: isDark ? 'border-red-500/40' : 'border-red-300', bg: isDark ? 'bg-red-900/30' : 'bg-red-50', text: isDark ? 'text-red-400' : 'text-red-600', stripe: 'from-red-500 to-red-400', hoverBorder: isDark ? 'hover:border-red-500/40' : 'hover:border-red-300', hoverShadow: isDark ? 'hover:shadow-red-500/5' : 'hover:shadow-red-100' },
    amber: { border: isDark ? 'border-amber-500/40' : 'border-amber-300', bg: isDark ? 'bg-amber-900/30' : 'bg-amber-50', text: isDark ? 'text-amber-400' : 'text-amber-600', stripe: 'from-amber-500 to-amber-400', hoverBorder: isDark ? 'hover:border-amber-500/40' : 'hover:border-amber-300', hoverShadow: isDark ? 'hover:shadow-amber-500/5' : 'hover:shadow-amber-100' },
    emerald: { border: isDark ? 'border-emerald-500/40' : 'border-emerald-300', bg: isDark ? 'bg-emerald-900/30' : 'bg-emerald-50', text: isDark ? 'text-emerald-400' : 'text-emerald-600', stripe: 'from-emerald-500 to-emerald-400', hoverBorder: isDark ? 'hover:border-emerald-500/40' : 'hover:border-emerald-300', hoverShadow: isDark ? 'hover:shadow-emerald-500/5' : 'hover:shadow-emerald-100' },
  };

  const statCards = [
    { key: 'pending' as const, label: 'Pending', data: collections.pending, gradient: isDark ? 'from-red-900/40 to-red-800/20' : 'from-red-50 to-red-100/60', ring: isDark ? 'ring-red-500/20' : 'ring-red-200/60', tc: isDark ? 'text-red-400' : 'text-red-600', iBg: isDark ? 'bg-red-900/40' : 'bg-red-100', bottom: 'bg-red-500' },
    { key: 'partial' as const, label: 'Partial', data: collections.partialPending, gradient: isDark ? 'from-amber-900/40 to-amber-800/20' : 'from-amber-50 to-amber-100/60', ring: isDark ? 'ring-amber-500/20' : 'ring-amber-200/60', tc: isDark ? 'text-amber-400' : 'text-amber-600', iBg: isDark ? 'bg-amber-900/40' : 'bg-amber-100', bottom: 'bg-amber-500' },
    { key: 'paid' as const, label: 'Collected', data: collections.paid, gradient: isDark ? 'from-emerald-900/40 to-emerald-800/20' : 'from-emerald-50 to-emerald-100/60', ring: isDark ? 'ring-emerald-500/20' : 'ring-emerald-200/60', tc: isDark ? 'text-emerald-400' : 'text-emerald-600', iBg: isDark ? 'bg-emerald-900/40' : 'bg-emerald-100', bottom: 'bg-emerald-500' },
  ];

  const cfg = tabConfig[activeTab];
  const ac = accentClasses[cfg.accent];

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-3 animate-fade-in-up">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-14">
          <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
          <p className={`mt-2 text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Loading collections...</p>
        </div>
      ) : (
        <>
          {/* Summary Stat Cards — clickable tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {statCards.map(stat => (
              <button
                key={stat.key}
                onClick={() => { setActiveTab(stat.key); setExpandedCustomer(null); }}
                className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.gradient} p-3.5 ring-1 ${stat.ring} text-left transition-all duration-200 ${
                  activeTab === stat.key ? 'scale-[1.01] shadow-md ring-2' : 'hover:scale-[1.005]'
                } ${isDark ? 'backdrop-blur-xl' : ''}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{stat.label}</span>
                  <span className={`${stat.iBg} rounded-full px-2 py-px text-[11px] font-bold ${stat.tc}`}>{stat.data.length}</span>
                </div>
                <p className={`text-xl font-bold tracking-tight ${stat.tc}`}>{formatINR(stat.data.reduce((s, c) => s + c.totalAmount, 0))}</p>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{stat.data.length} account{stat.data.length !== 1 ? 's' : ''}</p>
                {activeTab === stat.key && <div className={`absolute bottom-0 left-0 w-full h-0.5 ${stat.bottom}`} />}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {cfg.data.length === 0 ? (
            <div className={`text-center py-10 rounded-xl border ${isDark ? 'border-zinc-800 bg-dark-100/50' : 'border-slate-200 bg-slate-50'}`}>
              <IndianRupee className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
              <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>No {cfg.label.toLowerCase()} collections</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cfg.data.map((item, i) => {
                const isExpanded = expandedCustomer === `${activeTab}-${item.customerName}`;
                return (
                  <div key={i} className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                    isExpanded
                      ? `${ac.border} shadow-md ${isDark ? 'bg-dark-100' : 'bg-white'}`
                      : `${isDark ? 'bg-dark-100/80 border-zinc-800' : 'bg-white border-slate-200'} ${ac.hoverBorder} ${ac.hoverShadow} hover:shadow-sm`
                  }`}>
                    <div className={`h-px bg-gradient-to-r ${ac.stripe}`} />

                    {/* Card Header */}
                    <button
                      onClick={() => handleExpandCustomer(item.customerName)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${ac.bg} ${ac.text}`}>
                        {(item.customerName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-[13px] font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.customerName || 'Unknown'}</h4>
                        <p className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{item.entryCount} order{item.entryCount !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${ac.text}`}>{formatINR(item.totalAmount)}</p>
                        <span className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-px rounded-full ${ac.bg} ${ac.text}`}>{cfg.badgeText}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                      ) : (
                        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                      )}
                    </button>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className={`border-t px-3 pb-3 pt-2.5 space-y-3 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                        {isLoadingDetail ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
                            <span className={`ml-2 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Loading details...</span>
                          </div>
                        ) : (
                          <>
                            {/* Account Info */}
                            {customerAccount ? (
                              <div className={`rounded-lg p-3 ${isDark ? 'bg-zinc-900/50 border border-zinc-800' : 'bg-slate-50 border border-slate-100'}`}>
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Building2 className={`w-3.5 h-3.5 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
                                  <h5 className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Account Details</h5>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {customerAccount.name && (
                                    <div>
                                      <p className={`text-[9px] uppercase tracking-wider font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Name</p>
                                      <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{customerAccount.name}</p>
                                    </div>
                                  )}
                                  {customerAccount.industry && (
                                    <div>
                                      <p className={`text-[9px] uppercase tracking-wider font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Industry</p>
                                      <p className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{customerAccount.industry}</p>
                                    </div>
                                  )}
                                  {(customerAccount.phone || customerAccount.email) && (
                                    <div>
                                      <p className={`text-[9px] uppercase tracking-wider font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Contact</p>
                                      <div className="space-y-0.5">
                                        {customerAccount.phone && <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}><Phone className="w-2.5 h-2.5" />{customerAccount.phone}</p>}
                                        {customerAccount.email && <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}><Mail className="w-2.5 h-2.5" />{customerAccount.email}</p>}
                                      </div>
                                    </div>
                                  )}
                                  {customerAccount.location && (
                                    <div>
                                      <p className={`text-[9px] uppercase tracking-wider font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Location</p>
                                      <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}><MapPin className="w-2.5 h-2.5" />{customerAccount.location}</p>
                                    </div>
                                  )}
                                  {customerAccount.gstinNo && (
                                    <div>
                                      <p className={`text-[9px] uppercase tracking-wider font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>GSTIN</p>
                                      <p className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{customerAccount.gstinNo}</p>
                                    </div>
                                  )}
                                  {customerAccount.paymentTerms && (
                                    <div>
                                      <p className={`text-[9px] uppercase tracking-wider font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Payment Terms</p>
                                      <p className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{customerAccount.paymentTerms}</p>
                                    </div>
                                  )}
                                  {customerAccount.tag && (
                                    <div>
                                      <p className={`text-[9px] uppercase tracking-wider font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Tag</p>
                                      <p className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{customerAccount.tag}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className={`rounded-lg p-3 text-center ${isDark ? 'bg-zinc-900/50 border border-zinc-800' : 'bg-slate-50 border border-slate-100'}`}>
                                <Building2 className={`w-4 h-4 mx-auto mb-1 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
                                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No matching account found</p>
                              </div>
                            )}

                            {/* Orders table */}
                            {customerEntries.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <FileText className={`w-3.5 h-3.5 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
                                  <h5 className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Orders ({customerEntries.length})</h5>
                                </div>
                                <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className={isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}>
                                        <th className={`text-left px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Date</th>
                                        <th className={`text-left px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Product</th>
                                        <th className={`text-right px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Amount</th>
                                        <th className={`text-center px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {customerEntries.slice(0, 10).map((entry: any, j: number) => (
                                        <tr key={j} className={`border-t ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                                          <td className={`px-2.5 py-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{entry.saleDate || '-'}</td>
                                          <td className={`px-2.5 py-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{entry.productName || '-'}</td>
                                          <td className={`px-2.5 py-1.5 text-right font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatINR(entry.amount || 0)}</td>
                                          <td className="px-2.5 py-1.5 text-center">
                                            <span className={`inline-flex px-1.5 py-px rounded-full text-[9px] font-semibold ${
                                              entry.paymentStatus === 'paid' ? (isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                                              : entry.paymentStatus === 'partial' ? (isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600')
                                              : (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600')
                                            }`}>
                                              {entry.paymentStatus || 'pending'}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  {customerEntries.length > 10 && (
                                    <div className={`px-2.5 py-1.5 text-center border-t ${isDark ? 'border-zinc-800 text-zinc-500' : 'border-slate-100 text-slate-400'}`}>
                                      <p className="text-[10px]">Showing 10 of {customerEntries.length} entries</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
