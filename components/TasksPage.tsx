import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, ChevronLeft, ChevronRight, Edit2, Trash2,
  Loader2, AlertCircle, CheckCircle, Calendar, Clock,
  Phone, Mail, Video, Monitor, ListTodo, Filter,
  Check, User as UserIcon, FileText, CircleDot
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { tasksApi, adminApi } from '../services/api';
import { Task, PaginatedResponse, User } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

const TASK_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const TASK_PRIORITIES = [
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

const TASK_TYPES = [
  { value: 'Call', label: 'Call' },
  { value: 'Email', label: 'Email' },
  { value: 'Meeting', label: 'Meeting' },
  { value: 'Demo', label: 'Demo' },
];

const PRIORITY_COLORS: Record<string, {
  bg: string; text: string; darkBg: string; darkText: string;
  border: string; darkBorder: string;
}> = {
  High:   { bg: 'bg-red-50', text: 'text-red-700', darkBg: 'bg-red-900/30', darkText: 'text-red-400', border: 'border-red-200', darkBorder: 'border-red-800' },
  Medium: { bg: 'bg-amber-50', text: 'text-amber-700', darkBg: 'bg-amber-900/30', darkText: 'text-amber-400', border: 'border-amber-200', darkBorder: 'border-amber-800' },
  Low:    { bg: 'bg-green-50', text: 'text-green-700', darkBg: 'bg-green-900/30', darkText: 'text-green-400', border: 'border-green-200', darkBorder: 'border-green-800' },
};

const STATUS_COLORS: Record<string, {
  bg: string; text: string; darkBg: string; darkText: string;
}> = {
  pending:     { bg: 'bg-yellow-50', text: 'text-yellow-700', darkBg: 'bg-yellow-900/30', darkText: 'text-yellow-400' },
  in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', darkBg: 'bg-blue-900/30', darkText: 'text-blue-400' },
  completed:   { bg: 'bg-green-50', text: 'text-green-700', darkBg: 'bg-green-900/30', darkText: 'text-green-400' },
};

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

interface TaskFormData {
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  dueDate: string;
  dueTime: string;
  assignedTo: string;
}

const EMPTY_TASK_FORM: TaskFormData = {
  title: '',
  description: '',
  type: 'Call',
  status: 'pending',
  priority: 'Medium',
  dueDate: '',
  dueTime: '',
  assignedTo: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function formatTime(timeStr?: string): string {
  if (!timeStr) return '';
  try {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  } catch {
    return timeStr;
  }
}

function isOverdue(task: Task): boolean {
  if (task.status === 'completed') return false;
  if (!task.dueDate) return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  } catch {
    return false;
  }
}

function getTypeIcon(type?: string) {
  switch (type) {
    case 'Call': return Phone;
    case 'Email': return Mail;
    case 'Meeting': return Video;
    case 'Demo': return Monitor;
    default: return FileText;
  }
}

function priorityBadge(priority: string, isDark: boolean): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const c = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Medium;
  return `${base} ${isDark ? `${c.darkBg} ${c.darkText}` : `${c.bg} ${c.text}`}`;
}

function statusBadge(status: string, isDark: boolean): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return `${base} ${isDark ? `${c.darkBg} ${c.darkText}` : `${c.bg} ${c.text}`}`;
}

function statusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Pending';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    default: return status;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TasksPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  // Data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<User[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterType, setFilterType] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listError, setListError] = useState('');

  // Task form modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskFormData, setTaskFormData] = useState<TaskFormData>({ ...EMPTY_TASK_FORM });
  const [taskFormError, setTaskFormError] = useState('');

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Completing tasks
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());

  // ---------------------------------------------------------------------------
  // Styling helpers
  // ---------------------------------------------------------------------------

  const cardClass = `premium-card ${isDark ? '' : 'shadow-soft'}`;
  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm transition-all ${
    isDark
      ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
  } focus:outline-none focus:ring-1 focus:ring-brand-500`;
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setListError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      if (filterType) params.type = filterType;

      const response: PaginatedResponse<Task> = await tasksApi.list(params);
      setTasks(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);
    } catch (err: any) {
      setListError(err.message || 'Failed to load tasks');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterStatus, filterPriority, filterType]);

  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const data = await tasksApi.stats();
      setTaskStats(data);
    } catch {
      setTaskStats({});
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await adminApi.listUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  // Fetch tasks
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterStatus, filterPriority, filterType]);

  // ---------------------------------------------------------------------------
  // Task form handlers
  // ---------------------------------------------------------------------------

  const openCreateTaskModal = () => {
    setTaskFormData({ ...EMPTY_TASK_FORM });
    setEditingTaskId(null);
    setTaskFormError('');
    setShowTaskModal(true);
  };

  const openEditTaskModal = (task: Task) => {
    setTaskFormData({
      title: task.title || '',
      description: task.description || '',
      type: task.type || 'Call',
      status: task.status || 'pending',
      priority: task.priority || 'Medium',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      dueTime: task.dueTime || '',
      assignedTo: task.assignedTo || '',
    });
    setEditingTaskId(task.id);
    setTaskFormError('');
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTaskId(null);
    setTaskFormError('');
  };

  const openDetailModal = (task: Task) => {
    setDetailTask(task);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailTask(null);
    setDeleteConfirmId(null);
  };

  const handleTaskFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTaskFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskFormError('');

    if (!taskFormData.title.trim()) {
      setTaskFormError('Task title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = { ...taskFormData };
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.dueDate) delete payload.dueDate;
      if (!payload.dueTime) delete payload.dueTime;
      if (!payload.description) delete payload.description;

      if (editingTaskId) {
        await tasksApi.update(editingTaskId, payload);
      } else {
        await tasksApi.create({ ...payload, createdBy: user?.id });
      }
      closeTaskModal();
      refreshData();
    } catch (err: any) {
      setTaskFormError(err.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Quick complete handler
  // ---------------------------------------------------------------------------

  const handleComplete = async (id: string) => {
    setCompletingIds(prev => new Set(prev).add(id));
    try {
      await tasksApi.complete(id);
      refreshData();
    } catch {
      // Fail silently
    } finally {
      setCompletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------

  const handleDelete = async (id: string) => {
    try {
      await tasksApi.delete(id);
      setDeleteConfirmId(null);
      refreshData();
    } catch (err: any) {
      setListError(err.message || 'Failed to delete task');
    }
  };

  // ---------------------------------------------------------------------------
  // Refresh helper
  // ---------------------------------------------------------------------------

  const refreshData = () => {
    fetchStats();
    fetchTasks();
  };

  const clearFilters = () => {
    setFilterStatus('');
    setFilterPriority('');
    setFilterType('');
  };

  const hasActiveFilters = filterStatus || filterPriority || filterType;

  // ---------------------------------------------------------------------------
  // Render: Stats Bar
  // ---------------------------------------------------------------------------

  const renderStatsBar = () => {
    const statItems = [
      {
        label: 'Pending',
        key: 'pending',
        icon: Clock,
        color: isDark ? 'text-yellow-400' : 'text-yellow-600',
        iconBg: isDark ? 'bg-yellow-900/20' : 'bg-yellow-100',
      },
      {
        label: 'In Progress',
        key: 'in_progress',
        icon: CircleDot,
        color: isDark ? 'text-blue-400' : 'text-blue-600',
        iconBg: isDark ? 'bg-blue-900/20' : 'bg-blue-100',
      },
      {
        label: 'Completed',
        key: 'completed',
        icon: CheckCircle,
        color: isDark ? 'text-green-400' : 'text-green-600',
        iconBg: isDark ? 'bg-green-900/20' : 'bg-green-100',
      },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {statItems.map((item, idx) => {
          const count = taskStats[item.key] ?? 0;
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className={`${cardClass} p-4 hover-lift animate-fade-in-up`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.iconBg}`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                    {item.label}
                  </p>
                  {isStatsLoading ? (
                    <div className={`w-10 h-6 rounded animate-pulse mt-0.5 ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`} />
                  ) : (
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{count}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Toolbar
  // ---------------------------------------------------------------------------

  const renderToolbar = () => (
    <div className={`${cardClass} p-4`}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Filter: Status */}
        <div className="w-full lg:w-40">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className={selectClass}
          >
            <option value="">All Statuses</option>
            {TASK_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Filter: Priority */}
        <div className="w-full lg:w-36">
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className={selectClass}
          >
            <option value="">All Priorities</option>
            {TASK_PRIORITIES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Filter: Type */}
        <div className="w-full lg:w-36">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className={selectClass}
          >
            <option value="">All Types</option>
            {TASK_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              isDark
                ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* New Task */}
        <button
          onClick={openCreateTaskModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Task Card
  // ---------------------------------------------------------------------------

  const renderTaskCard = (task: Task) => {
    const TypeIcon = getTypeIcon(task.type);
    const overdue = isOverdue(task);
    const isCompleting = completingIds.has(task.id);
    const isCompleted = task.status === 'completed';

    return (
      <div
        key={task.id}
        onClick={() => openDetailModal(task)}
        className={`${cardClass} p-4 transition-all hover-lift cursor-pointer ${
          overdue
            ? isDark
              ? 'border-red-800/60 bg-red-900/10'
              : 'border-red-300 bg-red-50/30'
            : ''
        } ${isCompleted ? 'opacity-75' : ''}`}
      >
        <div className="flex items-start gap-3">
          {/* Quick complete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              !isCompleted && handleComplete(task.id);
            }}
            disabled={isCompleted || isCompleting}
            className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
              isCompleted
                ? isDark
                  ? 'bg-green-900/30 border-green-700 text-green-400'
                  : 'bg-green-100 border-green-400 text-green-600'
                : isCompleting
                  ? 'border-brand-500 animate-pulse'
                  : isDark
                    ? 'border-zinc-600 hover:border-brand-500 hover:bg-brand-900/20 text-transparent hover:text-brand-400'
                    : 'border-slate-300 hover:border-brand-500 hover:bg-brand-50 text-transparent hover:text-brand-600'
            } disabled:cursor-not-allowed`}
            title={isCompleted ? 'Completed' : 'Mark as complete'}
          >
            {isCompleting ? (
              <Loader2 className="w-3 h-3 animate-spin text-brand-500" />
            ) : (
              <Check className="w-3 h-3" />
            )}
          </button>

          {/* Card body */}
          <div className="flex-1 min-w-0">
            {/* Top row: title + badges */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isDark ? 'bg-zinc-800' : 'bg-slate-100'
                }`}>
                  <TypeIcon className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`} />
                </div>
                <h4 className={`text-sm font-semibold truncate ${
                  isCompleted
                    ? isDark ? 'text-zinc-500 line-through' : 'text-slate-400 line-through'
                    : isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {task.title}
                </h4>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={priorityBadge(task.priority, isDark)}>{task.priority}</span>
                <span className={statusBadge(task.status, isDark)}>{statusLabel(task.status)}</span>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <p className={`text-xs mb-2 line-clamp-2 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {task.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Type */}
              <span className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                <TypeIcon className="w-3 h-3" />
                {task.type || 'Task'}
              </span>

              {/* Due date */}
              {task.dueDate && (
                <span className={`text-[11px] flex items-center gap-1 ${
                  overdue
                    ? isDark ? 'text-red-400 font-medium' : 'text-red-600 font-medium'
                    : isDark ? 'text-zinc-500' : 'text-slate-400'
                }`}>
                  <Calendar className="w-3 h-3" />
                  {formatDate(task.dueDate)}
                  {task.dueTime && (
                    <span className="ml-0.5">{formatTime(task.dueTime)}</span>
                  )}
                  {overdue && (
                    <span className={`ml-1 px-1.5 py-0 rounded text-[10px] font-bold ${
                      isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-600'
                    }`}>
                      OVERDUE
                    </span>
                  )}
                </span>
              )}

              {/* Assigned to */}
              {task.assignedToName && (
                <span className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  <UserIcon className="w-3 h-3" />
                  {task.assignedToName}
                </span>
              )}

              {/* Completed at */}
              {task.completedAt && (
                <span className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-green-500' : 'text-green-600'}`}>
                  <CheckCircle className="w-3 h-3" />
                  Completed {formatDate(task.completedAt)}
                </span>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Task List
  // ---------------------------------------------------------------------------

  const renderTaskList = () => (
    <div className="space-y-3">
      {listError && (
        <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
          isDark
            ? 'bg-red-900/20 border border-red-800 text-red-400'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {listError}
        </div>
      )}

      {isLoading ? (
        <div className={`${cardClass} flex flex-col items-center justify-center py-20`}>
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Loading tasks...
          </p>
        </div>
      ) : tasks.length === 0 ? (
        <div className={`${cardClass} flex flex-col items-center justify-center py-20`}>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
            isDark ? 'bg-zinc-800' : 'bg-slate-100'
          }`}>
            <ListTodo className={`w-7 h-7 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
          </div>
          <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            {hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
            {hasActiveFilters ? 'Try adjusting your filters' : 'Click "New Task" to create one'}
          </p>
        </div>
      ) : (
        <>
          {tasks.map(task => renderTaskCard(task))}

          {/* Pagination */}
          <div className={`${cardClass} flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3`}>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              Showing {(page - 1) * PAGE_SIZE + 1}
              {' '}&ndash;{' '}
              {Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords} tasks
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => {
                  if (p === 1 || p === totalPages) return true;
                  if (Math.abs(p - page) <= 1) return true;
                  return false;
                })
                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                  if (idx > 0) {
                    const prev = arr[idx - 1];
                    if (p - prev > 1) acc.push('ellipsis');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className={`px-1 text-xs ${isDark ? 'text-zinc-600' : 'text-slate-300'}`}
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item as number)}
                      className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors ${
                        page === item
                          ? 'bg-brand-600 text-white'
                          : isDark
                            ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Task Detail Modal
  // ---------------------------------------------------------------------------

  const renderDetailModal = () => {
    if (!showDetailModal || !detailTask) return null;
    const task = detailTask;
    const TypeIcon = getTypeIcon(task.type);
    const overdue = isOverdue(task);
    const isCompleted = task.status === 'completed';
    const pColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium;
    const sColor = STATUS_COLORS[task.status] || STATUS_COLORS.pending;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeDetailModal} />
        <div className={`relative w-full max-w-xl max-h-[90vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
          isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
        }`}>
          {/* Header */}
          <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isDark ? 'bg-zinc-800' : 'bg-slate-100'
              }`}>
                <TypeIcon className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`} />
              </div>
              <h2 className={`text-lg font-semibold font-display truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {task.title}
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => { closeDetailModal(); openEditTaskModal(task); }}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              {deleteConfirmId === task.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { handleDelete(task.id); closeDetailModal(); }}
                    className="px-2 py-1 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                      isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirmId(task.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'text-zinc-400 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={closeDetailModal}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6 pb-6">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDark ? `${pColor.darkBg} ${pColor.darkText}` : `${pColor.bg} ${pColor.text}`}`}>
                  {task.priority} Priority
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDark ? `${sColor.darkBg} ${sColor.darkText}` : `${sColor.bg} ${sColor.text}`}`}>
                  {statusLabel(task.status)}
                </span>
                {overdue && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-600'
                  }`}>
                    OVERDUE
                  </span>
                )}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`flex items-start gap-2 p-2.5 rounded-lg ${isDark ? 'bg-dark-100' : 'bg-slate-50'}`}>
                  <TypeIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <div className="min-w-0">
                    <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Type</p>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{task.type || '-'}</p>
                  </div>
                </div>
                {task.dueDate && (
                  <div className={`flex items-start gap-2 p-2.5 rounded-lg ${isDark ? 'bg-dark-100' : 'bg-slate-50'}`}>
                    <Calendar className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Due Date</p>
                      <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatDate(task.dueDate)}{task.dueTime ? ` at ${formatTime(task.dueTime)}` : ''}
                      </p>
                    </div>
                  </div>
                )}
                {task.assignedToName && (
                  <div className={`flex items-start gap-2 p-2.5 rounded-lg ${isDark ? 'bg-dark-100' : 'bg-slate-50'}`}>
                    <UserIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Assigned To</p>
                      <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{task.assignedToName}</p>
                    </div>
                  </div>
                )}
                {task.completedAt && (
                  <div className={`flex items-start gap-2 p-2.5 rounded-lg ${isDark ? 'bg-dark-100' : 'bg-slate-50'}`}>
                    <CheckCircle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isDark ? 'text-green-500' : 'text-green-600'}`} />
                    <div className="min-w-0">
                      <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Completed</p>
                      <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatDate(task.completedAt)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {task.description && (
                <div>
                  <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Description
                  </h4>
                  <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    {task.description}
                  </p>
                </div>
              )}

              {/* Quick complete button */}
              {!isCompleted && (
                <button
                  onClick={() => { handleComplete(task.id); closeDetailModal(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Complete
                </button>
              )}

              {/* Timestamps */}
              <div className={`flex items-center gap-4 text-[11px] pt-2 border-t ${
                isDark ? 'border-zinc-800 text-zinc-600' : 'border-slate-100 text-slate-400'
              }`}>
                {task.createdAt && <span>Created: {formatDate(task.createdAt)}</span>}
                {task.updatedAt && <span>Updated: {formatDate(task.updatedAt)}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Create/Edit Task Modal
  // ---------------------------------------------------------------------------

  const renderTaskModal = () => {
    if (!showTaskModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeTaskModal} />
        <div className={`relative w-full max-w-md max-h-[90vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
          isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
        }`}>
          {/* Header */}
          <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {editingTaskId ? 'Edit Task' : 'New Task'}
            </h2>
            <button
              onClick={closeTaskModal}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleTaskSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 pb-6 space-y-5">
            {taskFormError && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {taskFormError}
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="task-title" className={labelClass}>
                Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <ListTodo className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  id="task-title"
                  name="title"
                  type="text"
                  placeholder="Task title"
                  value={taskFormData.title}
                  onChange={handleTaskFormChange}
                  className={`${inputClass} pl-10`}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="task-description" className={labelClass}>Description</label>
              <textarea
                id="task-description"
                name="description"
                rows={3}
                placeholder="Task description..."
                value={taskFormData.description}
                onChange={handleTaskFormChange}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Row: Type + Status + Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="task-type" className={labelClass}>Type</label>
                <select
                  id="task-type"
                  name="type"
                  value={taskFormData.type}
                  onChange={handleTaskFormChange}
                  className={selectClass}
                >
                  {TASK_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="task-status" className={labelClass}>Status</label>
                <select
                  id="task-status"
                  name="status"
                  value={taskFormData.status}
                  onChange={handleTaskFormChange}
                  className={selectClass}
                >
                  {TASK_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="task-priority" className={labelClass}>Priority</label>
                <select
                  id="task-priority"
                  name="priority"
                  value={taskFormData.priority}
                  onChange={handleTaskFormChange}
                  className={selectClass}
                >
                  {TASK_PRIORITIES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row: Due Date + Due Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="task-dueDate" className={labelClass}>Due Date</label>
                <div className="relative">
                  <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="task-dueDate"
                    name="dueDate"
                    type="date"
                    value={taskFormData.dueDate}
                    onChange={handleTaskFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="task-dueTime" className={labelClass}>Due Time</label>
                <div className="relative">
                  <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="task-dueTime"
                    name="dueTime"
                    type="time"
                    value={taskFormData.dueTime}
                    onChange={handleTaskFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            {/* Assigned To */}
            <div>
              <label htmlFor="task-assignedTo" className={labelClass}>Assigned To</label>
              <select
                id="task-assignedTo"
                name="assignedTo"
                value={taskFormData.assignedTo}
                onChange={handleTaskFormChange}
                className={selectClass}
              >
                <option value="">Select User</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            </div>
            {/* Footer - sticky at bottom */}
            <div className={`sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t ${
              isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <button
                type="button"
                onClick={closeTaskModal}
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
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> {editingTaskId ? 'Update Task' : 'Create Task'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Tasks
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Manage your tasks, calls, meetings, and follow-ups
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      {renderStatsBar()}

      {/* Toolbar */}
      {renderToolbar()}

      {/* Task List */}
      {renderTaskList()}

      {/* Modals */}
      {renderDetailModal()}
      {renderTaskModal()}
    </div>
  );
};
