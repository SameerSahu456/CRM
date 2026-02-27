import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cx } from '@/utils/cx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const inputStyles = cx(
  'w-full px-3 py-2.5 rounded-xl border text-sm transition-all',
  'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
  'focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
  'dark:bg-transparent dark:border-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-400 dark:focus:border-brand-500'
);

export const labelStyles = cx(
  'block text-sm font-medium mb-1.5',
  'text-gray-700 dark:text-gray-300'
);

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconRight, showPasswordToggle = true, className, id, type, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const isPasswordField = type === 'password';
    const shouldShowToggle = isPasswordField && showPasswordToggle;
    const resolvedType = shouldShowToggle ? (isPasswordVisible ? 'text' : 'password') : type;

    return (
      <div>
        {label && (
          <label htmlFor={inputId} className={labelStyles}>
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            className={cx(
              inputStyles,
              icon ? 'pl-10' : undefined,
              (iconRight || shouldShowToggle) ? 'pr-10' : undefined,
              error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : undefined,
              className
            )}
            {...props}
          />
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-zinc-300">
              {icon}
            </div>
          )}
          {iconRight && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 dark:text-zinc-300">
              {iconRight}
            </div>
          )}
          {shouldShowToggle && (
            <button
              type="button"
              onClick={() => setIsPasswordVisible(v => !v)}
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{error}</p>}
        {hint && !error && <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
