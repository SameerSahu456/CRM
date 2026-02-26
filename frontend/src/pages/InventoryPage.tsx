import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Package, AlertTriangle, ChevronDown, ChevronUp,
  X, Loader2, AlertCircle, ArrowUpDown
} from 'lucide-react';
import { productsApi, formatINR } from '@/services/api';
import { Product } from '@/types';
import { Card, Button, Input, Select, Modal, Badge, Alert } from '@/components/ui';
import { cx } from '@/utils/cx';

type SortField = 'name' | 'category' | 'stock' | 'basePrice';
type SortDir = 'asc' | 'desc';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Detail modal
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await productsApi.listAll();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let result = [...products];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }

    if (filterCategory) {
      result = result.filter(p => p.category === filterCategory);
    }

    if (filterStock === 'in-stock') {
      result = result.filter(p => p.stock > 10);
    } else if (filterStock === 'low-stock') {
      result = result.filter(p => p.stock > 0 && p.stock <= 10);
    } else if (filterStock === 'out-of-stock') {
      result = result.filter(p => p.stock === 0);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'category':
          cmp = (a.category || '').localeCompare(b.category || '');
          break;
        case 'stock':
          cmp = a.stock - b.stock;
          break;
        case 'basePrice':
          cmp = (a.basePrice || 0) - (b.basePrice || 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [products, searchTerm, filterCategory, filterStock, sortField, sortDir]);

  // Summary stats
  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter(p => p.stock > 10).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    return { total, inStock, outOfStock };
  }, [products]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const stockBadge = (stock: number) => {
    if (stock === 0)
      return (
        <Badge variant="error" size="sm">
          <AlertTriangle className="w-3 h-3" />
          Out of Stock
        </Badge>
      );
    if (stock <= 10)
      return (
        <Badge variant="warning" size="sm">
          <AlertTriangle className="w-3 h-3" />
          Low ({stock})
        </Badge>
      );
    return (
      <Badge variant="success" size="sm">
        {stock} units
      </Badge>
    );
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5" />
      : <ChevronDown className="w-3.5 h-3.5" />;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterStock('all');
  };

  const hasFilters = searchTerm || filterCategory || filterStock !== 'all';

  const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex items-start gap-3 py-2">
      <p className="text-xs font-medium w-32 flex-shrink-0 pt-0.5 text-slate-400 dark:text-zinc-500">{label}</p>
      <p className="text-sm text-slate-900 dark:text-white">{value || '-'}</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Products', value: stats.total, color: 'brand' },
          { label: 'In Stock', value: stats.inStock, color: 'emerald' },
          { label: 'Out of Stock', value: stats.outOfStock, color: 'red' },
        ].map((stat) => (
          <Card
            key={stat.label}
            glass={false}
            padding="none"
            hover
            className="p-4"
          >
            <p className="text-xs font-medium mb-1 text-slate-500 dark:text-zinc-500">
              {stat.label}
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <Card glass={false} padding="none" className="mb-4 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Category Filter */}
          <Select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>

          {/* Stock Filter */}
          <Select
            value={filterStock}
            onChange={e => setFilterStock(e.target.value as any)}
          >
            <option value="all">All Stock</option>
            <option value="in-stock">In Stock (&gt;10)</option>
            <option value="low-stock">Low Stock (1-10)</option>
            <option value="out-of-stock">Out of Stock</option>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              icon={<X className="w-4 h-4" />}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-4">
          <Alert
            variant="error"
            icon={<AlertCircle className="w-4 h-4" />}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        </div>
      )}

      {/* Table */}
      <Card glass={false} padding="none">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Package className="w-10 h-10 text-slate-300 dark:text-zinc-600" />
            <p className="text-sm text-slate-500 dark:text-zinc-500">
              {hasFilters ? 'No products match your filters' : 'No products found'}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-brand-500 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="premium-table min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-800/50">
                  {([
                    ['name', 'Product Name'],
                    ['category', 'Category'],
                    ['stock', 'Stock'],
                    ['basePrice', 'Unit Price'],
                  ] as [SortField, string][]).map(([field, label]) => (
                    <th
                      key={field}
                      onClick={() => handleSort(field)}
                      className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {label}
                        <SortIcon field={field} />
                      </span>
                    </th>
                  ))}
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Stock Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filtered.map(product => (
                  <tr
                    key={product.id}
                    onClick={() => setDetailProduct(product)}
                    className={cx(
                      'transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04]',
                      !product.isActive && 'opacity-50'
                    )}
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {product.name}
                          </p>
                          {!product.isActive && (
                            <span className="text-xs text-slate-400 dark:text-zinc-500">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      {product.category ? (
                        <Badge variant="gray" size="sm">
                          {product.category}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-zinc-600">--</span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                        {product.stock}
                      </span>
                    </td>

                    {/* Unit Price */}
                    <td className="px-4 py-3 text-sm tabular-nums text-slate-700 dark:text-zinc-300">
                      {product.basePrice ? formatINR(product.basePrice) : '--'}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      {stockBadge(product.stock)}
                    </td>

                    {/* Stock Value */}
                    <td className="px-4 py-3 text-sm tabular-nums text-slate-700 dark:text-zinc-300">
                      {product.basePrice ? formatINR(product.basePrice * product.stock) : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t text-xs border-slate-100 text-slate-500 dark:border-white/[0.06] dark:text-zinc-500">
            Showing {filtered.length} of {products.length} products
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        open={!!detailProduct}
        onClose={() => setDetailProduct(null)}
        title={detailProduct?.name || ''}
        subtitle="Product Details"
        icon={<Package className="w-5 h-5" />}
        size="md"
        footer={
          <Button
            variant="secondary"
            onClick={() => setDetailProduct(null)}
            className="w-full"
          >
            Close
          </Button>
        }
      >
        {detailProduct && (
          <div className="space-y-4">
            {/* Stock Status Banner */}
            <div className={cx(
              'rounded-xl p-4 flex items-center gap-4',
              detailProduct.stock === 0
                ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800/30'
                : detailProduct.stock <= 10
                  ? 'bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30'
                  : 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30'
            )}>
              <div className="flex-1">
                <p className={cx(
                  'text-sm font-medium',
                  detailProduct.stock === 0
                    ? 'text-red-700 dark:text-red-400'
                    : detailProduct.stock <= 10
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                )}>
                  {detailProduct.stock === 0 ? 'Out of Stock' : detailProduct.stock <= 10 ? 'Low Stock' : 'In Stock'}
                </p>
                <p className="text-2xl font-bold mt-0.5 text-slate-900 dark:text-white">
                  {detailProduct.stock} <span className="text-sm font-normal opacity-60">units</span>
                </p>
              </div>
              {stockBadge(detailProduct.stock)}
            </div>

            {/* Info */}
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              <InfoRow label="Product Name" value={detailProduct.name} />
              <InfoRow label="Category" value={detailProduct.category || '-'} />
              <InfoRow label="Unit Price" value={detailProduct.basePrice ? formatINR(detailProduct.basePrice) : '-'} />
              <InfoRow label="Stock Quantity" value={String(detailProduct.stock)} />
              <InfoRow label="Created" value={detailProduct.createdAt ? new Intl.DateTimeFormat('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
              }).format(new Date(detailProduct.createdAt)) : '-'} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
