import React from 'react';
import { Layers } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';
import { formatCompact } from '@/utils/dashboard';

export const PipelineWidget: React.FC<WidgetProps> = ({ navigate, onDetailClick }) => {
  const { data } = useDashboardData();
  const dealStatsRaw: Record<string, { count: number; value: number }> = data?.dealStats || {};

  const DEAL_STAGE_ORDER = ['New', 'Proposal', 'Cold', 'Negotiation', 'Closed Lost', 'Closed Won'];
  const pipelineStages = DEAL_STAGE_ORDER
    .filter(s => dealStatsRaw[s])
    .map(s => ({ stage: s, count: dealStatsRaw[s]?.count ?? 0, value: dealStatsRaw[s]?.value ?? 0 }));
  const totalDeals = pipelineStages.reduce((sum, s) => sum + s.count, 0);
  const totalDealValue = pipelineStages.reduce((sum, s) => sum + s.value, 0);
  const wonDeals = dealStatsRaw['Closed Won']?.count ?? 0;
  const lostDeals = dealStatsRaw['Closed Lost']?.count ?? 0;
  const dealWinRate = (wonDeals + lostDeals) > 0 ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100) : 0;

  const PIPELINE_COLORS: Record<string, string> = {
    New: '#06b6d4', Proposal: '#a855f7', Cold: '#3b82f6',
    Negotiation: '#f97316', 'Closed Lost': '#ef4444', 'Closed Won': '#10b981',
  };

  const thClass = 'text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500';
  const tdClass = 'text-xs text-slate-700 dark:text-zinc-300';
  const tdBold = 'text-xs font-semibold text-slate-900 dark:text-white';
  const rowBorder = 'border-slate-100 dark:border-zinc-800/50';

  return (
    <AnalyticsCard
      icon={<Layers className="w-4 h-4" />}
      iconBg="bg-purple-50 dark:bg-purple-900/30"
      iconColor="text-purple-600 dark:text-purple-400"
      title="Deal Stages"
      titleColor="text-purple-700 dark:text-purple-400"
      subtitle="Stage Distribution"
      badgeRight={
        <div className="flex items-center gap-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">{totalDeals}</span>
        </div>
      }
      onClick={() => onDetailClick?.()}
    >
      {/* Big metric */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatCompact(totalDealValue)}
          </p>
          <p className="text-[10px] uppercase tracking-wider mt-0.5 text-slate-400 dark:text-zinc-500">
            Total Value
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{dealWinRate}%</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500">Win Rate</p>
        </div>
      </div>

      {/* Table */}
      {pipelineStages.length === 0 ? (
        <div className="h-24 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
          <p className="text-xs text-slate-400 dark:text-zinc-500">No pipeline data</p>
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
                    <td className="text-xs py-2 text-right text-slate-400 dark:text-zinc-500">{pct}%</td>
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
