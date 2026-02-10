import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps, BreakdownData, GrowthData } from '../types';
import { dashboardApi } from '../../../services/api';
import { formatCompact, pctChange } from '../../../utils/dashboard';

export const SalesTeamWidget: React.FC<WidgetProps> = ({ isDark, navigate, onDetailClick }) => {
  const [breakdownData, setBreakdownData] = useState<BreakdownData>({ byProduct: [], byPartner: [], bySalesperson: [] });
  const [growth, setGrowth] = useState<GrowthData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const all = await dashboardApi.getAll();
        setBreakdownData(all.breakdown || { byProduct: [], byPartner: [], bySalesperson: [] });
        setGrowth(all.growth);
      } catch {
        // Best-effort
      }
    };
    fetchData();
  }, []);

  const sortedSalespersons = [...breakdownData.bySalesperson].sort((a, b) => b.totalAmount - a.totalAmount);
  const totalSalesAmount = sortedSalespersons.reduce((s, sp) => s + sp.totalAmount, 0);
  const totalSalesCount = sortedSalespersons.reduce((s, sp) => s + sp.count, 0);
  const momChange = growth ? pctChange(growth.thisMonth, growth.lastMonth) : 0;

  const thClass = `text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`;
  const tdClass = `text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`;
  const tdBold = `text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`;
  const rowBorder = isDark ? 'border-zinc-800/50' : 'border-slate-100';

  return (
    <AnalyticsCard
      icon={<Users className="w-4 h-4" />}
      iconBg={isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'}
      iconColor={isDark ? 'text-emerald-400' : 'text-emerald-600'}
      title="Sales Team"
      titleColor={isDark ? 'text-emerald-400' : 'text-emerald-700'}
      subtitle="Performance Tracker"
      badge={momChange !== 0 ? { value: momChange } : undefined}
      isDark={isDark}
      onClick={() => onDetailClick?.()}
    >
      {/* Big metric */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formatCompact(totalSalesAmount)}
          </p>
          <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
            Total Achieved
          </p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {totalSalesCount}
          </p>
          <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Deals</p>
        </div>
      </div>

      {/* Table */}
      {sortedSalespersons.length === 0 ? (
        <div className={`h-24 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No sales data</p>
        </div>
      ) : (
        <div className="max-h-[200px] overflow-y-auto">
          <table className="w-full">
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
                    <td className={`text-xs py-2 text-right ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{pct}%</td>
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
