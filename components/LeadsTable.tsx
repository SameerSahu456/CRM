import React, { useState, useEffect } from 'react';
import { Filter, Download, MoreVertical, Mail, Phone, Plus, Search, X, TrendingUp, Users, Target, Clock, ArrowRight, Star, Building2, Calendar, Briefcase, CheckCircle2, AlertCircle, Zap, Loader2 } from 'lucide-react';
import { Lead } from '../types';
import { leadsApi, accountsApi, contactsApi, dealsApi } from '../services/api';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'New': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Contacted': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'Qualified': return 'bg-green-50 text-green-700 border-green-200';
    case 'Proposal': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Negotiation': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Lost': return 'bg-slate-100 text-slate-500 border-slate-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return { text: 'text-green-600', bg: 'bg-green-500', label: 'Hot' };
  if (score >= 60) return { text: 'text-yellow-600', bg: 'bg-yellow-500', label: 'Warm' };
  if (score >= 40) return { text: 'text-orange-600', bg: 'bg-orange-500', label: 'Cool' };
  return { text: 'text-red-500', bg: 'bg-red-500', label: 'Cold' };
};

const getSourceIcon = (source: string) => {
  switch (source) {
    case 'Website': return '🌐';
    case 'Referral': return '👥';
    case 'LinkedIn': return '💼';
    case 'Trade Show': return '🎪';
    case 'Cold Call': return '📞';
    case 'Email Campaign': return '📧';
    default: return '📌';
  }
};

