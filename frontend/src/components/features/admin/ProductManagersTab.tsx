import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, AlertCircle, Save, CheckCircle, UserCog, ChevronDown, Search, Users, Mail, Shield } from 'lucide-react';
import { masterDataApi, adminApi } from '@/services/api';
import { Card, Button, Input, Badge, Alert } from '@/components/ui';
import { cx } from '@/utils/cx';

interface CategoryWithManager {
  id: string;
  name: string;
  oemId?: string;
  isActive: boolean;
  productManagerId?: string;
  productManagerIds?: string; // JSON string: '["uuid1","uuid2"]'
}

interface OemItem {
  id: string;
  name: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role?: string;
  isActive?: boolean;
}

// Multi-select dropdown component
const MultiSelectDropdown: React.FC<{
  selectedIds: string[];
  users: UserItem[];
  onChange: (ids: string[]) => void;
}> = ({ selectedIds, users, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = users.filter(u => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  });

  const toggleUser = (userId: string) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter(id => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const removeUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter(id => id !== userId));
  };

  const selectedUsers = users.filter(u => selectedIds.includes(u.id));

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cx(
          'min-h-[38px] flex items-center flex-wrap gap-1.5 px-2.5 py-1.5 rounded-xl text-sm border cursor-pointer transition-all',
          'bg-white border-gray-300 hover:border-gray-400',
          'dark:bg-dark-100 dark:border-zinc-700 dark:hover:border-zinc-600',
          isOpen && 'border-brand-500 ring-1 ring-brand-500/20 dark:border-brand-500 dark:ring-1 dark:ring-brand-500/20'
        )}
      >
        {selectedUsers.length === 0 ? (
          <span className="text-gray-400 dark:text-zinc-500 text-sm">
            Select product managers...
          </span>
        ) : (
          selectedUsers.map(user => (
            <span
              key={user.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-500/20 dark:text-brand-300 dark:border-brand-500/30"
            >
              {user.name}
              <button
                onClick={(e) => removeUser(user.id, e)}
                className="rounded-full p-0.5 transition-colors hover:bg-brand-100 dark:hover:bg-brand-500/30"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))
        )}
        <ChevronDown className={cx(
          'w-4 h-4 ml-auto flex-shrink-0 transition-transform',
          'text-gray-400 dark:text-zinc-500',
          isOpen && 'rotate-180'
        )} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={cx(
          'absolute top-full left-0 right-0 mt-1.5 rounded-xl border z-50 overflow-hidden shadow-lg',
          'bg-white border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.1)]',
          'dark:bg-[rgba(15,20,35,0.98)] dark:border-zinc-700 dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]'
        )}>
          {/* Search */}
          <div className="p-2 border-b border-gray-100 dark:border-zinc-700/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search product managers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                className={cx(
                  'w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border transition-colors',
                  'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-brand-500',
                  'dark:bg-dark-100 dark:border-zinc-700 dark:text-white dark:placeholder-zinc-500 dark:focus:border-brand-500',
                  'focus:outline-none'
                )}
              />
            </div>
          </div>

          {/* User list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400 dark:text-zinc-500">
                No product managers found
              </div>
            ) : (
              filteredUsers.map(user => {
                const isSelected = selectedIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={cx(
                      'w-full px-3 py-2 flex items-center gap-2.5 text-left transition-colors',
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-500/15'
                        : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                    )}
                  >
                    {/* Checkbox */}
                    <div className={cx(
                      'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors',
                      isSelected
                        ? 'bg-brand-600 border-brand-600'
                        : 'border-gray-300 dark:border-zinc-600'
                    )}>
                      {isSelected && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
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

          {/* Footer */}
          {selectedIds.length > 0 && (
            <div className="px-3 py-2 border-t text-[10px] border-gray-100 text-gray-400 dark:border-zinc-700/50 dark:text-zinc-500">
              {selectedIds.length} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper to parse the JSON string of PM IDs
function parsePmIds(raw?: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const ProductManagersTab: React.FC = () => {
  const [categories, setCategories] = useState<CategoryWithManager[]>([]);
  const [oems, setOems] = useState<OemItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Track per-row assignment changes (array of user IDs) and saving state
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});
  const [savedRows, setSavedRows] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [catData, oemData, userData] = await Promise.all([
        masterDataApi.list('categories'),
        masterDataApi.list('oems'),
        adminApi.listUsers(),
      ]);

      const catList: CategoryWithManager[] = Array.isArray(catData) ? catData : [];
      const oemList: OemItem[] = Array.isArray(oemData) ? oemData : [];

      // adminApi.listUsers() returns { data: User[], pagination } or an array
      const rawUsers = Array.isArray(userData) ? userData : (userData as any)?.data ?? [];
      const userList: UserItem[] = rawUsers.map((u: any) => ({
        id: u.id,
        name: u.name || u.email,
        email: u.email,
        role: u.role,
        isActive: u.isActive ?? true,
      }));

      setCategories(catList);
      setOems(oemList);
      setUsers(userList);

      // Initialize assignments from existing data
      const initial: Record<string, string[]> = {};
      catList.forEach(cat => {
        // Support both new multi-select (productManagerIds) and legacy single (productManagerId)
        const ids = parsePmIds(cat.productManagerIds);
        if (ids.length > 0) {
          initial[cat.id] = ids;
        } else if (cat.productManagerId) {
          initial[cat.id] = [cat.productManagerId];
        } else {
          initial[cat.id] = [];
        }
      });
      setAssignments(initial);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getManagerNames = (managerIds: string[]): string[] => {
    return managerIds.map(id => {
      const user = users.find(u => u.id === id);
      return user ? user.name : id;
    });
  };

  const handleAssignmentChange = (categoryId: string, userIds: string[]) => {
    setAssignments(prev => ({ ...prev, [categoryId]: userIds }));
    setSavedRows(prev => ({ ...prev, [categoryId]: false }));
  };

  const handleSave = async (categoryId: string) => {
    setSavingRows(prev => ({ ...prev, [categoryId]: true }));
    setSavedRows(prev => ({ ...prev, [categoryId]: false }));
    try {
      const userIds = assignments[categoryId] || [];
      // Send as JSON string for TEXT column storage
      await masterDataApi.update('categories', categoryId, {
        productManagerIds: JSON.stringify(userIds),
      });

      // Update local state to reflect the save
      setCategories(prev =>
        prev.map(cat =>
          cat.id === categoryId
            ? { ...cat, productManagerIds: JSON.stringify(userIds) }
            : cat
        )
      );

      setSavedRows(prev => ({ ...prev, [categoryId]: true }));
      setTimeout(() => {
        setSavedRows(prev => ({ ...prev, [categoryId]: false }));
      }, 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save assignment');
    } finally {
      setSavingRows(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  const hasUnsavedChange = (categoryId: string): boolean => {
    const current = (assignments[categoryId] || []).slice().sort().join(',');
    const cat = categories.find(c => c.id === categoryId);
    const originalIds = parsePmIds(cat?.productManagerIds);
    // Also check legacy single field
    if (originalIds.length === 0 && cat?.productManagerId) {
      return current !== cat.productManagerId;
    }
    const original = originalIds.slice().sort().join(',');
    return current !== original;
  };

  // Users with "productmanager" role -- shown in the PM roster section
  const productManagerUsers = users.filter(u => u.role === 'productmanager' && u.isActive !== false);

  // Only product manager role users can be assigned to categories
  const eligibleUsers = productManagerUsers;

  // Count how many categories each PM is assigned to
  const getCategoryCount = (userId: string): number => {
    return Object.values(assignments).filter(ids => ids.includes(userId)).length;
  };

  // Filter categories by search term
  const filteredCategories = categories.filter(cat => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const managerNames = getManagerNames(assignments[cat.id] || []).join(' ').toLowerCase();
    return (
      cat.name.toLowerCase().includes(term) ||
      managerNames.includes(term)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <Alert variant="error" icon={<AlertCircle className="w-5 h-5" />}>
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Product Manager Roster */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Product Managers
          </h3>
          <Badge variant="brand" size="sm">
            {productManagerUsers.length}
          </Badge>
        </div>

        {productManagerUsers.length === 0 ? (
          <Card className="text-center">
            <UserCog className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-zinc-600" />
            <p className="text-sm text-gray-400 dark:text-zinc-500">
              No users with "Product Manager" role found.
            </p>
            <p className="text-xs mt-1 text-gray-400 dark:text-zinc-600">
              Assign the "productmanager" role to users in the Users tab.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {productManagerUsers.map(pm => {
              const catCount = getCategoryCount(pm.id);
              return (
                <Card key={pm.id} padding="none" className="p-4 flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                    {pm.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate text-gray-900 dark:text-white">
                      {pm.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs truncate text-gray-400 dark:text-zinc-500">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      {pm.email}
                    </div>
                  </div>

                  {/* Category count badge */}
                  <div className="flex flex-col items-center flex-shrink-0 text-gray-500 dark:text-zinc-400">
                    <span className={cx(
                      'text-lg font-bold',
                      catCount > 0
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-gray-300 dark:text-zinc-600'
                    )}>
                      {catCount}
                    </span>
                    <span className="text-[10px]">
                      {catCount === 1 ? 'category' : 'categories'}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-zinc-800" />

      {/* Category Assignment Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Category Assignments
            </h3>
          </div>
          <span className="text-sm text-gray-400 dark:text-zinc-500">
            {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
          </span>
        </div>

        {/* Search */}
        <Card padding="none" className="p-4 mb-4">
          <Input
            placeholder="Search categories or managers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </Card>

        {/* Table */}
        <Card padding="none">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400 dark:text-zinc-500">
              {searchTerm ? 'No categories match your search.' : 'No categories found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-dark-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400" style={{ width: '25%' }}>Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400" style={{ width: '50%' }}>Product Managers</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-right text-gray-500 dark:text-zinc-400" style={{ width: '25%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {filteredCategories.map(cat => {
                    const isSaving = savingRows[cat.id] || false;
                    const isSaved = savedRows[cat.id] || false;
                    const isChanged = hasUnsavedChange(cat.id);

                    return (
                      <tr
                        key={cat.id}
                        className="transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{cat.name}</span>
                            {!cat.isActive && (
                              <Badge variant="gray" size="sm">Inactive</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          <MultiSelectDropdown
                            selectedIds={assignments[cat.id] || []}
                            users={eligibleUsers}
                            onChange={(ids) => handleAssignmentChange(cat.id, ids)}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                          <div className="flex items-center justify-end gap-2">
                            {isSaved && (
                              <span className="flex items-center gap-1 text-xs text-emerald-500">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Saved
                              </span>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleSave(cat.id)}
                              disabled={isSaving || !isChanged}
                              loading={isSaving}
                              icon={!isSaving ? <Save className="w-3.5 h-3.5" /> : undefined}
                              variant={isChanged ? 'primary' : 'secondary'}
                            >
                              Save
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
