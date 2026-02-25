import React from 'react';
import { cx } from '@/utils/cx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const inputStyles = cx(
  'w-full px-3 py-2.5 rounded-xl border text-sm transition-all',
  'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
  'focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
  'dark:bg-dark-100 dark:border-zinc-700 dark:text-white dark:placeholder-zinc-500 dark:focus:border-brand-500'
);

export const labelStyles = cx(
  'block text-sm font-medium mb-1.5',
  'text-gray-700 dark:text-gray-300'
);

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconRight, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div>
        {label && (
          <label htmlFor={inputId} className={labelStyles}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-zinc-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cx(
              inputStyles,
              icon && 'pl-10',
              iconRight && 'pr-10',
              error && 'border-error-500 focus:border-error-500 focus:ring-error-500',
              className
            )}
            {...props}
          />
          {iconRight && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 dark:text-zinc-500">
              {iconRight}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{error}</p>}
        {hint && !error && <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
