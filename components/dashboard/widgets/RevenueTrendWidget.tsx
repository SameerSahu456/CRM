import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps, MonthlyStat } from '../types';
import { dashboardApi, formatINR } from '../../../services/api';
import { pctChange } from '../../../utils/dashboard';

export const RevenueTrendWidget: React.FC<WidgetProps> = ({ isDark, navigate, onDetailClick }) => {
  const [monthly, setMonthly] = useState<MonthlyStat[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const all = await dashboardApi.getAll();
        setMonthly(Array.isArray(all.monthlyStats) ? all.monthlyStats : []);
      } catch {
        // Best-effort
      }
    };
    fetchData();
  }, []);

  const monthlyChange = monthly.length >= 2 ? pctChange(monthly[monthly.length - 1].revenue, monthly[monthly.length - 2].revenue) : 0;

  return (
    <AnalyticsCard
      icon={<BarChart3 className="w-4 h-4" />}
      iconBg={isDark ? 'bg-brand-900/30' : 'bg-brand-50'}
      iconColor={isDark ? 'text-brand-400' : 'text-brand-600'}
      title="Revenue Trend"
      titleColor={isDark ? 'text-brand-400' : 'text-brand-700'}
      subtitle={`Last ${monthly.length} months`}
      badge={monthlyChange !== 0 ? { value: monthlyChange } : undefined}
      isDark={isDark}
      onClick={() => onDetailClick?.()}
    >
      {monthly.length === 0 ? (
        <div className={`h-44 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No data</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDark ? '#818cf8' : '#6366f1'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isDark ? '#818cf8' : '#6366f1'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1a2535' : '#f1f5f9'} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: isDark ? '#64748b' : '#94a3b8' }} tickLine={false} axisLine={false}
              tickFormatter={(v: string) => v.split(' ')[0]?.slice(0, 3) || v} />
            <YAxis tick={{ fontSize: 10, fill: isDark ? '#64748b' : '#94a3b8' }} tickLine={false} axisLine={false}
              tickFormatter={(v: number) => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
            <Tooltip content={({ active, payload, label }: any) => {
              if (!active || !payload?.length) return null;
              return (
                <div className={`px-3 py-2 rounded-xl shadow-lg text-xs border ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                  <p className={`font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>{label}</p>
                  <p className="font-semibold" style={{ color: isDark ? '#818cf8' : '#6366f1' }}>Revenue: {formatINR(payload[0].value)}</p>
                </div>
              );
            }} />
            <Area type="monotone" dataKey="revenue" stroke={isDark ? '#818cf8' : '#6366f1'} strokeWidth={2.5} fill="url(#dashGrad)"
              dot={{ fill: isDark ? '#818cf8' : '#6366f1', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: isDark ? '#818cf8' : '#6366f1', stroke: isDark ? '#111a2e' : '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </AnalyticsCard>
  );
};
