import React, { useState, useEffect } from 'react';
import { Plus, Search, Inbox, Send, FileEdit, Star, Trash2, Archive, MoreVertical, Paperclip, Clock, CheckCircle2, X, Reply, Forward, Tag, Loader2, AlertCircle } from 'lucide-react';
import { Email } from '../types';
import { emailsApi } from '../services/api';

const emailTemplates = [
  { id: '1', name: 'Introduction Email', subject: 'Introduction - [Company Name]', category: 'Sales' },
  { id: '2', name: 'Follow-up After Demo', subject: 'Great meeting today!', category: 'Sales' },
  { id: '3', name: 'Proposal Follow-up', subject: 'Following up on our proposal', category: 'Sales' },
  { id: '4', name: 'Thank You Email', subject: 'Thank you for your time', category: 'Sales' },
  { id: '5', name: 'Meeting Request', subject: 'Request for a meeting', category: 'Sales' },
];

export const EmailView: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'drafts' | 'scheduled'>('sent');
  const [showCompose, setShowCompose] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setLoading(true);
        const data = await emailsApi.getAll();
        setEmails(data as Email[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch emails');
      } finally {
        setLoading(false);
      }
    };
    fetchEmails();
  }, []);

  const folders = [
    { id: 'inbox' as const, label: 'Inbox', icon: Inbox, count: 24 },
    { id: 'sent' as const, label: 'Sent', icon: Send, count: emails.filter(e => e.status === 'Sent').length },
    { id: 'drafts' as const, label: 'Drafts', icon: FileEdit, count: emails.filter(e => e.status === 'Draft').length },
    { id: 'scheduled' as const, label: 'Scheduled', icon: Clock, count: emails.filter(e => e.status === 'Scheduled').length },
  ];

  const filteredEmails = emails.filter(email => {
    if (activeFolder === 'sent') return email.status === 'Sent';
    if (activeFolder === 'drafts') return email.status === 'Draft';
    if (activeFolder === 'scheduled') return email.status === 'Scheduled';
    return true;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-3" />
          <p className="text-slate-500">Loading emails...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">Error loading emails</p>
          <p className="text-slate-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-[calc(100vh-5rem)]">
      <div className="flex gap-6 h-full">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-4">
          <button
            onClick={() => setShowCompose(true)}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-brand-700 shadow-glow"
          >
            <Plus size={18} /> Compose
          </button>

          <div className="bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                  activeFolder === folder.id
                    ? 'bg-brand-50 text-brand-600 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <folder.icon size={18} />
                  {folder.label}
                </span>
                {folder.count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeFolder === folder.id ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {folder.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Email Templates */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-soft p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Templates</h3>
              <button
                onClick={() => setShowTemplates(true)}
                className="text-xs text-brand-600 hover:text-brand-700"
              >
                View All
              </button>
            </div>
            <div className="space-y-2">
              {emailTemplates.slice(0, 3).map((template) => (
                <button
                  key={template.id}
                  className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded-lg transition-colors truncate"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          {/* Email Stats */}
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl p-4 text-white">
            <h3 className="text-sm font-bold mb-3">This Week</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-brand-200 text-xs">Emails Sent</span>
                <span className="font-bold">127</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-200 text-xs">Open Rate</span>
                <span className="font-bold">42.3%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-200 text-xs">Click Rate</span>
                <span className="font-bold">18.5%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-slate-900 capitalize">{activeFolder}</h3>
              <span className="text-sm text-slate-500">{filteredEmails.length} emails</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search emails..."
                className="pl-9 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredEmails.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Inbox size={48} className="mx-auto text-slate-300 mb-4" />
                  <h4 className="text-lg font-medium text-slate-600">No emails</h4>
                  <p className="text-sm text-slate-400">Your {activeFolder} folder is empty</p>
                </div>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                    selectedEmail?.id === email.id ? 'bg-brand-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {email.to[0].split('@')[0].substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {email.to[0]}
                        </span>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {email.sentAt ? formatDate(email.sentAt) : email.scheduledAt ? formatDate(email.scheduledAt) : ''}
                        </span>
                      </div>
                      <h4 className="text-sm text-slate-900 font-medium truncate">{email.subject}</h4>
                      <p className="text-xs text-slate-500 truncate mt-1">{email.body.substring(0, 100)}...</p>
                      <div className="flex items-center gap-3 mt-2">
                        {email.relatedTo && (
                          <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                            {email.relatedTo.type}: {email.relatedTo.name}
                          </span>
                        )}
                        {email.openedAt && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Opened
                          </span>
                        )}
                        {email.status === 'Scheduled' && (
                          <span className="text-xs text-orange-600 flex items-center gap-1">
                            <Clock size={12} /> Scheduled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Email Detail Panel */}
        {selectedEmail && (
          <div className="w-[450px] bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden flex flex-col flex-shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                  <Reply size={18} />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                  <Forward size={18} />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                  <Archive size={18} />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                  <Trash2 size={18} />
                </button>
              </div>
              <button onClick={() => setSelectedEmail(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>

            {/* Email Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">{selectedEmail.subject}</h2>

              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                  SJ
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{selectedEmail.from}</p>
                      <p className="text-sm text-slate-500">To: {selectedEmail.to.join(', ')}</p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {selectedEmail.sentAt ? formatDate(selectedEmail.sentAt) : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
                <p>{selectedEmail.body}</p>
              </div>

              {selectedEmail.relatedTo && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Related To</p>
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-slate-400" />
                    <span className="text-sm text-brand-600">{selectedEmail.relatedTo.type}: {selectedEmail.relatedTo.name}</span>
                  </div>
                </div>
              )}

              {/* Tracking Info */}
              {(selectedEmail.trackOpens || selectedEmail.trackClicks) && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Tracking</p>
                  <div className="space-y-2">
                    {selectedEmail.openedAt && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 size={14} />
                        Opened on {formatDate(selectedEmail.openedAt)}
                      </div>
                    )}
                    {selectedEmail.clickedAt && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <CheckCircle2 size={14} />
                        Link clicked on {formatDate(selectedEmail.clickedAt)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Reply Section */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <textarea
                placeholder="Write a reply..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={3}
              />
              <div className="flex items-center justify-between mt-3">
                <button className="p-2 text-slate-400 hover:text-slate-600">
                  <Paperclip size={18} />
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                  <Send size={14} /> Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCompose(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">New Email</h2>
              <button onClick={() => setShowCompose(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="To"
                  className="w-full px-4 py-2 border-b border-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Subject"
                  className="w-full px-4 py-2 border-b border-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <textarea
                  placeholder="Write your message..."
                  className="w-full px-4 py-2 h-64 resize-none focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                  <Paperclip size={18} />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                  <Tag size={18} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">
                  Save Draft
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                  <Send size={14} /> Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
