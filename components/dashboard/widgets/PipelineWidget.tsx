import React, { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps } from '../types';
import { dashboardApi } from '../../../services/api';
import { formatCompact } from '../../../utils/dashboard';

export const PipelineWidget: React.FC<WidgetProps> = ({ isDark, navigate, onDetailClick }) => {
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
  const wonDeals = dealStatsRaw['Closed Won']?.count ?? 0;
  const lostDeals = dealStatsRaw['Closed Lost']?.count ?? 0;
  const dealWinRate = (wonDeals + lostDeals) > 0 ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100) : 0;

  const PIPELINE_COLORS: Record<string, string> = {
    Discovery: '#06b6d4', Qualification: '#3b82f6', 'Needs Analysis': '#8b5cf6',
    Proposal: '#a855f7', Negotiation: '#f97316', 'Closed Won': '#10b981', 'Closed Lost': '#ef4444',
  };

  const thClass = `text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`;
  const tdClass = `text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`;
  const tdBold = `text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`;
  const rowBorder = isDark ? 'border-zinc-800/50' : 'border-slate-100';

  return (
    <AnalyticsCard
      icon={<Layers className="w-4 h-4" />}
      iconBg={isDark ? 'bg-purple-900/30' : 'bg-purple-50'}
      iconColor={isDark ? 'text-purple-400' : 'text-purple-600'}
      title="Pipeline"
      titleColor={isDark ? 'text-purple-400' : 'text-purple-700'}
      subtitle="Stage Distribution"
      badgeRight={
        <div className="flex items-center gap-1">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-600'}`}>{totalDeals}</span>
        </div>
      }
      isDark={isDark}
      onClick={() => onDetailClick?.()}
    >
      {/* Big metric */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formatCompact(totalDealValue)}
          </p>
          <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
            Total Value
          </p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{dealWinRate}%</p>
          <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Win Rate</p>
        </div>
      </div>

      {/* Table */}
      {pipelineStages.length === 0 ? (
        <div className={`h-24 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No pipeline data</p>
        </div>
      ) : (
        <div className="max-h-[200px] overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${rowBorder}`}>
                <th className={`${thClass} text-left pb-2`}>Stage</th>
                <th className={`${thClass} text-right pb-2`}>Amount</th>
                <th className={`${thClass} text-right pb-2`}>%</th>
              </tr>
            </thead>
            <tbody>
              {pipelineStages.map((s, i) => {
                const pct = totalDealValue > 0 ? Math.round((s.value / totalDealValue) * 100) : 0;
                return (
                  <tr key={i} className={`border-b last:border-0 ${rowBorder}`}>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIPELINE_COLORS[s.stage] || '#94a3b8' }} />
                        <span className={`${tdClass} truncate`}>{s.stage}</span>
                      </div>
                    </td>
                    <td className={`${tdBold} py-2 text-right`}>{formatCompact(s.value)}</td>
                    <td className={`text-xs py-2 text-right ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{pct}%</td>
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
