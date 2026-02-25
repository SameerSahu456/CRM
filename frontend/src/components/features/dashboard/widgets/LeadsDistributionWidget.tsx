import React from 'react';
import { Users } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';

export const LeadsDistributionWidget: React.FC<WidgetProps> = ({ navigate, onDetailClick }) => {
  const { data } = useDashboardData();
  const leadStats: Record<string, number> = data?.leadStats || {};

  const isDark = document.documentElement.classList.contains('dark');

  const totalLeads = (Object.values(leadStats) as number[]).reduce((a, b) => a + b, 0);

  const LEAD_COLORS: Record<string, string> = {
    New: '#06b6d4', Proposal: '#a855f7', Cold: '#3b82f6',
    Negotiation: '#f97316', 'Closed Lost': '#ef4444', 'Closed Won': '#10b981',
  };

  return (
    <AnalyticsCard
      icon={<Users className="w-4 h-4" />}
      iconBg="bg-blue-50 dark:bg-blue-900/30"
      iconColor="text-blue-600 dark:text-blue-400"
      title="Leads Distribution"
      titleColor="text-blue-700 dark:text-blue-400"
      subtitle={`${totalLeads} total leads`}
      onClick={() => onDetailClick?.()}
    >
      {totalLeads === 0 ? (
        <div className="h-44 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
          <p className="text-xs text-slate-400 dark:text-zinc-500">No leads data</p>
        </div>
      ) : (() => {
        const pieData = Object.entries(leadStats)
          .filter(([, v]) => (v as number) > 0)
          .map(([key, value]) => ({ name: key, value: value as number, fill: LEAD_COLORS[key] || '#94a3b8' }));
        return (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={({ active, payload }: any) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className={`px-3 py-2 rounded-xl shadow-lg text-xs border ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                      <p className="font-semibold">{d.name}: {d.value}</p>
                    </div>
                  );
                }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </AnalyticsCard>
  );
};
