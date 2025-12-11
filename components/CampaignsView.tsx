import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, Calendar, DollarSign, Users, TrendingUp, Mail, Share2, Target, MoreVertical, Eye, BarChart3, X, ArrowUpRight, Loader2, AlertCircle } from 'lucide-react';
import { Campaign } from '../types';
import { campaignsApi } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-700 border-green-200';
    case 'Planning': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Paused': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'Completed': return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'Email': return <Mail size={16} />;
    case 'Social Media': return <Share2 size={16} />;
    case 'Webinar': return <Users size={16} />;
    default: return <Target size={16} />;
  }
};

const performanceData = [
  { name: 'Week 1', sent: 1200, opened: 480, clicked: 192 },
  { name: 'Week 2', sent: 1500, opened: 675, clicked: 270 },
  { name: 'Week 3', sent: 1800, opened: 810, clicked: 324 },
  { name: 'Week 4', sent: 2000, opened: 980, clicked: 392 },
];

export const CampaignsView: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'members'>('overview');

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const data = await campaignsApi.getAll();
        setCampaigns(data as Campaign[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCampaigns = campaigns.filter(c => c.status === 'Active').length;
  const totalBudget = campaigns.reduce((acc, c) => acc + c.budget, 0);
  const totalLeads = campaigns.reduce((acc, c) => acc + (c.metrics?.leads || 0), 0);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-slate-500">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to load campaigns</h3>
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
              <p className="text-sm text-slate-500 font-medium">Total Campaigns</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{campaigns.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <Target size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Active Campaigns</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{activeCampaigns}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Budget</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">${(totalBudget / 1000).toFixed(0)}K</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Leads Generated</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{totalLeads.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-display font-bold text-slate-900">Marketing Campaigns</h3>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              <Filter size={16} /> Filter
            </button>
            <button className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 shadow-glow">
              <Plus size={16} /> New Campaign
            </button>
          </div>
        </div>

        {/* Campaign List */}
        <div className="divide-y divide-slate-100">
          {filteredCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => setSelectedCampaign(campaign)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    campaign.type === 'Email' ? 'bg-blue-100 text-blue-600' :
                    campaign.type === 'Social Media' ? 'bg-purple-100 text-purple-600' :
                    campaign.type === 'Webinar' ? 'bg-green-100 text-green-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {getTypeIcon(campaign.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-sm font-bold text-slate-900">{campaign.name}</h4>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{campaign.type} Campaign</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {campaign.startDate} - {campaign.endDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} />
                        Budget: ${campaign.budget.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {campaign.metrics?.leads || 0} leads
                      </span>
                    </div>
                  </div>
                </div>

                {/* Campaign Metrics Preview */}
                {campaign.metrics && (
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Sent</p>
                      <p className="text-lg font-bold text-slate-900">{campaign.metrics.sent?.toLocaleString() || '-'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Opened</p>
                      <p className="text-lg font-bold text-blue-600">{campaign.metrics.opened?.toLocaleString() || '-'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Clicked</p>
                      <p className="text-lg font-bold text-green-600">{campaign.metrics.clicked?.toLocaleString() || '-'}</p>
                    </div>
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {campaign.status === 'Active' && campaign.actualCost && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">Budget Spent</span>
                    <span className="text-xs font-medium text-slate-700">
                      ${campaign.actualCost.toLocaleString()} / ${campaign.budget.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full"
                      style={{ width: `${(campaign.actualCost / campaign.budget) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedCampaign(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">{selectedCampaign.name}</h2>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(selectedCampaign.status)}`}>
                    {selectedCampaign.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{selectedCampaign.type} Campaign</p>
              </div>
              <button onClick={() => setSelectedCampaign(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-slate-100">
              <div className="flex gap-6">
                {(['overview', 'performance', 'members'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 border-b-2 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'border-brand-600 text-brand-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Budget</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">${selectedCampaign.budget.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Spent</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">${selectedCampaign.actualCost?.toLocaleString() || 0}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Expected Revenue</p>
                      <p className="text-xl font-bold text-green-600 mt-1">${selectedCampaign.expectedRevenue?.toLocaleString() || 0}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Actual Revenue</p>
                      <p className="text-xl font-bold text-green-600 mt-1">${selectedCampaign.actualRevenue?.toLocaleString() || 0}</p>
                    </div>
                  </div>

                  {/* Campaign Details */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-4">Campaign Details</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-500">Type</span>
                          <span className="text-sm font-medium text-slate-900">{selectedCampaign.type}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-500">Start Date</span>
                          <span className="text-sm font-medium text-slate-900">{selectedCampaign.startDate}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-500">End Date</span>
                          <span className="text-sm font-medium text-slate-900">{selectedCampaign.endDate}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-500">Owner</span>
                          <span className="text-sm font-medium text-slate-900">{selectedCampaign.owner}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-sm text-slate-500">Target Audience</span>
                          <span className="text-sm font-medium text-slate-900">{selectedCampaign.targetAudience || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>

                    {selectedCampaign.metrics && (
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-4">Campaign Metrics</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Emails Sent</span>
                            <span className="text-sm font-medium text-slate-900">{selectedCampaign.metrics.sent?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Open Rate</span>
                            <span className="text-sm font-medium text-blue-600">
                              {selectedCampaign.metrics.sent && selectedCampaign.metrics.opened
                                ? ((selectedCampaign.metrics.opened / selectedCampaign.metrics.sent) * 100).toFixed(1)
                                : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Click Rate</span>
                            <span className="text-sm font-medium text-green-600">
                              {selectedCampaign.metrics.opened && selectedCampaign.metrics.clicked
                                ? ((selectedCampaign.metrics.clicked / selectedCampaign.metrics.opened) * 100).toFixed(1)
                                : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Leads Generated</span>
                            <span className="text-sm font-medium text-slate-900">{selectedCampaign.metrics.leads}</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-sm text-slate-500">Conversions</span>
                            <span className="text-sm font-medium text-slate-900">{selectedCampaign.metrics.converted}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e1b4b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                        <Line type="monotone" dataKey="sent" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} name="Sent" />
                        <Line type="monotone" dataKey="opened" stroke="#0891b2" strokeWidth={2} dot={{ r: 4 }} name="Opened" />
                        <Line type="monotone" dataKey="clicked" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} name="Clicked" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-slate-300 mb-4" />
                  <h4 className="text-lg font-medium text-slate-600">Campaign Members</h4>
                  <p className="text-sm text-slate-400 mt-1">View and manage campaign recipients</p>
                  <button className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                    Import Members
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                Edit Campaign
              </button>
              <button className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 flex items-center gap-2">
                <Eye size={16} /> View Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
