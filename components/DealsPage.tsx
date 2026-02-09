import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, ChevronLeft, ChevronRight, Edit2, Trash2,
  IndianRupee, Loader2, AlertCircle, CheckCircle, Calendar,
  Target, TrendingUp, ArrowRight, Eye, LayoutGrid, List,
  XCircle, ChevronDown, Building2, User as UserIcon,
  Handshake, Percent, FileText, Briefcase, DollarSign,
  BarChart3, Layers
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { dealsApi, accountsApi, contactsApi, formatINR } from '../services/api';
import { Deal, DealStage, Account, Contact, PaginatedResponse } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

const DEAL_STAGES: DealStage[] = [
  'Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost',
];

const PIPELINE_STAGES: DealStage[] = ['Qualification', 'Discovery', 'Proposal', 'Negotiation'];
const TERMINAL_STAGES: DealStage[] = ['Closed Won', 'Closed Lost'];

const STAGE_COLORS: Record<DealStage, {
  bg: string; text: string; darkBg: string; darkText: string;
  iconBg: string; darkIconBg: string; border: string; darkBorder: string;
}> = {
  Qualification:  { bg: 'bg-blue-50', text: 'text-blue-700', darkBg: 'bg-blue-900/30', darkText: 'text-blue-400', iconBg: 'bg-blue-100', darkIconBg: 'bg-blue-900/20', border: 'border-blue-200', darkBorder: 'border-blue-800' },
  Discovery:      { bg: 'bg-cyan-50', text: 'text-cyan-700', darkBg: 'bg-cyan-900/30', darkText: 'text-cyan-400', iconBg: 'bg-cyan-100', darkIconBg: 'bg-cyan-900/20', border: 'border-cyan-200', darkBorder: 'border-cyan-800' },
  Proposal:       { bg: 'bg-amber-50', text: 'text-amber-700', darkBg: 'bg-amber-900/30', darkText: 'text-amber-400', iconBg: 'bg-amber-100', darkIconBg: 'bg-amber-900/20', border: 'border-amber-200', darkBorder: 'border-amber-800' },
  Negotiation:    { bg: 'bg-purple-50', text: 'text-purple-700', darkBg: 'bg-purple-900/30', darkText: 'text-purple-400', iconBg: 'bg-purple-100', darkIconBg: 'bg-purple-900/20', border: 'border-purple-200', darkBorder: 'border-purple-800' },
  'Closed Won':   { bg: 'bg-emerald-50', text: 'text-emerald-700', darkBg: 'bg-emerald-900/30', darkText: 'text-emerald-400', iconBg: 'bg-emerald-100', darkIconBg: 'bg-emerald-900/20', border: 'border-emerald-200', darkBorder: 'border-emerald-800' },
  'Closed Lost':  { bg: 'bg-red-50', text: 'text-red-700', darkBg: 'bg-red-900/30', darkText: 'text-red-400', iconBg: 'bg-red-100', darkIconBg: 'bg-red-900/20', border: 'border-red-200', darkBorder: 'border-red-800' },
};

const NEXT_STAGE: Record<string, DealStage> = {
  Qualification: 'Discovery',
  Discovery: 'Proposal',
  Proposal: 'Negotiation',
  Negotiation: 'Closed Won',
};

const DEAL_TYPES = [
  { value: 'New Business', label: 'New Business' },
  { value: 'Existing Business', label: 'Existing Business' },
  { value: 'Renewal', label: 'Renewal' },
  { value: 'Upsell', label: 'Upsell' },
];

