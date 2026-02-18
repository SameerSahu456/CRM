import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps, DashboardData, GrowthData } from '@/types';
import { dashboardApi } from '@/services/api';
import { formatCompact, pctChange } from '@/utils/dashboard';

export const GrowthWidget: React.FC<WidgetProps> = ({ isDark, navigate, onDetailClick }) => {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [growth, setGrowth] = useState<GrowthData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const all = await dashboardApi.getAll();
        setStats(all.stats);
        setGrowth(all.growth);
      } catch {
        // Best-effort
      }
    };
    fetchData();
  }, []);

  const momChange = growth ? pctChange(growth.thisMonth, growth.lastMonth) : 0;

  return (
    <AnalyticsCard
      icon={<TrendingUp className="w-4 h-4" />}
      iconBg={isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'}
      iconColor={isDark ? 'text-indigo-400' : 'text-indigo-600'}
      title="Growth"
      titleColor={isDark ? 'text-indigo-400' : 'text-indigo-700'}
      subtitle="Performance Metrics"
      badge={momChange !== 0 ? { value: momChange } : undefined}
      isDark={isDark}
      onClick={() => onDetailClick?.()}
    >
      {/* This Month */}
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <p className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formatCompact(growth?.thisMonth ?? 0)}
          </p>
          <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
            This Month
          </p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{stats?.totalCount ?? 0}</p>
          <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Deals</p>
        </div>
      </div>

      {/* Last month + MOM */}
      <div className={`p-3 rounded-xl mb-3 ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Last Month</p>
            <p className={`text-sm font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCompact(growth?.lastMonth ?? 0)}</p>
          </div>
          <div className="text-right">
            <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>MOM Change</p>
            <div className={`flex items-center justify-end gap-1 mt-0.5`}>
              {momChange >= 0 ? (
                <ArrowUpRight className={`w-3 h-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              ) : (
                <ArrowDownRight className={`w-3 h-3 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              )}
              <span className={`text-sm font-semibold ${momChange >= 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
                {momChange >= 0 ? '+' : ''}{momChange}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="space-y-2">
        <div className={`flex items-center justify-between p-2.5 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
          <span className={`text-xs font-semibold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Total Revenue</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{formatCompact(stats?.totalSales ?? 0)}</span>
          </div>
        </div>
        <div className={`flex items-center justify-between p-2.5 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
          <span className={`text-xs font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Pending Payments</span>
          <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{stats?.pendingPayments ?? 0}</span>
        </div>
      </div>
    </AnalyticsCard>
  );
};
