import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, BarChart3, LineChart, PieChart, Table, Download, Play, Clock, Star, MoreVertical, TrendingUp, Users, DollarSign, Target, Loader2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart as ReLineChart, Line, PieChart as RePieChart, Pie, Cell, Legend, AreaChart, Area, FunnelChart, Funnel, LabelList } from 'recharts';
import { reportsApi } from '../services/api';

const COLORS = ['#4f46e5', '#059669', '#0891b2', '#7c3aed', '#dc2626', '#ea580c'];

const reports = [
  { id: '1', name: 'Sales Pipeline Report', type: 'Deal', chartType: 'Funnel', lastRun: '2024-12-08', owner: 'Sarah Jenkins', starred: true },
  { id: '2', name: 'Monthly Revenue Analysis', type: 'Deal', chartType: 'Line', lastRun: '2024-12-08', owner: 'Sarah Jenkins', starred: true },
  { id: '3', name: 'Lead Source Performance', type: 'Lead', chartType: 'Pie', lastRun: '2024-12-07', owner: 'Emily Rodriguez', starred: false },
  { id: '4', name: 'Sales Activity Summary', type: 'Activity', chartType: 'Bar', lastRun: '2024-12-06', owner: 'Michael Chen', starred: false },
  { id: '5', name: 'Win/Loss Analysis', type: 'Deal', chartType: 'Bar', lastRun: '2024-12-05', owner: 'Sarah Jenkins', starred: true },
  { id: '6', name: 'Team Performance', type: 'Activity', chartType: 'Bar', lastRun: '2024-12-04', owner: 'Sarah Jenkins', starred: false },
];

const getChartIcon = (type: string) => {
  switch (type) {
    case 'Bar': return BarChart3;
    case 'Line': return LineChart;
    case 'Pie': return PieChart;
    case 'Table': return Table;
    default: return BarChart3;
  }
};

