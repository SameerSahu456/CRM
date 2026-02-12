import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Filter, Loader2, AlertCircle } from 'lucide-react';
import { activityLogApi, adminApi } from '../../services/api';
import { ActivityLog, ActivityChange } from '../../types';

interface Props {
  isDark: boolean;
  cardClass: string;
  inputClass: string;
  selectClass: string;
}

const ACTION_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  create: { bg: 'bg-emerald-50', text: 'text-emerald-700', darkBg: 'bg-emerald-900/30', darkText: 'text-emerald-400' },
  update: { bg: 'bg-blue-50', text: 'text-blue-700', darkBg: 'bg-blue-900/30', darkText: 'text-blue-400' },
  delete: { bg: 'bg-red-50', text: 'text-red-700', darkBg: 'bg-red-900/30', darkText: 'text-red-400' },
  approve: { bg: 'bg-amber-50', text: 'text-amber-700', darkBg: 'bg-amber-900/30', darkText: 'text-amber-400' },
  reject: { bg: 'bg-orange-50', text: 'text-orange-700', darkBg: 'bg-orange-900/30', darkText: 'text-orange-400' },
};

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export const ActivityLogTab: React.FC<Props> = ({ isDark, cardClass, inputClass, selectClass }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Filters
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { page: String(page), limit: '25' };
      if (entityType) params.entity_type = entityType;
      if (action) params.action = action;
      if (selectedUser) params.user_id = selectedUser;
      const res = await activityLogApi.list(params);
      setLogs(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [page, entityType, action, selectedUser]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    adminApi.listUsers().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setUsers(list.map((u: any) => ({ id: u.id, name: u.name || u.email })));
    }).catch(() => {});
  }, []);

  const ENTITY_TYPES = [
    'lead', 'account', 'contact', 'deal', 'partner',
    'sales_entry', 'product', 'task', 'user',
  ];

  const thClass = `px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
    isDark ? 'text-zinc-400' : 'text-slate-500'
  }`;
  const tdClass = `px-4 py-3 text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className={`${cardClass} p-4`}>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <select value={entityType} onChange={e => { setEntityType(e.target.value); setPage(1); }} className={selectClass}>
              <option value="">All Entities</option>
              {ENTITY_TYPES.map(et => (
                <option key={et} value={et}>{et.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
            <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }} className={selectClass}>
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
            </select>
            <select value={selectedUser} onChange={e => { setSelectedUser(e.target.value); setPage(1); }} className={selectClass}>
              <option value="">All Users</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className={`${cardClass} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 gap-2 text-red-500">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        ) : logs.length === 0 ? (
          <div className={`text-center py-12 text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
            No activity logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-dark-100' : 'bg-slate-50'}>
                <tr>
                  <th className={thClass} style={{ width: 32 }} />
                  <th className={thClass}>Timestamp</th>
                  <th className={thClass}>User</th>
                  <th className={thClass}>Action</th>
                  <th className={thClass}>Entity</th>
                  <th className={thClass}>Name</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-slate-100'}`}>
                {logs.map(log => {
                  const isExpanded = expandedRow === log.id;
                  const colors = ACTION_COLORS[log.action] || ACTION_COLORS.update;
                  const hasChanges = log.changes && log.changes.length > 0;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className={`cursor-pointer transition-colors ${
                          isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => hasChanges && setExpandedRow(isExpanded ? null : log.id)}
                      >
                        <td className={tdClass}>
                          {hasChanges && (
                            isExpanded
                              ? <ChevronDown className="w-4 h-4" />
                              : <ChevronRight className="w-4 h-4" />
                          )}
                        </td>
                        <td className={tdClass}>{formatDateTime(log.createdAt)}</td>
                        <td className={tdClass}>{log.userName || '-'}</td>
                        <td className={tdClass}>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            isDark ? `${colors.darkBg} ${colors.darkText}` : `${colors.bg} ${colors.text}`
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className={tdClass}>
                          {log.entityType?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </td>
                        <td className={tdClass}>{log.entityName || log.entityId || '-'}</td>
                      </tr>
                      {isExpanded && hasChanges && (
                        <tr>
                          <td colSpan={6} className={`px-4 py-3 ${isDark ? 'bg-dark-100' : 'bg-slate-50'}`}>
                            <div className="ml-8">
                              <div className={`text-xs font-semibold mb-2 uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                                Field Changes
                              </div>
                              <div className="space-y-1">
                                {(log.changes as ActivityChange[]).map((ch, i) => (
                                  <div key={i} className={`flex items-center gap-2 text-xs ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                                    <span className="font-medium w-32 shrink-0">
                                      {ch.field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                    </span>
                                    <span className={`line-through ${isDark ? 'text-red-400/70' : 'text-red-500/70'}`}>
                                      {ch.old || '(empty)'}
                                    </span>
                                    <span className={isDark ? 'text-zinc-500' : 'text-slate-400'}>→</span>
                                    <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>
                                      {ch.new || '(empty)'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
            <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  page <= 1
                    ? isDark ? 'text-zinc-600 cursor-not-allowed' : 'text-slate-300 cursor-not-allowed'
                    : isDark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  page >= totalPages
                    ? isDark ? 'text-zinc-600 cursor-not-allowed' : 'text-slate-300 cursor-not-allowed'
                    : isDark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
