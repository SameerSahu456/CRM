import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  /** When true, renders children directly inside the modal panel without the default header/body/footer wrapper. Useful for modals with custom internal layout (sticky headers, tabs, etc.) */
  raw?: boolean;
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
  raw,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);

      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={cx(
          'relative w-full max-h-[90vh] flex flex-col',
          'rounded-3xl overflow-hidden',
          'bg-white dark:bg-zinc-900',
          'shadow-[0_20px_60px_rgba(0,0,0,0.25)]',
          'border border-gray-200 dark:border-zinc-800',
          'animate-in fade-in zoom-in-95 duration-200',
          sizeStyles[size],
          className
        )}
      >
        {raw ? children : (
          <>
            {/* Header */}
            {(title || icon) && (
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                  {icon && (
                    <div className="w-11 h-11 flex items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                      {icon}
                    </div>
                  )}
                  <div>
                    {title && (
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="group p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-8 py-5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 flex justify-end gap-3">
                {footer}
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
};