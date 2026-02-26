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

export const AssigneeSummaryWidget: React.FC<WidgetProps> = ({ onDetailClick }) => {
  const { data: all } = useDashboardData();
  const rows: AssigneeRow[] = all?.assigneeSummary || [];

  const totalSales = rows.reduce((s, r) => s + r.salesAmount, 0);
  const totalPartners = rows.reduce((s, r) => s + r.partners, 0);
  const totalLeads = rows.reduce((s, r) => s + r.leads, 0);

  const thClass = 'text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500';
  const tdClass = 'text-xs text-slate-700 dark:text-zinc-300';
  const tdBold = 'text-xs font-semibold text-slate-900 dark:text-white';
  const rowBorder = 'border-slate-100 dark:border-zinc-800/50';

  return (
    <AnalyticsCard
      icon={<UserCheck className="w-4 h-4" />}
      iconBg="bg-violet-50 dark:bg-violet-900/30"
      iconColor="text-violet-600 dark:text-violet-400"
      title="Assignee Summary"
      titleColor="text-violet-700 dark:text-violet-400"
      subtitle="Per-user assigned data"
      onClick={() => onDetailClick?.()}
    >
      {/* Summary metrics */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {rows.length}
          </p>
          <p className="text-[10px] uppercase tracking-wider mt-0.5 text-slate-400 dark:text-zinc-500">
            Active Users
          </p>
        </div>
        <div className="text-right flex gap-4">
          <div>
            <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
              {totalPartners}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500">Accounts</p>
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {totalLeads}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500">Leads</p>
          </div>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="h-24 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
          <p className="text-xs text-slate-400 dark:text-zinc-500">No assignee data</p>
        </div>
      ) : (
        <div className="max-h-[220px] overflow-y-auto">
          <table className="premium-table">
            <thead>
              <tr className={`border-b ${rowBorder}`}>
                <th className={`${thClass} text-left pb-2`}>Name</th>
                <th className={`${thClass} text-right pb-2`}>Accounts</th>
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
