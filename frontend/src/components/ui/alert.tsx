import React from 'react';
import { cx } from '@/utils/cx';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const variantStyles = {
  info: {
    container: 'bg-brand-50 border-brand-200 dark:bg-brand-900/20 dark:border-brand-800',
    icon: 'text-brand-600 dark:text-brand-400',
    title: 'text-brand-800 dark:text-brand-300',
    text: 'text-brand-700 dark:text-brand-400',
  },
  success: {
    container: 'bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-800',
    icon: 'text-success-600 dark:text-success-400',
    title: 'text-success-800 dark:text-success-300',
    text: 'text-success-700 dark:text-success-400',
  },
  warning: {
    container: 'bg-warning-50 border-warning-200 dark:bg-warning-900/20 dark:border-warning-800',
    icon: 'text-warning-600 dark:text-warning-400',
    title: 'text-warning-800 dark:text-warning-300',
    text: 'text-warning-700 dark:text-warning-400',
  },
  error: {
    container: 'bg-error-50 border-error-200 dark:bg-error-900/20 dark:border-error-800',
    icon: 'text-error-600 dark:text-error-400',
    title: 'text-error-800 dark:text-error-300',
    text: 'text-error-700 dark:text-error-400',
  },
};

export const Alert: React.FC<AlertProps> = ({ variant = 'info', title, children, icon, onClose, className }) => {
  const styles = variantStyles[variant];
  return (
    <div className={cx('flex gap-3 p-4 rounded-xl border', styles.container, className)}>
      {icon && <div className={cx('flex-shrink-0 mt-0.5', styles.icon)}>{icon}</div>}
      <div className="flex-1 min-w-0">
        {title && <p className={cx('text-sm font-semibold mb-1', styles.title)}>{title}</p>}
        <div className={cx('text-sm', styles.text)}>{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className={cx('flex-shrink-0 p-1 rounded-lg hover:bg-black/5', styles.icon)}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
