import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, X, Edit2, Trash2, Loader2, AlertCircle, CheckCircle,
  Clock, MapPin, Link as LinkIcon, Video, Phone, Presentation,
  Search, ChevronDown, ExternalLink
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { calendarApi } from '../services/api';
import { CalendarEvent } from '../types';

const MEETING_TYPES = ['Meeting', 'Call', 'Demo', 'Webinar'];

const TYPE_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string; dot: string }> = {
  Meeting: { bg: 'bg-blue-50', text: 'text-blue-700', darkBg: 'bg-blue-900/30', darkText: 'text-blue-400', dot: 'bg-blue-500' },
  Call: { bg: 'bg-emerald-50', text: 'text-emerald-700', darkBg: 'bg-emerald-900/30', darkText: 'text-emerald-400', dot: 'bg-emerald-500' },
  Demo: { bg: 'bg-purple-50', text: 'text-purple-700', darkBg: 'bg-purple-900/30', darkText: 'text-purple-400', dot: 'bg-purple-500' },
  Webinar: { bg: 'bg-orange-50', text: 'text-orange-700', darkBg: 'bg-orange-900/30', darkText: 'text-orange-400', dot: 'bg-orange-500' },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Meeting: <Video className="w-4 h-4" />,
  Call: <Phone className="w-4 h-4" />,
  Demo: <Presentation className="w-4 h-4" />,
  Webinar: <Presentation className="w-4 h-4" />,
};

interface MeetingFormData {
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  location: string;
  meetingLink: string;
  description: string;
}

const EMPTY_FORM: MeetingFormData = {
  title: '',
  type: 'Meeting',
  startTime: '',
  endTime: '',
  location: '',
  meetingLink: '',
  description: '',
};

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return dateStr; }
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  } catch { return ''; }
}

function toLocalDatetime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch { return ''; }
}

function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) >= new Date();
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

