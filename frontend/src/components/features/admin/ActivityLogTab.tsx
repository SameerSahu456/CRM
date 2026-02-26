import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Filter, Loader2, AlertCircle } from 'lucide-react';
import { activityLogApi, adminApi } from '@/services/api';
import { ActivityLog, ActivityChange } from '@/types';
import { Card, Button, Select, Badge, Alert } from '@/components/ui';
import { cx } from '@/utils/cx';

const ACTION_COLORS: Record<string, { variant: 'emerald' | 'blue' | 'red' | 'amber' | 'warning' }> = {
  create: { variant: 'emerald' },
  update: { variant: 'blue' },
  delete: { variant: 'red' },
  approve: { variant: 'amber' },
  reject: { variant: 'warning' },
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

export const ActivityLogTab: React.FC = () => {
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card padding="none" className="p-4">
        <button
          onClick={() => setShowFilters(f => !f)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <Filter className="w-4 h-4" />
          Filters
          {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <Select value={entityType} onChange={e => { setEntityType(e.target.value); setPage(1); }}>
              <option value="">All Entities</option>
              {ENTITY_TYPES.map(et => (
                <option key={et} value={et}>{et.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </Select>
            <Select value={action} onChange={e => { setAction(e.target.value); setPage(1); }}>
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
            </Select>
            <Select value={selectedUser} onChange={e => { setSelectedUser(e.target.value); setPage(1); }}>
              <option value="">All Users</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <Alert variant="error" icon={<AlertCircle className="w-5 h-5" />}>
              {error}
            </Alert>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400 dark:text-zinc-500">
            No activity logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead className="bg-gray-50 dark:bg-dark-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400" style={{ width: 32 }} />
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {logs.map(log => {
                  const isExpanded = expandedRow === log.id;
                  const colors = ACTION_COLORS[log.action] || ACTION_COLORS.update;
                  const hasChanges = log.changes && log.changes.length > 0;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                        onClick={() => hasChanges && setExpandedRow(isExpanded ? null : log.id)}
                      >
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {hasChanges && (
                            isExpanded
                              ? <ChevronDown className="w-4 h-4" />
                              : <ChevronRight className="w-4 h-4" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDateTime(log.createdAt)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{log.userName || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          <Badge variant={colors.variant}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {log.entityType?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{log.entityName || log.entityId || '-'}</td>
                      </tr>
                      {isExpanded && hasChanges && (
                        <tr>
                          <td colSpan={6} className="px-4 py-3 bg-gray-50 dark:bg-dark-100">
                            <div className="ml-8">
                              <div className="text-xs font-semibold mb-2 uppercase text-gray-500 dark:text-zinc-400">
                                Field Changes
                              </div>
                              <div className="space-y-1">
                                {(log.changes as ActivityChange[]).map((ch, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    <span className="font-medium w-32 shrink-0">
                                      {ch.field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                    </span>
                                    <span className="line-through text-red-500/70 dark:text-red-400/70">
                                      {ch.old || '(empty)'}
                                    </span>
                                    <span className="text-gray-400 dark:text-zinc-500">&rarr;</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-zinc-800">
            <span className="text-sm text-gray-500 dark:text-zinc-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
