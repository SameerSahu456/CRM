import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Plus, Calendar, DollarSign, Briefcase, Loader2, AlertCircle, X, User, TrendingUp, Clock, CheckCircle2, XCircle, Building2, ExternalLink, Contact, GripVertical } from 'lucide-react';
import { Deal } from '../types';
import { dealsApi } from '../services/api';
import { useNavigation } from '../contexts/NavigationContext';
import { ViewToggle, ViewMode } from './ViewToggle';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const columns = [
  { id: 'Qualification', title: 'Qualification', color: 'border-blue-500' },
  { id: 'Discovery', title: 'Discovery', color: 'border-cyan-500' },
  { id: 'Proposal', title: 'Proposal', color: 'border-yellow-500' },
  { id: 'Negotiation', title: 'Negotiation', color: 'border-purple-500' },
  { id: 'Closed Won', title: 'Closed Won', color: 'border-green-500' },
];

// Mock deals data for offline/development mode
const MOCK_DEALS: Deal[] = [
  {
    id: 'deal-1',
    title: 'Enterprise Software License',
    company: 'Acme Corporation',
    accountId: 'acc-1',
    value: 150000,
    stage: 'Negotiation',
    probability: 75,
    owner: 'Sarah Jenkins',
    closingDate: '2025-01-15',
    createdAt: '2024-10-15T10:00:00Z',
    description: 'Enterprise license for 250 users',
    contactId: 'contact-1',
    contactName: 'Jennifer Thompson',
    nextStep: 'Final contract review',
    forecast: 'Commit',
    type: 'New Business',
    leadSource: 'Website',
  },
  {
    id: 'deal-2',
    title: 'CRM Implementation',
    company: 'TechStart Innovation',
    accountId: 'acc-2',
    value: 45000,
    stage: 'Proposal',
    probability: 50,
    owner: 'Michael Chen',
    closingDate: '2025-02-01',
    createdAt: '2024-11-20T14:00:00Z',
    description: 'Full CRM implementation with training',
    contactId: 'contact-2',
    contactName: 'David Lee',
    nextStep: 'Present proposal',
    forecast: 'Pipeline',
    type: 'New Business',
    leadSource: 'LinkedIn',
  },
  {
    id: 'deal-3',
    title: 'Manufacturing Integration',
    company: 'Global Industries Ltd',
    accountId: 'acc-3',
    value: 280000,
    stage: 'Closed Won',
    probability: 100,
    owner: 'Sarah Jenkins',
    closingDate: '2024-12-10',
    createdAt: '2024-08-05T09:00:00Z',
    description: 'Full manufacturing suite integration',
    contactId: 'contact-3',
    contactName: 'Priya Sharma',
    nextStep: 'Implementation kickoff',
    forecast: 'Closed',
    type: 'Expansion',
    leadSource: 'Referral',
  },
  {
    id: 'deal-4',
    title: 'Print Management System',
    company: 'PrintMaster Solutions',
    accountId: 'acc-4',
    value: 75000,
    stage: 'Discovery',
    probability: 30,
    owner: 'Emily Rodriguez',
    closingDate: '2025-03-15',
    createdAt: '2024-12-01T11:00:00Z',
    description: 'Automated print management solution',
    contactId: 'contact-4',
    contactName: 'Mark Anderson',
    nextStep: 'Technical demo',
    forecast: 'Pipeline',
    type: 'New Business',
    leadSource: 'Trade Show',
  },
  {
    id: 'deal-5',
    title: 'Healthcare Partnership',
    company: 'HealthFirst Medical',
    accountId: 'acc-5',
    value: 200000,
    stage: 'Qualification',
    probability: 20,
    owner: 'Michael Chen',
    closingDate: '2025-04-01',
    createdAt: '2024-12-10T16:00:00Z',
    description: 'Strategic partnership for healthcare solutions',
    contactId: 'contact-5',
    contactName: 'Lisa Wang',
    nextStep: 'Discovery call',
    forecast: 'Upside',
    type: 'Partnership',
    leadSource: 'Partner',
  },
  {
    id: 'deal-6',
    title: 'Retail POS Upgrade',
    company: 'RetailMax Stores',
    accountId: 'acc-6',
    value: 120000,
    stage: 'Proposal',
    probability: 60,
    owner: 'Sarah Jenkins',
    closingDate: '2025-01-30',
    createdAt: '2024-11-01T10:00:00Z',
    description: 'POS system upgrade for 50 stores',
    contactId: 'contact-6',
    contactName: 'James Miller',
    nextStep: 'ROI presentation',
    forecast: 'Commit',
    type: 'Expansion',
    leadSource: 'Email Campaign',
  },
];

