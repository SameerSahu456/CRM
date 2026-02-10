import React, { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps } from '../types';
import { dashboardApi, formatINR } from '../../../services/api';
import { formatCompact } from '../../../utils/dashboard';

export const PipelineChartWidget: React.FC<WidgetProps> = ({ isDark, navigate }) => {
  const [dealStatsRaw, setDealStatsRaw] = useState<Record<string, { count: number; value: number }>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const all = await dashboardApi.getAll();
        setDealStatsRaw(all.dealStats || {});
      } catch {
        // Best-effort
      }
    };
    fetchData();
  }, []);

  const DEAL_STAGE_ORDER = ['Discovery', 'Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  const pipelineStages = DEAL_STAGE_ORDER
    .filter(s => dealStatsRaw[s])
    .map(s => ({ stage: s, count: dealStatsRaw[s]?.count ?? 0, value: dealStatsRaw[s]?.value ?? 0 }));
  const totalDeals = pipelineStages.reduce((sum, s) => sum + s.count, 0);
  const totalDealValue = pipelineStages.reduce((sum, s) => sum + s.value, 0);

  const PIPELINE_COLORS: Record<string, string> = {
    Discovery: '#06b6d4', Qualification: '#3b82f6', 'Needs Analysis': '#8b5cf6',
    Proposal: '#a855f7', Negotiation: '#f97316', 'Closed Won': '#10b981', 'Closed Lost': '#ef4444',
  };

  return (
    <AnalyticsCard
      icon={<Layers className="w-4 h-4" />}
      iconBg={isDark ? 'bg-purple-900/30' : 'bg-purple-50'}
      iconColor={isDark ? 'text-purple-400' : 'text-purple-600'}
      title="Pipeline Chart"
      titleColor={isDark ? 'text-purple-400' : 'text-purple-700'}
      subtitle={`${totalDeals} deals · ${formatCompact(totalDealValue)}`}
      isDark={isDark}
      onClick={() => navigate('deals')}
    >
      {pipelineStages.length === 0 ? (
        <div className={`h-44 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No pipeline data</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={pipelineStages.map(s => ({
            stage: s.stage.replace('Closed ', 'C.').replace('Needs Analysis', 'Analysis'),
            fullStage: s.stage, count: s.count, value: s.value,
            fill: PIPELINE_COLORS[s.stage] || '#94a3b8',
          }))} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#f1f5f9'} vertical={false} />
            <XAxis dataKey="stage" tick={{ fontSize: 9, fill: isDark ? '#71717a' : '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: isDark ? '#71717a' : '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
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
