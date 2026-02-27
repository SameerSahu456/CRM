import React from 'react';
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';
import { useMiniPagination } from './useMiniPagination';

const fmtDT = (iso: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return iso; }
};

const thCls = 'text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 text-left pb-2';
const tdCls = 'text-xs text-slate-700 dark:text-zinc-300 py-2';
const rowBorder = 'border-slate-100 dark:border-zinc-800/50';

export const MyMeetingsWidget: React.FC<WidgetProps> = ({ onDetailClick }) => {
  const { mySummary } = useDashboardData();
  const meetings: any[] = mySummary?.myMeetings ?? [];
  const { page, setPage, totalPages, pageItems, totalItems } = useMiniPagination(meetings, 5);

  return (
    <AnalyticsCard
      icon={<CalendarClock className="w-4 h-4" />}
      iconBg="bg-cyan-50 dark:bg-cyan-900/30"
      iconColor="text-cyan-600 dark:text-cyan-400"
      title="My Meetings"
      titleColor="text-cyan-700 dark:text-cyan-400"
      subtitle={`${totalItems} meeting${totalItems !== 1 ? 's' : ''}`}
      onClick={() => onDetailClick?.()}
    >
      {meetings.length === 0 ? (
        <div className="h-24 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
          <p className="text-xs text-slate-400 dark:text-zinc-500">No meetings</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="premium-table w-full">
              <thead>
                <tr className={`border-b ${rowBorder}`}>
                  <th className={thCls}>Title</th>
                  <th className={thCls}>From</th>
                  <th className={thCls}>To</th>
                  <th className={thCls}>Contact Name</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((m: any) => (
                  <tr key={m.id} className={`border-b last:border-0 ${rowBorder}`}>
                    <td className={`${tdCls} truncate max-w-[120px] font-medium text-blue-600 dark:text-blue-400`}>{m.title}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>{fmtDT(m.from)}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>{fmtDT(m.to)}</td>
                    <td className={tdCls}>{m.contactName || '—'}</td>
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
