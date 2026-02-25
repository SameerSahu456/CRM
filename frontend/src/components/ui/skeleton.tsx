import React from 'react';
import { cx } from '@/utils/cx';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  lines = 1,
}) => {
  const baseClass = 'skeleton rounded-lg';

  if (variant === 'circular') {
    return (
      <div
        className={cx(baseClass, 'rounded-full', className)}
        style={{ width: width || 40, height: height || 40 }}
      />
    );
  }

  if (variant === 'rectangular') {
    return (
      <div
        className={cx(baseClass, className)}
        style={{ width: width || '100%', height: height || 120 }}
      />
    );
  }

  // Text variant
  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cx(baseClass, 'h-4', className)}
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cx(baseClass, 'h-4', className)}
      style={{ width: width || '100%', height }}
    />
  );
};
