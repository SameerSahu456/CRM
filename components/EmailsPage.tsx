import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, Edit2, Trash2, Send, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, CheckCircle, Mail, FileText, Eye, Copy,
  Inbox, Filter, LayoutTemplate, Tag
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { emailsApi, emailTemplatesApi } from '../services/api';
import { Email, EmailTemplate, PaginatedResponse } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

const EMAIL_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'scheduled', label: 'Scheduled' },
];

const TEMPLATE_CATEGORIES = [
  { value: 'Sales', label: 'Sales' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Support', label: 'Support' },
  { value: 'Follow-up', label: 'Follow-up' },
];

type ActiveTab = 'emails' | 'templates';

// ---------------------------------------------------------------------------
// Types local to this page
// ---------------------------------------------------------------------------

interface EmailFormData {
  toAddress: string;
  subject: string;
  body: string;
  cc: string;
  bcc: string;
  fromAddress: string;
  templateId: string;
}

interface TemplateFormData {
  name: string;
  subject: string;
  body: string;
  category: string;
}

const EMPTY_EMAIL_FORM: EmailFormData = {
  toAddress: '',
  subject: '',
  body: '',
  cc: '',
  bcc: '',
  fromAddress: '',
  templateId: '',
};

const EMPTY_TEMPLATE_FORM: TemplateFormData = {
  name: '',
  subject: '',
  body: '',
  category: 'Sales',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadge(status: string, isDark: boolean): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  switch (status) {
    case 'sent':
      return `${base} ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`;
    case 'draft':
      return `${base} ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'}`;
    case 'scheduled':
      return `${base} ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700'}`;
    default:
      return `${base} ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function truncateText(text: string, maxLen: number): string {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const EmailsPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  // Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('emails');

  // Email data
  const [emails, setEmails] = useState<Email[]>([]);
  const [emailPage, setEmailPage] = useState(1);
  const [emailTotalPages, setEmailTotalPages] = useState(1);
  const [emailTotalRecords, setEmailTotalRecords] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(true);

  // Template data
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isTemplateLoading, setIsTemplateLoading] = useState(true);

  // Compose email modal
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [emailFormData, setEmailFormData] = useState<EmailFormData>({ ...EMPTY_EMAIL_FORM });
  const [emailFormError, setEmailFormError] = useState('');
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);

  // Template modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateFormData, setTemplateFormData] = useState<TemplateFormData>({ ...EMPTY_TEMPLATE_FORM });
  const [templateFormError, setTemplateFormError] = useState('');
  const [isTemplateSubmitting, setIsTemplateSubmitting] = useState(false);

  // Template preview modal
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  // Delete confirm
  const [deleteEmailId, setDeleteEmailId] = useState<string | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  // Sending
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Styling helpers
  const cardClass = `premium-card ${isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-soft'}`;
  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm transition-all ${isDark ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'} focus:outline-none focus:ring-1 focus:ring-brand-500`;
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchEmails = useCallback(async () => {
    setIsEmailLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(emailPage),
        limit: String(PAGE_SIZE),
      };
      if (statusFilter) params.status = statusFilter;
      if (emailSearch) params.search = emailSearch;

      const response: PaginatedResponse<Email> = await emailsApi.list(params);
      setEmails(response.data);
      setEmailTotalPages(response.pagination.totalPages);
      setEmailTotalRecords(response.pagination.total);
    } catch {
      setEmails([]);
    } finally {
      setIsEmailLoading(false);
    }
  }, [emailPage, statusFilter, emailSearch]);

  const fetchTemplates = useCallback(async () => {
    setIsTemplateLoading(true);
    try {
      const data = await emailTemplatesApi.list();
      setTemplates(Array.isArray(data) ? data : []);
    } catch {
      setTemplates([]);
    } finally {
      setIsTemplateLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    setEmailPage(1);
  }, [statusFilter, emailSearch]);

  // ---------------------------------------------------------------------------
  // Email form handlers
  // ---------------------------------------------------------------------------

  const openComposeModal = () => {
    setEmailFormData({ ...EMPTY_EMAIL_FORM });
    setEditingEmailId(null);
    setEmailFormError('');
    setShowComposeModal(true);
  };

  const openEditEmail = (email: Email) => {
    setEmailFormData({
      toAddress: email.toAddress || '',
      subject: email.subject || '',
      body: email.body || '',
      cc: email.cc || '',
      bcc: email.bcc || '',
      fromAddress: email.fromAddress || '',
      templateId: email.templateId || '',
    });
    setEditingEmailId(email.id);
    setEmailFormError('');
    setShowComposeModal(true);
  };

  const closeComposeModal = () => {
    setShowComposeModal(false);
    setEditingEmailId(null);
    setEmailFormError('');
  };

  const handleEmailFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEmailFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTemplateSelect = (templateId: string) => {
    setEmailFormData(prev => ({ ...prev, templateId }));
    if (templateId) {
      const tpl = templates.find(t => t.id === templateId);
      if (tpl) {
        setEmailFormData(prev => ({
          ...prev,
          subject: tpl.subject || prev.subject,
          body: tpl.body || prev.body,
          templateId,
        }));
      }
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailFormError('');

    if (!emailFormData.toAddress.trim()) {
      setEmailFormError('Recipient (To) is required');
      return;
    }
    if (!emailFormData.subject.trim()) {
      setEmailFormError('Subject is required');
      return;
    }

    setIsEmailSubmitting(true);
    try {
      const payload: any = {
        toAddress: emailFormData.toAddress.trim(),
        subject: emailFormData.subject.trim(),
        body: emailFormData.body || null,
        cc: emailFormData.cc || null,
        bcc: emailFormData.bcc || null,
        fromAddress: emailFormData.fromAddress || null,
        templateId: emailFormData.templateId || null,
        status: 'draft',
        ownerId: user?.id,
      };

      if (editingEmailId) {
        await emailsApi.update(editingEmailId, payload);
      } else {
        await emailsApi.create(payload);
      }

      closeComposeModal();
      fetchEmails();
    } catch (err: any) {
      setEmailFormError(err.message || 'Failed to save email');
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const handleSendEmail = async (id: string) => {
    setSendingId(id);
    try {
      await emailsApi.send(id);
      fetchEmails();
    } catch {
      // Silently fail
    } finally {
      setSendingId(null);
    }
  };

  const handleDeleteEmail = async (id: string) => {
    try {
      await emailsApi.delete(id);
      setDeleteEmailId(null);
      fetchEmails();
    } catch {
      // Silently fail
    }
  };

  // ---------------------------------------------------------------------------
  // Template form handlers
  // ---------------------------------------------------------------------------

  const openCreateTemplate = () => {
    setTemplateFormData({ ...EMPTY_TEMPLATE_FORM });
    setEditingTemplateId(null);
    setTemplateFormError('');
    setShowTemplateModal(true);
  };

  const openEditTemplate = (tpl: EmailTemplate) => {
    setTemplateFormData({
      name: tpl.name || '',
      subject: tpl.subject || '',
      body: tpl.body || '',
      category: tpl.category || 'Sales',
    });
    setEditingTemplateId(tpl.id);
    setTemplateFormError('');
    setShowTemplateModal(true);
  };

  const closeTemplateModal = () => {
    setShowTemplateModal(false);
    setEditingTemplateId(null);
    setTemplateFormError('');
  };

  const handleTemplateFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTemplateFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTemplateFormError('');

    if (!templateFormData.name.trim()) {
      setTemplateFormError('Template name is required');
      return;
    }

    setIsTemplateSubmitting(true);
    try {
      const payload: any = {
        name: templateFormData.name.trim(),
        subject: templateFormData.subject || null,
        body: templateFormData.body || null,
        category: templateFormData.category || null,
        ownerId: user?.id,
      };

      if (editingTemplateId) {
        await emailTemplatesApi.update(editingTemplateId, payload);
      } else {
        await emailTemplatesApi.create(payload);
      }

      closeTemplateModal();
      fetchTemplates();
    } catch (err: any) {
      setTemplateFormError(err.message || 'Failed to save template');
    } finally {
      setIsTemplateSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await emailTemplatesApi.delete(id);
      setDeleteTemplateId(null);
      fetchTemplates();
    } catch {
      // Silently fail
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Emails
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Manage email communications and templates
          </p>
        </div>
        <button
          onClick={activeTab === 'emails' ? openComposeModal : openCreateTemplate}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'emails' ? 'Compose Email' : 'New Template'}
        </button>
      </div>

      {/* Tab switcher */}
      <div className={`${cardClass} p-1 inline-flex rounded-xl`}>
        <button
          onClick={() => setActiveTab('emails')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'emails'
              ? 'bg-brand-600 text-white shadow-sm'
              : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Emails
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'templates'
              ? 'bg-brand-600 text-white shadow-sm'
              : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          Templates
        </button>
      </div>

      {/* ====== EMAILS TAB ====== */}
      {activeTab === 'emails' && (
        <>
          {/* Filters */}
          <div className={`${cardClass} p-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Search by subject or recipient..."
                  value={emailSearch}
                  onChange={e => setEmailSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
                    isDark
                      ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
                  } focus:outline-none focus:ring-1 focus:ring-brand-500`}
                />
              </div>
              <div className="w-full sm:w-44">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className={selectClass}
                >
                  {EMAIL_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Emails table */}
          <div className={`${cardClass} overflow-hidden`}>
            {isEmailLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Loading emails...</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                  <Mail className={`w-7 h-7 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
                </div>
                <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  No emails found
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                  Click "Compose Email" to create one
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                        {['Subject', 'To', 'Status', 'Sent At', 'Actions'].map(h => (
                          <th
                            key={h}
                            className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                              isDark ? 'text-zinc-500' : 'text-slate-400'
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {emails.map(email => (
                        <tr
                          key={email.id}
                          onClick={() => openEditEmail(email)}
                          className={`border-b transition-colors cursor-pointer ${
                            isDark ? 'border-zinc-800/50 hover:bg-gray-800/50' : 'border-slate-50 hover:bg-gray-50'
                          }`}
                        >
                          <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            <span className="font-medium">{truncateText(email.subject, 50)}</span>
                          </td>
                          <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                            {email.toAddress || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={statusBadge(email.status, isDark)}>
                              {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
                            </span>
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                            {email.sentAt ? formatDate(email.sentAt) : email.scheduledAt ? formatDate(email.scheduledAt) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {/* Send button for drafts */}
                              {email.status === 'draft' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleSendEmail(email.id); }}
                                  disabled={sendingId === email.id}
                                  title="Send"
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isDark
                                      ? 'text-emerald-400 hover:bg-emerald-900/20'
                                      : 'text-emerald-600 hover:bg-emerald-50'
                                  } disabled:opacity-50`}
                                >
                                  {sendingId === email.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); openEditEmail(email); }}
                                title="Edit"
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDark
                                    ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20'
                                    : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                                }`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {deleteEmailId === email.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteEmail(email.id); }}
                                    className="px-2 py-1 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteEmailId(null); }}
                                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                      isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100'
                                    }`}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteEmailId(email.id); }}
                                  title="Delete"
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isDark
                                      ? 'text-zinc-400 hover:text-red-400 hover:bg-red-900/20'
                                      : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                  }`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t ${
                  isDark ? 'border-zinc-800' : 'border-slate-100'
                }`}>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Showing {(emailPage - 1) * PAGE_SIZE + 1}
                    {' '}&ndash;{' '}
                    {Math.min(emailPage * PAGE_SIZE, emailTotalRecords)} of {emailTotalRecords} emails
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEmailPage(p => Math.max(1, p - 1))}
                      disabled={emailPage <= 1}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: emailTotalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === emailTotalPages || Math.abs(p - emailPage) <= 1)
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
                          <span key={`e-${idx}`} className={`px-1 text-xs ${isDark ? 'text-zinc-600' : 'text-slate-300'}`}>...</span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => setEmailPage(item as number)}
                            className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors ${
                              emailPage === item
                                ? 'bg-brand-600 text-white'
                                : isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}
                    <button
                      onClick={() => setEmailPage(p => Math.min(emailTotalPages, p + 1))}
                      disabled={emailPage >= emailTotalPages}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ====== TEMPLATES TAB ====== */}
      {activeTab === 'templates' && (
        <div className={`${cardClass} overflow-hidden`}>
          {isTemplateLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
              <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                <LayoutTemplate className={`w-7 h-7 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
              </div>
              <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                No templates yet
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                Click "New Template" to create one
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                    {['Name', 'Subject', 'Category', 'Actions'].map(h => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                          isDark ? 'text-zinc-500' : 'text-slate-400'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {templates.map(tpl => (
                    <tr
                      key={tpl.id}
                      className={`border-b transition-colors cursor-pointer ${
                        isDark ? 'border-zinc-800/50 hover:bg-zinc-800/30' : 'border-slate-50 hover:bg-slate-50/80'
                      }`}
                      onClick={() => setPreviewTemplate(tpl)}
                    >
                      <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <span className="font-medium">{tpl.name}</span>
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {truncateText(tpl.subject || '', 50) || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {tpl.category ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isDark ? 'bg-brand-900/20 text-brand-400' : 'bg-brand-50 text-brand-700'
                          }`}>
                            <Tag className="w-3 h-3" />
                            {tpl.category}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setPreviewTemplate(tpl)}
                            title="Preview"
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? 'text-zinc-400 hover:text-blue-400 hover:bg-blue-900/20' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditTemplate(tpl)}
                            title="Edit"
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                            }`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {deleteTemplateId === tpl.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteTemplate(tpl.id)}
                                className="px-2 py-1 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteTemplateId(null)}
                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteTemplateId(tpl.id)}
                              title="Delete"
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDark ? 'text-zinc-400 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ====== COMPOSE EMAIL MODAL ====== */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeComposeModal} />
          <div className={`relative w-full max-w-xl max-h-[75vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
            isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
          }`}>
            <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {editingEmailId ? 'Edit Email' : 'Compose Email'}
              </h2>
              <button
                onClick={closeComposeModal}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEmailSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-5 pb-6">
              {emailFormError && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                  isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {emailFormError}
                </div>
              )}

              {/* Template selector */}
              <div>
                <label htmlFor="templateId" className={labelClass}>Use Template</label>
                <select
                  id="templateId"
                  name="templateId"
                  value={emailFormData.templateId}
                  onChange={e => handleTemplateSelect(e.target.value)}
                  className={selectClass}
                >
                  <option value="">-- No template --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} {t.category ? `(${t.category})` : ''}</option>
                  ))}
                </select>
              </div>

              {/* To */}
              <div>
                <label htmlFor="toAddress" className={labelClass}>
                  To <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="toAddress"
                    name="toAddress"
                    type="email"
                    placeholder="recipient@example.com"
                    value={emailFormData.toAddress}
                    onChange={handleEmailFormChange}
                    className={`${inputClass} pl-10`}
                    required
                  />
                </div>
              </div>

              {/* CC + BCC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cc" className={labelClass}>CC</label>
                  <input
                    id="cc"
                    name="cc"
                    type="text"
                    placeholder="cc@example.com"
                    value={emailFormData.cc}
                    onChange={handleEmailFormChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="bcc" className={labelClass}>BCC</label>
                  <input
                    id="bcc"
                    name="bcc"
                    type="text"
                    placeholder="bcc@example.com"
                    value={emailFormData.bcc}
                    onChange={handleEmailFormChange}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* From address */}
              <div>
                <label htmlFor="fromAddress" className={labelClass}>From Address</label>
                <input
                  id="fromAddress"
                  name="fromAddress"
                  type="email"
                  placeholder="your@company.com"
                  value={emailFormData.fromAddress}
                  onChange={handleEmailFormChange}
                  className={inputClass}
                />
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className={labelClass}>
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="Email subject"
                  value={emailFormData.subject}
                  onChange={handleEmailFormChange}
                  className={inputClass}
                  required
                />
              </div>

              {/* Body */}
              <div>
                <label htmlFor="body" className={labelClass}>Body</label>
                <textarea
                  id="body"
                  name="body"
                  rows={8}
                  placeholder="Write your email..."
                  value={emailFormData.body}
                  onChange={handleEmailFormChange}
                  className={`${inputClass} resize-none`}
                />
              </div>

              </div>
              {/* Footer - sticky at bottom */}
              <div className={`sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t ${
                isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={closeComposeModal}
                  disabled={isEmailSubmitting}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  } disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEmailSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium disabled:opacity-50"
                >
                  {isEmailSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {editingEmailId ? 'Update Draft' : 'Save Draft'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== TEMPLATE CREATE/EDIT MODAL ====== */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeTemplateModal} />
          <div className={`relative w-full max-w-xl max-h-[75vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
            isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
          }`}>
            <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {editingTemplateId ? 'Edit Template' : 'New Template'}
              </h2>
              <button
                onClick={closeTemplateModal}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTemplateSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-5 pb-6">
              {templateFormError && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                  isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {templateFormError}
                </div>
              )}

              {/* Name */}
              <div>
                <label htmlFor="tplName" className={labelClass}>
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="tplName"
                  name="name"
                  type="text"
                  placeholder="e.g. Welcome Email"
                  value={templateFormData.name}
                  onChange={handleTemplateFormChange}
                  className={inputClass}
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="tplCategory" className={labelClass}>Category</label>
                <select
                  id="tplCategory"
                  name="category"
                  value={templateFormData.category}
                  onChange={handleTemplateFormChange}
                  className={selectClass}
                >
                  {TEMPLATE_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="tplSubject" className={labelClass}>Subject</label>
                <input
                  id="tplSubject"
                  name="subject"
                  type="text"
                  placeholder="Email subject line"
                  value={templateFormData.subject}
                  onChange={handleTemplateFormChange}
                  className={inputClass}
                />
              </div>

              {/* Body */}
              <div>
                <label htmlFor="tplBody" className={labelClass}>Body</label>
                <textarea
                  id="tplBody"
                  name="body"
                  rows={10}
                  placeholder="Template body content..."
                  value={templateFormData.body}
                  onChange={handleTemplateFormChange}
                  className={`${inputClass} resize-none`}
                />
              </div>

              </div>
              {/* Footer - sticky at bottom */}
              <div className={`sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t ${
                isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={closeTemplateModal}
                  disabled={isTemplateSubmitting}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  } disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTemplateSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium disabled:opacity-50"
                >
                  {isTemplateSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {editingTemplateId ? 'Update Template' : 'Create Template'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== TEMPLATE PREVIEW MODAL ====== */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={() => setPreviewTemplate(null)} />
          <div className={`relative w-full max-w-lg max-h-[75vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
            isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
          }`}>
            <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <div>
                <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {previewTemplate.name}
                </h2>
                {previewTemplate.category && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    isDark ? 'bg-brand-900/20 text-brand-400' : 'bg-brand-50 text-brand-700'
                  }`}>
                    <Tag className="w-3 h-3" />
                    {previewTemplate.category}
                  </span>
                )}
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-6">
              {previewTemplate.subject && (
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Subject
                  </p>
                  <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {previewTemplate.subject}
                  </p>
                </div>
              )}

              {previewTemplate.body && (
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Body
                  </p>
                  <div className={`p-4 rounded-xl text-sm whitespace-pre-wrap ${
                    isDark ? 'bg-zinc-900/50 text-zinc-300 border border-zinc-800' : 'bg-slate-50 text-slate-700 border border-slate-100'
                  }`}>
                    {previewTemplate.body}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  onClick={() => {
                    setPreviewTemplate(null);
                    openEditTemplate(previewTemplate);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isDark ? 'text-zinc-300 hover:bg-zinc-800 border border-zinc-700' : 'text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setPreviewTemplate(null);
                    openComposeModal();
                    // Prefill from template after short delay
                    setTimeout(() => {
                      handleTemplateSelect(previewTemplate.id);
                    }, 0);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium"
                >
                  <Copy className="w-4 h-4" />
                  Use Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
