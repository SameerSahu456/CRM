import React, { useEffect, useCallback } from 'react';
import { cx } from '@/utils/cx';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
  full: 'max-w-6xl',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  size = 'lg',
  children,
  footer,
  className,
}) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-backdrop"
        onClick={onClose}
      />
      {/* Content */}
      <div
        className={cx(
          'relative w-full max-h-[90vh] rounded-2xl animate-modal flex flex-col overflow-hidden',
          'bg-white/90 backdrop-blur-xl shadow-xl border border-white/60',
          'dark:bg-[rgba(8,14,30,0.95)] dark:border-zinc-800 dark:shadow-2xl',
          sizeStyles[size],
          className
        )}
      >
        {/* Header */}
        {(title || icon) && (
          <div className={cx(
            'flex items-center justify-between px-6 py-4 border-b',
            'border-gray-200 dark:border-zinc-800'
          )}>
            <div className="flex items-center gap-3">
              {icon && (
                <div className={cx(
                  'flex items-center justify-center w-10 h-10 rounded-xl',
                  'bg-brand-50 text-brand-600',
                  'dark:bg-brand-900/30 dark:text-brand-400'
                )}>
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
                )}
                {subtitle && (
                  <p className="text-sm text-gray-500 dark:text-zinc-400">{subtitle}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className={cx(
                'p-2 rounded-lg transition-colors',
                'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                'dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800'
              )}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={cx(
            'flex items-center justify-end gap-3 px-6 py-4 border-t',
            'border-gray-200 bg-gray-50/50',
            'dark:border-zinc-800 dark:bg-dark-200/50'
          )}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
