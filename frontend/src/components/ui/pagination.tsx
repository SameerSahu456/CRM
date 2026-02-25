import React from 'react';
import { cx } from '@/utils/cx';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const startItem = totalItems ? (currentPage - 1) * (pageSize || 10) + 1 : 0;
  const endItem = totalItems ? Math.min(currentPage * (pageSize || 10), totalItems) : 0;

  return (
    <div className={cx(
      'flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3',
      className
    )}>
      {totalItems !== undefined && (
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          Showing <span className="font-medium text-gray-700 dark:text-gray-300">{startItem}</span> to{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">{endItem}</span> of{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">{totalItems}</span> results
        </p>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cx(
            'p-2 rounded-lg transition-colors',
            'disabled:opacity-30 disabled:cursor-not-allowed',
            'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
            'dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800'
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {getVisiblePages().map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 dark:text-zinc-500">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={cx(
                'min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors',
                page === currentPage
                  ? 'bg-brand-600 text-white shadow-sm'
                  : cx(
                      'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                      'dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800'
                    )
              )}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cx(
            'p-2 rounded-lg transition-colors',
            'disabled:opacity-30 disabled:cursor-not-allowed',
            'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
            'dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800'
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};
