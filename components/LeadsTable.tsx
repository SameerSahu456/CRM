import React, { useState, useEffect, useRef } from 'react';
import {
  Filter, Download, MoreVertical, Mail, Phone, Plus, Search, X, TrendingUp, Users, Target, Clock,
  ArrowRight, Star, Building2, Calendar, Briefcase, CheckCircle2, AlertCircle, Zap, Loader2,
  Edit3, Tag, UserPlus, Trash2, PhoneCall, PhoneOutgoing, FileText, MessageSquare, ChevronDown,
  History, MapPin, Globe, Hash, DollarSign, Clipboard, Package, Send, ChevronRight
} from 'lucide-react';
import { Lead } from '../types';
import { leadsApi, accountsApi, contactsApi, dealsApi, profilesApi } from '../services/api';
import { ViewToggle, ViewMode } from './ViewToggle';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const getStatusColor = (status: string, isDark: boolean) => {
  const colors: Record<string, string> = {
    'New': isDark ? 'bg-blue-900/50 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200',
    'Contacted': isDark ? 'bg-yellow-900/50 text-yellow-300 border-yellow-700' : 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Qualified': isDark ? 'bg-green-900/50 text-green-300 border-green-700' : 'bg-green-50 text-green-700 border-green-200',
    'Proposal': isDark ? 'bg-purple-900/50 text-purple-300 border-purple-700' : 'bg-purple-50 text-purple-700 border-purple-200',
    'Negotiation': isDark ? 'bg-orange-900/50 text-orange-300 border-orange-700' : 'bg-orange-50 text-orange-700 border-orange-200',
    'Lost': isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return colors[status] || (isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-50 text-slate-700 border-slate-200');
};

const getScoreColor = (score: number) => {
  if (score >= 80) return { text: 'text-green-600', bg: 'bg-green-500', label: 'Hot' };
  if (score >= 60) return { text: 'text-yellow-600', bg: 'bg-yellow-500', label: 'Warm' };
  if (score >= 40) return { text: 'text-orange-600', bg: 'bg-orange-500', label: 'Cool' };
  return { text: 'text-red-500', bg: 'bg-red-500', label: 'Cold' };
};

const getSourceIcon = (source: string) => {
  const icons: Record<string, string> = {
    'Website': '🌐', 'Referral': '👥', 'LinkedIn': '💼', 'Trade Show': '🎪',
    'Cold Call': '📞', 'Email Campaign': '📧', 'Social Media': '📱', 'Partner': '🤝',
  };
  return icons[source] || '📌';
};

// Mock lead data for offline/development mode
const MOCK_LEADS: Lead[] = [
  {
    id: 'lead-1',
    firstName: 'John',
    lastName: 'Smith',
    company: 'TechFlow Solutions',
    email: 'john.smith@techflow.com',
    phone: '+1 (555) 123-4567',
    status: 'Qualified',
    source: 'Website',
    score: 85,
    owner: 'Sarah Jenkins',
    createdAt: '2024-12-10T10:00:00Z',
    lastActive: '2024-12-18T14:30:00Z',
    avatar: '',
    notes: 'Very interested in enterprise solutions',
    tags: ['Enterprise', 'High Priority'],
    budget: 50000,
    timeline: 'Q1 2025',
    industry: 'Technology',
    jobTitle: 'IT Director',
  },
  {
    id: 'lead-2',
    firstName: 'Emily',
    lastName: 'Johnson',
    company: 'Creative Studios Inc',
    email: 'emily.j@creativestudios.io',
    phone: '+1 (555) 234-5678',
    status: 'New',
    source: 'LinkedIn',
    score: 65,
    owner: 'Michael Chen',
    createdAt: '2024-12-15T09:00:00Z',
    lastActive: '2024-12-17T11:00:00Z',
    avatar: '',
    notes: 'Looking for printing solutions',
    tags: ['Creative', 'Printing'],
    budget: 25000,
    timeline: 'Q2 2025',
    industry: 'Media',
    jobTitle: 'Marketing Manager',
  },
  {
    id: 'lead-3',
    firstName: 'Robert',
    lastName: 'Williams',
    company: 'Global Logistics Corp',
    email: 'r.williams@globallogistics.com',
    phone: '+1 (555) 345-6789',
    status: 'Contacted',
    source: 'Trade Show',
    score: 72,
    owner: 'Sarah Jenkins',
    createdAt: '2024-12-05T14:00:00Z',
    lastActive: '2024-12-16T10:00:00Z',
    avatar: '',
    notes: 'Met at industry expo',
    tags: ['Logistics', 'Enterprise'],
    budget: 100000,
    timeline: 'Immediate',
    industry: 'Logistics',
    jobTitle: 'Operations VP',
  },
  {
    id: 'lead-4',
    firstName: 'Sarah',
    lastName: 'Davis',
    company: 'HealthPlus Medical',
    email: 'sarah.davis@healthplus.org',
    phone: '+1 (555) 456-7890',
    status: 'Proposal',
    source: 'Referral',
    score: 90,
    owner: 'Emily Rodriguez',
    createdAt: '2024-11-28T08:00:00Z',
    lastActive: '2024-12-18T09:00:00Z',
    avatar: '',
    notes: 'Referred by HealthFirst Medical',
    tags: ['Healthcare', 'Hot Lead'],
    budget: 75000,
    timeline: 'Q1 2025',
    industry: 'Healthcare',
    jobTitle: 'Procurement Director',
  },
  {
    id: 'lead-5',
    firstName: 'Michael',
    lastName: 'Brown',
    company: 'EduTech Academy',
    email: 'm.brown@edutech.edu',
    phone: '+1 (555) 567-8901',
    status: 'Negotiation',
    source: 'Email Campaign',
    score: 78,
    owner: 'Michael Chen',
    createdAt: '2024-12-01T11:00:00Z',
    lastActive: '2024-12-17T16:00:00Z',
    avatar: '',
    notes: 'Interested in educational printing materials',
    tags: ['Education', 'Bulk Orders'],
    budget: 35000,
    timeline: 'Q1 2025',
    industry: 'Education',
    jobTitle: 'Department Head',
  },
];

interface ActionMenuProps {
  lead: Lead;
  onEdit: () => void;
  onSendEmail: () => void;
  onCreateTask: () => void;
  onAddTags: () => void;
  onChangeOwner: () => void;
  onConvert: () => void;
  onDelete: () => void;
  onScheduleCall: () => void;
  onLogCall: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  lead, onEdit, onSendEmail, onCreateTask, onAddTags, onChangeOwner, onConvert, onDelete, onScheduleCall, onLogCall
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [callSubMenu, setCallSubMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setCallSubMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItemClass = `w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
    isDark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-slate-700 hover:bg-slate-50'
  }`;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={`p-1.5 rounded-md transition-colors ${
          isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
        }`}
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className={`absolute left-0 top-full mt-1 w-48 rounded-xl shadow-xl border z-50 py-1 ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          <button onClick={() => { onEdit(); setIsOpen(false); }} className={menuItemClass}>
            <Edit3 size={16} /> Edit Lead
          </button>
          <button onClick={() => { onSendEmail(); setIsOpen(false); }} className={menuItemClass}>
            <Mail size={16} /> Send Email
          </button>
          <button onClick={() => { onCreateTask(); setIsOpen(false); }} className={menuItemClass}>
            <CheckCircle2 size={16} /> Create Task
          </button>
          <button onClick={() => { onAddTags(); setIsOpen(false); }} className={menuItemClass}>
            <Tag size={16} /> Add Tags
          </button>
          <button onClick={() => { onChangeOwner(); setIsOpen(false); }} className={menuItemClass}>
            <UserPlus size={16} /> Change Owner
          </button>

          <div className="relative">
            <button
              onClick={() => setCallSubMenu(!callSubMenu)}
              className={`${menuItemClass} justify-between`}
            >
              <span className="flex items-center gap-3"><PhoneCall size={16} /> Create Call</span>
              <ChevronRight size={14} />
            </button>
            {callSubMenu && (
              <div className={`absolute left-full top-0 w-44 rounded-xl shadow-xl border py-1 ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <button onClick={() => { onScheduleCall(); setIsOpen(false); setCallSubMenu(false); }} className={menuItemClass}>
                  <Calendar size={16} /> Schedule Call
                </button>
                <button onClick={() => { onLogCall(); setIsOpen(false); setCallSubMenu(false); }} className={menuItemClass}>
                  <PhoneOutgoing size={16} /> Log Call
                </button>
              </div>
            )}
          </div>

          <div className={`my-1 border-t ${isDark ? 'border-zinc-800' : 'border-slate-100'}`} />

          <button onClick={() => { onConvert(); setIsOpen(false); }} className={`${menuItemClass} text-green-600`}>
            <ArrowRight size={16} /> Convert to Deal
          </button>
          <button onClick={() => { onDelete(); setIsOpen(false); }} className={`${menuItemClass} text-red-600`}>
            <Trash2 size={16} /> Delete Lead
          </button>
        </div>
      )}
    </div>
  );
};

