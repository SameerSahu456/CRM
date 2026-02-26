import React from 'react';
import { Users } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps, BreakdownData, GrowthData } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';
import { formatCompact, pctChange } from '@/utils/dashboard';

export const SalesTeamWidget: React.FC<WidgetProps> = ({ navigate, onDetailClick }) => {
  const { data: all } = useDashboardData();
  const breakdownData: BreakdownData = all?.breakdown || { byProduct: [], byPartner: [], bySalesperson: [] };
  const growth: GrowthData | null = all?.growth ?? null;

  const sortedSalespersons = [...breakdownData.bySalesperson].sort((a, b) => b.totalAmount - a.totalAmount);
  const totalSalesAmount = sortedSalespersons.reduce((s, sp) => s + sp.totalAmount, 0);
  const totalSalesCount = sortedSalespersons.reduce((s, sp) => s + sp.count, 0);
  const momChange = growth ? pctChange(growth.thisMonth, growth.lastMonth) : 0;

  const thClass = 'text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500';
  const tdClass = 'text-xs text-slate-700 dark:text-zinc-300';
  const tdBold = 'text-xs font-semibold text-slate-900 dark:text-white';
  const rowBorder = 'border-slate-100 dark:border-zinc-800/50';

  return (
    <AnalyticsCard
      icon={<Users className="w-4 h-4" />}
      iconBg="bg-emerald-50 dark:bg-emerald-900/30"
      iconColor="text-emerald-600 dark:text-emerald-400"
      title="Sales Team"
      titleColor="text-emerald-700 dark:text-emerald-400"
      subtitle="Performance Tracker"
      badge={momChange !== 0 ? { value: momChange } : undefined}
      onClick={() => onDetailClick?.()}
    >
      {/* Big metric */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatCompact(totalSalesAmount)}
          </p>
          <p className="text-[10px] uppercase tracking-wider mt-0.5 text-slate-400 dark:text-zinc-500">
            Total Achieved
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {totalSalesCount}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500">Deals</p>
        </div>
      </div>

      {/* Table */}
      {sortedSalespersons.length === 0 ? (
        <div className="h-24 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
          <p className="text-xs text-slate-400 dark:text-zinc-500">No sales data</p>
        </div>
      ) : (
        <div className="max-h-[200px] overflow-y-auto">
          <table className="premium-table">
            <thead>
              <tr className={`border-b ${rowBorder}`}>
                <th className={`${thClass} text-left pb-2`}>Name</th>
                <th className={`${thClass} text-right pb-2`}>Achieved</th>
                <th className={`${thClass} text-right pb-2`}>%</th>
                <th className={`${thClass} text-right pb-2`}>Deals</th>
              </tr>
            </thead>
            <tbody>
              {sortedSalespersons.slice(0, 10).map((sp, i) => {
                const pct = totalSalesAmount > 0 ? Math.round((sp.totalAmount / totalSalesAmount) * 100) : 0;
                return (
                  <tr key={i} className={`border-b last:border-0 ${rowBorder}`}>
                    <td className={`${tdClass} py-2 truncate max-w-[100px]`}>{sp.salespersonName || 'Unknown'}</td>
                    <td className={`${tdBold} py-2 text-right`}>{formatCompact(sp.totalAmount)}</td>
                    <td className="text-xs py-2 text-right text-slate-400 dark:text-zinc-500">{pct}%</td>
                    <td className={`${tdClass} py-2 text-right`}>{sp.count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AnalyticsCard>
  );
};
