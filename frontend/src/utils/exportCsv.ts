/**
 * Export data as a CSV file that opens cleanly in Excel.
 * Uses BOM prefix so Excel auto-detects UTF-8 encoding.
 * Also logs the export activity.
 */

import { activityLogApi } from '@/services/api';

interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number | undefined | null;
}

export function exportToCsv<T>(
  filename: string,
  columns: ExportColumn<T>[],
  data: T[]
): void {
  if (data.length === 0) return;

  const escape = (val: string): string => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const headerRow = columns.map(c => escape(c.header)).join(',');
  const rows = data.map(row =>
    columns
      .map(col => {
        const val = col.accessor(row);
        if (val === null || val === undefined) return '';
        return escape(String(val));
      })
      .join(',')
  );

  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Log export activity (fire-and-forget)
  activityLogApi.create({
    action: 'export',
    entityType: filename,
    entityName: `Exported ${data.length} ${filename}`,
  }).catch(() => { /* ignore logging errors */ });
}
