import React from 'react';
import { ListTodo, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';
import { useMiniPagination } from './useMiniPagination';

const statusBadge = (s: string) => {
  const lc = s?.toLowerCase() ?? '';
  if (lc === 'in_progress' || lc === 'in progress') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (lc === 'completed') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
};

const priorityBadge = (p: string) => {
  const lc = p?.toLowerCase() ?? '';
  if (lc === 'high') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (lc === 'medium') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400';
};

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return d; }
};

const thCls = 'text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 text-left pb-2';
const tdCls = 'text-xs text-slate-700 dark:text-zinc-300 py-2';
const rowBorder = 'border-slate-100 dark:border-zinc-800/50';

export const MyOpenTasksWidget: React.FC<WidgetProps> = ({ onDetailClick }) => {
  const { mySummary } = useDashboardData();
  const tasks: any[] = mySummary?.myOpenTasks ?? [];
  const { page, setPage, totalPages, pageItems, totalItems } = useMiniPagination(tasks, 10);

  return (
    <AnalyticsCard
      icon={<ListTodo className="w-4 h-4" />}
      iconBg="bg-indigo-50 dark:bg-indigo-900/30"
      iconColor="text-indigo-600 dark:text-indigo-400"
      title="My Open Tasks"
      titleColor="text-indigo-700 dark:text-indigo-400"
      subtitle={`${totalItems} task${totalItems !== 1 ? 's' : ''}`}
      onClick={() => onDetailClick?.()}
    >
      {tasks.length === 0 ? (
        <div className="h-24 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
          <p className="text-xs text-slate-400 dark:text-zinc-500">No open tasks</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="premium-table w-full">
              <thead>
                <tr className={`border-b ${rowBorder}`}>
                  <th className={thCls}>Subject</th>
                  <th className={thCls}>Due Date</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Priority</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((t: any) => (
                  <tr key={t.id} className={`border-b last:border-0 ${rowBorder}`}>
                    <td className={`${tdCls} truncate max-w-[150px]`}>{t.subject}</td>
                    <td className={tdCls}>{fmtDate(t.dueDate)}</td>
                    <td className={tdCls}>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge(t.status)}`}>
                        {t.status === 'in_progress' ? 'In Progress' : (t.status || 'Pending')}
                      </span>
                    </td>
                    <td className={tdCls}>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityBadge(t.priority)}`}>
                        {t.priority || 'Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 text-[11px] text-slate-400 dark:text-zinc-500">
              <span>{(page - 1) * 10 + 1} - {Math.min(page * 10, totalItems)}</span>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30"><ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          )}
        </>
      )}
    </AnalyticsCard>
  );
};
