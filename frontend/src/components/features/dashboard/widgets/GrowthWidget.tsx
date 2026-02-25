import React from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps, DashboardData, GrowthData } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';
import { formatCompact, pctChange } from '@/utils/dashboard';

export const GrowthWidget: React.FC<WidgetProps> = ({ navigate, onDetailClick }) => {
  const { data: all } = useDashboardData();
  const stats: DashboardData | null = all?.stats ?? null;
  const growth: GrowthData | null = all?.growth ?? null;

  const momChange = growth ? pctChange(growth.thisMonth, growth.lastMonth) : 0;

  return (
    <AnalyticsCard
      icon={<TrendingUp className="w-4 h-4" />}
      iconBg="bg-indigo-50 dark:bg-indigo-900/30"
      iconColor="text-indigo-600 dark:text-indigo-400"
      title="Growth"
      titleColor="text-indigo-700 dark:text-indigo-400"
      subtitle="Performance Metrics"
      badge={momChange !== 0 ? { value: momChange } : undefined}
      onClick={() => onDetailClick?.()}
    >
      {/* This Month */}
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatCompact(growth?.thisMonth ?? 0)}
          </p>
          <p className="text-[10px] uppercase tracking-wider mt-0.5 text-slate-400 dark:text-zinc-500">
            This Month
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{stats?.totalCount ?? 0}</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500">Deals</p>
        </div>
      </div>

      {/* Last month + MOM */}
      <div className="p-3 rounded-xl mb-3 bg-slate-50 dark:bg-zinc-900/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500">Last Month</p>
            <p className="text-sm font-semibold mt-0.5 text-slate-900 dark:text-white">{formatCompact(growth?.lastMonth ?? 0)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500">MOM Change</p>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              {momChange >= 0 ? (
                <ArrowUpRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-red-600 dark:text-red-400" />
              )}
              <span className={`text-sm font-semibold ${momChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {momChange >= 0 ? '+' : ''}{momChange}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Total Revenue</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-zinc-400">{formatCompact(stats?.totalSales ?? 0)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Pending Payments</span>
          <span className="text-xs text-slate-500 dark:text-zinc-400">{stats?.pendingPayments ?? 0}</span>
        </div>
      </div>
    </AnalyticsCard>
  );
};
