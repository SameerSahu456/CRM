import React from 'react';
import { Target } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';

export const LeadsWidget: React.FC<WidgetProps> = ({ isDark, navigate, onDetailClick }) => {
  const { data } = useDashboardData();
  const leadStats: Record<string, number> = data?.leadStats || {};

  const LEAD_STAGES = ['New', 'Proposal', 'Cold', 'Negotiation', 'Closed Lost', 'Closed Won'];
  const totalLeads = (Object.values(leadStats) as number[]).reduce((a, b) => a + b, 0);
  const wonLeads = (leadStats['Closed Won'] as number) || 0;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  const LEAD_COLORS: Record<string, string> = {
    New: '#06b6d4', Proposal: '#a855f7', Cold: '#3b82f6', Negotiation: '#f97316', 'Closed Lost': '#ef4444', 'Closed Won': '#10b981',
  };

  const thClass = `text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`;
  const tdClass = `text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`;
  const tdBold = `text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`;
  const rowBorder = isDark ? 'border-zinc-800/50' : 'border-slate-100';

  return (
    <AnalyticsCard
      icon={<Target className="w-4 h-4" />}
      iconBg={isDark ? 'bg-orange-900/30' : 'bg-orange-50'}
      iconColor={isDark ? 'text-orange-400' : 'text-orange-600'}
      title="Leads"
      titleColor={isDark ? 'text-orange-400' : 'text-orange-700'}
      subtitle="Funnel Analysis"
      isDark={isDark}
      onClick={() => onDetailClick?.()}
    >
      {/* Big metric */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {totalLeads}
          </p>
          <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
            Total Leads
          </p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{conversionRate}%</p>
          <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Conversion</p>
        </div>
      </div>

      {totalLeads === 0 ? (
        <div className={`h-24 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No leads data</p>
        </div>
      ) : (
        <div className="max-h-[200px] overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${rowBorder}`}>
                <th className={`${thClass} text-left pb-2`}>Stage</th>
                <th className={`${thClass} text-right pb-2`}>Count</th>
                <th className={`${thClass} text-right pb-2`}>%</th>
              </tr>
            </thead>
            <tbody>
              {LEAD_STAGES.filter(s => (leadStats[s] ?? 0) > 0).map((stage, i) => {
                const count = (leadStats[stage] as number) || 0;
                const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                return (
                  <tr key={i} className={`border-b last:border-0 ${rowBorder}`}>
                    <td className="py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: LEAD_COLORS[stage] || '#94a3b8' }} />
                        <span className={tdClass}>{stage}</span>
                      </div>
                    </td>
                    <td className={`${tdBold} py-1.5 text-right`}>{count}</td>
                    <td className={`text-xs py-1.5 text-right ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Conversion ring */}
          <div className={`flex items-center justify-center gap-4 pt-3 mt-3 border-t ${rowBorder}`}>
            <div className="relative w-12 h-12">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="18" fill="none" stroke={isDark ? '#1a2535' : '#f1f5f9'} strokeWidth="4" />
                <circle cx="24" cy="24" r="18" fill="none" stroke="#10b981" strokeWidth="4"
                  strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - conversionRate / 100)}`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-[10px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{conversionRate}%</span>
              </div>
            </div>
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Won: {wonLeads}</p>
              <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Lost: {(leadStats['Closed Lost'] as number) || 0}</p>
            </div>
          </div>
        </div>
      )}
    </AnalyticsCard>
  );
};
