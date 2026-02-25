import React from 'react';
import { cx } from '@/utils/cx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ glass = true, hover = false, padding = 'md', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cx(
          'rounded-2xl border transition-all',
          glass && 'premium-card',
          glass
            ? cx(
                'bg-white/80 border-white/60 shadow-glass backdrop-blur-xl',
                'dark:bg-[rgba(8,14,30,0.6)] dark:border-white/[0.07] dark:shadow-glass-dark dark:backdrop-blur-xl'
              )
            : cx(
                'bg-white border-gray-200 shadow-xs',
                'dark:bg-gray-900 dark:border-gray-800'
              ),
          hover && 'hover-lift cursor-pointer',
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
