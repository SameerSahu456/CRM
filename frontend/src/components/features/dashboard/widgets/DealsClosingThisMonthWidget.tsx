import React from 'react';
import { Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';
import { useMiniPagination } from './useMiniPagination';
import { formatCompact } from '@/utils/dashboard';

const stageColor: Record<string, string> = {
  New: 'bg-cyan-400',
  Proposal: 'bg-violet-400',
  Cold: 'bg-blue-400',
  Negotiation: 'bg-amber-400',
};

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return d; }
};

const fmtINR = (v: number) => v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const thCls = 'text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 text-left pb-2';
const tdCls = 'text-xs text-slate-700 dark:text-zinc-300 py-2';
const rowBorder = 'border-slate-100 dark:border-zinc-800/50';

export const DealsClosingThisMonthWidget: React.FC<WidgetProps> = ({ onDetailClick }) => {
  const { mySummary } = useDashboardData();
  const deals: any[] = mySummary?.dealsClosingThisMonth ?? [];
  const { page, setPage, totalPages, pageItems, totalItems } = useMiniPagination(deals, 5);
  const totalValue = deals.reduce((s: number, d: any) => s + (d.value || 0), 0);

  return (
    <AnalyticsCard
      icon={<Briefcase className="w-4 h-4" />}
      iconBg="bg-orange-50 dark:bg-orange-900/30"
      iconColor="text-orange-600 dark:text-orange-400"
      title="My Deals Closing This Month"
      titleColor="text-orange-700 dark:text-orange-400"
      subtitle={`${totalItems} deal${totalItems !== 1 ? 's' : ''} | ${formatCompact(totalValue)}`}
      onClick={() => onDetailClick?.()}
    >
      {deals.length === 0 ? (
        <div className="h-24 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
          <p className="text-xs text-slate-400 dark:text-zinc-500">No deals closing this month</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="premium-table w-full">
              <thead>
                <tr className={`border-b ${rowBorder}`}>
                  <th className={thCls}>Title</th>
                  <th className={thCls}>Company</th>
                  <th className={`${thCls} text-right`}>Value</th>
                  <th className={thCls}>Stage</th>
                  <th className={thCls}>Closing Date</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((d: any) => (
                  <tr key={d.id} className={`border-b last:border-0 ${rowBorder}`}>
                    <td className={`${tdCls} font-medium truncate max-w-[120px]`}>{d.title}</td>
                    <td className={`${tdCls} truncate max-w-[100px]`}>{d.company || '—'}</td>
                    <td className={`${tdCls} text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap`}>{fmtINR(d.value || 0)}</td>
                    <td className={tdCls}>
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${stageColor[d.stage] || 'bg-slate-300'}`} />
                        <span className="text-[10px]">{d.stage}</span>
                      </span>
                    </td>
                    <td className={tdCls}>{fmtDate(d.closingDate)}</td>
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
