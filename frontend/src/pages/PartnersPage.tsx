import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, Edit2, Trash2,
  Loader2, AlertCircle, CheckCircle, XCircle, Building2,
  Clock, Shield, Phone, Mail, MapPin, FileText, Hash,
  User as UserIcon,
  Download, Upload, Target
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDropdowns } from '@/contexts/DropdownsContext';
import { partnersApi, masterDataApi, adminApi } from '@/services/api';
import { exportToCsv } from '@/utils/exportCsv';
import { Partner, PaginatedResponse, User } from '@/types';
import { BulkImportModal } from '@/components/common/BulkImportModal';
import { useNavigation } from '@/contexts/NavigationContext';
import { useColumnResize } from '@/hooks/useColumnResize';
import { Card, Button, Input, Select, Modal, Badge, Alert, Pagination, Textarea } from '@/components/ui';
import { cx } from '@/utils/cx';

// ---------------------------------------------------------------------------
// Types local to this page
// ---------------------------------------------------------------------------

type TabKey = 'all' | 'my' | 'pending';

interface PartnerFormData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  mobile: string;
  gstNumber: string;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  partnerType: string;
  vertical: string;
  tier: 'elite' | 'growth' | 'new';
  notes: string;
  assignedTo: string;
}

const EMPTY_FORM: PartnerFormData = {
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  mobile: '',
  gstNumber: '',
  panNumber: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  partnerType: '',
  vertical: '',
  tier: 'new',
  notes: '',
  assignedTo: '',
};


const PAGE_SIZE = 10;


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadgeVariant(status: string): 'emerald' | 'amber' | 'red' | 'gray' {
  switch (status) {
    case 'approved':
      return 'emerald';
    case 'pending':
      return 'amber';
    case 'rejected':
      return 'red';
    default:
      return 'gray';
  }
}

