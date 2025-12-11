import React, { useState, useEffect } from 'react';
import { Plus, Filter, CheckCircle2, Circle, Clock, AlertCircle, Calendar, Phone, Mail, Users, MoreHorizontal, ChevronRight, X, Loader2 } from 'lucide-react';
import { Task } from '../types';
import { tasksApi } from '../services/api';

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Urgent': return 'bg-red-100 text-red-700 border-red-200';
    case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'Normal': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Low': return 'bg-slate-100 text-slate-600 border-slate-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Completed': return <CheckCircle2 size={18} className="text-green-500" />;
    case 'In Progress': return <Clock size={18} className="text-blue-500" />;
    case 'Deferred': return <AlertCircle size={18} className="text-yellow-500" />;
    default: return <Circle size={18} className="text-slate-400" />;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'Call': return <Phone size={14} />;
    case 'Email': return <Mail size={14} />;
    case 'Meeting': return <Users size={14} />;
    case 'Demo': return <Users size={14} />;
    default: return <CheckCircle2 size={14} />;
  }
};

export const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', type: 'Task' as Task['type'], priority: 'Normal' as Task['priority'], dueDate: '' });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const data = await tasksApi.getAll();
        setTasks(data as Task[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter(task => {
    if (activeFilter === 'today') return task.dueDate === today && task.status !== 'Completed';
    if (activeFilter === 'upcoming') return task.dueDate > today && task.status !== 'Completed';
    if (activeFilter === 'overdue') return task.dueDate < today && task.status !== 'Completed';
    if (activeFilter === 'completed') return task.status === 'Completed';
    return true;
  });

  const toggleTaskStatus = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'Completed' ? 'Not Started' : 'Completed';
    try {
      await tasksApi.update(taskId, { status: newStatus });
      setTasks(tasks.map(t =>
        t.id === taskId
          ? { ...t, status: newStatus as Task['status'], completedAt: newStatus === 'Completed' ? new Date().toISOString() : undefined }
          : t
      ));
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleCreateTask = async () => {
    if (newTask.title && newTask.dueDate) {
      try {
        const createdTask = await tasksApi.create({
          ...newTask,
          status: 'Not Started',
          assignedTo: 'Sarah Jenkins',
          createdBy: 'Sarah Jenkins',
        });
        setTasks([...tasks, createdTask as Task]);
        setNewTask({ title: '', type: 'Task', priority: 'Normal', dueDate: '' });
        setShowAddModal(false);
      } catch (err) {
        console.error('Failed to create task:', err);
      }
    }
  };

  const stats = {
    total: tasks.length,
    today: tasks.filter(t => t.dueDate === today && t.status !== 'Completed').length,
    overdue: tasks.filter(t => t.dueDate < today && t.status !== 'Completed').length,
    completed: tasks.filter(t => t.status === 'Completed').length,
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-slate-500">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to load tasks</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Tasks</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Due Today</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.today}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Calendar size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Overdue</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.overdue}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-display font-bold text-slate-900">Tasks</h3>
            <div className="flex bg-slate-100 rounded-lg p-1">
              {(['all', 'today', 'upcoming', 'overdue', 'completed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                    activeFilter === filter
                      ? 'bg-white text-brand-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter size={16} /> Filter
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-glow"
            >
              <Plus size={16} /> Add Task
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="divide-y divide-slate-100">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 size={48} className="mx-auto text-slate-300 mb-4" />
              <h4 className="text-lg font-medium text-slate-600">No tasks found</h4>
              <p className="text-sm text-slate-400 mt-1">Create a new task to get started</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleTaskStatus(task.id)}
                    className="mt-1 hover:scale-110 transition-transform"
                  >
                    {getStatusIcon(task.status)}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className={`text-sm font-medium ${task.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {task.title}
                        </h4>
                        {task.relatedTo && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <ChevronRight size={12} />
                            {task.relatedTo.type}: {task.relatedTo.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 text-slate-400 hover:text-slate-600">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        {getTypeIcon(task.type)}
                        {task.type}
                      </span>
                      <span className={`flex items-center gap-1 text-xs ${task.dueDate < today && task.status !== 'Completed' ? 'text-red-600' : 'text-slate-500'}`}>
                        <Calendar size={12} />
                        {task.dueDate}
                        {task.dueTime && ` at ${task.dueTime}`}
                      </span>
                      <span className="text-xs text-slate-400">
                        Assigned to: {task.assignedTo}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">New Task</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Enter task title..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask({ ...newTask, type: e.target.value as Task['type'] })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Task">Task</option>
                    <option value="Call">Call</option>
                    <option value="Email">Email</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Demo">Demo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
