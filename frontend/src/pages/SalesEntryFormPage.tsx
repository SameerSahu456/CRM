import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Trash2,
  Loader2, AlertCircle, CheckCircle,
  Calendar, Package, IndianRupee,
  FileText, CreditCard, ShoppingCart,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { salesApi, productsApi, formatINR } from '@/services/api';
import { Product, SalesEntry } from '@/types';
import { Card, Button, Input, Select, Badge, Alert, Textarea, SearchableSelect } from '@/components/ui';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SalesFormData {
  productIds: string[];
  customerName: string;
  saleDate: string;
  quantity: number;
  amount: number;
  poNumber: string;
  invoiceNo: string;
  paymentStatus: string;
  notes: string;
}

const EMPTY_FORM: SalesFormData = {
  productIds: [],
  customerName: '',
  saleDate: new Date().toISOString().split('T')[0],
  quantity: 1,
  amount: 0,
  poNumber: '',
  invoiceNo: '',
  paymentStatus: 'pending',
  notes: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
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

const paymentBadgeVariant = (status: string) => {
  switch (status) {
    case 'paid':
      return 'emerald';
    case 'overdue':
      return 'red';
    case 'cancelled':
      return 'gray';
    default:
      return 'amber';
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SalesEntryFormPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const mode: 'create' | 'edit' | 'view' = location.pathname.includes('/create')
    ? 'create'
    : location.pathname.includes('/edit/')
      ? 'edit'
      : 'view';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [products, setProducts] = useState<Product[]>([]);

  // Form (create / edit)
  const [formData, setFormData] = useState<SalesFormData>({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);

  // Detail (view)
  const [detailEntry, setDetailEntry] = useState<SalesEntry | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const handleBack = () => navigate('/sales-entry');

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchProducts = useCallback(async () => {
    try {
      const productsList = await productsApi.list();
      setProducts(Array.isArray(productsList) ? productsList : []);
    } catch {
      // Dropdown data failure is non-critical
    }
  }, []);

  const fetchEntryForEdit = useCallback(async (entryId: string) => {
    setIsLoadingForm(true);
    try {
      const full = await salesApi.getById(entryId);
      setFormData({
        productIds: full.productIds || (full.productId ? [full.productId] : []),
        customerName: full.customerName || '',
        saleDate: full.saleDate ? full.saleDate.split('T')[0] : '',
        quantity: full.quantity || 1,
        amount: full.amount || 0,
        poNumber: full.poNumber || '',
        invoiceNo: full.invoiceNo || '',
        paymentStatus: full.paymentStatus || 'pending',
        notes: full.notes || '',
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to load entry');
    } finally {
      setIsLoadingForm(false);
    }
  }, []);

  const fetchEntryForView = useCallback(async (entryId: string) => {
    setIsLoadingDetail(true);
    try {
      const entry = await salesApi.getById(entryId);
      setDetailEntry(entry);
    } catch (err: any) {
      console.error('Failed to load entry', err);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  // Main data loading effect
  useEffect(() => {
    if (mode === 'create') {
      setFormData({ ...EMPTY_FORM });
      setFormError('');
      fetchProducts();
    } else if (mode === 'edit' && id) {
      setFormError('');
      fetchProducts();
      fetchEntryForEdit(id);
    } else if (mode === 'view' && id) {
      fetchProducts();
      fetchEntryForView(id);
    }
  }, [mode, id]);

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'amount' ? Number(value) || 0 : value,
    }));
  };

  const productOptions = products.map(p => ({ value: p.id, label: p.name }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (formData.productIds.length === 0) {
      setFormError('At least one product is required');
      return;
    }
    if (!formData.saleDate) {
      setFormError('Sale date is required');
      return;
    }
    if (formData.amount <= 0) {
      setFormError('Amount must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        ...formData,
        salespersonId: user?.id,
      };

      if (mode === 'edit' && id) {
        await salesApi.update(id, payload);
      } else {
        await salesApi.create(payload);
      }
      navigate('/sales-entry');
    } catch (err: any) {
      setFormError(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  const handleDelete = async (entryId: string) => {
    try {
      await salesApi.delete(entryId);
      setDeleteConfirmId(null);
      navigate('/sales-entry');
    } catch (err: any) {
      console.error('Failed to delete entry', err);
    }
  };

  // ---------------------------------------------------------------------------
  // Render: Create / Edit Form
  // ---------------------------------------------------------------------------

  const renderForm = () => {
    if (isLoadingForm) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">Loading entry...</p>
        </div>
      );
    }

    return (
      <Card>
        <form id="sales-entry-form" onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {formError}
            </Alert>
          )}

          {/* Product multi-select */}
          <SearchableSelect
            label="Product(s) *"
            isMulti
            options={productOptions}
            value={formData.productIds}
            onChange={(ids) => setFormData(prev => ({ ...prev, productIds: ids }))}
            placeholder="Search and select products..."
          />

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
            rows={3}
            placeholder="Optional notes..."
            value={formData.notes}
            onChange={handleFormChange}
            className="resize-none"
          />

          {/* Form actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              icon={isSubmitting ? undefined : <CheckCircle className="w-4 h-4" />}
              shine
            >
              {isSubmitting ? 'Saving...' : (mode === 'edit' ? 'Update Entry' : 'Add Entry')}
            </Button>
          </div>
        </form>
      </Card>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Detail View
  // ---------------------------------------------------------------------------

  const renderDetail = () => {
    if (isLoadingDetail || !detailEntry) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">Loading entry...</p>
        </div>
      );
    }

    const entry = detailEntry;

    return (
      <div className="space-y-6">
        {/* Actions bar */}
        <Card padding="none" className="p-4">
          <div className="flex items-center justify-between">
            {/* Payment status badge */}
            <Badge variant={paymentBadgeVariant(entry.paymentStatus) as any} size="md">
              {entry.paymentStatus.charAt(0).toUpperCase() + entry.paymentStatus.slice(1)}
            </Badge>

            <div className="flex items-center gap-2">
              {/* Edit */}
              <Button
                variant="ghost"
                size="xs"
                onClick={() => navigate('/sales-entry/edit/' + entry.id)}
                icon={<Edit2 className="w-4 h-4" />}
                title="Edit"
              />
              {/* Delete */}
              {deleteConfirmId === entry.id ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => handleDelete(entry.id)}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="ghost"
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
                  onClick={() => setDeleteConfirmId(entry.id)}
                  icon={<Trash2 className="w-4 h-4" />}
                  className="hover:text-red-600 dark:hover:text-red-400"
                  title="Delete"
                />
              )}
            </div>
          </div>
        </Card>

        {/* Amount highlight */}
        {entry.amount ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30">
            <IndianRupee className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70">Amount</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatINR(entry.amount)}</p>
            </div>
          </div>
        ) : null}

        {/* Info grid */}
        <Card>
          <div className="grid grid-cols-2 gap-3 text-sm rounded-xl p-4 bg-slate-50 dark:bg-dark-100">
            <div>
              <p className="text-xs mb-0.5 text-slate-400 dark:text-zinc-500">Date</p>
              <p className="font-medium text-slate-900 dark:text-white">{formatDate(entry.saleDate)}</p>
            </div>
            <div>
              <p className="text-xs mb-0.5 text-slate-400 dark:text-zinc-500">Account</p>
              <p className="font-medium text-slate-900 dark:text-white">{entry.customerName || '-'}</p>
            </div>
            <div>
              <p className="text-xs mb-0.5 text-slate-400 dark:text-zinc-500">Product</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {entry.productNames && entry.productNames.length > 0
                  ? entry.productNames.length === 1
                    ? entry.productNames[0]
                    : entry.productNames.map((name: string, i: number) => `${i + 1}. ${name}`).join(', ')
                  : entry.productName || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs mb-0.5 text-slate-400 dark:text-zinc-500">Account Name</p>
              <p className="font-medium text-slate-900 dark:text-white">{entry.customerName || '-'}</p>
            </div>
            <div>
              <p className="text-xs mb-0.5 text-slate-400 dark:text-zinc-500">Quantity</p>
              <p className="font-medium text-slate-900 dark:text-white">{entry.quantity}</p>
            </div>
            <div>
              <p className="text-xs mb-0.5 text-slate-400 dark:text-zinc-500">Amount</p>
              <p className="font-medium text-slate-900 dark:text-white">{formatINR(entry.amount)}</p>
            </div>
            <div>
              <p className="text-xs mb-0.5 text-slate-400 dark:text-zinc-500">PO #</p>
              <p className="font-medium text-slate-900 dark:text-white">{entry.poNumber || '-'}</p>
            </div>
            <div>
              <p className="text-xs mb-0.5 text-slate-400 dark:text-zinc-500">Invoice #</p>
              <p className="font-medium text-slate-900 dark:text-white">{entry.invoiceNo || '-'}</p>
            </div>
          </div>
        </Card>

        {/* Notes */}
        {entry.notes && (
          <Card>
            <div>
              <p className="text-xs mb-1 text-slate-400 dark:text-zinc-500">Notes</p>
              <p className="text-sm text-slate-600 dark:text-zinc-300">{entry.notes}</p>
            </div>
          </Card>
        )}

        {/* Timestamps */}
        <div className="pt-3 border-t text-xs border-slate-100 text-slate-400 dark:border-zinc-800 dark:text-zinc-600 px-1">
          {entry.createdAt && <p>Created: {new Date(entry.createdAt).toLocaleString()}</p>}
          {entry.updatedAt && <p>Updated: {new Date(entry.updatedAt).toLocaleString()}</p>}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 animate-fade-in-up">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBack}
          className="p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
        </button>
        <div>
          <h1 className="text-xl font-bold font-display text-gray-900 dark:text-white">
            {mode === 'create'
              ? 'New Sales Entry'
              : mode === 'edit'
                ? 'Edit Sales Entry'
                : detailEntry?.customerName || 'Sales Entry Details'}
          </h1>
          <p className="text-sm mt-0.5 text-gray-500 dark:text-zinc-400">
            {mode === 'create'
              ? 'Create a new sales entry'
              : mode === 'edit'
                ? 'Update sales entry information'
                : 'View sales entry details'}
          </p>
        </div>
      </div>

      {(mode === 'create' || mode === 'edit') && renderForm()}
      {mode === 'view' && renderDetail()}
    </div>
  );
};
