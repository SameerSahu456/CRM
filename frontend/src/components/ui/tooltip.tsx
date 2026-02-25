import React, { useState, useRef } from 'react';
import { cx } from '@/utils/cx';

export interface TooltipProps {
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, side = 'top', children }) => {
  const [visible, setVisible] = useState(false);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className={cx(
          'absolute z-50 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none',
          'bg-gray-900 text-white shadow-lg',
          'dark:bg-zinc-700 dark:text-gray-100',
          'animate-fade-in',
          positionStyles[side]
        )}>
          {content}
        </div>
      )}
    </div>
  );
};
