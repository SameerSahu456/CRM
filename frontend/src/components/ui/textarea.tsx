import React from 'react';
import { cx } from '@/utils/cx';
import { inputStyles, labelStyles } from './input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div>
        {label && (
          <label htmlFor={textareaId} className={labelStyles}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cx(
            inputStyles,
            'min-h-[80px] resize-y',
            error && 'border-error-500 focus:border-error-500 focus:ring-error-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{error}</p>}
        {hint && !error && <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
