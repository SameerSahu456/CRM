import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, X, Save, Shield } from 'lucide-react';
import { rolesApi } from '@/services/api';
import { Role, RolePermission } from '@/types';

interface Props {
  isDark: boolean;
  cardClass: string;
  inputClass: string;
}

const ENTITIES = [
  'partners', 'leads', 'accounts', 'contacts', 'deals',
  'sales_entries', 'products', 'tasks', 'quotes', 'carepacks',
  'calendar_events', 'emails', 'reports',
];

const ACTIONS = ['canView', 'canCreate', 'canEdit', 'canDelete'] as const;
const ACTION_LABELS: Record<string, string> = {
  canView: 'View', canCreate: 'Create', canEdit: 'Edit', canDelete: 'Delete',
};

export const RolesTab: React.FC<Props> = ({ isDark, cardClass, inputClass }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [savingPerms, setSavingPerms] = useState(false);

  // Create role
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit role
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingRole, setSavingRole] = useState(false);

  // Permission matrix state (for the expanded role)
  const [permMatrix, setPermMatrix] = useState<Record<string, Record<string, boolean>>>({});

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await rolesApi.list();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const expandRole = (role: Role) => {
    if (expandedRole === role.id) {
      setExpandedRole(null);
      return;
    }
    setExpandedRole(role.id);
    // Build permission matrix from role.permissions
    const matrix: Record<string, Record<string, boolean>> = {};
    for (const entity of ENTITIES) {
      const perm = role.permissions?.find((p: RolePermission) => p.entity === entity);
      matrix[entity] = {
        canView: perm?.canView ?? false,
        canCreate: perm?.canCreate ?? false,
        canEdit: perm?.canEdit ?? false,
        canDelete: perm?.canDelete ?? false,
      };
    }
    setPermMatrix(matrix);
  };

  const togglePerm = (entity: string, action: string) => {
    setPermMatrix(prev => ({
      ...prev,
      [entity]: { ...prev[entity], [action]: !prev[entity][action] },
    }));
  };

  const handleSavePermissions = async (roleId: string) => {
    setSavingPerms(true);
    try {
      const perms = ENTITIES.map(entity => ({
        entity,
        canView: permMatrix[entity]?.canView ?? false,
        canCreate: permMatrix[entity]?.canCreate ?? false,
        canEdit: permMatrix[entity]?.canEdit ?? false,
        canDelete: permMatrix[entity]?.canDelete ?? false,
      }));
      await rolesApi.updatePermissions(roleId, perms);
      await fetchRoles();
    } catch (err: any) {
      alert(err.message || 'Failed to save permissions');
    } finally {
      setSavingPerms(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newName.trim() || !newLabel.trim()) return;
    setCreating(true);
    try {
      await rolesApi.create({ name: newName.trim().toLowerCase().replace(/\s+/g, '_'), label: newLabel.trim(), description: newDesc.trim() || null });
      setShowCreate(false);
      setNewName(''); setNewLabel(''); setNewDesc('');
      await fetchRoles();
    } catch (err: any) {
      alert(err.message || 'Failed to create role');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Delete role "${roleName}"? This cannot be undone.`)) return;
    try {
      await rolesApi.delete(roleId);
      await fetchRoles();
    } catch (err: any) {
      alert(err.message || 'Failed to delete role');
    }
  };

  const startEditing = (role: Role) => {
    setEditingRoleId(role.id);
    setEditName(role.name);
    setEditLabel(role.label);
    setEditDesc(role.description || '');
  };

  const cancelEditing = () => {
    setEditingRoleId(null);
    setEditName('');
    setEditLabel('');
    setEditDesc('');
  };

  const handleSaveRole = async (role: Role) => {
    if (!editLabel.trim()) return;
    if (!role.isSystem && !editName.trim()) return;
    setSavingRole(true);
    try {
      const payload: any = { label: editLabel.trim(), description: editDesc.trim() || null };
      if (!role.isSystem) {
        payload.name = editName.trim().toLowerCase().replace(/\s+/g, '_');
      }
      await rolesApi.update(role.id, payload);
      cancelEditing();
      await fetchRoles();
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    } finally {
      setSavingRole(false);
    }
  };

  const checkboxClass = `w-4 h-4 rounded border ${
    isDark ? 'bg-dark-100 border-zinc-600 text-brand-500' : 'bg-white border-slate-300 text-brand-600'
  } focus:ring-brand-500 cursor-pointer`;

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
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Roles & Permissions
        </h3>
        <button
          onClick={() => setShowCreate(s => !s)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Role
        </button>
      </div>

      {/* Create Role Form */}
      {showCreate && (
        <div className={`${cardClass} p-4`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              placeholder="Role name (e.g. team_lead)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className={inputClass}
            />
            <input
              placeholder="Label (e.g. Team Lead)"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              className={inputClass}
            />
            <input
              placeholder="Description (optional)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCreateRole}
              disabled={creating || !newName.trim() || !newLabel.trim()}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewName(''); setNewLabel(''); setNewDesc(''); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Roles List */}
      {roles.map(role => (
        <div key={role.id} className={cardClass}>
          {editingRoleId === role.id ? (
            /* Inline Edit Mode */
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <Shield className={`w-5 h-5 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
                <span className={`text-sm font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>Editing Role</span>
                {role.isSystem && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                    isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'
                  }`}>
                    System
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Name</label>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    disabled={role.isSystem}
                    placeholder="Role name"
                    className={`${inputClass} ${role.isSystem ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  {role.isSystem && (
                    <p className={`text-xs mt-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>System role name cannot be changed</p>
                  )}
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Label</label>
                  <input
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    placeholder="Display label"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Description</label>
                  <input
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveRole(role)}
                  disabled={savingRole || !editLabel.trim() || (!role.isSystem && !editName.trim())}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {savingRole ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEditing}
                  disabled={savingRole}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100'} disabled:opacity-50`}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Normal Display Mode */
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => expandRole(role)}
            >
              <div className="flex items-center gap-3">
                <Shield className={`w-5 h-5 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
                <div>
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {role.label}
                    {role.isSystem && (
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                        isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                        System
                      </span>
                    )}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    {role.name} {role.description ? `--- ${role.description}` : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={e => { e.stopPropagation(); startEditing(role); }}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'text-zinc-500 hover:text-brand-400 hover:bg-zinc-800' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'}`}
                  title="Edit role"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {!role.isSystem && (
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteRole(role.id, role.label); }}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'text-zinc-500 hover:text-red-400 hover:bg-zinc-800' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                    title="Delete role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Permission Matrix */}
          {expandedRole === role.id && (
            <div className={`border-t px-4 py-4 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className={`text-left text-xs font-semibold uppercase tracking-wider px-2 py-2 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Entity
                      </th>
                      {ACTIONS.map(a => (
                        <th key={a} className={`text-center text-xs font-semibold uppercase tracking-wider px-2 py-2 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          {ACTION_LABELS[a]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-slate-100'}`}>
                    {ENTITIES.map(entity => (
                      <tr key={entity}>
                        <td className={`px-2 py-2 text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {entity.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </td>
                        {ACTIONS.map(action => (
                          <td key={action} className="text-center px-2 py-2">
                            <input
                              type="checkbox"
                              checked={permMatrix[entity]?.[action] ?? false}
                              onChange={() => togglePerm(entity, action)}
                              className={checkboxClass}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => handleSavePermissions(role.id)}
                  disabled={savingPerms}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {savingPerms ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
