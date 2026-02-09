import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, ChevronLeft, ChevronRight, Edit2, Trash2,
  IndianRupee, Loader2, AlertCircle, CheckCircle, Calendar,
  Phone, Mail, MessageSquare, Users, Target, TrendingUp,
  ArrowRightCircle, Eye, BarChart3, LayoutGrid, List,
  Clock, StickyNote, Video, FileText, Zap, XCircle,
  ChevronDown, Award, Building2, User as UserIcon, Tags
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { leadsApi, partnersApi, productsApi, adminApi, formatINR } from '../services/api';
import { Lead, LeadStage, LeadActivity, PaginatedResponse, Partner, Product, User } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

const LEAD_STAGES: LeadStage[] = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
const PIPELINE_STAGES: LeadStage[] = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation'];
const TERMINAL_STAGES: LeadStage[] = ['Won', 'Lost'];

const PRIORITIES = ['Low', 'Medium', 'High'] as const;

const SOURCES = [
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'cold-call', label: 'Cold Call' },
  { value: 'event', label: 'Event' },
  { value: 'partner', label: 'Partner' },
  { value: 'other', label: 'Other' },
];

const ACTIVITY_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Note' },
];

const STAGE_COLORS: Record<LeadStage, { bg: string; text: string; darkBg: string; darkText: string; iconBg: string; darkIconBg: string }> = {
  New:         { bg: 'bg-blue-50', text: 'text-blue-700', darkBg: 'bg-blue-900/30', darkText: 'text-blue-400', iconBg: 'bg-blue-100', darkIconBg: 'bg-blue-900/20' },
  Contacted:   { bg: 'bg-cyan-50', text: 'text-cyan-700', darkBg: 'bg-cyan-900/30', darkText: 'text-cyan-400', iconBg: 'bg-cyan-100', darkIconBg: 'bg-cyan-900/20' },
  Qualified:   { bg: 'bg-amber-50', text: 'text-amber-700', darkBg: 'bg-amber-900/30', darkText: 'text-amber-400', iconBg: 'bg-amber-100', darkIconBg: 'bg-amber-900/20' },
  Proposal:    { bg: 'bg-purple-50', text: 'text-purple-700', darkBg: 'bg-purple-900/30', darkText: 'text-purple-400', iconBg: 'bg-purple-100', darkIconBg: 'bg-purple-900/20' },
  Negotiation: { bg: 'bg-orange-50', text: 'text-orange-700', darkBg: 'bg-orange-900/30', darkText: 'text-orange-400', iconBg: 'bg-orange-100', darkIconBg: 'bg-orange-900/20' },
  Won:         { bg: 'bg-emerald-50', text: 'text-emerald-700', darkBg: 'bg-emerald-900/30', darkText: 'text-emerald-400', iconBg: 'bg-emerald-100', darkIconBg: 'bg-emerald-900/20' },
  Lost:        { bg: 'bg-red-50', text: 'text-red-700', darkBg: 'bg-red-900/30', darkText: 'text-red-400', iconBg: 'bg-red-100', darkIconBg: 'bg-red-900/20' },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  High:   { bg: 'bg-red-50', text: 'text-red-700', darkBg: 'bg-red-900/30', darkText: 'text-red-400' },
  Medium: { bg: 'bg-amber-50', text: 'text-amber-700', darkBg: 'bg-amber-900/30', darkText: 'text-amber-400' },
  Low:    { bg: 'bg-green-50', text: 'text-green-700', darkBg: 'bg-green-900/30', darkText: 'text-green-400' },
};

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

interface LeadFormData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  source: string;
  stage: LeadStage;
  priority: 'Low' | 'Medium' | 'High';
  estimatedValue: number;
  productInterest: string;
  expectedCloseDate: string;
  nextFollowUp: string;
  notes: string;
  assignedTo: string;
  partnerId: string;
}

interface ConvertFormData {
  partnerId: string;
  productId: string;
  amount: number;
  saleDate: string;
  customerName: string;
}

interface ActivityFormData {
  activityType: string;
  title: string;
  description: string;
}

const EMPTY_LEAD_FORM: LeadFormData = {
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  source: '',
  stage: 'New',
  priority: 'Medium',
  estimatedValue: 0,
  productInterest: '',
  expectedCloseDate: '',
  nextFollowUp: '',
  notes: '',
  assignedTo: '',
  partnerId: '',
};

const EMPTY_CONVERT_FORM: ConvertFormData = {
  partnerId: '',
  productId: '',
  amount: 0,
  saleDate: new Date().toISOString().split('T')[0],
  customerName: '',
};

const EMPTY_ACTIVITY_FORM: ActivityFormData = {
  activityType: 'call',
  title: '',
  description: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string): string {
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

function relativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(dateStr);
  } catch {
    return '';
  }
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'call': return Phone;
    case 'email': return Mail;
    case 'meeting': return Video;
    case 'note': return StickyNote;
    case 'stage_change': return ArrowRightCircle;
    case 'converted': return Award;
    default: return FileText;
  }
}