export const Pipeline: React.FC = () => {
  const { canViewAllData, getUserFullName } = useAuth();
  const { theme } = useTheme();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeal, setNewDeal] = useState({ title: '', company: '', value: '', stage: 'Qualification', closingDate: '' });
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const { navigateToEntity } = useNavigation();

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', deal.id);
  };

  const handleDragEnd = () => {
    setDraggedDeal(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedDeal || draggedDeal.stage === newStage) {
      setDraggedDeal(null);
      return;
    }

    // Optimistically update UI
    const updatedDeals = deals.map(d =>
      d.id === draggedDeal.id ? { ...d, stage: newStage } : d
    );
    setDeals(updatedDeals);

    try {
      await dealsApi.update(draggedDeal.id, { stage: newStage });
    } catch (err) {
      // Revert on error
      setDeals(deals);
      console.error('Failed to update deal stage:', err);
    }

    setDraggedDeal(null);
  };

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        let fetchedData: Deal[];

        try {
          const data = await dealsApi.getAll();
          fetchedData = data as Deal[];
        } catch {
          // API unavailable, use mock data
          console.log('API unavailable, using mock deal data');
          fetchedData = MOCK_DEALS;
        }

        let filteredData = fetchedData;

        // Filter by owner if user cannot view all data
        if (!canViewAllData()) {
          const currentUserName = getUserFullName();
          filteredData = filteredData.filter(deal => deal.owner === currentUserName);
        }

        setDeals(filteredData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch deals');
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, [canViewAllData, getUserFullName]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-slate-500">Loading deals pipeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to load deals</h3>
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

  // Calculate stats
  const stats = {
    totalDeals: deals.length,
    totalValue: deals.reduce((sum, d) => sum + d.value, 0),
    qualificationDeals: deals.filter(d => d.stage === 'Qualification').length,
    closedWonDeals: deals.filter(d => d.stage === 'Closed Won').length,
    avgDealValue: deals.length > 0 ? Math.round(deals.reduce((sum, d) => sum + d.value, 0) / deals.length) : 0,
  };

  return (
    <div className="p-4 lg:p-8 min-h-[calc(100vh-5rem)] overflow-x-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
        <div className={`p-4 lg:p-6 rounded-xl border shadow-soft cursor-pointer hover:shadow-lg transition-all ${
          theme === 'dark'
            ? 'bg-zinc-950 border-zinc-900 hover:border-brand-700'
            : 'bg-white border-slate-200 hover:border-brand-200'
        }`} onClick={() => navigateToEntity('deal', '', 'All Deals')}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs lg:text-sm font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>Total Deals</p>
              <p className={`text-xl lg:text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-zinc-100' : 'text-slate-900'}`}>{stats.totalDeals}</p>
            </div>
            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center ${
              theme === 'dark' ? 'bg-brand-950 text-brand-400' : 'bg-brand-50 text-brand-600'
            }`}>
              <Briefcase className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
          </div>
        </div>
        <div className={`p-4 lg:p-6 rounded-xl border shadow-soft cursor-pointer hover:shadow-lg transition-all ${
          theme === 'dark'
            ? 'bg-zinc-950 border-zinc-900 hover:border-green-700'
            : 'bg-white border-slate-200 hover:border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs lg:text-sm font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>Total Value</p>
              <p className="text-xl lg:text-2xl font-bold text-green-500 mt-1">${(stats.totalValue / 1000).toFixed(0)}k</p>
            </div>
            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center ${
              theme === 'dark' ? 'bg-green-950 text-green-400' : 'bg-green-50 text-green-600'
            }`}>
              <DollarSign className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
          </div>
        </div>
        <div className={`p-4 lg:p-6 rounded-xl border shadow-soft cursor-pointer hover:shadow-lg transition-all ${
          theme === 'dark'
            ? 'bg-zinc-950 border-zinc-900 hover:border-blue-700'
            : 'bg-white border-slate-200 hover:border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs lg:text-sm font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>In Qualification</p>
              <p className="text-xl lg:text-2xl font-bold text-blue-500 mt-1">{stats.qualificationDeals}</p>
            </div>
            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center ${
              theme === 'dark' ? 'bg-blue-950 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}>
              <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
          </div>
        </div>
        <div className={`p-4 lg:p-6 rounded-xl border shadow-soft cursor-pointer hover:shadow-lg transition-all ${
          theme === 'dark'
            ? 'bg-zinc-950 border-zinc-900 hover:border-purple-700'
            : 'bg-white border-slate-200 hover:border-purple-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs lg:text-sm font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>Closed Won</p>
              <p className="text-xl lg:text-2xl font-bold text-purple-500 mt-1">{stats.closedWonDeals}</p>
            </div>
            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center ${
              theme === 'dark' ? 'bg-purple-950 text-purple-400' : 'bg-purple-50 text-purple-600'
            }`}>
              <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
           <h3 className={`text-lg lg:text-xl font-display font-bold ${theme === 'dark' ? 'text-zinc-100' : 'text-slate-900'}`}>Deals Pipeline</h3>
           <ViewToggle view={viewMode} onViewChange={setViewMode} />
           <div className={`hidden lg:block h-6 w-px mx-2 ${theme === 'dark' ? 'bg-zinc-700' : 'bg-slate-300'}`}></div>
           <button className={`hidden sm:block px-3 lg:px-4 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm ${
             theme === 'dark'
               ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-brand-400 hover:border-brand-700'
               : 'bg-white border-slate-200 text-slate-600 hover:text-brand-600 hover:border-brand-200'
           }`}>
             All Deals
           </button>
           <button className={`hidden sm:block px-3 lg:px-4 py-2 border rounded-lg text-sm font-medium transition-colors shadow-sm ${
             theme === 'dark'
               ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-brand-400 hover:border-brand-700'
               : 'bg-white border-slate-200 text-slate-600 hover:text-brand-600 hover:border-brand-200'
           }`}>
             My Deals
           </button>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 lg:px-5 py-2 lg:py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-all shadow-glow hover:shadow-lg text-sm lg:text-base"
        >
          <Plus size={18} />
          <span>New Deal</span>
        </button>
      </div>

      {viewMode === 'kanban' ? (
      <div className="flex gap-3 md:gap-4 lg:gap-6 h-full overflow-x-auto pb-4">
        <div className="flex gap-3 md:gap-4 lg:gap-6 min-w-max">
        {columns.map((col) => {
          const columnDeals = deals.filter(d => d.stage === col.id);
          const totalValue = columnDeals.reduce((acc, curr) => acc + curr.value, 0);
          const percentage = deals.length > 0 ? Math.round((columnDeals.length / deals.length) * 100) : 0;
          const isDropTarget = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              className="flex-1 flex flex-col w-[260px] md:w-[280px] lg:w-[300px] flex-shrink-0"
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className={`p-4 rounded-t-xl border-t-4 ${col.color} border-x border-b shadow-sm mb-3 transition-all ${
                theme === 'dark'
                  ? `bg-zinc-950 border-zinc-900 ${isDropTarget ? 'ring-2 ring-brand-500 bg-zinc-900' : ''}`
                  : `bg-white border-slate-200 ${isDropTarget ? 'ring-2 ring-brand-500 bg-brand-50' : ''}`
              }`}>
                <div className="flex justify-between items-center mb-1">
                  <h4 className={`font-brand font-bold uppercase tracking-wide text-sm ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-800'}`}>{col.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      theme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-600'
                    }`}>{columnDeals.length}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      theme === 'dark' ? 'bg-brand-950 text-brand-400' : 'bg-brand-100 text-brand-700'
                    }`}>{percentage}%</span>
                  </div>
                </div>
                <div className={`text-xs font-medium ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>
                  ${totalValue.toLocaleString()} potential value
                </div>
                {/* Progress bar for percentage */}
                <div className={`mt-2 h-1 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'}`}>
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {/* Cards Container */}
              <div className={`flex-1 space-y-3 pb-8 min-h-[200px] rounded-b-xl p-2 transition-colors ${
                isDropTarget
                  ? theme === 'dark' ? 'bg-zinc-900/50' : 'bg-brand-50/50'
                  : ''
              }`}>
                {columnDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal)}
                    onDragEnd={handleDragEnd}
                    className={`p-4 rounded-xl border shadow-soft hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative ${
                      draggedDeal?.id === deal.id
                        ? 'opacity-50 scale-95'
                        : ''
                    } ${
                      theme === 'dark'
                        ? 'bg-zinc-950 border-zinc-800 hover:border-brand-700'
                        : 'bg-white border-slate-200 hover:border-brand-300'
                    }`}
                    onClick={() => { setSelectedDeal(deal); setShowModal(true); }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide flex items-center gap-1 ${
                        theme === 'dark'
                          ? 'text-brand-400 bg-brand-950 border-brand-800'
                          : 'text-brand-600 bg-brand-50 border-brand-100'
                      }`}>
                        <Briefcase size={10} />
                        {deal.company}
                      </span>
                      <div className="flex items-center gap-1">
                        <GripVertical size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                          theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'
                        }`} />
                        <button className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                          theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400 hover:text-slate-600'
                        }`}>
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>
                    <h5 className={`font-bold mb-3 font-display text-lg leading-tight ${
                      theme === 'dark' ? 'text-zinc-100' : 'text-slate-900'
                    }`}>{deal.title}</h5>

                    <div className={`flex items-center justify-between mt-4 pt-3 border-t ${
                      theme === 'dark' ? 'border-zinc-800' : 'border-slate-50'
                    }`}>
                      <div className={`flex items-center text-sm font-medium ${
                        theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'
                      }`}>
                        <DollarSign size={14} className={`mr-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`} />
                        {deal.value.toLocaleString()}
                      </div>
                      <div className={`flex items-center text-xs font-medium ${
                        theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'
                      }`}>
                        <Calendar size={12} className="mr-1" />
                        {deal.closingDate}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Button in Column */}
                <button className={`w-full py-2 border-2 border-dashed rounded-xl font-medium text-sm transition-all ${
                  theme === 'dark'
                    ? 'border-zinc-800 text-zinc-500 hover:border-brand-700 hover:text-brand-400 hover:bg-zinc-900/50'
                    : 'border-slate-200 text-slate-400 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/50'
                }`}>
                  + Add Deal
                </button>
              </div>
            </div>
          );
        })}
        </div>
      </div>
      ) : (
        /* List View */
        <div className={`rounded-2xl shadow-soft border overflow-hidden ${
          theme === 'dark' ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-slate-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>Deal</th>
                  <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>Company</th>
                  <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>Value</th>
                  <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>Stage</th>
                  <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>Probability</th>
                  <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>Close Date</th>
                  <th className={`px-6 py-4 text-left text-xs font-brand font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>Owner</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800' : 'divide-slate-100'}`}>
                {deals.map((deal) => (
                  <tr
                    key={deal.id}
                    className={`transition-colors cursor-pointer ${
                      theme === 'dark' ? 'hover:bg-zinc-900' : 'hover:bg-brand-50/30'
                    }`}
                    onClick={() => { setSelectedDeal(deal); setShowModal(true); }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-bold font-display ${theme === 'dark' ? 'text-zinc-100' : 'text-slate-900'}`}>{deal.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border flex items-center gap-1 w-fit ${
                        theme === 'dark'
                          ? 'text-brand-400 bg-brand-950 border-brand-800'
                          : 'text-brand-600 bg-brand-50 border-brand-100'
                      }`}>
                        <Building2 size={10} />
                        {deal.company}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-green-500">${deal.value.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        deal.stage === 'Closed Won' ? 'bg-green-100 text-green-700' :
                        deal.stage === 'Closed Lost' ? 'bg-red-100 text-red-700' :
                        deal.stage === 'Negotiation' ? 'bg-purple-100 text-purple-700' :
                        deal.stage === 'Proposal' ? 'bg-yellow-100 text-yellow-700' :
                        deal.stage === 'Discovery' ? 'bg-cyan-100 text-cyan-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {deal.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-16 h-1.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${deal.probability}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>{deal.probability}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm flex items-center gap-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
                        <Calendar size={12} className={theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'} />
                        {deal.closingDate}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>{deal.owner}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={`px-6 py-4 border-t flex items-center justify-between ${
            theme === 'dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50/50'
          }`}>
            <span className={`text-sm ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>Showing <span className={`font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-900'}`}>1-{deals.length}</span> of <span className={`font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-900'}`}>{deals.length}</span> deals</span>
            <div className="flex gap-2">
              <button className={`px-3 py-1.5 border rounded-lg text-sm transition-all shadow-sm ${
                theme === 'dark'
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-brand-700 hover:text-brand-400'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
              }`}>Previous</button>
              <button className={`px-3 py-1.5 border rounded-lg text-sm transition-all shadow-sm ${
                theme === 'dark'
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-brand-700 hover:text-brand-400'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
              }`}>Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Deal Detail Modal */}
      {showModal && selectedDeal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${
            theme === 'dark' ? 'bg-zinc-950' : 'bg-white'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b flex justify-between items-start ${theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'}`}>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => {
                      if (selectedDeal.accountId) {
                        setShowModal(false);
                        navigateToEntity('account', selectedDeal.accountId, selectedDeal.company);
                      }
                    }}
                    className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100 uppercase tracking-wide flex items-center gap-1 hover:bg-brand-100 transition-colors group"
                  >
                    <Building2 size={10} />
                    {selectedDeal.company}
                    <ExternalLink size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    selectedDeal.stage === 'Closed Won' ? 'bg-green-100 text-green-700' :
                    selectedDeal.stage === 'Closed Lost' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedDeal.stage}
                  </span>
                </div>
                <h2 className={`text-xl font-bold font-display ${theme === 'dark' ? 'text-zinc-100' : 'text-slate-900'}`}>{selectedDeal.title}</h2>
                {selectedDeal.contactName ? (
                  <button
                    onClick={() => {
                      if (selectedDeal.contactId) {
                        setShowModal(false);
                        navigateToEntity('contact', selectedDeal.contactId, selectedDeal.contactName);
                      }
                    }}
                    className={`mt-1 flex items-center gap-1 hover:underline group ${
                      theme === 'dark' ? 'text-zinc-400 hover:text-brand-400' : 'text-slate-500 hover:text-brand-600'
                    }`}
                  >
                    <User size={12} /> Contact: {selectedDeal.contactName}
                    <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ) : (
                  <p className={`mt-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>Contact: Not assigned</p>
                )}
              </div>
              <button onClick={() => setShowModal(false)} className={`p-2 rounded-lg ${
                theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
              }`}>
                <X size={20} />
              </button>
            </div>

            <div className="p-4 lg:p-6">
              {/* Value & Probability */}
              <div className="grid grid-cols-3 gap-2 lg:gap-4 mb-6">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <DollarSign className="w-6 h-6 mx-auto text-green-600 mb-2" />
                  <p className="text-xl font-bold text-green-700">${selectedDeal.value.toLocaleString()}</p>
                  <p className="text-xs text-green-600">Deal Value</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                  <p className="text-xl font-bold text-purple-700">{selectedDeal.probability}%</p>
                  <p className="text-xs text-purple-600">Probability</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <Calendar className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                  <p className="text-lg font-bold text-blue-700">{selectedDeal.closingDate}</p>
                  <p className="text-xs text-blue-600">Close Date</p>
                </div>
              </div>

              {/* Deal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-6">
                <div className="space-y-3">
                  <div>
                    <label className={`text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>Owner</label>
                    <p className={`text-sm flex items-center gap-1 ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-900'}`}>
                      <User size={14} className={theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'} />
                      {selectedDeal.owner}
                    </p>
                  </div>
                  <div>
                    <label className={`text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>Deal Type</label>
                    <p className={`text-sm ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-900'}`}>{selectedDeal.type || 'New Business'}</p>
                  </div>
                  <div>
                    <label className={`text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>Forecast</label>
                    <p className={`text-sm ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-900'}`}>{selectedDeal.forecast || 'Pipeline'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className={`text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>Created</label>
                    <p className={`text-sm ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-900'}`}>{selectedDeal.createdAt}</p>
                  </div>
                  <div>
                    <label className={`text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>Expected Revenue</label>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-900'}`}>
                      ${Math.round(selectedDeal.value * (selectedDeal.probability / 100)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stage Progress */}
              <div className="mb-6">
                <label className={`text-xs mb-2 block ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>Stage Progress</label>
                <div className="flex gap-1">
                  {columns.map((col) => (
                    <div
                      key={col.id}
                      className={`flex-1 h-2 rounded-full ${
                        columns.findIndex(c => c.id === selectedDeal.stage) >= columns.findIndex(c => c.id === col.id)
                          ? 'bg-brand-500'
                          : theme === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className={`flex flex-col sm:flex-row gap-2 lg:gap-3 pt-6 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'}`}>
                <button className="flex-1 flex items-center justify-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm">
                  <CheckCircle2 size={16} /> Mark Won
                </button>
                <button className={`flex-1 flex items-center justify-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 border rounded-lg font-medium transition-colors text-sm ${
                  theme === 'dark'
                    ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}>
                  <Clock size={16} /> Update Stage
                </button>
                <button className={`flex items-center justify-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 border rounded-lg font-medium transition-colors text-sm ${
                  theme === 'dark'
                    ? 'border-red-900 text-red-400 hover:bg-red-950'
                    : 'border-red-200 text-red-600 hover:bg-red-50'
                }`}>
                  <XCircle size={16} /> Lost
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Deal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className={`rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto ${
            theme === 'dark' ? 'bg-zinc-950' : 'bg-white'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b flex justify-between items-center ${theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'}`}>
              <h2 className={`text-xl font-bold font-display ${theme === 'dark' ? 'text-zinc-100' : 'text-slate-900'}`}>Create New Deal</h2>
              <button onClick={() => setShowAddModal(false)} className={`p-2 rounded-lg ${
                theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'
              }`}>
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>Deal Title *</label>
                <input
                  type="text"
                  value={newDeal.title}
                  onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    theme === 'dark'
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500'
                      : 'border-slate-200 text-slate-900'
                  }`}
                  placeholder="Enterprise License Deal"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>Company *</label>
                <input
                  type="text"
                  value={newDeal.company}
                  onChange={(e) => setNewDeal({ ...newDeal, company: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    theme === 'dark'
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500'
                      : 'border-slate-200 text-slate-900'
                  }`}
                  placeholder="Acme Inc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>Value *</label>
                  <input
                    type="number"
                    value={newDeal.value}
                    onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      theme === 'dark'
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500'
                        : 'border-slate-200 text-slate-900'
                    }`}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>Stage</label>
                  <select
                    value={newDeal.stage}
                    onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      theme === 'dark'
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                        : 'border-slate-200 text-slate-900'
                    }`}
                  >
                    {columns.map((col) => (
                      <option key={col.id} value={col.id}>{col.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>Expected Close Date</label>
                <input
                  type="date"
                  value={newDeal.closingDate}
                  onChange={(e) => setNewDeal({ ...newDeal, closingDate: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    theme === 'dark'
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                      : 'border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className={`p-6 border-t flex justify-end gap-3 ${theme === 'dark' ? 'border-zinc-800' : 'border-slate-100'}`}>
              <button
                onClick={() => setShowAddModal(false)}
                className={`px-4 py-2 border rounded-lg ${
                  theme === 'dark'
                    ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const created = await dealsApi.create({
                      title: newDeal.title,
                      company: newDeal.company,
                      value: parseFloat(newDeal.value) || 0,
                      stage: newDeal.stage,
                      closingDate: newDeal.closingDate,
                      probability: 20,
                      owner: getUserFullName() || 'Unassigned'
                    });
                    setDeals([created as Deal, ...deals]);
                    setShowAddModal(false);
                    setNewDeal({ title: '', company: '', value: '', stage: 'Qualification', closingDate: '' });
                  } catch (err) {
                    console.error('Failed to create deal:', err);
                  }
                }}
                disabled={!newDeal.title || !newDeal.company || !newDeal.value}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} /> Create Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
