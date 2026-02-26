import React from 'react';
import { Award } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps, BreakdownData } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';
import { formatCompact } from '@/utils/dashboard';

export const TopPartnersWidget: React.FC<WidgetProps> = ({ navigate, onDetailClick }) => {
  const { data: all } = useDashboardData();
  const breakdownData: BreakdownData = all?.breakdown || { byProduct: [], byPartner: [], bySalesperson: [] };

  const sortedPartners = [...breakdownData.byPartner].sort((a, b) => b.totalAmount - a.totalAmount);
  const totalPartnerRevenue = sortedPartners.reduce((s, p) => s + p.totalAmount, 0);

  return (
    <AnalyticsCard
      icon={<Award className="w-4 h-4" />}
      iconBg="bg-rose-50 dark:bg-rose-900/30"
      iconColor="text-rose-600 dark:text-rose-400"
      title="Top Accounts"
      titleColor="text-rose-700 dark:text-rose-400"
      subtitle="Revenue Rankings"
      onClick={() => onDetailClick?.()}
    >
      {sortedPartners.length === 0 ? (
        <div className="h-32 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
          <p className="text-xs text-slate-400 dark:text-zinc-500">No account data</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {sortedPartners.slice(0, 8).map((p, i) => {
            const pct = totalPartnerRevenue > 0 ? Math.round((p.totalAmount / totalPartnerRevenue) * 100) : 0;
            return (
              <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/50">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : i === 1 ? 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
                  : i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'bg-white text-slate-400 dark:bg-zinc-800 dark:text-zinc-500'
                }`}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-slate-900 dark:text-white">
                    {p.partnerName || 'Unknown'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{formatCompact(p.totalAmount)}</p>
                  <p className="text-[9px] text-slate-400 dark:text-zinc-500">{pct}%</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AnalyticsCard>
  );
};
