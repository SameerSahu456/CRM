import React, { useState, useEffect } from 'react';
import { CheckSquare } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps, TaskStatsData } from '../types';
import { dashboardApi } from '../../../services/api';

export const TasksWidget: React.FC<WidgetProps> = ({ isDark, navigate, onDetailClick }) => {
  const [taskStatsData, setTaskStatsData] = useState<TaskStatsData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const all = await dashboardApi.getAll();
        setTaskStatsData(all.taskStats || null);
      } catch {
        // Best-effort
      }
    };
    fetchData();
  }, []);

  const tasksCompleted = taskStatsData?.completed ?? 0;
  const tasksPending = (taskStatsData?.pending ?? 0) + (taskStatsData?.in_progress ?? 0);
  const tasksTotal = tasksCompleted + tasksPending;
  const tasksCompletionPct = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

  return (
    <AnalyticsCard
      icon={<CheckSquare className="w-4 h-4" />}
      iconBg={isDark ? 'bg-amber-900/30' : 'bg-amber-50'}
      iconColor={isDark ? 'text-amber-400' : 'text-amber-600'}
      title="Tasks"
      titleColor={isDark ? 'text-amber-400' : 'text-amber-700'}
      subtitle="Status Overview"
      isDark={isDark}
      onClick={() => onDetailClick?.()}
    >
      {/* Completion ring */}
      <div className="flex items-center justify-center gap-5 mb-4">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32" fill="none" stroke={isDark ? '#27272a' : '#f1f5f9'} strokeWidth="6" />
            <circle cx="40" cy="40" r="32" fill="none" stroke={isDark ? '#10b981' : '#059669'} strokeWidth="6"
              strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 32}`}
              strokeDashoffset={`${2 * Math.PI * 32 * (1 - tasksCompletionPct / 100)}`}
              className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{tasksCompletionPct}%</span>
            <span className={`text-[8px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Done</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div>
            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{tasksTotal}</p>
            <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total</p>
          </div>
        </div>
      </div>

      {/* Status rows */}
      <div className="space-y-2">
        {[
          { label: 'Completed', value: tasksCompleted, color: isDark ? 'text-emerald-400' : 'text-emerald-600', bg: isDark ? 'bg-emerald-900/20' : 'bg-emerald-50' },
          { label: 'In Progress', value: taskStatsData?.in_progress ?? 0, color: isDark ? 'text-blue-400' : 'text-blue-600', bg: isDark ? 'bg-blue-900/20' : 'bg-blue-50' },
          { label: 'Pending', value: taskStatsData?.pending ?? 0, color: isDark ? 'text-amber-400' : 'text-amber-600', bg: isDark ? 'bg-amber-900/20' : 'bg-amber-50' },
        ].map(item => (
          <div key={item.label} className={`flex items-center justify-between p-2.5 rounded-xl ${item.bg}`}>
            <span className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>{item.label}</span>
            <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
};
