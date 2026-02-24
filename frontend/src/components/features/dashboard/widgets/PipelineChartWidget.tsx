import React from 'react';
import { Layers } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps } from '@/types';
import { formatINR } from '@/services/api';
import { useDashboardData } from '@/contexts/DashboardDataContext';
import { formatCompact } from '@/utils/dashboard';

export const PipelineChartWidget: React.FC<WidgetProps> = ({ isDark, navigate, onDetailClick }) => {
  const { data } = useDashboardData();
  const dealStatsRaw: Record<string, { count: number; value: number }> = data?.dealStats || {};

  const DEAL_STAGE_ORDER = ['New', 'Proposal', 'Cold', 'Negotiation', 'Closed Lost', 'Closed Won'];
  const pipelineStages = DEAL_STAGE_ORDER
    .filter(s => dealStatsRaw[s])
    .map(s => ({ stage: s, count: dealStatsRaw[s]?.count ?? 0, value: dealStatsRaw[s]?.value ?? 0 }));
  const totalDeals = pipelineStages.reduce((sum, s) => sum + s.count, 0);
  const totalDealValue = pipelineStages.reduce((sum, s) => sum + s.value, 0);

  const PIPELINE_COLORS: Record<string, string> = {
    New: '#06b6d4', Proposal: '#a855f7', Cold: '#3b82f6', Negotiation: '#f97316', 'Closed Lost': '#ef4444', 'Closed Won': '#10b981',
  };

  return (
    <AnalyticsCard
      icon={<Layers className="w-4 h-4" />}
      iconBg={isDark ? 'bg-purple-900/30' : 'bg-purple-50'}
      iconColor={isDark ? 'text-purple-400' : 'text-purple-600'}
      title="Kanban Chart"
      titleColor={isDark ? 'text-purple-400' : 'text-purple-700'}
      subtitle={`${totalDeals} deals · ${formatCompact(totalDealValue)}`}
      isDark={isDark}
      onClick={() => onDetailClick?.()}
    >
      {pipelineStages.length === 0 ? (
        <div className={`h-44 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No pipeline data</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={pipelineStages.map(s => ({
            stage: s.stage.replace('Closed ', 'C.'),
            fullStage: s.stage, count: s.count, value: s.value,
            fill: PIPELINE_COLORS[s.stage] || '#94a3b8',
          }))} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1a2535' : '#f1f5f9'} vertical={false} />
            <XAxis dataKey="stage" tick={{ fontSize: 9, fill: isDark ? '#64748b' : '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: isDark ? '#64748b' : '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className={`px-3 py-2 rounded-xl shadow-lg text-xs border ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                  <p className="font-semibold">{d.fullStage}</p>
                  <p>{d.count} deals &middot; {formatINR(d.value)}</p>
                </div>
              );
            }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={32}>
              {pipelineStages.map((s, i) => (
                <Cell key={i} fill={PIPELINE_COLORS[s.stage] || '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </AnalyticsCard>
  );
};
