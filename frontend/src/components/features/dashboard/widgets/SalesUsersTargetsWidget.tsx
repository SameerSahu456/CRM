import React from 'react';
import { Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';

const fmtINR = (v: number) =>
  v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const fmtShort = (v: number) => {
  if (v >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
  if (v >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const pct = d.monthlyTarget > 0 ? Math.round((d.achievedAmount / d.monthlyTarget) * 100) : 0;
  return (
    <div className="bg-white dark:bg-zinc-800 shadow-lg rounded-lg p-3 text-xs border border-slate-200 dark:border-zinc-700">
      <p className="font-semibold text-slate-900 dark:text-white mb-1">{d.userName}</p>
      <p className="text-slate-500 dark:text-zinc-400">Target: {fmtINR(d.monthlyTarget)}</p>
      <p className="text-emerald-600 dark:text-emerald-400">Achieved: {fmtINR(d.achievedAmount)}</p>
      <p className="text-slate-500 dark:text-zinc-400 mt-1">{pct}% achieved</p>
    </div>
  );
};

export const SalesUsersTargetsWidget: React.FC<WidgetProps> = ({ onDetailClick }) => {
  const { mySummary } = useDashboardData();
  const targets: any[] = mySummary?.salesUsersTargets ?? [];
  const isDark = document.documentElement.classList.contains('dark');

  const chartHeight = Math.max(200, targets.length * 40);

  return (
    <AnalyticsCard
      icon={<Target className="w-4 h-4" />}
      iconBg="bg-teal-50 dark:bg-teal-900/30"
      iconColor="text-teal-600 dark:text-teal-400"
      title="Sales Users Targets"
      titleColor="text-teal-700 dark:text-teal-400"
      subtitle={`${targets.length} user${targets.length !== 1 ? 's' : ''} with targets`}
      onClick={() => onDetailClick?.()}
    >
      {targets.length === 0 ? (
        <div className="h-32 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
          <p className="text-xs text-slate-400 dark:text-zinc-500">No target data</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={targets}
              layout="vertical"
              margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#27303f' : '#e2e8f0'} />
              <XAxis
                type="number"
                tickFormatter={fmtShort}
                tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="userName"
                width={90}
                tick={{ fontSize: 10, fill: isDark ? '#d4d4d8' : '#475569' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="monthlyTarget"
                name="Target"
                fill={isDark ? '#475569' : '#cbd5e1'}
                radius={[0, 4, 4, 0]}
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </AnalyticsCard>
  );
};
