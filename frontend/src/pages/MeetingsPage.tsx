import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, Loader2, AlertCircle, CheckCircle,
  MapPin, Link as LinkIcon, Video, Phone, Presentation,
  Search, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { calendarApi } from '@/services/api';
import { CalendarEvent } from '@/types';
import { Card, Button, Input, Select, Modal, Badge, Alert, Textarea, EmptyState } from '@/components/ui';
import { cx } from '@/utils/cx';

const MEETING_TYPES = ['Meeting', 'Call', 'Demo', 'Webinar'];

const TYPE_BADGE_VARIANT: Record<string, 'blue' | 'emerald' | 'purple' | 'amber'> = {
  Meeting: 'blue',
  Call: 'emerald',
  Demo: 'purple',
  Webinar: 'amber',
};

const TYPE_DOT_COLOR: Record<string, string> = {
  Meeting: 'bg-blue-500',
  Call: 'bg-emerald-500',
  Demo: 'bg-purple-500',
  Webinar: 'bg-orange-500',
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

const FILTER_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  ...MEETING_TYPES.map(t => ({ value: t, label: t })),
];

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();

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
          <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white">
            Meetings
          </h1>
          <p className="text-sm mt-1 text-slate-500 dark:text-zinc-400">
            Schedule and manage your meetings, calls, and demos
          </p>
        </div>
        <Button onClick={openCreateForm} icon={<Plus className="w-4 h-4" />}>
          New Meeting
        </Button>
      </div>

      {/* Success toast */}
      {successMsg && (
        <Alert variant="success" icon={<CheckCircle className="w-4 h-4" />}>
          {successMsg}
        </Alert>
      )}

      {/* Filters */}
      <Card padding="none" className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            options={FILTER_TYPE_OPTIONS}
            className="w-40"
          />
          <div className="flex rounded-xl border overflow-hidden border-slate-200 dark:border-zinc-700">
            {(['upcoming', 'past', 'all'] as const).map(v => (
              <button
                key={v}
                onClick={() => setFilterView(v)}
                className={cx(
                  'px-3 py-2 text-sm font-medium capitalize transition-colors',
                  filterView === v
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-600/20 dark:text-brand-400'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800'
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Loading / Error */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
        </div>
      )}

      {error && (
        <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
          {error}
        </Alert>
      )}

      {/* Meetings List */}
      {!isLoading && !error && (
        <div className="space-y-6">
          {/* Today's meetings */}
          {todayMeetings.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider text-slate-400 dark:text-zinc-500">
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
                <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  {filterView === 'past' ? 'Past Meetings' : 'Upcoming'}
                </h2>
              )}
              <div className="space-y-2">
                {otherMeetings.map(m => renderMeetingCard(m))}
              </div>
            </div>
          )}

          {filteredMeetings.length === 0 && (
            <EmptyState
              icon={<Video className="w-12 h-12" />}
              title="No meetings found"
              description={
                filterView === 'upcoming'
                  ? 'Schedule a new meeting to get started'
                  : 'No past meetings match your filters'
              }
            />
          )}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'Edit Meeting' : 'New Meeting'}
        icon={<Video className="w-5 h-5" />}
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowForm(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              icon={!isSaving ? <CheckCircle className="w-4 h-4" /> : undefined}
            >
              {isSaving ? 'Saving...' : editingId ? 'Update Meeting' : 'Create Meeting'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {formError}
            </Alert>
          )}

          <Input
            label="Title"
            value={formData.title}
            onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Product Demo with Acme Corp"
          />

          <Select
            label="Type"
            value={formData.type}
            onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
            options={MEETING_TYPES.map(t => ({ value: t, label: t }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Start Time"
              type="datetime-local"
              value={formData.startTime}
              onChange={e => setFormData(p => ({ ...p, startTime: e.target.value }))}
            />
            <Input
              label="End Time"
              type="datetime-local"
              value={formData.endTime}
              onChange={e => setFormData(p => ({ ...p, endTime: e.target.value }))}
            />
          </div>

          <Input
            label="Location"
            value={formData.location}
            onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
            placeholder="Conference room, office, etc."
          />

          <Input
            label="Meeting Link"
            value={formData.meetingLink}
            onChange={e => setFormData(p => ({ ...p, meetingLink: e.target.value }))}
            placeholder="https://meet.google.com/..."
          />

          <Textarea
            label="Description"
            rows={3}
            value={formData.description}
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            placeholder="Meeting agenda or notes..."
          />
        </div>
      </Modal>
    </div>
  );

  function renderMeetingCard(m: CalendarEvent) {
    const badgeVariant = TYPE_BADGE_VARIANT[m.type || 'Meeting'] || 'blue';
    const dotColor = TYPE_DOT_COLOR[m.type || 'Meeting'] || 'bg-blue-500';
    const isPast = !isUpcoming(m.startTime);

    return (
      <Card
        key={m.id}
        padding="none"
        className={cx('p-4 group transition-all hover:shadow-md', isPast && 'opacity-70')}
      >
        <div className="flex items-start gap-4">
          {/* Time column */}
          <div className="flex-shrink-0 w-20 text-center pt-1 text-slate-500 dark:text-zinc-400">
            <p className="text-sm font-medium">{formatTime(m.startTime)}</p>
            {m.endTime && <p className="text-xs mt-0.5">{formatTime(m.endTime)}</p>}
            <p className="text-[10px] mt-1 uppercase tracking-wider">
              {new Date(m.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>

          {/* Divider dot */}
          <div className="flex flex-col items-center pt-2">
            <div className={cx('w-2.5 h-2.5 rounded-full', dotColor)} />
            <div className="w-px flex-1 mt-1 bg-slate-200 dark:bg-zinc-800" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium truncate text-slate-900 dark:text-white">{m.title}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant={badgeVariant} size="sm">
                    {TYPE_ICONS[m.type || 'Meeting']}
                    {m.type}
                  </Badge>
                  {m.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500">
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
                  className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={deletingId === m.id}
                  className="p-1.5 rounded-lg transition-colors text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                >
                  {deletingId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {m.description && (
              <p className="text-sm mt-2 line-clamp-2 text-slate-500 dark:text-zinc-400">{m.description}</p>
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
      </Card>
    );
  }
};
