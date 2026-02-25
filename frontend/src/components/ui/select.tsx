import React from 'react';
import { cx } from '@/utils/cx';
import { inputStyles, labelStyles } from './input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, className, id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div>
        {label && (
          <label htmlFor={selectId} className={labelStyles}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cx(
            inputStyles,
            'appearance-none cursor-pointer',
            'bg-[length:16px] bg-[right_12px_center] bg-no-repeat',
            'bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23667085%27 stroke-width=%272%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E")]',
            error && 'border-error-500 focus:border-error-500 focus:ring-error-500',
            className
          )}
          {...props}
        >
          {children || options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{error}</p>}
        {hint && !error && <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