interface LeadDetailCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const LeadDetailCard: React.FC<LeadDetailCardProps> = ({ title, icon, children }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`rounded-xl border p-4 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
      <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 flex items-center gap-2 ${
        isDark ? 'text-zinc-300' : 'text-slate-900'
      }`}>
        <span className="text-brand-600">{icon}</span>
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
};

interface FieldProps {
  label: string;
  value: string | number | undefined | null;
  icon?: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, value, icon }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div>
      <label className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{label}</label>
      <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
        {icon && <span className="text-slate-400">{icon}</span>}
        {value || <span className={isDark ? 'text-zinc-600' : 'text-slate-400'}>Not provided</span>}
      </p>
    </div>
  );
};

export const LeadsTable: React.FC = () => {
  const { canViewAllData, getUserFullName, user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline'>('overview');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [converting, setConverting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'schedule' | 'log'>('schedule');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [profiles, setProfiles] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [newNote, setNewNote] = useState('');

  const [emailForm, setEmailForm] = useState({ subject: '', body: '', template: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'Normal', dueDate: '', dueTime: '' });
  const [tagsInput, setTagsInput] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [callForm, setCallForm] = useState({ subject: '', callPurpose: '', scheduledAt: '', startTime: '', durationMinutes: 0, callResult: '', description: '' });
  const [convertForm, setConvertForm] = useState({ dealName: '', dealValue: '', stage: 'Qualification', createContact: true, createAccount: true, scheduleFollowUp: false });
  const [newLead, setNewLead] = useState({
    firstName: '', lastName: '', company: '', email: '', phone: '', mobile: '',
    source: 'Website', status: 'New' as const, leadCategory: 'Warm' as const,
    accountType: 'Prospect' as const, industry: '', jobTitle: '', budget: '', website: ''
  });

  const emailTemplates = [
    { id: '1', name: 'Welcome Email', subject: 'Welcome to Comprint CRM!', body: 'Dear {{firstName}},\n\nThank you for your interest in Comprint.\n\nBest regards,\n{{ownerName}}' },
    { id: '2', name: 'Follow-up', subject: 'Following up on our conversation', body: 'Hi {{firstName}},\n\nI wanted to follow up on our recent conversation.\n\nBest regards,\n{{ownerName}}' },
    { id: '3', name: 'Quote Request', subject: 'Your Quote Request', body: 'Dear {{firstName}},\n\nThank you for requesting a quote.\n\nBest regards,\n{{ownerName}}' },
    { id: '4', name: 'Meeting Invitation', subject: 'Meeting Invitation', body: 'Hi {{firstName}},\n\nI would like to schedule a meeting.\n\nBest regards,\n{{ownerName}}' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let leadsData: Lead[];
        let profilesData: Array<{ id: string; firstName: string; lastName: string }> = [];

        try {
          const [fetchedLeads, fetchedProfiles] = await Promise.all([
            leadsApi.getAll(),
            profilesApi.getAll().catch(() => [])
          ]);
          leadsData = fetchedLeads as Lead[];
          profilesData = fetchedProfiles as Array<{ id: string; firstName: string; lastName: string }>;
        } catch {
          // API unavailable, use mock data
          console.log('API unavailable, using mock lead data');
          leadsData = MOCK_LEADS;
        }

        let filteredData = leadsData;
        if (!canViewAllData()) {
          const currentUserName = getUserFullName();
          filteredData = filteredData.filter(lead => lead.owner === currentUserName);
        }
        setLeads(filteredData);
        setProfiles(profilesData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch leads');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [canViewAllData, getUserFullName]);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = `${lead.firstName} ${lead.lastName} ${lead.company}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'New').length,
    qualified: leads.filter(l => l.status === 'Qualified').length,
    avgScore: leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length) : 0,
  };

  const handleSendEmail = (lead: Lead) => { setSelectedLead(lead); setEmailForm({ subject: '', body: '', template: '' }); setShowEmailModal(true); };
  const handleCreateTask = (lead: Lead) => { setSelectedLead(lead); setTaskForm({ title: '', description: '', priority: 'Normal', dueDate: '', dueTime: '' }); setShowTaskModal(true); };
  const handleAddTags = (lead: Lead) => { setSelectedLead(lead); setTagsInput(lead.tags?.join(', ') || ''); setShowTagsModal(true); };
  const handleChangeOwner = (lead: Lead) => { setSelectedLead(lead); setNewOwner(lead.owner); setShowOwnerModal(true); };
  const handleConvert = (lead: Lead) => { setConvertingLead(lead); setConvertForm({ dealName: `${lead.company} - New Deal`, dealValue: lead.budget ? `$${lead.budget.toLocaleString()}` : '', stage: 'Qualification', createContact: true, createAccount: true, scheduleFollowUp: false }); setShowConvertModal(true); };
  const handleDelete = (lead: Lead) => { setLeadToDelete(lead); setShowDeleteConfirm(true); };
  const handleScheduleCall = (lead: Lead) => { setSelectedLead(lead); setCallType('schedule'); setCallForm({ subject: '', callPurpose: '', scheduledAt: '', startTime: '', durationMinutes: 0, callResult: '', description: '' }); setShowCallModal(true); };
  const handleLogCall = (lead: Lead) => { setSelectedLead(lead); setCallType('log'); setCallForm({ subject: '', callPurpose: '', scheduledAt: '', startTime: '', durationMinutes: 0, callResult: '', description: '' }); setShowCallModal(true); };

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    try {
      await leadsApi.delete(leadToDelete.id);
      setLeads(leads.filter(l => l.id !== leadToDelete.id));
      setShowDeleteConfirm(false);
      setLeadToDelete(null);
    } catch (err) { console.error('Failed to delete lead:', err); }
  };

  const saveTags = async () => {
    if (!selectedLead) return;
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    try {
      await leadsApi.update(selectedLead.id, { tags });
      setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, tags } : l));
      setShowTagsModal(false);
    } catch (err) { console.error('Failed to update tags:', err); }
  };

  const saveOwner = async () => {
    if (!selectedLead) return;
    try {
      await leadsApi.update(selectedLead.id, { owner: newOwner });
      setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, owner: newOwner } : l));
      setShowOwnerModal(false);
    } catch (err) { console.error('Failed to update owner:', err); }
  };

  const applyTemplate = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template && selectedLead) {
      const ownerName = user ? `${user.firstName} ${user.lastName}` : 'Sales Team';
      setEmailForm({
        ...emailForm, template: templateId,
        subject: template.subject.replace('{{firstName}}', selectedLead.firstName),
        body: template.body.replace(/\{\{firstName\}\}/g, selectedLead.firstName).replace(/\{\{ownerName\}\}/g, ownerName).replace(/\{\{company\}\}/g, selectedLead.company || '')
      });
    }
  };

  const sendEmail = async () => { if (!selectedLead) return; alert(`Email "${emailForm.subject}" sent to ${selectedLead.email}`); setShowEmailModal(false); };
  const createTask = async () => { if (!selectedLead) return; alert(`Task "${taskForm.title}" created for ${selectedLead.firstName} ${selectedLead.lastName}`); setShowTaskModal(false); };
  const saveCall = async () => { if (!selectedLead) return; alert(`Call ${callType === 'schedule' ? 'scheduled' : 'logged'} for ${selectedLead.firstName} ${selectedLead.lastName}`); setShowCallModal(false); };

  const addNote = async () => {
    if (!selectedLead || !newNote.trim()) return;
    const timestamp = new Date().toLocaleString();
    const noteEntry = `[${timestamp}] ${newNote}`;
    const updatedNotes = selectedLead.notes ? `${selectedLead.notes}\n\n${noteEntry}` : noteEntry;
    try {
      await leadsApi.update(selectedLead.id, { notes: updatedNotes });
      setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, notes: updatedNotes } : l));
      setSelectedLead({ ...selectedLead, notes: updatedNotes });
      setNewNote('');
    } catch (err) { console.error('Failed to add note:', err); }
  };

  const handleConvertLead = async () => {
    if (!convertingLead) return;
    setConverting(true);
    try {
      let accountId: string | undefined;
      if (convertForm.createAccount && convertingLead.company) {
        const newAccount = await accountsApi.create({ name: convertingLead.company, industry: convertingLead.industry || 'Other', website: convertingLead.website || '', type: 'Prospect', status: 'Active', owner: convertingLead.owner || 'Sarah Jenkins', phone: convertingLead.phone });
        accountId = (newAccount as { id: string }).id;
      }
      if (convertForm.createContact) {
        await contactsApi.create({ firstName: convertingLead.firstName, lastName: convertingLead.lastName, email: convertingLead.email, phone: convertingLead.phone, mobile: convertingLead.mobile, jobTitle: convertingLead.jobTitle || '', accountId, accountName: convertingLead.company, type: 'Customer', status: 'Active', owner: convertingLead.owner || 'Sarah Jenkins' });
      }
      const dealValue = convertForm.dealValue ? parseFloat(convertForm.dealValue.replace(/[$,]/g, '')) : (convertingLead.budget || 0);
      await dealsApi.create({ title: convertForm.dealName || `${convertingLead.company} - New Deal`, company: convertingLead.company, accountId, value: dealValue, stage: convertForm.stage, probability: convertForm.stage === 'Qualification' ? 20 : convertForm.stage === 'Proposal' ? 60 : 40, owner: convertingLead.owner || 'Sarah Jenkins', closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], contactName: `${convertingLead.firstName} ${convertingLead.lastName}`, forecast: 'Pipeline', type: 'New Business', leadSource: convertingLead.source });
      await leadsApi.delete(convertingLead.id);
      setLeads(leads.filter(l => l.id !== convertingLead.id));
      setShowConvertModal(false);
      setConvertingLead(null);
    } catch (err) { console.error('Failed to convert lead:', err); alert('Failed to convert lead. Please try again.'); } finally { setConverting(false); }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      await leadsApi.update(leadId, { status: newStatus });
      setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      if (selectedLead?.id === leadId) setSelectedLead({ ...selectedLead, status: newStatus });
    } catch (err) { console.error('Failed to update lead status:', err); }
  };

  const handleAddLead = async () => {
    try {
      const leadData = { ...newLead, budget: newLead.budget ? parseFloat(newLead.budget) : undefined };
      const created = await leadsApi.create(leadData);
      setLeads([created as Lead, ...leads]);
      setShowAddModal(false);
      setNewLead({ firstName: '', lastName: '', company: '', email: '', phone: '', mobile: '', source: 'Website', status: 'New', leadCategory: 'Warm', accountType: 'Prospect', industry: '', jobTitle: '', budget: '', website: '' });
    } catch (err) { console.error('Failed to add lead:', err); }
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <p className={isDark ? 'text-zinc-500' : 'text-slate-500'}>Loading leads...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8">
      <div className={`rounded-xl p-6 text-center ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-red-300' : 'text-red-800'}`}>Failed to load leads</h3>
        <p className={isDark ? 'text-red-400' : 'text-red-600'}>{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
        {[
          { label: 'Total Leads', value: stats.total, icon: <Users className="w-5 h-5 lg:w-6 lg:h-6" />, color: 'brand' },
          { label: 'New Leads', value: stats.new, icon: <Zap className="w-5 h-5 lg:w-6 lg:h-6" />, color: 'blue' },
          { label: 'Qualified', value: stats.qualified, icon: <Target className="w-5 h-5 lg:w-6 lg:h-6" />, color: 'green' },
          { label: 'Avg Score', value: stats.avgScore, icon: <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6" />, color: 'purple' },
        ].map((stat, idx) => (
          <div key={idx} className={`p-4 lg:p-6 rounded-xl border shadow-soft ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs lg:text-sm font-medium ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{stat.label}</p>
                <p className={`text-xl lg:text-2xl font-bold mt-1 ${stat.color === 'brand' ? 'text-brand-600' : stat.color === 'blue' ? 'text-blue-600' : stat.color === 'green' ? 'text-green-600' : 'text-purple-600'}`}>{stat.value}</p>
              </div>
              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center ${stat.color === 'brand' ? 'bg-brand-50 text-brand-600' : stat.color === 'blue' ? 'bg-blue-50 text-blue-600' : stat.color === 'green' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl shadow-soft border overflow-hidden ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
        {/* Table Header Controls */}
        <div className={`p-4 lg:p-6 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-4">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <h3 className={`text-lg lg:text-xl font-display font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>All Leads</h3>
                <ViewToggle view={viewMode} onViewChange={setViewMode} />
              </div>
              <div className={`flex rounded-lg p-1 overflow-x-auto ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                {['all', 'New', 'Contacted', 'Qualified', 'Proposal', 'Lost'].map((status) => (
                  <button key={status} onClick={() => setStatusFilter(status)} className={`px-2 lg:px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize whitespace-nowrap ${statusFilter === status ? (isDark ? 'bg-zinc-700 text-brand-400 shadow-sm' : 'bg-white text-brand-600 shadow-sm') : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-600 hover:text-slate-900')}`}>
                    {status === 'all' ? 'All' : status}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Search leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`pl-9 pr-4 py-2 w-full sm:w-48 lg:w-64 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div className="flex gap-2 lg:gap-3">
                <button className={`hidden sm:flex items-center gap-2 px-3 lg:px-4 py-2 border rounded-lg text-sm transition-colors ${isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <Download size={16} /> <span className="hidden lg:inline">Export</span>
                </button>
                <button onClick={() => setShowAddModal(true)} className="flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-glow flex-1 sm:flex-none">
                  <Plus size={16} /> Add Lead
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table View */}
        {viewMode === 'list' ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDark ? 'bg-zinc-800 border-b border-zinc-700' : 'bg-slate-50 border-b border-slate-100'}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Actions</th>
                    <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Lead</th>
                    <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Company</th>
                    <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Status</th>
                    <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Lead Score</th>
                    <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Source</th>
                    <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Owner</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-slate-100'}`}>
                  {filteredLeads.map((lead) => {
                    const scoreInfo = getScoreColor(lead.score);
                    return (
                      <tr key={lead.id} className={`transition-colors group cursor-pointer ${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-50/80'}`} onClick={() => { setSelectedLead(lead); setActiveTab('overview'); setShowModal(true); }}>
                        <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <ActionMenu lead={lead} onEdit={() => {}} onSendEmail={() => handleSendEmail(lead)} onCreateTask={() => handleCreateTask(lead)} onAddTags={() => handleAddTags(lead)} onChangeOwner={() => handleChangeOwner(lead)} onConvert={() => handleConvert(lead)} onDelete={() => handleDelete(lead)} onScheduleCall={() => handleScheduleCall(lead)} onLogCall={() => handleLogCall(lead)} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="relative">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isDark ? 'bg-brand-900 text-brand-300' : 'bg-brand-100 text-brand-600'}`}>{lead.firstName[0]}{lead.lastName[0]}</div>
                              {lead.score >= 80 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"><Star size={10} className="text-white fill-white" /></div>}
                            </div>
                            <div className="ml-4">
                              <div className={`text-sm font-bold font-display ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{lead.firstName} {lead.lastName}</div>
                              <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{lead.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className={isDark ? 'text-zinc-500' : 'text-slate-400'} />
                            <div>
                              <div className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{lead.company}</div>
                              {lead.jobTitle && <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{lead.jobTitle}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getStatusColor(lead.status, isDark)}`}>{lead.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-24 rounded-full h-2 ${isDark ? 'bg-zinc-700' : 'bg-slate-200'}`}>
                              <div className={`h-2 rounded-full ${scoreInfo.bg}`} style={{ width: `${lead.score}%` }}></div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${scoreInfo.text}`}>{lead.score}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${scoreInfo.bg} text-white`}>{scoreInfo.label}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{getSourceIcon(lead.source)}</span>
                            <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{lead.source}</span>
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{lead.owner}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className={`px-6 py-4 border-t flex items-center justify-between ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <span className={`text-sm ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Showing <span className={`font-bold ${isDark ? 'text-zinc-300' : 'text-slate-900'}`}>1-{filteredLeads.length}</span> of <span className={`font-bold ${isDark ? 'text-zinc-300' : 'text-slate-900'}`}>{leads.length}</span> leads</span>
              <div className="flex gap-2">
                <button className={`px-3 py-1.5 border rounded-lg text-sm transition-all shadow-sm ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-brand-500' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'}`}>Previous</button>
                <button className={`px-3 py-1.5 border rounded-lg text-sm transition-all shadow-sm ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-brand-500' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'}`}>Next</button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 md:p-6 overflow-x-auto">
            <div className="flex gap-3 md:gap-4 lg:gap-6 min-h-[500px] min-w-max">
              {['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Lost'].map((status) => {
                const statusLeads = filteredLeads.filter(l => l.status === status);
                const statusColors: Record<string, string> = { 'New': 'border-blue-500', 'Contacted': 'border-yellow-500', 'Qualified': 'border-green-500', 'Proposal': 'border-purple-500', 'Negotiation': 'border-orange-500', 'Lost': 'border-slate-400' };
                return (
                  <div key={status} className="w-[260px] md:w-[280px] lg:w-[300px] flex-shrink-0">
                    <div className={`p-4 rounded-t-xl border-t-4 ${statusColors[status]} border-x border-b shadow-sm mb-3 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
                      <div className="flex justify-between items-center">
                        <h4 className={`font-brand font-bold uppercase tracking-wide text-sm ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>{status}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-600'}`}>{statusLeads.length}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {statusLeads.map((lead) => {
                        const scoreInfo = getScoreColor(lead.score);
                        return (
                          <div key={lead.id} className={`p-4 rounded-xl border shadow-soft hover:shadow-md hover:border-brand-300 transition-all cursor-pointer ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`} onClick={() => { setSelectedLead(lead); setActiveTab('overview'); setShowModal(true); }}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="relative">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isDark ? 'bg-brand-900 text-brand-300' : 'bg-brand-100 text-brand-600'}`}>{lead.firstName[0]}{lead.lastName[0]}</div>
                                {lead.score >= 80 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"><Star size={10} className="text-white fill-white" /></div>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{lead.firstName} {lead.lastName}</p>
                                <p className={`text-xs truncate ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{lead.company}</p>
                              </div>
                            </div>
                            <div className={`flex items-center justify-between mt-3 pt-3 border-t ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${scoreInfo.bg}`}></div>
                                <span className={`text-xs font-medium ${scoreInfo.text}`}>{lead.score}</span>
                              </div>
                              <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{getSourceIcon(lead.source)} {lead.source}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lead Detail Modal */}
      {showModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-zinc-900' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b flex justify-between items-start sticky top-0 z-10 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl ${isDark ? 'bg-brand-900 text-brand-300' : 'bg-brand-100 text-brand-600'}`}>{selectedLead.firstName[0]}{selectedLead.lastName[0]}</div>
                  {selectedLead.score >= 80 && <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"><Star size={14} className="text-white fill-white" /></div>}
                </div>
                <div>
                  <h2 className={`text-xl font-bold font-display ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{selectedLead.firstName} {selectedLead.lastName}</h2>
                  <p className={isDark ? 'text-zinc-500' : 'text-slate-500'}>{selectedLead.jobTitle} at {selectedLead.company}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(selectedLead.status, isDark)}`}>{selectedLead.status}</span>
                    <span className={`text-sm font-bold ${getScoreColor(selectedLead.score).text}`}>Score: {selectedLead.score}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'}`}><X size={20} /></button>
            </div>

            <div className={`px-6 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <div className="flex gap-6">
                {[{ id: 'overview', label: 'Overview', icon: <FileText size={16} /> }, { id: 'timeline', label: 'Timeline', icon: <History size={16} /> }].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as 'overview' | 'timeline')} className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'border-brand-600 text-brand-600' : `border-transparent ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-500 hover:text-slate-900'}`}`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <LeadDetailCard title="Lead Information" icon={<Users size={16} />}>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Lead Owner" value={selectedLead.owner} />
                      <Field label="Email" value={selectedLead.email} icon={<Mail size={14} />} />
                      <Field label="Mobile" value={selectedLead.mobile || selectedLead.phone} icon={<Phone size={14} />} />
                      <Field label="Lead Status" value={selectedLead.status} />
                      <Field label="Company" value={selectedLead.company} icon={<Building2 size={14} />} />
                      <Field label="Website" value={selectedLead.website} icon={<Globe size={14} />} />
                      <Field label="Industry" value={selectedLead.industry} />
                      <Field label="Lead Source" value={selectedLead.source} />
                      <Field label="Job Title" value={selectedLead.jobTitle} />
                      <Field label="Lead Category" value={selectedLead.leadCategory} />
                    </div>
                    {selectedLead.tags && selectedLead.tags.length > 0 && (
                      <div className="mt-4">
                        <label className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Tags</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedLead.tags.map((tag, idx) => (<span key={idx} className={`px-2 py-0.5 text-xs rounded ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-600'}`}>{tag}</span>))}
                        </div>
                      </div>
                    )}
                  </LeadDetailCard>

                  <LeadDetailCard title="Order Info" icon={<Package size={16} />}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2"><input type="checkbox" checked={false} readOnly className="rounded" /><span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Sample Requested</span></div>
                      <div className="flex items-center gap-2"><input type="checkbox" checked={false} readOnly className="rounded" /><span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Sample Received</span></div>
                      <div className="flex items-center gap-2"><input type="checkbox" checked={false} readOnly className="rounded" /><span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Sample Sent</span></div>
                    </div>
                    <Field label="Sample Details" value={null} />
                  </LeadDetailCard>

                  <LeadDetailCard title="Forms Info" icon={<Clipboard size={16} />}>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="No. of Pieces" value={null} icon={<Hash size={14} />} />
                      <Field label="GSM" value={null} />
                      <Field label="Size" value={null} />
                      <Field label="Paper Type" value={null} />
                      <Field label="Finish" value={null} />
                    </div>
                  </LeadDetailCard>

                  <LeadDetailCard title="Billing Address" icon={<MapPin size={16} />}>
                    <Field label="Street" value={selectedLead.billingAddress?.street} />
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="City" value={selectedLead.billingAddress?.city} />
                      <Field label="State" value={selectedLead.billingAddress?.state} />
                      <Field label="ZIP Code" value={selectedLead.billingAddress?.zipCode} />
                      <Field label="Country" value={selectedLead.billingAddress?.country} />
                    </div>
                  </LeadDetailCard>

                  <div className={`lg:col-span-2 rounded-xl border p-4 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-slate-900'}`}><MessageSquare size={16} className="text-brand-600" /> Notes</h3>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note..." rows={3} className={`flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500' : 'bg-slate-50 border-slate-200'}`} />
                        <button onClick={addNote} disabled={!newNote.trim()} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 self-end">Add</button>
                      </div>
                      {selectedLead.notes && (<div className={`p-4 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-slate-50'}`}><pre className={`text-sm whitespace-pre-wrap font-sans ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{selectedLead.notes}</pre></div>)}
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <h3 className={`text-sm font-bold mb-3 ${isDark ? 'text-zinc-300' : 'text-slate-900'}`}>Update Status</h3>
                    <div className="flex flex-wrap gap-2">
                      {['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Lost'].map((status) => (
                        <button key={status} onClick={() => handleUpdateStatus(selectedLead.id, status as Lead['status'])} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${selectedLead.status === status ? 'bg-brand-600 text-white border-brand-600' : (isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-brand-500' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300')}`}>{status}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'timeline' && (<div className="space-y-4"><p className={`text-center py-8 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>No activities recorded yet.</p></div>)}
            </div>

            <div className={`p-6 border-t flex flex-wrap justify-between gap-3 sticky bottom-0 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100'}`}>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleSendEmail(selectedLead)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 text-sm"><Mail size={16} /> Send Email</button>
                <button onClick={() => handleLogCall(selectedLead)} className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-medium text-sm ${isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}><Phone size={16} /> Log Call</button>
                <button onClick={() => handleCreateTask(selectedLead)} className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-medium text-sm ${isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}><CheckCircle2 size={16} /> Create Task</button>
              </div>
              <button onClick={() => handleConvert(selectedLead)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 text-sm"><ArrowRight size={16} /> Convert to Deal</button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowEmailModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-zinc-900' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Send Email to {selectedLead.firstName}</h2>
              <button onClick={() => setShowEmailModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'}`}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Email Template</label>
                <select value={emailForm.template} onChange={(e) => applyTemplate(e.target.value)} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`}>
                  <option value="">Select a template...</option>
                  {emailTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>To</label>
                <input type="text" value={selectedLead.email} disabled className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Subject</label>
                <input type="text" value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Message</label>
                <textarea value={emailForm.body} onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })} rows={8} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`} />
              </div>
            </div>
            <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <button onClick={() => setShowEmailModal(false)} className={`px-4 py-2 border rounded-lg ${isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Cancel</button>
              <button onClick={sendEmail} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700"><Send size={16} /> Send Email</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowTaskModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-lg ${isDark ? 'bg-zinc-900' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Create Task</h2>
              <button onClick={() => setShowTaskModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'}`}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Task Title *</label>
                <input type="text" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Follow up with lead" className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Description</label>
                <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} rows={3} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Priority</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`}>
                    <option value="Low">Low</option><option value="Normal">Normal</option><option value="High">High</option><option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Due Date</label>
                  <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`} />
                </div>
              </div>
            </div>
            <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <button onClick={() => setShowTaskModal(false)} className={`px-4 py-2 border rounded-lg ${isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Cancel</button>
              <button onClick={createTask} disabled={!taskForm.title} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"><CheckCircle2 size={16} /> Create Task</button>
            </div>
          </div>
        </div>
      )}

      {/* Tags Modal */}
      {showTagsModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowTagsModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-md ${isDark ? 'bg-zinc-900' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Manage Tags</h2>
              <button onClick={() => setShowTagsModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'}`}><X size={20} /></button>
            </div>
            <div className="p-6">
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Tags (comma separated)</label>
              <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="VIP, High Priority, Enterprise" className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`} />
            </div>
            <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <button onClick={() => setShowTagsModal(false)} className={`px-4 py-2 border rounded-lg ${isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Cancel</button>
              <button onClick={saveTags} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">Save Tags</button>
            </div>
          </div>
        </div>
      )}

      {/* Owner Modal */}
      {showOwnerModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowOwnerModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-md ${isDark ? 'bg-zinc-900' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Change Owner</h2>
              <button onClick={() => setShowOwnerModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'}`}><X size={20} /></button>
            </div>
            <div className="p-6">
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>New Owner</label>
              <select value={newOwner} onChange={(e) => setNewOwner(e.target.value)} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`}>
                {profiles.map(p => (<option key={p.id} value={`${p.firstName} ${p.lastName}`}>{p.firstName} {p.lastName}</option>))}
              </select>
            </div>
            <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <button onClick={() => setShowOwnerModal(false)} className={`px-4 py-2 border rounded-lg ${isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Cancel</button>
              <button onClick={saveOwner} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">Change Owner</button>
            </div>
          </div>
        </div>
      )}

      {/* Call Modal */}
      {showCallModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowCallModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-lg ${isDark ? 'bg-zinc-900' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{callType === 'schedule' ? 'Schedule Call' : 'Log Call'}</h2>
              <button onClick={() => setShowCallModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'}`}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Subject *</label>
                <input type="text" value={callForm.subject} onChange={(e) => setCallForm({ ...callForm, subject: e.target.value })} placeholder="Call subject" className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Call Purpose</label>
                <select value={callForm.callPurpose} onChange={(e) => setCallForm({ ...callForm, callPurpose: e.target.value })} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`}>
                  <option value="">Select purpose...</option><option value="Prospecting">Prospecting</option><option value="Follow-up">Follow-up</option><option value="Demo">Demo</option><option value="Negotiation">Negotiation</option><option value="Support">Support</option>
                </select>
              </div>
              {callType === 'schedule' ? (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Schedule For</label>
                  <input type="datetime-local" value={callForm.scheduledAt} onChange={(e) => setCallForm({ ...callForm, scheduledAt: e.target.value })} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`} />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Call Time</label>
                      <input type="datetime-local" value={callForm.startTime} onChange={(e) => setCallForm({ ...callForm, startTime: e.target.value })} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`} />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Duration (min)</label>
                      <input type="number" value={callForm.durationMinutes || ''} onChange={(e) => setCallForm({ ...callForm, durationMinutes: parseInt(e.target.value) || 0 })} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`} />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Call Result</label>
                    <select value={callForm.callResult} onChange={(e) => setCallForm({ ...callForm, callResult: e.target.value })} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`}>
                      <option value="">Select result...</option><option value="Connected">Connected</option><option value="No Answer">No Answer</option><option value="Voicemail">Left Voicemail</option><option value="Busy">Busy</option><option value="Wrong Number">Wrong Number</option>
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Notes</label>
                <textarea value={callForm.description} onChange={(e) => setCallForm({ ...callForm, description: e.target.value })} rows={3} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`} />
              </div>
            </div>
            <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <button onClick={() => setShowCallModal(false)} className={`px-4 py-2 border rounded-lg ${isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Cancel</button>
              <button onClick={saveCall} disabled={!callForm.subject} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"><PhoneCall size={16} /> {callType === 'schedule' ? 'Schedule Call' : 'Log Call'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && leadToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-md ${isDark ? 'bg-zinc-900' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4"><Trash2 size={32} /></div>
              <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Delete Lead?</h2>
              <p className={isDark ? 'text-zinc-500' : 'text-slate-500'}>Are you sure you want to delete <strong>{leadToDelete.firstName} {leadToDelete.lastName}</strong>? This action cannot be undone.</p>
            </div>
            <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <button onClick={() => setShowDeleteConfirm(false)} className={`px-4 py-2 border rounded-lg ${isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Delete Lead</button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Modal */}
      {showConvertModal && convertingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowConvertModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto ${isDark ? 'bg-zinc-900' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Convert Lead to Deal</h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Create a new deal, contact, and account from this lead</p>
            </div>
            <div className="p-6 space-y-4">
              <div className={`rounded-xl p-4 flex items-center gap-4 ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-600'}`}><CheckCircle2 size={24} /></div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-green-300' : 'text-green-900'}`}>Ready to convert</p>
                  <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-700'}`}>{convertingLead.firstName} {convertingLead.lastName} from {convertingLead.company}</p>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Deal Name</label>
                <input type="text" value={convertForm.dealName} onChange={(e) => setConvertForm({ ...convertForm, dealName: e.target.value })} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Deal Value</label>
                  <input type="text" value={convertForm.dealValue} onChange={(e) => setConvertForm({ ...convertForm, dealValue: e.target.value })} placeholder="$0" className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Pipeline Stage</label>
                  <select value={convertForm.stage} onChange={(e) => setConvertForm({ ...convertForm, stage: e.target.value })} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`}>
                    <option value="Qualification">Qualification</option><option value="Discovery">Discovery</option><option value="Proposal">Proposal</option><option value="Negotiation">Negotiation</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={convertForm.createContact} onChange={(e) => setConvertForm({ ...convertForm, createContact: e.target.checked })} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" /><span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Create Contact</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={convertForm.createAccount} onChange={(e) => setConvertForm({ ...convertForm, createAccount: e.target.checked })} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" /><span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Create Account</span></label>
              </div>
            </div>
            <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <button onClick={() => setShowConvertModal(false)} disabled={converting} className={`px-4 py-2 border rounded-lg disabled:opacity-50 ${isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Cancel</button>
              <button onClick={handleConvertLead} disabled={converting} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">{converting ? (<><Loader2 size={16} className="animate-spin" /> Converting...</>) : (<><Briefcase size={16} /> Convert Lead</>)}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowAddModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-zinc-900' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b flex justify-between items-center sticky top-0 z-10 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100'}`}>
              <h2 className={`text-xl font-bold font-display ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Add New Lead</h2>
              <button onClick={() => setShowAddModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'}`}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-slate-900'}`}><Users size={16} className="text-brand-600" /> Lead Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[{ label: 'First Name *', key: 'firstName', placeholder: 'John' }, { label: 'Last Name *', key: 'lastName', placeholder: 'Doe' }, { label: 'Email *', key: 'email', placeholder: 'john@example.com', type: 'email' }, { label: 'Phone', key: 'phone', placeholder: '+1 555-0123' }, { label: 'Mobile', key: 'mobile', placeholder: '+1 555-0124' }, { label: 'Website', key: 'website', placeholder: 'https://example.com', type: 'url' }].map((field) => (
                    <div key={field.key}>
                      <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{field.label}</label>
                      <input type={field.type || 'text'} value={(newLead as Record<string, unknown>)[field.key] as string} onChange={(e) => setNewLead({ ...newLead, [field.key]: e.target.value })} placeholder={field.placeholder} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500' : 'bg-slate-50 border-slate-200'}`} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-slate-900'}`}><Building2 size={16} className="text-brand-600" /> Company Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Company</label>
                    <input type="text" value={newLead.company} onChange={(e) => setNewLead({ ...newLead, company: e.target.value })} placeholder="Acme Inc." className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500' : 'bg-slate-50 border-slate-200'}`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Industry</label>
                    <select value={newLead.industry} onChange={(e) => setNewLead({ ...newLead, industry: e.target.value })} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`}>
                      <option value="">Select Industry</option>{['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Printing', 'Education', 'Consulting', 'Other'].map(i => (<option key={i} value={i}>{i}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Job Title</label>
                    <input type="text" value={newLead.jobTitle} onChange={(e) => setNewLead({ ...newLead, jobTitle: e.target.value })} placeholder="VP of Sales" className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500' : 'bg-slate-50 border-slate-200'}`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Budget</label>
                    <input type="number" value={newLead.budget} onChange={(e) => setNewLead({ ...newLead, budget: e.target.value })} placeholder="50000" className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500' : 'bg-slate-50 border-slate-200'}`} />
                  </div>
                </div>
              </div>
              <div>
                <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-slate-900'}`}><Target size={16} className="text-brand-600" /> Lead Classification</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Lead Source</label>
                    <select value={newLead.source} onChange={(e) => setNewLead({ ...newLead, source: e.target.value })} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`}>
                      {['Website', 'Referral', 'LinkedIn', 'Trade Show', 'Cold Call', 'Email Campaign', 'Social Media', 'Partner', 'Other'].map(s => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Lead Category</label>
                    <select value={newLead.leadCategory} onChange={(e) => setNewLead({ ...newLead, leadCategory: e.target.value as 'Hot' | 'Warm' | 'Cold' })} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`}>
                      <option value="Hot">Hot</option><option value="Warm">Warm</option><option value="Cold">Cold</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Account Type</label>
                    <select value={newLead.accountType} onChange={(e) => setNewLead({ ...newLead, accountType: e.target.value as 'Customer' | 'Prospect' | 'Partner' | 'Vendor' | 'Other' })} className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-200'}`}>
                      {['Prospect', 'Customer', 'Partner', 'Vendor', 'Other'].map(t => (<option key={t} value={t}>{t}</option>))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className={`p-6 border-t flex justify-end gap-3 sticky bottom-0 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100'}`}>
              <button onClick={() => setShowAddModal(false)} className={`px-4 py-2 border rounded-lg ${isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Cancel</button>
              <button onClick={handleAddLead} disabled={!newLead.firstName || !newLead.lastName || !newLead.email} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"><Plus size={16} /> Add Lead</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
