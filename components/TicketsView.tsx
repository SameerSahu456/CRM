import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, Clock, AlertCircle, CheckCircle2, User, Building2, MessageSquare, MoreVertical, X, Send, Paperclip, Tag, Loader2 } from 'lucide-react';
import { Ticket } from '../types';
import { ticketsApi } from '../services/api';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Open': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'In Progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'Pending': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'On Hold': return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'Resolved': return 'bg-green-100 text-green-700 border-green-200';
    case 'Closed': return 'bg-slate-100 text-slate-500 border-slate-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Urgent': return 'text-red-600 bg-red-50';
    case 'High': return 'text-orange-600 bg-orange-50';
    case 'Medium': return 'text-yellow-600 bg-yellow-50';
    case 'Low': return 'text-slate-500 bg-slate-50';
    default: return 'text-slate-500 bg-slate-50';
  }
};

const getPriorityDot = (priority: string) => {
  switch (priority) {
    case 'Urgent': return 'bg-red-500';
    case 'High': return 'bg-orange-500';
    case 'Medium': return 'bg-yellow-500';
    case 'Low': return 'bg-slate-400';
    default: return 'bg-slate-400';
  }
};

export const TicketsView: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'pending' | 'resolved'>('all');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const data = await ticketsApi.getAll();
        setTickets(data as Ticket[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.contactName.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'open') return matchesSearch && ['Open', 'In Progress'].includes(ticket.status);
    if (activeFilter === 'pending') return matchesSearch && ['Pending', 'On Hold'].includes(ticket.status);
    if (activeFilter === 'resolved') return matchesSearch && ['Resolved', 'Closed'].includes(ticket.status);
    return matchesSearch;
  });

  const stats = {
    open: tickets.filter(t => ['Open', 'In Progress'].includes(t.status)).length,
    pending: tickets.filter(t => ['Pending', 'On Hold'].includes(t.status)).length,
    resolved: tickets.filter(t => t.status === 'Resolved').length,
    avgResponseTime: '2.4h',
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-slate-500">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to load tickets</h3>
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
              <p className="text-sm text-slate-500 font-medium">Open Tickets</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.open}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <MessageSquare size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Pending</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <Clock size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Resolved Today</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Avg Response Time</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.avgResponseTime}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Ticket List */}
        <div className="flex-1 bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-display font-bold text-slate-900">Support Tickets</h3>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                  <Filter size={16} /> Filter
                </button>
                <button className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 shadow-glow">
                  <Plus size={16} /> New Ticket
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex bg-slate-100 rounded-lg p-1">
                {(['all', 'open', 'pending', 'resolved'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
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
          </div>

          {/* Ticket List */}
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                  selectedTicket?.id === ticket.id ? 'bg-brand-50 border-l-4 border-brand-600' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-500">{ticket.ticketNumber}</span>
                      <span className={`w-2 h-2 rounded-full ${getPriorityDot(ticket.priority)}`} />
                    </div>
                    <h4 className="text-sm font-medium text-slate-900 truncate">{ticket.subject}</h4>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {ticket.contactName}
                      </span>
                      {ticket.accountName && (
                        <span className="flex items-center gap-1">
                          <Building2 size={12} />
                          {ticket.accountName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Detail Panel */}
        {selectedTicket ? (
          <div className="w-[500px] bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-500">{selectedTicket.ticketNumber}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedTicket.subject}</h2>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                  <X size={18} />
                </button>
              </div>

              {/* Ticket Meta */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Contact</p>
                  <p className="font-medium text-slate-900">{selectedTicket.contactName}</p>
                  <p className="text-slate-500 text-xs">{selectedTicket.contactEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Priority</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Type</p>
                  <p className="font-medium text-slate-900">{selectedTicket.type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Assigned To</p>
                  <p className="font-medium text-slate-900">{selectedTicket.assignedTo || 'Unassigned'}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{selectedTicket.description}</p>
            </div>

            {/* Comments/Activity */}
            <div className="flex-1 p-6 overflow-y-auto">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Activity</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                    DK
                  </div>
                  <div className="flex-1">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-900">David Kim</span>
                        <span className="text-xs text-slate-400">2 hours ago</span>
                      </div>
                      <p className="text-sm text-slate-600">I am looking into this issue. Will update you shortly.</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
                    {selectedTicket.contactName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-900">{selectedTicket.contactName}</span>
                        <span className="text-xs text-slate-400">5 hours ago</span>
                      </div>
                      <p className="text-sm text-slate-600">{selectedTicket.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reply Box */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                  SJ
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                    rows={3}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg">
                      <Paperclip size={16} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                      <Send size={14} /> Send Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-[500px] bg-white rounded-2xl shadow-soft border border-slate-200 flex items-center justify-center">
            <div className="text-center p-8">
              <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
              <h4 className="text-lg font-medium text-slate-600">Select a ticket</h4>
              <p className="text-sm text-slate-400 mt-1">Choose a ticket to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
