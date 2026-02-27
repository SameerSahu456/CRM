import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Search, Edit2, Trash2, Loader2, AlertCircle, CheckCircle,
  Users, Layers, Building2, Tags, ChevronLeft, ChevronRight,
  Shield, Key, ToggleLeft, ToggleRight, History,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, masterDataApi } from '@/services/api';
import { User, UserRole, MasterItem, MasterCategory } from '@/types';
import { ActivityLogTab } from '@/components/features/admin/ActivityLogTab';
import { RolesTab } from '@/components/features/admin/RolesTab';
import { ProductManagersTab } from '@/components/features/admin/ProductManagersTab';
import { Card, Button, Input, Select, Modal, Badge, Alert, Pagination } from '@/components/ui';
import { cx } from '@/utils/cx';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type AdminTab = 'users' | 'oems' | 'categories' | 'product-managers' | 'roles' | 'activity-log';

const TABS: { key: AdminTab; label: string; icon: React.ElementType; superadminOnly?: boolean }[] = [
  { key: 'users', label: 'Users', icon: Users },
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
  { value: 'manager', label: 'Manager' },
  { value: 'presales', label: 'Pre-Sales' },
  { value: 'support', label: 'Support' },
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
  managerId: string;
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
  managerId: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roleBadgeVariant(role: UserRole): 'red' | 'blue' | 'amber' | 'purple' | 'gray' {
  switch (role) {
    case 'admin':
    case 'superadmin':
      return 'red';
    case 'sales':
      return 'blue';
    case 'manager':
      return 'amber';
    case 'presales':
      return 'blue';
    case 'support':
      return 'gray';
    case 'businesshead':
      return 'amber';
    case 'productmanager':
      return 'purple';
    default:
      return 'gray';
  }
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
// Confirm Dialog
// ---------------------------------------------------------------------------

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
  confirmLabel?: string;
  children?: React.ReactNode;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, onClose, onConfirm, title, message, isLoading, confirmLabel = 'Delete', children,
}) => {
  if (!isOpen) return null;
  return (
    <Modal open={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-500 dark:text-zinc-400">{message}</p>
      {children}
      <div className="flex items-center justify-end gap-3 mt-5">
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={isLoading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// MasterDataTab -- Generic for OEMs
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

interface MasterDataTabProps {
  entity: string;
  entityLabel: string;
}

const MasterDataTab: React.FC<MasterDataTabProps> = ({
  entity, entityLabel,
}) => {
  const [items, setItems] = useState<MasterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card padding="none" className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <Input
              placeholder={`Search ${entityLabel.toLowerCase()}...`}
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />} shine>
            Add {entityLabel.replace(/s$/, '')}
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        {error && (
          <div className="m-4">
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {error}
            </Alert>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">Loading {entityLabel.toLowerCase()}...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gray-100 dark:bg-zinc-800">
              <Layers className="w-7 h-7 text-gray-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">
              {searchTerm ? `No ${entityLabel.toLowerCase()} match your search` : `No ${entityLabel.toLowerCase()} yet`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800">
                  {['Name', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map(item => (
                  <tr
                    key={item.id}
                    className="border-b transition-colors border-gray-50 hover:bg-gray-50/80 dark:border-zinc-800/50 dark:hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.isActive ? 'success' : 'gray'}>{item.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleActive(item)}
                          title={item.isActive ? 'Deactivate' : 'Activate'}
                          className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:text-zinc-400 dark:hover:text-amber-400 dark:hover:bg-amber-900/20"
                        >
                          {item.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          title="Edit"
                          className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:text-zinc-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          title="Delete"
                          className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-red-600 hover:bg-red-50 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
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
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          className="border-t border-gray-100 dark:border-zinc-800"
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingItem ? `Edit ${entityLabel.replace(/s$/, '')}` : `Add ${entityLabel.replace(/s$/, '')}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="master-data-form"
              loading={isSubmitting}
              icon={!isSubmitting ? <CheckCircle className="w-4 h-4" /> : undefined}
              shine
            >
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="master-data-form" onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {formError}
            </Alert>
          )}
          <Input
            label={`Name *`}
            value={formName}
            onChange={e => setFormName(e.target.value)}
            placeholder={`Enter ${entityLabel.replace(/s$/, '').toLowerCase()} name`}
            autoFocus
            required
          />
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${entityLabel.replace(/s$/, '')}`}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// CategoriesTab -- Name + Product Manager association
// ---------------------------------------------------------------------------

interface PMUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  isActive?: boolean;
}

function parsePmIds(raw?: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const CategoriesTab: React.FC = () => {
  const [items, setItems] = useState<MasterCategory[]>([]);
  const [pmUsers, setPmUsers] = useState<PMUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterCategory | null>(null);
  const [formName, setFormName] = useState('');
  const [formPmIds, setFormPmIds] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pmSearch, setPmSearch] = useState('');

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<MasterCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [cats, userData] = await Promise.all([
        masterDataApi.list('categories'),
        adminApi.listUsers(),
      ]);
      setItems(Array.isArray(cats) ? cats : []);

      const rawUsers = Array.isArray(userData) ? userData : (userData as any)?.data ?? [];
      const userList: PMUser[] = rawUsers
        .map((u: any) => ({
          id: u.id,
          name: u.name || u.email,
          email: u.email,
          role: u.role,
          isActive: u.isActive ?? true,
        }))
        .filter((u: PMUser) => u.role === 'productmanager' && u.isActive !== false);
      setPmUsers(userList);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingItem(null);
    setFormName('');
    setFormPmIds([]);
    setFormError('');
    setPmSearch('');
    setShowModal(true);
  };

  const openEdit = (item: MasterCategory) => {
    setEditingItem(item);
    setFormName(item.name);
    const ids = parsePmIds(item.productManagerIds);
    setFormPmIds(ids.length > 0 ? ids : item.productManagerId ? [item.productManagerId] : []);
    setFormError('');
    setPmSearch('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormError('');
    setPmSearch('');
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
      const payload: Record<string, any> = {
        name: trimmed,
        productManagerIds: JSON.stringify(formPmIds),
      };

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

  const togglePm = (userId: string) => {
    setFormPmIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const removePm = (userId: string) => {
    setFormPmIds(prev => prev.filter(id => id !== userId));
  };

  const filteredPmUsers = pmUsers.filter(u => {
    if (!pmSearch.trim()) return true;
    const term = pmSearch.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  });

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card padding="none" className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />} shine>
            Add Category
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        {error && (
          <div className="m-4">
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {error}
            </Alert>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">Loading categories...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gray-100 dark:bg-zinc-800">
              <Tags className="w-7 h-7 text-gray-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">
              {searchTerm ? 'No categories match your search' : 'No categories yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800">
                  {['Name', 'Product Managers', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map(item => (
                  <tr
                    key={item.id}
                    className="border-b transition-colors border-gray-50 hover:bg-gray-50/80 dark:border-zinc-800/50 dark:hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {(() => {
                        const ids = parsePmIds(item.productManagerIds);
                        const legacyId = item.productManagerId;
                        const allIds = ids.length > 0 ? ids : legacyId ? [legacyId] : [];
                        if (allIds.length === 0) return <span className="text-gray-400 dark:text-zinc-600">-</span>;
                        return (
                          <div className="flex flex-wrap gap-1">
                            {allIds.map(id => {
                              const u = pmUsers.find(p => p.id === id);
                              return (
                                <Badge key={id} variant="brand" size="sm">
                                  {u ? u.name : id.slice(0, 8)}
                                </Badge>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={item.isActive ? 'success' : 'gray'}>{item.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleActive(item)}
                          title={item.isActive ? 'Deactivate' : 'Activate'}
                          className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:text-zinc-400 dark:hover:text-amber-400 dark:hover:bg-amber-900/20"
                        >
                          {item.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          title="Edit"
                          className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:text-zinc-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          title="Delete"
                          className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-red-600 hover:bg-red-50 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
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
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          className="border-t border-gray-100 dark:border-zinc-800"
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingItem ? 'Edit Category' : 'Add Category'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="category-form"
              loading={isSubmitting}
              icon={!isSubmitting ? <CheckCircle className="w-4 h-4" /> : undefined}
              shine
            >
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {formError}
            </Alert>
          )}
          <Input
            label="Name *"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            placeholder="Enter category name"
            autoFocus
            required
          />
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              Product Managers
              {formPmIds.length > 0 && (
                <span className="ml-2 text-xs font-normal text-brand-600 dark:text-brand-400">
                  ({formPmIds.length} selected)
                </span>
              )}
            </label>

            {/* Selected chips */}
            {formPmIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {formPmIds.map(id => {
                  const u = pmUsers.find(p => p.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-500/20 dark:text-brand-300 dark:border-brand-500/30"
                    >
                      {u ? u.name : id.slice(0, 8)}
                      <button
                        type="button"
                        onClick={() => removePm(id)}
                        className="rounded-full p-0.5 transition-colors hover:bg-brand-100 dark:hover:bg-brand-500/30"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search */}
            {pmUsers.length > 4 && (
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Search product managers..."
                  value={pmSearch}
                  onChange={e => setPmSearch(e.target.value)}
                  className={cx(
                    'w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border transition-colors',
                    'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-brand-500',
                    'dark:bg-dark-100 dark:border-zinc-700 dark:text-white dark:placeholder-zinc-500 dark:focus:border-brand-500',
                    'focus:outline-none'
                  )}
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 pointer-events-none" />
              </div>
            )}

            {/* Inline checkbox list */}
            <div className="rounded-xl border max-h-44 overflow-y-auto border-gray-200 bg-gray-50/50 dark:border-zinc-700 dark:bg-dark-100">
              {filteredPmUsers.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-gray-400 dark:text-zinc-500">
                  {pmUsers.length === 0 ? 'No users with "productmanager" role found' : 'No matches'}
                </div>
              ) : (
                filteredPmUsers.map(user => {
                  const isSelected = formPmIds.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => togglePm(user.id)}
                      className={cx(
                        'w-full px-3 py-2 flex items-center gap-2.5 text-left transition-colors',
                        isSelected
                          ? 'bg-brand-50 dark:bg-brand-500/15'
                          : 'hover:bg-white/60 dark:hover:bg-white/[0.04]'
                      )}
                    >
                      <div className={cx(
                        'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors',
                        isSelected
                          ? 'bg-brand-600 border-brand-600'
                          : 'border-gray-300 dark:border-zinc-600'
                      )}>
                        {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-[10px] truncate text-gray-400 dark:text-zinc-500">
                          {user.email}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
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
        isLoading={isDeleting}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main AdminPage Component
// ---------------------------------------------------------------------------

export const AdminPage: React.FC = () => {
  const { user, isAdmin } = useAuth();

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

  // User detail popup
  const [detailUser, setDetailUser] = useState<User | null>(null);

  // Reset password
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Pagination
  const [usersPage, setUsersPage] = useState(1);

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
      managerId: u.managerId || '',
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
      if (userForm.managerId) payload.managerId = userForm.managerId;
      else payload.managerId = null;

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

  const usersTotalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);

  // ---------------------------------------------------------------------------
  // Access guard
  // ---------------------------------------------------------------------------
  if (!isAdmin()) {
    return (
      <div className="p-3 sm:p-4 lg:p-6 animate-fade-in-up">
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-50 dark:bg-red-900/20">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-semibold font-display mb-2 text-gray-900 dark:text-white">
            Access Denied
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            You do not have admin privileges to access this page.
          </p>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderUsersTab = () => (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card padding="none" className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Search users by name, email, role..."
              value={usersSearch}
              onChange={e => { setUsersSearch(e.target.value); setUsersPage(1); }}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button onClick={openCreateUser} icon={<Plus className="w-4 h-4" />} shine>
            Add User
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        {usersError && (
          <div className="m-4">
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {usersError}
            </Alert>
          </div>
        )}

        {usersLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gray-100 dark:bg-zinc-800">
              <Users className="w-7 h-7 text-gray-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">
              {usersSearch ? 'No users match your search' : 'No users yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800">
                  {['Name', 'Email', 'Role', 'Department', 'Manager', 'Tag', 'Status', 'Last Login', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.slice((usersPage - 1) * PAGE_SIZE, usersPage * PAGE_SIZE).map(u => (
                  <tr
                    key={u.id}
                    onClick={() => setDetailUser(u)}
                    className="border-b transition-colors cursor-pointer border-gray-50 hover:bg-gray-50/80 dark:border-zinc-800/50 dark:hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{u.name}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={roleBadgeVariant(u.role)}>{roleLabel(u.role)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{u.department || '-'}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{(u as any).managerName || '-'}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {u.tag === 'channel' ? 'Channel' : u.tag === 'endcustomer' ? 'End Customer' : u.tag === 'both' ? 'Both' : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.isActive ? 'success' : 'gray'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {formatDate(u.lastLogin)}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleUserActive(u)}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                          className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:text-zinc-400 dark:hover:text-amber-400 dark:hover:bg-amber-900/20"
                        >
                          {u.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditUser(u)}
                          title="Edit"
                          className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:text-zinc-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setResetPasswordUser(u); setNewPassword(''); }}
                          title="Reset Password"
                          className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:text-zinc-400 dark:hover:text-orange-400 dark:hover:bg-orange-900/20"
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
        <Pagination
          currentPage={usersPage}
          totalPages={usersTotalPages}
          totalItems={filteredUsers.length}
          pageSize={PAGE_SIZE}
          onPageChange={setUsersPage}
          className="border-t border-gray-100 dark:border-zinc-800"
        />
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        open={showUserModal}
        onClose={closeUserModal}
        title={editingUser ? 'Edit User' : 'Create User'}
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={closeUserModal} disabled={isUserSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="user-form"
              loading={isUserSubmitting}
              icon={!isUserSubmitting ? <CheckCircle className="w-4 h-4" /> : undefined}
              shine
            >
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleUserSubmit} className="space-y-5">
          {userFormError && (
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {userFormError}
            </Alert>
          )}

          {/* Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Name *"
              name="name"
              value={userForm.name}
              onChange={handleUserFormChange}
              placeholder="Full name"
              required
            />
            <Input
              label="Email *"
              type="email"
              name="email"
              value={userForm.email}
              onChange={handleUserFormChange}
              placeholder="user@gmail.com"
              required
            />
          </div>

          {/* Password (only for create) + Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!editingUser && (
              <Input
                label="Password *"
                type="password"
                name="password"
                value={userForm.password}
                onChange={handleUserFormChange}
                placeholder="Set password"
                required
              />
            )}
            <Select label="Role *" name="role" value={userForm.role} onChange={handleUserFormChange}>
              {USER_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Select>
            <Select label="View Access *" name="viewAccess" value={userForm.viewAccess} onChange={handleUserFormChange}>
              <option value="presales">Pre-Sales (Leads, Accounts, Contacts, Deals)</option>
              <option value="postsales">Post-Sales (Sales Entry, Partners)</option>
              <option value="both">Both (All Features)</option>
            </Select>
          </div>

          {/* Department + Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Department" name="department" value={userForm.department} onChange={handleUserFormChange}>
              <option value="">Select Department</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
            <Select label="Tag" name="tag" value={userForm.tag} onChange={handleUserFormChange}>
              {USER_TAGS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </div>

          {/* Manager + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Manager" name="managerId" value={userForm.managerId} onChange={handleUserFormChange}>
              <option value="">No Manager</option>
              {users.filter(u => u.id !== editingUser?.id).map(u => (
                <option key={u.id} value={u.id}>{u.name} ({roleLabel(u.role)})</option>
              ))}
            </Select>
            <Input
              label="Phone"
              type="tel"
              name="phone"
              value={userForm.phone}
              onChange={handleUserFormChange}
              placeholder="+91 XXXXX XXXXX"
            />
          </div>

          {/* Employee ID + Monthly Target */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Employee ID"
              name="employeeId"
              value={userForm.employeeId}
              onChange={handleUserFormChange}
              placeholder="EMP-001"
            />
            <Input
              label="Monthly Target (INR)"
              type="number"
              name="monthlyTarget"
              value={String(userForm.monthlyTarget)}
              onChange={handleUserFormChange}
              placeholder="0"
              min={0}
              step={1000}
            />
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
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full dark:bg-zinc-700 peer-checked:bg-brand-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
            </div>
          )}
        </form>
      </Modal>

      {/* Reset Password Dialog */}
      <ConfirmDialog
        isOpen={!!resetPasswordUser}
        onClose={() => { setResetPasswordUser(null); setNewPassword(''); }}
        onConfirm={handleResetPassword}
        title="Reset Password"
        message={`Set a new password for ${resetPasswordUser?.name} (${resetPasswordUser?.email}).`}
        isLoading={isResettingPassword}
        confirmLabel="Reset Password"
      >
        <div className="mt-3">
          <Input
            label="New Password *"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            autoFocus
          />
        </div>
      </ConfirmDialog>

      {/* User Detail Modal -- portaled to body to escape transform containing block */}
      {detailUser && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={() => setDetailUser(null)} />
          <div className={cx(
            'relative w-full max-w-lg rounded-2xl animate-fade-in-up max-h-[90vh] flex flex-col overflow-hidden',
            'bg-white/90 backdrop-blur-xl shadow-xl border border-white/60',
            'dark:bg-[rgba(8,14,30,0.95)] dark:border-zinc-800 dark:shadow-2xl'
          )}>
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                  {detailUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold font-display text-gray-900 dark:text-white">
                    {detailUser.name}
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{detailUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailUser(null)}
                className="p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Status Banner */}
              <div className={cx(
                'rounded-xl p-4 flex items-center gap-4 border',
                detailUser.isActive
                  ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30'
                  : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/30'
              )}>
                <div className="flex-1">
                  <p className={cx(
                    'text-sm font-medium',
                    detailUser.isActive
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-700 dark:text-red-400'
                  )}>
                    {detailUser.isActive ? 'Active' : 'Inactive'}
                  </p>
                  <p className="text-lg font-bold mt-0.5 text-gray-900 dark:text-white">
                    <Badge variant={roleBadgeVariant(detailUser.role)}>{roleLabel(detailUser.role)}</Badge>
                  </p>
                </div>
                <Badge variant={detailUser.isActive ? 'success' : 'gray'}>{detailUser.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>

              {/* Info */}
              <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                <div className="flex items-start gap-3 py-2">
                  <p className="text-xs font-medium w-32 flex-shrink-0 pt-0.5 text-gray-400 dark:text-zinc-500">Department</p>
                  <p className="text-sm text-gray-900 dark:text-white">{detailUser.department || '-'}</p>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <p className="text-xs font-medium w-32 flex-shrink-0 pt-0.5 text-gray-400 dark:text-zinc-500">Manager</p>
                  <p className="text-sm text-gray-900 dark:text-white">{(detailUser as any).managerName || '-'}</p>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <p className="text-xs font-medium w-32 flex-shrink-0 pt-0.5 text-gray-400 dark:text-zinc-500">Tag</p>
                  <p className="text-sm text-gray-900 dark:text-white">{detailUser.tag === 'channel' ? 'Channel' : detailUser.tag === 'endcustomer' ? 'End Customer' : detailUser.tag === 'both' ? 'Both' : '-'}</p>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <p className="text-xs font-medium w-32 flex-shrink-0 pt-0.5 text-gray-400 dark:text-zinc-500">View Access</p>
                  <p className="text-sm text-gray-900 dark:text-white">{detailUser.viewAccess === 'presales' ? 'Pre-Sales' : detailUser.viewAccess === 'postsales' ? 'Post-Sales' : detailUser.viewAccess === 'both' ? 'Both' : '-'}</p>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <p className="text-xs font-medium w-32 flex-shrink-0 pt-0.5 text-gray-400 dark:text-zinc-500">Phone</p>
                  <p className="text-sm text-gray-900 dark:text-white">{detailUser.phone || '-'}</p>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <p className="text-xs font-medium w-32 flex-shrink-0 pt-0.5 text-gray-400 dark:text-zinc-500">Employee ID</p>
                  <p className="text-sm text-gray-900 dark:text-white">{detailUser.employeeId || '-'}</p>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <p className="text-xs font-medium w-32 flex-shrink-0 pt-0.5 text-gray-400 dark:text-zinc-500">Monthly Target</p>
                  <p className="text-sm text-gray-900 dark:text-white">{detailUser.monthlyTarget ? `₹${Number(detailUser.monthlyTarget).toLocaleString('en-IN')}` : '-'}</p>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <p className="text-xs font-medium w-32 flex-shrink-0 pt-0.5 text-gray-400 dark:text-zinc-500">Last Login</p>
                  <p className="text-sm text-gray-900 dark:text-white">{formatDate(detailUser.lastLogin)}</p>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <p className="text-xs font-medium w-32 flex-shrink-0 pt-0.5 text-gray-400 dark:text-zinc-500">Created</p>
                  <p className="text-sm text-gray-900 dark:text-white">{formatDate(detailUser.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex items-center gap-3 px-6 py-4 border-t border-gray-200 dark:border-zinc-800">
              <Button
                onClick={() => { setDetailUser(null); openEditUser(detailUser); }}
                icon={<Edit2 className="w-4 h-4" />}
              >
                Edit User
              </Button>
              <Button variant="secondary" onClick={() => setDetailUser(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return renderUsersTab();
      case 'oems':
        return <MasterDataTab entity="oems" entityLabel="OEMs" />;
      case 'categories':
        return <CategoriesTab />;
      case 'product-managers':
        return <ProductManagersTab />;
      case 'roles':
        return <RolesTab />;
      case 'activity-log':
        return <ActivityLogTab />;
      default:
        return null;
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">
          Admin Panel
        </h1>
        <p className="text-sm mt-1 text-gray-500 dark:text-zinc-400">
          Manage users, products, and master data for Comprint CRM.
        </p>
      </div>

      {/* Tab Navigation */}
      <Card padding="none" className="p-1.5">
        <div className="flex overflow-x-auto gap-1 scrollbar-hide">
          {TABS.filter(tab => !tab.superadminOnly || user?.role === 'superadmin').map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cx(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};
