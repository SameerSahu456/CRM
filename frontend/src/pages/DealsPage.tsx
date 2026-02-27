import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus, Search, X, Edit2,
  Loader2, CheckCircle,
  TrendingUp, LayoutGrid, List,
  XCircle, User as UserIcon,
  Handshake, FileText, Briefcase,
  Snowflake,
  Download, Upload,
  Flag, Tag
} from 'lucide-react';
import { dealsApi, salesApi, formatINR, DEAL_LIST_FIELDS, DEAL_KANBAN_FIELDS } from '@/services/api';
import { exportToCsv } from '@/utils/exportCsv';
import { BulkImportModal } from '@/components/common/BulkImportModal';
import { KanbanBoard, type KanbanColumnConfig, wasRecentlyDragging } from '@/components/common/KanbanBoard';
import { useKanban } from '@/hooks/useKanban';
import { Deal, DealStage, PaginatedResponse } from '@/types';
import { Card, Button, Input, Select, Modal, Badge, DataTable, DataTableColumn } from '@/components/ui';
import { cx } from '@/utils/cx';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;
const DEAL_STAGES: DealStage[] = ['New', 'Proposal', 'Cold', 'Negotiation', 'Closed Won', 'Closed Lost'];

const STAGE_BADGE_VARIANT: Record<DealStage, 'cyan' | 'amber' | 'blue' | 'purple' | 'red' | 'emerald'> = {
  New: 'cyan',
  Proposal: 'amber',
  Cold: 'blue',
  Negotiation: 'purple',
  'Closed Lost': 'red',
  'Closed Won': 'emerald',
};

const STAGE_COLORS: Record<DealStage, {
  bg: string; text: string; darkBg: string; darkText: string;
  iconBg: string; darkIconBg: string; border: string; darkBorder: string;
}> = {
  New:            { bg: 'bg-cyan-50', text: 'text-cyan-700', darkBg: 'bg-cyan-900/30', darkText: 'text-cyan-400', iconBg: 'bg-cyan-100', darkIconBg: 'bg-cyan-900/20', border: 'border-cyan-200', darkBorder: 'border-cyan-800' },
  Proposal:       { bg: 'bg-amber-50', text: 'text-amber-700', darkBg: 'bg-amber-900/30', darkText: 'text-amber-400', iconBg: 'bg-amber-100', darkIconBg: 'bg-amber-900/20', border: 'border-amber-200', darkBorder: 'border-amber-800' },
  Cold:           { bg: 'bg-blue-50', text: 'text-blue-700', darkBg: 'bg-blue-900/30', darkText: 'text-blue-400', iconBg: 'bg-blue-100', darkIconBg: 'bg-blue-900/20', border: 'border-blue-200', darkBorder: 'border-blue-800' },
  Negotiation:    { bg: 'bg-purple-50', text: 'text-purple-700', darkBg: 'bg-purple-900/30', darkText: 'text-purple-400', iconBg: 'bg-purple-100', darkIconBg: 'bg-purple-900/20', border: 'border-purple-200', darkBorder: 'border-purple-800' },
  'Closed Lost':  { bg: 'bg-red-50', text: 'text-red-700', darkBg: 'bg-red-900/30', darkText: 'text-red-400', iconBg: 'bg-red-100', darkIconBg: 'bg-red-900/20', border: 'border-red-200', darkBorder: 'border-red-800' },
  'Closed Won':   { bg: 'bg-emerald-50', text: 'text-emerald-700', darkBg: 'bg-emerald-900/30', darkText: 'text-emerald-400', iconBg: 'bg-emerald-100', darkIconBg: 'bg-emerald-900/20', border: 'border-emerald-200', darkBorder: 'border-emerald-800' },
};

const KANBAN_COLUMNS: KanbanColumnConfig[] = DEAL_STAGES.map(stage => {
  const c = STAGE_COLORS[stage];
  return {
    id: stage,
    label: stage,
    dotColor: c.text.replace('text-', 'bg-'),
    icon: stage === 'Closed Won'
      ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      : stage === 'Closed Lost'
        ? <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
        : undefined,
  };
});

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

