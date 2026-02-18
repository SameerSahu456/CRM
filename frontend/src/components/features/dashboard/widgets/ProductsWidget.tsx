import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps, BreakdownData } from '@/types';
import { dashboardApi } from '@/services/api';
import { formatCompact } from '@/utils/dashboard';

export const ProductsWidget: React.FC<WidgetProps> = ({ isDark, navigate, onDetailClick }) => {
  const [breakdownData, setBreakdownData] = useState<BreakdownData>({ byProduct: [], byPartner: [], bySalesperson: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const all = await dashboardApi.getAll();
        setBreakdownData(all.breakdown || { byProduct: [], byPartner: [], bySalesperson: [] });
      } catch {
        // Best-effort
      }
    };
    fetchData();
  }, []);

  const sortedProducts = [...breakdownData.byProduct].sort((a, b) => b.totalAmount - a.totalAmount);
  const totalProductRevenue = sortedProducts.reduce((s, p) => s + p.totalAmount, 0);
  const totalProductDeals = sortedProducts.reduce((s, p) => s + p.count, 0);

  const thClass = `text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`;
  const tdClass = `text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`;
  const tdBold = `text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`;
  const rowBorder = isDark ? 'border-zinc-800/50' : 'border-slate-100';

  return (
    <AnalyticsCard
      icon={<Package className="w-4 h-4" />}
      iconBg={isDark ? 'bg-teal-900/30' : 'bg-teal-50'}
      iconColor={isDark ? 'text-teal-400' : 'text-teal-600'}
      title="Products"
      titleColor={isDark ? 'text-teal-400' : 'text-teal-700'}
      subtitle="Portfolio Performance"
      isDark={isDark}
      onClick={() => onDetailClick?.()}
    >
      {/* Big metric */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formatCompact(totalProductRevenue)}
          </p>
          <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Revenue</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>{totalProductDeals}</p>
          <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Deals</p>
        </div>
      </div>

      {sortedProducts.length === 0 ? (
        <div className={`h-24 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No product data</p>
        </div>
      ) : (
        <div className="max-h-[200px] overflow-y-auto">
          <table className="w-full">
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
                    <td className={`py-1.5 text-right`}>
                      <span className={`text-[10px] font-semibold ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>{pct}%</span>
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