export const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'library' | 'builder'>('library');
  const [selectedReport, setSelectedReport] = useState<string | null>('2');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueByMonth, setRevenueByMonth] = useState<Array<{name: string; revenue: number; target: number}>>([]);
  const [leadsBySource, setLeadsBySource] = useState<Array<{name: string; value: number; color: string}>>([]);
  const [salesActivity, setSalesActivity] = useState<Array<{name: string; calls: number; emails: number; meetings: number}>>([]);

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        const [revenue, leads, activity] = await Promise.all([
          reportsApi.getRevenueByMonth(),
          reportsApi.getLeadsBySource(),
          reportsApi.getSalesActivity()
        ]);
        setRevenueByMonth(revenue);
        setLeadsBySource(leads);
        setSalesActivity(activity);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reports data');
      } finally {
        setLoading(false);
      }
    };
    fetchReportsData();
  }, []);

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-3" />
          <p className="text-slate-500">Loading reports data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">Error loading reports</p>
          <p className="text-slate-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 font-display">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1 text-sm lg:text-base">Generate insights from your CRM data</p>
        </div>
        <div className="flex gap-2 lg:gap-3">
          <button className="hidden sm:flex items-center gap-2 px-3 lg:px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <Clock size={16} /> Schedule
          </button>
          <button className="flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 shadow-glow flex-1 sm:flex-none">
            <Plus size={16} /> New Report
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-4 lg:p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-200 text-xs lg:text-sm">Total Revenue</p>
              <p className="text-xl lg:text-3xl font-bold mt-1">$2.4M</p>
              <p className="text-brand-200 text-xs mt-2 flex items-center gap-1">
                <TrendingUp size={12} /> +12.5% vs last month
              </p>
            </div>
            <DollarSign size={32} className="text-brand-300 opacity-50 hidden sm:block lg:w-10 lg:h-10" />
          </div>
        </div>
        <div className="bg-white p-4 lg:p-6 rounded-xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs lg:text-sm">Active Deals</p>
              <p className="text-xl lg:text-3xl font-bold text-slate-900 mt-1">47</p>
              <p className="text-green-600 text-xs mt-2">+8 this week</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <Target className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 lg:p-6 rounded-xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs lg:text-sm">New Leads</p>
              <p className="text-xl lg:text-3xl font-bold text-slate-900 mt-1">156</p>
              <p className="text-green-600 text-xs mt-2">+15.3% growth</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 lg:p-6 rounded-xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs lg:text-sm">Win Rate</p>
              <p className="text-xl lg:text-3xl font-bold text-slate-900 mt-1">34%</p>
              <p className="text-green-600 text-xs mt-2">+4.2% improvement</p>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Reports List */}
        <div className="w-full md:w-72 lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="p-2">
              <div className="flex gap-1 mb-2">
                <button
                  onClick={() => setActiveTab('library')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeTab === 'library' ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Library
                </button>
                <button
                  onClick={() => setActiveTab('builder')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeTab === 'builder' ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Builder
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {filteredReports.map((report) => {
                const ChartIcon = getChartIcon(report.chartType);
                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                      selectedReport === report.id ? 'bg-brand-50 border-l-4 border-brand-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        report.type === 'Deal' ? 'bg-green-100 text-green-600' :
                        report.type === 'Lead' ? 'bg-blue-100 text-blue-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        <ChartIcon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-slate-900 truncate">{report.name}</h4>
                          {report.starred && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{report.type} Report</p>
                        <p className="text-xs text-slate-400 mt-1">Last run: {report.lastRun}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Report Preview */}
        <div className="flex-1 bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
          {selectedReport === '2' ? (
            <>
              {/* Report Header */}
              <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-900">Monthly Revenue Analysis</h2>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">Revenue performance vs targets for 2024</p>
                </div>
                <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                  <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-600 hover:bg-slate-50">
                    <Download size={16} /> Export
                  </button>
                  <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brand-600 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-brand-700">
                    <Play size={16} /> Run
                  </button>
                </div>
              </div>

              {/* Chart */}
              <div className="p-4 md:p-6">
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueByMonth}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} tickFormatter={(v) => `$${v / 1000}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e1b4b', border: 'none', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fill="url(#colorRevenue)" />
                      <Line type="monotone" dataKey="target" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-lg lg:text-2xl font-bold text-slate-900">$3.16M</p>
                    <p className="text-xs lg:text-sm text-slate-500">Total Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg lg:text-2xl font-bold text-green-600">+18.2%</p>
                    <p className="text-xs lg:text-sm text-slate-500">YoY Growth</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg lg:text-2xl font-bold text-slate-900">$263K</p>
                    <p className="text-xs lg:text-sm text-slate-500">Avg Monthly</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg lg:text-2xl font-bold text-blue-600">94%</p>
                    <p className="text-xs lg:text-sm text-slate-500">Target Achievement</p>
                  </div>
                </div>
              </div>
            </>
          ) : selectedReport === '3' ? (
            <>
              <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-900">Lead Source Performance</h2>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">Distribution of leads by acquisition source</p>
                </div>
                <div className="flex gap-2 md:gap-3">
                  <button className="flex items-center gap-2 px-3 md:px-4 py-2 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-600 hover:bg-slate-50">
                    <Download size={16} /> Export
                  </button>
                </div>
              </div>
              <div className="p-4 md:p-6">
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={leadsBySource}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {leadsBySource.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : selectedReport === '4' ? (
            <>
              <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-900">Sales Activity Summary</h2>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">Weekly activity breakdown by type</p>
                </div>
                <div className="flex gap-2 md:gap-3">
                  <button className="flex items-center gap-2 px-3 md:px-4 py-2 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-600 hover:bg-slate-50">
                    <Download size={16} /> Export
                  </button>
                </div>
              </div>
              <div className="p-4 md:p-6">
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesActivity}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e1b4b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Legend />
                      <Bar dataKey="calls" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="emails" fill="#0891b2" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="meetings" fill="#059669" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
                <h4 className="text-lg font-medium text-slate-600">Select a report</h4>
                <p className="text-sm text-slate-400">Choose a report from the library to view</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
