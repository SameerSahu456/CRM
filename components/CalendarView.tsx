import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, Video, X, Loader2, AlertCircle } from 'lucide-react';
import { CalendarEvent } from '../types';
import { calendarEventsApi } from '../services/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 11, 10)); // December 2024
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await calendarEventsApi.getAll();
        setEvents(data as CalendarEvent[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch calendar events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getEventsForDate = (date: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return events.filter(event => event.start.startsWith(dateStr));
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const calendarDays = [];

  // Previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, isCurrentMonth: false, date: new Date(year, month - 1, daysInPrevMonth - i) });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
  }

  // Next month days
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
  }

  const today = new Date();
  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-3" />
          <p className="text-slate-500">Loading calendar events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">Error loading calendar</p>
          <p className="text-slate-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-900 font-display">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                <ChevronRight size={20} />
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 rounded-lg p-1">
              {(['month', 'week', 'day'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                    view === v ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-glow"
            >
              <Plus size={16} /> New Event
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-px bg-slate-200">
            {DAYS.map((day) => (
              <div key={day} className="bg-slate-50 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-px bg-slate-200 mt-px">
            {calendarDays.map((dayObj, index) => {
              const dayEvents = dayObj.isCurrentMonth ? getEventsForDate(dayObj.day) : [];

              return (
                <div
                  key={index}
                  className={`bg-white min-h-[120px] p-2 ${!dayObj.isCurrentMonth ? 'bg-slate-50' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                    isToday(dayObj.date)
                      ? 'bg-brand-600 text-white'
                      : dayObj.isCurrentMonth
                        ? 'text-slate-900'
                        : 'text-slate-400'
                  }`}>
                    {dayObj.day}
                  </div>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="w-full text-left px-2 py-1 rounded text-xs font-medium truncate transition-colors"
                        style={{
                          backgroundColor: `${event.color}20`,
                          color: event.color,
                          borderLeft: `3px solid ${event.color}`
                        }}
                      >
                        {formatTime(event.start)} {event.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <button className="text-xs text-slate-500 hover:text-brand-600 font-medium">
                        +{dayEvents.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            {events.slice(0, 5).map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-brand-300 cursor-pointer transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: event.color }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-slate-900 truncate">{event.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatTime(event.start)}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div
              className="h-2 rounded-t-2xl"
              style={{ backgroundColor: selectedEvent.color }}
            />
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{selectedEvent.type}</span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedEvent.title}</h2>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={16} className="text-slate-400" />
                  <div>
                    <p className="text-slate-900 font-medium">
                      {new Date(selectedEvent.start).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-slate-500">
                      {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                    </p>
                  </div>
                </div>

                {selectedEvent.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin size={16} className="text-slate-400" />
                    <span className="text-slate-700">{selectedEvent.location}</span>
                  </div>
                )}

                {selectedEvent.meetingLink && (
                  <div className="flex items-center gap-3 text-sm">
                    <Video size={16} className="text-slate-400" />
                    <a href={selectedEvent.meetingLink} className="text-brand-600 hover:underline">
                      Join meeting
                    </a>
                  </div>
                )}

                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div className="flex items-start gap-3 text-sm">
                    <Users size={16} className="text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-slate-700 font-medium mb-2">Attendees</p>
                      <div className="space-y-1">
                        {selectedEvent.attendees.map((attendee) => (
                          <div key={attendee.id} className="flex items-center justify-between">
                            <span className="text-slate-600">{attendee.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              attendee.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                              attendee.status === 'Declined' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {attendee.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedEvent.relatedTo && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Related To</p>
                    <p className="text-sm text-slate-900">{selectedEvent.relatedTo.type}: {selectedEvent.relatedTo.name}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors">
                  Edit Event
                </button>
                <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">New Event</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Event Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Enter event title..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="Meeting">Meeting</option>
                  <option value="Call">Call</option>
                  <option value="Demo">Demo</option>
                  <option value="Webinar">Webinar</option>
                  <option value="Task">Task</option>
                  <option value="Reminder">Reminder</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Add location or meeting link..."
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
              <button className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
