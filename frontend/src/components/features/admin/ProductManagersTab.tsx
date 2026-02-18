import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, AlertCircle, Save, CheckCircle, UserCog, X, ChevronDown, Search, Users, Mail, Shield } from 'lucide-react';
import { masterDataApi, adminApi } from '@/services/api';

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

interface Props {
  isDark: boolean;
  cardClass: string;
  selectClass: string;
}

// Multi-select dropdown component
const MultiSelectDropdown: React.FC<{
  selectedIds: string[];
  users: UserItem[];
  onChange: (ids: string[]) => void;
  isDark: boolean;
}> = ({ selectedIds, users, onChange, isDark }) => {
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
        className={`min-h-[38px] flex items-center flex-wrap gap-1.5 px-2.5 py-1.5 rounded-xl text-sm border cursor-pointer transition-all ${
          isDark
            ? 'bg-dark-100 border-zinc-700 hover:border-zinc-600'
            : 'bg-white border-slate-300 hover:border-slate-400'
        } ${isOpen ? isDark ? 'border-brand-500 ring-1 ring-brand-500/20' : 'border-brand-500 ring-1 ring-brand-500/20' : ''}`}
      >
        {selectedUsers.length === 0 ? (
          <span className={`${isDark ? 'text-zinc-500' : 'text-slate-400'} text-sm`}>
            Select product managers...
          </span>
        ) : (
          selectedUsers.map(user => (
            <span
              key={user.id}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${
                isDark
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'bg-brand-50 text-brand-700 border border-brand-200'
              }`}
            >
              {user.name}
              <button
                onClick={(e) => removeUser(user.id, e)}
                className={`rounded-full p-0.5 transition-colors ${
                  isDark ? 'hover:bg-brand-500/30' : 'hover:bg-brand-100'
                }`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        <ChevronDown className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform ${
          isDark ? 'text-zinc-500' : 'text-slate-400'
        } ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-1.5 rounded-xl border z-50 overflow-hidden shadow-lg ${
          isDark
            ? 'bg-[rgba(15,20,35,0.98)] border-zinc-700 shadow-[0_8px_30px_rgba(0,0,0,0.5)]'
            : 'bg-white border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.1)]'
        }`}>
          {/* Search */}
          <div className={`p-2 border-b ${isDark ? 'border-zinc-700/50' : 'border-slate-100'}`}>
            <div className="relative">
              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${
                isDark ? 'text-zinc-500' : 'text-slate-400'
              }`} />
              <input
                type="text"
                placeholder="Search product managers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  isDark
                    ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
                } focus:outline-none`}
              />
            </div>
          </div>

          {/* User list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className={`px-3 py-4 text-center text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                No product managers found
              </div>
            ) : (
              filteredUsers.map(user => {
                const isSelected = selectedIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={`w-full px-3 py-2 flex items-center gap-2.5 text-left transition-colors ${
                      isSelected
                        ? isDark
                          ? 'bg-brand-500/15'
                          : 'bg-brand-50'
                        : isDark
                          ? 'hover:bg-white/[0.04]'
                          : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                      isSelected
                        ? 'bg-brand-600 border-brand-600'
                        : isDark
                          ? 'border-zinc-600'
                          : 'border-slate-300'
                    }`}>
                      {isSelected && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {user.name}
                      </div>
                      <div className={`text-[10px] truncate ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
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
            <div className={`px-3 py-2 border-t text-[10px] ${
              isDark ? 'border-zinc-700/50 text-zinc-500' : 'border-slate-100 text-slate-400'
            }`}>
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

export const ProductManagersTab: React.FC<Props> = ({ isDark, cardClass, selectClass }) => {
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

  // Users with "productmanager" role — shown in the PM roster section
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

  const thClass = `px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
    isDark ? 'text-zinc-400' : 'text-slate-500'
  }`;
  const tdClass = `px-4 py-3 text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-red-500">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Product Manager Roster */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Users className={`w-5 h-5 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Product Managers
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isDark ? 'bg-brand-500/20 text-brand-300' : 'bg-brand-50 text-brand-700'
          }`}>
            {productManagerUsers.length}
          </span>
        </div>

        {productManagerUsers.length === 0 ? (
          <div className={`${cardClass} p-6 text-center`}>
            <UserCog className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              No users with "Product Manager" role found.
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
              Assign the "productmanager" role to users in the Users tab.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {productManagerUsers.map(pm => {
              const catCount = getCategoryCount(pm.id);
              return (
                <div
                  key={pm.id}
                  className={`${cardClass} p-4 flex items-center gap-3`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    isDark
                      ? 'bg-brand-500/20 text-brand-300'
                      : 'bg-brand-50 text-brand-700'
                  }`}>
                    {pm.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {pm.name}
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs truncate ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      {pm.email}
                    </div>
                  </div>

                  {/* Category count badge */}
                  <div className={`flex flex-col items-center flex-shrink-0 ${
                    isDark ? 'text-zinc-400' : 'text-slate-500'
                  }`}>
                    <span className={`text-lg font-bold ${
                      catCount > 0
                        ? isDark ? 'text-brand-400' : 'text-brand-600'
                        : isDark ? 'text-zinc-600' : 'text-slate-300'
                    }`}>
                      {catCount}
                    </span>
                    <span className="text-[10px]">
                      {catCount === 1 ? 'category' : 'categories'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className={`border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`} />

      {/* Category Assignment Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Shield className={`w-5 h-5 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Category Assignments
            </h3>
          </div>
          <span className={`text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
            {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
          </span>
        </div>

        {/* Search */}
        <div className={`${cardClass} p-4 mb-4`}>
          <input
            type="text"
            placeholder="Search categories or managers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl text-sm border transition-colors ${
              isDark
                ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-brand-500'
            } focus:outline-none focus:ring-1 focus:ring-brand-500`}
          />
        </div>

        {/* Table */}
        <div className={`${cardClass} overflow-hidden`}>
          {filteredCategories.length === 0 ? (
            <div className={`text-center py-12 text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              {searchTerm ? 'No categories match your search.' : 'No categories found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDark ? 'bg-dark-100' : 'bg-slate-50'}>
                  <tr>
                    <th className={thClass} style={{ width: '25%' }}>Category</th>
                    <th className={thClass} style={{ width: '50%' }}>Product Managers</th>
                    <th className={`${thClass} text-right`} style={{ width: '25%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-slate-100'}`}>
                  {filteredCategories.map(cat => {
                    const isSaving = savingRows[cat.id] || false;
                    const isSaved = savedRows[cat.id] || false;
                    const isChanged = hasUnsavedChange(cat.id);

                    return (
                      <tr
                        key={cat.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className={tdClass}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{cat.name}</span>
                            {!cat.isActive && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                                isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'
                              }`}>
                                Inactive
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={tdClass}>
                          <MultiSelectDropdown
                            selectedIds={assignments[cat.id] || []}
                            users={eligibleUsers}
                            onChange={(ids) => handleAssignmentChange(cat.id, ids)}
                            isDark={isDark}
                          />
                        </td>
                        <td className={`${tdClass} text-right`}>
                          <div className="flex items-center justify-end gap-2">
                            {isSaved && (
                              <span className="flex items-center gap-1 text-xs text-emerald-500">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Saved
                              </span>
                            )}
                            <button
                              onClick={() => handleSave(cat.id)}
                              disabled={isSaving || !isChanged}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                                isChanged
                                  ? 'bg-brand-600 text-white hover:bg-brand-700'
                                  : isDark
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              } disabled:opacity-50`}
                            >
                              {isSaving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                              {isSaving ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