export const MeetingsPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  const [meetings, setMeetings] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterView, setFilterView] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MeetingFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const cardClass = `premium-card ${isDark ? '' : 'shadow-soft'}`;
  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm transition-all ${
    isDark
      ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
  } focus:outline-none focus:ring-1 focus:ring-brand-500`;
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await calendarApi.list({ type: filterType || undefined } as any);
      const all: CalendarEvent[] = Array.isArray(res) ? res : (res?.data ?? []);
      // Filter to meeting types only
      const meetingEvents = all.filter(e => MEETING_TYPES.includes(e.type || ''));
      setMeetings(meetingEvents);
    } catch (err: any) {
      setError(err.message || 'Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  }, [filterType]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const filteredMeetings = meetings
    .filter(m => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!m.title.toLowerCase().includes(q) &&
            !(m.description || '').toLowerCase().includes(q) &&
            !(m.location || '').toLowerCase().includes(q)) return false;
      }
      if (filterType && m.type !== filterType) return false;
      if (filterView === 'upcoming') return isUpcoming(m.startTime);
      if (filterView === 'past') return !isUpcoming(m.startTime);
      return true;
    })
    .sort((a, b) => {
      if (filterView === 'past') return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

  const openCreateForm = () => {
    setEditingId(null);
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    setFormData({
      ...EMPTY_FORM,
      startTime: toLocalDatetime(now.toISOString()),
      endTime: toLocalDatetime(end.toISOString()),
    });
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (m: CalendarEvent) => {
    setEditingId(m.id);
    setFormData({
      title: m.title,
      type: m.type || 'Meeting',
      startTime: toLocalDatetime(m.startTime),
      endTime: m.endTime ? toLocalDatetime(m.endTime) : '',
      location: m.location || '',
      meetingLink: m.meetingLink || '',
      description: m.description || '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) { setFormError('Title is required'); return; }
    if (!formData.startTime) { setFormError('Start time is required'); return; }

    setIsSaving(true);
    setFormError('');
    try {
      const payload: any = {
        title: formData.title,
        type: formData.type,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
        allDay: false,
        location: formData.location || undefined,
        meetingLink: formData.meetingLink || undefined,
        description: formData.description || undefined,
      };
      if (editingId) {
        await calendarApi.update(editingId, payload);
        setSuccessMsg('Meeting updated');
      } else {
        await calendarApi.create(payload);
        setSuccessMsg('Meeting created');
      }
      setShowForm(false);
      fetchMeetings();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save meeting');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await calendarApi.delete(id);
      fetchMeetings();
      setSuccessMsg('Meeting deleted');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const todayMeetings = filteredMeetings.filter(m => isToday(m.startTime));
  const otherMeetings = filteredMeetings.filter(m => !isToday(m.startTime));

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Meetings
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Schedule and manage your meetings, calls, and demos
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" /> New Meeting
        </button>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Filters */}
      <div className={`flex flex-wrap items-center gap-3 ${cardClass} p-4`}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search meetings..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className={`${selectClass} w-40`}>
          <option value="">All Types</option>
          {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className={`flex rounded-xl border overflow-hidden ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
          {(['upcoming', 'past', 'all'] as const).map(v => (
            <button
              key={v}
              onClick={() => setFilterView(v)}
              className={`px-3 py-2 text-sm font-medium capitalize transition-colors ${
                filterView === v
                  ? isDark ? 'bg-brand-600/20 text-brand-400' : 'bg-brand-50 text-brand-700'
                  : isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
        </div>
      )}

      {error && (
        <div className={`p-4 rounded-xl flex items-center gap-2 text-sm ${
          isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Meetings List */}
      {!isLoading && !error && (
        <div className="space-y-6">
          {/* Today's meetings */}
          {todayMeetings.length > 0 && (
            <div>
              <h2 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                Today
              </h2>
              <div className="space-y-2">
                {todayMeetings.map(m => renderMeetingCard(m))}
              </div>
            </div>
          )}

          {/* Other meetings */}
          {otherMeetings.length > 0 && (
            <div>
              {todayMeetings.length > 0 && (
                <h2 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  {filterView === 'past' ? 'Past Meetings' : 'Upcoming'}
                </h2>
              )}
              <div className="space-y-2">
                {otherMeetings.map(m => renderMeetingCard(m))}
              </div>
            </div>
          )}

          {filteredMeetings.length === 0 && (
            <div className={`text-center py-16 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              <Video className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">No meetings found</p>
              <p className="text-sm mt-1">
                {filterView === 'upcoming' ? 'Schedule a new meeting to get started' : 'No past meetings match your filters'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && renderFormModal()}
    </div>
  );

  function renderMeetingCard(m: CalendarEvent) {
    const typeColor = TYPE_COLORS[m.type || 'Meeting'] || TYPE_COLORS.Meeting;
    const isPast = !isUpcoming(m.startTime);

    return (
      <div
        key={m.id}
        className={`${cardClass} p-4 flex items-start gap-4 group transition-all hover:shadow-md ${isPast ? 'opacity-70' : ''}`}
      >
        {/* Time column */}
        <div className={`flex-shrink-0 w-20 text-center pt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          <p className="text-sm font-medium">{formatTime(m.startTime)}</p>
          {m.endTime && <p className="text-xs mt-0.5">{formatTime(m.endTime)}</p>}
          <p className="text-[10px] mt-1 uppercase tracking-wider">
            {new Date(m.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* Divider dot */}
        <div className="flex flex-col items-center pt-2">
          <div className={`w-2.5 h-2.5 rounded-full ${typeColor.dot}`} />
          <div className={`w-px flex-1 mt-1 ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className={`font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{m.title}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  isDark ? `${typeColor.darkBg} ${typeColor.darkText}` : `${typeColor.bg} ${typeColor.text}`
                }`}>
                  {TYPE_ICONS[m.type || 'Meeting']}
                  {m.type}
                </span>
                {m.location && (
                  <span className={`inline-flex items-center gap-1 text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    <MapPin className="w-3 h-3" /> {m.location}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {m.meetingLink && (
                <a
                  href={m.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                  title="Join meeting"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={() => openEditForm(m)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(m.id)}
                disabled={deletingId === m.id}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-500 hover:bg-red-50'
                } disabled:opacity-50`}
              >
                {deletingId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {m.description && (
            <p className={`text-sm mt-2 line-clamp-2 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{m.description}</p>
          )}

          {m.meetingLink && (
            <a
              href={m.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 mt-2"
            >
              <LinkIcon className="w-3 h-3" /> {m.meetingLink}
            </a>
          )}
        </div>
      </div>
    );
  }

  function renderFormModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh] overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 animate-backdrop" onClick={() => setShowForm(false)} />
        <div className={`relative w-full max-w-lg rounded-2xl animate-fade-in-up ${
          isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-zinc-800' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-brand-500" />
              <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {editingId ? 'Edit Meeting' : 'New Meeting'}
              </h2>
            </div>
            <button onClick={() => setShowForm(false)} className={`p-2 rounded-lg transition-colors ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {formError && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <AlertCircle className="w-4 h-4" /> {formError}
              </div>
            )}

            <div>
              <label className={labelClass}>Title <span className="text-red-500">*</span></label>
              <input
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                className={inputClass}
                placeholder="e.g. Product Demo with Acme Corp"
              />
            </div>

            <div>
              <label className={labelClass}>Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
                className={selectClass}
              >
                {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Start Time <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={e => setFormData(p => ({ ...p, startTime: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>End Time</label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={e => setFormData(p => ({ ...p, endTime: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Location</label>
              <input
                value={formData.location}
                onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                className={inputClass}
                placeholder="Conference room, office, etc."
              />
            </div>

            <div>
              <label className={labelClass}>Meeting Link</label>
              <input
                value={formData.meetingLink}
                onChange={e => setFormData(p => ({ ...p, meetingLink: e.target.value }))}
                className={inputClass}
                placeholder="https://meet.google.com/..."
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                className={inputClass}
                placeholder="Meeting agenda or notes..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
            isDark ? 'border-zinc-800' : 'border-slate-200'
          }`}>
            <button
              onClick={() => setShowForm(false)}
              disabled={isSaving}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              } disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> {editingId ? 'Update Meeting' : 'Create Meeting'}</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
};