function tierBadgeVariant(tier: string): 'purple' | 'blue' | 'gray' {
  switch (tier) {
    case 'elite':
      return 'purple';
    case 'growth':
      return 'blue';
    case 'new':
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
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PartnersPage: React.FC = () => {
  const { user, isAdmin, hasRole } = useAuth();
  const { setActiveTab: navigate } = useNavigation();
  const { getOptions } = useDropdowns();

  // Dropdown data from DB
  const PARTNER_TYPES = getOptions('partner-types').length > 0
    ? getOptions('partner-types')
    : [{ value: 'distributor', label: 'Distributor' }, { value: 'reseller', label: 'Reseller' }, { value: 'system-integrator', label: 'System Integrator' }, { value: 'retailer', label: 'Retailer' }];
  const TIERS = getOptions('partner-tiers');
  const STATUSES = getOptions('partner-statuses');

  const canApprove = isAdmin() || hasRole('businesshead');

  // Tab state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  // All Partners tab state
  const [partners, setPartners] = useState<Partner[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [filterCity, setFilterCity] = useState('');

  // My Partners tab state
  const [myPartners, setMyPartners] = useState<Partner[]>([]);
  const [myPartnersLoading, setMyPartnersLoading] = useState(false);
  const [myPartnersError, setMyPartnersError] = useState('');

  // Pending tab state
  const [pendingPartners, setPendingPartners] = useState<Partner[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approveSubmitting, setApproveSubmitting] = useState<string | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [tableError, setTableError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PartnerFormData>({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);


  // Detail panel state
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // Locations dropdown data
  const [locations, setLocations] = useState<any[]>([]);

  // Users list for assignee dropdown
  const [usersList, setUsersList] = useState<User[]>([]);

  // Summary counts
  const [totalCount, setTotalCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [eliteCount, setEliteCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [ghostCount, setGhostCount] = useState(0);


  // Set Targets modal
  const [showTargetsModal, setShowTargetsModal] = useState(false);
  const [targets, setTargets] = useState({ elite: '', growth: '', new: '' });
  const [isSavingTargets, setIsSavingTargets] = useState(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    setTableError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (filterStatus) params.status = filterStatus;
      if (filterTier) params.tier = filterTier;
      if (filterCity) params.city = filterCity;
      if (searchTerm) params.search = searchTerm;

      const response: PaginatedResponse<Partner> = await partnersApi.list(params);
      setPartners(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalRecords(response.pagination.total);
    } catch (err: any) {
      setTableError(err.message || 'Failed to load partners');
      setPartners([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterStatus, filterTier, filterCity, searchTerm]);

  const fetchSummaryCounts = useCallback(async () => {
    try {
      const allRes: PaginatedResponse<Partner> = await partnersApi.list({ limit: '1' });
      setTotalCount(allRes.pagination.total);

      const approvedRes: PaginatedResponse<Partner> = await partnersApi.list({ limit: '1', status: 'approved' });
      setApprovedCount(approvedRes.pagination.total);

      const pendingRes: PaginatedResponse<Partner> = await partnersApi.list({ limit: '1', status: 'pending' });
      setPendingCount(pendingRes.pagination.total);

      const eliteRes: PaginatedResponse<Partner> = await partnersApi.list({ limit: '1', tier: 'elite' });
      setEliteCount(eliteRes.pagination.total);

      // Fetch active partners (isActive=true AND status=approved)
      const activeRes: PaginatedResponse<Partner> = await partnersApi.list({ limit: '1', status: 'approved', is_active: 'true' });
      setActiveCount(activeRes.pagination.total);

      // Fetch inactive partners (isActive=false)
      const inactiveRes: PaginatedResponse<Partner> = await partnersApi.list({ limit: '1', is_active: 'false' });
      setInactiveCount(inactiveRes.pagination.total);

      // Ghost partners proxy: tier=new AND status=approved
      const ghostRes: PaginatedResponse<Partner> = await partnersApi.list({ limit: '1', tier: 'new', status: 'approved' });
      setGhostCount(ghostRes.pagination.total);
    } catch {
      // Summary counts are non-critical
    }
  }, []);

  const fetchMyPartners = useCallback(async () => {
    setMyPartnersLoading(true);
    setMyPartnersError('');
    try {
      const data = await partnersApi.myPartners();
      setMyPartners(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setMyPartnersError(err.message || 'Failed to load your partners');
      setMyPartners([]);
    } finally {
      setMyPartnersLoading(false);
    }
  }, []);

  const fetchPendingPartners = useCallback(async () => {
    setPendingLoading(true);
    setPendingError('');
    try {
      const data = await partnersApi.pending();
      setPendingPartners(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setPendingError(err.message || 'Failed to load pending partners');
      setPendingPartners([]);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  // Fetch saved tier targets
  const fetchTargets = useCallback(async () => {
    try {
      const data = await partnersApi.getTargets();
      setTargets({ elite: data.elite || '', growth: data.growth || '', new: data.new || '' });
    } catch {
      // ignore – targets are optional
    }
  }, []);


  // Save tier targets
  const saveTargets = async () => {
    setIsSavingTargets(true);
    try {
      await partnersApi.saveTargets(targets);
      setShowTargetsModal(false);
    } catch {
      alert('Failed to save targets. Please try again.');
    } finally {
      setIsSavingTargets(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSummaryCounts();
    fetchTargets();
    masterDataApi.list('locations').then(setLocations).catch(() => {});
    if (isAdmin()) {
      adminApi.listUsers().then((data: any) => {
        const list = Array.isArray(data) ? data : (data as any)?.data ?? [];
        setUsersList(list);
      }).catch(() => {});
    }
  }, [fetchSummaryCounts, fetchTargets]);

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'all') {
      fetchPartners();
    } else if (activeTab === 'my') {
      fetchMyPartners();
    } else if (activeTab === 'pending') {
      fetchPendingPartners();
    }
  }, [activeTab, fetchPartners, fetchMyPartners, fetchPendingPartners]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterStatus, filterTier, filterCity, searchTerm]);

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  const openCreateModal = () => {
    setFormData({ ...EMPTY_FORM });
    setEditingId(null);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (partner: Partner) => {
    setFormData({
      companyName: partner.companyName || '',
      contactPerson: partner.contactPerson || '',
      email: partner.email || '',
      phone: partner.phone || '',
      mobile: partner.mobile || '',
      gstNumber: partner.gstNumber || '',
      panNumber: partner.panNumber || '',
      address: partner.address || '',
      city: partner.city || '',
      state: partner.state || '',
      pincode: partner.pincode || '',
      partnerType: partner.partnerType || '',
      vertical: partner.vertical || '',
      tier: partner.tier || 'new',
      notes: partner.notes || '',
      assignedTo: partner.assignedTo || '',
    });
    setEditingId(partner.id);
    setFormError('');
    setShowModal(true);
    setShowDetail(false);
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

    if (!formData.companyName.trim()) {
      setFormError('Company name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await partnersApi.update(editingId, formData);
      } else {
        await partnersApi.create(formData);
      }

      closeModal();
      if (activeTab === 'all') fetchPartners();
      if (activeTab === 'my') fetchMyPartners();
      fetchSummaryCounts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save partner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await partnersApi.delete(id);
      setDeleteConfirmId(null);
      if (activeTab === 'all') fetchPartners();
      if (activeTab === 'my') fetchMyPartners();
      fetchSummaryCounts();
    } catch (err: any) {
      setTableError(err.message || 'Failed to delete partner');
    }
  };

  const handleApprove = async (id: string) => {
    setApproveSubmitting(id);
    try {
      await partnersApi.approve(id, true);
      fetchPendingPartners();
      fetchSummaryCounts();
    } catch (err: any) {
      setPendingError(err.message || 'Failed to approve partner');
    } finally {
      setApproveSubmitting(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      setPendingError('Please enter a rejection reason');
      return;
    }
    setApproveSubmitting(id);
    try {
      await partnersApi.approve(id, false, rejectionReason.trim());
      setRejectingId(null);
      setRejectionReason('');
      fetchPendingPartners();
      fetchSummaryCounts();
    } catch (err: any) {
      setPendingError(err.message || 'Failed to reject partner');
    } finally {
      setApproveSubmitting(null);
    }
  };

  const openDetail = async (partner: Partner) => {
    setDetailLoading(true);
    setShowDetail(true);
    try {
      const full = await partnersApi.getById(partner.id);
      setSelectedPartner(full);
    } catch {
      setSelectedPartner(partner);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelectedPartner(null);
  };

  const handleDetailApprove = async () => {
    if (!selectedPartner) return;
    setApproveSubmitting(selectedPartner.id);
    try {
      const updated = await partnersApi.approve(selectedPartner.id, true);
      setSelectedPartner(updated);
      fetchSummaryCounts();
      if (activeTab === 'all') fetchPartners();
      if (activeTab === 'pending') fetchPendingPartners();
    } catch (err: any) {
      setTableError(err.message || 'Failed to approve partner');
    } finally {
      setApproveSubmitting(null);
    }
  };

  const handleDetailReject = async () => {
    if (!selectedPartner) return;
    if (!rejectionReason.trim()) return;
    setApproveSubmitting(selectedPartner.id);
    try {
      const updated = await partnersApi.approve(selectedPartner.id, false, rejectionReason.trim());
      setSelectedPartner(updated);
      setRejectingId(null);
      setRejectionReason('');
      fetchSummaryCounts();
      if (activeTab === 'all') fetchPartners();
      if (activeTab === 'pending') fetchPendingPartners();
    } catch (err: any) {
      setTableError(err.message || 'Failed to reject partner');
    } finally {
      setApproveSubmitting(null);
    }
  };


  const clearFilters = () => {
    setFilterStatus('');
    setFilterTier('');
    setFilterCity('');
    setSearchTerm('');
  };

  const hasActiveFilters = filterStatus || filterTier || filterCity || searchTerm;

  // ---------------------------------------------------------------------------
  // Styling helpers
  // ---------------------------------------------------------------------------

  const { colWidths: partnerColWidths, onMouseDown: onPartnerMouseDown } = useColumnResize({
    initialWidths: [190, 170, 130, 140, 100, 100, 100],
  });

  // ---------------------------------------------------------------------------
  // Table row renderer (shared between All & My tabs)
  // ---------------------------------------------------------------------------

  const renderPartnerRow = (partner: Partner, showActions: boolean = true) => (
    <tr
      key={partner.id}
      className="border-b transition-colors cursor-pointer border-slate-50 hover:bg-slate-50/80 dark:border-zinc-800/50 dark:hover:bg-zinc-800/30"
      onClick={() => openDetail(partner)}
    >
      {/* Company Name */}
      <td className="px-4 py-3 text-slate-900 dark:text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-brand-50 dark:bg-brand-900/20">
            <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="min-w-0">
            <span className="font-medium block truncate">{partner.companyName}</span>
            {partner.email && (
              <span className="text-xs truncate block text-slate-400 dark:text-zinc-500">
                {partner.email}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Contact Person */}
      <td className="px-4 py-3 text-slate-700 dark:text-zinc-300">
        {partner.contactPerson || '-'}
      </td>

      {/* City */}
      <td className="px-4 py-3 text-slate-700 dark:text-zinc-300">
        <div className="flex items-center gap-1.5">
          {partner.city && <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400 dark:text-zinc-500" />}
          {partner.city || '-'}
        </div>
      </td>

      {/* Type */}
      <td className="px-4 py-3 text-slate-700 dark:text-zinc-300">
        {capitalize(partner.partnerType || '')}
      </td>

      {/* Tier */}
      <td className="px-4 py-3">
        <Badge variant={tierBadgeVariant(partner.tier)}>
          {capitalize(partner.tier)}
        </Badge>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <Badge variant={statusBadgeVariant(partner.status)}>
          {capitalize(partner.status)}
        </Badge>
      </td>

      {/* Actions */}
      {showActions && (
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); openEditModal(partner); }}
              title="Edit"
              className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:text-zinc-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {deleteConfirmId === partner.id ? (
              <div className="flex items-center gap-1">
                <Button
                  size="xs"
                  variant="danger"
                  onClick={(e) => { e.stopPropagation(); handleDelete(partner.id); }}
                >
                  Confirm
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(partner.id); }}
                title="Delete"
                className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-red-600 hover:bg-red-50 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );

  // ---------------------------------------------------------------------------
  // Table header renderer
  // ---------------------------------------------------------------------------

  const renderTableHeader = (showActions: boolean = true) => {
    const headers = ['Company Name', 'Contact Person', 'City', 'Type', 'Tier', 'Status'];
    if (showActions) headers.push('Actions');

    return (
      <thead>
        <tr className="border-b border-slate-100 dark:border-zinc-800">
          {headers.map((h, i) => (
            <th
              key={h}
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider resizable-th text-slate-400 dark:text-zinc-500"
              style={{ width: partnerColWidths[i] }}
            >
              {h}
              <div className="col-resize-handle" onMouseDown={e => onPartnerMouseDown(i, e)} />
            </th>
          ))}
        </tr>
      </thead>
    );
  };

  // ---------------------------------------------------------------------------
  // Empty state renderer
  // ---------------------------------------------------------------------------

  const renderEmptyState = (message: string, subMessage: string) => (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-slate-100 dark:bg-zinc-800">
        <Building2 className="w-7 h-7 text-slate-300 dark:text-zinc-600" />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
        {message}
      </p>
      <p className="text-xs mt-1 text-slate-400 dark:text-zinc-600">
        {subMessage}
      </p>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Loading state renderer
  // ---------------------------------------------------------------------------

  const renderLoadingState = (message: string) => (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      <p className="mt-3 text-sm text-slate-500 dark:text-zinc-400">
        {message}
      </p>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Error banner renderer
  // ---------------------------------------------------------------------------

  const renderErrorBanner = (error: string) => (
    <div className="m-4">
      <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
        {error}
      </Alert>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: All Partners Tab
  // ---------------------------------------------------------------------------

  const renderAllPartnersTab = () => (
    <>
      {/* Toolbar: Search + Filters + New Partner */}
      <Card padding="none" className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Input
              type="text"
              placeholder="Search by company name..."
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

          {/* Filter: Tier */}
          <div className="w-full lg:w-40">
            <Select
              value={filterTier}
              onChange={e => setFilterTier(e.target.value)}
            >
              <option value="">All Tiers</option>
              {TIERS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </div>

          {/* Filter: Location */}
          <div className="w-full lg:w-44">
            <Select
              value={filterCity}
              onChange={e => { setFilterCity(e.target.value); setPage(1); }}
            >
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.city}>
                  {loc.city}{loc.state ? `, ${loc.state}` : ''}
                </option>
              ))}
            </Select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="md"
              icon={<X className="w-3.5 h-3.5" />}
              onClick={clearFilters}
            >
              Clear
            </Button>
          )}

          {/* Bulk Import */}
          <Button
            variant="secondary"
            size="md"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => setShowBulkImport(true)}
            title="Import from CSV"
          >
            Import
          </Button>

          {/* Export CSV */}
          <Button
            variant="secondary"
            size="md"
            icon={<Download className="w-4 h-4" />}
            onClick={() => exportToCsv('partners', [
              { header: 'Company Name', accessor: (r: Partner) => r.companyName },
              { header: 'Contact Person', accessor: (r: Partner) => r.contactPerson },
              { header: 'Email', accessor: (r: Partner) => r.email },
              { header: 'Phone', accessor: (r: Partner) => r.phone },
              { header: 'Mobile', accessor: (r: Partner) => r.mobile },
              { header: 'City', accessor: (r: Partner) => r.city },
              { header: 'State', accessor: (r: Partner) => r.state },
              { header: 'Pincode', accessor: (r: Partner) => r.pincode },
              { header: 'Partner Type', accessor: (r: Partner) => r.partnerType },
              { header: 'Tier', accessor: (r: Partner) => r.tier },
              { header: 'Status', accessor: (r: Partner) => r.status },
              { header: 'GST Number', accessor: (r: Partner) => r.gstNumber },
              { header: 'PAN Number', accessor: (r: Partner) => r.panNumber },
              { header: 'Vertical', accessor: (r: Partner) => r.vertical },
              { header: 'Notes', accessor: (r: Partner) => r.notes },
            ], partners)}
            disabled={partners.length === 0}
            title="Export to Excel"
          >
            Export
          </Button>

          {/* Set Targets */}
          <Button
            variant="secondary"
            size="md"
            icon={<Target className="w-4 h-4" />}
            onClick={() => setShowTargetsModal(true)}
          >
            Set Targets
          </Button>

          {/* New Partner */}
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            shine
            onClick={openCreateModal}
          >
            New Partner
          </Button>
        </div>
      </Card>

      {/* Data Table */}
      <Card padding="none" className="overflow-hidden">
        {tableError && renderErrorBanner(tableError)}

        {isLoading ? (
          renderLoadingState('Loading partners...')
        ) : partners.length === 0 ? (
          renderEmptyState(
            hasActiveFilters ? 'No partners match filters' : 'No partners yet',
            hasActiveFilters ? 'Try adjusting your search or filters' : 'Click "New Partner" to add your first partner'
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="premium-table">
              {renderTableHeader(true)}
              <tbody>
                {partners.map(p => renderPartnerRow(p, true))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalRecords}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          className="border-t border-slate-100 dark:border-zinc-800"
        />
      </Card>
    </>
  );

  // ---------------------------------------------------------------------------
  // Render: My Partners Tab
  // ---------------------------------------------------------------------------

  const renderMyPartnersTab = () => (
    <Card padding="none" className="overflow-hidden">
      {myPartnersError && renderErrorBanner(myPartnersError)}

      {myPartnersLoading ? (
        renderLoadingState('Loading your partners...')
      ) : myPartners.length === 0 ? (
        renderEmptyState(
          'No partners assigned to you',
          'Partners will appear here once they are assigned to you'
        )
      ) : (
        <div className="overflow-x-auto">
          <table className="premium-table">
            {renderTableHeader(false)}
            <tbody>
              {myPartners.map(p => renderPartnerRow(p, false))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  // ---------------------------------------------------------------------------
  // Render: Pending Approval Tab
  // ---------------------------------------------------------------------------

  const renderPendingTab = () => (
    <Card padding="none" className="overflow-hidden">
      {pendingError && renderErrorBanner(pendingError)}

      {pendingLoading ? (
        renderLoadingState('Loading pending partners...')
      ) : pendingPartners.length === 0 ? (
        renderEmptyState(
          'No pending approvals',
          'All partner registrations have been reviewed'
        )
      ) : (
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr className="border-b border-slate-100 dark:border-zinc-800">
                {['Company Name', 'Contact Person', 'City', 'Type', 'Tier', 'Registered', 'Actions'].map((h, i) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider resizable-th text-slate-400 dark:text-zinc-500"
                    style={{ width: partnerColWidths[i] }}
                  >
                    {h}
                    <div className="col-resize-handle" onMouseDown={e => onPartnerMouseDown(i, e)} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingPartners.map(partner => (
                <tr
                  key={partner.id}
                  className="border-b transition-colors border-slate-50 hover:bg-slate-50/80 dark:border-zinc-800/50 dark:hover:bg-zinc-800/30"
                >
                  {/* Company Name */}
                  <td
                    className="px-4 py-3 cursor-pointer text-slate-900 dark:text-white"
                    onClick={() => openDetail(partner)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-50 dark:bg-amber-900/20">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="font-medium">{partner.companyName}</span>
                    </div>
                  </td>

                  {/* Contact Person */}
                  <td className="px-4 py-3 text-slate-700 dark:text-zinc-300">
                    {partner.contactPerson || '-'}
                  </td>

                  {/* City */}
                  <td className="px-4 py-3 text-slate-700 dark:text-zinc-300">
                    {partner.city || '-'}
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3 text-slate-700 dark:text-zinc-300">
                    {capitalize(partner.partnerType || '')}
                  </td>

                  {/* Tier */}
                  <td className="px-4 py-3">
                    <Badge variant={tierBadgeVariant(partner.tier)}>
                      {capitalize(partner.tier)}
                    </Badge>
                  </td>

                  {/* Registered */}
                  <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-zinc-300">
                    {formatDate(partner.createdAt)}
                  </td>

                  {/* Approve/Reject Actions */}
                  <td className="px-4 py-3">
                    {rejectingId === partner.id ? (
                      <div className="flex items-center gap-2 min-w-[280px]">
                        <Input
                          type="text"
                          placeholder="Rejection reason..."
                          value={rejectionReason}
                          onChange={e => setRejectionReason(e.target.value)}
                          className="flex-1 !py-1.5 !text-xs"
                          autoFocus
                        />
                        <Button
                          size="xs"
                          variant="danger"
                          onClick={() => handleReject(partner.id)}
                          disabled={approveSubmitting === partner.id}
                          loading={approveSubmitting === partner.id}
                        >
                          Reject
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => { setRejectingId(null); setRejectionReason(''); setPendingError(''); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          size="xs"
                          variant="success"
                          icon={approveSubmitting === partner.id ? undefined : <CheckCircle className="w-3 h-3" />}
                          loading={approveSubmitting === partner.id}
                          onClick={() => handleApprove(partner.id)}
                          disabled={approveSubmitting === partner.id}
                        >
                          Approve
                        </Button>
                        <Button
                          size="xs"
                          variant="danger"
                          icon={<XCircle className="w-3 h-3" />}
                          onClick={() => { setRejectingId(partner.id); setRejectionReason(''); setPendingError(''); }}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
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
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Partners */}
        <Card
          hover
          padding="sm"
          className="animate-fade-in-up stagger-1"
          onClick={() => { clearFilters(); navigate('partners'); }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-brand-50 dark:bg-brand-900/20">
            <Building2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Total Partners</p>
          <p className="text-xl font-bold mt-0.5 text-slate-900 dark:text-white">
            {totalCount}
          </p>
        </Card>

        {/* Active */}
        <Card
          hover
          padding="sm"
          className="animate-fade-in-up stagger-2"
          onClick={() => { setFilterStatus('approved'); setActiveTab('all'); navigate('partners'); }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-emerald-50 dark:bg-emerald-900/20">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Active</p>
          <p className="text-xl font-bold mt-0.5 text-slate-900 dark:text-white">
            {activeCount}
          </p>
        </Card>

        {/* Inactive */}
        <Card
          hover
          padding="sm"
          className="animate-fade-in-up stagger-3"
          onClick={() => { setFilterStatus('rejected'); setActiveTab('all'); navigate('partners'); }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-red-50 dark:bg-slate-800/50">
            <XCircle className="w-5 h-5 text-red-500 dark:text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Inactive</p>
          <p className="text-xl font-bold mt-0.5 text-slate-900 dark:text-white">
            {inactiveCount}
          </p>
        </Card>

        {/* Ghost */}
        <Card
          hover
          padding="sm"
          className="animate-fade-in-up stagger-4"
          onClick={() => { setFilterTier('new'); setFilterStatus('approved'); setActiveTab('all'); navigate('partners'); }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-orange-50 dark:bg-orange-900/20">
            <AlertCircle className="w-5 h-5 text-orange-500 dark:text-orange-400" />
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Ghost</p>
          <p className="text-xl font-bold mt-0.5 text-slate-900 dark:text-white">
            {ghostCount}
          </p>
        </Card>

        {/* Pending Approval */}
        <Card
          hover
          padding="sm"
          className="animate-fade-in-up stagger-5"
          onClick={() => { setActiveTab('pending'); navigate('partners'); }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-amber-50 dark:bg-amber-900/20">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Pending Approval</p>
          <p className="text-xl font-bold mt-0.5 text-slate-900 dark:text-white">
            {pendingCount}
          </p>
        </Card>

        {/* Elite Partners */}
        <Card
          hover
          padding="sm"
          className="animate-fade-in-up stagger-6"
          onClick={() => { setFilterTier('elite'); setActiveTab('all'); navigate('partners'); }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-purple-50 dark:bg-purple-900/20">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Elite Partners</p>
          <p className="text-xl font-bold mt-0.5 text-slate-900 dark:text-white">
            {eliteCount}
          </p>
        </Card>
      </div>

      {/* Tab Navigation */}
      <Card padding="none" className="p-1 inline-flex rounded-xl">
        {[
          { key: 'all' as TabKey, label: 'All Partners', icon: Building2 },
          { key: 'my' as TabKey, label: 'My Partners', icon: UserIcon },
          ...(canApprove ? [{ key: 'pending' as TabKey, label: 'Pending Approval', icon: Clock }] : []),
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
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.key === 'pending' && pendingCount > 0 && (
                <span className={cx(
                  'ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                )}>
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </Card>

      {/* Tab Content */}
      {activeTab === 'all' && renderAllPartnersTab()}
      {activeTab === 'my' && renderMyPartnersTab()}
      {activeTab === 'pending' && canApprove && renderPendingTab()}

      {/* Create / Edit Modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingId ? 'Edit Partner' : 'New Partner'}
        icon={<Building2 className="w-5 h-5" />}
        size="xl"
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
              shine
              loading={isSubmitting}
              icon={isSubmitting ? undefined : <CheckCircle className="w-4 h-4" />}
              onClick={() => {
                const form = document.getElementById('partner-form') as HTMLFormElement;
                form?.requestSubmit();
              }}
            >
              {isSubmitting ? 'Saving...' : editingId ? 'Update Partner' : 'Create Partner'}
            </Button>
          </>
        }
      >
        {/* Form */}
        <form id="partner-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Form Error */}
          {formError && (
            <Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
              {formError}
            </Alert>
          )}

          {/* Section: Company Info */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-600 dark:text-zinc-300">
              <Building2 className="w-4 h-4" />
              Company Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Company Name"
                  name="companyName"
                  type="text"
                  placeholder="Enter company name"
                  value={formData.companyName}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <Select
                label="Partner Type"
                name="partnerType"
                value={formData.partnerType}
                onChange={handleFormChange}
              >
                <option value="">Select Type</option>
                {PARTNER_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>

              <Select
                label="Tier"
                name="tier"
                value={formData.tier}
                onChange={handleFormChange}
              >
                {TIERS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>

              {isAdmin() && (
                <Select
                  label="Assigned To"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleFormChange}
                >
                  <option value="">Select Salesperson</option>
                  {usersList.filter(u => u.isActive).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </Select>
              )}

              <Input
                label="Vertical"
                name="vertical"
                type="text"
                placeholder="e.g. Enterprise, SMB, Government"
                value={formData.vertical}
                onChange={handleFormChange}
              />

              <Input
                label="GST Number"
                name="gstNumber"
                type="text"
                placeholder="22AAAAA0000A1Z5"
                value={formData.gstNumber}
                onChange={handleFormChange}
                icon={<Hash className="w-4 h-4" />}
              />

              <Input
                label="PAN Number"
                name="panNumber"
                type="text"
                placeholder="AAAPL1234C"
                value={formData.panNumber}
                onChange={handleFormChange}
                icon={<FileText className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Section: Contact Info */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-600 dark:text-zinc-300">
              <UserIcon className="w-4 h-4" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact Person"
                name="contactPerson"
                type="text"
                placeholder="Full name"
                value={formData.contactPerson}
                onChange={handleFormChange}
                icon={<UserIcon className="w-4 h-4" />}
              />

              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="contact@company.com"
                value={formData.email}
                onChange={handleFormChange}
                icon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Phone"
                name="phone"
                type="text"
                placeholder="022-12345678"
                value={formData.phone}
                onChange={handleFormChange}
                icon={<Phone className="w-4 h-4" />}
              />

              <Input
                label="Mobile"
                name="mobile"
                type="text"
                placeholder="+91 98765 43210"
                value={formData.mobile}
                onChange={handleFormChange}
                icon={<Phone className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Section: Address */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-600 dark:text-zinc-300">
              <MapPin className="w-4 h-4" />
              Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Textarea
                  label="Address"
                  name="address"
                  rows={2}
                  placeholder="Street address, building, floor..."
                  value={formData.address}
                  onChange={handleFormChange}
                  className="resize-none"
                />
              </div>

              <Input
                label="City"
                name="city"
                type="text"
                placeholder="Mumbai"
                value={formData.city}
                onChange={handleFormChange}
              />

              <Input
                label="State"
                name="state"
                type="text"
                placeholder="Maharashtra"
                value={formData.state}
                onChange={handleFormChange}
              />

              <Input
                label="Pincode"
                name="pincode"
                type="text"
                placeholder="400001"
                value={formData.pincode}
                onChange={handleFormChange}
              />
            </div>
          </div>

          {/* Section: Notes */}
          <Textarea
            label="Notes"
            name="notes"
            rows={3}
            placeholder="Any additional notes about this partner..."
            value={formData.notes}
            onChange={handleFormChange}
            className="resize-none"
          />
        </form>
      </Modal>

      {/* Detail Slide-in Panel */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-backdrop"
            onClick={closeDetail}
          />

          {/* Panel */}
          <div
            className={cx(
              'relative w-full max-w-lg h-full overflow-y-auto animate-fade-in-up',
              'bg-white shadow-premium dark:bg-dark-50 dark:border-l dark:border-zinc-800'
            )}
          >
            {/* Panel Header */}
            <div className={cx(
              'sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b',
              'bg-white border-slate-200 dark:bg-dark-50 dark:border-zinc-800'
            )}>
              <h2 className="text-lg font-semibold font-display text-slate-900 dark:text-white">
                Partner Details
              </h2>
              <div className="flex items-center gap-2">
                {selectedPartner && (
                  <button
                    onClick={() => openEditModal(selectedPartner)}
                    className="p-2 rounded-lg transition-colors text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:text-zinc-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={closeDetail}
                  className="p-2 rounded-lg transition-colors text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Panel Content */}
            {detailLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                <p className="mt-3 text-sm text-slate-500 dark:text-zinc-400">
                  Loading details...
                </p>
              </div>
            ) : selectedPartner ? (
              <div className="p-6 space-y-6">
                {/* Company Header */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-brand-50 dark:bg-brand-900/20">
                    <Building2 className="w-7 h-7 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedPartner.companyName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant={statusBadgeVariant(selectedPartner.status)}>
                        {capitalize(selectedPartner.status)}
                      </Badge>
                      <Badge variant={tierBadgeVariant(selectedPartner.tier)}>
                        {capitalize(selectedPartner.tier)}
                      </Badge>
                      {selectedPartner.partnerType && (
                        <Badge variant="gray">
                          {capitalize(selectedPartner.partnerType)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="rounded-xl p-4 space-y-3 bg-slate-50 border border-slate-100 dark:bg-dark-100 dark:border-zinc-800">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Contact Information
                  </h4>

                  {selectedPartner.contactPerson && (
                    <div className="flex items-center gap-3">
                      <UserIcon className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-zinc-500" />
                      <span className="text-sm text-slate-700 dark:text-zinc-300">
                        {selectedPartner.contactPerson}
                      </span>
                    </div>
                  )}

                  {selectedPartner.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-zinc-500" />
                      <a
                        href={`mailto:${selectedPartner.email}`}
                        className="text-sm hover:underline text-brand-600 dark:text-brand-400"
                      >
                        {selectedPartner.email}
                      </a>
                    </div>
                  )}

                  {selectedPartner.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-zinc-500" />
                      <span className="text-sm text-slate-700 dark:text-zinc-300">
                        {selectedPartner.phone}
                      </span>
                    </div>
                  )}

                  {selectedPartner.mobile && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-zinc-500" />
                      <span className="text-sm text-slate-700 dark:text-zinc-300">
                        {selectedPartner.mobile} <span className="text-xs text-slate-400 dark:text-zinc-600">(mobile)</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Address */}
                {(selectedPartner.address || selectedPartner.city || selectedPartner.state) && (
                  <div className="rounded-xl p-4 space-y-3 bg-slate-50 border border-slate-100 dark:bg-dark-100 dark:border-zinc-800">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Address
                    </h4>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-400 dark:text-zinc-500" />
                      <div className="text-sm text-slate-700 dark:text-zinc-300">
                        {selectedPartner.address && <p>{selectedPartner.address}</p>}
                        <p>
                          {[selectedPartner.city, selectedPartner.state, selectedPartner.pincode]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Business Details */}
                <div className="rounded-xl p-4 space-y-3 bg-slate-50 border border-slate-100 dark:bg-dark-100 dark:border-zinc-800">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Business Details
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-400 dark:text-zinc-500">Assigned To</p>
                      <p className="text-sm font-medium mt-0.5 text-slate-700 dark:text-zinc-300">
                        {selectedPartner.assignedToName || '-'}
                      </p>
                    </div>

                    {selectedPartner.gstNumber && (
                      <div>
                        <p className="text-xs text-slate-400 dark:text-zinc-500">GST Number</p>
                        <p className="text-sm font-medium mt-0.5 text-slate-700 dark:text-zinc-300">
                          {selectedPartner.gstNumber}
                        </p>
                      </div>
                    )}

                    {selectedPartner.panNumber && (
                      <div>
                        <p className="text-xs text-slate-400 dark:text-zinc-500">PAN Number</p>
                        <p className="text-sm font-medium mt-0.5 text-slate-700 dark:text-zinc-300">
                          {selectedPartner.panNumber}
                        </p>
                      </div>
                    )}

                    {selectedPartner.vertical && (
                      <div>
                        <p className="text-xs text-slate-400 dark:text-zinc-500">Vertical</p>
                        <p className="text-sm font-medium mt-0.5 text-slate-700 dark:text-zinc-300">
                          {selectedPartner.vertical}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-slate-400 dark:text-zinc-500">Active</p>
                      <p className="text-sm font-medium mt-0.5 text-slate-700 dark:text-zinc-300">
                        {selectedPartner.isActive ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedPartner.notes && (
                  <div className="rounded-xl p-4 space-y-2 bg-slate-50 border border-slate-100 dark:bg-dark-100 dark:border-zinc-800">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Notes
                    </h4>
                    <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-zinc-300">
                      {selectedPartner.notes}
                    </p>
                  </div>
                )}

                {/* Approval History */}
                <div className="rounded-xl p-4 space-y-3 bg-slate-50 border border-slate-100 dark:bg-dark-100 dark:border-zinc-800">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Approval &amp; Timeline
                  </h4>

                  <div className="space-y-3">
                    {/* Created */}
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-slate-200 dark:bg-zinc-800">
                        <Plus className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                          Partner registered
                        </p>
                        <p className="text-xs text-slate-400 dark:text-zinc-500">
                          {formatDate(selectedPartner.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Approved/Rejected */}
                    {selectedPartner.status === 'approved' && selectedPartner.approvedAt && (
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-emerald-100 dark:bg-emerald-900/30">
                          <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                            Approved{selectedPartner.approvedBy ? ` by ${selectedPartner.approvedBy}` : ''}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-zinc-500">
                            {formatDate(selectedPartner.approvedAt)}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedPartner.status === 'rejected' && (
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-red-100 dark:bg-red-900/30">
                          <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                            Rejected{selectedPartner.approvedBy ? ` by ${selectedPartner.approvedBy}` : ''}
                          </p>
                          {selectedPartner.rejectionReason && (
                            <p className="text-xs mt-0.5 text-red-600/80 dark:text-red-400/80">
                              Reason: {selectedPartner.rejectionReason}
                            </p>
                          )}
                          {selectedPartner.approvedAt && (
                            <p className="text-xs text-slate-400 dark:text-zinc-500">
                              {formatDate(selectedPartner.approvedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Last updated */}
                    {selectedPartner.updatedAt && selectedPartner.updatedAt !== selectedPartner.createdAt && (
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-slate-200 dark:bg-zinc-800">
                          <Edit2 className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                            Last updated
                          </p>
                          <p className="text-xs text-slate-400 dark:text-zinc-500">
                            {formatDate(selectedPartner.updatedAt)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Approve/Reject Controls (in detail panel) */}
                {canApprove && selectedPartner.status === 'pending' && (
                  <div className="rounded-xl p-4 space-y-3 bg-amber-50/50 border border-amber-200 dark:bg-dark-100 dark:border-amber-800/30">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Approval Required
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-zinc-400">
                      This partner is awaiting approval. Review the details above and approve or reject.
                    </p>

                    {rejectingId === selectedPartner.id ? (
                      <div className="space-y-3">
                        <Input
                          label="Rejection Reason"
                          type="text"
                          placeholder="Enter reason for rejection..."
                          value={rejectionReason}
                          onChange={e => setRejectionReason(e.target.value)}
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            variant="danger"
                            size="md"
                            icon={approveSubmitting === selectedPartner.id ? undefined : <XCircle className="w-4 h-4" />}
                            loading={approveSubmitting === selectedPartner.id}
                            onClick={handleDetailReject}
                            disabled={!rejectionReason.trim() || approveSubmitting === selectedPartner.id}
                          >
                            Confirm Rejection
                          </Button>
                          <Button
                            variant="ghost"
                            size="md"
                            onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Button
                          variant="success"
                          size="md"
                          shine
                          icon={approveSubmitting === selectedPartner.id ? undefined : <CheckCircle className="w-4 h-4" />}
                          loading={approveSubmitting === selectedPartner.id}
                          onClick={handleDetailApprove}
                          disabled={approveSubmitting === selectedPartner.id}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="md"
                          icon={<XCircle className="w-4 h-4" />}
                          onClick={() => { setRejectingId(selectedPartner.id); setRejectionReason(''); }}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Set Targets Modal */}
      <Modal
        open={showTargetsModal}
        onClose={() => setShowTargetsModal(false)}
        title="Set Revenue Targets"
        icon={<Target className="w-5 h-5" />}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowTargetsModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              shine
              loading={isSavingTargets}
              icon={isSavingTargets ? undefined : <CheckCircle className="w-4 h-4" />}
              onClick={saveTargets}
            >
              {isSavingTargets ? 'Saving...' : 'Save Targets'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Set monthly revenue targets per partner tier.
          </p>

          {/* Elite Tier Target */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              <span className="flex items-center gap-2">
                <Badge variant="purple" size="sm">Elite</Badge>
                Tier Target
              </span>
            </label>
            <Input
              type="number"
              placeholder="e.g. 500000"
              value={targets.elite}
              onChange={e => setTargets(prev => ({ ...prev, elite: e.target.value }))}
            />
          </div>

          {/* Growth Tier Target */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              <span className="flex items-center gap-2">
                <Badge variant="blue" size="sm">Growth</Badge>
                Tier Target
              </span>
            </label>
            <Input
              type="number"
              placeholder="e.g. 200000"
              value={targets.growth}
              onChange={e => setTargets(prev => ({ ...prev, growth: e.target.value }))}
            />
          </div>

          {/* New Tier Target */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
              <span className="flex items-center gap-2">
                <Badge variant="gray" size="sm">New</Badge>
                Tier Target
              </span>
            </label>
            <Input
              type="number"
              placeholder="e.g. 50000"
              value={targets.new}
              onChange={e => setTargets(prev => ({ ...prev, new: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        entity="partners"
        entityLabel="Partners"
        onSuccess={() => fetchPartners()}
      />
    </div>
  );
};
