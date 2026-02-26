import React from 'react';
import { Building2 } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps, DashboardData, BreakdownData } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';
import { formatCompact } from '@/utils/dashboard';

export const PartnersWidget: React.FC<WidgetProps> = ({ navigate, onDetailClick }) => {
  const { data: all } = useDashboardData();
  const stats: DashboardData | null = all?.stats ?? null;
  const breakdownData: BreakdownData = all?.breakdown || { byProduct: [], byPartner: [], bySalesperson: [] };

  const sortedPartners = [...breakdownData.byPartner].sort((a, b) => b.totalAmount - a.totalAmount);
  const totalPartnerDeals = sortedPartners.reduce((s, p) => s + p.count, 0);
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const thClass = 'text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500';
  const tdClass = 'text-xs text-slate-700 dark:text-zinc-300';
  const tdBold = 'text-xs font-semibold text-slate-900 dark:text-white';
  const rowBorder = 'border-slate-100 dark:border-zinc-800/50';

  return (
    <AnalyticsCard
      icon={<Building2 className="w-4 h-4" />}
      iconBg="bg-blue-50 dark:bg-blue-900/30"
      iconColor="text-blue-600 dark:text-blue-400"
      title="Accounts"
      titleColor="text-blue-700 dark:text-blue-400"
      subtitle={currentMonth}
      onClick={() => onDetailClick?.()}
    >
      {/* Status badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="px-2.5 py-1.5 rounded-lg text-center bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/30">
          <p className="text-sm font-bold text-blue-700 dark:text-blue-400">{stats?.totalPartners ?? 0}</p>
          <p className="text-[9px] uppercase tracking-wider font-medium text-blue-500 dark:text-blue-500/70">Active</p>
        </div>
        <div className="px-2.5 py-1.5 rounded-lg text-center bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30">
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{stats?.pendingPartners ?? 0}</p>
          <p className="text-[9px] uppercase tracking-wider font-medium text-amber-500 dark:text-amber-500/70">Pending</p>
        </div>
        <div className="px-2.5 py-1.5 rounded-lg text-center bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30">
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{sortedPartners.filter(p => p.totalAmount > 0).length}</p>
          <p className="text-[9px] uppercase tracking-wider font-medium text-emerald-500 dark:text-emerald-500/70">Billed</p>
        </div>
      </div>

      {/* Partner table */}
      {sortedPartners.length === 0 ? (
        <div className="h-24 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
          <p className="text-xs text-slate-400 dark:text-zinc-500">No account data</p>
        </div>
      ) : (
        <>
          <div className="max-h-[160px] overflow-y-auto">
            <table className="premium-table">
              <thead>
                <tr className={`border-b ${rowBorder}`}>
                  <th className={`${thClass} text-left pb-2`}>Account</th>
                  <th className={`${thClass} text-right pb-2`}>Sales</th>
                </tr>
              </thead>
              <tbody>
                {sortedPartners.slice(0, 8).map((p, i) => (
                  <tr key={i} className={`border-b last:border-0 ${rowBorder}`}>
                    <td className={`${tdClass} py-1.5 truncate max-w-[140px]`}>{p.partnerName || 'Unknown'}</td>
                    <td className={`${tdBold} py-1.5 text-right`}>{formatCompact(p.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Footer */}
          <div className={`flex items-center justify-between pt-3 mt-3 border-t ${rowBorder}`}>
            <span className="text-xs font-bold text-slate-900 dark:text-white">{totalPartnerDeals}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500">Total Deals</span>
          </div>
        </>
      )}
    </AnalyticsCard>
  );
};
