import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, Edit2, Trash2,
  Loader2, AlertCircle, CheckCircle, Shield, Clock, Calendar,
  Package, Hash, FileText, User as UserIcon, AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { carepacksApi, partnersApi } from '@/services/api';
import { Carepack, Partner, PaginatedResponse } from '@/types';
import { Card, Button, Input, Select, Modal, Badge, Alert, Textarea, DataTable, DataTableColumn } from '@/components/ui';
import { cx } from '@/utils/cx';

// ---------------------------------------------------------------------------
// Types local to this page
// ---------------------------------------------------------------------------

type TabKey = 'all' | 'expiring';

interface CarepackFormData {
  partnerId: string;
  customerName: string;
  productType: string;
  serialNumber: string;
  carepackSku: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled';
  notes: string;
}

const EMPTY_FORM: CarepackFormData = {
  partnerId: '',
  customerName: '',
  productType: '',
  serialNumber: '',
  carepackSku: '',
  startDate: '',
  endDate: '',
  status: 'active',
  notes: '',
};

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusVariant(status: string): 'success' | 'error' | 'gray' {
  switch (status) {
    case 'active':
      return 'success';
    case 'expired':
      return 'error';
    case 'cancelled':
      return 'gray';
    default:
      return 'gray';
  }
}

function formatDate(dateStr: string | undefined): string {
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

function capitalize(s: string): string {
  if (!s) return '-';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getDaysRemaining(endDate: string | undefined): number | null {
  if (!endDate) return null;
  try {
    const end = new Date(endDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function daysRemainingVariant(days: number | null): 'gray' | 'error' | 'warning' | 'success' {
  if (days === null) return 'gray';
  if (days < 0) return 'error';
  if (days <= 30) return 'error';
  if (days <= 90) return 'warning';
  return 'success';
}

function getDaysLabel(days: number | null): string {
  if (days === null) return '-';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Expires today';
  if (days === 1) return '1 day left';
  return `${days}d left`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CarepackPage: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab: navigate } = useNavigation();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  // All Carepacks tab state
  const [carepacks, setCarepacks] = useState<Carepack[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPartner, setFilterPartner] = useState('');

  // Expiring tab state
  const [expiringCarepacks, setExpiringCarepacks] = useState<Carepack[]>([]);
  const [expiringLoading, setExpiringLoading] = useState(false);
  const [expiringError, setExpiringError] = useState('');

  // Dropdown data
  const [partners, setPartners] = useState<Partner[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [tableError, setTableError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CarepackFormData>({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailCarepack, setDetailCarepack] = useState<Carepack | null>(null);

  // Summary counts
  const [totalActive, setTotalActive] = useState(0);
  const [expiringThisMonth, setExpiringThisMonth] = useState(0);
  const [totalExpired, setTotalExpired] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchCarepacks = useCallback(async () => {
    setIsLoading(true);
    setTableError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (filterStatus) params.status = filterStatus;
      if (filterPartner) params.partnerId = filterPartner;
      if (searchTerm) params.search = searchTerm;

      const response: PaginatedResponse<Carepack> = await carepacksApi.list(params);
      setCarepacks(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);
    } catch (err: any) {
      setTableError(err.message || 'Failed to load carepacks');
      setCarepacks([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterStatus, filterPartner, searchTerm]);

  const fetchSummaryCounts = useCallback(async () => {
    try {
      const [allRes, activeRes, expiredRes] = await Promise.all([
        carepacksApi.list({ limit: '1' }),
        carepacksApi.list({ limit: '1', status: 'active' }),
        carepacksApi.list({ limit: '1', status: 'expired' }),
      ]);
      setTotalCount((allRes as PaginatedResponse<Carepack>).pagination.total);
      setTotalActive((activeRes as PaginatedResponse<Carepack>).pagination.total);
      setTotalExpired((expiredRes as PaginatedResponse<Carepack>).pagination.total);
    } catch {
      // Summary counts are non-critical
    }

    try {
      const expiring: Carepack[] = await carepacksApi.expiring();
      setExpiringThisMonth(Array.isArray(expiring) ? expiring.length : 0);
    } catch {
      // Non-critical
    }
  }, []);

  const fetchExpiringCarepacks = useCallback(async () => {
    setExpiringLoading(true);
    setExpiringError('');
    try {
      const data: Carepack[] = await carepacksApi.expiring();
      const sorted = (Array.isArray(data) ? data : []).sort((a, b) => {
        if (!a.endDate) return 1;
        if (!b.endDate) return -1;
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      });
      setExpiringCarepacks(sorted);
    } catch (err: any) {
      setExpiringError(err.message || 'Failed to load expiring carepacks');
      setExpiringCarepacks([]);
    } finally {
      setExpiringLoading(false);
    }
  }, []);

  const fetchDropdownData = useCallback(async () => {
    try {
      const partnersResponse = await partnersApi.list({ limit: '100', status: 'approved' });
      const partnerData = (partnersResponse as PaginatedResponse<Partner>)?.data ?? partnersResponse;
      setPartners(Array.isArray(partnerData) ? partnerData : []);
    } catch {
      // Dropdown data failure is non-critical
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDropdownData();
    fetchSummaryCounts();
  }, [fetchDropdownData, fetchSummaryCounts]);

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'all') {
      fetchCarepacks();
    } else if (activeTab === 'expiring') {
      fetchExpiringCarepacks();
    }
  }, [activeTab, fetchCarepacks, fetchExpiringCarepacks]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterStatus, filterPartner, searchTerm]);

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  const openCreateModal = () => {
    setFormData({ ...EMPTY_FORM });
    setEditingId(null);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (carepack: Carepack) => {
    setFormData({
      partnerId: carepack.partnerId || '',
      customerName: carepack.customerName || '',
      productType: carepack.productType || '',
      serialNumber: carepack.serialNumber || '',
      carepackSku: carepack.carepackSku || '',
      startDate: carepack.startDate ? carepack.startDate.split('T')[0] : '',
      endDate: carepack.endDate ? carepack.endDate.split('T')[0] : '',
      status: carepack.status || 'active',
      notes: carepack.notes || '',
    });
    setEditingId(carepack.id);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormError('');
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.customerName.trim()) {
      setFormError('Account name is required');
      return;
    }
    if (!formData.serialNumber.trim()) {
      setFormError('Serial number is required');
      return;
    }
    if (!formData.startDate) {
      setFormError('Start date is required');
      return;
    }
    if (!formData.endDate) {
      setFormError('End date is required');
      return;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setFormError('End date must be after start date');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await carepacksApi.update(editingId, formData);
      } else {
        await carepacksApi.create(formData);
      }

      closeModal();
      if (activeTab === 'all') fetchCarepacks();
      if (activeTab === 'expiring') fetchExpiringCarepacks();
      fetchSummaryCounts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save carepack');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await carepacksApi.delete(id);
      setDeleteConfirmId(null);
      if (activeTab === 'all') fetchCarepacks();
      if (activeTab === 'expiring') fetchExpiringCarepacks();
      fetchSummaryCounts();
    } catch (err: any) {
      setTableError(err.message || 'Failed to delete carepack');
    }
  };

  const clearFilters = () => {
    setFilterStatus('');
    setFilterPartner('');
    setSearchTerm('');
  };

  const hasActiveFilters = filterStatus || filterPartner || searchTerm;

  // ---------------------------------------------------------------------------
  // Detail modal handlers
  // ---------------------------------------------------------------------------

  const openDetailModal = (carepack: Carepack) => {
    setDetailCarepack(carepack);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailCarepack(null);
  };

  // ---------------------------------------------------------------------------
  // Column definitions
  // ---------------------------------------------------------------------------

  const allCarepackColumns: DataTableColumn<Carepack>[] = [
    {
      key: 'account',
      label: 'Account',
      width: '12%',
      render: (cp) => (
        <span className="font-medium text-gray-900 dark:text-white">{cp.partnerName || '-'}</span>
      ),
    },
    {
      key: 'accountName',
      label: 'Account Name',
      width: '13%',
      render: (cp) => <>{cp.customerName || '-'}</>,
    },
    {
      key: 'productType',
      label: 'Product Type',
      width: '11%',
      render: (cp) => <>{cp.productType || '-'}</>,
    },
    {
      key: 'serialNumber',
      label: 'Serial #',
      width: '12%',
      render: (cp) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Hash className="w-3 h-3 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
          <span className="font-mono text-xs">{cp.serialNumber || '-'}</span>
        </div>
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      width: '10%',
      className: 'whitespace-nowrap font-mono text-xs',
      render: (cp) => <>{cp.carepackSku || '-'}</>,
    },
    {
      key: 'startDate',
      label: 'Start Date',
      width: '10%',
      className: 'whitespace-nowrap',
      render: (cp) => <>{formatDate(cp.startDate)}</>,
    },
    {
      key: 'endDate',
      label: 'End Date',
      width: '10%',
      className: 'whitespace-nowrap',
      render: (cp) => <>{formatDate(cp.endDate)}</>,
    },
    {
      key: 'status',
      label: 'Status',
      width: '8%',
      render: (cp) => (
        <Badge variant={statusVariant(cp.status)}>
          {capitalize(cp.status)}
        </Badge>
      ),
    },
    {
      key: 'daysLeft',
      label: 'Days Left',
      width: '8%',
      render: (cp) => {
        const days = cp.status === 'active' ? getDaysRemaining(cp.endDate) : null;
        return cp.status === 'active' ? (
          <Badge variant={daysRemainingVariant(days)}>
            {getDaysLabel(days)}
          </Badge>
        ) : (
          <span className="text-xs text-gray-400 dark:text-zinc-500">-</span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '6%',
      render: (cp) => renderActions(cp),
    },
  ];

  const expiringColumns: DataTableColumn<Carepack>[] = [
    {
      key: 'account',
      label: 'Account',
      width: '16%',
      render: (cp) => {
        const days = getDaysRemaining(cp.endDate);
        const isUrgent = days !== null && days <= 7;
        return (
          <div className="flex items-center gap-2.5">
            <div className={cx(
              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
              isUrgent
                ? 'bg-red-50 dark:bg-red-900/20'
                : 'bg-amber-50 dark:bg-amber-900/20'
            )}>
              <AlertTriangle className={cx(
                'w-4 h-4',
                isUrgent
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-amber-600 dark:text-amber-400'
              )} />
            </div>
            <span className="font-medium text-gray-900 dark:text-white">{cp.partnerName || '-'}</span>
          </div>
        );
      },
    },
    {
      key: 'accountName',
      label: 'Account Name',
      width: '14%',
      render: (cp) => <>{cp.customerName || '-'}</>,
    },
    {
      key: 'productType',
      label: 'Product Type',
      width: '13%',
      render: (cp) => <>{cp.productType || '-'}</>,
    },
    {
      key: 'serialNumber',
      label: 'Serial #',
      width: '13%',
      render: (cp) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Hash className="w-3 h-3 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
          <span className="font-mono text-xs">{cp.serialNumber || '-'}</span>
        </div>
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      width: '11%',
      className: 'whitespace-nowrap font-mono text-xs',
      render: (cp) => <>{cp.carepackSku || '-'}</>,
    },
    {
      key: 'endDate',
      label: 'End Date',
      width: '13%',
      className: 'whitespace-nowrap',
      render: (cp) => {
        const days = getDaysRemaining(cp.endDate);
        const isUrgent = days !== null && days <= 7;
        return (
          <div className="flex items-center gap-2">
            <Calendar className={cx(
              'w-3.5 h-3.5 flex-shrink-0',
              isUrgent
                ? 'text-red-500 dark:text-red-400'
                : 'text-gray-400 dark:text-zinc-500'
            )} />
            {formatDate(cp.endDate)}
          </div>
        );
      },
    },
    {
      key: 'daysLeft',
      label: 'Days Left',
      width: '10%',
      render: (cp) => {
        const days = getDaysRemaining(cp.endDate);
        return (
          <Badge variant={daysRemainingVariant(days)}>
            {getDaysLabel(days)}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '10%',
      render: (cp) => renderActions(cp),
    },
  ];

  // ---------------------------------------------------------------------------
  // Action buttons renderer (shared between tabs)
  // ---------------------------------------------------------------------------

  const renderActions = (carepack: Carepack) => (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="xs"
        onClick={(e) => { e.stopPropagation(); openEditModal(carepack); }}
        title="Edit"
        className="text-gray-400 hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400"
      >
        <Edit2 className="w-4 h-4" />
      </Button>

      {deleteConfirmId === carepack.id ? (
        <div className="flex items-center gap-1">
          <Button
            variant="danger"
            size="xs"
            onClick={(e) => { e.stopPropagation(); handleDelete(carepack.id); }}
          >
            Confirm
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="xs"
          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(carepack.id); }}
          title="Delete"
          className="text-gray-400 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: All Carepacks Tab
  // ---------------------------------------------------------------------------

  const renderAllCarepacks = () => (
    <>
      {/* Toolbar: Search + Filters + New Carepack */}
      <Card padding="none" className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <Input
              type="text"
              placeholder="Search by account name or serial number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Filter: Status */}
          <div className="w-full lg:w-44">
            <Select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>

          {/* Filter: Partner */}
          <div className="w-full lg:w-48">
            <Select
              value={filterPartner}
              onChange={e => setFilterPartner(e.target.value)}
            >
              <option value="">All Partners</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.companyName}</option>
              ))}
            </Select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="md" onClick={clearFilters} icon={<X className="w-3.5 h-3.5" />}>
              Clear
            </Button>
          )}

          {/* New Carepack */}
          <Button
            variant="primary"
            size="md"
            onClick={openCreateModal}
            icon={<Plus className="w-4 h-4" />}
            shine
            className="whitespace-nowrap"
          >
            New Carepack
          </Button>
        </div>
      </Card>

      {/* Data Table */}
      <DataTable<Carepack>
        columns={allCarepackColumns}
        data={carepacks}
        isLoading={isLoading}
        loadingMessage="Loading carepacks..."
        error={tableError}
        emptyIcon={<Shield className="w-7 h-7" />}
        emptyMessage={hasActiveFilters ? 'No carepacks match your filters' : 'No carepacks yet'}
        onRowClick={(cp) => openDetailModal(cp)}
        rowKey={(cp) => cp.id}
        pagination={totalRecords > 0 ? {
          currentPage: page,
          totalPages,
          totalItems: totalRecords,
          pageSize: PAGE_SIZE,
          onPageChange: setPage,
        } : undefined}
        minWidth={900}
      />
    </>
  );

  // ---------------------------------------------------------------------------
  // Render: Expiring Soon Tab
  // ---------------------------------------------------------------------------

  const renderExpiringTab = () => (
    <Card padding="none" className="overflow-hidden">
      {expiringError && (
        <div className="m-4">
          <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
            {expiringError}
          </Alert>
        </div>
      )}

      {expiringLoading ? (
        renderLoadingState('Loading expiring carepacks...')
      ) : expiringCarepacks.length === 0 ? (
        renderEmptyState(
          'No carepacks expiring soon',
          'All active carepacks have more than 30 days remaining'
        )
      ) : (
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr className="border-b border-gray-100 dark:border-zinc-800">
                {['Account', 'Account Name', 'Product Type', 'Serial #', 'SKU', 'End Date', 'Days Left', 'Actions'].map((h, i) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 resizable-th"
                    style={{ width: expColWidths[i] }}
                  >
                    {h}
                    <div className="col-resize-handle" onMouseDown={e => onExpMouseDown(i, e)} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expiringCarepacks.map(cp => {
                const days = getDaysRemaining(cp.endDate);
                const isUrgent = days !== null && days <= 7;
                return (
                  <tr
                    key={cp.id}
                    onClick={() => openDetailModal(cp)}
                    className={cx(
                      'border-b transition-colors cursor-pointer',
                      isUrgent
                        ? 'border-gray-50 dark:border-zinc-800/50 bg-red-50/40 dark:bg-red-900/10 hover:bg-red-50/70 dark:hover:bg-red-900/20'
                        : 'border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50/80 dark:hover:bg-zinc-800/30'
                    )}
                  >
                    {/* Partner */}
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className={cx(
                          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                          isUrgent
                            ? 'bg-red-50 dark:bg-red-900/20'
                            : 'bg-amber-50 dark:bg-amber-900/20'
                        )}>
                          <AlertTriangle className={cx(
                            'w-4 h-4',
                            isUrgent
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                          )} />
                        </div>
                        <span className="font-medium">{cp.partnerName || '-'}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">
                      {cp.customerName || '-'}
                    </td>

                    {/* Product Type */}
                    <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">
                      {cp.productType || '-'}
                    </td>

                    {/* Serial # */}
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3 h-3 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
                        <span className="font-mono text-xs">{cp.serialNumber || '-'}</span>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-700 dark:text-zinc-300">
                      {cp.carepackSku || '-'}
                    </td>

                    {/* End Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-zinc-300">
                      <div className="flex items-center gap-2">
                        <Calendar className={cx(
                          'w-3.5 h-3.5 flex-shrink-0',
                          isUrgent
                            ? 'text-red-500 dark:text-red-400'
                            : 'text-gray-400 dark:text-zinc-500'
                        )} />
                        {formatDate(cp.endDate)}
                      </div>
                    </td>

                    {/* Days Left */}
                    <td className="px-4 py-3">
                      <Badge variant={daysRemainingVariant(days)}>
                        {getDaysLabel(days)}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {renderActions(cp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active */}
        <Card hover padding="none" className="p-4 animate-fade-in-up stagger-1" onClick={() => navigate('carepacks')}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-emerald-50 dark:bg-emerald-900/20">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400">Total Active</p>
          <p className="text-xl font-bold mt-0.5 text-gray-900 dark:text-white">
            {totalActive}
          </p>
        </Card>

        {/* Expiring This Month */}
        <Card hover padding="none" className="p-4 animate-fade-in-up stagger-2" onClick={() => navigate('carepacks')}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-amber-50 dark:bg-amber-900/20">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400">Expiring Soon</p>
          <p className="text-xl font-bold mt-0.5 text-gray-900 dark:text-white">
            {expiringThisMonth}
          </p>
        </Card>

        {/* Total Expired */}
        <Card hover padding="none" className="p-4 animate-fade-in-up stagger-3" onClick={() => navigate('carepacks')}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-red-50 dark:bg-red-900/20">
            <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400">Total Expired</p>
          <p className="text-xl font-bold mt-0.5 text-gray-900 dark:text-white">
            {totalExpired}
          </p>
        </Card>

        {/* Total Carepacks */}
        <Card hover padding="none" className="p-4 animate-fade-in-up stagger-4" onClick={() => navigate('carepacks')}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-brand-50 dark:bg-brand-900/20">
            <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400">Total Carepacks</p>
          <p className="text-xl font-bold mt-0.5 text-gray-900 dark:text-white">
            {totalCount}
          </p>
        </Card>
      </div>

      {/* Tab Navigation */}
      <Card padding="none" className="p-1 inline-flex rounded-xl">
        {[
          { key: 'all' as TabKey, label: 'All Carepacks', icon: Shield },
          { key: 'expiring' as TabKey, label: 'Expiring Soon', icon: AlertTriangle },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cx(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.key === 'expiring' && expiringThisMonth > 0 && (
                <span className={cx(
                  'ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                )}>
                  {expiringThisMonth}
                </span>
              )}
            </button>
          );
        })}
      </Card>

      {/* Tab Content */}
      {activeTab === 'all' && renderAllCarepacks()}
      {activeTab === 'expiring' && renderExpiringTab()}

      {/* Detail Modal */}
      {(() => {
        if (!showDetailModal || !detailCarepack) return null;
        const days = detailCarepack.status === 'active' ? getDaysRemaining(detailCarepack.endDate) : null;
        return (
          <Modal
            open={showDetailModal}
            onClose={closeDetailModal}
            title="Carepack Details"
            size="lg"
          >
            <div className="space-y-6">
              {/* Status badge next to header area */}
              <div className="flex items-center gap-3 -mt-2">
                <Badge variant={statusVariant(detailCarepack.status)}>
                  {capitalize(detailCarepack.status)}
                </Badge>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => { closeDetailModal(); openEditModal(detailCarepack); }}
                  icon={<Edit2 className="w-4 h-4" />}
                >
                  Edit
                </Button>
              </div>

              {/* Days Remaining Highlight */}
              {detailCarepack.status === 'active' && days !== null && (
                <div className={cx(
                  'flex items-center gap-3 p-4 rounded-xl border',
                  days <= 30
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                    : days <= 90
                      ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'
                      : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
                )}>
                  <Clock className={cx(
                    'w-6 h-6',
                    days <= 30
                      ? 'text-red-600 dark:text-red-400'
                      : days <= 90
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                  )} />
                  <div>
                    <p className={cx(
                      'text-xs font-medium',
                      days <= 30
                        ? 'text-red-600/70 dark:text-red-400/70'
                        : days <= 90
                          ? 'text-amber-600/70 dark:text-amber-400/70'
                          : 'text-emerald-600/70 dark:text-emerald-400/70'
                    )}>Days Remaining</p>
                    <p className={cx(
                      'text-xl font-bold',
                      days <= 30
                        ? 'text-red-700 dark:text-red-400'
                        : days <= 90
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                    )}>{getDaysLabel(days)}</p>
                  </div>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CarepackInfoRow label="Account" value={detailCarepack.partnerName} icon={<UserIcon className="w-3.5 h-3.5" />} />
                <CarepackInfoRow label="Account Name" value={detailCarepack.customerName} icon={<UserIcon className="w-3.5 h-3.5" />} />
                <CarepackInfoRow label="Product Type" value={detailCarepack.productType} icon={<Package className="w-3.5 h-3.5" />} />
                <CarepackInfoRow label="Serial Number" value={detailCarepack.serialNumber} icon={<Hash className="w-3.5 h-3.5" />} />
                <CarepackInfoRow label="Carepack SKU" value={detailCarepack.carepackSku} icon={<FileText className="w-3.5 h-3.5" />} />
                <CarepackInfoRow label="Start Date" value={detailCarepack.startDate ? formatDate(detailCarepack.startDate) : undefined} icon={<Calendar className="w-3.5 h-3.5" />} />
                <CarepackInfoRow label="End Date" value={detailCarepack.endDate ? formatDate(detailCarepack.endDate) : undefined} icon={<Calendar className="w-3.5 h-3.5" />} />
              </div>

              {/* Notes */}
              {detailCarepack.notes && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400 dark:text-zinc-500">
                    Notes
                  </h4>
                  <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-zinc-300">
                    {detailCarepack.notes}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div className="flex items-center gap-4 text-[11px] pt-2 border-t border-gray-100 dark:border-zinc-800 text-gray-400 dark:text-zinc-600">
                {detailCarepack.createdAt && <span>Created: {formatDate(detailCarepack.createdAt)}</span>}
                {detailCarepack.updatedAt && <span>Updated: {formatDate(detailCarepack.updatedAt)}</span>}
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Create / Edit Modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingId ? 'Edit Carepack' : 'New Carepack'}
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              icon={!isSubmitting ? <CheckCircle className="w-4 h-4" /> : undefined}
              shine
            >
              {isSubmitting ? 'Saving...' : editingId ? 'Update Carepack' : 'Create Carepack'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} id="carepack-form" className="space-y-5">
          {formError && (
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {formError}
            </Alert>
          )}

          {/* Section: Carepack Info */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-600 dark:text-zinc-300">
              <Shield className="w-4 h-4" />
              Carepack Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Select
                  label="Account"
                  id="partnerId"
                  name="partnerId"
                  value={formData.partnerId}
                  onChange={handleFormChange}
                >
                  <option value="">Select Account</option>
                  {partners.map(p => <option key={p.id} value={p.id}>{p.companyName}</option>)}
                </Select>
              </div>
              <Input
                label="Account Name *"
                id="customerName"
                name="customerName"
                type="text"
                placeholder="Enter account name"
                value={formData.customerName}
                onChange={handleFormChange}
                icon={<UserIcon className="w-4 h-4" />}
                required
              />
              <Input
                label="Product Type"
                id="productType"
                name="productType"
                type="text"
                placeholder="e.g. HP ProLiant, HPE Aruba"
                value={formData.productType}
                onChange={handleFormChange}
                icon={<Package className="w-4 h-4" />}
              />
              <Input
                label="Serial Number *"
                id="serialNumber"
                name="serialNumber"
                type="text"
                placeholder="e.g. CZ12345678"
                value={formData.serialNumber}
                onChange={handleFormChange}
                icon={<Hash className="w-4 h-4" />}
                required
              />
              <Input
                label="Carepack SKU"
                id="carepackSku"
                name="carepackSku"
                type="text"
                placeholder="e.g. U8PL9E"
                value={formData.carepackSku}
                onChange={handleFormChange}
                icon={<FileText className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Section: Dates & Status */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-600 dark:text-zinc-300">
              <Calendar className="w-4 h-4" />
              Dates &amp; Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Start Date *"
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleFormChange}
                icon={<Calendar className="w-4 h-4" />}
                required
              />
              <Input
                label="End Date *"
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleFormChange}
                icon={<Calendar className="w-4 h-4" />}
                required
              />
              <Select
                label="Status"
                id="status"
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                options={STATUSES}
              />
            </div>
          </div>

          {/* Section: Notes */}
          <Textarea
            label="Notes"
            id="notes"
            name="notes"
            rows={3}
            placeholder="Any additional notes about this carepack..."
            value={formData.notes}
            onChange={handleFormChange}
            className="resize-none"
          />
        </form>
      </Modal>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const CarepackInfoRow: React.FC<{
  label: string;
  value?: string;
  icon?: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-dark-100">
    {icon && (
      <span className="mt-0.5 flex-shrink-0 text-gray-400 dark:text-zinc-500">
        {icon}
      </span>
    )}
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-gray-400 dark:text-zinc-500">{label}</p>
      <p className="text-sm text-gray-900 dark:text-white">
        {value || '-'}
      </p>
    </div>
  </div>
);
