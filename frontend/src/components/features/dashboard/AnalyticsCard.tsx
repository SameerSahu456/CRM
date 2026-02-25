import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, ChevronUp, ChevronDown } from 'lucide-react';
import { cx } from '@/utils/cx';

interface AnalyticsCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  titleColor?: string;
  badge?: { value: number; suffix?: string };
  badgeRight?: React.ReactNode;
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
  onClick,
  children,
  className = ''
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cx(
        'premium-card rounded-2xl overflow-hidden',
        'border border-white/60 dark:bg-[rgba(8,14,30,0.6)] dark:border-white/[0.07]',
        className,
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
              <span className={iconColor}>{icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={cx('text-sm font-bold truncate', titleColor || 'text-slate-900 dark:text-white')}>{title}</h3>
                {badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-0.5 flex-shrink-0 ${
                    badge.value >= 0
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {badge.value >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                    {badge.value >= 0 ? '+' : ''}{badge.value}{badge.suffix || '%'}
                  </span>
                )}
              </div>
              <p className="text-[11px] truncate text-slate-400 dark:text-zinc-500">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            {badgeRight}
            <button
              onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
              className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100 text-slate-400 dark:hover:bg-white/[0.06] dark:text-zinc-500"
            >
              {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        {/* Body */}
        <div className={`transition-all duration-300 ${collapsed ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-[600px] opacity-100'}`}>
          {children}
        </div>
      </div>
    </div>
  );
};