function stageBadge(stage: LeadStage, isDark: boolean): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const c = STAGE_COLORS[stage];
  return `${base} ${isDark ? `${c.darkBg} ${c.darkText}` : `${c.bg} ${c.text}`}`;
}

function priorityBadge(priority: string, isDark: boolean): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const c = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Low;
  return `${base} ${isDark ? `${c.darkBg} ${c.darkText}` : `${c.bg} ${c.text}`}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CRMPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  // Data state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stageStats, setStageStats] = useState<Record<string, number>>({});
  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('table');

  // Pagination (table view)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterSource, setFilterSource] = useState('');

  // Pipeline data (all leads grouped by stage)
  const [pipelineLeads, setPipelineLeads] = useState<Record<string, Lead[]>>({});
  const [isPipelineLoading, setIsPipelineLoading] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableError, setTableError] = useState('');

  // Lead form modal
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [leadFormData, setLeadFormData] = useState<LeadFormData>({ ...EMPTY_LEAD_FORM });
  const [leadFormError, setLeadFormError] = useState('');

  // Lead detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);
  const [activityForm, setActivityForm] = useState<ActivityFormData>({ ...EMPTY_ACTIVITY_FORM });
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [activityError, setActivityError] = useState('');
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  // Convert modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertLeadId, setConvertLeadId] = useState<string | null>(null);
  const [convertForm, setConvertForm] = useState<ConvertFormData>({ ...EMPTY_CONVERT_FORM });
  const [convertError, setConvertError] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Styling helpers
  // ---------------------------------------------------------------------------

  const cardClass = `premium-card ${isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-soft'}`;
  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm transition-all ${
    isDark
      ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
  } focus:outline-none focus:ring-1 focus:ring-brand-500`;
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setTableError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (filterStage) params.stage = filterStage;
      if (filterPriority) params.priority = filterPriority;
      if (filterSource) params.source = filterSource;
      if (searchTerm) params.search = searchTerm;

      const response: PaginatedResponse<Lead> = await leadsApi.list(params);
      setLeads(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);
    } catch (err: any) {
      setTableError(err.message || 'Failed to load leads');
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterStage, filterPriority, filterSource, searchTerm]);

  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const data = await leadsApi.stats();
      setStageStats(data);
    } catch {
      setStageStats({});
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  const fetchPipelineLeads = useCallback(async () => {
    setIsPipelineLoading(true);
    try {
      const response: PaginatedResponse<Lead> = await leadsApi.list({ limit: '500' });
      const grouped: Record<string, Lead[]> = {};
      LEAD_STAGES.forEach(s => { grouped[s] = []; });
      response.data.forEach(lead => {
        if (grouped[lead.stage]) {
          grouped[lead.stage].push(lead);
        }
      });
      setPipelineLeads(grouped);
    } catch {
      setPipelineLeads({});
    } finally {
      setIsPipelineLoading(false);
    }
  }, []);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [productsList, partnersResponse, usersList] = await Promise.all([
        productsApi.list(),
        partnersApi.list({ limit: '500', status: 'approved' }),
        adminApi.listUsers(),
      ]);
      setProducts(Array.isArray(productsList) ? productsList : []);
      const partnerData = partnersResponse?.data ?? partnersResponse;
      setPartners(Array.isArray(partnerData) ? partnerData : []);
      setUsers(Array.isArray(usersList) ? usersList : []);
    } catch {
      // Dropdown data failure is non-critical
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDropdownData();
    fetchStats();
  }, [fetchDropdownData, fetchStats]);

  // Fetch based on view mode
  useEffect(() => {
    if (viewMode === 'table') {
      fetchLeads();
    } else {
      fetchPipelineLeads();
    }
  }, [viewMode, fetchLeads, fetchPipelineLeads]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterStage, filterPriority, filterSource, searchTerm]);

  // ---------------------------------------------------------------------------
  // Lead form handlers
  // ---------------------------------------------------------------------------

  const openCreateLeadModal = () => {
    setLeadFormData({ ...EMPTY_LEAD_FORM });
    setEditingLeadId(null);
    setLeadFormError('');
    setShowLeadModal(true);
  };

  const openEditLeadModal = (lead: Lead) => {
    setLeadFormData({
      companyName: lead.companyName || '',
      contactPerson: lead.contactPerson || '',
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source || '',
      stage: lead.stage,
      priority: lead.priority,
      estimatedValue: lead.estimatedValue || 0,
      productInterest: lead.productInterest || '',
      expectedCloseDate: lead.expectedCloseDate ? lead.expectedCloseDate.split('T')[0] : '',
      nextFollowUp: lead.nextFollowUp ? lead.nextFollowUp.split('T')[0] : '',
      notes: lead.notes || '',
      assignedTo: lead.assignedTo || '',
      partnerId: lead.partnerId || '',
    });
    setEditingLeadId(lead.id);
    setLeadFormError('');
    setShowLeadModal(true);
  };

  const closeLeadModal = () => {
    setShowLeadModal(false);
    setEditingLeadId(null);
    setLeadFormError('');
  };

  const handleLeadFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setLeadFormData(prev => ({
      ...prev,
      [name]: name === 'estimatedValue' ? Number(value) || 0 : value,
    }));
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadFormError('');

    if (!leadFormData.companyName.trim()) {
      setLeadFormError('Company name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Set assignedTo to current user if not specified
      const payload = {
        ...leadFormData,
        assignedTo: leadFormData.assignedTo || user?.id
      };

      if (editingLeadId) {
        await leadsApi.update(editingLeadId, payload);
      } else {
        await leadsApi.create(payload);
      }
      closeLeadModal();
      refreshData();
    } catch (err: any) {
      setLeadFormError(err.message || 'Failed to save lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Lead detail handlers
  // ---------------------------------------------------------------------------

  const openDetailModal = async (lead: Lead) => {
    setDetailLead(lead);
    setActivities([]);
    setActivityForm({ ...EMPTY_ACTIVITY_FORM });
    setActivityError('');
    setShowDetailModal(true);
    setIsActivitiesLoading(true);
    try {
      const acts = await leadsApi.getActivities(lead.id);
      setActivities(Array.isArray(acts) ? acts : []);
    } catch {
      setActivities([]);
    } finally {
      setIsActivitiesLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailLead(null);
    setActivities([]);
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailLead) return;
    if (!activityForm.title.trim()) {
      setActivityError('Title is required');
      return;
    }
    setIsAddingActivity(true);
    setActivityError('');
    try {
      const newActivity = await leadsApi.addActivity(detailLead.id, activityForm);
      setActivities(prev => [newActivity, ...prev]);
      setActivityForm({ ...EMPTY_ACTIVITY_FORM });
    } catch (err: any) {
      setActivityError(err.message || 'Failed to add activity');
    } finally {
      setIsAddingActivity(false);
    }
  };

  const handleUpdateStage = async (newStage: LeadStage) => {
    if (!detailLead || detailLead.stage === newStage) return;
    setIsUpdatingStage(true);
    try {
      const updated = await leadsApi.update(detailLead.id, { stage: newStage });
      setDetailLead(updated);
      refreshData();
    } catch {
      // Fail silently
    } finally {
      setIsUpdatingStage(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Pipeline card stage change
  // ---------------------------------------------------------------------------

  const handlePipelineMoveStage = async (lead: Lead, newStage: LeadStage) => {
    if (lead.stage === newStage) return;
    try {
      await leadsApi.update(lead.id, { stage: newStage });
      refreshData();
    } catch {
      // Fail silently
    }
  };

  // ---------------------------------------------------------------------------
  // Convert handlers
  // ---------------------------------------------------------------------------

  const openConvertModal = (lead: Lead) => {
    setConvertLeadId(lead.id);
    setConvertForm({
      ...EMPTY_CONVERT_FORM,
      customerName: lead.companyName || '',
      amount: lead.estimatedValue || 0,
    });
    setConvertError('');
    setShowConvertModal(true);
  };

  const closeConvertModal = () => {
    setShowConvertModal(false);
    setConvertLeadId(null);
    setConvertError('');
  };

  const handleConvertFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setConvertForm(prev => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) || 0 : value,
    }));
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertLeadId) return;
    setConvertError('');

    if (!convertForm.partnerId) {
      setConvertError('Please select a partner');
      return;
    }
    if (!convertForm.productId) {
      setConvertError('Please select a product');
      return;
    }
    if (convertForm.amount <= 0) {
      setConvertError('Amount must be greater than 0');
      return;
    }
    if (!convertForm.saleDate) {
      setConvertError('Please enter the sale date');
      return;
    }

    setIsConverting(true);
    try {
      await leadsApi.convert(convertLeadId, convertForm);
      closeConvertModal();
      closeDetailModal();
      refreshData();
    } catch (err: any) {
      setConvertError(err.message || 'Failed to convert lead');
    } finally {
      setIsConverting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------

  const handleDelete = async (id: string) => {
    try {
      await leadsApi.delete(id);
      setDeleteConfirmId(null);
      refreshData();
    } catch (err: any) {
      setTableError(err.message || 'Failed to delete lead');
    }
  };

  // ---------------------------------------------------------------------------
  // Refresh helper
  // ---------------------------------------------------------------------------

  const refreshData = () => {
    fetchStats();
    if (viewMode === 'table') {
      fetchLeads();
    } else {
      fetchPipelineLeads();
    }
  };

  const clearFilters = () => {
    setFilterStage('');
    setFilterPriority('');
    setFilterSource('');
    setSearchTerm('');
  };

  const hasActiveFilters = filterStage || filterPriority || filterSource || searchTerm;

  const canConvert = (stage: LeadStage) => {
    return stage === 'Qualified' || stage === 'Proposal' || stage === 'Negotiation';
  };

  // ---------------------------------------------------------------------------
  // Render: Stats Bar
  // ---------------------------------------------------------------------------

  const renderStatsBar = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {LEAD_STAGES.map((stage, idx) => {
        const c = STAGE_COLORS[stage];
        const count = stageStats[stage] ?? 0;
        return (
          <div
            key={stage}
            className={`${cardClass} p-3 hover-lift animate-fade-in-up`}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
              isDark ? c.darkIconBg : c.iconBg
            }`}>
              {stage === 'New' && <Zap className={`w-4 h-4 ${isDark ? c.darkText : c.text}`} />}
              {stage === 'Contacted' && <Phone className={`w-4 h-4 ${isDark ? c.darkText : c.text}`} />}
              {stage === 'Qualified' && <Target className={`w-4 h-4 ${isDark ? c.darkText : c.text}`} />}
              {stage === 'Proposal' && <FileText className={`w-4 h-4 ${isDark ? c.darkText : c.text}`} />}
              {stage === 'Negotiation' && <TrendingUp className={`w-4 h-4 ${isDark ? c.darkText : c.text}`} />}
              {stage === 'Won' && <CheckCircle className={`w-4 h-4 ${isDark ? c.darkText : c.text}`} />}
              {stage === 'Lost' && <XCircle className={`w-4 h-4 ${isDark ? c.darkText : c.text}`} />}
            </div>
            <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{stage}</p>
            {isStatsLoading ? (
              <div className={`w-8 h-5 rounded animate-pulse mt-0.5 ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`} />
            ) : (
              <p className={`text-lg font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{count}</p>
            )}
          </div>
        );
      })}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Toolbar
  // ---------------------------------------------------------------------------

  const renderToolbar = () => (
    <div className={`${cardClass} p-4`}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* View Toggle */}
        <div className={`flex items-center rounded-xl border p-0.5 ${
          isDark ? 'border-zinc-700 bg-dark-100' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'table'
                ? 'bg-brand-600 text-white shadow-sm'
                : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Table
          </button>
          <button
            onClick={() => setViewMode('pipeline')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'pipeline'
                ? 'bg-brand-600 text-white shadow-sm'
                : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Pipeline
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            isDark ? 'text-zinc-500' : 'text-slate-400'
          }`} />
          <input
            type="text"
            placeholder="Search by company name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all ${
              isDark
                ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
            } focus:outline-none focus:ring-1 focus:ring-brand-500`}
          />
        </div>

        {/* Filter: Stage */}
        <div className="w-full lg:w-40">
          <select
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
            className={selectClass}
          >
            <option value="">All Stages</option>
            {LEAD_STAGES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Filter: Priority */}
        <div className="w-full lg:w-36">
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className={selectClass}
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Filter: Source */}
        <div className="w-full lg:w-36">
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className={selectClass}
          >
            <option value="">All Sources</option>
            {SOURCES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isDark
                ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}

        {/* New Lead */}
        <button
          onClick={openCreateLeadModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Lead
        </button>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Table View
  // ---------------------------------------------------------------------------

  const renderTableView = () => (
    <div className={`${cardClass} overflow-hidden`}>
      {tableError && (
        <div className={`m-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
          isDark
            ? 'bg-red-900/20 border border-red-800 text-red-400'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {tableError}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Loading leads...
          </p>
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
            isDark ? 'bg-zinc-800' : 'bg-slate-100'
          }`}>
            <Users className={`w-7 h-7 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
          </div>
          <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            {hasActiveFilters ? 'No leads match your filters' : 'No leads yet'}
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
            {hasActiveFilters ? 'Try adjusting your filters' : 'Click "New Lead" to create one'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                  {['Company', 'Contact', 'Stage', 'Priority', 'Value', 'Source', 'Next Follow-up', 'Actions'].map(h => (
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
                {leads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => openDetailModal(lead)}
                    className={`border-b transition-colors cursor-pointer ${
                      isDark
                        ? 'border-zinc-800/50 hover:bg-zinc-800/30'
                        : 'border-slate-50 hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Company */}
                    <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <div className="flex items-center gap-2">
                        <Building2 className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                        <span className="font-medium">{lead.companyName}</span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <div>
                        <p className="text-sm">{lead.contactPerson || '-'}</p>
                        {lead.email && (
                          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{lead.email}</p>
                        )}
                      </div>
                    </td>

                    {/* Stage */}
                    <td className="px-4 py-3">
                      <span className={stageBadge(lead.stage, isDark)}>{lead.stage}</span>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      <span className={priorityBadge(lead.priority, isDark)}>{lead.priority}</span>
                    </td>

                    {/* Value */}
                    <td className={`px-4 py-3 whitespace-nowrap font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {lead.estimatedValue ? formatINR(lead.estimatedValue) : '-'}
                    </td>

                    {/* Source */}
                    <td className={`px-4 py-3 capitalize ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {lead.source || '-'}
                    </td>

                    {/* Next Follow-up */}
                    <td className={`px-4 py-3 whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {lead.nextFollowUp ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                          {formatDate(lead.nextFollowUp)}
                        </div>
                      ) : '-'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => openDetailModal(lead)}
                          title="View"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark
                              ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20'
                              : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditLeadModal(lead)}
                          title="Edit"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark
                              ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20'
                              : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                          }`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {deleteConfirmId === lead.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(lead.id)}
                              className="px-2 py-1 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                isDark
                                  ? 'text-zinc-400 hover:bg-zinc-800'
                                  : 'text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(lead.id)}
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
              Showing {(page - 1) * PAGE_SIZE + 1}
              {' '}&ndash;{' '}
              {Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords} leads
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => {
                  if (p === 1 || p === totalPages) return true;
                  if (Math.abs(p - page) <= 1) return true;
                  return false;
                })
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
                    <span
                      key={`ellipsis-${idx}`}
                      className={`px-1 text-xs ${isDark ? 'text-zinc-600' : 'text-slate-300'}`}
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item as number)}
                      className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors ${
                        page === item
                          ? 'bg-brand-600 text-white'
                          : isDark
                            ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Pipeline / Kanban View
  // ---------------------------------------------------------------------------

  const renderPipelineCard = (lead: Lead) => {
    const pc = PRIORITY_COLORS[lead.priority] || PRIORITY_COLORS.Low;
    return (
      <div
        key={lead.id}
        onClick={() => openDetailModal(lead)}
        className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
          isDark
            ? 'bg-dark-100 border-zinc-700 hover:border-zinc-600'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {lead.companyName}
          </h4>
          <span className={priorityBadge(lead.priority, isDark)}>{lead.priority}</span>
        </div>

        {lead.contactPerson && (
          <p className={`text-xs mb-1.5 flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            <UserIcon className="w-3 h-3" />
            {lead.contactPerson}
          </p>
        )}

        {lead.estimatedValue ? (
          <p className={`text-xs font-semibold mb-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {formatINR(lead.estimatedValue)}
          </p>
        ) : null}

        {lead.nextFollowUp && (
          <p className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
            <Clock className="w-3 h-3" />
            {formatDate(lead.nextFollowUp)}
          </p>
        )}

        {/* Move to dropdown */}
        <div className="mt-2 pt-2 border-t border-dashed ${isDark ? 'border-zinc-700' : 'border-slate-200'}">
          <div className="relative" onClick={e => e.stopPropagation()}>
            <select
              value={lead.stage}
              onChange={e => handlePipelineMoveStage(lead, e.target.value as LeadStage)}
              className={`w-full text-[11px] px-2 py-1 rounded-lg border transition-all appearance-none cursor-pointer ${
                isDark
                  ? 'bg-dark-50 border-zinc-700 text-zinc-300 focus:border-brand-500'
                  : 'bg-slate-50 border-slate-200 text-slate-600 focus:border-brand-500'
              } focus:outline-none`}
            >
              {LEAD_STAGES.map(s => (
                <option key={s} value={s}>Move to: {s}</option>
              ))}
            </select>
            <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${
              isDark ? 'text-zinc-500' : 'text-slate-400'
            }`} />
          </div>
        </div>
      </div>
    );
  };

  const renderPipelineView = () => {
    if (isPipelineLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Loading pipeline...
          </p>
        </div>
      );
    }

    // Filter pipeline leads by search/filters
    const filterLead = (lead: Lead): boolean => {
      if (searchTerm && !lead.companyName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterStage && lead.stage !== filterStage) return false;
      if (filterPriority && lead.priority !== filterPriority) return false;
      if (filterSource && lead.source !== filterSource) return false;
      return true;
    };

    return (
      <div className="space-y-4">
        {/* Main pipeline columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {PIPELINE_STAGES.map(stage => {
            const stageLeads = (pipelineLeads[stage] || []).filter(filterLead);
            const c = STAGE_COLORS[stage];
            return (
              <div key={stage} className={`${cardClass} p-3 min-h-[200px]`}>
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isDark ? c.darkText.replace('text-', 'bg-') : c.text.replace('text-', 'bg-')}`} />
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stage}</h3>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {stageLeads.length === 0 ? (
                    <p className={`text-xs text-center py-6 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`}>
                      No leads
                    </p>
                  ) : (
                    stageLeads.map(lead => renderPipelineCard(lead))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Won / Lost summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TERMINAL_STAGES.map(stage => {
            const stageLeads = (pipelineLeads[stage] || []).filter(filterLead);
            const c = STAGE_COLORS[stage];
            const isWon = stage === 'Won';
            return (
              <div key={stage} className={`${cardClass} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isWon
                      ? <CheckCircle className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      : <XCircle className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                    }
                    <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stage}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isDark ? `${c.darkBg} ${c.darkText}` : `${c.bg} ${c.text}`
                    }`}>
                      {stageLeads.length}
                    </span>
                  </div>
                  {isWon && stageLeads.length > 0 && (
                    <p className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {formatINR(stageLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0))}
                    </p>
                  )}
                </div>

                {stageLeads.length === 0 ? (
                  <p className={`text-xs ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                    No {stage.toLowerCase()} leads
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {stageLeads.slice(0, 6).map(lead => (
                      <div
                        key={lead.id}
                        onClick={() => openDetailModal(lead)}
                        className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                          isDark
                            ? 'border-zinc-700 hover:bg-zinc-800/50'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <p className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {lead.companyName}
                        </p>
                        {lead.estimatedValue ? (
                          <p className={`text-[11px] ${isWon ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
                            {formatINR(lead.estimatedValue)}
                          </p>
                        ) : null}
                      </div>
                    ))}
                    {stageLeads.length > 6 && (
                      <div className={`flex items-center justify-center p-2 rounded-lg border border-dashed ${
                        isDark ? 'border-zinc-700 text-zinc-500' : 'border-slate-200 text-slate-400'
                      }`}>
                        <p className="text-xs">+{stageLeads.length - 6} more</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Lead Detail Modal
  // ---------------------------------------------------------------------------

  const renderDetailModal = () => {
    if (!showDetailModal || !detailLead) return null;
    const lead = detailLead;
    const ActivityIcon = getActivityIcon('');

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeDetailModal} />
        <div className={`relative w-full max-w-3xl max-h-[90vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
          isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
        }`}>
          {/* Header */}
          <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <h2 className={`text-lg font-semibold font-display truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {lead.companyName}
              </h2>
              <span className={stageBadge(lead.stage, isDark)}>{lead.stage}</span>
              <span className={priorityBadge(lead.priority, isDark)}>{lead.priority}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => { closeDetailModal(); openEditLeadModal(lead); }}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={closeDetailModal}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Lead info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Contact Person" value={lead.contactPerson} isDark={isDark} icon={<UserIcon className="w-3.5 h-3.5" />} />
              <InfoRow label="Email" value={lead.email} isDark={isDark} icon={<Mail className="w-3.5 h-3.5" />} />
              <InfoRow label="Phone" value={lead.phone} isDark={isDark} icon={<Phone className="w-3.5 h-3.5" />} />
              <InfoRow label="Source" value={lead.source} isDark={isDark} icon={<BarChart3 className="w-3.5 h-3.5" />} capitalize />
              <InfoRow label="Estimated Value" value={lead.estimatedValue ? formatINR(lead.estimatedValue) : undefined} isDark={isDark} icon={<IndianRupee className="w-3.5 h-3.5" />} />
              <InfoRow label="Product Interest" value={lead.productInterest} isDark={isDark} icon={<Target className="w-3.5 h-3.5" />} />
              <InfoRow label="Expected Close" value={lead.expectedCloseDate ? formatDate(lead.expectedCloseDate) : undefined} isDark={isDark} icon={<Calendar className="w-3.5 h-3.5" />} />
              <InfoRow label="Next Follow-up" value={lead.nextFollowUp ? formatDate(lead.nextFollowUp) : undefined} isDark={isDark} icon={<Clock className="w-3.5 h-3.5" />} />
            </div>

            {/* Notes */}
            {lead.notes && (
              <div>
                <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Notes
                </h4>
                <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  {lead.notes}
                </p>
              </div>
            )}

            {/* Stage update + Convert */}
            <div className={`flex flex-wrap items-center gap-3 p-4 rounded-xl border ${
              isDark ? 'border-zinc-800 bg-dark-100' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <label className={`text-xs font-medium whitespace-nowrap ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Update Stage:
                </label>
                <select
                  value={lead.stage}
                  onChange={e => handleUpdateStage(e.target.value as LeadStage)}
                  disabled={isUpdatingStage}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-all appearance-none cursor-pointer ${
                    isDark
                      ? 'bg-dark-50 border-zinc-700 text-white focus:border-brand-500'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-brand-500'
                  } focus:outline-none disabled:opacity-50`}
                >
                  {LEAD_STAGES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {isUpdatingStage && <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />}
              </div>

              {canConvert(lead.stage) && (
                <button
                  onClick={() => openConvertModal(lead)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all btn-premium whitespace-nowrap"
                >
                  <Award className="w-4 h-4" />
                  Convert to Sale
                </button>
              )}
            </div>

            {/* Lost reason */}
            {lead.stage === 'Lost' && lead.lostReason && (
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-red-900/10 border-red-800/50' : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-red-400' : 'text-red-700'}`}>Lost Reason</p>
                <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>{lead.lostReason}</p>
              </div>
            )}

            {/* Won reference */}
            {lead.stage === 'Won' && lead.wonSaleId && (
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-emerald-900/10 border-emerald-800/50' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Converted to Sale</p>
                <p className={`text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>Sale ID: {lead.wonSaleId}</p>
              </div>
            )}

            {/* Activity Timeline */}
            <div>
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                Activity Timeline
              </h4>

              {isActivitiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
                </div>
              ) : activities.length === 0 ? (
                <p className={`text-sm py-4 text-center ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                  No activities yet
                </p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {activities.map(activity => {
                    const Icon = getActivityIcon(activity.activityType);
                    return (
                      <div
                        key={activity.id}
                        className={`flex gap-3 p-3 rounded-xl border transition-colors ${
                          isDark ? 'border-zinc-800 hover:bg-zinc-800/30' : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isDark ? 'bg-zinc-800' : 'bg-slate-100'
                        }`}>
                          <Icon className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {activity.title}
                            </p>
                            <span className={`text-[11px] whitespace-nowrap ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                              {relativeTime(activity.createdAt)}
                            </span>
                          </div>
                          {activity.description && (
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                              {activity.description}
                            </p>
                          )}
                          {activity.createdBy && (
                            <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                              by {activity.createdBy}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Activity form */}
              <form onSubmit={handleAddActivity} className={`mt-4 p-4 rounded-xl border ${
                isDark ? 'border-zinc-800 bg-dark-100' : 'border-slate-200 bg-slate-50'
              }`}>
                <h5 className={`text-xs font-semibold mb-3 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Add Activity
                </h5>

                {activityError && (
                  <div className={`mb-3 p-2 rounded-lg flex items-center gap-2 text-xs ${
                    isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {activityError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <select
                    value={activityForm.activityType}
                    onChange={e => setActivityForm(prev => ({ ...prev, activityType: e.target.value }))}
                    className={selectClass}
                  >
                    {ACTIVITY_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Activity title*"
                    value={activityForm.title}
                    onChange={e => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <textarea
                  placeholder="Description (optional)"
                  value={activityForm.description}
                  onChange={e => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className={`${inputClass} resize-none mb-3`}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isAddingActivity}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium disabled:opacity-50"
                  >
                    {isAddingActivity ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...</>
                    ) : (
                      <><Plus className="w-3.5 h-3.5" /> Add Activity</>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Timestamps */}
            <div className={`flex items-center gap-4 text-[11px] pt-2 border-t ${
              isDark ? 'border-zinc-800 text-zinc-600' : 'border-slate-100 text-slate-400'
            }`}>
              {lead.createdAt && <span>Created: {formatDateTime(lead.createdAt)}</span>}
              {lead.updatedAt && <span>Updated: {formatDateTime(lead.updatedAt)}</span>}
            </div>
          </div>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Create/Edit Lead Modal
  // ---------------------------------------------------------------------------

  const renderLeadModal = () => {
    if (!showLeadModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeLeadModal} />
        <div className={`relative w-full max-w-2xl max-h-[90vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
          isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
        }`}>
          {/* Header */}
          <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {editingLeadId ? 'Edit Lead' : 'New Lead'}
            </h2>
            <button
              onClick={closeLeadModal}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleLeadSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-5">
            {leadFormError && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {leadFormError}
              </div>
            )}

            {/* Section: Lead Information */}
            <div className={`flex items-center gap-2 pb-1 border-b ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
              <UserIcon className={`w-4 h-4 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
              <h3 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Lead Information</h3>
            </div>

            {/* Company Name + Contact Person */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="companyName" className={labelClass}>
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    placeholder="Enter company name"
                    value={leadFormData.companyName}
                    onChange={handleLeadFormChange}
                    className={`${inputClass} pl-10`}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="contactPerson" className={labelClass}>Contact Person</label>
                <div className="relative">
                  <UserIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="contactPerson"
                    name="contactPerson"
                    type="text"
                    placeholder="Contact person name"
                    value={leadFormData.contactPerson}
                    onChange={handleLeadFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="contact@company.com"
                    value={leadFormData.email}
                    onChange={handleLeadFormChange}
                    className={`${inputClass} pl-10`}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>Phone</label>
                <div className="relative">
                  <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    placeholder="+91 XXXXX XXXXX"
                    value={leadFormData.phone}
                    onChange={handleLeadFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            {/* Section: Opportunity Details */}
            <div className={`flex items-center gap-2 pb-1 border-b ${isDark ? 'border-zinc-700' : 'border-slate-200'} mt-2`}>
              <Target className={`w-4 h-4 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
              <h3 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Opportunity Details</h3>
            </div>

            {/* Estimated Value + Product Interest */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="estimatedValue" className={labelClass}>Estimated Value (INR)</label>
                <div className="relative">
                  <IndianRupee className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="estimatedValue"
                    name="estimatedValue"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={leadFormData.estimatedValue || ''}
                    onChange={handleLeadFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="productInterest" className={labelClass}>Product Interest</label>
                <div className="relative">
                  <Target className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="productInterest"
                    name="productInterest"
                    type="text"
                    placeholder="e.g. HP ProLiant DL380"
                    value={leadFormData.productInterest}
                    onChange={handleLeadFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            {/* Expected Close Date + Next Follow-up */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="expectedCloseDate" className={labelClass}>Expected Close Date</label>
                <div className="relative">
                  <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="expectedCloseDate"
                    name="expectedCloseDate"
                    type="date"
                    value={leadFormData.expectedCloseDate}
                    onChange={handleLeadFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="nextFollowUp" className={labelClass}>Next Follow-up</label>
                <div className="relative">
                  <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="nextFollowUp"
                    name="nextFollowUp"
                    type="date"
                    value={leadFormData.nextFollowUp}
                    onChange={handleLeadFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            {/* Section: Lead Classification */}
            <div className={`flex items-center gap-2 pb-1 border-b ${isDark ? 'border-zinc-700' : 'border-slate-200'} mt-2`}>
              <Tags className={`w-4 h-4 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
              <h3 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Lead Classification</h3>
            </div>

            {/* Source + Stage + Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="source" className={labelClass}>Source</label>
                <select
                  id="source"
                  name="source"
                  value={leadFormData.source}
                  onChange={handleLeadFormChange}
                  className={selectClass}
                >
                  <option value="">Select Source</option>
                  {SOURCES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="stage" className={labelClass}>Stage</label>
                <select
                  id="stage"
                  name="stage"
                  value={leadFormData.stage}
                  onChange={handleLeadFormChange}
                  className={selectClass}
                >
                  {LEAD_STAGES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="priority" className={labelClass}>Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={leadFormData.priority}
                  onChange={handleLeadFormChange}
                  className={selectClass}
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assigned To + Partner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="assignedTo" className={labelClass}>
                  Assigned To
                </label>
                <div className="relative">
                  <Users className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <select
                    id="assignedTo"
                    name="assignedTo"
                    value={leadFormData.assignedTo}
                    onChange={handleLeadFormChange}
                    className={`${selectClass} pl-10`}
                  >
                    <option value="">Auto-assign (Me)</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="partnerId" className={labelClass}>Partner</label>
                <select
                  id="partnerId"
                  name="partnerId"
                  value={leadFormData.partnerId}
                  onChange={handleLeadFormChange}
                  className={selectClass}
                >
                  <option value="">Select Partner (Optional)</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.companyName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className={labelClass}>Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Additional notes about this lead..."
                value={leadFormData.notes}
                onChange={handleLeadFormChange}
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
                onClick={closeLeadModal}
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
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> {editingLeadId ? 'Update Lead' : 'Create Lead'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Convert to Sale Modal
  // ---------------------------------------------------------------------------

  const renderConvertModal = () => {
    if (!showConvertModal) return null;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeConvertModal} />
        <div className={`relative w-full max-w-lg max-h-[90vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
          isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
        }`}>
          {/* Header */}
          <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <Award className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Convert to Sale
              </h2>
            </div>
            <button
              onClick={closeConvertModal}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleConvertSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-5">
            {convertError && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {convertError}
              </div>
            )}

            {/* Partner */}
            <div>
              <label htmlFor="conv-partnerId" className={labelClass}>
                Partner <span className="text-red-500">*</span>
              </label>
              <select
                id="conv-partnerId"
                name="partnerId"
                value={convertForm.partnerId}
                onChange={handleConvertFormChange}
                className={selectClass}
                required
              >
                <option value="">Select Partner</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.companyName}</option>
                ))}
              </select>
            </div>

            {/* Product */}
            <div>
              <label htmlFor="conv-productId" className={labelClass}>
                Product <span className="text-red-500">*</span>
              </label>
              <select
                id="conv-productId"
                name="productId"
                value={convertForm.productId}
                onChange={handleConvertFormChange}
                className={selectClass}
                required
              >
                <option value="">Select Product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="conv-amount" className={labelClass}>
                Amount (INR) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <IndianRupee className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  id="conv-amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={convertForm.amount || ''}
                  onChange={handleConvertFormChange}
                  className={`${inputClass} pl-10`}
                  required
                />
              </div>
            </div>

            {/* Sale Date */}
            <div>
              <label htmlFor="conv-saleDate" className={labelClass}>
                Sale Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  id="conv-saleDate"
                  name="saleDate"
                  type="date"
                  value={convertForm.saleDate}
                  onChange={handleConvertFormChange}
                  className={`${inputClass} pl-10`}
                  required
                />
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label htmlFor="conv-customerName" className={labelClass}>Customer Name</label>
              <div className="relative">
                <UserIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  id="conv-customerName"
                  name="customerName"
                  type="text"
                  placeholder="Customer name"
                  value={convertForm.customerName}
                  onChange={handleConvertFormChange}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            </div>
            {/* Footer - sticky at bottom */}
            <div className={`sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t ${
              isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <button
                type="button"
                onClick={closeConvertModal}
                disabled={isConverting}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                } disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isConverting}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all btn-premium disabled:opacity-50"
              >
                {isConverting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Converting...</>
                ) : (
                  <><Award className="w-4 h-4" /> Convert to Sale</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
            CRM Pipeline
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Manage leads, track pipeline progress, and convert opportunities
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      {renderStatsBar()}

      {/* Toolbar */}
      {renderToolbar()}

      {/* Content */}
      {viewMode === 'table' ? renderTableView() : renderPipelineView()}

      {/* Modals */}
      {renderLeadModal()}
      {renderDetailModal()}
      {renderConvertModal()}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const InfoRow: React.FC<{
  label: string;
  value?: string;
  isDark: boolean;
  icon?: React.ReactNode;
  capitalize?: boolean;
}> = ({ label, value, isDark, icon, capitalize }) => (
  <div className={`flex items-start gap-2 p-2.5 rounded-lg ${isDark ? 'bg-dark-100' : 'bg-slate-50'}`}>
    {icon && (
      <span className={`mt-0.5 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
        {icon}
      </span>
    )}
    <div className="min-w-0">
      <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{label}</p>
      <p className={`text-sm ${capitalize ? 'capitalize' : ''} ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {value || '-'}
      </p>
    </div>
  </div>
);
