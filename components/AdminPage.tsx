import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, Loader2, AlertCircle, CheckCircle,
  Users, Package, Layers, Building2, Tags,
  Shield, Key, ToggleLeft, ToggleRight, History,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, masterDataApi, productsApi, formatINR } from '../services/api';
import { User, UserRole, Product, MasterItem, MasterCategory } from '../types';
import { ActivityLogTab } from './admin/ActivityLogTab';
import { RolesTab } from './admin/RolesTab';
import { ProductManagersTab } from './admin/ProductManagersTab';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type AdminTab = 'users' | 'products' | 'oems' | 'categories' | 'product-managers' | 'roles' | 'activity-log';

const TABS: { key: AdminTab; label: string; icon: React.ElementType; superadminOnly?: boolean }[] = [
  { key: 'users', label: 'Users', icon: Users },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'oems', label: 'OEMs', icon: Building2 },
  { key: 'categories', label: 'Categories', icon: Tags },
  { key: 'product-managers', label: 'Product Managers', icon: Layers },
  { key: 'roles', label: 'Roles & Permissions', icon: Shield },
  { key: 'activity-log', label: 'Activity Log', icon: History, superadminOnly: true },
];

const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'sales', label: 'Sales' },
  { value: 'businesshead', label: 'Business Unit' },
  { value: 'productmanager', label: 'Product Manager' },
];

const DEPARTMENTS = ['Product Manager', 'Sales', 'Business Unit', 'Admin', 'Super Admin'];

const USER_TAGS: { value: string; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'channel', label: 'Channel' },
  { value: 'endcustomer', label: 'End Customer' },
  { value: 'both', label: 'Both (Channel + End Customer)' },
];

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  phone: string;
  employeeId: string;
  monthlyTarget: number | '';
  isActive: boolean;
  viewAccess: 'presales' | 'postsales' | 'both';
  tag: string;
}

const EMPTY_USER_FORM: UserFormData = {
  name: '',
  email: '',
  password: '',
  role: 'sales',
  department: '',
  phone: '',
  employeeId: '',
  monthlyTarget: '',
  isActive: true,
  viewAccess: 'presales',
  tag: '',
};

interface ProductFormData {
  name: string;
  category: string;
  basePrice: number | '';
  commissionRate: number | '';
  isActive: boolean;
}

const EMPTY_PRODUCT_FORM: ProductFormData = {
  name: '',
  category: '',
  basePrice: '',
  commissionRate: '',
  isActive: true,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roleBadge(role: UserRole, isDark: boolean): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  switch (role) {
    case 'admin':
    case 'superadmin':
      return `${base} ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'}`;
    case 'sales':
      return `${base} ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'}`;
    case 'businesshead':
      return `${base} ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700'}`;
    case 'productmanager':
      return `${base} ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-700'}`;
    default:
      return `${base} ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`;
  }
}

function statusBadge(isActive: boolean, isDark: boolean): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  return isActive
    ? `${base} ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`
    : `${base} ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`;
}

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

function roleLabel(role: UserRole): string {
  return USER_ROLES.find(r => r.value === role)?.label || role;
}

