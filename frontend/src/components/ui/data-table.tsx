import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { cx } from '@/utils/cx';
import { Card } from './card';
import { Alert } from './alert';
import { Pagination } from './pagination';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DataTableColumn<T> {
  /** Unique key for the column */
  key: string;
  /** Header label */
  label: string;
  /** CSS width for <col> (e.g. '20%', '150px'). If any column sets this, a <colgroup> is rendered. */
  width?: string;
  /** Text alignment. Defaults to 'left'. */
  align?: 'left' | 'center' | 'right';
  /** Extra className merged onto every <td> in this column */
  className?: string;
  /** Extra className merged onto the <th> */
  headerClassName?: string;
  /** Custom header render (e.g. sortable headers). If omitted, renders label text. */
  headerRender?: () => React.ReactNode;
  /** Cell renderer. Receives the row item and its index within the current page. */
  render: (item: T, index: number) => React.ReactNode;
}

export interface DataTablePagination {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T> {
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Row data for the current page */
  data: T[];

  // --- Loading / Error / Empty ---
  isLoading?: boolean;
  loadingMessage?: string;
  error?: string;
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;

  // --- Row behaviour ---
  /** Called when a row is clicked. If omitted, rows are not styled as clickable. */
  onRowClick?: (item: T, index: number) => void;
  /** Extra className for a row. Merged with the standard row classes. */
  rowClassName?: (item: T, index: number) => string;
  /** Unique key extractor. Defaults to (item as any).id ?? index */
  rowKey?: (item: T, index: number) => string | number;

  // --- Index column ---
  /** Show a leading '#' column with 1-based row numbers (page-aware). */
  showIndex?: boolean;
  /** Current page number (1-based). Used for index calculation. */
  page?: number;
  /** Page size. Used for index calculation. Defaults to 10. */
  pageSize?: number;

  // --- Pagination ---
  pagination?: DataTablePagination;

  /** Extra className on the outer Card wrapper */
  className?: string;
  /** Min-width on the <table> element for tables that scroll horizontally */
  minWidth?: number | string;
}

// ---------------------------------------------------------------------------
// Shared style tokens (single source of truth)
// ---------------------------------------------------------------------------

const hdrCell =
  'px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400';
const cellBase =
  'px-3 py-2.5 text-sm text-gray-700 dark:text-zinc-300';
const rowBase =
  'border-b transition-colors border-gray-100 hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DataTable<T>({
  columns,
  data,
  isLoading,
  loadingMessage = 'Loading…',
  error,
  emptyIcon,
  emptyMessage = 'No data found',
  onRowClick,
  rowClassName,
  rowKey,
  showIndex,
  page = 1,
  pageSize = 10,
  pagination,
  className,
  minWidth,
}: DataTableProps<T>) {
  const hasColWidths = columns.some(c => c.width);
  const totalCols = columns.length + (showIndex ? 1 : 0);

  return (
    <Card padding="none" className={cx('overflow-hidden', className)}>
      {/* Error banner */}
      {error && (
        <div className="m-4">
          <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
            {error}
          </Alert>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">
            {loadingMessage}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table
              className="premium-table w-full"
              style={minWidth ? { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth } : undefined}
            >
              {/* Optional colgroup for explicit column widths */}
              {hasColWidths && (
                <colgroup>
                  {showIndex && <col style={{ width: '5%' }} />}
                  {columns.map(col => (
                    <col key={col.key} style={col.width ? { width: col.width } : undefined} />
                  ))}
                </colgroup>
              )}

              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-700">
                  {showIndex && (
                    <th className={cx(hdrCell, 'index-col text-center')}>#</th>
                  )}
                  {columns.map(col => (
                    <th
                      key={col.key}
                      className={cx(
                        hdrCell,
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right',
                        col.headerClassName,
                      )}
                    >
                      {col.headerRender ? col.headerRender() : col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={totalCols} className="py-16 text-center">
                      {emptyIcon && (
                        <div className="flex justify-center mb-2 text-gray-300 dark:text-zinc-700">
                          {emptyIcon}
                        </div>
                      )}
                      <p className="text-sm text-gray-400 dark:text-zinc-500">
                        {emptyMessage}
                      </p>
                    </td>
                  </tr>
                ) : (
                  data.map((item, idx) => {
                    const key = rowKey ? rowKey(item, idx) : (item as any).id ?? idx;
                    return (
                      <tr
                        key={key}
                        onClick={onRowClick ? () => onRowClick(item, idx) : undefined}
                        className={cx(
                          rowBase,
                          onRowClick && 'cursor-pointer',
                          rowClassName?.(item, idx),
                        )}
                      >
                        {showIndex && (
                          <td className={cx(cellBase, 'index-col text-center text-gray-400 dark:text-zinc-500')}>
                            {(page - 1) * pageSize + idx + 1}
                          </td>
                        )}
                        {columns.map(col => (
                          <td
                            key={col.key}
                            className={cx(
                              cellBase,
                              col.align === 'center' && 'text-center',
                              col.align === 'right' && 'text-right',
                              col.className,
                            )}
                          >
                            {col.render(item, idx)}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="border-t border-gray-100 dark:border-zinc-800">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                onPageChange={pagination.onPageChange}
              />
            </div>
          )}
        </>
      )}
    </Card>
  );
}