const LEAD_SOURCES = [
  { value: 'Website', label: 'Website' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Cold Call', label: 'Cold Call' },
  { value: 'Event', label: 'Event' },
  { value: 'Partner', label: 'Partner' },
  { value: 'Other', label: 'Other' },
];

const FORECAST_OPTIONS = [
  { value: 'Pipeline', label: 'Pipeline' },
  { value: 'Best Case', label: 'Best Case' },
  { value: 'Commit', label: 'Commit' },
  { value: 'Omitted', label: 'Omitted' },
];

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

interface DealFormData {
  title: string;
  company: string;
  accountId: string;
  value: number;
  stage: DealStage;
  probability: number;
  closingDate: string;
  description: string;
  contactId: string;
  nextStep: string;
  forecast: string;
  type: string;
  leadSource: string;
}

const EMPTY_DEAL_FORM: DealFormData = {
  title: '',
  company: '',
  accountId: '',
  value: 0,
  stage: 'Qualification',
  probability: 20,
  closingDate: '',
  description: '',
  contactId: '',
  nextStep: '',
  forecast: 'Pipeline',
  type: 'New Business',
  leadSource: '',
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

function stageBadge(stage: DealStage, isDark: boolean): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const c = STAGE_COLORS[stage];
  return `${base} ${isDark ? `${c.darkBg} ${c.darkText}` : `${c.bg} ${c.text}`}`;
}

function getDefaultProbability(stage: DealStage): number {
  switch (stage) {
    case 'Qualification': return 20;
    case 'Discovery': return 40;
    case 'Proposal': return 60;
    case 'Negotiation': return 80;
    case 'Closed Won': return 100;
    case 'Closed Lost': return 0;
    default: return 20;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DealsPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  // Data state
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelineDeals, setPipelineDeals] = useState<Deal[]>([]);
  const [pipelineStats, setPipelineStats] = useState<Record<string, { count: number; totalValue: number }>>({});
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('table');

  // Pagination (table view)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterAccount, setFilterAccount] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isPipelineLoading, setIsPipelineLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableError, setTableError] = useState('');

  // Deal form modal
  const [showDealModal, setShowDealModal] = useState(false);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [dealFormData, setDealFormData] = useState<DealFormData>({ ...EMPTY_DEAL_FORM });
  const [dealFormError, setDealFormError] = useState('');

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Styling helpers
  // ---------------------------------------------------------------------------

  const cardClass = `premium-card ${isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-soft'}`;
  const inputClass = `w-full px-3 py-2 rounded-xl border text-sm transition-all ${
    isDark
      ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
  } focus:outline-none focus:ring-1 focus:ring-brand-500`;
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchDeals = useCallback(async () => {
    setIsLoading(true);
    setTableError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (filterStage) params.stage = filterStage;
      if (filterAccount) params.accountId = filterAccount;
      if (searchTerm) params.search = searchTerm;

      const response: PaginatedResponse<Deal> = await dealsApi.list(params);
      setDeals(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);
    } catch (err: any) {
      setTableError(err.message || 'Failed to load deals');
      setDeals([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterStage, filterAccount, searchTerm]);

  const fetchPipelineStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const data = await dealsApi.stats();
      setPipelineStats(data);
    } catch {
      setPipelineStats({});
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  const fetchPipelineDeals = useCallback(async () => {
    setIsPipelineLoading(true);
    try {
      const data = await dealsApi.pipeline();
      const allDeals: Deal[] = Array.isArray(data) ? data : (data?.data ?? []);
      setPipelineDeals(allDeals);
    } catch {
      setPipelineDeals([]);
    } finally {
      setIsPipelineLoading(false);
    }
  }, []);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [accountsResponse, contactsResponse] = await Promise.all([
        accountsApi.list({ limit: '200' }),
        contactsApi.list({ limit: '200' }),
      ]);
      const acctData = accountsResponse?.data ?? accountsResponse;
      setAccounts(Array.isArray(acctData) ? acctData : []);
      const contData = contactsResponse?.data ?? contactsResponse;
      setContacts(Array.isArray(contData) ? contData : []);
    } catch {
      // Dropdown data failure is non-critical
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDropdownData();
    fetchPipelineStats();
  }, [fetchDropdownData, fetchPipelineStats]);

  // Fetch based on view mode
  useEffect(() => {
    if (viewMode === 'table') {
      fetchDeals();
    } else {
      fetchPipelineDeals();
    }
  }, [viewMode, fetchDeals, fetchPipelineDeals]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterStage, filterAccount, searchTerm]);

  // ---------------------------------------------------------------------------
  // Deal form handlers
  // ---------------------------------------------------------------------------

  const openCreateDealModal = () => {
    setDealFormData({ ...EMPTY_DEAL_FORM });
    setEditingDealId(null);
    setDealFormError('');
    setShowDealModal(true);
  };

  const openEditDealModal = (deal: Deal) => {
    setDealFormData({
      title: deal.title || '',
      company: deal.company || '',
      accountId: deal.accountId || '',
      value: deal.value || 0,
      stage: deal.stage,
      probability: deal.probability ?? getDefaultProbability(deal.stage),
      closingDate: deal.closingDate ? deal.closingDate.split('T')[0] : '',
      description: deal.description || '',
      contactId: deal.contactId || '',
      nextStep: deal.nextStep || '',
      forecast: deal.forecast || 'Pipeline',
      type: deal.type || 'New Business',
      leadSource: deal.leadSource || '',
    });
    setEditingDealId(deal.id);
    setDealFormError('');
    setShowDealModal(true);
  };

  const closeDealModal = () => {
    setShowDealModal(false);
    setEditingDealId(null);
    setDealFormError('');
  };

  const handleDealFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setDealFormData(prev => {
      const updated = {
        ...prev,
        [name]: name === 'value' || name === 'probability'
          ? Number(value) || 0
          : value,
      };
      // Auto-adjust probability when stage changes
      if (name === 'stage') {
        updated.probability = getDefaultProbability(value as DealStage);
      }
      return updated;
    });
  };

  const handleDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDealFormError('');

    if (!dealFormData.title.trim()) {
      setDealFormError('Deal title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = { ...dealFormData };
      if (!payload.accountId) delete payload.accountId;
      if (!payload.contactId) delete payload.contactId;
      if (!payload.closingDate) delete payload.closingDate;
      if (!payload.company) delete payload.company;

      if (editingDealId) {
        await dealsApi.update(editingDealId, payload);
      } else {
        await dealsApi.create({ ...payload, ownerId: user?.id });
      }
      closeDealModal();
      refreshData();
    } catch (err: any) {
      setDealFormError(err.message || 'Failed to save deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Stage move handler (pipeline)
  // ---------------------------------------------------------------------------

  const handleMoveStage = async (deal: Deal, newStage: DealStage) => {
    if (deal.stage === newStage) return;
    try {
      await dealsApi.update(deal.id, {
        stage: newStage,
        probability: getDefaultProbability(newStage),
      });
      refreshData();
    } catch {
      // Fail silently
    }
  };

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------

  const handleDelete = async (id: string) => {
    try {
      await dealsApi.delete(id);
      setDeleteConfirmId(null);
      refreshData();
    } catch (err: any) {
      setTableError(err.message || 'Failed to delete deal');
    }
  };

  // ---------------------------------------------------------------------------
  // Refresh helper
  // ---------------------------------------------------------------------------

  const refreshData = () => {
    fetchPipelineStats();
    if (viewMode === 'table') {
      fetchDeals();
    } else {
      fetchPipelineDeals();
    }
  };

  const clearFilters = () => {
    setFilterStage('');
    setFilterAccount('');
    setSearchTerm('');
  };

  const hasActiveFilters = filterStage || filterAccount || searchTerm;

  // ---------------------------------------------------------------------------
  // Render: Pipeline Stats Bar
  // ---------------------------------------------------------------------------

  const renderStatsBar = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {DEAL_STAGES.map((stage, idx) => {
        const c = STAGE_COLORS[stage];
        const stats = pipelineStats[stage];
        const count = stats?.count ?? 0;
        const totalValue = stats?.totalValue ?? 0;
        return (
          <div
            key={stage}
            className={`${cardClass} p-3 hover-lift animate-fade-in-up`}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
              isDark ? c.darkIconBg : c.iconBg
            }`}>
              {stage === 'Qualification' && <Target className={`w-4 h-4 ${isDark ? c.darkText : c.text}`} />}
              {stage === 'Discovery' && <Search className={`w-4 h-4 ${isDark ? c.darkText : c.text}`} />}
              {stage === 'Proposal' && <FileText className={`w-4 h-4 ${isDark ? c.darkText : c.text}`} />}
              {stage === 'Negotiation' && <Handshake className={`w-4 h-4 ${isDark ? c.darkText : c.text}`} />}
              {stage === 'Closed Won' && <CheckCircle className={`w-4 h-4 ${isDark ? c.darkText : c.text}`} />}
              {stage === 'Closed Lost' && <XCircle className={`w-4 h-4 ${isDark ? c.darkText : c.text}`} />}
            </div>
            <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{stage}</p>
            {isStatsLoading ? (
              <div className={`w-8 h-5 rounded animate-pulse mt-0.5 ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`} />
            ) : (
              <>
                <p className={`text-lg font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{count}</p>
                <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  {formatINR(totalValue)}
                </p>
              </>
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
            placeholder="Search deals by title or company..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm transition-all ${
              isDark
                ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
            } focus:outline-none focus:ring-1 focus:ring-brand-500`}
          />
        </div>

        {/* Filter: Stage */}
        <div className="w-full lg:w-44">
          <select
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
            className={selectClass}
          >
            <option value="">All Stages</option>
            {DEAL_STAGES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Filter: Account */}
        <div className="w-full lg:w-44">
          <select
            value={filterAccount}
            onChange={e => setFilterAccount(e.target.value)}
            className={selectClass}
          >
            <option value="">All Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              isDark
                ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}

        {/* New Deal */}
        <button
          onClick={openCreateDealModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Deal
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
            Loading deals...
          </p>
        </div>
      ) : deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
            isDark ? 'bg-zinc-800' : 'bg-slate-100'
          }`}>
            <Briefcase className={`w-7 h-7 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
          </div>
          <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            {hasActiveFilters ? 'No deals match your filters' : 'No deals yet'}
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
            {hasActiveFilters ? 'Try adjusting your filters' : 'Click "New Deal" to create one'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                  {['Title', 'Company', 'Account', 'Value', 'Stage', 'Probability', 'Closing Date', 'Owner', 'Actions'].map(h => (
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
                {deals.map(deal => (
                  <tr
                    key={deal.id}
                    onClick={() => openEditDealModal(deal)}
                    className={`border-b transition-colors cursor-pointer ${
                      isDark
                        ? 'border-zinc-800/50 hover:bg-gray-800/50'
                        : 'border-slate-50 hover:bg-gray-50'
                    }`}
                  >
                    {/* Title */}
                    <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <div className="flex items-center gap-2">
                        <Briefcase className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                        <span className="font-medium truncate max-w-[180px]">{deal.title}</span>
                      </div>
                    </td>

                    {/* Company */}
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {deal.company || '-'}
                    </td>

                    {/* Account */}
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <div className="flex items-center gap-1.5">
                        {deal.accountName && <Building2 className={`w-3 h-3 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />}
                        <span className="truncate max-w-[120px]">{deal.accountName || '-'}</span>
                      </div>
                    </td>

                    {/* Value */}
                    <td className={`px-4 py-3 whitespace-nowrap font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {deal.value ? formatINR(deal.value) : '-'}
                    </td>

                    {/* Stage */}
                    <td className="px-4 py-3">
                      <span className={stageBadge(deal.stage, isDark)}>{deal.stage}</span>
                    </td>

                    {/* Probability */}
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-16 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`}>
                          <div
                            className="h-full rounded-full bg-brand-500 transition-all"
                            style={{ width: `${Math.min(100, deal.probability ?? 0)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{deal.probability ?? 0}%</span>
                      </div>
                    </td>

                    {/* Closing Date */}
                    <td className={`px-4 py-3 whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {deal.closingDate ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                          {formatDate(deal.closingDate)}
                        </div>
                      ) : '-'}
                    </td>

                    {/* Owner */}
                    <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {deal.ownerName ? (
                        <div className="flex items-center gap-1.5">
                          <UserIcon className={`w-3 h-3 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                          <span className="truncate max-w-[100px]">{deal.ownerName}</span>
                        </div>
                      ) : '-'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditDealModal(deal); }}
                          title="Edit"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark
                              ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20'
                              : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                          }`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {deleteConfirmId === deal.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(deal.id); }}
                              className="px-2 py-1 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
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
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(deal.id); }}
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
              {Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords} deals
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

  const renderPipelineCard = (deal: Deal) => {
    const c = STAGE_COLORS[deal.stage];
    const nextStage = NEXT_STAGE[deal.stage];

    return (
      <div
        key={deal.id}
        className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
          isDark
            ? 'bg-dark-100 border-zinc-700 hover:border-zinc-600'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        {/* Title & Edit */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {deal.title}
          </h4>
          <button
            onClick={(e) => { e.stopPropagation(); openEditDealModal(deal); }}
            className={`p-1 rounded-lg flex-shrink-0 transition-colors ${
              isDark ? 'text-zinc-500 hover:text-brand-400 hover:bg-brand-900/20' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
            }`}
          >
            <Edit2 className="w-3 h-3" />
          </button>
        </div>

        {/* Company */}
        {deal.company && (
          <p className={`text-xs mb-1.5 flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            <Building2 className="w-3 h-3" />
            {deal.company}
          </p>
        )}

        {/* Value */}
        {deal.value ? (
          <p className={`text-xs font-semibold mb-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {formatINR(deal.value)}
          </p>
        ) : null}

        {/* Probability */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`}>
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${Math.min(100, deal.probability ?? 0)}%` }}
            />
          </div>
          <span className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            {deal.probability ?? 0}%
          </span>
        </div>

        {/* Closing Date */}
        {deal.closingDate && (
          <p className={`text-[11px] flex items-center gap-1 mb-2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
            <Calendar className="w-3 h-3" />
            {formatDate(deal.closingDate)}
          </p>
        )}

        {/* Move to next stage button */}
        {nextStage && (
          <div className={`pt-2 border-t border-dashed ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
            <button
              onClick={(e) => { e.stopPropagation(); handleMoveStage(deal, nextStage); }}
              className={`w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                isDark
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <ArrowRight className="w-3 h-3" />
              Move to {nextStage}
            </button>
          </div>
        )}
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

    // Group pipeline deals by stage
    const groupedDeals: Record<string, Deal[]> = {};
    DEAL_STAGES.forEach(s => { groupedDeals[s] = []; });
    pipelineDeals.forEach(deal => {
      if (groupedDeals[deal.stage]) {
        groupedDeals[deal.stage].push(deal);
      }
    });

    // Apply search filter to pipeline
    const filterDeal = (deal: Deal): boolean => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (
          !deal.title.toLowerCase().includes(q) &&
          !(deal.company || '').toLowerCase().includes(q)
        ) return false;
      }
      if (filterAccount && deal.accountId !== filterAccount) return false;
      return true;
    };

    return (
      <div className="space-y-4">
        {/* Main pipeline columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PIPELINE_STAGES.map(stage => {
            const stageDeals = (groupedDeals[stage] || []).filter(filterDeal);
            const c = STAGE_COLORS[stage];
            const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
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
                    {stageDeals.length}
                  </span>
                </div>

                {/* Stage total */}
                {stageTotal > 0 && (
                  <p className={`text-xs font-semibold mb-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {formatINR(stageTotal)}
                  </p>
                )}

                {/* Cards */}
                <div className="space-y-2">
                  {stageDeals.length === 0 ? (
                    <p className={`text-xs text-center py-6 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`}>
                      No deals
                    </p>
                  ) : (
                    stageDeals.map(deal => renderPipelineCard(deal))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Closed Won / Closed Lost summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TERMINAL_STAGES.map(stage => {
            const stageDeals = (groupedDeals[stage] || []).filter(filterDeal);
            const c = STAGE_COLORS[stage];
            const isWon = stage === 'Closed Won';
            const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
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
                      {stageDeals.length}
                    </span>
                  </div>
                  {stageTotal > 0 && (
                    <p className={`text-sm font-semibold ${
                      isWon
                        ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
                        : (isDark ? 'text-red-400' : 'text-red-600')
                    }`}>
                      {formatINR(stageTotal)}
                    </p>
                  )}
                </div>

                {stageDeals.length === 0 ? (
                  <p className={`text-xs ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                    No {stage.toLowerCase()} deals
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {stageDeals.slice(0, 6).map(deal => (
                      <div
                        key={deal.id}
                        onClick={() => openEditDealModal(deal)}
                        className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                          isDark
                            ? 'border-zinc-700 hover:bg-zinc-800/50'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <p className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {deal.title}
                        </p>
                        {deal.company && (
                          <p className={`text-[11px] truncate ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                            {deal.company}
                          </p>
                        )}
                        {deal.value ? (
                          <p className={`text-[11px] font-semibold ${
                            isWon
                              ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
                              : (isDark ? 'text-red-400' : 'text-red-600')
                          }`}>
                            {formatINR(deal.value)}
                          </p>
                        ) : null}
                      </div>
                    ))}
                    {stageDeals.length > 6 && (
                      <div className={`flex items-center justify-center p-2 rounded-lg border border-dashed ${
                        isDark ? 'border-zinc-700 text-zinc-500' : 'border-slate-200 text-slate-400'
                      }`}>
                        <p className="text-xs">+{stageDeals.length - 6} more</p>
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
  // Render: Create/Edit Deal Modal
  // ---------------------------------------------------------------------------

  const renderDealModal = () => {
    if (!showDealModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeDealModal} />
        <div className={`relative w-full max-w-2xl max-h-[85vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
          isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
        }`}>
          {/* Header */}
          <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {editingDealId ? 'Edit Deal' : 'New Deal'}
            </h2>
            <button
              onClick={closeDealModal}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleDealSubmit} className="flex-1 overflow-y-auto pb-20">
            <div className="p-6 space-y-5">
            {dealFormError && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {dealFormError}
              </div>
            )}

            {/* Row 1: Title (full width) */}
            <div>
              <label htmlFor="deal-title" className={labelClass}>
                Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  id="deal-title"
                  name="title"
                  type="text"
                  placeholder="Deal title"
                  value={dealFormData.title}
                  onChange={handleDealFormChange}
                  className={`${inputClass} pl-10`}
                  required
                />
              </div>
            </div>

            {/* Row 2: Company (full width) */}
            <div>
              <label htmlFor="deal-company" className={labelClass}>
                Company <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  id="deal-company"
                  name="company"
                  type="text"
                  placeholder="Company name"
                  value={dealFormData.company}
                  onChange={handleDealFormChange}
                  className={`${inputClass} pl-10`}
                  required
                />
              </div>
            </div>

            {/* Row 3: Value + Stage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deal-value" className={labelClass}>
                  Value (INR) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <IndianRupee className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="deal-value"
                    name="value"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={dealFormData.value || ''}
                    onChange={handleDealFormChange}
                    className={`${inputClass} pl-10`}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="deal-stage" className={labelClass}>Stage</label>
                <select
                  id="deal-stage"
                  name="stage"
                  value={dealFormData.stage}
                  onChange={handleDealFormChange}
                  className={selectClass}
                >
                  {DEAL_STAGES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Account + Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deal-accountId" className={labelClass}>Account</label>
                <select
                  id="deal-accountId"
                  name="accountId"
                  value={dealFormData.accountId}
                  onChange={handleDealFormChange}
                  className={selectClass}
                >
                  <option value="">Select account...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="deal-contactId" className={labelClass}>Contact</label>
                <select
                  id="deal-contactId"
                  name="contactId"
                  value={dealFormData.contactId}
                  onChange={handleDealFormChange}
                  className={selectClass}
                >
                  <option value="">Select contact...</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 5: Closing Date + Probability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deal-closingDate" className={labelClass}>Closing Date</label>
                <div className="relative">
                  <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="deal-closingDate"
                    name="closingDate"
                    type="date"
                    value={dealFormData.closingDate}
                    onChange={handleDealFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="deal-probability" className={labelClass}>Probability (%)</label>
                <div className="relative">
                  <Percent className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <input
                    id="deal-probability"
                    name="probability"
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={dealFormData.probability}
                    onChange={handleDealFormChange}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            {/* Row 6: Type + Forecast */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deal-type" className={labelClass}>Type</label>
                <select
                  id="deal-type"
                  name="type"
                  value={dealFormData.type}
                  onChange={handleDealFormChange}
                  className={selectClass}
                >
                  <option value="New Business">New Business</option>
                  <option value="Existing Business">Existing Business</option>
                  <option value="Renewal">Renewal</option>
                  <option value="Upsell">Upsell</option>
                </select>
              </div>
              <div>
                <label htmlFor="deal-forecast" className={labelClass}>Forecast</label>
                <select
                  id="deal-forecast"
                  name="forecast"
                  value={dealFormData.forecast}
                  onChange={handleDealFormChange}
                  className={selectClass}
                >
                  <option value="Pipeline">Pipeline</option>
                  <option value="Best Case">Best Case</option>
                  <option value="Commit">Commit</option>
                  <option value="Omitted">Omitted</option>
                </select>
              </div>
            </div>

            {/* Row 7: Lead Source + Next Step */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deal-leadSource" className={labelClass}>Lead Source</label>
                <select
                  id="deal-leadSource"
                  name="leadSource"
                  value={dealFormData.leadSource}
                  onChange={handleDealFormChange}
                  className={selectClass}
                >
                  <option value="">Select source...</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Event">Event</option>
                  <option value="Partner">Partner</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="deal-nextStep" className={labelClass}>Next Step</label>
                <input
                  id="deal-nextStep"
                  name="nextStep"
                  type="text"
                  placeholder="Next action to take"
                  value={dealFormData.nextStep}
                  onChange={handleDealFormChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Row 8: Description */}
            <div>
              <label htmlFor="deal-description" className={labelClass}>Description</label>
              <textarea
                id="deal-description"
                name="description"
                rows={3}
                placeholder="Deal description..."
                value={dealFormData.description}
                onChange={(e) => setDealFormData(prev => ({ ...prev, description: e.target.value }))}
                className={inputClass}
              />
            </div>

            </div>
            {/* Footer - sticky at bottom */}
            <div className={`sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t ${
              isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <button
                type="button"
                onClick={closeDealModal}
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
                  <><CheckCircle className="w-4 h-4" /> {editingDealId ? 'Update Deal' : 'Create Deal'}</>
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
            Deals Pipeline
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Track and manage deal opportunities through your sales pipeline
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
      {renderDealModal()}
    </div>
  );
};
