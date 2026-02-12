import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, ChevronLeft, ChevronRight, X, Edit2, Trash2,
  Loader2, AlertCircle, CheckCircle, Clock, MapPin,
  Link as LinkIcon, Calendar, Video, Phone, Presentation,
  Bell, ListTodo, FileText
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { calendarApi } from '../services/api';
import { CalendarEvent } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EVENT_TYPES = [
  { value: 'Meeting', label: 'Meeting' },
  { value: 'Call', label: 'Call' },
  { value: 'Demo', label: 'Demo' },
  { value: 'Webinar', label: 'Webinar' },
  { value: 'Task', label: 'Task' },
  { value: 'Reminder', label: 'Reminder' },
];

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string; dot: string }> = {
  Meeting:  { bg: 'bg-blue-50', text: 'text-blue-700', darkBg: 'bg-blue-900/30', darkText: 'text-blue-400', dot: 'bg-blue-500' },
  Call:     { bg: 'bg-emerald-50', text: 'text-emerald-700', darkBg: 'bg-emerald-900/30', darkText: 'text-emerald-400', dot: 'bg-emerald-500' },
  Demo:     { bg: 'bg-purple-50', text: 'text-purple-700', darkBg: 'bg-purple-900/30', darkText: 'text-purple-400', dot: 'bg-purple-500' },
  Webinar:  { bg: 'bg-orange-50', text: 'text-orange-700', darkBg: 'bg-orange-900/30', darkText: 'text-orange-400', dot: 'bg-orange-500' },
  Task:     { bg: 'bg-amber-50', text: 'text-amber-700', darkBg: 'bg-amber-900/30', darkText: 'text-amber-400', dot: 'bg-amber-500' },
  Reminder: { bg: 'bg-slate-100', text: 'text-slate-600', darkBg: 'bg-zinc-800', darkText: 'text-zinc-400', dot: 'bg-slate-400' },
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
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';

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

  // Styling helpers
  const cardClass = `premium-card ${isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-soft'}`;
  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm transition-all ${isDark ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'} focus:outline-none focus:ring-1 focus:ring-brand-500`;
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

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
          <h1 className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Calendar
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Schedule and manage events
          </p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* Navigation bar */}
      <div className={`${cardClass} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className={`text-lg font-semibold font-display min-w-[200px] text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatMonthYear(currentYear, currentMonth)}
            </h2>
            <button
              onClick={goToNextMonth}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'text-brand-400 hover:bg-brand-900/20 border border-brand-800'
                : 'text-brand-600 hover:bg-brand-50 border border-brand-200'
            }`}
          >
            Today
          </button>
        </div>
      </div>

      {/* Main content: Calendar grid + Side panel */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar grid */}
        <div className={`${cardClass} overflow-hidden flex-1`}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
              <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
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
                    className={`px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider border-b ${
                      isDark ? 'text-zinc-500 border-zinc-800' : 'text-slate-400 border-slate-100'
                    }`}
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
                        className={`min-h-[90px] lg:min-h-[110px] p-1.5 border-b border-r cursor-pointer transition-colors ${
                          isDark ? 'border-zinc-800' : 'border-slate-100'
                        } ${
                          isSelected
                            ? isDark ? 'bg-brand-900/10' : 'bg-brand-50/50'
                            : isDark ? 'hover:bg-zinc-900/50' : 'hover:bg-slate-50/80'
                        } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                      >
                        {/* Date number */}
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${
                              isToday
                                ? 'bg-brand-600 text-white ring-2 ring-brand-300'
                                : isSelected
                                  ? isDark ? 'text-brand-400' : 'text-brand-600'
                                  : isDark ? 'text-zinc-300' : 'text-slate-700'
                            }`}
                          >
                            {day.getDate()}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className={`text-[10px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
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
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer transition-opacity hover:opacity-80 ${
                                  isDark ? `${typeColor.darkBg} ${typeColor.darkText}` : `${typeColor.bg} ${typeColor.text}`
                                }`}
                                title={ev.title}
                              >
                                {ev.title}
                              </div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <p className={`text-[10px] font-medium pl-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
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
        </div>

        {/* Side panel: Selected day events */}
        <div className={`${cardClass} lg:w-80 xl:w-96 flex-shrink-0`}>
          <div className={`p-4 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {selectedDate
                ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                : 'Select a day'}
            </h3>
            {selectedDate && (
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="p-4">
            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Calendar className={`w-10 h-10 ${isDark ? 'text-zinc-700' : 'text-slate-200'}`} />
                <p className={`text-sm mt-3 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Click on a day to view events
                </p>
              </div>
            ) : selectedDayEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
                  isDark ? 'bg-zinc-800' : 'bg-slate-100'
                }`}>
                  <Calendar className={`w-6 h-6 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
                </div>
                <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
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
                      className={`p-3 rounded-xl cursor-pointer transition-colors ${
                        isDark
                          ? 'bg-zinc-900/50 hover:bg-zinc-800/70 border border-zinc-800'
                          : 'bg-slate-50 hover:bg-slate-100 border border-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isDark ? typeColor.darkBg : typeColor.bg
                        }`}>
                          <span className={isDark ? typeColor.darkText : typeColor.text}>{icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {ev.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className={`w-3 h-3 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                            <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                              {ev.allDay ? 'All day' : formatTime(ev.startTime)}
                              {ev.endTime && !ev.allDay ? ` - ${formatTime(ev.endTime)}` : ''}
                            </span>
                          </div>
                          {ev.location && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <MapPin className={`w-3 h-3 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                              <span className={`text-xs truncate ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
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
                  className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isDark
                      ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/10 border border-dashed border-zinc-700'
                      : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50/50 border border-dashed border-slate-200'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Add event
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Type Legend */}
      <div className={`${cardClass} p-4`}>
        <div className="flex flex-wrap items-center gap-4">
          {EVENT_TYPES.map(t => {
            const c = EVENT_TYPE_COLORS[t.value];
            return (
              <div key={t.value} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${c.dot}`} />
                <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{t.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Detail Modal */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={() => setShowDetailModal(false)} />
          <div className={`relative w-full max-w-md max-h-[75vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
            isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
          }`}>
            {/* Header */}
            <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                {(() => {
                  const typeColor = EVENT_TYPE_COLORS[selectedEvent.type || 'Meeting'] || EVENT_TYPE_COLORS.Meeting;
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                      isDark ? `${typeColor.darkBg} ${typeColor.darkText}` : `${typeColor.bg} ${typeColor.text}`
                    }`}>
                      {EVENT_TYPE_ICONS[selectedEvent.type || 'Meeting']}
                      {selectedEvent.type || 'Meeting'}
                    </span>
                  );
                })()}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(selectedEvent)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                  }`}
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {deleteConfirmId === selectedEvent.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(selectedEvent.id)}
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
                    onClick={() => setDeleteConfirmId(selectedEvent.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark ? 'text-zinc-400 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => { setShowDetailModal(false); setDeleteConfirmId(null); }}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 pb-6 space-y-4">
              <h3 className={`text-xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {selectedEvent.title}
              </h3>

              <div className="space-y-3">
                {/* Time */}
                <div className="flex items-center gap-3">
                  <Clock className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <div>
                    <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {formatDateLong(selectedEvent.startTime)}
                    </p>
                    {!selectedEvent.allDay && (
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        {formatTime(selectedEvent.startTime)}
                        {selectedEvent.endTime ? ` - ${formatTime(selectedEvent.endTime)}` : ''}
                      </p>
                    )}
                    {selectedEvent.allDay && (
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>All day</p>
                    )}
                  </div>
                </div>

                {/* Location */}
                {selectedEvent.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                    <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {selectedEvent.location}
                    </p>
                  </div>
                )}

                {/* Meeting Link */}
                {selectedEvent.meetingLink && (
                  <div className="flex items-center gap-3">
                    <LinkIcon className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
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
                    <FileText className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                    <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                      {selectedEvent.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Event Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeFormModal} />
          <div className={`relative w-full max-w-xl max-h-[75vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
            isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
          }`}>
            {/* Header */}
            <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {editingId ? 'Edit Event' : 'New Event'}
              </h2>
              <button
                onClick={closeFormModal}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 pb-6 space-y-5">
              {formError && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                  isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="title" className={labelClass}>
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Event title"
                  value={formData.title}
                  onChange={handleFormChange}
                  className={inputClass}
                  required
                />
              </div>

              {/* Type + Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className={labelClass}>Type</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                    className={selectClass}
                  >
                    {EVENT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="color" className={labelClass}>Color (optional)</label>
                  <input
                    id="color"
                    name="color"
                    type="color"
                    value={formData.color || '#4f46e5'}
                    onChange={handleFormChange}
                    className={`${inputClass} h-[38px] p-1 cursor-pointer`}
                  />
                </div>
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
                <label htmlFor="allDay" className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  All Day Event
                </label>
              </div>

              {/* Start / End time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className={labelClass}>
                    Start {formData.allDay ? 'Date' : 'Time'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="startTime"
                    name="startTime"
                    type={formData.allDay ? 'date' : 'datetime-local'}
                    value={formData.allDay ? (formData.startTime ? formData.startTime.split('T')[0] : '') : formData.startTime}
                    onChange={handleFormChange}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className={labelClass}>
                    End {formData.allDay ? 'Date' : 'Time'}
                  </label>
                  <input
                    id="endTime"
                    name="endTime"
                    type={formData.allDay ? 'date' : 'datetime-local'}
                    value={formData.allDay ? (formData.endTime ? formData.endTime.split('T')[0] : '') : formData.endTime}
                    onChange={handleFormChange}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Location + Meeting Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location" className={labelClass}>Location</label>
                  <div className="relative">
                    <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                    <input
                      id="location"
                      name="location"
                      type="text"
                      placeholder="Office, Zoom, etc."
                      value={formData.location}
                      onChange={handleFormChange}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="meetingLink" className={labelClass}>Meeting Link</label>
                  <div className="relative">
                    <LinkIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                    <input
                      id="meetingLink"
                      name="meetingLink"
                      type="url"
                      placeholder="https://..."
                      value={formData.meetingLink}
                      onChange={handleFormChange}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className={labelClass}>Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Event details..."
                  value={formData.description}
                  onChange={handleFormChange}
                  className={`${inputClass} resize-none`}
                />
              </div>

              </div>
              {/* Footer actions - sticky at bottom */}
              <div className={`sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t ${
                isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={closeFormModal}
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
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {editingId ? 'Update Event' : 'Create Event'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
