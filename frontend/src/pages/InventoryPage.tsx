import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Package, AlertCircle, X, ArrowUpDown, ChevronUp, ChevronDown,
  Wrench, Settings2, Image as ImageIcon
} from 'lucide-react';
import { productsApi, formatINR } from '@/services/api';
import { Product } from '@/types';
import { Card, Button, Input, Select, Badge, Alert, Modal } from '@/components/ui';

type SortField = 'name' | 'ipn' | 'stock' | 'batch' | 'location' | 'expiryDate' | 'updatedAt';
type SortDir = 'asc' | 'desc';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'low' | 'out'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await productsApi.listAll();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const locations = useMemo(() => {
    const locs = new Set(products.map(p => p.location).filter(Boolean) as string[]);
    return Array.from(locs).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let result = [...products];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.ipn || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.batch || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q)
      );
    }

    if (filterLocation) {
      result = result.filter(p => p.location === filterLocation);
    }

    if (filterStatus === 'ok') {
      result = result.filter(p => p.stock > 10);
    } else if (filterStatus === 'low') {
      result = result.filter(p => p.stock > 0 && p.stock <= 10);
    } else if (filterStatus === 'out') {
      result = result.filter(p => p.stock === 0);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'ipn': cmp = (a.ipn || '').localeCompare(b.ipn || ''); break;
        case 'stock': cmp = a.stock - b.stock; break;
        case 'batch': cmp = (a.batch || '').localeCompare(b.batch || ''); break;
        case 'location': cmp = (a.location || '').localeCompare(b.location || ''); break;
        case 'expiryDate': cmp = (a.expiryDate || '').localeCompare(b.expiryDate || ''); break;
        case 'updatedAt': cmp = (a.updatedAt || '').localeCompare(b.updatedAt || ''); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [products, searchTerm, filterLocation, filterStatus, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === filtered.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filtered.map(p => p.id)));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterLocation('');
    setFilterStatus('all');
  };

  const hasFilters = searchTerm || filterLocation || filterStatus !== 'all';

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return '-';
    }
  };

  const SortHeader: React.FC<{ field: SortField; label: string; className?: string }> = ({ field, label, className }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-zinc-400 cursor-pointer select-none hover:text-slate-700 dark:hover:text-zinc-200 whitespace-nowrap ${className || ''}`}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field
          ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
          : <ArrowUpDown className="w-3 h-3 opacity-30" />
        }
      </span>
    </th>
  );

  const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex items-start gap-3 py-2.5">
      <p className="text-xs font-medium w-36 flex-shrink-0 pt-0.5 text-slate-400 dark:text-zinc-500">{label}</p>
      <p className="text-sm text-slate-900 dark:text-white">{value || '-'}</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto">
      {/* Toolbar */}
      <Card glass={false} padding="none" className="mb-4 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by part, IPN, description, batch..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
            <option value="">All Locations</option>
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </Select>
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
            <option value="all">All Status</option>
            <option value="ok">OK (&gt;10)</option>
            <option value="low">Low (1-10)</option>
            <option value="out">Out of Stock</option>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} icon={<X className="w-4 h-4" />}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      {error && (
        <div className="mb-4">
          <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />} onClose={() => setError('')}>
            {error}
          </Alert>
        </div>
      )}

      {/* Table */}
      <Card glass={false} padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedRows.size === filtered.length}
                    onChange={toggleAll}
                    className="rounded border-slate-300 dark:border-zinc-600"
                  />
                </th>
                <SortHeader field="name" label="Part" className="min-w-[220px]" />
                <SortHeader field="ipn" label="IPN" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-zinc-400 min-w-[200px]">Description</th>
                <SortHeader field="stock" label="Stock" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-zinc-400">Status</th>
                <SortHeader field="batch" label="Batch" />
                <SortHeader field="location" label="Location" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-zinc-400">Stocktake</th>
                <SortHeader field="expiryDate" label="Expiry Date" />
                <SortHeader field="updatedAt" label="Last Updated" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-zinc-400">Purchase Order</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-white/[0.04]">
                    {Array.from({ length: 12 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-slate-100 dark:bg-zinc-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-16 text-center">
                    <Package className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-zinc-600" />
                    <p className="text-sm text-slate-500 dark:text-zinc-500">
                      {hasFilters ? 'No items match your filters' : 'No inventory items found'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => setDetailProduct(product)}
                    className="border-b border-slate-100 dark:border-white/[0.04] hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(product.id)}
                        onChange={(e) => toggleRow(product.id, e as any)}
                        className="rounded border-slate-300 dark:border-zinc-600"
                      />
                    </td>

                    {/* Part */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {product.partImage ? (
                            <img src={product.partImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Wrench className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                            <Settings2 className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* IPN */}
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                      {product.ipn || '-'}
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700 dark:text-zinc-300 line-clamp-2">
                        {product.description || '-'}
                      </p>
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                        {product.stock}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {product.stock === 0 ? (
                        <Badge variant="error" size="sm">OUT</Badge>
                      ) : product.stock <= 10 ? (
                        <Badge variant="warning" size="sm">LOW</Badge>
                      ) : (
                        <Badge variant="success" size="sm">OK</Badge>
                      )}
                    </td>

                    {/* Batch */}
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                      {product.batch || '-'}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3">
                      {product.location ? (
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {product.location}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400 dark:text-zinc-600">-</span>
                      )}
                    </td>

                    {/* Stocktake */}
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-zinc-300">
                      {product.stocktake || '-'}
                    </td>

                    {/* Expiry Date */}
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                      {formatDate(product.expiryDate)}
                    </td>

                    {/* Last Updated */}
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                      {formatDate(product.updatedAt)}
                    </td>

                    {/* Purchase Order */}
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-zinc-300">
                      {product.purchaseOrder || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t text-xs border-slate-100 text-slate-500 dark:border-white/[0.06] dark:text-zinc-500 flex items-center justify-between">
            <span>Showing {filtered.length} of {products.length} items</span>
            {selectedRows.size > 0 && (
              <span>{selectedRows.size} selected</span>
            )}
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        open={!!detailProduct}
        onClose={() => setDetailProduct(null)}
        title={detailProduct?.name || ''}
        subtitle="Inventory Item Details"
        icon={<Package className="w-5 h-5" />}
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setDetailProduct(null)} className="w-full">
            Close
          </Button>
        }
      >
        {detailProduct && (
          <div className="space-y-4">
            {/* Stock Status Banner */}
            <div className={`rounded-xl p-4 flex items-center gap-4 ${
              detailProduct.stock === 0
                ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800/30'
                : detailProduct.stock <= 10
                  ? 'bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30'
                  : 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30'
            }`}>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  detailProduct.stock === 0
                    ? 'text-red-700 dark:text-red-400'
                    : detailProduct.stock <= 10
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                }`}>
                  {detailProduct.stock === 0 ? 'Out of Stock' : detailProduct.stock <= 10 ? 'Low Stock' : 'In Stock'}
                </p>
                <p className="text-2xl font-bold mt-0.5 text-slate-900 dark:text-white">
                  {detailProduct.stock} <span className="text-sm font-normal opacity-60">units</span>
                </p>
              </div>
              {detailProduct.stock === 0 ? (
                <Badge variant="error" size="sm">OUT</Badge>
              ) : detailProduct.stock <= 10 ? (
                <Badge variant="warning" size="sm">LOW</Badge>
              ) : (
                <Badge variant="success" size="sm">OK</Badge>
              )}
            </div>

            {/* Info */}
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              <InfoRow label="Part Name" value={detailProduct.name} />
              <InfoRow label="IPN" value={detailProduct.ipn} />
              <InfoRow label="Category" value={detailProduct.category} />
              <InfoRow label="Description" value={detailProduct.description} />
              <InfoRow label="Unit Price" value={detailProduct.basePrice ? formatINR(detailProduct.basePrice) : '-'} />
              <InfoRow label="Stock" value={String(detailProduct.stock)} />
              <InfoRow label="Batch" value={detailProduct.batch} />
              <InfoRow label="Location" value={detailProduct.location} />
              <InfoRow label="Stocktake" value={detailProduct.stocktake} />
              <InfoRow label="Expiry Date" value={formatDate(detailProduct.expiryDate)} />
              <InfoRow label="Last Updated" value={formatDate(detailProduct.updatedAt)} />
              <InfoRow label="Purchase Order" value={detailProduct.purchaseOrder} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
