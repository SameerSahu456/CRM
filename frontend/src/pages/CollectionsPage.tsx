import React, { useState, useEffect, useCallback } from 'react';
import {
  IndianRupee, Loader2, Building2, Phone, Mail, MapPin,
  ChevronDown, ChevronUp, FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { salesApi, accountsApi, formatINR } from '@/services/api';
import { Badge } from '@/components/ui';
import { cx } from '@/utils/cx';

interface CollectionGroup {
  customerName: string;
  totalAmount: number;
  entryCount: number;
}

export const CollectionsPage: React.FC = () => {
  const { user } = useAuth();

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

  const tabConfig = {
    pending: { data: collections.pending, label: 'Pending', accent: 'red' as const, badgeText: 'Pending' },
    partial: { data: collections.partialPending, label: 'Partial', accent: 'amber' as const, badgeText: 'Partial' },
    paid: { data: collections.paid, label: 'Collected', accent: 'emerald' as const, badgeText: 'Collected' },
  };

  const accentClasses = {
    red: { border: 'border-red-300 dark:border-red-500/40', bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', stripe: 'from-red-500 to-red-400', hoverBorder: 'hover:border-red-300 dark:hover:border-red-500/40', hoverShadow: 'hover:shadow-red-100 dark:hover:shadow-red-500/5' },
    amber: { border: 'border-amber-300 dark:border-amber-500/40', bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', stripe: 'from-amber-500 to-amber-400', hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-500/40', hoverShadow: 'hover:shadow-amber-100 dark:hover:shadow-amber-500/5' },
    emerald: { border: 'border-emerald-300 dark:border-emerald-500/40', bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', stripe: 'from-emerald-500 to-emerald-400', hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-500/40', hoverShadow: 'hover:shadow-emerald-100 dark:hover:shadow-emerald-500/5' },
  };

  const statCards = [
    { key: 'pending' as const, label: 'Pending', data: collections.pending, gradient: 'from-red-50 to-red-100/60 dark:from-red-900/40 dark:to-red-800/20', ring: 'ring-red-200/60 dark:ring-red-500/20', tc: 'text-red-600 dark:text-red-400', iBg: 'bg-red-100 dark:bg-red-900/40', bottom: 'bg-red-500' },
    { key: 'partial' as const, label: 'Partial', data: collections.partialPending, gradient: 'from-amber-50 to-amber-100/60 dark:from-amber-900/40 dark:to-amber-800/20', ring: 'ring-amber-200/60 dark:ring-amber-500/20', tc: 'text-amber-600 dark:text-amber-400', iBg: 'bg-amber-100 dark:bg-amber-900/40', bottom: 'bg-amber-500' },
    { key: 'paid' as const, label: 'Collected', data: collections.paid, gradient: 'from-emerald-50 to-emerald-100/60 dark:from-emerald-900/40 dark:to-emerald-800/20', ring: 'ring-emerald-200/60 dark:ring-emerald-500/20', tc: 'text-emerald-600 dark:text-emerald-400', iBg: 'bg-emerald-100 dark:bg-emerald-900/40', bottom: 'bg-emerald-500' },
  ];

  const cfg = tabConfig[activeTab];
  const ac = accentClasses[cfg.accent];

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-3 animate-fade-in-up">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-14">
          <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
          <p className="mt-2 text-sm font-medium text-gray-500 dark:text-zinc-400">Loading collections...</p>
        </div>
      ) : (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {statCards.map(stat => (
              <button
                key={stat.key}
                onClick={() => { setActiveTab(stat.key); setExpandedCustomer(null); }}
                className={cx(
                  'relative overflow-hidden rounded-xl bg-gradient-to-br p-3.5 ring-1 text-left transition-all duration-200 dark:backdrop-blur-xl',
                  stat.gradient, stat.ring,
                  activeTab === stat.key ? 'scale-[1.01] shadow-md ring-2' : 'hover:scale-[1.005]'
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">{stat.label}</span>
                  <span className={cx('rounded-full px-2 py-px text-[11px] font-bold', stat.iBg, stat.tc)}>{stat.data.length}</span>
                </div>
                <p className={cx('text-xl font-bold tracking-tight', stat.tc)}>{formatINR(stat.data.reduce((s, c) => s + c.totalAmount, 0))}</p>
                <p className="text-[11px] mt-0.5 text-gray-400 dark:text-zinc-500">{stat.data.length} account{stat.data.length !== 1 ? 's' : ''}</p>
                {activeTab === stat.key && <div className={cx('absolute bottom-0 left-0 w-full h-0.5', stat.bottom)} />}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {cfg.data.length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-gray-200 bg-gray-50 dark:border-zinc-800 dark:bg-dark-100/50">
              <IndianRupee className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-zinc-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No {cfg.label.toLowerCase()} collections</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cfg.data.map((item, i) => {
                const isExpanded = expandedCustomer === `${activeTab}-${item.customerName}`;
                return (
                  <div key={i} className={cx(
                    'rounded-xl border overflow-hidden transition-all duration-200',
                    isExpanded
                      ? cx(ac.border, 'shadow-md bg-white dark:bg-dark-100')
                      : cx('bg-white border-gray-200 dark:bg-dark-100/80 dark:border-zinc-800', ac.hoverBorder, ac.hoverShadow, 'hover:shadow-sm')
                  )}>
                    <div className={cx('h-px bg-gradient-to-r', ac.stripe)} />

                    {/* Card Header */}
                    <button
                      onClick={() => handleExpandCustomer(item.customerName)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                    >
                      <div className={cx('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0', ac.bg, ac.text)}>
                        {(item.customerName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-semibold truncate text-gray-900 dark:text-white">{item.customerName || 'Unknown'}</h4>
                        <p className="text-[11px] text-gray-400 dark:text-zinc-500">{item.entryCount} order{item.entryCount !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={cx('text-sm font-bold', ac.text)}>{formatINR(item.totalAmount)}</p>
                        <span className={cx('text-[9px] uppercase tracking-wider font-semibold px-1.5 py-px rounded-full', ac.bg, ac.text)}>{cfg.badgeText}</span>
                      </div>
                      {isExpanded
                        ? <ChevronUp className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
                        : <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
                      }
                    </button>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="border-t px-3 pb-3 pt-2.5 space-y-3 border-gray-100 dark:border-zinc-800">
                        {isLoadingDetail ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
                            <span className="ml-2 text-xs text-gray-500 dark:text-zinc-400">Loading details...</span>
                          </div>
                        ) : (
                          <>
                            {/* Account Info */}
                            {customerAccount ? (
                              <div className="rounded-lg p-3 bg-gray-50 border border-gray-100 dark:bg-zinc-900/50 dark:border-zinc-800">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Building2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                                  <h5 className="text-xs font-semibold text-gray-900 dark:text-white">Account Details</h5>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {customerAccount.name && (
                                    <div>
                                      <p className="text-[9px] uppercase tracking-wider font-medium text-gray-400 dark:text-zinc-500">Name</p>
                                      <p className="text-xs font-medium text-gray-900 dark:text-white">{customerAccount.name}</p>
                                    </div>
                                  )}
                                  {customerAccount.industry && (
                                    <div>
                                      <p className="text-[9px] uppercase tracking-wider font-medium text-gray-400 dark:text-zinc-500">Industry</p>
                                      <p className="text-xs text-gray-700 dark:text-zinc-300">{customerAccount.industry}</p>
                                    </div>
                                  )}
                                  {(customerAccount.phone || customerAccount.email) && (
                                    <div>
                                      <p className="text-[9px] uppercase tracking-wider font-medium text-gray-400 dark:text-zinc-500">Contact</p>
                                      <div className="space-y-0.5">
                                        {customerAccount.phone && <p className="text-xs flex items-center gap-1 text-gray-700 dark:text-zinc-300"><Phone className="w-2.5 h-2.5" />{customerAccount.phone}</p>}
                                        {customerAccount.email && <p className="text-xs flex items-center gap-1 text-gray-700 dark:text-zinc-300"><Mail className="w-2.5 h-2.5" />{customerAccount.email}</p>}
                                      </div>
                                    </div>
                                  )}
                                  {customerAccount.location && (
                                    <div>
                                      <p className="text-[9px] uppercase tracking-wider font-medium text-gray-400 dark:text-zinc-500">Location</p>
                                      <p className="text-xs flex items-center gap-1 text-gray-700 dark:text-zinc-300"><MapPin className="w-2.5 h-2.5" />{customerAccount.location}</p>
                                    </div>
                                  )}
                                  {customerAccount.gstinNo && (
                                    <div>
                                      <p className="text-[9px] uppercase tracking-wider font-medium text-gray-400 dark:text-zinc-500">GSTIN</p>
                                      <p className="text-xs text-gray-700 dark:text-zinc-300">{customerAccount.gstinNo}</p>
                                    </div>
                                  )}
                                  {customerAccount.paymentTerms && (
                                    <div>
                                      <p className="text-[9px] uppercase tracking-wider font-medium text-gray-400 dark:text-zinc-500">Payment Terms</p>
                                      <p className="text-xs text-gray-700 dark:text-zinc-300">{customerAccount.paymentTerms}</p>
                                    </div>
                                  )}
                                  {customerAccount.tag && (
                                    <div>
                                      <p className="text-[9px] uppercase tracking-wider font-medium text-gray-400 dark:text-zinc-500">Tag</p>
                                      <p className="text-xs text-gray-700 dark:text-zinc-300">{customerAccount.tag}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-lg p-3 text-center bg-gray-50 border border-gray-100 dark:bg-zinc-900/50 dark:border-zinc-800">
                                <Building2 className="w-4 h-4 mx-auto mb-1 text-gray-300 dark:text-zinc-600" />
                                <p className="text-xs text-gray-400 dark:text-zinc-500">No matching account found</p>
                              </div>
                            )}

                            {/* Orders table */}
                            {customerEntries.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <FileText className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                                  <h5 className="text-xs font-semibold text-gray-900 dark:text-white">Orders ({customerEntries.length})</h5>
                                </div>
                                <div className="rounded-lg border overflow-hidden border-gray-200 dark:border-zinc-800">
                                  <table className="premium-table text-xs">
                                    <thead>
                                      <tr className="bg-gray-50 dark:bg-zinc-900/50">
                                        <th className="text-left px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Date</th>
                                        <th className="text-left px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Product</th>
                                        <th className="text-right px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Amount</th>
                                        <th className="text-center px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {customerEntries.slice(0, 10).map((entry: any, j: number) => (
                                        <tr key={j} className="border-t border-gray-100 dark:border-zinc-800">
                                          <td className="px-2.5 py-1.5 text-gray-700 dark:text-zinc-300">{entry.saleDate || '-'}</td>
                                          <td className="px-2.5 py-1.5 text-gray-700 dark:text-zinc-300">{entry.productName || '-'}</td>
                                          <td className="px-2.5 py-1.5 text-right font-medium text-gray-900 dark:text-white">{formatINR(entry.amount || 0)}</td>
                                          <td className="px-2.5 py-1.5 text-center">
                                            <Badge
                                              variant={entry.paymentStatus === 'paid' ? 'emerald' : entry.paymentStatus === 'partial' ? 'amber' : 'red'}
                                              size="sm"
                                            >
                                              {entry.paymentStatus || 'pending'}
                                            </Badge>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  {customerEntries.length > 10 && (
                                    <div className="px-2.5 py-1.5 text-center border-t border-gray-100 text-gray-400 dark:border-zinc-800 dark:text-zinc-500">
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
