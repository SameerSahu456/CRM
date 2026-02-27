import React from 'react';
import { UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';
import { useMiniPagination } from './useMiniPagination';

const thCls = 'text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 text-left pb-2';
const tdCls = 'text-xs text-slate-700 dark:text-zinc-300 py-2';
const rowBorder = 'border-slate-100 dark:border-zinc-800/50';

export const TodaysLeadsWidget: React.FC<WidgetProps> = ({ onDetailClick }) => {
  const { mySummary } = useDashboardData();
  const leads: any[] = mySummary?.todaysLeads ?? [];
  const { page, setPage, totalPages, pageItems, totalItems } = useMiniPagination(leads, 5);

  return (
    <AnalyticsCard
      icon={<UserPlus className="w-4 h-4" />}
      iconBg="bg-pink-50 dark:bg-pink-900/30"
      iconColor="text-pink-600 dark:text-pink-400"
      title="Today's Leads"
      titleColor="text-pink-700 dark:text-pink-400"
      subtitle={`${totalItems} lead${totalItems !== 1 ? 's' : ''} today`}
      onClick={() => onDetailClick?.()}
    >
      {leads.length === 0 ? (
        <div className="h-24 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
          <p className="text-xs text-slate-400 dark:text-zinc-500">No leads today</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="premium-table w-full">
              <thead>
                <tr className={`border-b ${rowBorder}`}>
                  <th className={thCls}>Lead Name</th>
                  <th className={thCls}>Company</th>
                  <th className={thCls}>Email</th>
                  <th className={thCls}>Phone</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((l: any) => (
                  <tr key={l.id} className={`border-b last:border-0 ${rowBorder}`}>
                    <td className={`${tdCls} font-medium text-blue-600 dark:text-blue-400 truncate max-w-[100px]`}>{l.leadName}</td>
                    <td className={`${tdCls} truncate max-w-[100px]`}>{l.company || '—'}</td>
                    <td className={`${tdCls} truncate max-w-[120px]`}>{l.email || '—'}</td>
                    <td className={tdCls}>{l.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 text-[11px] text-slate-400 dark:text-zinc-500">
              <span>{(page - 1) * 5 + 1} - {Math.min(page * 5, totalItems)}</span>
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
