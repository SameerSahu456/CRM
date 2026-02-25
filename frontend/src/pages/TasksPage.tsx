import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, Edit2, Trash2,
  Loader2, AlertCircle, CheckCircle, Calendar, Clock,
  Phone, Mail, Video, Monitor, ListTodo, Filter,
  Check, User as UserIcon, FileText, CircleDot
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDropdowns } from '@/contexts/DropdownsContext';
import { tasksApi, adminApi } from '@/services/api';
import { Task, PaginatedResponse, User } from '@/types';
import { Card, Button, Input, Select, Modal, Badge, Alert, Pagination, Textarea } from '@/components/ui';
import { cx } from '@/utils/cx';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

const PRIORITY_BADGE_VARIANT: Record<string, 'red' | 'amber' | 'green'> = {
  High: 'red',
  Medium: 'amber',
  Low: 'green',
};

const STATUS_BADGE_VARIANT: Record<string, 'warning' | 'blue' | 'success'> = {
  pending: 'warning',
  in_progress: 'blue',
  completed: 'success',
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
  const { user } = useAuth();
  const { getOptions } = useDropdowns();

  // Dropdown data from DB
  const TASK_STATUSES = getOptions('task-statuses');
  const TASK_PRIORITIES = getOptions('priorities');
  const TASK_TYPES = getOptions('task-types');

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
        color: 'text-yellow-600 dark:text-yellow-400',
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
      },
      {
        label: 'In Progress',
        key: 'in_progress',
        icon: CircleDot,
        color: 'text-blue-600 dark:text-blue-400',
        iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      },
      {
        label: 'Completed',
        key: 'completed',
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400',
        iconBg: 'bg-green-100 dark:bg-green-900/20',
      },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {statItems.map((item, idx) => {
          const count = taskStats[item.key] ?? 0;
          const Icon = item.icon;
          return (
            <Card
              key={item.key}
              padding="none"
              hover
              className="p-4 animate-fade-in-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center', item.iconBg)}>
                  <Icon className={cx('w-5 h-5', item.color)} />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-500">
                    {item.label}
                  </p>
                  {isStatsLoading ? (
                    <div className="w-10 h-6 rounded animate-pulse mt-0.5 bg-slate-100 dark:bg-zinc-800" />
                  ) : (
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{count}</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Toolbar
  // ---------------------------------------------------------------------------

  const renderToolbar = () => (
    <Card padding="none" className="p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Filter: Status */}
        <div className="w-full lg:w-40">
          <Select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {TASK_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>

        {/* Filter: Priority */}
        <div className="w-full lg:w-36">
          <Select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            {TASK_PRIORITIES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
        </div>

        {/* Filter: Type */}
        <div className="w-full lg:w-36">
          <Select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            {TASK_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            icon={<X className="w-3.5 h-3.5" />}
            onClick={clearFilters}
          >
            Clear
          </Button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* New Task */}
        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={openCreateTaskModal}
          shine
          className="whitespace-nowrap"
        >
          New Task
        </Button>
      </div>
    </Card>
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
      <Card
        key={task.id}
        padding="none"
        hover
        className={cx(
          'p-4 cursor-pointer',
          overdue && 'border-red-300 bg-red-50/30 dark:border-red-800/60 dark:bg-red-900/10',
          isCompleted && 'opacity-75'
        )}
        onClick={() => openDetailModal(task)}
      >
        <div className="flex items-start gap-3">
          {/* Quick complete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              !isCompleted && handleComplete(task.id);
            }}
            disabled={isCompleted || isCompleting}
            className={cx(
              'flex-shrink-0 mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all disabled:cursor-not-allowed',
              isCompleted
                ? 'bg-green-100 border-green-400 text-green-600 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400'
                : isCompleting
                  ? 'border-brand-500 animate-pulse'
                  : 'border-slate-300 hover:border-brand-500 hover:bg-brand-50 text-transparent hover:text-brand-600 dark:border-zinc-600 dark:hover:border-brand-500 dark:hover:bg-brand-900/20 dark:text-transparent dark:hover:text-brand-400'
            )}
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
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-100 dark:bg-zinc-800">
                  <TypeIcon className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                </div>
                <h4 className={cx(
                  'text-sm font-semibold truncate',
                  isCompleted
                    ? 'text-slate-400 line-through dark:text-zinc-500'
                    : 'text-slate-900 dark:text-white'
                )}>
                  {task.title}
                </h4>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Badge variant={PRIORITY_BADGE_VARIANT[task.priority] || 'amber'}>{task.priority}</Badge>
                <Badge variant={STATUS_BADGE_VARIANT[task.status] || 'warning'}>{statusLabel(task.status)}</Badge>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-xs mb-2 line-clamp-2 text-slate-500 dark:text-zinc-400">
                {task.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Type */}
              <span className="text-[11px] flex items-center gap-1 text-slate-400 dark:text-zinc-500">
                <TypeIcon className="w-3 h-3" />
                {task.type || 'Task'}
              </span>

              {/* Due date */}
              {task.dueDate && (
                <span className={cx(
                  'text-[11px] flex items-center gap-1',
                  overdue
                    ? 'text-red-600 font-medium dark:text-red-400'
                    : 'text-slate-400 dark:text-zinc-500'
                )}>
                  <Calendar className="w-3 h-3" />
                  {formatDate(task.dueDate)}
                  {task.dueTime && (
                    <span className="ml-0.5">{formatTime(task.dueTime)}</span>
                  )}
                  {overdue && (
                    <Badge variant="red" size="sm" className="ml-1 text-[10px] font-bold">OVERDUE</Badge>
                  )}
                </span>
              )}

              {/* Assigned to */}
              {task.assignedToName && (
                <span className="text-[11px] flex items-center gap-1 text-slate-400 dark:text-zinc-500">
                  <UserIcon className="w-3 h-3" />
                  {task.assignedToName}
                </span>
              )}

              {/* Completed at */}
              {task.completedAt && (
                <span className="text-[11px] flex items-center gap-1 text-green-600 dark:text-green-500">
                  <CheckCircle className="w-3 h-3" />
                  Completed {formatDate(task.completedAt)}
                </span>
              )}
            </div>
          </div>

        </div>
      </Card>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Task List
  // ---------------------------------------------------------------------------

  const renderTaskList = () => (
    <div className="space-y-3">
      {listError && (
        <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
          {listError}
        </Alert>
      )}

      {isLoading ? (
        <Card className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="mt-3 text-sm text-slate-500 dark:text-zinc-400">
            Loading tasks...
          </p>
        </Card>
      ) : tasks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-slate-100 dark:bg-zinc-800">
            <ListTodo className="w-7 h-7 text-slate-300 dark:text-zinc-600" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
            {hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
          </p>
          <p className="text-xs mt-1 text-slate-400 dark:text-zinc-600">
            {hasActiveFilters ? 'Try adjusting your filters' : 'Click "New Task" to create one'}
          </p>
        </Card>
      ) : (
        <>
          {tasks.map(task => renderTaskCard(task))}

          {/* Pagination */}
          <Card padding="none">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalRecords}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </Card>
        </>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Task Detail Modal
  // ---------------------------------------------------------------------------

  const renderDetailModal = () => {
    if (!detailTask) return null;
    const task = detailTask;
    const TypeIcon = getTypeIcon(task.type);
    const overdue = isOverdue(task);
    const isCompleted = task.status === 'completed';

    return (
      <Modal
        open={showDetailModal}
        onClose={closeDetailModal}
        title={task.title}
        icon={<TypeIcon className="w-5 h-5" />}
        size="lg"
        footer={
          <div className="flex items-center gap-2 w-full">
            <Button
              variant="ghost"
              size="sm"
              icon={<Edit2 className="w-4 h-4" />}
              onClick={() => { closeDetailModal(); openEditTaskModal(task); }}
            >
              Edit
            </Button>
            {deleteConfirmId === task.id ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="danger"
                  size="xs"
                  onClick={() => { handleDelete(task.id); closeDetailModal(); }}
                >
                  Confirm
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                onClick={() => setDeleteConfirmId(task.id)}
              >
                Delete
              </Button>
            )}
            <div className="flex-1" />
            {!isCompleted && (
              <Button
                variant="primary"
                size="sm"
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={() => { handleComplete(task.id); closeDetailModal(); }}
              >
                Mark as Complete
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-6">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={PRIORITY_BADGE_VARIANT[task.priority] || 'amber'}>
              {task.priority} Priority
            </Badge>
            <Badge variant={STATUS_BADGE_VARIANT[task.status] || 'warning'}>
              {statusLabel(task.status)}
            </Badge>
            {overdue && (
              <Badge variant="red" className="font-bold">OVERDUE</Badge>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-dark-100">
              <TypeIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400 dark:text-zinc-500" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">Type</p>
                <p className="text-sm text-slate-900 dark:text-white">{task.type || '-'}</p>
              </div>
            </div>
            {task.dueDate && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-dark-100">
                <Calendar className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400 dark:text-zinc-500" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">Due Date</p>
                  <p className="text-sm text-slate-900 dark:text-white">
                    {formatDate(task.dueDate)}{task.dueTime ? ` at ${formatTime(task.dueTime)}` : ''}
                  </p>
                </div>
              </div>
            )}
            {task.assignedToName && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-dark-100">
                <UserIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400 dark:text-zinc-500" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">Assigned To</p>
                  <p className="text-sm text-slate-900 dark:text-white">{task.assignedToName}</p>
                </div>
              </div>
            )}
            {task.completedAt && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-dark-100">
                <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-500" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">Completed</p>
                  <p className="text-sm text-slate-900 dark:text-white">{formatDate(task.completedAt)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-slate-400 dark:text-zinc-500">
                Description
              </h4>
              <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-zinc-300">
                {task.description}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center gap-4 text-[11px] pt-2 border-t border-slate-100 text-slate-400 dark:border-zinc-800 dark:text-zinc-600">
            {task.createdAt && <span>Created: {formatDate(task.createdAt)}</span>}
            {task.updatedAt && <span>Updated: {formatDate(task.updatedAt)}</span>}
          </div>
        </div>
      </Modal>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Create/Edit Task Modal
  // ---------------------------------------------------------------------------

  const renderTaskModal = () => {
    return (
      <Modal
        open={showTaskModal}
        onClose={closeTaskModal}
        title={editingTaskId ? 'Edit Task' : 'New Task'}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={closeTaskModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              loading={isSubmitting}
              icon={!isSubmitting ? <CheckCircle className="w-4 h-4" /> : undefined}
              shine
              onClick={() => {
                // Trigger form submit via hidden button
                const form = document.getElementById('task-form') as HTMLFormElement;
                form?.requestSubmit();
              }}
            >
              {isSubmitting ? 'Saving...' : editingTaskId ? 'Update Task' : 'Create Task'}
            </Button>
          </>
        }
      >
        <form id="task-form" onSubmit={handleTaskSubmit}>
          <div className="space-y-5">
            {taskFormError && (
              <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
                {taskFormError}
              </Alert>
            )}

            {/* Title */}
            <Input
              label="Title"
              id="task-title"
              name="title"
              type="text"
              placeholder="Task title"
              value={taskFormData.title}
              onChange={handleTaskFormChange}
              icon={<ListTodo className="w-4 h-4" />}
              required
            />

            {/* Description */}
            <Textarea
              label="Description"
              id="task-description"
              name="description"
              rows={3}
              placeholder="Task description..."
              value={taskFormData.description}
              onChange={handleTaskFormChange}
              className="resize-none"
            />

            {/* Row: Type + Status + Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Type"
                id="task-type"
                name="type"
                value={taskFormData.type}
                onChange={handleTaskFormChange}
              >
                {TASK_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>

              <Select
                label="Status"
                id="task-status"
                name="status"
                value={taskFormData.status}
                onChange={handleTaskFormChange}
              >
                {TASK_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>

              <Select
                label="Priority"
                id="task-priority"
                name="priority"
                value={taskFormData.priority}
                onChange={handleTaskFormChange}
              >
                {TASK_PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Select>
            </div>

            {/* Row: Due Date + Due Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Due Date"
                id="task-dueDate"
                name="dueDate"
                type="date"
                value={taskFormData.dueDate}
                onChange={handleTaskFormChange}
                icon={<Calendar className="w-4 h-4" />}
              />
              <Input
                label="Due Time"
                id="task-dueTime"
                name="dueTime"
                type="time"
                value={taskFormData.dueTime}
                onChange={handleTaskFormChange}
                icon={<Clock className="w-4 h-4" />}
              />
            </div>

            {/* Assigned To */}
            <Select
              label="Assigned To"
              id="task-assignedTo"
              name="assignedTo"
              value={taskFormData.assignedTo}
              onChange={handleTaskFormChange}
            >
              <option value="">Select User</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
          </div>
        </form>
      </Modal>
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
          <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white">
            Tasks
          </h1>
          <p className="text-sm mt-0.5 text-slate-500 dark:text-zinc-400">
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
