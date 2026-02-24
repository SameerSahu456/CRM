import React from 'react';
import { Calendar } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps, MonthlyStat } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';
import { formatCompact, pctChange } from '@/utils/dashboard';

export const MonthlyWidget: React.FC<WidgetProps> = ({ isDark, navigate, onDetailClick }) => {
  const { data: all } = useDashboardData();
  const monthly: MonthlyStat[] = Array.isArray(all?.monthlyStats) ? all.monthlyStats : [];

  const monthlyWithChange = monthly.slice(-6).map((m, i, arr) => {
    const prev = i > 0 ? arr[i - 1].revenue : 0;
    return { ...m, change: i > 0 ? pctChange(m.revenue, prev) : 0 };
  });
  const totalMonthlyRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  const totalMonthlyDeals = monthly.reduce((s, m) => s + m.count, 0);
  const monthlyChange = monthly.length >= 2 ? pctChange(monthly[monthly.length - 1].revenue, monthly[monthly.length - 2].revenue) : 0;

  const thClass = `text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`;
  const tdClass = `text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`;
  const tdBold = `text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`;
  const rowBorder = isDark ? 'border-zinc-800/50' : 'border-slate-100';

  return (
    <AnalyticsCard
      icon={<Calendar className="w-4 h-4" />}
      iconBg={isDark ? 'bg-green-900/30' : 'bg-green-50'}
      iconColor={isDark ? 'text-green-400' : 'text-green-600'}
      title="Monthly"
      titleColor={isDark ? 'text-green-400' : 'text-green-700'}
      subtitle="Last 6 Months"
      badge={monthlyChange !== 0 ? { value: monthlyChange } : undefined}
      isDark={isDark}
      onClick={() => onDetailClick?.()}
    >
      {/* Big metric */}
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <p className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formatCompact(totalMonthlyRevenue)}
          </p>
          <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
            Total Revenue
          </p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            {totalMonthlyDeals.toLocaleString()}
          </p>
          <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Deals</p>
        </div>
      </div>

      {/* Mini sparkline */}
      {monthlyWithChange.length > 1 && (
        <div className="mb-3">
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={monthlyWithChange}>
              <Line type="monotone" dataKey="revenue" stroke={isDark ? '#4ade80' : '#16a34a'} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      {monthlyWithChange.length === 0 ? (
        <div className={`h-24 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No monthly data</p>
        </div>
      ) : (
        <div className="max-h-[200px] overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${rowBorder}`}>
                <th className={`${thClass} text-left pb-2`}>Mon</th>
                <th className={`${thClass} text-right pb-2`}>Amount</th>
                <th className={`${thClass} text-right pb-2`}>%</th>
                <th className={`${thClass} text-right pb-2`}>Deals</th>
              </tr>
            </thead>
            <tbody>
              {monthlyWithChange.map((m, i) => (
                <tr key={i} className={`border-b last:border-0 ${rowBorder}`}>
                  <td className={`${tdClass} py-2`}>{m.month.split(' ')[0]?.slice(0, 3) || m.month}</td>
                  <td className={`${tdBold} py-2 text-right`}>{formatCompact(m.revenue)}</td>
                  <td className="py-2 text-right">
                    {i > 0 && (
                      <span className={`text-[10px] font-semibold ${m.change >= 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
                        {m.change >= 0 ? '+' : ''}{m.change}%
                      </span>
                    )}
                  </td>
                  <td className={`${tdClass} py-2 text-right`}>{m.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AnalyticsCard>
  );
};
