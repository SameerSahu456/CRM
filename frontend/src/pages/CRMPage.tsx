import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus, Search, X,
  Loader2, CheckCircle,
  Users, Target, TrendingUp,
  LayoutGrid, List,
  Clock, FileText, XCircle,
  Download, Upload, User as UserIcon,
} from 'lucide-react';
import { useDropdowns } from '@/contexts/DropdownsContext';
import { leadsApi, formatINR, LEAD_LIST_FIELDS, LEAD_KANBAN_FIELDS } from '@/services/api';
import { exportToCsv } from '@/utils/exportCsv';
import { Lead, LeadStage, PaginatedResponse } from '@/types';
import { BulkImportModal } from '@/components/common/BulkImportModal';
import { KanbanBoard, type KanbanColumnConfig, wasRecentlyDragging } from '@/components/common/KanbanBoard';
import { useKanban } from '@/hooks/useKanban';
import { Card, Button, Select, Modal, Badge, DataTable, DataTableColumn } from '@/components/ui';
import { inputStyles } from '@/components/ui';
import { cx } from '@/utils/cx';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

const LEAD_STAGES: LeadStage[] = ['New', 'Proposal', 'Cold', 'Negotiation', 'Closed Won', 'Closed Lost'];

const STAGE_BADGE_VARIANT: Record<LeadStage, 'cyan' | 'purple' | 'blue' | 'amber' | 'red' | 'emerald'> = {
  New: 'cyan',
  Proposal: 'purple',
  Cold: 'blue',
  Negotiation: 'amber',
  'Closed Lost': 'red',
  'Closed Won': 'emerald',
};

const STAGE_DOT_COLORS: Record<LeadStage, string> = {
  New: 'bg-cyan-500',
  Proposal: 'bg-purple-500',
  Cold: 'bg-blue-500',
  Negotiation: 'bg-amber-500',
  'Closed Lost': 'bg-red-500',
  'Closed Won': 'bg-emerald-500',
};

const PRIORITY_BADGE_VARIANT: Record<string, 'red' | 'amber' | 'green'> = {
  High: 'red',
  Medium: 'amber',
  Low: 'green',
};

