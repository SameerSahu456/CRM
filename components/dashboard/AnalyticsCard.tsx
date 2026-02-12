import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface AnalyticsCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  titleColor?: string;
  badge?: { value: number; suffix?: string };
  badgeRight?: React.ReactNode;
  isDark: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  titleColor,
  badge,
  badgeRight,
  isDark,
  onClick,
  children,
  className = ''
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const cardClass = `premium-card ${isDark ? 'bg-[rgba(10,16,32,0.55)] border border-white/[0.06]' : 'bg-white shadow-soft'}`;

  return (
    <div className={`${cardClass} p-4 sm:p-5 ${className} ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-brand-500/30 transition-shadow' : ''}`} onClick={onClick}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <span className={iconColor}>{icon}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-sm font-bold ${titleColor || (isDark ? 'text-white' : 'text-slate-900')}`}>{title}</h3>
              {badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-0.5 ${
                  badge.value >= 0
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {badge.value >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                  {badge.value >= 0 ? '+' : ''}{badge.value}{badge.suffix || '%'}
                </span>
              )}
            </div>
            <p className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {badgeRight}
          <button
            onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
              isDark ? 'hover:bg-white/[0.06] text-zinc-500' : 'hover:bg-slate-100 text-slate-400'
            }`}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {/* Body */}
      {!collapsed && children}
    </div>
  );
};
