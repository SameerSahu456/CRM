import React from 'react';
import { cx } from '@/utils/cx';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeStyles = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cx(
          'rounded-full object-cover ring-2 ring-white dark:ring-zinc-800',
          sizeStyles[size],
          className
        )}
      />
    );
  }

  return (
    <div className={cx(
      'rounded-full flex items-center justify-center font-semibold',
      'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
      'ring-2 ring-white dark:ring-zinc-800',
      sizeStyles[size],
      className
    )}>
      {getInitials(name)}
    </div>
  );
};
