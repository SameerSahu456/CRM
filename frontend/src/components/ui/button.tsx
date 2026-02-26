import React from 'react';
import { cx } from '@/utils/cx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  shine?: boolean;
}

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-xs focus:ring-2 focus:ring-brand-500/30',
  secondary: cx(
    'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 shadow-xs',
    'dark:bg-dark-100 dark:text-gray-300 dark:border-zinc-700 dark:hover:bg-dark-50 dark:active:bg-zinc-800'
  ),
  ghost: cx(
    'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 border border-gray-200',
    'dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 dark:border-zinc-700'
  ),
  danger: 'bg-error-600 text-white hover:bg-error-700 active:bg-error-800 shadow-xs focus:ring-2 focus:ring-error-500/30',
  success: 'bg-success-600 text-white hover:bg-success-700 active:bg-success-800 shadow-xs focus:ring-2 focus:ring-success-500/30',
  outline: cx(
    'border border-brand-600 text-brand-600 hover:bg-brand-50 active:bg-brand-100',
    'dark:border-brand-500 dark:text-brand-400 dark:hover:bg-brand-900/20 dark:active:bg-brand-900/30'
  ),
};

const sizes = {
  xs: 'px-2 py-1 text-xs rounded-md gap-1',
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-5 py-3 text-base rounded-xl gap-2',
  xl: 'px-6 py-3.5 text-base rounded-xl gap-2.5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconRight, shine, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cx(
          'inline-flex items-center justify-center font-semibold transition-all duration-150 cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          shine && 'btn-premium',
          className
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : icon}
        {children}
        {iconRight}
      </button>
    );
  }
);

Button.displayName = 'Button';
