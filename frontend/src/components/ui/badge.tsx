import React from 'react';
import { cx } from '@/utils/cx';

export interface BadgeProps {
  variant?: 'gray' | 'brand' | 'error' | 'warning' | 'success' | 'cyan' | 'purple' | 'amber' | 'blue' | 'red' | 'green' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  gray: 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
  error: 'bg-error-50 text-error-700 dark:bg-red-900/30 dark:text-error-400',
  warning: 'bg-warning-50 text-warning-700 dark:bg-amber-900/30 dark:text-warning-400',
  success: 'bg-success-50 text-success-700 dark:bg-emerald-900/30 dark:text-success-400',
  cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  green: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const dotColors = {
  gray: 'bg-gray-500',
  brand: 'bg-brand-500',
  error: 'bg-error-500',
  warning: 'bg-warning-500',
  success: 'bg-success-500',
  cyan: 'bg-cyan-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'gray', size = 'md', dot, children, className }) => {
  return (
    <span className={cx(
      'inline-flex items-center rounded-full font-medium gap-1.5',
      variantStyles[variant],
      sizeStyles[size],
      className
    )}>
      {dot && <span className={cx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
};
