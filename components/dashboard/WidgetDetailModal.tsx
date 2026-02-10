import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import { dashboardApi, formatINR } from '../../services/api';
import { formatCompact, pctChange } from '../../utils/dashboard';
import { NavigationItem } from '../../types';
import { WIDGET_REGISTRY } from '../../config/widgetRegistry';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, LineChart, Line,
} from 'recharts';

interface WidgetDetailModalProps {
  widgetId: string;
  isDark: boolean;
  onClose: () => void;
  navigate: (tab: NavigationItem) => void;
}

// Widget → page mapping
const WIDGET_PAGE_MAP: Record<string, NavigationItem> = {
  'pipeline': 'deals',
  'pipeline-chart': 'deals',
  'leads': 'crm',
  'leads-distribution': 'crm',
  'sales-team': 'reports',
  'monthly': 'reports',
  'partners': 'partners',
  'recent-sales': 'sales-entry',
  'tasks': 'tasks',
  'products': 'reports',
  'top-partners': 'partners',
  'growth': 'reports',
  'revenue-trend': 'reports',
};

export const WidgetDetailModal: React.FC<WidgetDetailModalProps> = ({ widgetId, isDark, onClose, navigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const all = await dashboardApi.getAll();
        setData(all);
      } catch {
        // Best-effort
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const meta = WIDGET_REGISTRY[widgetId];
  const targetPage = WIDGET_PAGE_MAP[widgetId];

  const handleGoToPage = () => {
    if (targetPage) {
      navigate(targetPage);
      onClose();
    }
  };

  const thClass = `text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`;
  const tdClass = `text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`;
  const tdBold = `text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`;
  const rowBorder = isDark ? 'border-zinc-800/50' : 'border-slate-100';

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      );
    }
    if (!data) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Failed to load data</p>
        </div>
      );
    }

    switch (widgetId) {
      case 'pipeline':
        return renderPipelineDetail();
      case 'pipeline-chart':
        return renderPipelineChartDetail();
      case 'leads':
        return renderLeadsDetail();
      case 'leads-distribution':
        return renderLeadsDistributionDetail();
      case 'sales-team':
        return renderSalesTeamDetail();
      case 'monthly':
        return renderMonthlyDetail();
      case 'partners':
        return renderPartnersDetail();
      case 'recent-sales':
        return renderRecentSalesDetail();
      case 'tasks':
        return renderTasksDetail();
      case 'products':
        return renderProductsDetail();
      case 'top-partners':
        return renderTopPartnersDetail();
      case 'growth':
        return renderGrowthDetail();
      case 'revenue-trend':
        return renderRevenueTrendDetail();
      default:
        return <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>No detail view available</p>;
    }
  };

  // --- Pipeline Detail ---
  const renderPipelineDetail = () => {
    const dealStatsRaw = data.dealStats || {};
    const DEAL_STAGE_ORDER = ['Discovery', 'Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
    const pipelineStages = DEAL_STAGE_ORDER
      .filter(s => dealStatsRaw[s])
      .map(s => ({ stage: s, count: dealStatsRaw[s]?.count ?? 0, value: dealStatsRaw[s]?.value ?? 0 }));
    const totalDeals = pipelineStages.reduce((sum, s) => sum + s.count, 0);
    const totalDealValue = pipelineStages.reduce((sum, s) => sum + s.value, 0);
    const wonDeals = dealStatsRaw['Closed Won']?.count ?? 0;
    const lostDeals = dealStatsRaw['Closed Lost']?.count ?? 0;
    const dealWinRate = (wonDeals + lostDeals) > 0 ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100) : 0;

    const PIPELINE_COLORS: Record<string, string> = {
      Discovery: '#06b6d4', Qualification: '#3b82f6', 'Needs Analysis': '#8b5cf6',
      Proposal: '#a855f7', Negotiation: '#f97316', 'Closed Won': '#10b981', 'Closed Lost': '#ef4444',
    };

    return (
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Value</p>
            <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatINR(totalDealValue)}</p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Deals</p>
            <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalDeals}</p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Win Rate</p>
            <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{dealWinRate}%</p>
          </div>
        </div>

        {/* Full table */}
        <table className="w-full">
          <thead>
            <tr className={`border-b ${rowBorder}`}>
              <th className={`${thClass} text-left pb-3`}>Stage</th>
              <th className={`${thClass} text-right pb-3`}>Deals</th>
              <th className={`${thClass} text-right pb-3`}>Value</th>
              <th className={`${thClass} text-right pb-3`}>%</th>
            </tr>
          </thead>
          <tbody>
            {pipelineStages.map((s, i) => {
              const pct = totalDealValue > 0 ? Math.round((s.value / totalDealValue) * 100) : 0;
              return (
                <tr key={i} className={`border-b last:border-0 ${rowBorder}`}>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIPELINE_COLORS[s.stage] || '#94a3b8' }} />
                      <span className={tdBold}>{s.stage}</span>
                    </div>
                  </td>
                  <td className={`${tdClass} py-3 text-right`}>{s.count}</td>
                  <td className={`${tdBold} py-3 text-right`}>{formatINR(s.value)}</td>
                  <td className={`py-3 text-right`}>
                    <div className="flex items-center justify-end gap-2">
                      <div className={`w-16 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PIPELINE_COLORS[s.stage] || '#94a3b8' }} />
                      </div>
                      <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // --- Pipeline Chart Detail ---
  const renderPipelineChartDetail = () => {
    const dealStatsRaw = data.dealStats || {};
    const DEAL_STAGE_ORDER = ['Discovery', 'Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
    const pipelineStages = DEAL_STAGE_ORDER
      .filter(s => dealStatsRaw[s])
      .map(s => ({ stage: s, count: dealStatsRaw[s]?.count ?? 0, value: dealStatsRaw[s]?.value ?? 0 }));
    const totalDeals = pipelineStages.reduce((sum, s) => sum + s.count, 0);
    const totalDealValue = pipelineStages.reduce((sum, s) => sum + s.value, 0);

    const PIPELINE_COLORS: Record<string, string> = {
      Discovery: '#06b6d4', Qualification: '#3b82f6', 'Needs Analysis': '#8b5cf6',
      Proposal: '#a855f7', Negotiation: '#f97316', 'Closed Won': '#10b981', 'Closed Lost': '#ef4444',
    };

    const chartData = pipelineStages.map(s => ({
      stage: s.stage, count: s.count, value: s.value,
      fill: PIPELINE_COLORS[s.stage] || '#94a3b8',
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Deals</p>
            <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalDeals}</p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Value</p>
            <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatINR(totalDealValue)}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#f1f5f9'} vertical={false} />
            <XAxis dataKey="stage" tick={{ fontSize: 11, fill: isDark ? '#71717a' : '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: isDark ? '#71717a' : '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className={`px-3 py-2 rounded-xl shadow-lg text-xs border ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                  <p className="font-semibold">{d.stage}</p>
                  <p>{d.count} deals &middot; {formatINR(d.value)}</p>
                </div>
              );
            }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {chartData.map((s, i) => <Cell key={i} fill={s.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // --- Leads Detail ---
  const renderLeadsDetail = () => {
    const leadStats = data.leadStats || {};
    const LEAD_STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
    const totalLeads = (Object.values(leadStats) as number[]).reduce((a, b) => a + b, 0);
    const wonLeads = (leadStats['Won'] as number) || 0;
    const lostLeads = (leadStats['Lost'] as number) || 0;
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    const LEAD_COLORS: Record<string, string> = {
      New: '#3b82f6', Contacted: '#06b6d4', Qualified: '#f59e0b',
      Proposal: '#a855f7', Negotiation: '#f97316', Won: '#10b981', Lost: '#ef4444',
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Leads</p>
            <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalLeads}</p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Won</p>
            <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{wonLeads}</p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Conversion Rate</p>
            <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{conversionRate}%</p>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className={`border-b ${rowBorder}`}>
              <th className={`${thClass} text-left pb-3`}>Stage</th>
              <th className={`${thClass} text-right pb-3`}>Count</th>
              <th className={`${thClass} text-right pb-3`}>%</th>
            </tr>
          </thead>
          <tbody>
            {LEAD_STAGES.map((stage, i) => {
              const count = (leadStats[stage] as number) || 0;
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
              return (
                <tr key={i} className={`border-b last:border-0 ${rowBorder}`}>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: LEAD_COLORS[stage] || '#94a3b8' }} />
                      <span className={tdBold}>{stage}</span>
                    </div>
                  </td>
                  <td className={`${tdBold} py-3 text-right`}>{count}</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className={`w-16 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: LEAD_COLORS[stage] || '#94a3b8' }} />
                      </div>
                      <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Conversion summary */}
        <div className={`p-4 rounded-xl flex items-center justify-between ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke={isDark ? '#27272a' : '#f1f5f9'} strokeWidth="5" />
                <circle cx="28" cy="28" r="22" fill="none" stroke="#10b981" strokeWidth="5"
                  strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - conversionRate / 100)}`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{conversionRate}%</span>
              </div>
            </div>
            <div>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Conversion Rate</p>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Won {wonLeads} of {totalLeads} leads</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>{lostLeads} Lost</p>
          </div>
        </div>
      </div>
    );
  };

  // --- Leads Distribution Detail ---
  const renderLeadsDistributionDetail = () => {
    const leadStats = data.leadStats || {};
    const totalLeads = (Object.values(leadStats) as number[]).reduce((a, b) => a + b, 0);
    const LEAD_COLORS: Record<string, string> = {
      New: '#3b82f6', Contacted: '#06b6d4', Qualified: '#f59e0b',
      Proposal: '#a855f7', Negotiation: '#f97316', Won: '#10b981', Lost: '#ef4444',
    };
    const pieData = Object.entries(leadStats)
      .filter(([, v]) => (v as number) > 0)
      .map(([key, value]) => ({ name: key, value: value as number, fill: LEAD_COLORS[key] || '#94a3b8' }));

    return (
      <div className="space-y-6">
        <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
          <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Leads</p>
          <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalLeads}</p>
        </div>
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" stroke="none">
                {pieData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
              </Pie>
              <Tooltip content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                const pct = totalLeads > 0 ? Math.round((d.value / totalLeads) * 100) : 0;
                return (
                  <div className={`px-3 py-2 rounded-xl shadow-lg text-xs border ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                    <p className="font-semibold">{d.name}: {d.value} ({pct}%)</p>
                  </div>
                );
              }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
            {pieData.map(d => {
              const pct = totalLeads > 0 ? Math.round((d.value / totalLeads) * 100) : 0;
              return (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
                  <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>{d.name}: {d.value} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // --- Sales Team Detail ---
  const renderSalesTeamDetail = () => {
    const breakdown = data.breakdown || { bySalesperson: [] };
    const growth = data.growth;
    const sortedSalespersons = [...breakdown.bySalesperson].sort((a: any, b: any) => b.totalAmount - a.totalAmount);
    const totalSalesAmount = sortedSalespersons.reduce((s: number, sp: any) => s + sp.totalAmount, 0);
    const totalSalesCount = sortedSalespersons.reduce((s: number, sp: any) => s + sp.count, 0);
    const momChange = growth ? pctChange(growth.thisMonth, growth.lastMonth) : 0;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Achieved</p>
            <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatINR(totalSalesAmount)}</p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Deals</p>
            <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalSalesCount}</p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>MOM Change</p>
            <p className={`text-2xl font-bold mt-1 ${momChange >= 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
              {momChange >= 0 ? '+' : ''}{momChange}%
            </p>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className={`border-b ${rowBorder}`}>
              <th className={`${thClass} text-left pb-3`}>#</th>
              <th className={`${thClass} text-left pb-3`}>Salesperson</th>
              <th className={`${thClass} text-right pb-3`}>Achieved</th>
              <th className={`${thClass} text-right pb-3`}>%</th>
              <th className={`${thClass} text-right pb-3`}>Deals</th>
            </tr>
          </thead>
          <tbody>
            {sortedSalespersons.map((sp: any, i: number) => {
              const pct = totalSalesAmount > 0 ? Math.round((sp.totalAmount / totalSalesAmount) * 100) : 0;
              return (
                <tr key={i} className={`border-b last:border-0 ${rowBorder}`}>
                  <td className={`${tdClass} py-3`}>{i + 1}</td>
                  <td className={`${tdBold} py-3`}>{sp.salespersonName || 'Unknown'}</td>
                  <td className={`${tdBold} py-3 text-right`}>{formatINR(sp.totalAmount)}</td>
                  <td className={`text-xs py-3 text-right ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{pct}%</td>
                  <td className={`${tdClass} py-3 text-right`}>{sp.count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // --- Monthly Detail ---
  const renderMonthlyDetail = () => {
    const monthly: any[] = Array.isArray(data.monthlyStats) ? data.monthlyStats : [];
    const monthlyWithChange = monthly.map((m: any, i: number, arr: any[]) => {
      const prev = i > 0 ? arr[i - 1].revenue : 0;
      return { ...m, change: i > 0 ? pctChange(m.revenue, prev) : 0 };
    });
    const totalRevenue = monthly.reduce((s: number, m: any) => s + m.revenue, 0);
    const totalDeals = monthly.reduce((s: number, m: any) => s + m.count, 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Revenue</p>
            <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatINR(totalRevenue)}</p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Deals</p>
            <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalDeals}</p>
          </div>
        </div>

        {monthly.length > 1 && (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#f1f5f9'} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: isDark ? '#71717a' : '#94a3b8' }} tickLine={false} axisLine={false}
                tickFormatter={(v: string) => v.split(' ')[0]?.slice(0, 3) || v} />
              <YAxis tick={{ fontSize: 10, fill: isDark ? '#71717a' : '#94a3b8' }} tickLine={false} axisLine={false}
                tickFormatter={(v: number) => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
              <Tooltip content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className={`px-3 py-2 rounded-xl shadow-lg text-xs border ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                    <p className="font-medium mb-1">{label}</p>
                    <p className="font-semibold">{formatINR(payload[0].value)}</p>
                  </div>
                );
              }} />
              <Line type="monotone" dataKey="revenue" stroke={isDark ? '#4ade80' : '#16a34a'} strokeWidth={2.5} dot={{ fill: isDark ? '#4ade80' : '#16a34a', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}

        <table className="w-full">
          <thead>
            <tr className={`border-b ${rowBorder}`}>
              <th className={`${thClass} text-left pb-3`}>Month</th>
              <th className={`${thClass} text-right pb-3`}>Revenue</th>
              <th className={`${thClass} text-right pb-3`}>MOM %</th>
              <th className={`${thClass} text-right pb-3`}>Deals</th>
            </tr>
          </thead>
          <tbody>
            {monthlyWithChange.map((m: any, i: number) => (
              <tr key={i} className={`border-b last:border-0 ${rowBorder}`}>
                <td className={`${tdBold} py-3`}>{m.month}</td>
                <td className={`${tdBold} py-3 text-right`}>{formatINR(m.revenue)}</td>
                <td className="py-3 text-right">
                  {i > 0 && (
                    <span className={`text-xs font-semibold ${m.change >= 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
                      {m.change >= 0 ? '+' : ''}{m.change}%
                    </span>
                  )}
                </td>
                <td className={`${tdClass} py-3 text-right`}>{m.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // --- Partners Detail ---
  const renderPartnersDetail = () => {
    const stats = data.stats;
    const breakdown = data.breakdown || { byPartner: [] };
    const sortedPartners = [...breakdown.byPartner].sort((a: any, b: any) => b.totalAmount - a.totalAmount);
    const totalPartnerDeals = sortedPartners.reduce((s: number, p: any) => s + p.count, 0);
    const totalRevenue = sortedPartners.reduce((s: number, p: any) => s + p.totalAmount, 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-200'}`}>
            <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{stats?.totalPartners ?? 0}</p>
            <p className={`text-[10px] uppercase tracking-wider font-medium mt-1 ${isDark ? 'text-blue-500/70' : 'text-blue-500'}`}>Active</p>
          </div>
          <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-200'}`}>
            <p className={`text-2xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{stats?.pendingPartners ?? 0}</p>
            <p className={`text-[10px] uppercase tracking-wider font-medium mt-1 ${isDark ? 'text-amber-500/70' : 'text-amber-500'}`}>Pending</p>
          </div>
          <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-emerald-50 border border-emerald-200'}`}>
            <p className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{sortedPartners.filter((p: any) => p.totalAmount > 0).length}</p>
            <p className={`text-[10px] uppercase tracking-wider font-medium mt-1 ${isDark ? 'text-emerald-500/70' : 'text-emerald-500'}`}>Billed</p>
          </div>
          <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalPartnerDeals}</p>
            <p className={`text-[10px] uppercase tracking-wider font-medium mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Deals</p>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className={`border-b ${rowBorder}`}>
              <th className={`${thClass} text-left pb-3`}>#</th>
              <th className={`${thClass} text-left pb-3`}>Partner</th>
              <th className={`${thClass} text-right pb-3`}>Sales</th>
              <th className={`${thClass} text-right pb-3`}>Deals</th>
              <th className={`${thClass} text-right pb-3`}>%</th>
            </tr>
          </thead>
          <tbody>
            {sortedPartners.map((p: any, i: number) => {
              const pct = totalRevenue > 0 ? Math.round((p.totalAmount / totalRevenue) * 100) : 0;
              return (
                <tr key={i} className={`border-b last:border-0 ${rowBorder}`}>
                  <td className={`${tdClass} py-3`}>{i + 1}</td>
                  <td className={`${tdBold} py-3`}>{p.partnerName || 'Unknown'}</td>
                  <td className={`${tdBold} py-3 text-right`}>{formatINR(p.totalAmount)}</td>
                  <td className={`${tdClass} py-3 text-right`}>{p.count}</td>
                  <td className={`text-xs py-3 text-right ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // --- Recent Sales Detail ---
  const renderRecentSalesDetail = () => {
    const recentSales = data.growth?.recentSales || [];

    return (
      <div className="space-y-4">
        {recentSales.length === 0 ? (
          <div className={`h-32 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No recent sales</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className={`border-b ${rowBorder}`}>
                <th className={`${thClass} text-left pb-3`}>Customer / Partner</th>
                <th className={`${thClass} text-right pb-3`}>Amount</th>
                <th className={`${thClass} text-left pb-3`}>Date</th>
                <th className={`${thClass} text-left pb-3`}>Salesperson</th>
                <th className={`${thClass} text-right pb-3`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((sale: any) => (
                <tr key={sale.id} className={`border-b last:border-0 ${rowBorder}`}>
                  <td className={`${tdBold} py-3`}>{sale.customerName || sale.partnerName || 'N/A'}</td>
                  <td className={`${tdBold} py-3 text-right`}>{formatINR(sale.amount)}</td>
                  <td className={`${tdClass} py-3`}>{sale.saleDate}</td>
                  <td className={`${tdClass} py-3`}>{sale.salespersonName || '-'}</td>
                  <td className="py-3 text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      sale.paymentStatus === 'paid'
                        ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                        : sale.paymentStatus === 'overdue'
                          ? isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'
                          : isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {sale.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  // --- Tasks Detail ---
  const renderTasksDetail = () => {
    const taskStats = data.taskStats || {};
    const completed = taskStats.completed ?? 0;
    const inProgress = taskStats.in_progress ?? 0;
    const pending = taskStats.pending ?? 0;
    const total = completed + inProgress + pending;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const items = [
      { label: 'Completed', value: completed, color: isDark ? 'text-emerald-400' : 'text-emerald-600', bg: isDark ? 'bg-emerald-900/20' : 'bg-emerald-50', barColor: '#10b981' },
      { label: 'In Progress', value: inProgress, color: isDark ? 'text-blue-400' : 'text-blue-600', bg: isDark ? 'bg-blue-900/20' : 'bg-blue-50', barColor: '#3b82f6' },
      { label: 'Pending', value: pending, color: isDark ? 'text-amber-400' : 'text-amber-600', bg: isDark ? 'bg-amber-900/20' : 'bg-amber-50', barColor: '#f59e0b' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-8">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="44" fill="none" stroke={isDark ? '#27272a' : '#f1f5f9'} strokeWidth="8" />
              <circle cx="56" cy="56" r="44" fill="none" stroke="#10b981" strokeWidth="8"
                strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - completionPct / 100)}`}
                className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{completionPct}%</span>
              <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Done</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{total}</p>
            <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Tasks</p>
          </div>
        </div>

        <div className="space-y-3">
          {items.map(item => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.label} className={`p-4 rounded-xl ${item.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>{item.label}</span>
                  <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-white/50'}`}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.barColor }} />
                </div>
                <p className={`text-[10px] mt-1 text-right ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- Products Detail ---
  const renderProductsDetail = () => {
    const breakdown = data.breakdown || { byProduct: [] };
    const sortedProducts = [...breakdown.byProduct].sort((a: any, b: any) => b.totalAmount - a.totalAmount);
    const totalRevenue = sortedProducts.reduce((s: number, p: any) => s + p.totalAmount, 0);
    const totalDeals = sortedProducts.reduce((s: number, p: any) => s + p.count, 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Revenue</p>
            <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatINR(totalRevenue)}</p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Deals</p>
            <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalDeals}</p>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className={`border-b ${rowBorder}`}>
              <th className={`${thClass} text-left pb-3`}>#</th>
              <th className={`${thClass} text-left pb-3`}>Product</th>
              <th className={`${thClass} text-right pb-3`}>Revenue</th>
              <th className={`${thClass} text-right pb-3`}>Deals</th>
              <th className={`${thClass} text-right pb-3`}>%</th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((p: any, i: number) => {
              const pct = totalRevenue > 0 ? Math.round((p.totalAmount / totalRevenue) * 100) : 0;
              return (
                <tr key={i} className={`border-b last:border-0 ${rowBorder}`}>
                  <td className={`${tdClass} py-3`}>{i + 1}</td>
                  <td className={`${tdBold} py-3`}>{p.productName || 'Unknown'}</td>
                  <td className={`${tdBold} py-3 text-right`}>{formatINR(p.totalAmount)}</td>
                  <td className={`${tdClass} py-3 text-right`}>{p.count}</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className={`w-16 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`}>
                        <div className="h-full rounded-full bg-teal-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // --- Top Partners Detail ---
  const renderTopPartnersDetail = () => {
    const breakdown = data.breakdown || { byPartner: [] };
    const sortedPartners = [...breakdown.byPartner].sort((a: any, b: any) => b.totalAmount - a.totalAmount);
    const totalRevenue = sortedPartners.reduce((s: number, p: any) => s + p.totalAmount, 0);

    return (
      <div className="space-y-6">
        <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
          <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Partner Revenue</p>
          <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatINR(totalRevenue)}</p>
        </div>

        <div className="space-y-3">
          {sortedPartners.map((p: any, i: number) => {
            const pct = totalRevenue > 0 ? Math.round((p.totalAmount / totalRevenue) * 100) : 0;
            return (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : i === 1 ? 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
                  : i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : `${isDark ? 'bg-zinc-800 text-zinc-500' : 'bg-white text-slate-400'}`
                }`}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.partnerName || 'Unknown'}</p>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{p.count} deals</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatINR(p.totalAmount)}</p>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{pct}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- Growth Detail ---
  const renderGrowthDetail = () => {
    const stats = data.stats;
    const growth = data.growth;
    const momChange = growth ? pctChange(growth.thisMonth, growth.lastMonth) : 0;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-5 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>This Month</p>
            <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatINR(growth?.thisMonth ?? 0)}</p>
          </div>
          <div className={`p-5 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Last Month</p>
            <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatINR(growth?.lastMonth ?? 0)}</p>
          </div>
        </div>

        <div className={`p-5 rounded-xl text-center ${momChange >= 0
          ? (isDark ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-emerald-50 border border-emerald-200')
          : (isDark ? 'bg-red-900/20 border border-red-800/30' : 'bg-red-50 border border-red-200')
        }`}>
          <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Month-over-Month Change</p>
          <p className={`text-4xl font-bold mt-2 ${momChange >= 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
            {momChange >= 0 ? '+' : ''}{momChange}%
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Revenue</p>
            <p className={`text-xl font-bold mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{formatINR(stats?.totalSales ?? 0)}</p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Pending Payments</p>
            <p className={`text-xl font-bold mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{stats?.pendingPayments ?? 0}</p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Deals</p>
            <p className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats?.totalCount ?? 0}</p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Active Leads</p>
            <p className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats?.activeLeads ?? 0}</p>
          </div>
        </div>
      </div>
    );
  };

  // --- Revenue Trend Detail ---
  const renderRevenueTrendDetail = () => {
    const monthly: any[] = Array.isArray(data.monthlyStats) ? data.monthlyStats : [];
    const monthlyChange = monthly.length >= 2 ? pctChange(monthly[monthly.length - 1].revenue, monthly[monthly.length - 2].revenue) : 0;
    const totalRevenue = monthly.reduce((s: number, m: any) => s + m.revenue, 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Revenue</p>
            <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatINR(totalRevenue)}</p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Latest MOM</p>
            <p className={`text-2xl font-bold mt-1 ${monthlyChange >= 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
              {monthlyChange >= 0 ? '+' : ''}{monthlyChange}%
            </p>
          </div>
        </div>

        {monthly.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthly} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="detailGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDark ? '#818cf8' : '#6366f1'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isDark ? '#818cf8' : '#6366f1'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#f1f5f9'} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: isDark ? '#71717a' : '#94a3b8' }} tickLine={false} axisLine={false}
                tickFormatter={(v: string) => v.split(' ')[0]?.slice(0, 3) || v} />
              <YAxis tick={{ fontSize: 11, fill: isDark ? '#71717a' : '#94a3b8' }} tickLine={false} axisLine={false}
                tickFormatter={(v: number) => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
              <Tooltip content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className={`px-3 py-2 rounded-xl shadow-lg text-sm border ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                    <p className={`font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>{label}</p>
                    <p className="font-semibold" style={{ color: isDark ? '#818cf8' : '#6366f1' }}>Revenue: {formatINR(payload[0].value)}</p>
                  </div>
                );
              }} />
              <Area type="monotone" dataKey="revenue" stroke={isDark ? '#818cf8' : '#6366f1'} strokeWidth={2.5} fill="url(#detailGrad)"
                dot={{ fill: isDark ? '#818cf8' : '#6366f1', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: isDark ? '#818cf8' : '#6366f1', stroke: isDark ? '#18181b' : '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl animate-fade-in-up ${
        isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            {meta && (
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-brand-900/30' : 'bg-brand-50'}`}>
                <span className={isDark ? 'text-brand-400' : 'text-brand-600'}>{meta.icon}</span>
              </div>
            )}
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {meta?.label || widgetId}
              </h2>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                {meta?.description || 'Widget Details'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {targetPage && (
              <button
                onClick={handleGoToPage}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Full Page
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
