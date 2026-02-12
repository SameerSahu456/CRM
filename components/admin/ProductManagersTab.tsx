import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Save, CheckCircle, UserCog } from 'lucide-react';
import { masterDataApi, adminApi } from '../../services/api';

interface CategoryWithManager {
  id: string;
  name: string;
  oemId?: string;
  isActive: boolean;
  productManagerId?: string;
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

export const ProductManagersTab: React.FC<Props> = ({ isDark, cardClass, selectClass }) => {
  const [categories, setCategories] = useState<CategoryWithManager[]>([]);
  const [oems, setOems] = useState<OemItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Track per-row assignment changes and saving state
  const [assignments, setAssignments] = useState<Record<string, string>>({});
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
      const initial: Record<string, string> = {};
      catList.forEach(cat => {
        if (cat.productManagerId) {
          initial[cat.id] = cat.productManagerId;
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

  const getOemName = (oemId?: string): string => {
    if (!oemId) return '-';
    const oem = oems.find(o => o.id === oemId);
    return oem ? oem.name : oemId;
  };

  const getManagerName = (managerId?: string): string => {
    if (!managerId) return '';
    const user = users.find(u => u.id === managerId);
    return user ? user.name : managerId;
  };

  const handleAssignmentChange = (categoryId: string, userId: string) => {
    setAssignments(prev => ({ ...prev, [categoryId]: userId }));
    // Clear any previous saved indicator for this row
    setSavedRows(prev => ({ ...prev, [categoryId]: false }));
  };

  const handleSave = async (categoryId: string) => {
    setSavingRows(prev => ({ ...prev, [categoryId]: true }));
    setSavedRows(prev => ({ ...prev, [categoryId]: false }));
    try {
      const userId = assignments[categoryId] || null;
      await masterDataApi.update('categories', categoryId, { productManagerId: userId });

      // Update local state to reflect the save
      setCategories(prev =>
        prev.map(cat =>
          cat.id === categoryId
            ? { ...cat, productManagerId: userId || undefined }
            : cat
        )
      );

      setSavedRows(prev => ({ ...prev, [categoryId]: true }));
      // Clear saved indicator after 3 seconds
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
    const current = assignments[categoryId] || '';
    const original = categories.find(c => c.id === categoryId)?.productManagerId || '';
    return current !== original;
  };

  // Filter users to show active users, preferring 'producthead' role if available
  const eligibleUsers = users.filter(u => u.isActive !== false);

  // Filter categories by search term
  const filteredCategories = categories.filter(cat => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const oemName = getOemName(cat.oemId).toLowerCase();
    const managerName = getManagerName(assignments[cat.id]).toLowerCase();
    return (
      cat.name.toLowerCase().includes(term) ||
      oemName.includes(term) ||
      managerName.includes(term)
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCog className={`w-5 h-5 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Product Manager Assignments
          </h3>
        </div>
        <span className={`text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
          {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
        </span>
      </div>

      {/* Search */}
      <div className={`${cardClass} p-4`}>
        <input
          type="text"
          placeholder="Search categories, OEMs, or managers..."
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
                  <th className={thClass}>Category</th>
                  <th className={thClass}>OEM</th>
                  <th className={thClass}>Product Manager</th>
                  <th className={`${thClass} text-right`}>Actions</th>
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
                      <td className={tdClass}>{getOemName(cat.oemId)}</td>
                      <td className={tdClass}>
                        <select
                          value={assignments[cat.id] || ''}
                          onChange={e => handleAssignmentChange(cat.id, e.target.value)}
                          className={selectClass}
                        >
                          <option value="">-- Not Assigned --</option>
                          {eligibleUsers.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name}{user.role ? ` (${user.role})` : ''}
                            </option>
                          ))}
                        </select>
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
  );
};
