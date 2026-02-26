import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, Send,
  Loader2, AlertCircle, CheckCircle, Mail, Eye, Copy,
  Inbox, LayoutTemplate, Tag
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDropdowns } from '@/contexts/DropdownsContext';
import { emailsApi, emailTemplatesApi } from '@/services/api';
import { Email, EmailTemplate, PaginatedResponse } from '@/types';
import { Card, Button, Input, Select, Modal, Badge, Alert, Textarea, Tabs, DataTable } from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import type { Tab } from '@/components/ui';
import { cx } from '@/utils/cx';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

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

function statusVariant(status: string): 'success' | 'blue' | 'amber' | 'gray' {
  switch (status) {
    case 'sent':
      return 'success';
    case 'draft':
      return 'blue';
    case 'scheduled':
      return 'amber';
    default:
      return 'gray';
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
// Tab definitions
// ---------------------------------------------------------------------------

const TAB_ITEMS: Tab[] = [
  { id: 'emails', label: 'Emails', icon: <Inbox className="w-4 h-4" /> },
  { id: 'templates', label: 'Templates', icon: <LayoutTemplate className="w-4 h-4" /> },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const EmailsPage: React.FC = () => {
  const { user } = useAuth();
  const { getOptions } = useDropdowns();

  // Dropdown data from DB
  const EMAIL_STATUSES = [{ value: '', label: 'All Statuses' }, ...getOptions('email-statuses')];
  const TEMPLATE_CATEGORIES = getOptions('template-categories');

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
  // Column definitions
  // ---------------------------------------------------------------------------

  const emailColumns: DataTableColumn<Email>[] = [
    {
      key: 'subject',
      label: 'Subject',
      width: '30%',
      render: (email) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {truncateText(email.subject, 50)}
        </span>
      ),
    },
    {
      key: 'toAddress',
      label: 'To',
      width: '25%',
      render: (email) => (
        <span className="text-gray-700 dark:text-zinc-300">
          {email.toAddress || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '13%',
      render: (email) => (
        <Badge variant={statusVariant(email.status)}>
          {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'sentAt',
      label: 'Sent At',
      width: '18%',
      render: (email) => (
        <span className="whitespace-nowrap text-gray-700 dark:text-zinc-300">
          {email.sentAt ? formatDate(email.sentAt) : email.scheduledAt ? formatDate(email.scheduledAt) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '14%',
      render: (email) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {email.status === 'draft' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleSendEmail(email.id); }}
              disabled={sendingId === email.id}
              title="Send"
              className={cx(
                'p-1.5 rounded-lg transition-colors disabled:opacity-50',
                'text-success-600 hover:bg-success-50',
                'dark:text-emerald-400 dark:hover:bg-emerald-900/20'
              )}
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
            className={cx(
              'p-1.5 rounded-lg transition-colors',
              'text-gray-400 hover:text-brand-600 hover:bg-brand-50',
              'dark:text-zinc-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20'
            )}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {deleteEmailId === email.id ? (
            <div className="flex items-center gap-1">
              <Button
                size="xs"
                variant="danger"
                onClick={(e) => { e.stopPropagation(); handleDeleteEmail(email.id); }}
              >
                Confirm
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); setDeleteEmailId(null); }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteEmailId(email.id); }}
              title="Delete"
              className={cx(
                'p-1.5 rounded-lg transition-colors',
                'text-gray-400 hover:text-red-600 hover:bg-red-50',
                'dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-red-900/20'
              )}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const templateColumns: DataTableColumn<EmailTemplate>[] = [
    {
      key: 'name',
      label: 'Name',
      width: '28%',
      render: (tpl) => (
        <span className="font-medium text-gray-900 dark:text-white">{tpl.name}</span>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      width: '37%',
      render: (tpl) => (
        <span className="text-gray-700 dark:text-zinc-300">
          {truncateText(tpl.subject || '', 50) || '-'}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      width: '20%',
      render: (tpl) => (
        tpl.category ? (
          <Badge variant="brand">
            <Tag className="w-3 h-3" />
            {tpl.category}
          </Badge>
        ) : <span>-</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '15%',
      render: (tpl) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setPreviewTemplate(tpl)}
            title="Preview"
            className={cx(
              'p-1.5 rounded-lg transition-colors',
              'text-gray-400 hover:text-blue-600 hover:bg-blue-50',
              'dark:text-zinc-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20'
            )}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEditTemplate(tpl)}
            title="Edit"
            className={cx(
              'p-1.5 rounded-lg transition-colors',
              'text-gray-400 hover:text-brand-600 hover:bg-brand-50',
              'dark:text-zinc-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20'
            )}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {deleteTemplateId === tpl.id ? (
            <div className="flex items-center gap-1">
              <Button
                size="xs"
                variant="danger"
                onClick={() => handleDeleteTemplate(tpl.id)}
              >
                Confirm
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setDeleteTemplateId(null)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteTemplateId(tpl.id)}
              title="Delete"
              className={cx(
                'p-1.5 rounded-lg transition-colors',
                'text-gray-400 hover:text-red-600 hover:bg-red-50',
                'dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-red-900/20'
              )}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white">
            Emails
          </h1>
          <p className="text-sm mt-1 text-gray-500 dark:text-zinc-400">
            Manage email communications and templates
          </p>
        </div>
        <Button
          onClick={activeTab === 'emails' ? openComposeModal : openCreateTemplate}
          icon={<Plus className="w-4 h-4" />}
          shine
        >
          {activeTab === 'emails' ? 'Compose Email' : 'New Template'}
        </Button>
      </div>

      {/* Tab switcher */}
      <Tabs
        tabs={TAB_ITEMS}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as ActiveTab)}
        variant="pills"
        className="inline-flex"
      />

      {/* ====== EMAILS TAB ====== */}
      {activeTab === 'emails' && (
        <>
          {/* Filters */}
          <Card padding="none" className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <Input
                  type="text"
                  placeholder="Search by subject or recipient..."
                  value={emailSearch}
                  onChange={e => setEmailSearch(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
              <div className="w-full sm:w-44">
                <Select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  options={EMAIL_STATUSES}
                />
              </div>
            </div>
          </Card>

          {/* Emails table */}
          <Card padding="none">
            <DataTable<Email>
              columns={emailColumns}
              data={emails}
              isLoading={isEmailLoading}
              loadingMessage="Loading emails..."
              emptyIcon={<Mail className="w-7 h-7 text-gray-300 dark:text-zinc-600" />}
              emptyMessage='No emails found. Click "Compose Email" to create one.'
              onRowClick={(email) => openEditEmail(email)}
              rowKey={(email) => email.id}
              pagination={{
                currentPage: emailPage,
                totalPages: emailTotalPages,
                totalItems: emailTotalRecords,
                pageSize: PAGE_SIZE,
                onPageChange: setEmailPage,
              }}
            />
          </Card>
        </>
      )}

      {/* ====== TEMPLATES TAB ====== */}
      {activeTab === 'templates' && (
        <Card padding="none">
          <DataTable<EmailTemplate>
            columns={templateColumns}
            data={templates}
            isLoading={isTemplateLoading}
            loadingMessage="Loading templates..."
            emptyIcon={<LayoutTemplate className="w-7 h-7 text-gray-300 dark:text-zinc-600" />}
            emptyMessage='No templates yet. Click "New Template" to create one.'
            onRowClick={(tpl) => setPreviewTemplate(tpl)}
            rowKey={(tpl) => tpl.id}
          />
        </Card>
      )}

      {/* ====== COMPOSE EMAIL MODAL ====== */}
      <Modal
        open={showComposeModal}
        onClose={closeComposeModal}
        title={editingEmailId ? 'Edit Email' : 'Compose Email'}
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={closeComposeModal}
              disabled={isEmailSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="compose-email-form"
              loading={isEmailSubmitting}
              icon={!isEmailSubmitting ? <CheckCircle className="w-4 h-4" /> : undefined}
              shine
            >
              {isEmailSubmitting ? 'Saving...' : editingEmailId ? 'Update Draft' : 'Save Draft'}
            </Button>
          </>
        }
      >
        <form id="compose-email-form" onSubmit={handleEmailSubmit} className="space-y-5">
          {emailFormError && (
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {emailFormError}
            </Alert>
          )}

          {/* Template selector */}
          <Select
            label="Use Template"
            id="templateId"
            name="templateId"
            value={emailFormData.templateId}
            onChange={e => handleTemplateSelect(e.target.value)}
          >
            <option value="">-- No template --</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name} {t.category ? `(${t.category})` : ''}</option>
            ))}
          </Select>

          {/* To */}
          <Input
            label="To *"
            id="toAddress"
            name="toAddress"
            type="email"
            placeholder="recipient@example.com"
            value={emailFormData.toAddress}
            onChange={handleEmailFormChange}
            icon={<Mail className="w-4 h-4" />}
            required
          />

          {/* CC + BCC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="CC"
              id="cc"
              name="cc"
              type="text"
              placeholder="cc@example.com"
              value={emailFormData.cc}
              onChange={handleEmailFormChange}
            />
            <Input
              label="BCC"
              id="bcc"
              name="bcc"
              type="text"
              placeholder="bcc@example.com"
              value={emailFormData.bcc}
              onChange={handleEmailFormChange}
            />
          </div>

          {/* From address */}
          <Input
            label="From Address"
            id="fromAddress"
            name="fromAddress"
            type="email"
            placeholder="your@company.com"
            value={emailFormData.fromAddress}
            onChange={handleEmailFormChange}
          />

          {/* Subject */}
          <Input
            label="Subject *"
            id="subject"
            name="subject"
            type="text"
            placeholder="Email subject"
            value={emailFormData.subject}
            onChange={handleEmailFormChange}
            required
          />

          {/* Body */}
          <Textarea
            label="Body"
            id="body"
            name="body"
            rows={8}
            placeholder="Write your email..."
            value={emailFormData.body}
            onChange={handleEmailFormChange}
            className="resize-none"
          />
        </form>
      </Modal>

      {/* ====== TEMPLATE CREATE/EDIT MODAL ====== */}
      <Modal
        open={showTemplateModal}
        onClose={closeTemplateModal}
        title={editingTemplateId ? 'Edit Template' : 'New Template'}
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={closeTemplateModal}
              disabled={isTemplateSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="template-form"
              loading={isTemplateSubmitting}
              icon={!isTemplateSubmitting ? <CheckCircle className="w-4 h-4" /> : undefined}
              shine
            >
              {isTemplateSubmitting ? 'Saving...' : editingTemplateId ? 'Update Template' : 'Create Template'}
            </Button>
          </>
        }
      >
        <form id="template-form" onSubmit={handleTemplateSubmit} className="space-y-5">
          {templateFormError && (
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {templateFormError}
            </Alert>
          )}

          {/* Name */}
          <Input
            label="Template Name *"
            id="tplName"
            name="name"
            type="text"
            placeholder="e.g. Welcome Email"
            value={templateFormData.name}
            onChange={handleTemplateFormChange}
            required
          />

          {/* Category */}
          <Select
            label="Category"
            id="tplCategory"
            name="category"
            value={templateFormData.category}
            onChange={handleTemplateFormChange}
            options={TEMPLATE_CATEGORIES}
          />

          {/* Subject */}
          <Input
            label="Subject"
            id="tplSubject"
            name="subject"
            type="text"
            placeholder="Email subject line"
            value={templateFormData.subject}
            onChange={handleTemplateFormChange}
          />

          {/* Body */}
          <Textarea
            label="Body"
            id="tplBody"
            name="body"
            rows={10}
            placeholder="Template body content..."
            value={templateFormData.body}
            onChange={handleTemplateFormChange}
            className="resize-none"
          />
        </form>
      </Modal>

      {/* ====== TEMPLATE PREVIEW MODAL ====== */}
      <Modal
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={previewTemplate?.name || ''}
        subtitle={previewTemplate?.category ? undefined : undefined}
        size="md"
      >
        {previewTemplate && (
          <div className="space-y-4">
            {previewTemplate.category && (
              <Badge variant="brand">
                <Tag className="w-3 h-3" />
                {previewTemplate.category}
              </Badge>
            )}

            {previewTemplate.subject && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-gray-400 dark:text-zinc-500">
                  Subject
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {previewTemplate.subject}
                </p>
              </div>
            )}

            {previewTemplate.body && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-gray-400 dark:text-zinc-500">
                  Body
                </p>
                <div className="p-4 rounded-xl text-sm whitespace-pre-wrap bg-gray-50 text-gray-700 border border-gray-100 dark:bg-zinc-900/50 dark:text-zinc-300 dark:border-zinc-800">
                  {previewTemplate.body}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button
                variant="secondary"
                icon={<Edit2 className="w-4 h-4" />}
                onClick={() => {
                  setPreviewTemplate(null);
                  openEditTemplate(previewTemplate);
                }}
              >
                Edit
              </Button>
              <Button
                icon={<Copy className="w-4 h-4" />}
                shine
                onClick={() => {
                  setPreviewTemplate(null);
                  openComposeModal();
                  // Prefill from template after short delay
                  setTimeout(() => {
                    handleTemplateSelect(previewTemplate.id);
                  }, 0);
                }}
              >
                Use Template
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
