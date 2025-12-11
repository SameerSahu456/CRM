import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Plus, Calendar, DollarSign, Briefcase, Loader2, AlertCircle, X, User, TrendingUp, Clock, CheckCircle2, XCircle, Building2, ExternalLink, Contact } from 'lucide-react';
import { Deal } from '../types';
import { dealsApi } from '../services/api';
import { useNavigation } from '../contexts/NavigationContext';

const columns = [
  { id: 'Qualification', title: 'Qualification', color: 'border-blue-500' },
  { id: 'Discovery', title: 'Discovery', color: 'border-cyan-500' },
  { id: 'Proposal', title: 'Proposal', color: 'border-yellow-500' },
  { id: 'Negotiation', title: 'Negotiation', color: 'border-purple-500' },
  { id: 'Closed Won', title: 'Closed Won', color: 'border-green-500' },
];

export const Pipeline: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeal, setNewDeal] = useState({ title: '', company: '', value: '', stage: 'Qualification', closingDate: '' });
  const { navigateToEntity } = useNavigation();

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        const data = await dealsApi.getAll();
        setDeals(data as Deal[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch deals');
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

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

  return (
    <div className="p-8 h-[calc(100vh-5rem)] overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
           <h3 className="text-xl font-display font-bold text-slate-900">Deals Pipeline</h3>
           <div className="h-6 w-px bg-slate-300 mx-2"></div>
           <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:border-brand-200 transition-colors shadow-sm">
             All Deals
           </button>
           <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:border-brand-200 transition-colors shadow-sm">
             My Deals
           </button>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-all shadow-glow hover:shadow-lg"
        >
          <Plus size={18} />
          <span>New Deal</span>
        </button>
      </div>

      <div className="flex gap-6 h-full min-w-[1200px]">
        {columns.map((col) => {
          const columnDeals = deals.filter(d => d.stage === col.id);
          const totalValue = columnDeals.reduce((acc, curr) => acc + curr.value, 0);

          return (
            <div key={col.id} className="flex-1 flex flex-col min-w-[240px]">
              {/* Column Header */}
              <div className={`bg-white p-4 rounded-t-xl border-t-4 ${col.color} border-x border-b border-slate-200 shadow-sm mb-3`}>
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-brand font-bold text-slate-800 uppercase tracking-wide text-sm">{col.title}</h4>
                  <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">{columnDeals.length}</span>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  ${totalValue.toLocaleString()} potential value
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-3 pb-8">
                {columnDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-soft hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group relative"
                    onClick={() => { setSelectedDeal(deal); setShowModal(true); }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100 uppercase tracking-wide flex items-center gap-1">
                        <Briefcase size={10} />
                        {deal.company}
                      </span>
                      <button className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                    <h5 className="font-bold text-slate-900 mb-3 font-display text-lg leading-tight">{deal.title}</h5>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                      <div className="flex items-center text-slate-500 text-sm font-medium">
                        <DollarSign size={14} className="mr-0.5 text-slate-400" />
                        {deal.value.toLocaleString()}
                      </div>
                      <div className="flex items-center text-slate-400 text-xs font-medium">
                        <Calendar size={12} className="mr-1" />
                        {deal.closingDate}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Button in Column */}
                <button className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-medium text-sm hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/50 transition-all">
                  + Add Deal
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deal Detail Modal */}
      {showModal && selectedDeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
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
                <h2 className="text-xl font-bold text-slate-900 font-display">{selectedDeal.title}</h2>
                {selectedDeal.contactName ? (
                  <button
                    onClick={() => {
                      if (selectedDeal.contactId) {
                        setShowModal(false);
                        navigateToEntity('contact', selectedDeal.contactId, selectedDeal.contactName);
                      }
                    }}
                    className="text-slate-500 mt-1 flex items-center gap-1 hover:text-brand-600 hover:underline group"
                  >
                    <User size={12} /> Contact: {selectedDeal.contactName}
                    <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ) : (
                  <p className="text-slate-500 mt-1">Contact: Not assigned</p>
                )}
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Value & Probability */}
              <div className="grid grid-cols-3 gap-4 mb-6">
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
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500">Owner</label>
                    <p className="text-sm text-slate-900 flex items-center gap-1">
                      <User size={14} className="text-slate-400" />
                      {selectedDeal.owner}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Deal Type</label>
                    <p className="text-sm text-slate-900">{selectedDeal.type || 'New Business'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Forecast</label>
                    <p className="text-sm text-slate-900">{selectedDeal.forecast || 'Pipeline'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500">Created</label>
                    <p className="text-sm text-slate-900">{selectedDeal.createdAt}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Expected Revenue</label>
                    <p className="text-sm text-slate-900 font-medium">
                      ${Math.round(selectedDeal.value * (selectedDeal.probability / 100)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stage Progress */}
              <div className="mb-6">
                <label className="text-xs text-slate-500 mb-2 block">Stage Progress</label>
                <div className="flex gap-1">
                  {columns.map((col) => (
                    <div
                      key={col.id}
                      className={`flex-1 h-2 rounded-full ${
                        columns.findIndex(c => c.id === selectedDeal.stage) >= columns.findIndex(c => c.id === col.id)
                          ? 'bg-brand-500'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                  <CheckCircle2 size={16} /> Mark Won
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                  <Clock size={16} /> Update Stage
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors">
                  <XCircle size={16} /> Lost
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Deal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 font-display">Create New Deal</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deal Title *</label>
                <input
                  type="text"
                  value={newDeal.title}
                  onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Enterprise License Deal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
                <input
                  type="text"
                  value={newDeal.company}
                  onChange={(e) => setNewDeal({ ...newDeal, company: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Acme Inc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Value *</label>
                  <input
                    type="number"
                    value={newDeal.value}
                    onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
                  <select
                    value={newDeal.stage}
                    onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {columns.map((col) => (
                      <option key={col.id} value={col.id}>{col.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expected Close Date</label>
                <input
                  type="date"
                  value={newDeal.closingDate}
                  onChange={(e) => setNewDeal({ ...newDeal, closingDate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
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
                      owner: 'Sarah Jenkins'
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
