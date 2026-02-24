import React from 'react';
import { UserCheck } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';
import { formatCompact } from '@/utils/dashboard';

interface AssigneeRow {
  userId: string;
  userName: string;
  partners: number;
  leads: number;
  deals: number;
  dealValue: number;
  salesCount: number;
  salesAmount: number;
}

export const AssigneeSummaryWidget: React.FC<WidgetProps> = ({ isDark, onDetailClick }) => {
  const { data: all } = useDashboardData();
  const rows: AssigneeRow[] = all?.assigneeSummary || [];

  const totalSales = rows.reduce((s, r) => s + r.salesAmount, 0);
  const totalPartners = rows.reduce((s, r) => s + r.partners, 0);
  const totalLeads = rows.reduce((s, r) => s + r.leads, 0);

  const thClass = `text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`;
  const tdClass = `text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`;
  const tdBold = `text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`;
  const rowBorder = isDark ? 'border-zinc-800/50' : 'border-slate-100';

  return (
    <AnalyticsCard
      icon={<UserCheck className="w-4 h-4" />}
      iconBg={isDark ? 'bg-violet-900/30' : 'bg-violet-50'}
      iconColor={isDark ? 'text-violet-400' : 'text-violet-600'}
      title="Assignee Summary"
      titleColor={isDark ? 'text-violet-400' : 'text-violet-700'}
      subtitle="Per-user assigned data"
      isDark={isDark}
      onClick={() => onDetailClick?.()}
    >
      {/* Summary metrics */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {rows.length}
          </p>
          <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
            Active Users
          </p>
        </div>
        <div className="text-right flex gap-4">
          <div>
            <p className={`text-lg font-bold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
              {totalPartners}
            </p>
            <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Partners</p>
          </div>
          <div>
            <p className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {totalLeads}
            </p>
            <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Leads</p>
          </div>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className={`h-24 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No assignee data</p>
        </div>
      ) : (
        <div className="max-h-[220px] overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${rowBorder}`}>
                <th className={`${thClass} text-left pb-2`}>Name</th>
                <th className={`${thClass} text-right pb-2`}>Partners</th>
                <th className={`${thClass} text-right pb-2`}>Leads</th>
                <th className={`${thClass} text-right pb-2`}>Deals</th>
                <th className={`${thClass} text-right pb-2`}>Sales</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 15).map((r, i) => (
                <tr key={r.userId || i} className={`border-b last:border-0 ${rowBorder}`}>
                  <td className={`${tdClass} py-2 truncate max-w-[100px]`}>{r.userName}</td>
                  <td className={`${tdClass} py-2 text-right`}>{r.partners}</td>
                  <td className={`${tdClass} py-2 text-right`}>{r.leads}</td>
                  <td className={`${tdClass} py-2 text-right`}>{r.deals}</td>
                  <td className={`${tdBold} py-2 text-right`}>{formatCompact(r.salesAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AnalyticsCard>
  );
};
