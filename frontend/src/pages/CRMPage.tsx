import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Search, X, ChevronLeft, ChevronRight, Edit2, Trash2,
  IndianRupee, Loader2, AlertCircle, CheckCircle, Calendar,
  Phone, Mail, MessageSquare, Users, Target, TrendingUp,
  Eye, BarChart3, LayoutGrid, List, ArrowRight,
  Clock, StickyNote, FileText, Zap, XCircle,
  ChevronDown, Award, Building2, User as UserIcon, Tags,
  Download, Upload, Send
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useDropdowns } from '@/contexts/DropdownsContext';
import { leadsApi, dealsApi, partnersApi, productsApi, adminApi, accountsApi, contactsApi, uploadsApi, salesApi, formatINR } from '@/services/api';
import { exportToCsv } from '@/utils/exportCsv';
import { Lead, LeadStage, PaginatedResponse, Partner, Product, User, ActivityLog } from '@/types';
import { BulkImportModal } from '@/components/common/BulkImportModal';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { useColumnResize } from '@/hooks/useColumnResize';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;



const STAGE_COLORS: Record<LeadStage, { bg: string; text: string; darkBg: string; darkText: string; iconBg: string; darkIconBg: string }> = {
  New:           { bg: 'bg-cyan-50', text: 'text-cyan-700', darkBg: 'bg-cyan-900/30', darkText: 'text-cyan-400', iconBg: 'bg-cyan-100', darkIconBg: 'bg-cyan-900/20' },
  Proposal:      { bg: 'bg-purple-50', text: 'text-purple-700', darkBg: 'bg-purple-900/30', darkText: 'text-purple-400', iconBg: 'bg-purple-100', darkIconBg: 'bg-purple-900/20' },
  Cold:          { bg: 'bg-blue-50', text: 'text-blue-700', darkBg: 'bg-blue-900/30', darkText: 'text-blue-400', iconBg: 'bg-blue-100', darkIconBg: 'bg-blue-900/20' },
  Negotiation:   { bg: 'bg-orange-50', text: 'text-orange-700', darkBg: 'bg-orange-900/30', darkText: 'text-orange-400', iconBg: 'bg-orange-100', darkIconBg: 'bg-orange-900/20' },
  'Closed Lost': { bg: 'bg-red-50', text: 'text-red-700', darkBg: 'bg-red-900/30', darkText: 'text-red-400', iconBg: 'bg-red-100', darkIconBg: 'bg-red-900/20' },
  'Closed Won':  { bg: 'bg-emerald-50', text: 'text-emerald-700', darkBg: 'bg-emerald-900/30', darkText: 'text-emerald-400', iconBg: 'bg-emerald-100', darkIconBg: 'bg-emerald-900/20' },
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
  tag: string;
  designation: string;
  location: string;

  // Lead Information (Extended)
  firstName: string;
  lastName: string;
  mobile: string;
  mobileAlternate: string;
  phoneAlternate: string;
  campaignSource: string;
  website: string;
  accountType: string;
  leadCategory: string;

  // Order Info
  productList: string;
  typeOfOrder: string;
  billingDeliveryDate: string;
  orderProductDetails: string;
  payment: string;
  poNumberOrMailConfirmation: string;
  brand: string;
  orcAmount: number;
  productWarranty: string;
  shipBy: string;
  specialInstruction: string;
  thirdPartyDeliveryAddress: string;
  billingCompany: string;

  // Forms Info
  enterProductDetails: string;
  rentalDuration: string;
  productConfiguration: string;
  bandwidthRequired: string;
  productNameAndPartNumber: string;
  specifications: string;
  formName: string;

  // Billing Address
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingCountry: string;
  billingZipCode: string;

  // Description Info
  description: string;
  leadTime: string;
  productName: string;
  receiverMobileNumber: string;
  subject: string;
  senderLandlineNo: string;
  senderLandlineNoAlt: string;
  callDuration: string;
  leadType: string;
  queryId: string;
  mcatName: string;

  // Requirements
  requirement: string;
  quotedRequirement: string;

  // Lead Image
  leadImage: string;
}

interface ConvertFormData {
  partnerId: string;
  productId: string;
  amount: number;
  saleDate: string;
  customerName: string;
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
  tag: '',
  designation: '',
  location: '',

  // Lead Information (Extended)
  firstName: '',
  lastName: '',
  mobile: '',
  mobileAlternate: '',
  phoneAlternate: '',
  campaignSource: '',
  website: '',
  accountType: '',
  leadCategory: '',

  // Order Info
  productList: '',
  typeOfOrder: '',
  billingDeliveryDate: '',
  orderProductDetails: '',
  payment: '',
  poNumberOrMailConfirmation: '',
  brand: '',
  orcAmount: 0,
  productWarranty: '',
  shipBy: '',
  specialInstruction: '',
  thirdPartyDeliveryAddress: '',
  billingCompany: '',

  // Forms Info
  enterProductDetails: '',
  rentalDuration: '',
  productConfiguration: '',
  bandwidthRequired: '',
  productNameAndPartNumber: '',
  specifications: '',
  formName: '',

  // Billing Address
  billingStreet: '',
  billingCity: '',
  billingState: '',
  billingCountry: '',
  billingZipCode: '',

  // Description Info
  description: '',
  leadTime: '',
  productName: '',
  receiverMobileNumber: '',
  subject: '',
  senderLandlineNo: '',
  senderLandlineNoAlt: '',
  callDuration: '',
  leadType: '',
  queryId: '',
  mcatName: '',

  // Requirements
  requirement: '',
  quotedRequirement: '',

  // Lead Image
  leadImage: '',
};