const KANBAN_COLUMNS: KanbanColumnConfig[] = LEAD_STAGES.map(stage => ({
  id: stage,
  label: stage,
  dotColor: STAGE_DOT_COLORS[stage],
  icon: stage === 'Closed Won'
    ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
    : stage === 'Closed Lost'
      ? <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
      : undefined,
}));

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CRMPage: React.FC = () => {
  const { getOptions, getValues } = useDropdowns();
  const routerNavigate = useNavigate();
  const location = useLocation();

  const PRIORITIES = getValues('priorities');
  const SOURCES = getOptions('lead-sources');

  // Data state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('pipeline');

  // Pagination (table view)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterSource, setFilterSource] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const tableLoadedRef = useRef(false);
  const [tableError, setTableError] = useState('');

  // Summarise modal
  const [showSummariseModal, setShowSummariseModal] = useState(false);
  const [summariseLead, setSummariseLead] = useState<Lead | null>(null);

  // Kanban search (debounced ref for API calls)
  const kanbanSearchRef = useRef(searchTerm);
  const kanbanFilterPriorityRef = useRef(filterPriority);
  const kanbanFilterSourceRef = useRef(filterSource);

  // Keep refs in sync
  useEffect(() => {
    kanbanSearchRef.current = searchTerm;
    kanbanFilterPriorityRef.current = filterPriority;
    kanbanFilterSourceRef.current = filterSource;
  }, [searchTerm, filterPriority, filterSource]);

  // ---------------------------------------------------------------------------
  // Kanban hook
  // ---------------------------------------------------------------------------

  const kanban = useKanban<Lead>({
    stages: LEAD_STAGES as string[],
    fetchPage: useCallback(async (stage: string, page: number, limit: number) => {
      const params: Record<string, string> = {
        status: stage,
        page: String(page),
        limit: String(limit),
        fields: LEAD_KANBAN_FIELDS,
      };
      if (kanbanSearchRef.current) params.search = kanbanSearchRef.current;
      if (kanbanFilterPriorityRef.current) params.priority = kanbanFilterPriorityRef.current;
      if (kanbanFilterSourceRef.current) params.source = kanbanFilterSourceRef.current;

      const res = await leadsApi.kanban(params);
      const data = res?.data ?? res;
      return {
        data: data.data || [],
        pagination: data.pagination || { page, limit, total: 0, hasNext: false },
      };
    }, []),
    fetchCounts: useCallback(async () => {
      const res = await leadsApi.statusCounts();
      return res?.data ?? res ?? {};
    }, []),
    onStageChange: useCallback(async (itemId: string, newStage: string) => {
      // Intercept Closed Won
      if (newStage === 'Closed Won') {
        routerNavigate('/leads/view/' + itemId + '?action=closed-won');
        return;
      }
      await leadsApi.updateStatus(itemId, newStage);
    }, [routerNavigate]),
    onReorder: useCallback(async (stage: string, orderedIds: string[]) => {
      await leadsApi.reorder(stage, orderedIds);
    }, []),
  });

  // Initialize kanban on mount
  const kanbanInitRef = useRef(false);
  useEffect(() => {
    if (viewMode === 'pipeline' && !kanbanInitRef.current) {
      kanbanInitRef.current = true;
      kanban.initializeBoard();
    }
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh kanban when filters change
  const prevFiltersRef = useRef({ search: '', priority: '', source: '' });
  useEffect(() => {
    if (viewMode !== 'pipeline') return;
    const prev = prevFiltersRef.current;
    if (prev.search !== searchTerm || prev.priority !== filterPriority || prev.source !== filterSource) {
      prevFiltersRef.current = { search: searchTerm, priority: filterPriority, source: filterSource };
      // Debounce reset
      const timer = setTimeout(() => {
        kanban.resetAndReload();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, filterPriority, filterSource, viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh data when navigating back to /leads
  useEffect(() => {
    if (location.pathname === '/leads') {
      if (viewMode === 'table') fetchLeads();
      else kanban.resetAndReload();
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Table data fetching
  // ---------------------------------------------------------------------------

  const fetchLeads = useCallback(async () => {
    if (!tableLoadedRef.current) setIsLoading(true);
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
      params.fields = LEAD_LIST_FIELDS;

      const response: PaginatedResponse<Lead> = await leadsApi.list(params);
      setLeads(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);
      tableLoadedRef.current = true;
    } catch (err: any) {
      setTableError(err.message || 'Failed to load leads');
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterStage, filterPriority, filterSource, searchTerm]);

  useEffect(() => {
    if (viewMode === 'table') fetchLeads();
  }, [viewMode, fetchLeads]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterStage, filterPriority, filterSource, searchTerm]);

  // ---------------------------------------------------------------------------
  // Misc helpers
  // ---------------------------------------------------------------------------

  const clearFilters = () => {
    setFilterStage('');
    setFilterPriority('');
    setFilterSource('');
    setSearchTerm('');
  };

  const hasActiveFilters = filterStage || filterPriority || filterSource || searchTerm;

  // Compute summary counts from kanban counts
  const leadSummary = {
    total: Object.values(kanban.counts).reduce((a, b) => a + b, 0),
    new: kanban.counts['New'] || 0,
    proposal: kanban.counts['Proposal'] || 0,
    cold: kanban.counts['Cold'] || 0,
    negotiation: kanban.counts['Negotiation'] || 0,
    closedLost: kanban.counts['Closed Lost'] || 0,
    closedWon: kanban.counts['Closed Won'] || 0,
  };

  // ---------------------------------------------------------------------------
  // Render: Toolbar
  // ---------------------------------------------------------------------------

  const renderToolbar = () => (
    <Card padding="none" className="p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* View Toggle */}
        <div className="flex items-center rounded-xl border p-0.5 border-gray-200 bg-gray-50 dark:border-zinc-700 dark:bg-dark-100">
          <button
            onClick={() => setViewMode('table')}
            className={cx(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
              viewMode === 'table'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-white'
            )}
          >
            <List className="w-3.5 h-3.5" />
            List View
          </button>
          <button
            onClick={() => setViewMode('pipeline')}
            className={cx(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
              viewMode === 'pipeline'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-white'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Kanban Board
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            placeholder="Search by company name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={cx(inputStyles, 'pl-10')}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
        </div>

        {/* Filter: Stage (only in table/list view) */}
        {viewMode === 'table' && (
          <div className="w-full lg:w-40">
            <Select value={filterStage} onChange={e => setFilterStage(e.target.value)}>
              <option value="">All Stages</option>
              {LEAD_STAGES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
        )}

        {/* Filter: Priority */}
        <div className="w-full lg:w-36">
          <Select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </div>

        {/* Filter: Source */}
        <div className="w-full lg:w-36">
          <Select value={filterSource} onChange={e => setFilterSource(e.target.value)}>
            <option value="">All Sources</option>
            {SOURCES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} icon={<X className="w-3.5 h-3.5" />}>
            Clear
          </Button>
        )}

        {/* Bulk Import */}
        <Button variant="secondary" size="sm" onClick={() => setShowBulkImport(true)} icon={<Upload className="w-4 h-4" />}>
          Import
        </Button>

        {/* Export CSV */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => exportToCsv('leads', [
            { header: 'Company', accessor: (r: Lead) => r.companyName },
            { header: 'Contact Person', accessor: (r: Lead) => r.contactPerson },
            { header: 'Email', accessor: (r: Lead) => r.email },
            { header: 'Phone', accessor: (r: Lead) => r.phone },
            { header: 'Designation', accessor: (r: Lead) => (r as any).designation },
            { header: 'Location', accessor: (r: Lead) => (r as any).location },
            { header: 'Source', accessor: (r: Lead) => r.source },
            { header: 'Requirement', accessor: (r: Lead) => r.requirement },
            { header: 'Quoted Requirement', accessor: (r: Lead) => r.quotedRequirement },
            { header: 'Estimated Value', accessor: (r: Lead) => r.estimatedValue },
            { header: 'Stage', accessor: (r: Lead) => r.stage },
            { header: 'Type', accessor: (r: Lead) => (r as any).tag },
            { header: 'Product Interest', accessor: (r: Lead) => r.productInterest },
            { header: 'Next Follow-up', accessor: (r: Lead) => r.nextFollowUp },
            { header: 'Expected Close', accessor: (r: Lead) => r.expectedCloseDate },
            { header: 'Assigned To', accessor: (r: Lead) => r.assignedTo },
            { header: 'Notes', accessor: (r: Lead) => r.notes },
          ], leads)}
          disabled={leads.length === 0}
          icon={<Download className="w-4 h-4" />}
        >
          Export
        </Button>

        {/* New Lead */}
        <Button variant="primary" size="sm" shine onClick={() => routerNavigate('/leads/create')} icon={<Plus className="w-4 h-4" />}>
          New Lead
        </Button>
      </div>
    </Card>
  );

  // ---------------------------------------------------------------------------
  // Render: Table View
  // ---------------------------------------------------------------------------

  const leadColumns: DataTableColumn<Lead>[] = [
    {
      key: 'summarise',
      label: 'Summarise',
      shrink: true,
      align: 'center',
      render: (lead) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSummariseLead(lead); setShowSummariseModal(true); }}
          title="Summarise"
          className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:text-zinc-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20"
        >
          <FileText className="w-4 h-4" />
        </button>
      ),
    },
    {
      key: 'companyName',
      label: 'Company',
      render: (lead) => <span className="font-medium">{lead.companyName}</span>,
    },
    {
      key: 'contactPerson',
      label: 'Contact Name',
      render: (lead) => <>{lead.contactPerson || '-'}</>,
    },
    {
      key: 'phone',
      label: 'Contact No',
      render: (lead) => <>{lead.phone || '-'}</>,
    },
    {
      key: 'designation',
      label: 'Designation',
      render: (lead) => <>{(lead as any).designation || '-'}</>,
    },
    {
      key: 'email',
      label: 'Email',
      render: (lead) => <>{lead.email || '-'}</>,
    },
    {
      key: 'location',
      label: 'Location',
      render: (lead) => <>{(lead as any).location || '-'}</>,
    },
    {
      key: 'source',
      label: 'Source',
      render: (lead) => <span className="capitalize">{lead.source || '-'}</span>,
    },
    {
      key: 'requirement',
      label: 'Requirement',
      render: (lead) => <>{lead.requirement || '-'}</>,
    },
    {
      key: 'quotedRequirement',
      label: 'Quoted Requirement',
      render: (lead) => <>{lead.quotedRequirement || '-'}</>,
    },
    {
      key: 'estimatedValue',
      label: 'Value',
      render: (lead) => <>{lead.estimatedValue ? formatINR(lead.estimatedValue) : '-'}</>,
    },
    {
      key: 'stage',
      label: 'Stage',
      render: (lead) => <Badge variant={STAGE_BADGE_VARIANT[lead.stage] || 'gray'}>{lead.stage}</Badge>,
    },
    {
      key: 'tag',
      label: 'Type',
      render: (lead) => (
        <>
          {(lead as any).tag ? (
            <Badge variant={(lead as any).tag === 'Channel' ? 'cyan' : 'purple'}>
              {(lead as any).tag}
            </Badge>
          ) : '-'}
        </>
      ),
    },
    {
      key: 'assignee',
      label: 'Assignee',
      render: (lead) => <>{(lead as any).assignedToName || '-'}</>,
    },
    {
      key: 'nextFollowUp',
      label: 'Follow-up Date',
      render: (lead) => <>{lead.nextFollowUp ? formatDate(lead.nextFollowUp) : '-'}</>,
    },
  ];

  const renderTableView = () => (
    <DataTable<Lead>
      columns={leadColumns}
      data={leads}
      isLoading={isLoading}
      loadingMessage="Loading leads..."
      error={tableError}
      emptyIcon={<Users className="w-8 h-8" />}
      emptyMessage={hasActiveFilters ? 'No leads match filters' : 'No leads yet'}
      onRowClick={(lead) => routerNavigate('/leads/view/' + lead.id)}
      rowKey={(lead) => lead.id}
      showIndex
      page={page}
      pageSize={PAGE_SIZE}
      pagination={totalRecords > 0 ? {
        currentPage: page,
        totalPages,
        totalItems: totalRecords,
        pageSize: PAGE_SIZE,
        onPageChange: setPage,
      } : undefined}
    />
  );

  // ---------------------------------------------------------------------------
  // Render: Pipeline / Kanban View
  // ---------------------------------------------------------------------------

  const renderKanbanCard = (lead: Lead) => (
    <div
      onClick={() => {
        if (!wasRecentlyDragging()) routerNavigate('/leads/view/' + lead.id);
      }}
      className="p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all hover:shadow-md bg-white border-gray-200 hover:border-gray-300 dark:bg-dark-100 dark:border-zinc-700 dark:hover:border-zinc-600"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold truncate text-gray-900 dark:text-white">
          {lead.companyName}
        </h4>
        <Badge variant={PRIORITY_BADGE_VARIANT[lead.priority] || 'green'} size="sm">{lead.priority}</Badge>
      </div>

      {lead.contactPerson && (
        <p className="text-xs mb-1.5 flex items-center gap-1 text-gray-500 dark:text-zinc-400">
          <UserIcon className="w-3 h-3" />
          {lead.contactPerson}
        </p>
      )}

      {lead.estimatedValue && lead.stage !== 'New' ? (
        <p className="text-xs font-semibold mb-1.5 text-emerald-600 dark:text-emerald-400">
          {formatINR(lead.estimatedValue)}
        </p>
      ) : null}

      {lead.nextFollowUp && (
        <p className="text-[11px] flex items-center gap-1 text-gray-400 dark:text-zinc-500">
          <Clock className="w-3 h-3" />
          {formatDate(lead.nextFollowUp)}
        </p>
      )}
    </div>
  );

  const renderPipelineView = () => (
    <KanbanBoard<Lead>
      columns={KANBAN_COLUMNS}
      columnStates={kanban.columnStates}
      counts={kanban.counts}
      renderCard={renderKanbanCard}
      onLoadMore={kanban.loadMore}
      onMoveAcross={(itemId, fromCol, toCol, targetIndex) => kanban.moveAcross(itemId, fromCol, toCol, targetIndex)}
      onReorder={kanban.reorderColumn}
    />
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-gray-900 dark:text-white">
            Leads
          </h1>
          <p className="text-sm mt-0.5 text-gray-500 dark:text-zinc-400">
            Manage leads, track progress, and convert opportunities
          </p>
        </div>
      </div>

      {/* Stage Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total', count: leadSummary.total, icon: <Users className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
          { label: 'New', count: leadSummary.new, icon: <Plus className="w-5 h-5" />, color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400' },
          { label: 'Proposal', count: leadSummary.proposal, icon: <TrendingUp className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' },
          { label: 'Cold', count: leadSummary.cold, icon: <Target className="w-5 h-5" />, color: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400' },
          { label: 'Negotiation', count: leadSummary.negotiation, icon: <Clock className="w-5 h-5" />, color: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' },
          { label: 'Closed Lost', count: leadSummary.closedLost, icon: <XCircle className="w-5 h-5" />, color: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' },
          { label: 'Closed Won', count: leadSummary.closedWon, icon: <CheckCircle className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
        ].map(item => (
          <Card key={item.label} padding="sm" className="flex items-center gap-3">
            <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', item.color)}>
              {item.icon}
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-gray-900 dark:text-white">{item.count}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{item.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      {renderToolbar()}

      {/* Content */}
      {viewMode === 'table' ? renderTableView() : renderPipelineView()}

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        entity="leads"
        entityLabel="Leads"
        onSuccess={() => fetchLeads()}
      />

      {/* Summarise Modal */}
      {showSummariseModal && summariseLead && (
        <Modal
          open={showSummariseModal}
          onClose={() => setShowSummariseModal(false)}
          title="Lead Summary"
          size="md"
        >
          <div className="space-y-3">
            {[
              { label: 'Company', value: summariseLead.companyName },
              { label: 'Contact Name', value: summariseLead.contactPerson },
              { label: 'Contact No', value: summariseLead.phone },
              { label: 'Designation', value: (summariseLead as any).designation },
              { label: 'Email', value: summariseLead.email },
              { label: 'Location', value: (summariseLead as any).location },
              { label: 'Stage', value: summariseLead.stage },
              { label: 'Value', value: summariseLead.estimatedValue ? formatINR(summariseLead.estimatedValue) : undefined },
              { label: 'Source', value: summariseLead.source },
              { label: 'Type', value: (summariseLead as any).tag },
              { label: 'Requirement', value: summariseLead.requirement },
              { label: 'Quoted Requirement', value: summariseLead.quotedRequirement },
              { label: 'Follow-up Date', value: summariseLead.nextFollowUp ? formatDate(summariseLead.nextFollowUp) : undefined },
              { label: 'Notes', value: summariseLead.notes },
            ].filter(item => item.value).map(item => (
              <div key={item.label} className="flex justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">{item.label}</span>
                <span className="text-sm text-right max-w-[60%] text-gray-700 dark:text-zinc-200">{item.value}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};
