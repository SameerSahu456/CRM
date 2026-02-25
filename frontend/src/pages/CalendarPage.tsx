import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, ChevronLeft, ChevronRight, Edit2, Trash2,
  Loader2, AlertCircle, CheckCircle, Clock, MapPin,
  Link as LinkIcon, Calendar, Video, Phone, Presentation,
  Bell, ListTodo, FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDropdowns } from '@/contexts/DropdownsContext';
import { calendarApi } from '@/services/api';
import { CalendarEvent } from '@/types';
import { Card, Button, Input, Select, Modal, Badge, Alert, Textarea } from '@/components/ui';
import { cx } from '@/utils/cx';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Meeting:  { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  Call:     { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  Demo:     { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
  Webinar:  { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
  Task:     { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  Reminder: { bg: 'bg-slate-100 dark:bg-zinc-800', text: 'text-slate-600 dark:text-zinc-400', dot: 'bg-slate-400' },
};

const EVENT_TYPE_BADGE_VARIANT: Record<string, 'blue' | 'emerald' | 'purple' | 'amber' | 'gray'> = {
  Meeting:  'blue',
  Call:     'emerald',
  Demo:     'purple',
  Webinar:  'amber',
  Task:     'amber',
  Reminder: 'gray',
};

const EVENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  Meeting:  <Video className="w-3.5 h-3.5" />,
  Call:     <Phone className="w-3.5 h-3.5" />,
  Demo:     <Presentation className="w-3.5 h-3.5" />,
  Webinar:  <Presentation className="w-3.5 h-3.5" />,
  Task:     <ListTodo className="w-3.5 h-3.5" />,
  Reminder: <Bell className="w-3.5 h-3.5" />,
};

// ---------------------------------------------------------------------------
// Types local to this page
// ---------------------------------------------------------------------------

interface EventFormData {
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string;
  meetingLink: string;
  description: string;
  color: string;
}

const EMPTY_FORM: EventFormData = {
  title: '',
  type: 'Meeting',
  startTime: '',
  endTime: '',
  allDay: false,
  location: '',
  meetingLink: '',
  description: '',
  color: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days: Date[] = [];

  // Pad leading days from previous month
  const startDow = firstDay.getDay();
  for (let i = startDow - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  // Pad trailing days from next month
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      days.push(new Date(year, month + 1, d));
    }
  }

  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
  } catch {
    return '';
  }
}

function toLocalDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

function formatDateLong(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const { getOptions } = useDropdowns();

  // Dropdown data from DB
  const EVENT_TYPES = getOptions('event-types');

  // Calendar navigation state
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  // Event data state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Side panel for selected day
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Event detail / edit
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Create / Edit modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      // Extend range to cover padded days
      startOfMonth.setDate(startOfMonth.getDate() - startOfMonth.getDay());
      endOfMonth.setDate(endOfMonth.getDate() + (6 - endOfMonth.getDay()));

      const start = startOfMonth.toISOString().split('T')[0];
      const end = endOfMonth.toISOString().split('T')[0];

      const data = await calendarApi.range(start, end);
      const eventList = Array.isArray(data) ? data : (data?.data ?? []);
      setEvents(eventList);
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
    setSelectedDate(null);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(now);
  };

  // ---------------------------------------------------------------------------
  // Events for a specific day
  // ---------------------------------------------------------------------------

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(ev => {
      const evDate = new Date(ev.startTime);
      return isSameDay(evDate, date);
    });
  };

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  const openCreateModal = (date?: Date) => {
    const dt = date || new Date();
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    const defaultStart = `${year}-${month}-${day}T09:00`;
    const defaultEnd = `${year}-${month}-${day}T10:00`;

    setFormData({
      ...EMPTY_FORM,
      startTime: defaultStart,
      endTime: defaultEnd,
    });
    setEditingId(null);
    setFormError('');
    setShowFormModal(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setFormData({
      title: event.title || '',
      type: event.type || 'Meeting',
      startTime: event.allDay ? toLocalDate(event.startTime) : toLocalDatetime(event.startTime),
      endTime: event.endTime ? (event.allDay ? toLocalDate(event.endTime) : toLocalDatetime(event.endTime)) : '',
      allDay: event.allDay || false,
      location: event.location || '',
      meetingLink: event.meetingLink || '',
      description: event.description || '',
      color: event.color || '',
    });
    setEditingId(event.id);
    setFormError('');
    setShowDetailModal(false);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingId(null);
    setFormError('');
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('Title is required');
      return;
    }
    if (!formData.startTime) {
      setFormError('Start time is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: formData.title.trim(),
        type: formData.type,
        allDay: formData.allDay,
        location: formData.location || null,
        meetingLink: formData.meetingLink || null,
        description: formData.description || null,
        color: formData.color || null,
        ownerId: user?.id,
      };

      if (formData.allDay) {
        payload.startTime = new Date(formData.startTime + 'T00:00:00').toISOString();
        payload.endTime = formData.endTime ? new Date(formData.endTime + 'T23:59:59').toISOString() : null;
      } else {
        payload.startTime = new Date(formData.startTime).toISOString();
        payload.endTime = formData.endTime ? new Date(formData.endTime).toISOString() : null;
      }

      if (editingId) {
        await calendarApi.update(editingId, payload);
      } else {
        await calendarApi.create(payload);
      }

      closeFormModal();
      fetchEvents();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await calendarApi.delete(id);
      setDeleteConfirmId(null);
      setShowDetailModal(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch {
      // Silently fail
    }
  };

  const openDetail = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  // ---------------------------------------------------------------------------
  // Calendar grid data
  // ---------------------------------------------------------------------------

  const monthDays = getMonthDays(currentYear, currentMonth);
  const weeks: Date[][] = [];
  for (let i = 0; i < monthDays.length; i += 7) {
    weeks.push(monthDays.slice(i, i + 7));
  }

  const selectedDayEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            Calendar
          </h1>
          <p className="text-sm mt-1 text-slate-500 dark:text-zinc-400">
            Schedule and manage events
          </p>
        </div>
        <Button
          onClick={() => openCreateModal()}
          icon={<Plus className="w-4 h-4" />}
          shine
        >
          Add Event
        </Button>
      </div>

      {/* Navigation bar */}
      <Card padding="none" className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousMonth}
              icon={<ChevronLeft className="w-5 h-5" />}
              className="!p-2"
            />
            <h2 className="text-lg font-semibold font-display min-w-[200px] text-center text-slate-900 dark:text-white">
              {formatMonthYear(currentYear, currentMonth)}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextMonth}
              icon={<ChevronRight className="w-5 h-5" />}
              className="!p-2"
            />
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
      </Card>

      {/* Main content: Calendar grid + Side panel */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar grid */}
        <Card padding="none" className="overflow-hidden flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
              <p className="mt-3 text-sm text-slate-500 dark:text-zinc-400">
                Loading calendar...
              </p>
            </div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7">
                {DAYS_OF_WEEK.map(day => (
                  <div
                    key={day}
                    className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider border-b text-slate-400 dark:text-zinc-500 border-slate-100 dark:border-zinc-800"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="grid grid-cols-7">
                  {week.map((day, dayIdx) => {
                    const isCurrentMonth = day.getMonth() === currentMonth;
                    const isToday = isSameDay(day, today);
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const dayEvents = getEventsForDate(day);

                    return (
                      <div
                        key={dayIdx}
                        onClick={() => setSelectedDate(day)}
                        className={cx(
                          'min-h-[90px] lg:min-h-[110px] p-1.5 border-b border-r cursor-pointer transition-colors',
                          'border-slate-100 dark:border-zinc-800',
                          isSelected
                            ? 'bg-brand-50/50 dark:bg-brand-900/10'
                            : 'hover:bg-slate-50/80 dark:hover:bg-zinc-900/50',
                          !isCurrentMonth && 'opacity-40'
                        )}
                      >
                        {/* Date number */}
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={cx(
                              'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold',
                              isToday
                                ? 'bg-brand-600 text-white ring-2 ring-brand-300'
                                : isSelected
                                  ? 'text-brand-600 dark:text-brand-400'
                                  : 'text-slate-700 dark:text-zinc-300'
                            )}
                          >
                            {day.getDate()}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                              {dayEvents.length}
                            </span>
                          )}
                        </div>

                        {/* Event pills */}
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map(ev => {
                            const typeColor = EVENT_TYPE_COLORS[ev.type || 'Meeting'] || EVENT_TYPE_COLORS.Meeting;
                            return (
                              <div
                                key={ev.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetail(ev);
                                }}
                                className={cx(
                                  'px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer transition-opacity hover:opacity-80',
                                  typeColor.bg,
                                  typeColor.text
                                )}
                                title={ev.title}
                              >
                                {ev.title}
                              </div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <p className="text-[10px] font-medium pl-1 text-slate-400 dark:text-zinc-500">
                              +{dayEvents.length - 3} more
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </Card>

        {/* Side panel: Selected day events */}
        <Card padding="none" className="lg:w-80 xl:w-96 flex-shrink-0">
          <div className="p-4 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {selectedDate
                ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                : 'Select a day'}
            </h3>
            {selectedDate && (
              <p className="text-xs mt-0.5 text-slate-400 dark:text-zinc-500">
                {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="p-4">
            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-10 h-10 text-slate-200 dark:text-zinc-700" />
                <p className="text-sm mt-3 text-slate-400 dark:text-zinc-500">
                  Click on a day to view events
                </p>
              </div>
            ) : selectedDayEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-slate-100 dark:bg-zinc-800">
                  <Calendar className="w-6 h-6 text-slate-300 dark:text-zinc-600" />
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                  No events this day
                </p>
                <button
                  onClick={() => openCreateModal(selectedDate)}
                  className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add event
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map(ev => {
                  const typeColor = EVENT_TYPE_COLORS[ev.type || 'Meeting'] || EVENT_TYPE_COLORS.Meeting;
                  const icon = EVENT_TYPE_ICONS[ev.type || 'Meeting'] || EVENT_TYPE_ICONS.Meeting;
                  return (
                    <div
                      key={ev.id}
                      onClick={() => openDetail(ev)}
                      className="p-3 rounded-xl cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100 border border-slate-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/70 dark:border-zinc-800"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cx(
                          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                          typeColor.bg
                        )}>
                          <span className={typeColor.text}>{icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate text-slate-900 dark:text-white">
                            {ev.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                            <span className="text-xs text-slate-500 dark:text-zinc-400">
                              {ev.allDay ? 'All day' : formatTime(ev.startTime)}
                              {ev.endTime && !ev.allDay ? ` - ${formatTime(ev.endTime)}` : ''}
                            </span>
                          </div>
                          {ev.location && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                              <span className="text-xs truncate text-slate-400 dark:text-zinc-500">
                                {ev.location}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => openCreateModal(selectedDate)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors text-slate-400 hover:text-brand-600 hover:bg-brand-50/50 border border-dashed border-slate-200 dark:text-zinc-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/10 dark:border-zinc-700"
                >
                  <Plus className="w-4 h-4" />
                  Add event
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Event Type Legend */}
      <Card padding="none" className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {EVENT_TYPES.map(t => {
            const c = EVENT_TYPE_COLORS[t.value];
            return (
              <div key={t.value} className="flex items-center gap-2">
                <div className={cx('w-3 h-3 rounded-full', c.dot)} />
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">{t.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Event Detail Modal */}
      <Modal
        open={showDetailModal && !!selectedEvent}
        onClose={() => { setShowDetailModal(false); setDeleteConfirmId(null); }}
        size="sm"
        title={selectedEvent?.type || 'Meeting'}
        icon={EVENT_TYPE_ICONS[selectedEvent?.type || 'Meeting']}
        footer={
          <div className="flex items-center gap-2 w-full justify-between">
            <div className="flex items-center gap-1">
              {deleteConfirmId === selectedEvent?.id ? (
                <>
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => selectedEvent && handleDelete(selectedEvent.id)}
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
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectedEvent && setDeleteConfirmId(selectedEvent.id)}
                  icon={<Trash2 className="w-4 h-4" />}
                  className="text-gray-400 hover:!text-red-600 hover:!bg-red-50 dark:hover:!text-red-400 dark:hover:!bg-red-900/20"
                />
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => selectedEvent && openEditModal(selectedEvent)}
              icon={<Edit2 className="w-4 h-4" />}
            >
              Edit
            </Button>
          </div>
        }
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={EVENT_TYPE_BADGE_VARIANT[selectedEvent.type || 'Meeting'] || 'gray'}>
                {EVENT_TYPE_ICONS[selectedEvent.type || 'Meeting']}
                {selectedEvent.type || 'Meeting'}
              </Badge>
            </div>

            <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              {selectedEvent.title}
            </h3>

            <div className="space-y-3">
              {/* Time */}
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-zinc-500" />
                <div>
                  <p className="text-sm text-slate-700 dark:text-zinc-300">
                    {formatDateLong(selectedEvent.startTime)}
                  </p>
                  {!selectedEvent.allDay && (
                    <p className="text-xs text-slate-400 dark:text-zinc-500">
                      {formatTime(selectedEvent.startTime)}
                      {selectedEvent.endTime ? ` - ${formatTime(selectedEvent.endTime)}` : ''}
                    </p>
                  )}
                  {selectedEvent.allDay && (
                    <p className="text-xs text-slate-400 dark:text-zinc-500">All day</p>
                  )}
                </div>
              </div>

              {/* Location */}
              {selectedEvent.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-zinc-500" />
                  <p className="text-sm text-slate-700 dark:text-zinc-300">
                    {selectedEvent.location}
                  </p>
                </div>
              )}

              {/* Meeting Link */}
              {selectedEvent.meetingLink && (
                <div className="flex items-center gap-3">
                  <LinkIcon className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-zinc-500" />
                  <a
                    href={selectedEvent.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-brand-600 hover:text-brand-700 underline truncate"
                  >
                    {selectedEvent.meetingLink}
                  </a>
                </div>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-400 dark:text-zinc-500" />
                  <p className="text-sm whitespace-pre-wrap text-slate-600 dark:text-zinc-300">
                    {selectedEvent.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Event Modal */}
      <Modal
        open={showFormModal}
        onClose={closeFormModal}
        title={editingId ? 'Edit Event' : 'New Event'}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeFormModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="calendar-event-form"
              loading={isSubmitting}
              icon={!isSubmitting ? <CheckCircle className="w-4 h-4" /> : undefined}
              shine
            >
              {isSubmitting ? 'Saving...' : editingId ? 'Update Event' : 'Create Event'}
            </Button>
          </>
        }
      >
        <form id="calendar-event-form" onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {formError}
            </Alert>
          )}

          {/* Title */}
          <Input
            label="Title *"
            name="title"
            type="text"
            placeholder="Event title"
            value={formData.title}
            onChange={handleFormChange}
            required
          />

          {/* Type + Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleFormChange}
              options={EVENT_TYPES}
            />
            <Input
              label="Color (optional)"
              name="color"
              type="color"
              value={formData.color || '#4f46e5'}
              onChange={handleFormChange}
              className="h-[38px] !p-1 cursor-pointer"
            />
          </div>

          {/* All Day checkbox */}
          <div className="flex items-center gap-3">
            <input
              id="allDay"
              name="allDay"
              type="checkbox"
              checked={formData.allDay}
              onChange={handleFormChange}
              className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="allDay" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              All Day Event
            </label>
          </div>

          {/* Start / End time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`Start ${formData.allDay ? 'Date' : 'Time'} *`}
              name="startTime"
              type={formData.allDay ? 'date' : 'datetime-local'}
              value={formData.allDay ? (formData.startTime ? formData.startTime.split('T')[0] : '') : formData.startTime}
              onChange={handleFormChange}
              required
            />
            <Input
              label={`End ${formData.allDay ? 'Date' : 'Time'}`}
              name="endTime"
              type={formData.allDay ? 'date' : 'datetime-local'}
              value={formData.allDay ? (formData.endTime ? formData.endTime.split('T')[0] : '') : formData.endTime}
              onChange={handleFormChange}
            />
          </div>

          {/* Location + Meeting Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Location"
              name="location"
              type="text"
              placeholder="Office, Zoom, etc."
              value={formData.location}
              onChange={handleFormChange}
              icon={<MapPin className="w-4 h-4" />}
            />
            <Input
              label="Meeting Link"
              name="meetingLink"
              type="url"
              placeholder="https://..."
              value={formData.meetingLink}
              onChange={handleFormChange}
              icon={<LinkIcon className="w-4 h-4" />}
            />
          </div>

          {/* Description */}
          <Textarea
            label="Description"
            name="description"
            rows={4}
            placeholder="Event details..."
            value={formData.description}
            onChange={handleFormChange}
            className="resize-none"
          />
        </form>
      </Modal>
    </div>
  );
};
