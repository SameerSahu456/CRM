import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Package, AlertTriangle, ChevronDown, ChevronUp,
  Filter, X, Loader2, AlertCircle, ArrowUpDown, Eye
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { productsApi, formatINR } from '@/services/api';
import { Product } from '@/types';

type SortField = 'name' | 'category' | 'stock' | 'basePrice';
type SortDir = 'asc' | 'desc';

export const InventoryPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
        }`}>
          <AlertTriangle className="w-3 h-3" />
          Out of Stock
        </span>
      );
    if (stock <= 10)
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
        }`}>
          <AlertTriangle className="w-3 h-3" />
          Low ({stock})
        </span>
      );
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
      }`}>
        {stock} units
      </span>
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

  const cardClass = `premium-card ${isDark ? '' : 'shadow-soft'}`;

  const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex items-start gap-3 py-2">
      <p className={`text-xs font-medium w-32 flex-shrink-0 pt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{label}</p>
      <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{value || '-'}</p>
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
          <div
            key={stat.label}
            className={`rounded-xl p-4 border transition-all ${
              isDark
                ? 'bg-zinc-900/60 border-white/[0.06] hover:border-white/10'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
            }`}
          >
            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              {stat.label}
            </p>
            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className={`rounded-xl border mb-4 p-3 sm:p-4 ${
        isDark ? 'bg-zinc-900/60 border-white/[0.06]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-zinc-500' : 'text-slate-400'
            }`} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm border transition-colors ${
                isDark
                  ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
              } outline-none`}
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-zinc-500' : 'text-slate-400'
            }`} />
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className={`pl-9 pr-8 py-2 rounded-lg text-sm border appearance-none cursor-pointer transition-colors ${
                isDark
                  ? 'bg-zinc-800 border-zinc-700 text-white focus:border-brand-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-500'
              } outline-none`}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="relative">
            <Package className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-zinc-500' : 'text-slate-400'
            }`} />
            <select
              value={filterStock}
              onChange={e => setFilterStock(e.target.value as any)}
              className={`pl-9 pr-8 py-2 rounded-lg text-sm border appearance-none cursor-pointer transition-colors ${
                isDark
                  ? 'bg-zinc-800 border-zinc-700 text-white focus:border-brand-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-500'
              } outline-none`}
            >
              <option value="all">All Stock</option>
              <option value="in-stock">In Stock (&gt;10)</option>
              <option value="low-stock">Low Stock (1-10)</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isDark
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={`flex items-center gap-2 p-3 mb-4 rounded-lg text-sm ${
          isDark ? 'bg-red-900/20 text-red-400 border border-red-800/30' : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className={`rounded-xl border overflow-hidden ${
        isDark ? 'bg-zinc-900/60 border-white/[0.06]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Package className={`w-10 h-10 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
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
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className={isDark ? 'bg-zinc-800/50' : 'bg-slate-50'}>
                  {([
                    ['name', 'Product Name'],
                    ['category', 'Category'],
                    ['stock', 'Stock'],
                    ['basePrice', 'Unit Price'],
                  ] as [SortField, string][]).map(([field, label]) => (
                    <th
                      key={field}
                      onClick={() => handleSort(field)}
                      className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors ${
                        isDark
                          ? 'text-zinc-400 hover:text-zinc-200'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {label}
                        <SortIcon field={field} />
                      </span>
                    </th>
                  ))}
                  <th className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider ${
                    isDark ? 'text-zinc-400' : 'text-slate-500'
                  }`}>
                    Status
                  </th>
                  <th className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider ${
                    isDark ? 'text-zinc-400' : 'text-slate-500'
                  }`}>
                    Stock Value
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
                {filtered.map(product => (
                  <tr
                    key={product.id}
                    onClick={() => setDetailProduct(product)}
                    className={`transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
                    } ${!product.isActive ? 'opacity-50' : ''}`}
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isDark ? 'bg-brand-900/30 text-brand-400' : 'bg-brand-50 text-brand-600'
                        }`}>
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {product.name}
                          </p>
                          {!product.isActive && (
                            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      {product.category ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${
                          isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {product.category}
                        </span>
                      ) : (
                        <span className={`text-xs ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>--</span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold tabular-nums ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {product.stock}
                      </span>
                    </td>

                    {/* Unit Price */}
                    <td className={`px-4 py-3 text-sm tabular-nums ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {product.basePrice ? formatINR(product.basePrice) : '--'}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      {stockBadge(product.stock)}
                    </td>

                    {/* Stock Value */}
                    <td className={`px-4 py-3 text-sm tabular-nums ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
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
          <div className={`px-4 py-3 border-t text-xs ${
            isDark ? 'border-white/[0.06] text-zinc-500' : 'border-slate-100 text-slate-500'
          }`}>
            Showing {filtered.length} of {products.length} products
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={() => setDetailProduct(null)} />
          <div className={`relative w-full max-w-lg rounded-2xl animate-fade-in-up max-h-[85vh] flex flex-col overflow-hidden ${
            isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
          }`}>
            {/* Header */}
            <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'border-zinc-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-brand-900/30 text-brand-400' : 'bg-brand-50 text-brand-600'
                }`}>
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {detailProduct.name}
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Product Details</p>
                </div>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Stock Status Banner */}
              <div className={`rounded-xl p-4 flex items-center gap-4 ${
                detailProduct.stock === 0
                  ? isDark ? 'bg-red-900/20 border border-red-800/30' : 'bg-red-50 border border-red-200'
                  : detailProduct.stock <= 10
                    ? isDark ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-200'
                    : isDark ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-emerald-50 border border-emerald-200'
              }`}>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    detailProduct.stock === 0
                      ? isDark ? 'text-red-400' : 'text-red-700'
                      : detailProduct.stock <= 10
                        ? isDark ? 'text-amber-400' : 'text-amber-700'
                        : isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>
                    {detailProduct.stock === 0 ? 'Out of Stock' : detailProduct.stock <= 10 ? 'Low Stock' : 'In Stock'}
                  </p>
                  <p className={`text-2xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {detailProduct.stock} <span className="text-sm font-normal opacity-60">units</span>
                  </p>
                </div>
                {stockBadge(detailProduct.stock)}
              </div>

              {/* Info */}
              <div className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-slate-100'}`}>
                <InfoRow label="Product Name" value={detailProduct.name} />
                <InfoRow label="Category" value={detailProduct.category || '-'} />
                <InfoRow label="Unit Price" value={detailProduct.basePrice ? formatINR(detailProduct.basePrice) : '-'} />
                <InfoRow label="Stock Quantity" value={String(detailProduct.stock)} />
                <InfoRow label="Created" value={detailProduct.createdAt ? new Intl.DateTimeFormat('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric'
                }).format(new Date(detailProduct.createdAt)) : '-'} />
              </div>
            </div>

            {/* Footer */}
            <div className={`flex-shrink-0 px-6 py-4 border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
              <button
                onClick={() => setDetailProduct(null)}
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isDark ? 'text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700' : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