export const LeadsTable: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [convertForm, setConvertForm] = useState({
    dealName: '',
    dealValue: '',
    stage: 'Qualification',
    createContact: true,
    createAccount: true,
    scheduleFollowUp: false
  });
  const [converting, setConverting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    mobile: '',
    source: 'Website',
    status: 'New' as const,
    leadCategory: 'Warm' as const,
    accountType: 'Prospect' as const,
    industry: '',
    jobTitle: '',
    budget: '',
    website: ''
  });

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const data = await leadsApi.getAll();
        setLeads(data as Lead[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch leads');
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

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

  const handleConvertLead = async () => {
    if (!convertingLead) return;

    setConverting(true);
    try {
      let accountId: string | undefined;
      let accountName = convertingLead.company;

      // Step 1: Create Account if needed
      if (convertForm.createAccount && convertingLead.company) {
        const newAccount = await accountsApi.create({
          name: convertingLead.company,
          industry: convertingLead.industry || 'Other',
          website: convertingLead.website || '',
          type: 'Prospect',
          status: 'Active',
          owner: convertingLead.owner || 'Sarah Jenkins',
          phone: convertingLead.phone
        });
        accountId = (newAccount as { id: string }).id;
        accountName = convertingLead.company;
      }

      // Step 2: Create Contact if needed
      let contactId: string | undefined;
      let contactName = `${convertingLead.firstName} ${convertingLead.lastName}`;

      if (convertForm.createContact) {
        const newContact = await contactsApi.create({
          firstName: convertingLead.firstName,
          lastName: convertingLead.lastName,
          email: convertingLead.email,
          phone: convertingLead.phone,
          mobile: convertingLead.mobile,
          jobTitle: convertingLead.jobTitle || '',
          accountId: accountId,
          accountName: accountName,
          type: 'Customer',
          status: 'Active',
          owner: convertingLead.owner || 'Sarah Jenkins'
        });
        contactId = (newContact as { id: string }).id;
      }

      // Step 3: Create Deal
      const dealValue = convertForm.dealValue ? parseFloat(convertForm.dealValue.replace(/[$,]/g, '')) : (convertingLead.budget || 0);
      await dealsApi.create({
        title: convertForm.dealName || `${convertingLead.company} - New Deal`,
        company: convertingLead.company,
        accountId: accountId,
        value: dealValue,
        stage: convertForm.stage,
        probability: convertForm.stage === 'Qualification' ? 20 : convertForm.stage === 'Proposal' ? 60 : 40,
        owner: convertingLead.owner || 'Sarah Jenkins',
        closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        contactName: contactName,
        forecast: 'Pipeline',
        type: 'New Business',
        leadSource: convertingLead.source
      });

      // Step 4: Delete the lead (it's now converted)
      await leadsApi.delete(convertingLead.id);
      setLeads(leads.filter(l => l.id !== convertingLead.id));

      // Reset and close modal
      setShowConvertModal(false);
      setConvertingLead(null);
      setConvertForm({
        dealName: '',
        dealValue: '',
        stage: 'Qualification',
        createContact: true,
        createAccount: true,
        scheduleFollowUp: false
      });
    } catch (err) {
      console.error('Failed to convert lead:', err);
      alert('Failed to convert lead. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      await leadsApi.update(leadId, { status: newStatus });
      setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      setShowModal(false);
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  const handleAddLead = async () => {
    try {
      const leadData = {
        ...newLead,
        budget: newLead.budget ? parseFloat(newLead.budget) : undefined
      };
      const created = await leadsApi.create(leadData);
      setLeads([created as Lead, ...leads]);
      setShowAddModal(false);
      setNewLead({
        firstName: '',
        lastName: '',
        company: '',
        email: '',
        phone: '',
        mobile: '',
        source: 'Website',
        status: 'New',
        leadCategory: 'Warm',
        accountType: 'Prospect',
        industry: '',
        jobTitle: '',
        budget: '',
        website: ''
      });
    } catch (err) {
      console.error('Failed to add lead:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-slate-500">Loading leads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to load leads</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Leads</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <Users size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">New Leads</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.new}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Zap size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Qualified</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.qualified}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <Target size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Avg Score</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.avgScore}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-display font-bold text-slate-900">All Leads</h3>
            <div className="flex bg-slate-100 rounded-lg p-1">
              {['all', 'New', 'Contacted', 'Qualified', 'Proposal', 'Lost'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                    statusFilter === status
                      ? 'bg-white text-brand-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <Download size={16} /> Export
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-glow"
            >
              <Plus size={16} /> Add Lead
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Lead</th>
                <th className="px-6 py-4 text-left text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-left text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Lead Score</th>
                <th className="px-6 py-4 text-left text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 text-left text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-4 text-right text-xs font-brand font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => {
                const scoreInfo = getScoreColor(lead.score);
                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => { setSelectedLead(lead); setShowModal(true); }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                            {lead.firstName[0]}{lead.lastName[0]}
                          </div>
                          {lead.score >= 80 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <Star size={10} className="text-white fill-white" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-slate-900 font-display">{lead.firstName} {lead.lastName}</div>
                          <div className="text-xs text-slate-500">{lead.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-slate-400" />
                        <div>
                          <div className="text-sm text-slate-700 font-medium">{lead.company}</div>
                          {lead.jobTitle && <div className="text-xs text-slate-500">{lead.jobTitle}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
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
                        <span className="text-sm text-slate-600">{lead.source}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {lead.owner}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button className="p-1.5 text-slate-400 hover:text-brand-600 rounded-md hover:bg-brand-50">
                          <Mail size={16} />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-brand-600 rounded-md hover:bg-brand-50">
                          <Phone size={16} />
                        </button>
                        <button
                          onClick={() => { setConvertingLead(lead); setShowConvertModal(true); }}
                          className="px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded-md flex items-center gap-1"
                        >
                          <ArrowRight size={12} /> Convert
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-sm text-slate-500">
            Showing <span className="font-bold text-slate-900">1-{filteredLeads.length}</span> of <span className="font-bold text-slate-900">{leads.length}</span> leads
          </span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-brand-300 hover:text-brand-600 transition-all shadow-sm">Previous</button>
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-brand-300 hover:text-brand-600 transition-all shadow-sm">Next</button>
          </div>
        </div>
      </div>

      {/* Lead Detail Modal */}
      {showModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xl">
                    {selectedLead.firstName[0]}{selectedLead.lastName[0]}
                  </div>
                  {selectedLead.score >= 80 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Star size={14} className="text-white fill-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-display">{selectedLead.firstName} {selectedLead.lastName}</h2>
                  <p className="text-slate-500">{selectedLead.jobTitle} at {selectedLead.company}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(selectedLead.status)}`}>
                      {selectedLead.status}
                    </span>
                    <span className={`text-sm font-bold ${getScoreColor(selectedLead.score).text}`}>
                      Score: {selectedLead.score}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-6">
              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500">Email</label>
                    <p className="text-sm text-slate-900">{selectedLead.email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Phone</label>
                    <p className="text-sm text-slate-900">{selectedLead.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Lead Source</label>
                    <p className="text-sm text-slate-900">{getSourceIcon(selectedLead.source)} {selectedLead.source}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Owner</label>
                    <p className="text-sm text-slate-900">{selectedLead.owner}</p>
                  </div>
                </div>
              </div>

              {/* Lead Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Lead Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500">Industry</label>
                    <p className="text-sm text-slate-900">{selectedLead.industry || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Budget</label>
                    <p className="text-sm text-slate-900">{selectedLead.budget ? `$${selectedLead.budget.toLocaleString()}` : 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Created</label>
                    <p className="text-sm text-slate-900">{selectedLead.createdAt}</p>
                  </div>
                  {selectedLead.tags && selectedLead.tags.length > 0 && (
                    <div>
                      <label className="text-xs text-slate-500">Tags</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedLead.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lead Score Breakdown */}
              <div className="col-span-2 bg-slate-50 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Lead Score Breakdown</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                      <Users size={20} />
                    </div>
                    <p className="text-xs text-slate-500">Profile</p>
                    <p className="text-sm font-bold text-slate-900">25/30</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
                      <Mail size={20} />
                    </div>
                    <p className="text-xs text-slate-500">Engagement</p>
                    <p className="text-sm font-bold text-slate-900">20/25</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                      <Building2 size={20} />
                    </div>
                    <p className="text-xs text-slate-500">Company Fit</p>
                    <p className="text-sm font-bold text-slate-900">18/25</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
                      <TrendingUp size={20} />
                    </div>
                    <p className="text-xs text-slate-500">Behavior</p>
                    <p className="text-sm font-bold text-slate-900">{selectedLead.score - 63}/20</p>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div className="col-span-2">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Update Status</h3>
                <div className="flex gap-2">
                  {['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Lost'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedLead.id, status as Lead['status'])}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        selectedLead.status === status
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-slate-100 flex justify-between">
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">
                  <Mail size={16} /> Send Email
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50">
                  <Phone size={16} /> Log Call
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50">
                  <Calendar size={16} /> Schedule
                </button>
              </div>
              <button
                onClick={() => { setConvertingLead(selectedLead); setShowConvertModal(true); setShowModal(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                <ArrowRight size={16} /> Convert to Deal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Lead Modal */}
      {showConvertModal && convertingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowConvertModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Convert Lead to Deal</h2>
              <p className="text-sm text-slate-500 mt-1">Create a new deal, contact, and account from this lead</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="font-medium text-green-900">Ready to convert</p>
                  <p className="text-sm text-green-700">{convertingLead.firstName} {convertingLead.lastName} from {convertingLead.company}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deal Name</label>
                <input
                  type="text"
                  value={convertForm.dealName || `${convertingLead.company} - New Deal`}
                  onChange={(e) => setConvertForm({ ...convertForm, dealName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deal Value</label>
                  <input
                    type="text"
                    value={convertForm.dealValue || (convertingLead.budget ? `$${convertingLead.budget.toLocaleString()}` : '')}
                    onChange={(e) => setConvertForm({ ...convertForm, dealValue: e.target.value })}
                    placeholder="$0"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pipeline Stage</label>
                  <select
                    value={convertForm.stage}
                    onChange={(e) => setConvertForm({ ...convertForm, stage: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Qualification">Qualification</option>
                    <option value="Discovery">Discovery</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={convertForm.createContact}
                    onChange={(e) => setConvertForm({ ...convertForm, createContact: e.target.checked })}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-slate-700">Create Contact</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={convertForm.createAccount}
                    onChange={(e) => setConvertForm({ ...convertForm, createAccount: e.target.checked })}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-slate-700">Create Account (if not exists)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={convertForm.scheduleFollowUp}
                    onChange={(e) => setConvertForm({ ...convertForm, scheduleFollowUp: e.target.checked })}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-slate-700">Schedule follow-up task</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowConvertModal(false)}
                disabled={converting}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConvertLead}
                disabled={converting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {converting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Converting...
                  </>
                ) : (
                  <>
                    <Briefcase size={16} /> Convert Lead
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900 font-display">Add New Lead</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Lead Information Section */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Users size={16} className="text-brand-600" />
                  Lead Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={newLead.firstName}
                      onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={newLead.lastName}
                      onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={newLead.email}
                      onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newLead.phone}
                      onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="+1 555-0123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mobile</label>
                    <input
                      type="tel"
                      value={newLead.mobile}
                      onChange={(e) => setNewLead({ ...newLead, mobile: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="+1 555-0124"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={newLead.website}
                      onChange={(e) => setNewLead({ ...newLead, website: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Company Information Section */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Building2 size={16} className="text-brand-600" />
                  Company Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={newLead.company}
                      onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Acme Inc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                    <select
                      value={newLead.industry}
                      onChange={(e) => setNewLead({ ...newLead, industry: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Select Industry</option>
                      <option value="Technology">Technology</option>
                      <option value="Finance">Finance</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Retail">Retail</option>
                      <option value="Education">Education</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={newLead.jobTitle}
                      onChange={(e) => setNewLead({ ...newLead, jobTitle: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="e.g. VP of Sales"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
                    <select
                      value={newLead.accountType}
                      onChange={(e) => setNewLead({ ...newLead, accountType: e.target.value as 'Customer' | 'Prospect' | 'Partner' | 'Vendor' | 'Other' })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="Prospect">Prospect</option>
                      <option value="Customer">Customer</option>
                      <option value="Partner">Partner</option>
                      <option value="Vendor">Vendor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Lead Classification Section */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Target size={16} className="text-brand-600" />
                  Lead Classification
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lead Source</label>
                    <select
                      value={newLead.source}
                      onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="Website">Website</option>
                      <option value="Referral">Referral</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Trade Show">Trade Show</option>
                      <option value="Cold Call">Cold Call</option>
                      <option value="Email Campaign">Email Campaign</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Partner">Partner</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lead Category</label>
                    <select
                      value={newLead.leadCategory}
                      onChange={(e) => setNewLead({ ...newLead, leadCategory: e.target.value as 'Hot' | 'Warm' | 'Cold' })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="Hot">Hot</option>
                      <option value="Warm">Warm</option>
                      <option value="Cold">Cold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Budget</label>
                    <input
                      type="number"
                      value={newLead.budget}
                      onChange={(e) => setNewLead({ ...newLead, budget: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="50000"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLead}
                disabled={!newLead.firstName || !newLead.lastName || !newLead.email}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} /> Add Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
