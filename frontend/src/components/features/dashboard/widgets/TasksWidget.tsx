import React from 'react';
import { CheckSquare } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps, TaskStatsData } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';

export const TasksWidget: React.FC<WidgetProps> = ({ navigate, onDetailClick }) => {
  const { data: all } = useDashboardData();
  const taskStatsData: TaskStatsData | null = all?.taskStats || null;

  const isDarkMode = document.documentElement.classList.contains('dark');

  const tasksCompleted = taskStatsData?.completed ?? 0;
  const tasksPending = (taskStatsData?.pending ?? 0) + (taskStatsData?.in_progress ?? 0);
  const tasksTotal = tasksCompleted + tasksPending;
  const tasksCompletionPct = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

  return (
    <AnalyticsCard
      icon={<CheckSquare className="w-4 h-4" />}
      iconBg="bg-amber-50 dark:bg-amber-900/30"
      iconColor="text-amber-600 dark:text-amber-400"
      title="Tasks"
      titleColor="text-amber-700 dark:text-amber-400"
      subtitle="Status Overview"
      onClick={() => onDetailClick?.()}
    >
      {/* Completion ring */}
      <div className="flex items-center justify-center gap-5 mb-4">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32" fill="none" stroke={isDarkMode ? '#1a2535' : '#f1f5f9'} strokeWidth="6" />
            <circle cx="40" cy="40" r="32" fill="none" stroke={isDarkMode ? '#10b981' : '#059669'} strokeWidth="6"
              strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 32}`}
              strokeDashoffset={`${2 * Math.PI * 32 * (1 - tasksCompletionPct / 100)}`}
              className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-slate-900 dark:text-white">{tasksCompletionPct}%</span>
            <span className="text-[8px] uppercase tracking-wider text-slate-400 dark:text-zinc-500">Done</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{tasksTotal}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500">Total</p>
          </div>
        </div>
      </div>

      {/* Status rows */}
      <div className="space-y-2">
        {[
          { label: 'Completed', value: tasksCompleted, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'In Progress', value: taskStatsData?.in_progress ?? 0, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Pending', value: taskStatsData?.pending ?? 0, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map(item => (
          <div key={item.label} className={`flex items-center justify-between p-2.5 rounded-xl ${item.bg}`}>
            <span className="text-xs text-slate-600 dark:text-zinc-300">{item.label}</span>
            <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
};
