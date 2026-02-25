import React, { useState, useRef, useEffect } from 'react';
import { cx } from '@/utils/cx';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, items, align = 'right', className }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className={cx('relative inline-flex', className)}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className={cx(
          'absolute z-50 mt-1 top-full min-w-[180px] rounded-xl border p-1 shadow-lg animate-scale-in',
          'bg-white border-gray-200',
          'dark:bg-dark-50 dark:border-zinc-800',
          align === 'right' ? 'right-0' : 'left-0'
        )}>
          {items.map((item) => {
            if (item.divider) {
              return <div key={item.id} className="my-1 h-px bg-gray-100 dark:bg-zinc-800" />;
            }
            return (
              <button
                key={item.id}
                disabled={item.disabled}
                onClick={() => { item.onClick?.(); setOpen(false); }}
                className={cx(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors text-left',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  item.danger
                    ? 'text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20'
                    : cx(
                        'text-gray-700 hover:bg-gray-50',
                        'dark:text-gray-300 dark:hover:bg-zinc-800'
                      )
                )}
              >
                {item.icon && <span className="flex-shrink-0 w-4 h-4">{item.icon}</span>}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