const EMPTY_CONVERT_FORM: ConvertFormData = {
  partnerId: '',
  productId: '',
  amount: 0,
  saleDate: new Date().toISOString().split('T')[0],
  customerName: '',
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


function stageBadge(stage: LeadStage, isDark: boolean): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const c = STAGE_COLORS[stage] || STAGE_COLORS.New;
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
  const { setActiveTab: navigate } = useNavigation();
  const { getOptions, getValues } = useDropdowns();
  const isDark = theme === 'dark';

  // Stage definitions (hardcoded to guarantee all stages always render)
  const LEAD_STAGES: LeadStage[] = ['New', 'Cold', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  // Other dropdown data from DB
  const PRIORITIES = getValues('priorities');
  const SOURCES = getOptions('lead-sources');

  // Data state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);

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

  // Pipeline data (all leads grouped by stage)
  const [pipelineLeads, setPipelineLeads] = useState<Record<string, Lead[]>>({});
  const [isPipelineLoading, setIsPipelineLoading] = useState(true);
  const pipelineLoadedRef = useRef(false);

  // Drag-and-drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const tableLoadedRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableError, setTableError] = useState('');

  // Lead form modal
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [leadFormData, setLeadFormData] = useState<LeadFormData>({ ...EMPTY_LEAD_FORM });
  const [leadFormError, setLeadFormError] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    leadInfo: true,
    orderInfo: false,
    formsInfo: false,
    billingAddress: false,
    descriptionInfo: false,
    leadImage: false,
    opportunityDetails: false,
    requirements: true,
    classification: false,
  });

  // Lead detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [auditLogs, setAuditLogs] = useState<ActivityLog[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  // Manual activity entry
  const [activityType, setActivityType] = useState('note');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);

  // Convert modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertLeadId, setConvertLeadId] = useState<string | null>(null);
  const [convertForm, setConvertForm] = useState<ConvertFormData>({ ...EMPTY_CONVERT_FORM });
  const [convertError, setConvertError] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  // Closed Won modal (account + contact creation)
  const [showClosedWonModal, setShowClosedWonModal] = useState(false);
  const [closedWonLeadRef, setClosedWonLeadRef] = useState<{ lead: Lead; source: 'detail' | 'pipeline' } | null>(null);
  const [closedWonForm, setClosedWonForm] = useState({
    accountName: '', industry: '', type: 'Hunting', phone: '', email: '', location: '',
    contactFirstName: '', contactLastName: '', contactEmail: '', contactPhone: '',
    contactDesignation: '', contactDepartment: '',
  });
  const [closedWonError, setClosedWonError] = useState('');
  const [isClosedWonSubmitting, setIsClosedWonSubmitting] = useState(false);
  const [gstFile, setGstFile] = useState<File | null>(null);
  const [msmeFile, setMsmeFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  // Sales order form (for Closed Won)
  const [closedWonOrderForm, setClosedWonOrderForm] = useState({
    quantity: 1, amount: 0, poNumber: '', invoiceNo: '',
    paymentStatus: 'pending', saleDate: new Date().toISOString().split('T')[0],
    partnerId: '',
    contactName: '', contactNo: '', email: '', gstin: '', panNo: '',
    dispatchMethod: '', paymentTerms: '', orderType: 'New' as 'New' | 'Refurb' | 'Rental',
    serialNumber: '', boq: '', price: 0,
  });
  const [closedWonDescription, setClosedWonDescription] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Lead summary counts
  const [leadSummary, setLeadSummary] = useState({ total: 0, new: 0, proposal: 0, cold: 0, negotiation: 0, closedLost: 0, closedWon: 0 });

  // Summarise modal
  const [showSummariseModal, setShowSummariseModal] = useState(false);
  const [summariseLead, setSummariseLead] = useState<Lead | null>(null);


  // ---------------------------------------------------------------------------
  // Styling helpers
  // ---------------------------------------------------------------------------

  const { colWidths: crmColWidths, onMouseDown: onCrmMouseDown } = useColumnResize({
    initialWidths: [45, 70, 180, 150, 130, 130, 220, 130, 110, 160, 160, 110, 120, 100, 120, 120],
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
  // Data fetching
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

  const fetchPipelineLeads = useCallback(async () => {
    if (!pipelineLoadedRef.current) setIsPipelineLoading(true);
    try {
      const response: PaginatedResponse<Lead> = await leadsApi.list({ limit: '100' });
      const grouped: Record<string, Lead[]> = {};
      response.data.forEach(lead => {
        if (!grouped[lead.stage]) grouped[lead.stage] = [];
        grouped[lead.stage].push(lead);
      });
      setPipelineLeads(grouped);
      pipelineLoadedRef.current = true;
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
        partnersApi.list({ limit: '100', status: 'approved' }),
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
  }, [fetchDropdownData]);

  // Fetch based on view mode (always fetch pipeline leads for summary cards)
  useEffect(() => {
    fetchPipelineLeads();
    if (viewMode === 'table') {
      fetchLeads();
    }
  }, [viewMode, fetchLeads, fetchPipelineLeads]);

  // Compute lead summary from pipeline data
  useEffect(() => {
    const newLeads = (pipelineLeads['New'] || []).length;
    const proposal = (pipelineLeads['Proposal'] || []).length;
    const cold = (pipelineLeads['Cold'] || []).length;
    const negotiation = (pipelineLeads['Negotiation'] || []).length;
    const closedLost = (pipelineLeads['Closed Lost'] || []).length;
    const closedWon = (pipelineLeads['Closed Won'] || []).length;
    const total = newLeads + proposal + cold + negotiation + closedLost + closedWon;
    setLeadSummary({ total, new: newLeads, proposal, cold, negotiation, closedLost, closedWon });
  }, [pipelineLeads]);

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
      ...EMPTY_LEAD_FORM,
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
      tag: (lead as any).tag || '',
      designation: (lead as any).designation || '',
      location: (lead as any).location || '',
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  const handleLeadFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setLeadFormData(prev => ({
      ...prev,
      [name]: name === 'estimatedValue' || name === 'orcAmount' ? Number(value) || 0 : value,
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
    setAuditLogs([]);
    setActivities([]);
    setShowDetailModal(true);
    setIsAuditLoading(true);
    try {
      const [auditData, actData] = await Promise.all([
        leadsApi.getAuditLog(lead.id),
        leadsApi.getActivities(lead.id),
      ]);
      setAuditLogs(Array.isArray(auditData) ? auditData : []);
      setActivities(Array.isArray(actData) ? actData : []);
    } catch {
      setAuditLogs([]);
      setActivities([]);
    } finally {
      setIsAuditLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailLead(null);
    setActivityType('note');
    setActivityTitle('');
    setActivityDesc('');
  };

  const handleAddLeadActivity = async () => {
    if (!detailLead || !activityTitle.trim()) return;
    setIsAddingActivity(true);
    try {
      await leadsApi.addActivity(detailLead.id, {
        activity_type: activityType,
        title: activityTitle.trim(),
        description: activityDesc.trim() || undefined,
      });
      setActivityTitle('');
      setActivityDesc('');
      setActivityType('note');
      // Refresh activities list
      const actData = await leadsApi.getActivities(detailLead.id);
      setActivities(Array.isArray(actData) ? actData : []);
    } catch (err) {
      console.error('Failed to add activity', err);
    }
    setIsAddingActivity(false);
  };

  const handleUpdateStage = async (newStage: LeadStage) => {
    if (!detailLead || detailLead.stage === newStage) return;
    // Intercept Closed Won to show account creation popup
    if (newStage === 'Closed Won' && detailLead.stage !== 'Closed Won') {
      openClosedWonModal(detailLead, 'detail');
      return;
    }
    setIsUpdatingStage(true);

    // Optimistic update for both views
    const oldStage = detailLead.stage;
    setPipelineLeads(prev => {
      const updated = { ...prev };
      updated[oldStage] = (updated[oldStage] || []).filter(l => l.id !== detailLead.id);
      updated[newStage] = [...(updated[newStage] || []), { ...detailLead, stage: newStage }];
      return updated;
    });
    setLeads(prev =>
      prev.map(l => l.id === detailLead.id ? { ...l, stage: newStage } : l)
    );

    try {
      const res = await leadsApi.update(detailLead.id, { stage: newStage });
      setDetailLead(res?.data ?? res);
      // Re-sync from server to ensure consistency
      fetchPipelineLeads();
    } catch {
      // Revert on failure
      setPipelineLeads(prev => {
        const reverted = { ...prev };
        reverted[newStage] = (reverted[newStage] || []).filter(l => l.id !== detailLead.id);
        reverted[oldStage] = [...(reverted[oldStage] || []), detailLead];
        return reverted;
      });
      setLeads(prev =>
        prev.map(l => l.id === detailLead.id ? { ...l, stage: oldStage } : l)
      );
    } finally {
      setIsUpdatingStage(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Pipeline card stage change
  // ---------------------------------------------------------------------------

  const handlePipelineMoveStage = async (lead: Lead, newStage: LeadStage) => {
    if (lead.stage === newStage) return;
    // Intercept Closed Won to show account creation popup
    if (newStage === 'Closed Won' && lead.stage !== 'Closed Won') {
      openClosedWonModal(lead, 'pipeline');
      return;
    }

    // Optimistic update — move card instantly in both views
    const oldStage = lead.stage;
    setPipelineLeads(prev => {
      const updated = { ...prev };
      updated[oldStage] = (updated[oldStage] || []).filter(l => l.id !== lead.id);
      updated[newStage] = [...(updated[newStage] || []), { ...lead, stage: newStage }];
      return updated;
    });
    setLeads(prev =>
      prev.map(l => l.id === lead.id ? { ...l, stage: newStage } : l)
    );

    try {
      await leadsApi.update(lead.id, { stage: newStage });
      // Re-sync from server to ensure consistency
      fetchPipelineLeads();
    } catch {
      // Revert on failure
      setPipelineLeads(prev => {
        const reverted = { ...prev };
        reverted[newStage] = (reverted[newStage] || []).filter(l => l.id !== lead.id);
        reverted[oldStage] = [...(reverted[oldStage] || []), lead];
        return reverted;
      });
      setLeads(prev =>
        prev.map(l => l.id === lead.id ? { ...l, stage: oldStage } : l)
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Closed Won handlers
  // ---------------------------------------------------------------------------

  const openClosedWonModal = (lead: Lead, source: 'detail' | 'pipeline') => {
    setClosedWonLeadRef({ lead, source });
    setClosedWonForm({
      accountName: lead.companyName || '',
      industry: '',
      type: 'Hunting',
      phone: lead.phone || '',
      email: lead.email || '',
      location: '',
      contactFirstName: lead.contactPerson?.split(' ')[0] || '',
      contactLastName: lead.contactPerson?.split(' ').slice(1).join(' ') || '',
      contactEmail: lead.email || '',
      contactPhone: lead.phone || '',
      contactDesignation: lead.designation || '',
      contactDepartment: '',
    });
    setGstFile(null);
    setMsmeFile(null);
    setPanFile(null);
    setAadharFile(null);
    setClosedWonOrderForm({
      quantity: 1, amount: lead.estimatedValue || 0, poNumber: '', invoiceNo: '',
      paymentStatus: 'pending', saleDate: new Date().toISOString().split('T')[0],
      partnerId: '',
      contactName: lead.contactPerson || '', contactNo: lead.phone || '', email: lead.email || '',
      gstin: '', panNo: '',
      dispatchMethod: '', paymentTerms: '', orderType: 'New',
      serialNumber: '', boq: '', price: 0,
    });
    setClosedWonDescription(lead.description || '');
    setSelectedProductIds([]);
    setProductSearch('');
    setProductDropdownOpen(false);
    setClosedWonError('');
    setShowClosedWonModal(true);
  };

  const handleClosedWonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closedWonLeadRef) return;
    const { lead } = closedWonLeadRef;

    if (!closedWonForm.accountName.trim()) {
      setClosedWonError('Account name is required');
      return;
    }
    if (!closedWonForm.contactFirstName.trim()) {
      setClosedWonError('Contact first name is required');
      return;
    }
    if (!gstFile) {
      setClosedWonError('GST Certificate is mandatory');
      return;
    }
    if (!panFile) {
      setClosedWonError('PAN Card is mandatory');
      return;
    }
    if (!aadharFile) {
      setClosedWonError('Aadhar Card is mandatory');
      return;
    }
    if (selectedProductIds.length === 0) {
      setClosedWonError('Please select at least one product');
      return;
    }
    if (closedWonOrderForm.amount <= 0) {
      setClosedWonError('Amount must be greater than 0');
      return;
    }
    if (!closedWonOrderForm.saleDate) {
      setClosedWonError('Sale date is required');
      return;
    }

    setIsClosedWonSubmitting(true);
    setClosedWonError('');
    try {
      // 1. Upload documents
      const [gstResult, panResult, aadharResult] = await Promise.all([
        uploadsApi.upload(gstFile),
        uploadsApi.upload(panFile),
        uploadsApi.upload(aadharFile),
      ]);
      let msmeUrl: string | undefined;
      if (msmeFile) {
        const msmeResult = await uploadsApi.upload(msmeFile);
        msmeUrl = msmeResult.url;
      }

      // 2. Create account
      const accountRes = await accountsApi.create({
        name: closedWonForm.accountName,
        industry: closedWonForm.industry || undefined,
        type: closedWonForm.type || undefined,
        phone: closedWonForm.phone || undefined,
        email: closedWonForm.email || undefined,
        location: closedWonForm.location || undefined,
        status: 'active',
        ownerId: user?.id,
      });
      const account = accountRes?.data ?? accountRes;

      // 3. Create contact with document URLs
      await contactsApi.create({
        firstName: closedWonForm.contactFirstName,
        lastName: closedWonForm.contactLastName || undefined,
        email: closedWonForm.contactEmail || undefined,
        phone: closedWonForm.contactPhone || undefined,
        designation: closedWonForm.contactDesignation || undefined,
        department: closedWonForm.contactDepartment || undefined,
        accountId: account.id,
        status: 'active',
        ownerId: user?.id,
        gstCertificateUrl: gstResult.url,
        panCardUrl: panResult.url,
        aadharCardUrl: aadharResult.url,
        msmeCertificateUrl: msmeUrl,
      });

      // 4. Create a deal in "Closed Won" stage from the lead data
      const dealRes = await dealsApi.create({
        title: lead.companyName || closedWonForm.accountName,
        company: lead.companyName || closedWonForm.accountName,
        accountId: account.id,
        value: closedWonOrderForm.amount || lead.estimatedValue || 0,
        stage: 'Closed Won',
        description: closedWonDescription || lead.description || '',
        leadSource: lead.source || '',
        ownerId: user?.id,
        typeOfOrder: lead.typeOfOrder || undefined,
        lineItems: [],
      });
      const deal = dealRes?.data ?? dealRes;

      // 5. Create sales entry
      await salesApi.create({
        partnerId: closedWonOrderForm.partnerId || undefined,
        salespersonId: user?.id,
        customerName: closedWonForm.accountName || undefined,
        quantity: closedWonOrderForm.quantity,
        amount: closedWonOrderForm.amount,
        poNumber: closedWonOrderForm.poNumber || undefined,
        invoiceNo: closedWonOrderForm.invoiceNo || undefined,
        paymentStatus: closedWonOrderForm.paymentStatus,
        saleDate: closedWonOrderForm.saleDate,
        description: closedWonDescription || undefined,
        dealId: deal?.id || undefined,
        productIds: selectedProductIds,
        contactName: closedWonOrderForm.contactName || undefined,
        contactNo: closedWonOrderForm.contactNo || undefined,
        email: closedWonOrderForm.email || undefined,
        gstin: closedWonOrderForm.gstin || undefined,
        panNo: closedWonOrderForm.panNo || undefined,
        dispatchMethod: closedWonOrderForm.dispatchMethod || undefined,
        paymentTerms: closedWonOrderForm.paymentTerms || undefined,
        orderType: closedWonOrderForm.orderType || undefined,
        serialNumber: closedWonOrderForm.serialNumber || undefined,
        boq: closedWonOrderForm.boq || undefined,
        price: closedWonOrderForm.price || undefined,
      });

      // 6. Delete the lead so it no longer appears in leads
      await leadsApi.delete(lead.id);

      setShowClosedWonModal(false);
      setClosedWonLeadRef(null);
      if (closedWonLeadRef.source === 'detail') {
        setDetailLead(null);
      }
      refreshData();

      // 6. Navigate to Deals page
      navigate('deals');
    } catch (err: any) {
      setClosedWonError(err.message || 'Failed to create account');
    } finally {
      setIsClosedWonSubmitting(false);
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
    fetchLeads();
    fetchPipelineLeads();
  };

  const clearFilters = () => {
    setFilterStage('');
    setFilterPriority('');
    setFilterSource('');
    setSearchTerm('');
  };

  const hasActiveFilters = filterStage || filterPriority || filterSource || searchTerm;

  const canConvert = (stage: LeadStage) => {
    return stage === 'Proposal' || stage === 'Negotiation';
  };


  // ---------------------------------------------------------------------------
  // Render: Stats Bar
  // ---------------------------------------------------------------------------

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
            List View
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
            Kanban Board
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

  const hdrCell = `px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`;
  const cellBase = `px-4 py-3 text-sm whitespace-nowrap ${isDark ? 'border-zinc-800' : 'border-slate-100'}`;

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

      {/* Record count bar */}
      {totalRecords > 0 && (
        <div className={`px-4 py-2 text-xs border-b ${isDark ? 'text-zinc-500 border-zinc-800' : 'text-slate-400 border-slate-100'}`}>
          {totalRecords} lead{totalRecords !== 1 ? 's' : ''} found
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Loading leads...
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="premium-table" style={{ minWidth: crmColWidths.reduce((a, b) => a + b, 0) }}>
              <thead>
                <tr className={`border-b ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
                  {['#', 'Summarise', 'Company', 'Contact Name', 'Contact No', 'Designation', 'Email', 'Location', 'Source', 'Requirement', 'Quoted Requirement', 'Value', 'Stage', 'Type', 'Assignee', 'Follow-up Date'].map((label, i) => (
                    <th
                      key={label}
                      className={`${hdrCell} resizable-th ${i === 0 || i === 1 ? 'text-center' : ''}`}
                      style={{ width: crmColWidths[i] }}
                    >
                      {label}
                      <div className="col-resize-handle" onMouseDown={e => onCrmMouseDown(i, e)} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="py-16 text-center">
                      <Users className={`w-8 h-8 mx-auto ${isDark ? 'text-zinc-700' : 'text-slate-300'}`} />
                      <p className={`mt-2 text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        {hasActiveFilters ? 'No leads match filters' : 'No leads yet'}
                      </p>
                    </td>
                  </tr>
                ) : leads.map((lead, idx) => (
                  <tr
                    key={lead.id}
                    onClick={() => openDetailModal(lead)}
                    className={`border-b cursor-pointer transition-colors ${
                      isDark
                        ? 'border-zinc-800 hover:bg-zinc-800/50'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <td className={`${cellBase} text-center ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className={`${cellBase} text-center`}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSummariseLead(lead); setShowSummariseModal(true); }}
                        title="Summarise"
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDark
                            ? 'text-zinc-400 hover:text-brand-400 hover:bg-brand-900/20'
                            : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                    <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <span className="font-medium">{lead.companyName}</span>
                    </td>
                    <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {lead.contactPerson || '-'}
                    </td>
                    <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {lead.phone || '-'}
                    </td>
                    <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {(lead as any).designation || '-'}
                    </td>
                    <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <span className="truncate block max-w-[150px]">{lead.email || '-'}</span>
                    </td>
                    <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {(lead as any).location || '-'}
                    </td>
                    <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <span className="capitalize">{lead.source || '-'}</span>
                    </td>
                    <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <span className="truncate block max-w-[150px]">{lead.requirement || '-'}</span>
                    </td>
                    <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <span className="truncate block max-w-[150px]">{lead.quotedRequirement || '-'}</span>
                    </td>
                    <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {lead.estimatedValue ? formatINR(lead.estimatedValue) : '-'}
                    </td>
                    <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      <span className={stageBadge(lead.stage, isDark)}>{lead.stage}</span>
                    </td>
                    <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {(lead as any).tag ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          (lead as any).tag === 'Channel'
                            ? (isDark ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-50 text-cyan-700')
                            : (isDark ? 'bg-violet-900/30 text-violet-400' : 'bg-violet-50 text-violet-700')
                        }`}>
                          {(lead as any).tag}
                        </span>
                      ) : '-'}
                    </td>
                    <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {(lead as any).assignedToName || '-'}
                    </td>
                    <td className={`${cellBase} ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {lead.nextFollowUp ? formatDate(lead.nextFollowUp) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalRecords > 0 && (
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
          )}
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
        draggable
        onDragStart={e => { e.dataTransfer.setData('text/plain', lead.id); setDraggedLeadId(lead.id); }}
        onDragEnd={() => { setDraggedLeadId(null); setDragOverStage(null); }}
        onClick={() => openDetailModal(lead)}
        className={`p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
          draggedLeadId === lead.id ? 'opacity-40 scale-95' : ''
        } ${
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
      </div>
    );
  };

  const renderPipelineView = () => {
    if (isPipelineLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className={`mt-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Loading kanban board...
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
        {/* All stages as Kanban columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {LEAD_STAGES.map(stage => {
            const stageLeads = (pipelineLeads[stage] || []).filter(filterLead);
            const c = STAGE_COLORS[stage];
            const isOver = dragOverStage === stage;
            const isWon = stage === 'Closed Won';
            const isLost = stage === 'Closed Lost';
            const isTerminal = isWon || isLost;
            return (
              <div
                key={stage}
                onDragOver={e => { e.preventDefault(); setDragOverStage(stage); }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={e => {
                  e.preventDefault();
                  setDragOverStage(null);
                  setDraggedLeadId(null);
                  const leadId = e.dataTransfer.getData('text/plain');
                  if (!leadId) return;
                  const allLeads = Object.values(pipelineLeads).flat();
                  const lead = allLeads.find(l => l.id === leadId);
                  if (lead && lead.stage !== stage) {
                    handlePipelineMoveStage(lead, stage as LeadStage);
                  }
                }}
                className={`${cardClass} p-3 min-h-[200px] transition-all ${isOver ? 'ring-2 ring-brand-500 ring-inset' : ''}`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isTerminal ? (
                      isWon
                        ? <CheckCircle className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        : <XCircle className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                    ) : (
                      <div className={`w-2 h-2 rounded-full ${isDark ? c.darkText.replace('text-', 'bg-') : c.text.replace('text-', 'bg-')}`} />
                    )}
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stage}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {isWon && stageLeads.length > 0 && (
                      <span className={`text-[11px] font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {formatINR(stageLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0))}
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {stageLeads.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {stageLeads.length === 0 ? (
                    <p className={`text-xs text-center py-6 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`}>
                      {isOver ? 'Drop here' : 'No leads'}
                    </p>
                  ) : (
                    stageLeads.map(lead => renderPipelineCard(lead))
                  )}
                </div>
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
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={closeDetailModal} />
        <div className={`relative w-full max-w-2xl max-h-[90vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
          isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
        }`}>
          {/* Header */}
          <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <h2 className={`text-lg font-semibold font-display truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {lead.companyName}
              </h2>
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className={`text-xs font-medium whitespace-nowrap ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Stage:</label>
                <select
                  value={lead.stage}
                  onChange={e => handleUpdateStage(e.target.value as LeadStage)}
                  disabled={isUpdatingStage}
                  className={`px-2 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    isDark
                      ? `${(STAGE_COLORS[lead.stage] || STAGE_COLORS.New).darkBg} ${(STAGE_COLORS[lead.stage] || STAGE_COLORS.New).darkText} border-zinc-700 bg-dark-100`
                      : `${(STAGE_COLORS[lead.stage] || STAGE_COLORS.New).bg} ${(STAGE_COLORS[lead.stage] || STAGE_COLORS.New).text} border-slate-200`
                  } focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50`}
                >
                  {LEAD_STAGES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {isUpdatingStage && <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />}
              </div>
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
              {deleteConfirmId === lead.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { handleDelete(lead.id); closeDetailModal(); }}
                    className="px-2 py-1 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                      isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirmId(lead.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'text-zinc-400 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
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

            {/* Requirements */}
            {(lead.requirement || lead.quotedRequirement) && (
              <div className="space-y-3">
                <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Requirements
                </h4>
                {lead.requirement && (
                  <div>
                    <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Requirement (User Provided)</span>
                    <p className={`text-sm whitespace-pre-wrap mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {lead.requirement}
                    </p>
                  </div>
                )}
                {lead.quotedRequirement && (
                  <div>
                    <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Quoted Requirement (What We Serve)</span>
                    <p className={`text-sm whitespace-pre-wrap mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {lead.quotedRequirement}
                    </p>
                  </div>
                )}
              </div>
            )}

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

            {/* Lost reason */}
            {lead.stage === 'Closed Lost' && lead.lostReason && (
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-red-900/10 border-red-800/50' : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-red-400' : 'text-red-700'}`}>Lost Reason</p>
                <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>{lead.lostReason}</p>
              </div>
            )}

            {/* Won reference */}
            {lead.stage === 'Closed Won' && lead.wonSaleId && (
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-emerald-900/10 border-emerald-800/50' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Converted to Sale</p>
                <p className={`text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>Sale ID: {lead.wonSaleId}</p>
              </div>
            )}

            {/* Add Activity */}
            <div>
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                <MessageSquare className="w-3.5 h-3.5" /> Add Activity
              </h4>
              <div className={`p-3 rounded-xl border space-y-2 ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex gap-2">
                  <select
                    value={activityType}
                    onChange={e => setActivityType(e.target.value)}
                    className={`text-xs px-2 py-1.5 rounded-lg border appearance-none cursor-pointer ${
                      isDark ? 'bg-dark-100 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    } focus:outline-none focus:border-brand-500`}
                  >
                    <option value="note">Note</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="task">Task</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Activity title..."
                    value={activityTitle}
                    onChange={e => setActivityTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddLeadActivity()}
                    className={`flex-1 text-xs px-2 py-1.5 rounded-lg border ${
                      isDark ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    } focus:outline-none focus:border-brand-500`}
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Description (optional)..."
                  value={activityDesc}
                  onChange={e => setActivityDesc(e.target.value)}
                  className={`w-full text-xs px-2 py-1.5 rounded-lg border resize-none ${
                    isDark ? 'bg-dark-100 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  } focus:outline-none focus:border-brand-500`}
                />
                <button
                  onClick={handleAddLeadActivity}
                  disabled={!activityTitle.trim() || isAddingActivity}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                >
                  {isAddingActivity ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  {isAddingActivity ? 'Adding...' : 'Add Activity'}
                </button>
              </div>
            </div>

            {/* Activities */}
            {activities.length > 0 && (
              <div>
                <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  Activities
                </h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {activities.map((act: any) => (
                    <div
                      key={act.id}
                      className={`p-3 rounded-xl border text-xs ${
                        isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {act.title}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {act.activityType || act.activity_type}
                        </span>
                      </div>
                      {act.description && (
                        <p className={`${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{act.description}</p>
                      )}
                      <div className={`flex items-center justify-between mt-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                        {act.createdByName && <span>by {act.createdByName}</span>}
                        {act.createdAt && <span>{new Date(act.createdAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Trail */}
            <div>
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                Audit Trail
              </h4>
              {isAuditLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
                </div>
              ) : auditLogs.length === 0 ? (
                <p className={`text-sm py-4 text-center ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                  No audit history
                </p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {auditLogs.map(log => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border text-xs ${
                        isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {log.action}
                        </span>
                        <span className={isDark ? 'text-zinc-600' : 'text-slate-400'}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      {log.userName && (
                        <p className={isDark ? 'text-zinc-500' : 'text-slate-400'}>
                          by {log.userName}
                        </p>
                      )}
                      {log.changes && log.changes.length > 0 && (
                        <div className={`mt-1 space-y-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                          {log.changes.map((c, i) => (
                            <p key={i}>{c.field}: {c.old || '(empty)'} → {c.new || '(empty)'}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] overflow-y-auto p-4">
        <div className="fixed inset-0 bg-black/50 animate-backdrop" onClick={closeLeadModal} />
        <div className={`relative w-full max-w-xl max-h-[85vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
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
            <div className="p-6 space-y-4">
            {leadFormError && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
                isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {leadFormError}
              </div>
            )}

            {/* Lead Information Section - Collapsible */}
            <div className={`border rounded-lg ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => toggleSection('leadInfo')}
                className={`w-full p-4 flex justify-between items-center transition-colors ${
                  isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserIcon className={`w-4 h-4 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Lead Information</h3>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.leadInfo ? 'rotate-180' : ''} ${
                  isDark ? 'text-zinc-400' : 'text-slate-400'
                }`} />
              </button>
              {expandedSections.leadInfo && (
                <div className="px-4 pb-4 space-y-4">
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

                  {/* First Name + Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className={labelClass}>First Name</label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="First name"
                        value={leadFormData.firstName}
                        onChange={handleLeadFormChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className={labelClass}>Last Name</label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Last name"
                        value={leadFormData.lastName}
                        onChange={handleLeadFormChange}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Email + Mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className={labelClass}>Email</label>
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
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="mobile" className={labelClass}>Mobile</label>
                      <div className="relative">
                        <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                        <input
                          id="mobile"
                          name="mobile"
                          type="text"
                          placeholder="+91 XXXXX XXXXX"
                          value={leadFormData.mobile}
                          onChange={handleLeadFormChange}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone + Mobile Alternate */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div>
                      <label htmlFor="mobileAlternate" className={labelClass}>Mobile Alternate</label>
                      <input
                        id="mobileAlternate"
                        name="mobileAlternate"
                        type="text"
                        placeholder="Alternate mobile"
                        value={leadFormData.mobileAlternate}
                        onChange={handleLeadFormChange}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Phone Alternate + Campaign Source */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phoneAlternate" className={labelClass}>Phone Alternate</label>
                      <input
                        id="phoneAlternate"
                        name="phoneAlternate"
                        type="text"
                        placeholder="Alternate phone"
                        value={leadFormData.phoneAlternate}
                        onChange={handleLeadFormChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="campaignSource" className={labelClass}>Campaign Source</label>
                      <input
                        id="campaignSource"
                        name="campaignSource"
                        type="text"
                        placeholder="Campaign source"
                        value={leadFormData.campaignSource}
                        onChange={handleLeadFormChange}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div>
                    <label htmlFor="website" className={labelClass}>Website</label>
                    <input
                      id="website"
                      name="website"
                      type="url"
                      placeholder="https://company.com"
                      value={leadFormData.website}
                      onChange={handleLeadFormChange}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Order Info Section - Collapsible */}
            <div className={`border rounded-lg ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => toggleSection('orderInfo')}
                className={`w-full p-4 flex justify-between items-center transition-colors ${
                  isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Order Information</h3>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.orderInfo ? 'rotate-180' : ''} ${
                  isDark ? 'text-zinc-400' : 'text-slate-400'
                }`} />
              </button>
              {expandedSections.orderInfo && (
                <div className="px-4 pb-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="productList" className={labelClass}>Product List</label>
                      <input id="productList" name="productList" type="text" placeholder="Product list" value={leadFormData.productList} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="typeOfOrder" className={labelClass}>Type of Order</label>
                      <input id="typeOfOrder" name="typeOfOrder" type="text" placeholder="Order type" value={leadFormData.typeOfOrder} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="billingDeliveryDate" className={labelClass}>Billing Delivery Date</label>
                      <input id="billingDeliveryDate" name="billingDeliveryDate" type="date" value={leadFormData.billingDeliveryDate} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="payment" className={labelClass}>Payment</label>
                      <input id="payment" name="payment" type="text" placeholder="Payment details" value={leadFormData.payment} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="orderProductDetails" className={labelClass}>Order Product Details</label>
                    <textarea id="orderProductDetails" name="orderProductDetails" rows={3} placeholder="Order product details..." value={leadFormData.orderProductDetails} onChange={handleLeadFormChange} className={`${inputClass} resize-none`} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="poNumberOrMailConfirmation" className={labelClass}>PO Number / Mail Confirmation</label>
                      <input id="poNumberOrMailConfirmation" name="poNumberOrMailConfirmation" type="text" placeholder="PO number" value={leadFormData.poNumberOrMailConfirmation} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="brand" className={labelClass}>Brand</label>
                      <input id="brand" name="brand" type="text" placeholder="Brand" value={leadFormData.brand} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="orcAmount" className={labelClass}>ORC Amount (INR)</label>
                      <div className="relative">
                        <IndianRupee className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                        <input id="orcAmount" name="orcAmount" type="number" min="0" step="1" placeholder="0" value={leadFormData.orcAmount || ''} onChange={handleLeadFormChange} className={`${inputClass} pl-10`} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="productWarranty" className={labelClass}>Product Warranty</label>
                      <input id="productWarranty" name="productWarranty" type="text" placeholder="Warranty" value={leadFormData.productWarranty} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="shipBy" className={labelClass}>Ship By</label>
                      <input id="shipBy" name="shipBy" type="text" placeholder="Shipping method" value={leadFormData.shipBy} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="billingCompany" className={labelClass}>Billing Company</label>
                      <input id="billingCompany" name="billingCompany" type="text" placeholder="Billing company" value={leadFormData.billingCompany} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="specialInstruction" className={labelClass}>Special Instructions</label>
                    <textarea id="specialInstruction" name="specialInstruction" rows={2} placeholder="Special instructions..." value={leadFormData.specialInstruction} onChange={handleLeadFormChange} className={`${inputClass} resize-none`} />
                  </div>
                  <div>
                    <label htmlFor="thirdPartyDeliveryAddress" className={labelClass}>3rd Party Delivery Address</label>
                    <textarea id="thirdPartyDeliveryAddress" name="thirdPartyDeliveryAddress" rows={2} placeholder="Delivery address..." value={leadFormData.thirdPartyDeliveryAddress} onChange={handleLeadFormChange} className={`${inputClass} resize-none`} />
                  </div>
                </div>
              )}
            </div>

            {/* Forms Info Section - Collapsible */}
            <div className={`border rounded-lg ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => toggleSection('formsInfo')}
                className={`w-full p-4 flex justify-between items-center transition-colors ${
                  isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Forms Info</h3>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.formsInfo ? 'rotate-180' : ''} ${
                  isDark ? 'text-zinc-400' : 'text-slate-400'
                }`} />
              </button>
              {expandedSections.formsInfo && (
                <div className="px-4 pb-4 space-y-4">
                  <div>
                    <label htmlFor="enterProductDetails" className={labelClass}>Enter Product Details</label>
                    <textarea id="enterProductDetails" name="enterProductDetails" rows={3} placeholder="Product details..." value={leadFormData.enterProductDetails} onChange={handleLeadFormChange} className={`${inputClass} resize-none`} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="rentalDuration" className={labelClass}>Rental Duration</label>
                      <input id="rentalDuration" name="rentalDuration" type="text" placeholder="e.g., 12 months" value={leadFormData.rentalDuration} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="bandwidthRequired" className={labelClass}>Bandwidth Required</label>
                      <input id="bandwidthRequired" name="bandwidthRequired" type="text" placeholder="Bandwidth" value={leadFormData.bandwidthRequired} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="productConfiguration" className={labelClass}>Product Configuration</label>
                    <textarea id="productConfiguration" name="productConfiguration" rows={3} placeholder="Configuration details..." value={leadFormData.productConfiguration} onChange={handleLeadFormChange} className={`${inputClass} resize-none`} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="productNameAndPartNumber" className={labelClass}>Product Name & Part Number</label>
                      <input id="productNameAndPartNumber" name="productNameAndPartNumber" type="text" placeholder="Product & part number" value={leadFormData.productNameAndPartNumber} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="formName" className={labelClass}>Form Name</label>
                      <input id="formName" name="formName" type="text" placeholder="Form name" value={leadFormData.formName} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="specifications" className={labelClass}>Specifications</label>
                    <textarea id="specifications" name="specifications" rows={3} placeholder="Specifications..." value={leadFormData.specifications} onChange={handleLeadFormChange} className={`${inputClass} resize-none`} />
                  </div>
                </div>
              )}
            </div>

            {/* Billing Address Section - Collapsible */}
            <div className={`border rounded-lg ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => toggleSection('billingAddress')}
                className={`w-full p-4 flex justify-between items-center transition-colors ${
                  isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className={`w-4 h-4 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Billing Address</h3>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.billingAddress ? 'rotate-180' : ''} ${
                  isDark ? 'text-zinc-400' : 'text-slate-400'
                }`} />
              </button>
              {expandedSections.billingAddress && (
                <div className="px-4 pb-4 space-y-4">
                  <div>
                    <label htmlFor="billingStreet" className={labelClass}>Street</label>
                    <input id="billingStreet" name="billingStreet" type="text" placeholder="Street address" value={leadFormData.billingStreet} onChange={handleLeadFormChange} className={inputClass} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="billingCity" className={labelClass}>City</label>
                      <input id="billingCity" name="billingCity" type="text" placeholder="City" value={leadFormData.billingCity} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="billingState" className={labelClass}>State</label>
                      <input id="billingState" name="billingState" type="text" placeholder="State" value={leadFormData.billingState} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="billingCountry" className={labelClass}>Country</label>
                      <input id="billingCountry" name="billingCountry" type="text" placeholder="Country" value={leadFormData.billingCountry} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="billingZipCode" className={labelClass}>Zip Code</label>
                      <input id="billingZipCode" name="billingZipCode" type="text" placeholder="Zip code" value={leadFormData.billingZipCode} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description Info Section - Collapsible */}
            <div className={`border rounded-lg ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => toggleSection('descriptionInfo')}
                className={`w-full p-4 flex justify-between items-center transition-colors ${
                  isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <StickyNote className={`w-4 h-4 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Description Info</h3>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.descriptionInfo ? 'rotate-180' : ''} ${
                  isDark ? 'text-zinc-400' : 'text-slate-400'
                }`} />
              </button>
              {expandedSections.descriptionInfo && (
                <div className="px-4 pb-4 space-y-4">
                  <div>
                    <label htmlFor="description" className={labelClass}>Description</label>
                    <RichTextEditor
                      value={leadFormData.description}
                      onChange={(html) => setLeadFormData(prev => ({ ...prev, description: html }))}
                      placeholder="Description..."
                      isDark={isDark}
                      minHeight="80px"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="leadTime" className={labelClass}>Lead Time</label>
                      <input id="leadTime" name="leadTime" type="text" placeholder="Lead time" value={leadFormData.leadTime} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="productName" className={labelClass}>Product Name</label>
                      <input id="productName" name="productName" type="text" placeholder="Product name" value={leadFormData.productName} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="receiverMobileNumber" className={labelClass}>Receiver Mobile Number</label>
                      <input id="receiverMobileNumber" name="receiverMobileNumber" type="text" placeholder="Receiver mobile" value={leadFormData.receiverMobileNumber} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="callDuration" className={labelClass}>Call Duration</label>
                      <input id="callDuration" name="callDuration" type="text" placeholder="Call duration" value={leadFormData.callDuration} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className={labelClass}>Subject</label>
                    <input id="subject" name="subject" type="text" placeholder="Subject" value={leadFormData.subject} onChange={handleLeadFormChange} className={inputClass} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="senderLandlineNo" className={labelClass}>Sender Landline No</label>
                      <input id="senderLandlineNo" name="senderLandlineNo" type="text" placeholder="Landline" value={leadFormData.senderLandlineNo} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="senderLandlineNoAlt" className={labelClass}>Sender Landline No (Alt)</label>
                      <input id="senderLandlineNoAlt" name="senderLandlineNoAlt" type="text" placeholder="Alt landline" value={leadFormData.senderLandlineNoAlt} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="leadType" className={labelClass}>Lead Type</label>
                      <input id="leadType" name="leadType" type="text" placeholder="Lead type" value={leadFormData.leadType} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="queryId" className={labelClass}>Query ID</label>
                      <input id="queryId" name="queryId" type="text" placeholder="Query ID" value={leadFormData.queryId} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="mcatName" className={labelClass}>MCAT Name</label>
                      <input id="mcatName" name="mcatName" type="text" placeholder="MCAT name" value={leadFormData.mcatName} onChange={handleLeadFormChange} className={inputClass} />
                    </div>
                  </div>
                </div>
              )}
            </div>


            {/* Requirements Section - Collapsible */}
            <div className={`border rounded-lg ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => toggleSection('requirements')}
                className={`w-full p-4 flex justify-between items-center transition-colors ${
                  isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Requirements</h3>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.requirements ? 'rotate-180' : ''} ${
                  isDark ? 'text-zinc-400' : 'text-slate-400'
                }`} />
              </button>
              {expandedSections.requirements && (
                <div className="px-4 pb-4 space-y-4">
                  <div>
                    <label htmlFor="requirement" className={labelClass}>Requirement (User Provided)</label>
                    <textarea
                      id="requirement"
                      name="requirement"
                      rows={3}
                      placeholder="What the user/lead requires..."
                      value={leadFormData.requirement}
                      onChange={handleLeadFormChange}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="quotedRequirement" className={labelClass}>Quoted Requirement (What We Serve)</label>
                    <textarea
                      id="quotedRequirement"
                      name="quotedRequirement"
                      rows={3}
                      placeholder="What we are offering/serving..."
                      value={leadFormData.quotedRequirement}
                      onChange={handleLeadFormChange}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Lead Classification Section - Collapsible */}
            <div className={`border rounded-lg ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => toggleSection('classification')}
                className={`w-full p-4 flex justify-between items-center transition-colors ${
                  isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Tags className={`w-4 h-4 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Lead Classification</h3>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.classification ? 'rotate-180' : ''} ${
                  isDark ? 'text-zinc-400' : 'text-slate-400'
                }`} />
              </button>
              {expandedSections.classification && (
                <div className="px-4 pb-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="source" className={labelClass}>Source</label>
                      <select id="source" name="source" value={leadFormData.source} onChange={handleLeadFormChange} className={selectClass}>
                        <option value="">Select Source</option>
                        {SOURCES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="stage" className={labelClass}>Stage</label>
                      <select id="stage" name="stage" value={leadFormData.stage} onChange={handleLeadFormChange} className={selectClass}>
                        {LEAD_STAGES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="priority" className={labelClass}>Priority</label>
                      <select id="priority" name="priority" value={leadFormData.priority} onChange={handleLeadFormChange} className={selectClass}>
                        {PRIORITIES.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="assignedTo" className={labelClass}>Assigned To</label>
                      <div className="relative">
                        <Users className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                        <select id="assignedTo" name="assignedTo" value={leadFormData.assignedTo} onChange={handleLeadFormChange} className={`${selectClass} pl-10`}>
                          <option value="">Auto-assign (Me)</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="partnerId" className={labelClass}>Partner</label>
                      <select id="partnerId" name="partnerId" value={leadFormData.partnerId} onChange={handleLeadFormChange} className={selectClass}>
                        <option value="">Select Partner (Optional)</option>
                        {partners.map(p => (
                          <option key={p.id} value={p.id}>{p.companyName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="tag" className={labelClass}>Type</label>
                      <select id="tag" name="tag" value={leadFormData.tag} onChange={handleLeadFormChange} className={selectClass}>
                        <option value="">Select Type</option>
                        <option value="Channel">Channel</option>
                        <option value="End Customer">End Customer</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Designation */}
                    <div>
                      <label htmlFor="lead-designation" className={labelClass}>Designation</label>
                      <input
                        id="lead-designation"
                        name="designation"
                        type="text"
                        className={inputClass}
                        placeholder="e.g. Manager, Director"
                        value={(leadFormData as any).designation || ''}
                        onChange={handleLeadFormChange}
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label htmlFor="lead-location" className={labelClass}>Location</label>
                      <input
                        id="lead-location"
                        name="location"
                        type="text"
                        className={inputClass}
                        placeholder="e.g. Mumbai, Delhi"
                        value={(leadFormData as any).location || ''}
                        onChange={handleLeadFormChange}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className={labelClass}>Notes</label>
              <textarea id="notes" name="notes" rows={3} placeholder="Additional notes about this lead..." value={leadFormData.notes} onChange={handleLeadFormChange} className={`${inputClass} resize-none`} />
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
        <div className={`relative w-full max-w-md max-h-[90vh] rounded-2xl animate-fade-in-up flex flex-col overflow-hidden ${
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
  // Render: Closed Won Modal (Account + Contact creation)
  // ---------------------------------------------------------------------------

  const renderClosedWonModal = () => {
    if (!showClosedWonModal || !closedWonLeadRef) return null;
    const { lead } = closedWonLeadRef;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setClosedWonForm(prev => ({ ...prev, [name]: value }));
    };

    const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setClosedWonOrderForm(prev => ({
        ...prev,
        [name]: (name === 'quantity' || name === 'amount' || name === 'price') ? Number(value) || 0 : value,
      }));
    };

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 animate-backdrop" onClick={() => setShowClosedWonModal(false)} />
        <div className={`relative w-full max-w-2xl rounded-2xl animate-fade-in-up ${
          isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-premium'
        }`}>
          <form onSubmit={handleClosedWonSubmit}>
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'border-zinc-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <h2 className={`text-lg font-semibold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Closed Won — Create Account & Sales Order
                </h2>
              </div>
              <button type="button" onClick={() => setShowClosedWonModal(false)} className={`p-2 rounded-lg ${isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-400 hover:bg-slate-100'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Lead "<strong>{lead.companyName}</strong>" is being marked as Closed Won. Create an account, contact, and sales order.
              </p>

              {closedWonError && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{closedWonError}
                </div>
              )}

              {/* Account Details Section */}
              <div>
                <h3 className={`text-sm font-semibold mb-3 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Building2 className="w-4 h-4" /> Account Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>Account Name *</label>
                    <input name="accountName" value={closedWonForm.accountName} onChange={handleChange} className={inputClass} required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Industry</label>
                      <select name="industry" value={closedWonForm.industry} onChange={handleChange} className={selectClass}>
                        <option value="">-None-</option>
                        {['Technology','Healthcare','Finance','Manufacturing','Retail','Education','Real Estate','Telecom','Energy','Media','Other'].map(i => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Type</label>
                      <select name="type" value={closedWonForm.type} onChange={handleChange} className={selectClass}>
                        <option value="">-None-</option>
                        <option value="Hunting">Hunting</option>
                        <option value="Farming">Farming</option>
                        <option value="Cold">Cold</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Phone</label>
                      <input name="phone" value={closedWonForm.phone} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Email</label>
                      <input name="email" type="email" value={closedWonForm.email} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Location</label>
                    <input name="location" value={closedWonForm.location} onChange={handleChange} className={inputClass} />
                  </div>
                </div>
              </div>

              {/* Contact Details Section */}
              <div>
                <h3 className={`text-sm font-semibold mb-3 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <UserIcon className="w-4 h-4" /> Contact Details
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>First Name *</label>
                      <input name="contactFirstName" value={closedWonForm.contactFirstName} onChange={handleChange} className={inputClass} required />
                    </div>
                    <div>
                      <label className={labelClass}>Last Name</label>
                      <input name="contactLastName" value={closedWonForm.contactLastName} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Email</label>
                      <input name="contactEmail" type="email" value={closedWonForm.contactEmail} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Contact No</label>
                      <input name="contactPhone" value={closedWonForm.contactPhone} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Designation</label>
                      <input name="contactDesignation" value={closedWonForm.contactDesignation} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Department</label>
                      <input name="contactDepartment" value={closedWonForm.contactDepartment} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Uploads Section */}
              <div>
                <h3 className={`text-sm font-semibold mb-3 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Upload className="w-4 h-4" /> Document Uploads
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>GST Certificate *</label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setGstFile(e.target.files?.[0] || null)} className={`${inputClass} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium ${isDark ? 'file:bg-zinc-700 file:text-zinc-200' : 'file:bg-slate-100 file:text-slate-700'}`} />
                    {gstFile && <span className={`text-xs mt-1 block ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{gstFile.name}</span>}
                  </div>
                  <div>
                    <label className={labelClass}>MSME Certificate <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>(optional)</span></label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setMsmeFile(e.target.files?.[0] || null)} className={`${inputClass} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium ${isDark ? 'file:bg-zinc-700 file:text-zinc-200' : 'file:bg-slate-100 file:text-slate-700'}`} />
                    {msmeFile && <span className={`text-xs mt-1 block ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{msmeFile.name}</span>}
                  </div>
                  <div>
                    <label className={labelClass}>PAN Card *</label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setPanFile(e.target.files?.[0] || null)} className={`${inputClass} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium ${isDark ? 'file:bg-zinc-700 file:text-zinc-200' : 'file:bg-slate-100 file:text-slate-700'}`} />
                    {panFile && <span className={`text-xs mt-1 block ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{panFile.name}</span>}
                  </div>
                  <div>
                    <label className={labelClass}>Aadhar Card *</label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setAadharFile(e.target.files?.[0] || null)} className={`${inputClass} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium ${isDark ? 'file:bg-zinc-700 file:text-zinc-200' : 'file:bg-slate-100 file:text-slate-700'}`} />
                    {aadharFile && <span className={`text-xs mt-1 block ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{aadharFile.name}</span>}
                  </div>
                </div>
              </div>

              {/* ── Sales Order Form ── */}
              <div className={`rounded-xl p-4 space-y-4 ${isDark ? 'bg-zinc-900/50 border border-zinc-800' : 'bg-slate-50 border border-slate-200'}`}>
                <h3 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>Sales Order Details</h3>

                {/* Product Selection */}
                <div className="relative">
                  <label className={labelClass}>Products <span className="text-red-500">*</span></label>
                  <button
                    type="button"
                    onClick={() => setProductDropdownOpen(prev => !prev)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm text-left transition-colors ${
                      isDark
                        ? 'bg-dark-100 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <span className={selectedProductIds.length === 0 ? (isDark ? 'text-zinc-500' : 'text-slate-400') : ''}>
                      {selectedProductIds.length === 0
                        ? '-- Select Products --'
                        : `${selectedProductIds.length} product(s) selected`}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${productDropdownOpen ? 'rotate-180' : ''} ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  </button>
                  {productDropdownOpen && (
                    <div className={`absolute z-10 left-0 right-0 mt-1 rounded-xl border shadow-lg ${
                      isDark ? 'bg-dark-100 border-zinc-700' : 'bg-white border-slate-200'
                    }`}>
                      <div className="p-2">
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={productSearch}
                          onChange={e => setProductSearch(e.target.value)}
                          className={`${inputClass} text-sm`}
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto px-2 pb-2 space-y-1">
                        {products.length === 0 ? (
                          <p className={`text-xs px-2 py-3 text-center ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No products found</p>
                        ) : products.filter(p => p.isActive && p.name.toLowerCase().includes(productSearch.toLowerCase())).map(product => (
                          <label key={product.id} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                            selectedProductIds.includes(product.id)
                              ? isDark ? 'bg-brand-900/30 text-brand-300' : 'bg-brand-50 text-brand-700'
                              : isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-700'
                          }`}>
                            <input
                              type="checkbox"
                              checked={selectedProductIds.includes(product.id)}
                              onChange={() => {
                                setSelectedProductIds(prev =>
                                  prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id]
                                );
                              }}
                              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                            <span className="text-sm">{product.name}</span>
                            {product.basePrice ? <span className={`text-xs ml-auto ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{formatINR(product.basePrice)}</span> : null}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Contact Name</label>
                    <input name="contactName" value={closedWonOrderForm.contactName} onChange={handleOrderChange} className={inputClass} placeholder="Contact person" />
                  </div>
                  <div>
                    <label className={labelClass}>Contact No</label>
                    <input name="contactNo" value={closedWonOrderForm.contactNo} onChange={handleOrderChange} className={inputClass} placeholder="+91..." />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input name="email" type="email" value={closedWonOrderForm.email} onChange={handleOrderChange} className={inputClass} placeholder="email@example.com" />
                  </div>
                </div>

                {/* Company Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>GSTIN</label>
                    <input name="gstin" value={closedWonOrderForm.gstin} onChange={handleOrderChange} className={inputClass} placeholder="22AAAAA0000A1Z5" />
                  </div>
                  <div>
                    <label className={labelClass}>PAN No</label>
                    <input name="panNo" value={closedWonOrderForm.panNo} onChange={handleOrderChange} className={inputClass} placeholder="AAAAA0000A" />
                  </div>
                </div>

                {/* Quantity, Price & Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Quantity</label>
                    <input name="quantity" type="number" min="1" value={closedWonOrderForm.quantity} onChange={handleOrderChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Price (per unit)</label>
                    <input name="price" type="number" min="0" step="0.01" value={closedWonOrderForm.price} onChange={handleOrderChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Amount <span className="text-red-500">*</span></label>
                    <input name="amount" type="number" min="0" step="0.01" value={closedWonOrderForm.amount} onChange={handleOrderChange} className={inputClass} required />
                  </div>
                </div>

                {/* Dispatch Method & Payment Terms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Dispatch Method</label>
                    <select name="dispatchMethod" value={closedWonOrderForm.dispatchMethod} onChange={handleOrderChange} className={selectClass}>
                      <option value="">-- Select --</option>
                      <option value="Air">Air</option>
                      <option value="Road">Road</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Payment Terms</label>
                    <input name="paymentTerms" value={closedWonOrderForm.paymentTerms} onChange={handleOrderChange} className={inputClass} placeholder="e.g. Net 30" />
                  </div>
                </div>

                {/* Sale Date */}
                <div>
                  <label className={labelClass}>Sale Date <span className="text-red-500">*</span></label>
                  <input name="saleDate" type="date" value={closedWonOrderForm.saleDate} onChange={handleOrderChange} className={inputClass} required />
                </div>

                {/* Order Type Toggle */}
                <div>
                  <label className={labelClass}>Order Type</label>
                  <div className="flex gap-2">
                    {(['New', 'Refurb', 'Rental'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setClosedWonOrderForm(prev => ({ ...prev, orderType: t }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          closedWonOrderForm.orderType === t
                            ? 'bg-brand-600 text-white shadow-sm'
                            : isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BOQ */}
                <div>
                  <label className={labelClass}>BOQ (Bill of Quantities)</label>
                  <textarea
                    name="boq"
                    rows={3}
                    placeholder="Enter BOQ details..."
                    value={closedWonOrderForm.boq}
                    onChange={handleOrderChange}
                    className={inputClass}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    rows={2}
                    placeholder="Description of the sales order..."
                    value={closedWonDescription}
                    onChange={e => setClosedWonDescription(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
              <button type="button" onClick={() => setShowClosedWonModal(false)} className={`px-4 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100'}`}>
                Cancel
              </button>
              <button type="submit" disabled={isClosedWonSubmitting} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all btn-premium disabled:opacity-50">
                {isClosedWonSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Create Account & Sales Order</>
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
            Leads
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Manage leads, track progress, and convert opportunities
          </p>
        </div>
      </div>

      {/* Stage Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total */}
        <div className={`${cardClass} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{leadSummary.total}</p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total</p>
          </div>
        </div>
        {/* New */}
        <div className={`${cardClass} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{leadSummary.new}</p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>New</p>
          </div>
        </div>
        {/* Proposal */}
        <div className={`${cardClass} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{leadSummary.proposal}</p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Proposal</p>
          </div>
        </div>
        {/* Cold */}
        <div className={`${cardClass} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{leadSummary.cold}</p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Cold</p>
          </div>
        </div>
        {/* Negotiation */}
        <div className={`${cardClass} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{leadSummary.negotiation}</p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Negotiation</p>
          </div>
        </div>
        {/* Closed Lost */}
        <div className={`${cardClass} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{leadSummary.closedLost}</p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Closed Lost</p>
          </div>
        </div>
        {/* Closed Won */}
        <div className={`${cardClass} p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>{leadSummary.closedWon}</p>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Closed Won</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {renderToolbar()}

      {/* Content */}
      {viewMode === 'table' ? renderTableView() : renderPipelineView()}

      {/* Modals */}
      {renderLeadModal()}
      {renderDetailModal()}
      {renderConvertModal()}
      {renderClosedWonModal()}

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        entity="leads"
        entityLabel="Leads"
        isDark={isDark}
        onSuccess={() => fetchLeads()}
      />

      {/* Summarise Modal */}
      {showSummariseModal && summariseLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowSummariseModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className={`relative w-full max-w-lg rounded-2xl shadow-2xl border p-6 ${
              isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Lead Summary
              </h3>
              <button
                onClick={() => setShowSummariseModal(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
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
                  <span className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{item.label}</span>
                  <span className={`text-sm text-right max-w-[60%] ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
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
