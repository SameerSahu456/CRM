import React, { useState } from 'react';
import { cx } from '@/utils/cx';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'enclosed';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'underline',
  className,
}) => {
  if (variant === 'pills') {
    return (
      <div className={cx('flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-dark-200', className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cx(
              'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all',
              tab.id === activeTab
                ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-gray-300'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cx(
                'text-xs px-1.5 py-0.5 rounded-full',
                tab.id === activeTab
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                  : 'bg-gray-200 text-gray-600 dark:bg-zinc-700 dark:text-zinc-400'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Default: underline variant
  return (
    <div className={cx('flex items-center gap-0 border-b border-gray-200 dark:border-zinc-800', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cx(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
            tab.id === activeTab
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-zinc-400 dark:hover:text-gray-300'
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className={cx(
              'text-xs px-1.5 py-0.5 rounded-full',
              tab.id === activeTab
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