// ---------------------------------------------------------------------------
// Generic Modal Component
// ---------------------------------------------------------------------------

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isDark: boolean;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, isDark, children, maxWidth = 'max-w-xl' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={onClose} />
      <div
        className={`relative w-full ${maxWidth} max-h-[80vh] overflow-y-auto rounded-2xl animate-fade-in-up ${
          isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
        }`}
      >
        <div
          className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
          }`}
        >
          <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Confirm Dialog
// ---------------------------------------------------------------------------

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDark: boolean;
  isLoading?: boolean;
  confirmLabel?: string;
  children?: React.ReactNode;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, onClose, onConfirm, title, message, isDark, isLoading, confirmLabel = 'Delete', children,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={onClose} />
      <div
        className={`relative w-full max-w-sm rounded-2xl animate-fade-in-up p-6 ${
          isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
        }`}
      >
        <h3 className={`text-lg font-semibold font-display mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h3>
        <p className={`text-sm mb-4 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{message}</p>
        {children}
        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            } disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// MasterDataTab — Generic for Verticals, OEMs, Partner Types
// ---------------------------------------------------------------------------

interface MasterDataTabProps {
  entity: string;
  entityLabel: string;
  isDark: boolean;
  cardClass: string;
  inputClass: string;
  labelClass: string;
}

const MasterDataTab: React.FC<MasterDataTabProps> = ({
  entity, entityLabel, isDark, cardClass, inputClass, labelClass,
}) => {
  const [items, setItems] = useState<MasterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<MasterItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await masterDataApi.list(entity);
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || `Failed to load ${entityLabel.toLowerCase()}`);
    } finally {
      setIsLoading(false);
    }
  }, [entity, entityLabel]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openCreate = () => {
    setEditingItem(null);
    setFormName('');
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (item: MasterItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = formName.trim();
    if (!trimmed) {
      setFormError('Name is required');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      if (editingItem) {
        await masterDataApi.update(entity, editingItem.id, { name: trimmed });
      } else {
        await masterDataApi.create(entity, { name: trimmed });
      }
      closeModal();
      fetchItems();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await masterDataApi.delete(entity, deleteTarget.id);
      setDeleteTarget(null);
      fetchItems();
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleActive = async (item: MasterItem) => {
    try {
      await masterDataApi.update(entity, item.id, { is_active: !item.isActive });
      fetchItems();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className={`${cardClass} p-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder={`Search ${entityLabel.toLowerCase()}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
                isDark
                  ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
              } focus:outline-none focus:ring-1 focus:ring-brand-500`}
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add {entityLabel.replace(/s$/, '')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`${cardClass} overflow-hidden`}>
        {error && (
          <div className={`m-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
            isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Loading {entityLabel.toLowerCase()}...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
              <Layers className={`w-7 h-7 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
            </div>
            <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              {searchTerm ? `No ${entityLabel.toLowerCase()} match your search` : `No ${entityLabel.toLowerCase()} yet`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                  {['Name', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr
                    key={item.id}
                    className={`border-b transition-colors ${
                      isDark ? 'border-zinc-800/50 hover:bg-zinc-800/30' : 'border-slate-50 hover:bg-slate-50/80'
                    }`}
                  >
                    <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.name}</td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(item.isActive, isDark)}>{item.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleActive(item)}
                          title={item.isActive ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark ? 'text-zinc-400 hover:text-amber-400 hover:bg-amber-900/20' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                        >
                          {item.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          title="Edit"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                          }`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          title="Delete"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark ? 'text-zinc-400 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingItem ? `Edit ${entityLabel.replace(/s$/, '')}` : `Add ${entityLabel.replace(/s$/, '')}`}
        isDark={isDark}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {formError && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
              isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}
          <div>
            <label className={labelClass}>Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder={`Enter ${entityLabel.replace(/s$/, '').toLowerCase()} name`}
              className={inputClass}
              autoFocus
              required
            />
          </div>
          <div className={`flex items-center justify-end gap-3 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              } disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {editingItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${entityLabel.replace(/s$/, '')}`}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        isDark={isDark}
        isLoading={isDeleting}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// CategoriesTab — Name + OEM association
// ---------------------------------------------------------------------------

interface CategoriesTabProps {
  isDark: boolean;
  cardClass: string;
  inputClass: string;
  labelClass: string;
  selectClass: string;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({
  isDark, cardClass, inputClass, labelClass, selectClass,
}) => {
  const [items, setItems] = useState<MasterCategory[]>([]);
  const [oems, setOems] = useState<MasterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterCategory | null>(null);
  const [formName, setFormName] = useState('');
  const [formOemId, setFormOemId] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<MasterCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [cats, oemsList] = await Promise.all([
        masterDataApi.list('categories'),
        masterDataApi.list('oems'),
      ]);
      setItems(Array.isArray(cats) ? cats : []);
      setOems(Array.isArray(oemsList) ? oemsList : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const oemName = (oemId?: string) => {
    if (!oemId) return '-';
    return oems.find(o => o.id === oemId)?.name || '-';
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormName('');
    setFormOemId('');
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (item: MasterCategory) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormOemId(item.oemId || '');
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = formName.trim();
    if (!trimmed) {
      setFormError('Name is required');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      const payload: Record<string, any> = { name: trimmed };
      if (formOemId) payload.oem_id = formOemId;
      else payload.oem_id = null;

      if (editingItem) {
        await masterDataApi.update('categories', editingItem.id, payload);
      } else {
        await masterDataApi.create('categories', payload);
      }
      closeModal();
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await masterDataApi.delete('categories', deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleActive = async (item: MasterCategory) => {
    try {
      await masterDataApi.update('categories', item.id, { is_active: !item.isActive });
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className={`${cardClass} p-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
                isDark
                  ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
              } focus:outline-none focus:ring-1 focus:ring-brand-500`}
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`${cardClass} overflow-hidden`}>
        {error && (
          <div className={`m-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
            isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Loading categories...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
              <Tags className={`w-7 h-7 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
            </div>
            <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              {searchTerm ? 'No categories match your search' : 'No categories yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                  {['Name', 'OEM', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr
                    key={item.id}
                    className={`border-b transition-colors ${
                      isDark ? 'border-zinc-800/50 hover:bg-zinc-800/30' : 'border-slate-50 hover:bg-slate-50/80'
                    }`}
                  >
                    <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.name}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{oemName(item.oemId)}</td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(item.isActive, isDark)}>{item.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleActive(item)}
                          title={item.isActive ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark ? 'text-zinc-400 hover:text-amber-400 hover:bg-amber-900/20' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                        >
                          {item.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          title="Edit"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                          }`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          title="Delete"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark ? 'text-zinc-400 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingItem ? 'Edit Category' : 'Add Category'}
        isDark={isDark}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {formError && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
              isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}
          <div>
            <label className={labelClass}>Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="Enter category name"
              className={inputClass}
              autoFocus
              required
            />
          </div>
          <div>
            <label className={labelClass}>OEM</label>
            <select value={formOemId} onChange={e => setFormOemId(e.target.value)} className={selectClass}>
              <option value="">None</option>
              {oems.filter(o => o.isActive).map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div className={`flex items-center justify-end gap-3 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              } disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {editingItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        isDark={isDark}
        isLoading={isDeleting}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main AdminPage Component
// ---------------------------------------------------------------------------

export const AdminPage: React.FC = () => {
  const { theme } = useTheme();
  const { user, isAdmin } = useAuth();
  const isDark = theme === 'dark';

  // Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // ---------------------------------------------------------------------------
  // Users state
  // ---------------------------------------------------------------------------
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [usersSearch, setUsersSearch] = useState('');

  // User modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<UserFormData>({ ...EMPTY_USER_FORM });
  const [userFormError, setUserFormError] = useState('');
  const [isUserSubmitting, setIsUserSubmitting] = useState(false);

  // Reset password
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // ---------------------------------------------------------------------------
  // Products state
  // ---------------------------------------------------------------------------
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [productsSearch, setProductsSearch] = useState('');

  // Product modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>({ ...EMPTY_PRODUCT_FORM });
  const [productFormError, setProductFormError] = useState('');
  const [isProductSubmitting, setIsProductSubmitting] = useState(false);

  // Product delete
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // ---------------------------------------------------------------------------
  // Styling
  // ---------------------------------------------------------------------------
  const cardClass = `premium-card ${isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-soft'}`;
  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm transition-all ${
    isDark
      ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
  } focus:outline-none focus:ring-1 focus:ring-brand-500`;
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  // ---------------------------------------------------------------------------
  // Users data fetching
  // ---------------------------------------------------------------------------
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const data = await adminApi.listUsers();
      // API may return { data: User[], pagination } or User[]
      const list = Array.isArray(data) ? data : (data as any)?.data ?? [];
      setUsers(list);
    } catch (err: any) {
      setUsersError(err.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, fetchUsers]);

  // ---------------------------------------------------------------------------
  // Products data fetching
  // ---------------------------------------------------------------------------
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError('');
    try {
      const data = await productsApi.list();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setProductsError(err.message || 'Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
  }, [activeTab, fetchProducts]);

  // ---------------------------------------------------------------------------
  // User handlers
  // ---------------------------------------------------------------------------
  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm({ ...EMPTY_USER_FORM });
    setUserFormError('');
    setShowUserModal(true);
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      department: u.department || '',
      phone: u.phone || '',
      employeeId: u.employeeId || '',
      monthlyTarget: u.monthlyTarget ?? '',
      isActive: u.isActive,
      viewAccess: u.viewAccess || 'presales',
      tag: u.tag || '',
    });
    setUserFormError('');
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
    setUserFormError('');
  };

  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setUserForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === 'monthlyTarget') {
      setUserForm(prev => ({ ...prev, monthlyTarget: value === '' ? '' : Number(value) || 0 }));
    } else {
      setUserForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');

    if (!userForm.name.trim()) { setUserFormError('Name is required'); return; }
    if (!userForm.email.trim()) { setUserFormError('Email is required'); return; }
    if (!editingUser && !userForm.password) { setUserFormError('Password is required for new users'); return; }

    setIsUserSubmitting(true);
    try {
      const payload: Record<string, any> = {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        role: userForm.role,
        isActive: userForm.isActive,
      };
      if (userForm.department) payload.department = userForm.department;
      if (userForm.phone.trim()) payload.phone = userForm.phone.trim();
      if (userForm.employeeId.trim()) payload.employeeId = userForm.employeeId.trim();
      if (userForm.monthlyTarget !== '' && userForm.monthlyTarget !== 0) payload.monthlyTarget = Number(userForm.monthlyTarget);
      payload.viewAccess = userForm.viewAccess;
      if (userForm.tag) payload.tag = userForm.tag;

      if (editingUser) {
        await adminApi.updateUser(editingUser.id, payload);
      } else {
        payload.password = userForm.password;
        await adminApi.createUser(payload);
      }
      closeUserModal();
      fetchUsers();
    } catch (err: any) {
      setUserFormError(err.message || 'Failed to save user');
    } finally {
      setIsUserSubmitting(false);
    }
  };

  const toggleUserActive = async (u: User) => {
    try {
      await adminApi.updateUser(u.id, { isActive: !u.isActive });
      fetchUsers();
    } catch (err: any) {
      setUsersError(err.message || 'Failed to update status');
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword.trim()) return;
    setIsResettingPassword(true);
    try {
      await adminApi.resetPassword(resetPasswordUser.id, newPassword.trim());
      setResetPasswordUser(null);
      setNewPassword('');
    } catch (err: any) {
      setUsersError(err.message || 'Failed to reset password');
      setResetPasswordUser(null);
      setNewPassword('');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const term = usersSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term) ||
      (u.department || '').toLowerCase().includes(term)
    );
  });

  // ---------------------------------------------------------------------------
  // Product handlers
  // ---------------------------------------------------------------------------
  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({ ...EMPTY_PRODUCT_FORM });
    setProductFormError('');
    setShowProductModal(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      category: p.category || '',
      basePrice: p.basePrice ?? '',
      commissionRate: p.commissionRate ?? '',
      isActive: p.isActive,
    });
    setProductFormError('');
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setProductFormError('');
  };

  const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setProductForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === 'basePrice' || name === 'commissionRate') {
      setProductForm(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) || 0 }));
    } else {
      setProductForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError('');
    if (!productForm.name.trim()) { setProductFormError('Product name is required'); return; }

    setIsProductSubmitting(true);
    try {
      const payload: Record<string, any> = {
        name: productForm.name.trim(),
        isActive: productForm.isActive,
      };
      if (productForm.category.trim()) payload.category = productForm.category.trim();
      if (productForm.basePrice !== '') payload.basePrice = Number(productForm.basePrice);
      if (productForm.commissionRate !== '') payload.commissionRate = Number(productForm.commissionRate);

      if (editingProduct) {
        await productsApi.update(editingProduct.id, payload);
      } else {
        await productsApi.create(payload);
      }
      closeProductModal();
      fetchProducts();
    } catch (err: any) {
      setProductFormError(err.message || 'Failed to save product');
    } finally {
      setIsProductSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductTarget) return;
    setIsDeletingProduct(true);
    try {
      await productsApi.delete(deleteProductTarget.id);
      setDeleteProductTarget(null);
      fetchProducts();
    } catch (err: any) {
      setProductsError(err.message || 'Failed to delete product');
      setDeleteProductTarget(null);
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const term = productsSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term)
    );
  });

  // ---------------------------------------------------------------------------
  // Access guard
  // ---------------------------------------------------------------------------
  if (!isAdmin()) {
    return (
      <div className="p-3 sm:p-4 lg:p-6 animate-fade-in-up">
        <div className={`${cardClass} p-12 text-center`}>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
            <Shield className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          </div>
          <h2 className={`text-lg font-semibold font-display mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Access Denied
          </h2>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            You do not have admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderUsersTab = () => (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className={`${cardClass} p-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search users by name, email, role..."
              value={usersSearch}
              onChange={e => setUsersSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
                isDark
                  ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
              } focus:outline-none focus:ring-1 focus:ring-brand-500`}
            />
          </div>
          <button
            onClick={openCreateUser}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`${cardClass} overflow-hidden`}>
        {usersError && (
          <div className={`m-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
            isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {usersError}
          </div>
        )}

        {usersLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
              <Users className={`w-7 h-7 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
            </div>
            <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              {usersSearch ? 'No users match your search' : 'No users yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                  {['Name', 'Email', 'Role', 'Department', 'Tag', 'Status', 'Last Login', 'Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr
                    key={u.id}
                    className={`border-b transition-colors ${
                      isDark ? 'border-zinc-800/50 hover:bg-zinc-800/30' : 'border-slate-50 hover:bg-slate-50/80'
                    }`}
                  >
                    <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{u.name}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={roleBadge(u.role, isDark)}>{roleLabel(u.role)}</span>
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{u.department || '-'}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {u.tag === 'channel' ? 'Channel' : u.tag === 'endcustomer' ? 'End Customer' : u.tag === 'both' ? 'Both' : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(u.isActive, isDark)}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {formatDate(u.lastLogin)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleUserActive(u)}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark ? 'text-zinc-400 hover:text-amber-400 hover:bg-amber-900/20' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                        >
                          {u.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditUser(u)}
                          title="Edit"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                          }`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setResetPasswordUser(u); setNewPassword(''); }}
                          title="Reset Password"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark ? 'text-zinc-400 hover:text-orange-400 hover:bg-orange-900/20' : 'text-slate-400 hover:text-orange-600 hover:bg-orange-50'
                          }`}
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={closeUserModal}
        title={editingUser ? 'Edit User' : 'Create User'}
        isDark={isDark}
      >
        <form onSubmit={handleUserSubmit} className="p-6 space-y-5">
          {userFormError && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
              isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {userFormError}
            </div>
          )}

          {/* Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                value={userForm.name}
                onChange={handleUserFormChange}
                placeholder="Full name"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="email"
                value={userForm.email}
                onChange={handleUserFormChange}
                placeholder="user@gmail.com"
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* Password (only for create) + Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!editingUser && (
              <div>
                <label className={labelClass}>Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  name="password"
                  value={userForm.password}
                  onChange={handleUserFormChange}
                  placeholder="Set password"
                  className={inputClass}
                  required
                />
              </div>
            )}
            <div>
              <label className={labelClass}>Role <span className="text-red-500">*</span></label>
              <select name="role" value={userForm.role} onChange={handleUserFormChange} className={selectClass}>
                {USER_ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>View Access <span className="text-red-500">*</span></label>
              <select name="viewAccess" value={userForm.viewAccess} onChange={handleUserFormChange} className={selectClass}>
                <option value="presales">Pre-Sales (Leads, Accounts, Contacts, Deals)</option>
                <option value="postsales">Post-Sales (Sales Entry, Partners)</option>
                <option value="both">Both (All Features)</option>
              </select>
            </div>
          </div>

          {/* Department + Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Department</label>
              <select name="department" value={userForm.department} onChange={handleUserFormChange} className={selectClass}>
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Tag</label>
              <select name="tag" value={userForm.tag} onChange={handleUserFormChange} className={selectClass}>
                {USER_TAGS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                name="phone"
                value={userForm.phone}
                onChange={handleUserFormChange}
                placeholder="+91 XXXXX XXXXX"
                className={inputClass}
              />
            </div>
          </div>

          {/* Employee ID + Monthly Target */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Employee ID</label>
              <input
                type="text"
                name="employeeId"
                value={userForm.employeeId}
                onChange={handleUserFormChange}
                placeholder="EMP-001"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Monthly Target (INR)</label>
              <input
                type="number"
                name="monthlyTarget"
                value={userForm.monthlyTarget}
                onChange={handleUserFormChange}
                placeholder="0"
                min="0"
                step="1000"
                className={inputClass}
              />
            </div>
          </div>

          {/* Active toggle */}
          {editingUser && (
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={userForm.isActive}
                  onChange={handleUserFormChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:bg-brand-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
              <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Active</span>
            </div>
          )}

          {/* Footer */}
          <div className={`flex items-center justify-end gap-3 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={closeUserModal}
              disabled={isUserSubmitting}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              } disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUserSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium disabled:opacity-50"
            >
              {isUserSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Dialog */}
      <ConfirmDialog
        isOpen={!!resetPasswordUser}
        onClose={() => { setResetPasswordUser(null); setNewPassword(''); }}
        onConfirm={handleResetPassword}
        title="Reset Password"
        message={`Set a new password for ${resetPasswordUser?.name} (${resetPasswordUser?.email}).`}
        isDark={isDark}
        isLoading={isResettingPassword}
        confirmLabel="Reset Password"
      >
        <div className="mt-3">
          <label className={labelClass}>New Password <span className="text-red-500">*</span></label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            className={inputClass}
            autoFocus
          />
        </div>
      </ConfirmDialog>
    </div>
  );

  const renderProductsTab = () => (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className={`${cardClass} p-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search products..."
              value={productsSearch}
              onChange={e => setProductsSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
                isDark
                  ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
              } focus:outline-none focus:ring-1 focus:ring-brand-500`}
            />
          </div>
          <button
            onClick={openCreateProduct}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`${cardClass} overflow-hidden`}>
        {productsError && (
          <div className={`m-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
            isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {productsError}
          </div>
        )}

        {productsLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
              <Package className={`w-7 h-7 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
            </div>
            <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              {productsSearch ? 'No products match your search' : 'No products yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                  {['Name', 'Category', 'Base Price', 'Commission %', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr
                    key={p.id}
                    className={`border-b transition-colors ${
                      isDark ? 'border-zinc-800/50 hover:bg-zinc-800/30' : 'border-slate-50 hover:bg-slate-50/80'
                    }`}
                  >
                    <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.name}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{p.category || '-'}</td>
                    <td className={`px-4 py-3 whitespace-nowrap font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {p.basePrice != null ? formatINR(p.basePrice) : '-'}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {p.commissionRate != null ? `${p.commissionRate}%` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(p.isActive, isDark)}>{p.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditProduct(p)}
                          title="Edit"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                          }`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteProductTarget(p)}
                          title="Delete"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark ? 'text-zinc-400 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Product Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={closeProductModal}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        isDark={isDark}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleProductSubmit} className="p-6 space-y-5">
          {productFormError && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
              isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {productFormError}
            </div>
          )}

          <div>
            <label className={labelClass}>Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              value={productForm.name}
              onChange={handleProductFormChange}
              placeholder="Product name"
              className={inputClass}
              autoFocus
              required
            />
          </div>

          <div>
            <label className={labelClass}>Category</label>
            <input
              type="text"
              name="category"
              value={productForm.category}
              onChange={handleProductFormChange}
              placeholder="e.g. Laptops, Printers"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Base Price (INR)</label>
              <input
                type="number"
                name="basePrice"
                value={productForm.basePrice}
                onChange={handleProductFormChange}
                placeholder="0"
                min="0"
                step="100"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Commission Rate (%)</label>
              <input
                type="number"
                name="commissionRate"
                value={productForm.commissionRate}
                onChange={handleProductFormChange}
                placeholder="0"
                min="0"
                max="100"
                step="0.1"
                className={inputClass}
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={productForm.isActive}
                onChange={handleProductFormChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:bg-brand-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Active</span>
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-end gap-3 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={closeProductModal}
              disabled={isProductSubmitting}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              } disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProductSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium disabled:opacity-50"
            >
              {isProductSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Product Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteProductTarget}
        onClose={() => setDeleteProductTarget(null)}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteProductTarget?.name}"? This action cannot be undone.`}
        isDark={isDark}
        isLoading={isDeletingProduct}
      />
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return renderUsersTab();
      case 'products':
        return renderProductsTab();
      case 'oems':
        return <MasterDataTab entity="oems" entityLabel="OEMs" isDark={isDark} cardClass={cardClass} inputClass={inputClass} labelClass={labelClass} />;
      case 'categories':
        return <CategoriesTab isDark={isDark} cardClass={cardClass} inputClass={inputClass} labelClass={labelClass} selectClass={selectClass} />;
      case 'product-managers':
        return <ProductManagersTab isDark={isDark} cardClass={cardClass} selectClass={selectClass} />;
      case 'roles':
        return <RolesTab isDark={isDark} cardClass={cardClass} inputClass={inputClass} />;
      case 'activity-log':
        return <ActivityLogTab isDark={isDark} cardClass={cardClass} inputClass={inputClass} selectClass={selectClass} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div>
        <h1 className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Admin Panel
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          Manage users, products, and master data for Comprint CRM.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={`${cardClass} p-1.5`}>
        <div className="flex overflow-x-auto gap-1 scrollbar-hide">
          {TABS.filter(tab => !tab.superadminOnly || user?.role === 'superadmin').map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : isDark
                      ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};
