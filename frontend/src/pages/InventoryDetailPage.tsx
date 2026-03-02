import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Package, Loader2, AlertCircle,
  MapPin, Hash, FileText, Calendar, Layers, Truck, Image as ImageIcon
} from 'lucide-react';
import { productsApi, formatINR } from '@/services/api';
import { Product } from '@/types';
import { Card, Button, Badge, Alert, Input, Select, Textarea } from '@/components/ui';
import { useNavigation } from '@/contexts/NavigationContext';

export const InventoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { setActiveTab } = useNavigation();

  const mode: 'view' | 'edit' | 'create' = location.pathname.includes('/create')
    ? 'create'
    : location.pathname.includes('/edit/')
      ? 'edit'
      : 'view';

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '', ipn: '', description: '', category: '', stock: 0,
    basePrice: 0, batch: '', location: '', stocktake: '',
    expiryDate: '', purchaseOrder: '', status: 'OK', partImage: '',
  });

  const loadProduct = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError('');
      const data = await productsApi.getById(id);
      setProduct(data);
      setForm({
        name: data.name || '',
        ipn: data.ipn || '',
        description: data.description || '',
        category: data.category || '',
        stock: data.stock || 0,
        basePrice: data.basePrice || 0,
        batch: data.batch || '',
        location: data.location || '',
        stocktake: data.stocktake || '',
        expiryDate: data.expiryDate || '',
        purchaseOrder: data.purchaseOrder || '',
        status: data.status || 'OK',
        partImage: data.partImage || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load item');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (mode !== 'create') loadProduct();
  }, [mode, loadProduct]);

  const handleBack = () => {
    setActiveTab('inventory');
    navigate('/inventory');
  };

  const handleEdit = () => {
    navigate(`/inventory/edit/${id}`);
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      const payload = {
        name: form.name,
        ipn: form.ipn || null,
        description: form.description || null,
        category: form.category || null,
        stock: form.stock,
        basePrice: form.basePrice || null,
        batch: form.batch || null,
        location: form.location || null,
        stocktake: form.stocktake || null,
        expiryDate: form.expiryDate || null,
        purchaseOrder: form.purchaseOrder || null,
        status: form.status || 'OK',
        partImage: form.partImage || null,
      };
      if (mode === 'create') {
        await productsApi.create(payload);
      } else {
        await productsApi.update(id!, payload);
      }
      handleBack();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return '-';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !product && mode !== 'create') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
          {error}
        </Alert>
        <Button variant="ghost" onClick={handleBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inventory
        </Button>
      </div>
    );
  }

  const isEditing = mode === 'edit' || mode === 'create';
  const displayProduct = product;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {mode === 'create' ? 'Add Inventory Item' : isEditing ? 'Edit Item' : displayProduct?.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
              {mode === 'create' ? 'Create a new inventory item' : isEditing ? 'Update item details' : displayProduct?.category || 'Inventory Item'}
            </p>
          </div>
        </div>
        {mode === 'view' && (
          <Button variant="primary" size="sm" onClick={handleEdit} icon={<Edit2 className="w-4 h-4" />}>
            Edit
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />} onClose={() => setError('')}>
            {error}
          </Alert>
        </div>
      )}

      {isEditing ? (
        /* ---- EDIT / CREATE MODE ---- */
        <div className="space-y-4">
          <Card glass={false} padding="none" className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Part Name *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Dell PowerEdge R750xs" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">IPN</label>
                <Input value={form.ipn} onChange={e => setForm(f => ({ ...f, ipn: e.target.value }))} placeholder="e.g. IPN-000001168" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Category</label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Servers, Laptops, Storage" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Unit Price</label>
                <Input type="number" value={form.basePrice || ''} onChange={e => setForm(f => ({ ...f, basePrice: parseFloat(e.target.value) || 0 }))} placeholder="0.00" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Description</label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Product description..." rows={3} />
              </div>
            </div>
          </Card>

          <Card glass={false} padding="none" className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Inventory Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Stock</label>
                <Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Status</label>
                <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="OK">OK</option>
                  <option value="LOW">LOW</option>
                  <option value="OUT">OUT</option>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Batch</label>
                <Input value={form.batch} onChange={e => setForm(f => ({ ...f, batch: e.target.value }))} placeholder="e.g. CT-2026124-1347" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Location</label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. RACK E - 16" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Stocktake</label>
                <Input value={form.stocktake} onChange={e => setForm(f => ({ ...f, stocktake: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Expiry Date</label>
                <Input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Purchase Order</label>
                <Input value={form.purchaseOrder} onChange={e => setForm(f => ({ ...f, purchaseOrder: e.target.value }))} placeholder="e.g. PO-2026-0124" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">Part Image URL</label>
                <Input value={form.partImage} onChange={e => setForm(f => ({ ...f, partImage: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button variant="primary" onClick={handleSave} disabled={isSubmitting || !form.name.trim()}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {mode === 'create' ? 'Create Item' : 'Save Changes'}
            </Button>
            <Button variant="ghost" onClick={handleBack}>Cancel</Button>
          </div>
        </div>
      ) : displayProduct ? (
        /* ---- VIEW MODE ---- */
        <div className="space-y-4">
          {/* Stock Status Banner */}
          <Card glass={false} padding="none" className="p-5">
            <div className={`rounded-xl p-4 flex items-center gap-4 ${
              displayProduct.stock === 0
                ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800/30'
                : displayProduct.stock <= 10
                  ? 'bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30'
                  : 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30'
            }`}>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  displayProduct.stock === 0
                    ? 'text-red-700 dark:text-red-400'
                    : displayProduct.stock <= 10
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                }`}>
                  {displayProduct.stock === 0 ? 'Out of Stock' : displayProduct.stock <= 10 ? 'Low Stock' : 'In Stock'}
                </p>
                <p className="text-2xl font-bold mt-0.5 text-slate-900 dark:text-white">
                  {displayProduct.stock} <span className="text-sm font-normal opacity-60">units</span>
                </p>
              </div>
              {displayProduct.stock === 0 ? (
                <Badge variant="error" size="sm">OUT</Badge>
              ) : displayProduct.stock <= 10 ? (
                <Badge variant="warning" size="sm">LOW</Badge>
              ) : (
                <Badge variant="success" size="sm">OK</Badge>
              )}
            </div>
          </Card>

          {/* Basic Info */}
          <Card glass={false} padding="none" className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" /> Basic Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
              <DetailRow icon={<Hash className="w-3.5 h-3.5" />} label="Part Name" value={displayProduct.name} />
              <DetailRow icon={<Hash className="w-3.5 h-3.5" />} label="IPN" value={displayProduct.ipn} />
              <DetailRow icon={<Layers className="w-3.5 h-3.5" />} label="Category" value={displayProduct.category} />
              <DetailRow icon={<IndianRupee className="w-3.5 h-3.5" />} label="Unit Price" value={displayProduct.basePrice ? formatINR(displayProduct.basePrice) : undefined} />
              <div className="sm:col-span-2">
                <DetailRow icon={<FileText className="w-3.5 h-3.5" />} label="Description" value={displayProduct.description} />
              </div>
            </div>
          </Card>

          {/* Inventory Details */}
          <Card glass={false} padding="none" className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Inventory Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
              <DetailRow icon={<Layers className="w-3.5 h-3.5" />} label="Batch" value={displayProduct.batch} />
              <DetailRow icon={<MapPin className="w-3.5 h-3.5" />} label="Location" value={displayProduct.location} highlight />
              <DetailRow icon={<Hash className="w-3.5 h-3.5" />} label="Stocktake" value={displayProduct.stocktake} />
              <DetailRow icon={<Calendar className="w-3.5 h-3.5" />} label="Expiry Date" value={formatDate(displayProduct.expiryDate)} />
              <DetailRow icon={<Truck className="w-3.5 h-3.5" />} label="Purchase Order" value={displayProduct.purchaseOrder} />
              <DetailRow icon={<Calendar className="w-3.5 h-3.5" />} label="Last Updated" value={formatDate(displayProduct.updatedAt)} />
            </div>
          </Card>

          {/* Image */}
          {displayProduct.partImage && (
            <Card glass={false} padding="none" className="p-5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Part Image
              </h2>
              <img src={displayProduct.partImage} alt={displayProduct.name} className="max-w-xs rounded-lg border border-slate-200 dark:border-zinc-700" />
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
};

// Helper to show Indian Rupee icon inline
const IndianRupee: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 3h12M6 8h12M6 13l8.5 8M14.5 13a4.5 4.5 0 0 0 0-9H6" />
  </svg>
);

const DetailRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  highlight?: boolean;
}> = ({ icon, label, value, highlight }) => (
  <div className="flex items-start gap-3 py-2.5">
    <span className="text-slate-400 dark:text-zinc-500 mt-0.5">{icon}</span>
    <div>
      <p className="text-xs font-medium text-slate-400 dark:text-zinc-500">{label}</p>
      <p className={`text-sm mt-0.5 ${
        highlight && value
          ? 'font-medium text-blue-600 dark:text-blue-400'
          : 'text-slate-900 dark:text-white'
      }`}>
        {value || '-'}
      </p>
    </div>
  </div>
);
