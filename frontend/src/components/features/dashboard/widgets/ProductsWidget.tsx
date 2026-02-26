import React from 'react';
import { Package } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps, BreakdownData } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';
import { formatCompact } from '@/utils/dashboard';

export const ProductsWidget: React.FC<WidgetProps> = ({ navigate, onDetailClick }) => {
  const { data: all } = useDashboardData();
  const breakdownData: BreakdownData = all?.breakdown || { byProduct: [], byPartner: [], bySalesperson: [] };

  const sortedProducts = [...breakdownData.byProduct].sort((a, b) => b.totalAmount - a.totalAmount);
  const totalProductRevenue = sortedProducts.reduce((s, p) => s + p.totalAmount, 0);
  const totalProductDeals = sortedProducts.reduce((s, p) => s + p.count, 0);

  const thClass = 'text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500';
  const tdClass = 'text-xs text-slate-700 dark:text-zinc-300';
  const tdBold = 'text-xs font-semibold text-slate-900 dark:text-white';
  const rowBorder = 'border-slate-100 dark:border-zinc-800/50';

  return (
    <AnalyticsCard
      icon={<Package className="w-4 h-4" />}
      iconBg="bg-teal-50 dark:bg-teal-900/30"
      iconColor="text-teal-600 dark:text-teal-400"
      title="Products"
      titleColor="text-teal-700 dark:text-teal-400"
      subtitle="Portfolio Performance"
      onClick={() => onDetailClick?.()}
    >
      {/* Big metric */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatCompact(totalProductRevenue)}
          </p>
          <p className="text-[10px] uppercase tracking-wider mt-0.5 text-slate-400 dark:text-zinc-500">Total Revenue</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-teal-600 dark:text-teal-400">{totalProductDeals}</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500">Deals</p>
        </div>
      </div>

      {sortedProducts.length === 0 ? (
        <div className="h-24 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
          <p className="text-xs text-slate-400 dark:text-zinc-500">No product data</p>
        </div>
      ) : (
        <div className="max-h-[200px] overflow-y-auto">
          <table className="premium-table">
            <thead>
              <tr className={`border-b ${rowBorder}`}>
                <th className={`${thClass} text-left pb-2`}>Product</th>
                <th className={`${thClass} text-right pb-2`}>Amount</th>
                <th className={`${thClass} text-right pb-2`}>Deals</th>
                <th className={`${thClass} text-right pb-2`}>%</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.slice(0, 8).map((p, i) => {
                const pct = totalProductRevenue > 0 ? Math.round((p.totalAmount / totalProductRevenue) * 100) : 0;
                return (
                  <tr key={i} className={`border-b last:border-0 ${rowBorder}`}>
                    <td className={`${tdClass} py-1.5 truncate max-w-[100px]`}>{p.productName || 'Unknown'}</td>
                    <td className={`${tdBold} py-1.5 text-right`}>{formatCompact(p.totalAmount)}</td>
                    <td className={`${tdClass} py-1.5 text-right`}>{p.count}</td>
                    <td className="py-1.5 text-right">
                      <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">{pct}%</span>
                    </td>
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
