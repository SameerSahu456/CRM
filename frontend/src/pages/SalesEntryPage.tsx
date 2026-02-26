import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Trash2, X,
  IndianRupee, CheckCircle, AlertCircle,
  Download, Upload, Edit2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { salesApi, productsApi, partnersApi, formatINR, SALES_LIST_FIELDS } from '@/services/api';
import { exportToCsv } from '@/utils/exportCsv';
import { SalesEntry, Product, Partner, PaginatedResponse } from '@/types';
import { BulkImportModal } from '@/components/common/BulkImportModal';
import { Card, Button, Input, Select, Textarea, Modal, Badge, Alert, DataTable, DataTableColumn } from '@/components/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SalesFormData {
  partnerId: string;
  productId: string;
  customerName: string;
  quantity: number;
  amount: number;
  poNumber: string;
  invoiceNo: string;
  paymentStatus: string;
  saleDate: string;
  notes: string;
}

const EMPTY_FORM: SalesFormData = {
  partnerId: '',
  productId: '',
  customerName: '',
  quantity: 1,
  amount: 0,
  poNumber: '',
  invoiceNo: '',
  paymentStatus: 'pending',
  saleDate: new Date().toISOString().split('T')[0],
  notes: '',
};

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
  const { user } = useAuth();

  // Data
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [sales, setSales] = useState<SalesEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

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

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SalesFormData>({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailEntry, setDetailEntry] = useState<SalesEntry | null>(null);

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

  const fetchDropdownData = useCallback(async () => {
    try {
      const [productsList, partnersResponse] = await Promise.all([
        productsApi.list(),
        partnersApi.list({ limit: '100', status: 'approved' }),
      ]);
      setProducts(Array.isArray(productsList) ? productsList : []);
      const partnerData = partnersResponse?.data ?? partnersResponse;
      setPartners(Array.isArray(partnerData) ? partnerData : []);
    } catch {
      // Dropdown data failure is non-critical
    }
  }, []);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

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
  // Modal handlers
  // ---------------------------------------------------------------------------

  const openCreateModal = () => {
    setFormData({ ...EMPTY_FORM });
    setEditingId(null);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = async (entry: SalesEntry) => {
    // Fetch full record to avoid partial-field overwrites
    let full: any = entry;
    try {
      full = await salesApi.getById(entry.id);
    } catch { /* fall back to list data */ }
    setFormData({
      partnerId: full.partnerId || '',
      productId: full.productId || '',
      customerName: full.customerName || '',
      quantity: full.quantity || 1,
      amount: full.amount || 0,
      poNumber: full.poNumber || '',
      invoiceNo: full.invoiceNo || '',
      paymentStatus: full.paymentStatus || 'pending',
      saleDate: full.saleDate ? full.saleDate.split('T')[0] : '',
      notes: full.notes || '',
    });
    setEditingId(entry.id);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormError('');
  };

  const openDetailModal = (entry: SalesEntry) => {
    setDetailEntry(entry);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailEntry(null);
    setDeleteConfirmId(null);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'amount' ? Number(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.productId || !formData.saleDate) {
      setFormError('Product and Date are required');
      return;
    }
    if (formData.amount <= 0) {
      setFormError('Amount must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await salesApi.update(editingId, { ...formData, salespersonId: user?.id });
        setSuccessMsg('Entry updated');
      } else {
        await salesApi.create({ ...formData, salespersonId: user?.id });
        setSuccessMsg('Entry added');
      }
      closeModal();
      fetchSales();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

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
  // Lookup helpers
  // ---------------------------------------------------------------------------


  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------

  const salesColumns: DataTableColumn<SalesEntry>[] = [
    {
      key: 'saleDate',
      label: 'Date',
      width: '10%',
      render: (entry) => (
        <span className="whitespace-nowrap">{formatDate(entry.saleDate)}</span>
      ),
    },
    {
      key: 'account',
      label: 'Account',
      width: '13%',
      render: (entry) => (
        <span className="font-medium text-slate-900 dark:text-white">
          {entry.customerName || '-'}
        </span>
      ),
    },
    {
      key: 'product',
      label: 'Product',
      width: '15%',
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
      width: '13%',
      render: (entry) => entry.customerName || '-',
    },
    {
      key: 'quantity',
      label: 'Qty',
      width: '6%',
      align: 'center',
      render: (entry) => entry.quantity,
    },
    {
      key: 'amount',
      label: 'Amount',
      width: '12%',
      render: (entry) => (
        <span className="font-semibold whitespace-nowrap text-slate-900 dark:text-white">
          {formatINR(entry.amount)}
        </span>
      ),
    },
    {
      key: 'poNumber',
      label: 'PO #',
      width: '10%',
      render: (entry) => entry.poNumber || '-',
    },
    {
      key: 'invoiceNo',
      label: 'Invoice #',
      width: '10%',
      render: (entry) => entry.invoiceNo || '-',
    },
    {
      key: 'paymentStatus',
      label: 'Status',
      width: '11%',
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

      {/* Detail Modal */}
      <Modal
        open={showDetailModal && !!detailEntry}
        onClose={closeDetailModal}
        title="Sales Entry Details"
        size="md"
      >
        {detailEntry && (
          <div className="space-y-4">
            {/* Action buttons row */}
            <div className="flex items-center justify-between">
              {/* Status badge */}
              <Badge variant={paymentBadgeVariant(detailEntry.paymentStatus)} size="md">
                {detailEntry.paymentStatus.charAt(0).toUpperCase() + detailEntry.paymentStatus.slice(1)}
              </Badge>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => { openEditModal(detailEntry); closeDetailModal(); }}
                  title="Edit"
                  icon={<Edit2 className="w-4 h-4" />}
                />
                {deleteConfirmId === detailEntry.id ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="danger"
                      size="xs"
                      onClick={() => { handleDelete(detailEntry.id); closeDetailModal(); }}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => setDeleteConfirmId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setDeleteConfirmId(detailEntry.id)}
                    title="Delete"
                    icon={<Trash2 className="w-4 h-4" />}
                    className="hover:text-red-600 dark:hover:text-red-400"
                  />
                )}
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 text-sm rounded-xl p-4 bg-slate-50 dark:bg-dark-100">
              <div>
                <p className="text-xs mb-0.5 text-slate-400 dark:text-zinc-500">Date</p>
                <p className="font-medium text-slate-900 dark:text-white">{formatDate(detailEntry.saleDate)}</p>
              </div>
              <div>
                <p className="text-xs mb-0.5 text-slate-400 dark:text-zinc-500">Account</p>
                <p className="font-medium text-slate-900 dark:text-white">{detailEntry.customerName || '-'}</p>
              </div>
              <div>
                <p className="text-xs mb-0.5 text-slate-400 dark:text-zinc-500">Product</p>
                <p className="font-medium text-slate-900 dark:text-white">{detailEntry.productNames && detailEntry.productNames.length > 0
                  ? detailEntry.productNames.length === 1
                    ? detailEntry.productNames[0]
                    : detailEntry.productNames.map((name: string, i: number) => `${i + 1}. ${name}`).join(', ')
                  : detailEntry.productName || '-'}</p>
              </div>
              <div>
                <p className="text-xs mb-0.5 text-slate-400 dark:text-zinc-500">Account Name</p>
                <p className="font-medium text-slate-900 dark:text-white">{detailEntry.customerName || '-'}</p>
              </div>
              <div>
                <p className="text-xs mb-0.5 text-slate-400 dark:text-zinc-500">Quantity</p>
                <p className="font-medium text-slate-900 dark:text-white">{detailEntry.quantity}</p>
              </div>
              <div>
                <p className="text-xs mb-0.5 text-slate-400 dark:text-zinc-500">Amount</p>
                <p className="font-medium text-slate-900 dark:text-white">{formatINR(detailEntry.amount)}</p>
              </div>
              <div>
                <p className="text-xs mb-0.5 text-slate-400 dark:text-zinc-500">PO #</p>
                <p className="font-medium text-slate-900 dark:text-white">{detailEntry.poNumber || '-'}</p>
              </div>
              <div>
                <p className="text-xs mb-0.5 text-slate-400 dark:text-zinc-500">Invoice #</p>
                <p className="font-medium text-slate-900 dark:text-white">{detailEntry.invoiceNo || '-'}</p>
              </div>
            </div>

            {/* Notes */}
            {detailEntry.notes && (
              <div>
                <p className="text-xs mb-1 text-slate-400 dark:text-zinc-500">Notes</p>
                <p className="text-sm text-slate-600 dark:text-zinc-300">{detailEntry.notes}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-3 border-t text-xs border-slate-100 text-slate-400 dark:border-zinc-800 dark:text-zinc-600">
              {detailEntry.createdAt && <p>Created: {new Date(detailEntry.createdAt).toLocaleString()}</p>}
              {detailEntry.updatedAt && <p>Updated: {new Date(detailEntry.updatedAt).toLocaleString()}</p>}
            </div>
          </div>
        )}
      </Modal>

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        entity="sales_entries"
        entityLabel="Sales Entries"
        onSuccess={() => fetchSales()}
      />

      {/* Create / Edit Modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingId ? 'Edit Entry' : 'New Sales Entry'}
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              size="md"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit as any}
              loading={isSubmitting}
              icon={!isSubmitting ? <CheckCircle className="w-4 h-4" /> : undefined}
              shine
            >
              {isSubmitting ? 'Saving...' : editingId ? 'Update Entry' : 'Add Entry'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} id="sales-entry-form">
          <div className="space-y-4">
            {formError && (
              <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
                {formError}
              </Alert>
            )}

            {/* Product */}
            <Select
              label="Product *"
              name="productId"
              value={formData.productId}
              onChange={handleFormChange}
              required
            >
              <option value="">Select product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>

            {/* Customer + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Account Name"
                name="customerName"
                type="text"
                placeholder="Account name"
                value={formData.customerName}
                onChange={handleFormChange}
              />
              <Input
                label="Sale Date *"
                name="saleDate"
                type="date"
                value={formData.saleDate}
                onChange={handleFormChange}
                required
              />
            </div>

            {/* Quantity + Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Quantity"
                name="quantity"
                type="number"
                min={1}
                value={formData.quantity}
                onChange={handleFormChange}
              />
              <Input
                label="Amount (INR) *"
                name="amount"
                type="number"
                min={0}
                step={1}
                placeholder="0"
                value={formData.amount || ''}
                onChange={handleFormChange}
                icon={<IndianRupee className="w-4 h-4" />}
                required
              />
            </div>

            {/* PO + Invoice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="PO Number"
                name="poNumber"
                type="text"
                placeholder="PO number"
                value={formData.poNumber}
                onChange={handleFormChange}
              />
              <Input
                label="Invoice No"
                name="invoiceNo"
                type="text"
                placeholder="Invoice number"
                value={formData.invoiceNo}
                onChange={handleFormChange}
              />
            </div>

            {/* Payment Status */}
            <Select
              label="Payment Status"
              name="paymentStatus"
              value={formData.paymentStatus}
              onChange={handleFormChange}
              options={PAYMENT_STATUSES}
            />

            {/* Notes */}
            <Textarea
              label="Notes"
              name="notes"
              rows={2}
              placeholder="Optional notes..."
              value={formData.notes}
              onChange={handleFormChange}
              className="resize-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
