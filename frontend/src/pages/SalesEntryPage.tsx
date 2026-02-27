import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, X,
  IndianRupee, CheckCircle, AlertCircle,
  Download, Upload,
} from 'lucide-react';
import { salesApi, formatINR, SALES_LIST_FIELDS } from '@/services/api';
import { exportToCsv } from '@/utils/exportCsv';
import { SalesEntry, PaginatedResponse } from '@/types';
import { BulkImportModal } from '@/components/common/BulkImportModal';
import { Card, Button, Input, Select, Badge, Alert, DataTable, DataTableColumn } from '@/components/ui';

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function paymentBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'gray' {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'overdue':
      return 'error';
    case 'cancelled':
      return 'gray';
    default:
      return 'gray';
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SalesEntryPage: React.FC = () => {
  const routerNavigate = useNavigate();

  // Data
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [sales, setSales] = useState<SalesEntry[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  // Loading
  const [isLoading, setIsLoading] = useState(true);
  const [tableError, setTableError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);


  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    setTableError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (filterPaymentStatus) params.paymentStatus = filterPaymentStatus;
      if (searchTerm) params.search = searchTerm;
      if (filterFromDate) params.fromDate = filterFromDate;
      if (filterToDate) params.toDate = filterToDate;
      params.fields = SALES_LIST_FIELDS;

      const response: PaginatedResponse<SalesEntry> = await salesApi.list(params);
      setSales(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);
    } catch (err: any) {
      setTableError(err.message || 'Failed to load sales entries');
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterPaymentStatus, searchTerm, filterFromDate, filterToDate]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  useEffect(() => {
    setPage(1);
  }, [filterPaymentStatus, searchTerm, filterFromDate, filterToDate]);

  // Auto-clear success message
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // ---------------------------------------------------------------------------
  // Navigation handlers (replaced modals)
  // ---------------------------------------------------------------------------

  const openCreateModal = () => routerNavigate('/sales-entry/create');

  const openEditModal = (entry: SalesEntry) => routerNavigate('/sales-entry/edit/' + entry.id);

  const openDetailModal = (entry: SalesEntry) => routerNavigate('/sales-entry/view/' + entry.id);

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  const handleDelete = async (id: string) => {
    try {
      await salesApi.delete(id);
      setDeleteConfirmId(null);
      setSuccessMsg('Entry deleted');
      fetchSales();
    } catch (err: any) {
      setTableError(err.message || 'Failed to delete');
    }
  };

  // ---------------------------------------------------------------------------
  // Filter helpers
  // ---------------------------------------------------------------------------

  const clearFilters = () => {
    setFilterPaymentStatus('');
    setSearchTerm('');
    setFilterFromDate('');
    setFilterToDate('');
  };

  const hasActiveFilters = filterPaymentStatus || searchTerm || filterFromDate || filterToDate;

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------

  const salesColumns: DataTableColumn<SalesEntry>[] = [
    {
      key: 'saleDate',
      label: 'Date',
      render: (entry) => (
        <span className="whitespace-nowrap">{formatDate(entry.saleDate)}</span>
      ),
    },
    {
      key: 'account',
      label: 'Account',
      render: (entry) => (
        <span className="font-medium text-slate-900 dark:text-white">
          {entry.customerName || '-'}
        </span>
      ),
    },
    {
      key: 'product',
      label: 'Product',
      render: (entry) =>
        entry.productNames && entry.productNames.length > 0
          ? entry.productNames.length === 1
            ? entry.productNames[0]
            : entry.productNames.map((name, i) => `${i + 1}. ${name}`).join(', ')
          : entry.productName || '-',
    },
    {
      key: 'customerName',
      label: 'Account Name',
      render: (entry) => entry.customerName || '-',
    },
    {
      key: 'quantity',
      label: 'Qty',
      align: 'center',
      render: (entry) => entry.quantity,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (entry) => (
        <span className="font-semibold whitespace-nowrap text-slate-900 dark:text-white">
          {formatINR(entry.amount)}
        </span>
      ),
    },
    {
      key: 'poNumber',
      label: 'PO #',
      render: (entry) => entry.poNumber || '-',
    },
    {
      key: 'invoiceNo',
      label: 'Invoice #',
      render: (entry) => entry.invoiceNo || '-',
    },
    {
      key: 'paymentStatus',
      label: 'Status',
      render: (entry) => (
        <Badge variant={paymentBadgeVariant(entry.paymentStatus)} size="sm">
          {entry.paymentStatus.charAt(0).toUpperCase() + entry.paymentStatus.slice(1)}
        </Badge>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 animate-fade-in-up">
      {/* Toolbar */}
      <Card padding="none" className="px-3 py-2.5 space-y-2">
        {/* Row 1: Search + Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Input
              type="text"
              placeholder="Search account..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            value={filterPaymentStatus}
            onChange={e => setFilterPaymentStatus(e.target.value)}
            className="lg:w-36"
          >
            <option value="">All Status</option>
            {PAYMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={filterFromDate}
              onChange={e => setFilterFromDate(e.target.value)}
              className="w-[150px]"
              title="From date"
            />
            <span className="text-xs text-slate-400 dark:text-zinc-500">to</span>
            <Input
              type="date"
              value={filterToDate}
              onChange={e => setFilterToDate(e.target.value)}
              className="w-[150px]"
              title="To date"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="xs" onClick={clearFilters} icon={<X className="w-3 h-3" />}>
              Clear Filters
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowBulkImport(true)}
            title="Import from CSV"
            icon={<Upload className="w-3.5 h-3.5" />}
          >
            Import
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportToCsv('sales_entries', [
              { header: 'Date', accessor: (r: SalesEntry) => r.saleDate ? r.saleDate.split('T')[0] : '' },
              { header: 'Account', accessor: (r: SalesEntry) => r.customerName },
              { header: 'Product', accessor: (r: SalesEntry) => r.productNames && r.productNames.length > 0 ? r.productNames.map((n, i) => `${i + 1}. ${n}`).join(', ') : r.productName },
              { header: 'Account Name', accessor: (r: SalesEntry) => r.customerName },
              { header: 'Quantity', accessor: (r: SalesEntry) => r.quantity },
              { header: 'Amount', accessor: (r: SalesEntry) => r.amount },
              { header: 'PO Number', accessor: (r: SalesEntry) => r.poNumber },
              { header: 'Invoice No', accessor: (r: SalesEntry) => r.invoiceNo },
              { header: 'Payment Status', accessor: (r: SalesEntry) => r.paymentStatus },
              { header: 'Notes', accessor: (r: SalesEntry) => r.notes },
            ], sales)}
            disabled={sales.length === 0}
            title="Export to CSV"
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={openCreateModal}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Entry
          </Button>
        </div>
      </Card>

      {/* Status messages */}
      {tableError && (
        <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />} onClose={() => setTableError('')}>
          {tableError}
        </Alert>
      )}
      {successMsg && (
        <Alert variant="success" icon={<CheckCircle className="w-4 h-4" />}>
          {successMsg}
        </Alert>
      )}

      {/* Data Table */}
      <DataTable<SalesEntry>
        columns={salesColumns}
        data={sales}
        isLoading={isLoading}
        loadingMessage="Loading..."
        emptyIcon={<IndianRupee className="w-8 h-8" />}
        emptyMessage={hasActiveFilters ? 'No entries match filters' : 'No entries yet'}
        showIndex
        page={page}
        pageSize={PAGE_SIZE}
        onRowClick={(entry) => openDetailModal(entry)}
        rowKey={(entry) => entry.id}
        pagination={totalPages > 1 ? {
          currentPage: page,
          totalPages,
          totalItems: totalRecords,
          pageSize: PAGE_SIZE,
          onPageChange: setPage,
        } : undefined}
      />

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        entity="sales_entries"
        entityLabel="Sales Entries"
        onSuccess={() => fetchSales()}
      />

    </div>
  );
};