export const DealsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const canSeeAssignee = true;

  // Data state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('pipeline');

  // Pagination (table view)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const tableLoadedRef = useRef(false);
  const [tableError, setTableError] = useState('');

  // Overdue amount map
  const [dealOverdueMap, setDealOverdueMap] = useState<Record<string, number>>({});

  // Summarise modal
  const [showSummariseModal, setShowSummariseModal] = useState(false);
  const [summariseDeal, setSummariseDeal] = useState<Deal | null>(null);

  // Kanban search ref
  const kanbanSearchRef = useRef(searchTerm);
  useEffect(() => { kanbanSearchRef.current = searchTerm; }, [searchTerm]);

  // ---------------------------------------------------------------------------
  // Kanban hook
  // ---------------------------------------------------------------------------

  const kanban = useKanban<Deal>({
    stages: DEAL_STAGES as string[],
    fetchPage: useCallback(async (stage: string, page: number, limit: number) => {
      const params: Record<string, string> = {
        stage,
        page: String(page),
        limit: String(limit),
        fields: DEAL_KANBAN_FIELDS,
      };
      if (kanbanSearchRef.current) params.search = kanbanSearchRef.current;

      const res = await dealsApi.kanban(params);
      const data = res?.data ?? res;
      return {
        data: data.data || [],
        pagination: data.pagination || { page, limit, total: 0, hasNext: false },
      };
    }, []),
    fetchCounts: useCallback(async () => {
      const res = await dealsApi.stageCounts();
      return res?.data ?? res ?? {};
    }, []),
    onStageChange: useCallback(async (itemId: string, newStage: string) => {
      if (newStage === 'Closed Won') {
        navigate('/deals/view/' + itemId + '?action=closed-won');
        return;
      }
      await dealsApi.updateStage(itemId, newStage);
    }, [navigate]),
    onReorder: useCallback(async (stage: string, orderedIds: string[]) => {
      await dealsApi.reorder(stage, orderedIds);
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

  // Refresh kanban when search changes
  const prevSearchRef = useRef('');
  useEffect(() => {
    if (viewMode !== 'pipeline') return;
    if (prevSearchRef.current !== searchTerm) {
      prevSearchRef.current = searchTerm;
      const timer = setTimeout(() => {
        kanban.resetAndReload();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh data when returning to /deals
  useEffect(() => {
    if (location.pathname === '/deals') {
      if (viewMode === 'table') fetchDeals();
      else kanban.resetAndReload();
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Table data fetching
  // ---------------------------------------------------------------------------

  const fetchDeals = useCallback(async () => {
    if (!tableLoadedRef.current) setIsLoading(true);
    setTableError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (filterStage) params.stage = filterStage;
      if (searchTerm) params.search = searchTerm;
      params.fields = DEAL_LIST_FIELDS;

      const response: PaginatedResponse<Deal> = await dealsApi.list(params);
      setDeals(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);
      tableLoadedRef.current = true;
    } catch (err: any) {
      setTableError(err.message || 'Failed to load deals');
      setDeals([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterStage, searchTerm]);

  useEffect(() => {
    if (viewMode === 'table') fetchDeals();
  }, [viewMode, fetchDeals]);

  // Fetch overdue amounts
  useEffect(() => {
    if (deals.length === 0) { setDealOverdueMap({}); return; }
    (async () => {
      try {
        const res = await salesApi.list({ limit: '100', fields: 'id,dealId,paymentStatus,amount' });
        const entries: any[] = res?.data ?? res ?? [];
        const m: Record<string, number> = {};
        for (const e of entries) {
          if (e.dealId && e.paymentStatus !== 'paid') {
            m[e.dealId] = (m[e.dealId] || 0) + (Number(e.amount) || 0);
          }
        }
        setDealOverdueMap(m);
      } catch {
        // non-critical
      }
    })();
  }, [deals]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterStage, searchTerm]);

  // ---------------------------------------------------------------------------
  // Misc helpers
  // ---------------------------------------------------------------------------

  const clearFilters = () => {
    setFilterStage('');
    setSearchTerm('');
  };

  const hasActiveFilters = filterStage || searchTerm;

  // Compute deal summary counts from kanban counts
  const dealSummary = {
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
          <Input
            type="text"
            placeholder="Search deals..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Filter: Stage (only in table/list view) */}
        {viewMode === 'table' && (
          <div className="w-full lg:w-44">
            <Select
              value={filterStage}
              onChange={e => setFilterStage(e.target.value)}
            >
              <option value="">All Stages</option>
              {DEAL_STAGES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
        )}

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
          onClick={() => exportToCsv('deals', [
            { header: 'Company', accessor: (r: Deal) => r.company || r.accountName },
            { header: 'Contact Name', accessor: (r: Deal) => r.contactName },
            { header: 'Contact No', accessor: (r: Deal) => r.contactNo },
            { header: 'Designation', accessor: (r: Deal) => r.designation },
            { header: 'Email', accessor: (r: Deal) => r.email },
            { header: 'Location', accessor: (r: Deal) => r.location },
            { header: 'Requirement', accessor: (r: Deal) => r.requirement },
            { header: 'Quoted Requirement', accessor: (r: Deal) => r.quotedRequirement },
            { header: 'Value', accessor: (r: Deal) => r.value },
            { header: 'Stage', accessor: (r: Deal) => r.stage },
            { header: 'Type', accessor: (r: Deal) => r.tag },
            { header: 'Follow-up Date', accessor: (r: Deal) => r.nextFollowUp },
            { header: 'Closing Date', accessor: (r: Deal) => r.closingDate },
            { header: 'Type', accessor: (r: Deal) => r.type },
            { header: 'Forecast', accessor: (r: Deal) => r.forecast },
            { header: 'Lead Source', accessor: (r: Deal) => r.leadSource },
            ...(canSeeAssignee ? [{ header: 'Owner', accessor: (r: Deal) => r.ownerName }] : []),
            { header: 'Next Step', accessor: (r: Deal) => r.nextStep },
            { header: 'Description', accessor: (r: Deal) => r.description },
          ], deals)}
          disabled={deals.length === 0}
          icon={<Download className="w-4 h-4" />}
        >
          Export
        </Button>

        {/* New Deal */}
        <Button onClick={() => navigate('/deals/create')} icon={<Plus className="w-4 h-4" />} shine>
          New Deal
        </Button>
      </div>
    </Card>
  );

  // ---------------------------------------------------------------------------
  // Render: Table View
  // ---------------------------------------------------------------------------

  const renderTableView = () => {
    const dealColumns: DataTableColumn<Deal>[] = [
      {
        key: 'summarise',
        label: 'Summarise',
        shrink: true,
        align: 'center',
        render: (deal) => (
          <button
            onClick={(e) => { e.stopPropagation(); setSummariseDeal(deal); setShowSummariseModal(true); }}
            title="Summarise"
            className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:text-zinc-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20"
          >
            <FileText className="w-4 h-4" />
          </button>
        ),
      },
      {
        key: 'company',
        label: 'Company',
        render: (deal) => (
          <>
            <span className="font-medium">{deal.company || deal.accountName || '-'}</span>
            {deal.paymentFlag && <span title="Payment pending"><Flag className="w-3.5 h-3.5 text-red-500 fill-red-500 inline-block ml-1" /></span>}
          </>
        ),
      },
      {
        key: 'overdue',
        label: 'Overdue',
        render: (deal) => (
          dealOverdueMap[deal.id]
            ? <span className="font-medium text-red-600 dark:text-red-400">{formatINR(dealOverdueMap[deal.id])}</span>
            : <span className="text-gray-300 dark:text-zinc-600">-</span>
        ),
      },
      {
        key: 'contactName',
        label: 'Contact Name',
        render: (deal) => <>{deal.contactName || '-'}</>,
      },
      {
        key: 'contactNo',
        label: 'Contact No',
        render: (deal) => <>{deal.contactNo || '-'}</>,
      },
      {
        key: 'designation',
        label: 'Designation',
        render: (deal) => <>{deal.designation || '-'}</>,
      },
      {
        key: 'email',
        label: 'Email',
        render: (deal) => <>{deal.email || '-'}</>,
      },
      {
        key: 'location',
        label: 'Location',
        render: (deal) => <>{deal.location || '-'}</>,
      },
      {
        key: 'requirement',
        label: 'Requirement',
        render: (deal) => <>{deal.requirement || '-'}</>,
      },
      {
        key: 'quotedRequirement',
        label: 'Quoted Requirement',
        render: (deal) => <>{deal.quotedRequirement || '-'}</>,
      },
      {
        key: 'value',
        label: 'Value',
        render: (deal) => (
          <span className="font-semibold">{deal.value ? formatINR(deal.value) : '-'}</span>
        ),
      },
      {
        key: 'stage',
        label: 'Stage',
        render: (deal) => (
          <Badge variant={STAGE_BADGE_VARIANT[deal.stage] || 'gray'}>{deal.stage}</Badge>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        render: (deal) => <>{deal.type || '-'}</>,
      },
      {
        key: 'orderType',
        label: 'Order Type',
        render: (deal) => <>{deal.typeOfOrder || '-'}</>,
      },
      ...(canSeeAssignee ? [{
        key: 'assignee',
        label: 'Assignee',
        render: (deal: Deal) => <>{deal.ownerName || '-'}</>,
      }] : []),
      {
        key: 'followUpDate',
        label: 'Follow-up Date',
        render: (deal) => <>{deal.nextFollowUp ? formatDate(deal.nextFollowUp) : '-'}</>,
      },
    ];

    return (
      <DataTable<Deal>
        columns={dealColumns}
        data={deals}
        isLoading={isLoading}
        loadingMessage="Loading deals..."
        error={tableError}
        emptyIcon={<Briefcase className="w-8 h-8" />}
        emptyMessage={hasActiveFilters ? 'No deals match filters' : 'No deals yet'}
        onRowClick={(deal) => navigate('/deals/view/' + deal.id)}
        rowKey={(deal) => deal.id}
        showIndex
        page={page}
        pageSize={PAGE_SIZE}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems: totalRecords,
          pageSize: PAGE_SIZE,
          onPageChange: setPage,
        }}
      />
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Pipeline / Kanban Card
  // ---------------------------------------------------------------------------

  const renderKanbanCard = (deal: Deal) => (
    <div
      onClick={() => {
        if (!wasRecentlyDragging()) navigate('/deals/view/' + deal.id);
      }}
      className="p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all hover:shadow-md bg-white border-gray-200 hover:border-gray-300 dark:bg-dark-100 dark:border-zinc-700 dark:hover:border-zinc-600"
    >
      {/* Title & Edit */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-semibold truncate flex items-center gap-1 text-gray-900 dark:text-white">
          {deal.title || 'Untitled Deal'}
          {deal.paymentFlag && <span title="Payment pending"><Flag className="w-3.5 h-3.5 text-red-500 fill-red-500 flex-shrink-0" /></span>}
        </h4>
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/deals/edit/' + deal.id); }}
          className="p-1 rounded-lg flex-shrink-0 transition-colors text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:text-zinc-500 dark:hover:text-brand-400 dark:hover:bg-brand-900/20"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      </div>

      {/* Company Name */}
      {deal.accountName && (
        <p className="text-[11px] flex items-center gap-1 mb-1 text-gray-500 dark:text-zinc-400">
          <Briefcase className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{deal.accountName}</span>
        </p>
      )}

      {/* Contact */}
      {deal.contactName && (
        <p className="text-[11px] flex items-center gap-1 mb-1 text-gray-500 dark:text-zinc-400">
          <UserIcon className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{deal.contactName}</span>
        </p>
      )}

      {/* Value (hidden for New stage) */}
      {deal.value && deal.stage !== 'New' ? (
        <p className="text-xs font-semibold mb-1 text-emerald-600 dark:text-emerald-400">
          {formatINR(deal.value)}
        </p>
      ) : null}

      {/* Order Type */}
      {deal.typeOfOrder && (
        <Badge
          size="sm"
          variant={deal.typeOfOrder === 'New' ? 'blue' : deal.typeOfOrder === 'Rental' ? 'purple' : 'amber'}
          className="mb-1"
        >
          <Tag className="w-3 h-3 flex-shrink-0" />
          {deal.typeOfOrder}
        </Badge>
      )}

      {/* Assignee */}
      {deal.ownerName && (
        <p className="text-[11px] flex items-center gap-1 text-gray-400 dark:text-zinc-500">
          <UserIcon className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{deal.ownerName}</span>
        </p>
      )}

      {/* Reinitiate Sales Order for Closed Won */}
      {deal.stage === 'Closed Won' && (
        <div className="pt-2 mt-2 border-t border-dashed border-gray-200 dark:border-zinc-700">
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/deals/view/' + deal.id + '?action=closed-won'); }}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
          >
            <FileText className="w-3 h-3" />
            Reinitiate Sales Order
          </button>
        </div>
      )}
    </div>
  );

  const renderPipelineView = () => (
    <KanbanBoard<Deal>
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
            Deals
          </h1>
          <p className="text-sm mt-0.5 text-gray-500 dark:text-zinc-400">
            Track and manage deal opportunities through your sales stages
          </p>
        </div>
      </div>

      {/* Stage Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { icon: <Handshake className="w-5 h-5" />, count: dealSummary.total, label: 'Total', color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
          { icon: <Plus className="w-5 h-5" />, count: dealSummary.new, label: 'New', color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400' },
          { icon: <FileText className="w-5 h-5" />, count: dealSummary.proposal, label: 'Proposal', color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
          { icon: <Snowflake className="w-5 h-5" />, count: dealSummary.cold, label: 'Cold', color: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400' },
          { icon: <TrendingUp className="w-5 h-5" />, count: dealSummary.negotiation, label: 'Negotiation', color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' },
          { icon: <XCircle className="w-5 h-5" />, count: dealSummary.closedLost, label: 'Closed Lost', color: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' },
          { icon: <CheckCircle className="w-5 h-5" />, count: dealSummary.closedWon, label: 'Closed Won', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
        ].map(({ icon, count, label, color }) => (
          <Card key={label} padding="none" className="p-4 flex items-center gap-3">
            <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
              {icon}
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-gray-900 dark:text-white">{count}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{label}</p>
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
        entity="deals"
        entityLabel="Deals"
        onSuccess={() => fetchDeals()}
      />

      {/* Summarise Modal */}
      <Modal
        open={showSummariseModal && !!summariseDeal}
        onClose={() => setShowSummariseModal(false)}
        title="Deal Summary"
        size="lg"
      >
        {summariseDeal && (
          <div className="space-y-3">
            {[
              { label: 'Company', value: summariseDeal.company || summariseDeal.accountName },
              { label: 'Contact Name', value: summariseDeal.contactName },
              { label: 'Contact No', value: summariseDeal.contactNo },
              { label: 'Designation', value: summariseDeal.designation },
              { label: 'Email', value: summariseDeal.email },
              { label: 'Location', value: summariseDeal.location },
              { label: 'Stage', value: summariseDeal.stage },
              { label: 'Value', value: summariseDeal.value ? formatINR(summariseDeal.value) : undefined },
              { label: 'Type', value: summariseDeal.tag },
              { label: 'Requirement', value: summariseDeal.requirement },
              { label: 'Quoted Requirement', value: summariseDeal.quotedRequirement },
              { label: 'Follow-up Date', value: summariseDeal.nextFollowUp ? formatDate(summariseDeal.nextFollowUp) : undefined },
              { label: 'Description', value: summariseDeal.description },
              { label: 'Next Step', value: summariseDeal.nextStep },
            ].filter(item => item.value).map(item => (
              <div key={item.label} className="flex justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">{item.label}</span>
                <span className="text-sm text-right max-w-[60%] text-gray-700 dark:text-zinc-200">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};
