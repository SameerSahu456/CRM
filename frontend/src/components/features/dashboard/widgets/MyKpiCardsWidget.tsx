import React from 'react';
import { Briefcase, AlertCircle, Phone, Users } from 'lucide-react';
import { WidgetProps } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';

const cards = [
  { key: 'myOpenDeals', label: 'My Open Deals', icon: Briefcase, bg: 'bg-blue-50 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400', numColor: 'text-blue-700 dark:text-blue-300' },
  { key: 'myUntouchedDeals', label: 'My Untouched Deals', icon: AlertCircle, bg: 'bg-amber-50 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400', numColor: 'text-amber-700 dark:text-amber-300' },
  { key: 'myCallsToday', label: 'My Calls Today', icon: Phone, bg: 'bg-emerald-50 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400', numColor: 'text-emerald-700 dark:text-emerald-300' },
  { key: 'myLeads', label: 'My Leads', icon: Users, bg: 'bg-violet-50 dark:bg-violet-900/30', color: 'text-violet-600 dark:text-violet-400', numColor: 'text-violet-700 dark:text-violet-300' },
] as const;

export const MyKpiCardsWidget: React.FC<WidgetProps> = () => {
  const { mySummary } = useDashboardData();
  const kpi = mySummary?.kpiCards;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {cards.map(c => {
        const Icon = c.icon;
        const val = kpi?.[c.key] ?? 0;
        return (
          <div
            key={c.key}
            className="premium-card rounded-2xl border border-white/60 dark:bg-[rgba(8,14,30,0.6)] dark:border-white/[0.07] p-4 sm:p-5"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${c.bg}`}>
              <Icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-1">{c.label}</p>
            <p className={`text-2xl font-bold tracking-tight ${c.numColor}`}>
              {val.toLocaleString('en-IN')}
            </p>
          </div>
        );
      })}
    </div>
  );
};
