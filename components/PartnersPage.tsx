import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, ChevronLeft, ChevronRight, Edit2, Trash2,
  Loader2, AlertCircle, CheckCircle, XCircle, Building2,
  Clock, Shield, Phone, Mail, MapPin, FileText, Hash,
  User as UserIcon,
  Download, Upload, Target
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useDropdowns } from '../contexts/DropdownsContext';
import { partnersApi, masterDataApi, adminApi } from '../services/api';
import { exportToCsv } from '../utils/exportCsv';
import { Partner, PaginatedResponse, User } from '../types';
import { BulkImportModal } from './BulkImportModal';
import { useNavigation } from '../contexts/NavigationContext';
import { useColumnResize } from '../hooks/useColumnResize';

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

function statusBadge(status: string, isDark: boolean): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  switch (status) {
    case 'approved':
      return `${base} ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`;
    case 'pending':
      return `${base} ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700'}`;
    case 'rejected':
      return `${base} ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'}`;
    default:
      return `${base} ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`;
  }
}

function tierBadge(tier: string, isDark: boolean): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  switch (tier) {
    case 'elite':
      return `${base} ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-700'}`;
    case 'growth':
      return `${base} ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'}`;
    case 'new':
      return `${base} ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-600'}`;
    default:
      return `${base} ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`;
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
  const { theme } = useTheme();
  const { user, isAdmin, hasRole } = useAuth();
  const { setActiveTab: navigate } = useNavigation();
  const { getOptions } = useDropdowns();
  const isDark = theme === 'dark';

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

  const cardClass = `premium-card ${isDark ? '' : 'shadow-soft'}`;
  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm transition-all ${
    isDark
      ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500 focus:border-brand-500'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-500'
  } focus:outline-none focus:ring-1 focus:ring-brand-500`;
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  // ---------------------------------------------------------------------------
  // Pagination renderer (matching SalesEntryPage)
  // ---------------------------------------------------------------------------

  const renderPagination = () => {
    if (totalRecords === 0) return null;

    return (
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t ${
        isDark ? 'border-zinc-800' : 'border-slate-100'
      }`}>
        <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
          Showing {(page - 1) * PAGE_SIZE + 1}
          {' '}&ndash;{' '}
          {Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords} partners
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
    );
  };

  // ---------------------------------------------------------------------------
  // Table row renderer (shared between All & My tabs)
  // ---------------------------------------------------------------------------

  const renderPartnerRow = (partner: Partner, showActions: boolean = true) => (
    <tr
      key={partner.id}
      className={`border-b transition-colors cursor-pointer ${
        isDark
          ? 'border-zinc-800/50 hover:bg-zinc-800/30'
          : 'border-slate-50 hover:bg-slate-50/80'
      }`}
      onClick={() => openDetail(partner)}
    >
      {/* Company Name */}
      <td className={`px-4 py-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isDark ? 'bg-brand-900/20' : 'bg-brand-50'
          }`}>
            <Building2 className={`w-4 h-4 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
          </div>
          <div className="min-w-0">
            <span className="font-medium block truncate">{partner.companyName}</span>
            {partner.email && (
              <span className={`text-xs truncate block ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                {partner.email}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Contact Person */}
      <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
        {partner.contactPerson || '-'}
      </td>

      {/* City */}
      <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
        <div className="flex items-center gap-1.5">
          {partner.city && <MapPin className={`w-3 h-3 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />}
          {partner.city || '-'}
        </div>
      </td>

      {/* Type */}
      <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
        {capitalize(partner.partnerType || '')}
      </td>

      {/* Tier */}
      <td className="px-4 py-3">
        <span className={tierBadge(partner.tier, isDark)}>
          {capitalize(partner.tier)}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={statusBadge(partner.status, isDark)}>
          {capitalize(partner.status)}
        </span>
      </td>

      {/* Actions */}
      {showActions && (
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); openEditModal(partner); }}
              title="Edit"
              className={`p-1.5 rounded-lg transition-colors ${
                isDark
                  ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20'
                  : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
              }`}
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {deleteConfirmId === partner.id ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(partner.id); }}
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
                onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(partner.id); }}
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
        <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
          {headers.map((h, i) => (
            <th
              key={h}
              className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider resizable-th ${
                isDark ? 'text-zinc-500' : 'text-slate-400'
              }`}
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
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
        isDark ? 'bg-zinc-800' : 'bg-slate-100'
      }`}>
        <Building2 className={`w-7 h-7 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
      </div>
      <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
        {message}
      </p>
      <p className={`text-xs mt-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
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
      <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
        {message}
      </p>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Error banner renderer
  // ---------------------------------------------------------------------------

  const renderErrorBanner = (error: string) => (
    <div className={`m-4 p-3 rounded-xl flex items-center gap-2 text-sm ${
      isDark
        ? 'bg-red-900/20 border border-red-800 text-red-400'
        : 'bg-red-50 border border-red-200 text-red-700'
    }`}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {error}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: All Partners Tab
  // ---------------------------------------------------------------------------

  const renderAllPartnersTab = () => (
    <>
      {/* Toolbar: Search + Filters + New Partner */}
      <div className={`${cardClass} p-4`}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
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

          {/* Filter: Status */}
          <div className="w-full lg:w-44">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className={selectClass}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Filter: Tier */}
          <div className="w-full lg:w-40">
            <select
              value={filterTier}
              onChange={e => setFilterTier(e.target.value)}
              className={selectClass}
            >
              <option value="">All Tiers</option>
              {TIERS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Filter: Location */}
          <div className="w-full lg:w-44">
            <select
              value={filterCity}
              onChange={e => { setFilterCity(e.target.value); setPage(1); }}
              className={selectClass}
            >
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.city}>
                  {loc.city}{loc.state ? `, ${loc.state}` : ''}
                </option>
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

          {/* Bulk Import */}
          <button
            onClick={() => setShowBulkImport(true)}
            title="Import from CSV"
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-normal transition-colors whitespace-nowrap ${
              isDark
                ? 'text-zinc-400 border border-zinc-700 hover:bg-zinc-800'
                : 'text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Upload className="w-4 h-4" />
            Import
          </button>

          {/* Export CSV */}
          <button
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
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-normal transition-colors whitespace-nowrap ${
              isDark
                ? 'text-zinc-400 border border-zinc-700 hover:bg-zinc-800 disabled:opacity-30'
                : 'text-slate-500 border border-slate-200 hover:bg-slate-50 disabled:opacity-30'
            }`}
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          {/* Set Targets */}
          <button
            onClick={() => setShowTargetsModal(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap border ${
              isDark
                ? 'text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:text-white'
                : 'text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Target className="w-4 h-4" />
            Set Targets
          </button>

          {/* New Partner */}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Partner
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className={`${cardClass} overflow-hidden`}>
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

        {renderPagination()}
      </div>
    </>
  );

  // ---------------------------------------------------------------------------
  // Render: My Partners Tab
  // ---------------------------------------------------------------------------

  const renderMyPartnersTab = () => (
    <div className={`${cardClass} overflow-hidden`}>
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
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Pending Approval Tab
  // ---------------------------------------------------------------------------

  const renderPendingTab = () => (
    <div className={`${cardClass} overflow-hidden`}>
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
              <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                {['Company Name', 'Contact Person', 'City', 'Type', 'Tier', 'Registered', 'Actions'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider resizable-th ${
                      isDark ? 'text-zinc-500' : 'text-slate-400'
                    }`}
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
                  className={`border-b transition-colors ${
                    isDark
                      ? 'border-zinc-800/50 hover:bg-zinc-800/30'
                      : 'border-slate-50 hover:bg-slate-50/80'
                  }`}
                >
                  {/* Company Name */}
                  <td
                    className={`px-4 py-3 cursor-pointer ${isDark ? 'text-white' : 'text-slate-900'}`}
                    onClick={() => openDetail(partner)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isDark ? 'bg-amber-900/20' : 'bg-amber-50'
                      }`}>
                        <Clock className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                      </div>
                      <span className="font-medium">{partner.companyName}</span>
                    </div>
                  </td>

                  {/* Contact Person */}
                  <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    {partner.contactPerson || '-'}
                  </td>

                  {/* City */}
                  <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    {partner.city || '-'}
                  </td>

                  {/* Type */}
                  <td className={`px-4 py-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    {capitalize(partner.partnerType || '')}
                  </td>

                  {/* Tier */}
                  <td className="px-4 py-3">
                    <span className={tierBadge(partner.tier, isDark)}>
                      {capitalize(partner.tier)}
                    </span>
                  </td>

                  {/* Registered */}
                  <td className={`px-4 py-3 whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    {formatDate(partner.createdAt)}
                  </td>

                  {/* Approve/Reject Actions */}
                  <td className="px-4 py-3">
                    {rejectingId === partner.id ? (
                      <div className="flex items-center gap-2 min-w-[280px]">
                        <input
                          type="text"
                          placeholder="Rejection reason..."
                          value={rejectionReason}
                          onChange={e => setRejectionReason(e.target.value)}
                          className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs ${
                            isDark
                              ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500'
                              : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                          } focus:outline-none focus:ring-1 focus:ring-brand-500`}
                          autoFocus
                        />
                        <button
                          onClick={() => handleReject(partner.id)}
                          disabled={approveSubmitting === partner.id}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {approveSubmitting === partner.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : 'Reject'}
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectionReason(''); setPendingError(''); }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(partner.id)}
                          disabled={approveSubmitting === partner.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          {approveSubmitting === partner.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => { setRejectingId(partner.id); setRejectionReason(''); setPendingError(''); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Partners */}
        <div
          onClick={() => { clearFilters(); navigate('partners'); }}
          className={`${cardClass} p-4 hover-lift animate-fade-in-up stagger-1 cursor-pointer`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            isDark ? 'bg-brand-900/20' : 'bg-brand-50'
          }`}>
            <Building2 className={`w-5 h-5 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
          </div>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Total Partners</p>
          <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {totalCount}
          </p>
        </div>

        {/* Active */}
        <div
          onClick={() => { setFilterStatus('approved'); setActiveTab('all'); navigate('partners'); }}
          className={`${cardClass} p-4 hover-lift animate-fade-in-up stagger-2 cursor-pointer`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'
          }`}>
            <CheckCircle className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </div>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Active</p>
          <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {activeCount}
          </p>
        </div>

        {/* Inactive */}
        <div
          onClick={() => { setFilterStatus('rejected'); setActiveTab('all'); navigate('partners'); }}
          className={`${cardClass} p-4 hover-lift animate-fade-in-up stagger-3 cursor-pointer`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            isDark ? 'bg-slate-800/50' : 'bg-red-50'
          }`}>
            <XCircle className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-red-500'}`} />
          </div>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Inactive</p>
          <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {inactiveCount}
          </p>
        </div>

        {/* Ghost */}
        <div
          onClick={() => { setFilterTier('new'); setFilterStatus('approved'); setActiveTab('all'); navigate('partners'); }}
          className={`${cardClass} p-4 hover-lift animate-fade-in-up stagger-4 cursor-pointer`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            isDark ? 'bg-orange-900/20' : 'bg-orange-50'
          }`}>
            <AlertCircle className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-500'}`} />
          </div>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Ghost</p>
          <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {ghostCount}
          </p>
        </div>

        {/* Pending Approval */}
        <div
          onClick={() => { setActiveTab('pending'); navigate('partners'); }}
          className={`${cardClass} p-4 hover-lift animate-fade-in-up stagger-5 cursor-pointer`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            isDark ? 'bg-amber-900/20' : 'bg-amber-50'
          }`}>
            <Clock className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Pending Approval</p>
          <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {pendingCount}
          </p>
        </div>

        {/* Elite Partners */}
        <div
          onClick={() => { setFilterTier('elite'); setActiveTab('all'); navigate('partners'); }}
          className={`${cardClass} p-4 hover-lift animate-fade-in-up stagger-6 cursor-pointer`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            isDark ? 'bg-purple-900/20' : 'bg-purple-50'
          }`}>
            <Shield className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Elite Partners</p>
          <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {eliteCount}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`${cardClass} p-1 inline-flex rounded-xl`}>
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? isDark
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-brand-600 text-white shadow-md'
                  : isDark
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.key === 'pending' && pendingCount > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isDark
                      ? 'bg-amber-900/30 text-amber-400'
                      : 'bg-amber-100 text-amber-700'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'all' && renderAllPartnersTab()}
      {activeTab === 'my' && renderMyPartnersTab()}
      {activeTab === 'pending' && canApprove && renderPendingTab()}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-backdrop"
            onClick={closeModal}
          />

          {/* Modal content */}
          <div
            className={`relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl animate-fade-in-up ${
              isDark
                ? 'bg-dark-50 border border-zinc-800'
                : 'bg-white shadow-premium'
            }`}
          >
            {/* Header */}
            <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {editingId ? 'Edit Partner' : 'New Partner'}
              </h2>
              <button
                onClick={closeModal}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Form Error */}
              {formError && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                  isDark
                    ? 'bg-red-900/20 border border-red-800 text-red-400'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              {/* Section: Company Info */}
              <div>
                <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                  <Building2 className="w-4 h-4" />
                  Company Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="companyName" className={labelClass}>
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      placeholder="Enter company name"
                      value={formData.companyName}
                      onChange={handleFormChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="partnerType" className={labelClass}>Partner Type</label>
                    <select
                      id="partnerType"
                      name="partnerType"
                      value={formData.partnerType}
                      onChange={handleFormChange}
                      className={selectClass}
                    >
                      <option value="">Select Type</option>
                      {PARTNER_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="tier" className={labelClass}>Tier</label>
                    <select
                      id="tier"
                      name="tier"
                      value={formData.tier}
                      onChange={handleFormChange}
                      className={selectClass}
                    >
                      {TIERS.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {isAdmin() && (
                    <div>
                      <label htmlFor="assignedTo" className={labelClass}>Assigned To</label>
                      <select
                        id="assignedTo"
                        name="assignedTo"
                        value={formData.assignedTo}
                        onChange={handleFormChange}
                        className={selectClass}
                      >
                        <option value="">Select Salesperson</option>
                        {usersList.filter(u => u.isActive).map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label htmlFor="vertical" className={labelClass}>Vertical</label>
                    <input
                      id="vertical"
                      name="vertical"
                      type="text"
                      placeholder="e.g. Enterprise, SMB, Government"
                      value={formData.vertical}
                      onChange={handleFormChange}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="gstNumber" className={labelClass}>GST Number</label>
                    <div className="relative">
                      <Hash className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-zinc-500' : 'text-slate-400'
                      }`} />
                      <input
                        id="gstNumber"
                        name="gstNumber"
                        type="text"
                        placeholder="22AAAAA0000A1Z5"
                        value={formData.gstNumber}
                        onChange={handleFormChange}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="panNumber" className={labelClass}>PAN Number</label>
                    <div className="relative">
                      <FileText className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-zinc-500' : 'text-slate-400'
                      }`} />
                      <input
                        id="panNumber"
                        name="panNumber"
                        type="text"
                        placeholder="AAAPL1234C"
                        value={formData.panNumber}
                        onChange={handleFormChange}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Contact Info */}
              <div>
                <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                  <UserIcon className="w-4 h-4" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactPerson" className={labelClass}>Contact Person</label>
                    <div className="relative">
                      <UserIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-zinc-500' : 'text-slate-400'
                      }`} />
                      <input
                        id="contactPerson"
                        name="contactPerson"
                        type="text"
                        placeholder="Full name"
                        value={formData.contactPerson}
                        onChange={handleFormChange}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className={labelClass}>Email</label>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-zinc-500' : 'text-slate-400'
                      }`} />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="contact@company.com"
                        value={formData.email}
                        onChange={handleFormChange}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className={labelClass}>Phone</label>
                    <div className="relative">
                      <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-zinc-500' : 'text-slate-400'
                      }`} />
                      <input
                        id="phone"
                        name="phone"
                        type="text"
                        placeholder="022-12345678"
                        value={formData.phone}
                        onChange={handleFormChange}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="mobile" className={labelClass}>Mobile</label>
                    <div className="relative">
                      <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-zinc-500' : 'text-slate-400'
                      }`} />
                      <input
                        id="mobile"
                        name="mobile"
                        type="text"
                        placeholder="+91 98765 43210"
                        value={formData.mobile}
                        onChange={handleFormChange}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Address */}
              <div>
                <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                  <MapPin className="w-4 h-4" />
                  Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="address" className={labelClass}>Address</label>
                    <textarea
                      id="address"
                      name="address"
                      rows={2}
                      placeholder="Street address, building, floor..."
                      value={formData.address}
                      onChange={handleFormChange}
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className={labelClass}>City</label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="Mumbai"
                      value={formData.city}
                      onChange={handleFormChange}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className={labelClass}>State</label>
                    <input
                      id="state"
                      name="state"
                      type="text"
                      placeholder="Maharashtra"
                      value={formData.state}
                      onChange={handleFormChange}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="pincode" className={labelClass}>Pincode</label>
                    <input
                      id="pincode"
                      name="pincode"
                      type="text"
                      placeholder="400001"
                      value={formData.pincode}
                      onChange={handleFormChange}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Section: Notes */}
              <div>
                <label htmlFor="notes" className={labelClass}>Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Any additional notes about this partner..."
                  value={formData.notes}
                  onChange={handleFormChange}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Footer actions */}
              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${
                isDark ? 'border-zinc-800' : 'border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isDark
                      ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {editingId ? 'Update Partner' : 'Create Partner'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            className={`relative w-full max-w-lg h-full overflow-y-auto animate-fade-in-up ${
              isDark
                ? 'bg-dark-50 border-l border-zinc-800'
                : 'bg-white shadow-premium'
            }`}
          >
            {/* Panel Header */}
            <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Partner Details
              </h2>
              <div className="flex items-center gap-2">
                {selectedPartner && (
                  <button
                    onClick={() => openEditModal(selectedPartner)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark
                        ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20'
                        : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                    }`}
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={closeDetail}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Panel Content */}
            {detailLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Loading details...
                </p>
              </div>
            ) : selectedPartner ? (
              <div className="p-6 space-y-6">
                {/* Company Header */}
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isDark ? 'bg-brand-900/20' : 'bg-brand-50'
                  }`}>
                    <Building2 className={`w-7 h-7 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {selectedPartner.companyName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={statusBadge(selectedPartner.status, isDark)}>
                        {capitalize(selectedPartner.status)}
                      </span>
                      <span className={tierBadge(selectedPartner.tier, isDark)}>
                        {capitalize(selectedPartner.tier)}
                      </span>
                      {selectedPartner.partnerType && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {capitalize(selectedPartner.partnerType)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className={`rounded-xl p-4 space-y-3 ${
                  isDark ? 'bg-dark-100 border border-zinc-800' : 'bg-slate-50 border border-slate-100'
                }`}>
                  <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Contact Information
                  </h4>

                  {selectedPartner.contactPerson && (
                    <div className="flex items-center gap-3">
                      <UserIcon className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                      <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {selectedPartner.contactPerson}
                      </span>
                    </div>
                  )}

                  {selectedPartner.email && (
                    <div className="flex items-center gap-3">
                      <Mail className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                      <a
                        href={`mailto:${selectedPartner.email}`}
                        className={`text-sm hover:underline ${isDark ? 'text-brand-400' : 'text-brand-600'}`}
                      >
                        {selectedPartner.email}
                      </a>
                    </div>
                  )}

                  {selectedPartner.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                      <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {selectedPartner.phone}
                      </span>
                    </div>
                  )}

                  {selectedPartner.mobile && (
                    <div className="flex items-center gap-3">
                      <Phone className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                      <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {selectedPartner.mobile} <span className={`text-xs ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>(mobile)</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Address */}
                {(selectedPartner.address || selectedPartner.city || selectedPartner.state) && (
                  <div className={`rounded-xl p-4 space-y-3 ${
                    isDark ? 'bg-dark-100 border border-zinc-800' : 'bg-slate-50 border border-slate-100'
                  }`}>
                    <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      Address
                    </h4>
                    <div className="flex items-start gap-3">
                      <MapPin className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                      <div className={`text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
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
                <div className={`rounded-xl p-4 space-y-3 ${
                  isDark ? 'bg-dark-100 border border-zinc-800' : 'bg-slate-50 border border-slate-100'
                }`}>
                  <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Business Details
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Assigned To</p>
                      <p className={`text-sm font-medium mt-0.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {selectedPartner.assignedToName || '-'}
                      </p>
                    </div>

                    {selectedPartner.gstNumber && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>GST Number</p>
                        <p className={`text-sm font-medium mt-0.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {selectedPartner.gstNumber}
                        </p>
                      </div>
                    )}

                    {selectedPartner.panNumber && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>PAN Number</p>
                        <p className={`text-sm font-medium mt-0.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {selectedPartner.panNumber}
                        </p>
                      </div>
                    )}

                    {selectedPartner.vertical && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Vertical</p>
                        <p className={`text-sm font-medium mt-0.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {selectedPartner.vertical}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Active</p>
                      <p className={`text-sm font-medium mt-0.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {selectedPartner.isActive ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedPartner.notes && (
                  <div className={`rounded-xl p-4 space-y-2 ${
                    isDark ? 'bg-dark-100 border border-zinc-800' : 'bg-slate-50 border border-slate-100'
                  }`}>
                    <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      Notes
                    </h4>
                    <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {selectedPartner.notes}
                    </p>
                  </div>
                )}

                {/* Approval History */}
                <div className={`rounded-xl p-4 space-y-3 ${
                  isDark ? 'bg-dark-100 border border-zinc-800' : 'bg-slate-50 border border-slate-100'
                }`}>
                  <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Approval &amp; Timeline
                  </h4>

                  <div className="space-y-3">
                    {/* Created */}
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isDark ? 'bg-zinc-800' : 'bg-slate-200'
                      }`}>
                        <Plus className={`w-3 h-3 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          Partner registered
                        </p>
                        <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                          {formatDate(selectedPartner.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Approved/Rejected */}
                    {selectedPartner.status === 'approved' && selectedPartner.approvedAt && (
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'
                        }`}>
                          <CheckCircle className={`w-3 h-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                            Approved{selectedPartner.approvedBy ? ` by ${selectedPartner.approvedBy}` : ''}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                            {formatDate(selectedPartner.approvedAt)}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedPartner.status === 'rejected' && (
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isDark ? 'bg-red-900/30' : 'bg-red-100'
                        }`}>
                          <XCircle className={`w-3 h-3 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                            Rejected{selectedPartner.approvedBy ? ` by ${selectedPartner.approvedBy}` : ''}
                          </p>
                          {selectedPartner.rejectionReason && (
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-red-400/80' : 'text-red-600/80'}`}>
                              Reason: {selectedPartner.rejectionReason}
                            </p>
                          )}
                          {selectedPartner.approvedAt && (
                            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                              {formatDate(selectedPartner.approvedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Last updated */}
                    {selectedPartner.updatedAt && selectedPartner.updatedAt !== selectedPartner.createdAt && (
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isDark ? 'bg-zinc-800' : 'bg-slate-200'
                        }`}>
                          <Edit2 className={`w-3 h-3 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                            Last updated
                          </p>
                          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                            {formatDate(selectedPartner.updatedAt)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Approve/Reject Controls (in detail panel) */}
                {canApprove && selectedPartner.status === 'pending' && (
                  <div className={`rounded-xl p-4 space-y-3 ${
                    isDark ? 'bg-dark-100 border border-amber-800/30' : 'bg-amber-50/50 border border-amber-200'
                  }`}>
                    <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                      Approval Required
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      This partner is awaiting approval. Review the details above and approve or reject.
                    </p>

                    {rejectingId === selectedPartner.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className={labelClass}>Rejection Reason</label>
                          <input
                            type="text"
                            placeholder="Enter reason for rejection..."
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            className={inputClass}
                            autoFocus
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleDetailReject}
                            disabled={!rejectionReason.trim() || approveSubmitting === selectedPartner.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {approveSubmitting === selectedPartner.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            Confirm Rejection
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                              isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleDetailApprove}
                          disabled={approveSubmitting === selectedPartner.id}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors btn-premium disabled:opacity-50"
                        >
                          {approveSubmitting === selectedPartner.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => { setRejectingId(selectedPartner.id); setRejectionReason(''); }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
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
      {showTargetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-backdrop"
            onClick={() => setShowTargetsModal(false)}
          />

          {/* Modal content */}
          <div
            className={`relative w-full max-w-sm rounded-2xl animate-fade-in-up ${
              isDark
                ? 'bg-dark-50 border border-zinc-800'
                : 'bg-white shadow-premium'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'border-zinc-800' : 'border-slate-200'
            }`}>
              <h2 className={`text-lg font-semibold font-display flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Target className={`w-5 h-5 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
                Set Revenue Targets
              </h2>
              <button
                onClick={() => setShowTargetsModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Set monthly revenue targets per partner tier.
              </p>

              {/* Elite Tier Target */}
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-700'
                    }`}>Elite</span>
                    Tier Target
                  </span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 500000"
                  value={targets.elite}
                  onChange={e => setTargets(prev => ({ ...prev, elite: e.target.value }))}
                  className={inputClass}
                />
              </div>

              {/* Growth Tier Target */}
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'
                    }`}>Growth</span>
                    Tier Target
                  </span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 200000"
                  value={targets.growth}
                  onChange={e => setTargets(prev => ({ ...prev, growth: e.target.value }))}
                  className={inputClass}
                />
              </div>

              {/* New Tier Target */}
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-600'
                    }`}>New</span>
                    Tier Target
                  </span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={targets.new}
                  onChange={e => setTargets(prev => ({ ...prev, new: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
              isDark ? 'border-zinc-800' : 'border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setShowTargetsModal(false)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isDark
                    ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveTargets}
                disabled={isSavingTargets}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-all btn-premium disabled:opacity-50"
              >
                {isSavingTargets ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {isSavingTargets ? 'Saving...' : 'Save Targets'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        entity="partners"
        entityLabel="Partners"
        isDark={isDark}
        onSuccess={() => fetchPartners()}
      />
    </div>
  );
};
