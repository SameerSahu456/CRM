import React from 'react';
import { cx } from '@/utils/cx';

/* ===== Table Root ===== */
export interface TableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({ children, className, ...props }) => (
  <div className={cx('overflow-x-auto rounded-xl', className)} {...props}>
    <table className="w-full text-sm">
      {children}
    </table>
  </div>
);

/* ===== Table Header ===== */
export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className, ...props }) => (
  <thead className={cx(
    'sticky top-0 z-10',
    'bg-gray-50 dark:bg-dark-200',
    className
  )} {...props}>
    {children}
  </thead>
);

/* ===== Table Head Cell ===== */
export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => (
  <th className={cx(
    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider',
    'text-gray-500 dark:text-zinc-400',
    className
  )} {...props}>
    {children}
  </th>
);

/* ===== Table Body ===== */
export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className, ...props }) => (
  <tbody className={cx(
    'divide-y divide-gray-100 dark:divide-zinc-800/50',
    className
  )} {...props}>
    {children}
  </tbody>
);

/* ===== Table Row ===== */
export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, className, ...props }) => (
  <tr className={cx(
    'transition-colors',
    'hover:bg-brand-50/30 dark:hover:bg-brand-900/10',
    className
  )} {...props}>
    {children}
  </tr>
);

/* ===== Table Cell ===== */
export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => (
  <td className={cx(
    'px-4 py-3 text-gray-700 dark:text-gray-300',
    className
  )} {...props}>
    {children}
  </td>
);

/* ===== Empty State ===== */
export interface TableEmptyProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  colSpan?: number;
}

export const TableEmpty: React.FC<TableEmptyProps> = ({
  icon,
  title = 'No data found',
  description,
  colSpan = 10,
}) => (
  <tr>
    <td colSpan={colSpan} className="text-center py-16">
      <div className="flex flex-col items-center gap-3">
        {icon && <div className="text-gray-300 dark:text-zinc-600">{icon}</div>}
        <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">{title}</p>
        {description && <p className="text-xs text-gray-400 dark:text-zinc-500">{description}</p>}
      </div>
    </td>
  </tr>
);
