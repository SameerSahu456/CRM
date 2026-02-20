import React, { useState, useEffect, useCallback } from 'react';
import { X, ExternalLink, Loader2, ArrowLeft, ChevronRight, Users, Briefcase, Target, TrendingUp } from 'lucide-react';
import { dashboardApi, formatINR } from '@/services/api';
import { formatCompact, pctChange } from '@/utils/dashboard';
import { NavigationItem } from '@/types';
import { WIDGET_REGISTRY } from '@/config/widgetRegistry';
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
  'leads': 'leads',
  'leads-distribution': 'leads',
  'sales-team': 'sales-entry',
  'monthly': 'sales-entry',
  'partners': 'partners',
  'recent-sales': 'sales-entry',
  'products': 'sales-entry',
  'top-partners': 'partners',
  'growth': 'sales-entry',
  'revenue-trend': 'sales-entry',
};

export const WidgetDetailModal: React.FC<WidgetDetailModalProps> = ({ widgetId, isDark, onClose, navigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [assigneeDetail, setAssigneeDetail] = useState<any>(null);
  const [assigneeLoading, setAssigneeLoading] = useState(false);

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

  const handleAssigneeClick = useCallback(async (userId: string) => {
    setSelectedAssignee(userId);
    setAssigneeLoading(true);
    setAssigneeDetail(null);
    try {
      const detail = await dashboardApi.getAssigneeDetail(userId);
      setAssigneeDetail(detail);
    } catch {
      // Best-effort
    } finally {
      setAssigneeLoading(false);
    }
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
      case 'assignee-summary':
        return renderAssigneeSummaryDetail();
      default:
        return <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>No detail view available</p>;
    }
  };

  // --- Pipeline Detail ---
  const renderPipelineDetail = () => {
    const dealStatsRaw = data.dealStats || {};
    const DEAL_STAGE_ORDER = ['New', 'Proposal', 'Cold', 'Negotiation', 'Closed Lost', 'Closed Won'];
    const pipelineStages = DEAL_STAGE_ORDER
      .filter(s => dealStatsRaw[s])
      .map(s => ({ stage: s, count: dealStatsRaw[s]?.count ?? 0, value: dealStatsRaw[s]?.value ?? 0 }));
    const totalDeals = pipelineStages.reduce((sum, s) => sum + s.count, 0);
    const totalDealValue = pipelineStages.reduce((sum, s) => sum + s.value, 0);
    const wonDeals = dealStatsRaw['Closed Won']?.count ?? 0;
    const lostDeals = dealStatsRaw['Closed Lost']?.count ?? 0;
    const dealWinRate = (wonDeals + lostDeals) > 0 ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100) : 0;

    const PIPELINE_COLORS: Record<string, string> = {
      New: '#06b6d4', Proposal: '#a855f7', Cold: '#3b82f6', Negotiation: '#f97316', 'Closed Lost': '#ef4444', 'Closed Won': '#10b981',
    };

    return (
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
    const DEAL_STAGE_ORDER = ['New', 'Proposal', 'Cold', 'Negotiation', 'Closed Lost', 'Closed Won'];
    const pipelineStages = DEAL_STAGE_ORDER
      .filter(s => dealStatsRaw[s])
      .map(s => ({ stage: s, count: dealStatsRaw[s]?.count ?? 0, value: dealStatsRaw[s]?.value ?? 0 }));
    const totalDeals = pipelineStages.reduce((sum, s) => sum + s.count, 0);
    const totalDealValue = pipelineStages.reduce((sum, s) => sum + s.value, 0);

    const PIPELINE_COLORS: Record<string, string> = {
      New: '#06b6d4', Proposal: '#a855f7', Cold: '#3b82f6', Negotiation: '#f97316', 'Closed Lost': '#ef4444', 'Closed Won': '#10b981',
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
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1a2535' : '#f1f5f9'} vertical={false} />
            <XAxis dataKey="stage" tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
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
    const LEAD_STAGES = ['New', 'Proposal', 'Cold', 'Negotiation', 'Closed Lost', 'Closed Won'];
    const totalLeads = (Object.values(leadStats) as number[]).reduce((a, b) => a + b, 0);
    const wonLeads = (leadStats['Closed Won'] as number) || 0;
    const lostLeads = (leadStats['Closed Lost'] as number) || 0;
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    const LEAD_COLORS: Record<string, string> = {
      New: '#06b6d4', Proposal: '#a855f7', Cold: '#3b82f6', Negotiation: '#f97316', 'Closed Lost': '#ef4444', 'Closed Won': '#10b981',
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <circle cx="28" cy="28" r="22" fill="none" stroke={isDark ? '#1a2535' : '#f1f5f9'} strokeWidth="5" />
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
      New: '#06b6d4', Proposal: '#a855f7', Cold: '#3b82f6', Negotiation: '#f97316', 'Closed Lost': '#ef4444', 'Closed Won': '#10b981',
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1a2535' : '#f1f5f9'} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: isDark ? '#64748b' : '#94a3b8' }} tickLine={false} axisLine={false}
                tickFormatter={(v: string) => v.split(' ')[0]?.slice(0, 3) || v} />
              <YAxis tick={{ fontSize: 10, fill: isDark ? '#64748b' : '#94a3b8' }} tickLine={false} axisLine={false}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
              <circle cx="56" cy="56" r="44" fill="none" stroke={isDark ? '#1a2535' : '#f1f5f9'} strokeWidth="8" />
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

  // --- Assignee Summary Detail ---
  const renderAssigneeSummaryDetail = () => {
    // Level 2: Per-assignee drill-down
    if (selectedAssignee) {
      if (assigneeLoading) {
        return (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        );
      }
      if (!assigneeDetail) {
        return (
          <div className="space-y-4">
            <button onClick={() => setSelectedAssignee(null)} className={`flex items-center gap-2 text-sm font-medium transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
              <ArrowLeft className="w-4 h-4" /> Back to all assignees
            </button>
            <div className={`h-48 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
              <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Failed to load details</p>
            </div>
          </div>
        );
      }

      const d = assigneeDetail;
      const LEAD_COLORS: Record<string, string> = {
        New: '#06b6d4', Proposal: '#a855f7', Cold: '#3b82f6', Negotiation: '#f97316', 'Closed Lost': '#ef4444', 'Closed Won': '#10b981',
      };
      const DEAL_COLORS: Record<string, string> = {
        New: '#06b6d4', Proposal: '#a855f7', Cold: '#3b82f6', Negotiation: '#f97316', 'Closed Lost': '#ef4444', 'Closed Won': '#10b981',
      };
      const totalLeads = Object.values(d.leadsByStage as Record<string, number>).reduce((a, b) => a + b, 0);
      const dealEntries = Object.entries(d.dealsByStage as Record<string, { count: number; value: number }>);
      const totalDealValue = dealEntries.reduce((s, [, v]) => s + v.value, 0);
      const initials = (d.userName || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

      return (
        <div className="space-y-6">
          {/* Header: Back + avatar + name */}
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedAssignee(null)} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/[0.06] text-zinc-400' : 'hover:bg-slate-100 text-slate-400'}`}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isDark ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-700'}`}>
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className={`text-lg font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{d.userName}</h3>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Individual Performance Overview</p>
            </div>
          </div>

          {/* Summary metric cards — 2x2 grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[rgba(10,16,32,0.5)] border-white/[0.06]' : 'bg-blue-50/50 border-blue-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Users className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                <span className={`text-[11px] uppercase tracking-wider font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Partners</span>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{d.summary.partners}</p>
            </div>
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[rgba(10,16,32,0.5)] border-white/[0.06]' : 'bg-emerald-50/50 border-emerald-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Target className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
                <span className={`text-[11px] uppercase tracking-wider font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Active Leads</span>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{d.summary.leads}</p>
            </div>
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[rgba(10,16,32,0.5)] border-white/[0.06]' : 'bg-purple-50/50 border-purple-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
                <span className={`text-[11px] uppercase tracking-wider font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Active Deals</span>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{d.summary.deals}</p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Value: {formatINR(d.summary.dealValue)}</p>
            </div>
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[rgba(10,16,32,0.5)] border-white/[0.06]' : 'bg-amber-50/50 border-amber-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                <span className={`text-[11px] uppercase tracking-wider font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Sales</span>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{formatINR(d.summary.salesAmount)}</p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{d.summary.salesCount} transactions</p>
            </div>
          </div>

          {/* Leads & Deals side by side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Leads by stage */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[rgba(10,16,32,0.4)] border-white/[0.06]' : 'bg-slate-50/80 border-slate-200'}`}>
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Leads by Stage</h4>
              {totalLeads === 0 ? (
                <p className={`text-xs py-4 text-center ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>No leads</p>
              ) : (
                <div className="space-y-2.5">
                  {Object.entries(d.leadsByStage as Record<string, number>).filter(([, v]) => v > 0).map(([stage, count]) => {
                    const pct = Math.round((count / totalLeads) * 100);
                    return (
                      <div key={stage}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: LEAD_COLORS[stage] || '#94a3b8' }} />
                            <span className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>{stage}</span>
                          </div>
                          <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{count}</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: LEAD_COLORS[stage] || '#94a3b8' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Deals by stage */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[rgba(10,16,32,0.4)] border-white/[0.06]' : 'bg-slate-50/80 border-slate-200'}`}>
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Deals by Stage</h4>
              {dealEntries.length === 0 ? (
                <p className={`text-xs py-4 text-center ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>No deals</p>
              ) : (
                <div className="space-y-2.5">
                  {dealEntries.map(([stage, info]) => {
                    const pct = totalDealValue > 0 ? Math.round((info.value / totalDealValue) * 100) : 0;
                    return (
                      <div key={stage}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DEAL_COLORS[stage] || '#94a3b8' }} />
                            <span className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>{stage}</span>
                          </div>
                          <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{info.count} &middot; {formatINR(info.value)}</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: DEAL_COLORS[stage] || '#94a3b8' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Monthly sales trend */}
          {d.monthlySales.length > 1 && (
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[rgba(10,16,32,0.4)] border-white/[0.06]' : 'bg-slate-50/80 border-slate-200'}`}>
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Monthly Sales Trend</h4>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={d.monthlySales} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="assigneeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isDark ? '#a78bfa' : '#7c3aed'} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={isDark ? '#a78bfa' : '#7c3aed'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1a2535' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: isDark ? '#455468' : '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={(v: string) => v.split(' ')[0]?.slice(0, 3) || v} />
                  <YAxis tick={{ fontSize: 10, fill: isDark ? '#455468' : '#94a3b8' }} tickLine={false} axisLine={false} width={45}
                    tickFormatter={(v: number) => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                  <Tooltip content={({ active, payload, label }: any) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className={`px-3 py-2 rounded-lg shadow-lg text-xs border ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                        <p className={`font-medium mb-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{label}</p>
                        <p className="font-bold">{formatINR(payload[0].value)}</p>
                      </div>
                    );
                  }} />
                  <Area type="monotone" dataKey="revenue" stroke={isDark ? '#a78bfa' : '#7c3aed'} strokeWidth={2} fill="url(#assigneeGrad)"
                    dot={{ fill: isDark ? '#a78bfa' : '#7c3aed', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: isDark ? '#a78bfa' : '#7c3aed', stroke: isDark ? '#111a2e' : '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent sales */}
          {d.recentSales.length > 0 && (
            <div>
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Recent Sales</h4>
              <div className="space-y-2">
                {d.recentSales.slice(0, 5).map((sale: any) => (
                  <div key={sale.id} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-[rgba(10,16,32,0.4)] border-white/[0.06]' : 'bg-slate-50/80 border-slate-200'}`}>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{sale.customerName || sale.partnerName || 'N/A'}</p>
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{sale.saleDate}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatINR(sale.amount)}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                        sale.paymentStatus === 'paid'
                          ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                          : sale.paymentStatus === 'overdue'
                            ? isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                            : isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {sale.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Level 1: All assignees overview — card-based layout
    const assignees = data?.assigneeSummary || [];

    return (
      <div className="space-y-4">
        {assignees.length === 0 ? (
          <div className={`h-32 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No assignee data available</p>
          </div>
        ) : (
          <>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{assignees.length} team member{assignees.length !== 1 ? 's' : ''} &middot; Select to view details</p>
            <div className="space-y-2">
              {assignees.map((r: any, i: number) => {
                const initials = (r.userName || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                const colors = [
                  { bg: isDark ? 'bg-blue-900/30' : 'bg-blue-100', text: isDark ? 'text-blue-300' : 'text-blue-700' },
                  { bg: isDark ? 'bg-violet-900/30' : 'bg-violet-100', text: isDark ? 'text-violet-300' : 'text-violet-700' },
                  { bg: isDark ? 'bg-emerald-900/30' : 'bg-emerald-100', text: isDark ? 'text-emerald-300' : 'text-emerald-700' },
                  { bg: isDark ? 'bg-amber-900/30' : 'bg-amber-100', text: isDark ? 'text-amber-300' : 'text-amber-700' },
                  { bg: isDark ? 'bg-rose-900/30' : 'bg-rose-100', text: isDark ? 'text-rose-300' : 'text-rose-700' },
                  { bg: isDark ? 'bg-cyan-900/30' : 'bg-cyan-100', text: isDark ? 'text-cyan-300' : 'text-cyan-700' },
                ];
                const avatarColor = colors[i % colors.length];

                return (
                  <div
                    key={r.userId || i}
                    onClick={() => handleAssigneeClick(r.userId)}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      isDark
                        ? 'bg-[rgba(10,16,32,0.4)] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor.bg} ${avatarColor.text}`}>
                      {initials}
                    </div>

                    {/* Name + sales amount */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.userName}</p>
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        {formatINR(r.salesAmount)} sales
                      </p>
                    </div>

                    {/* Metric badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                        <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>{r.partners}</span> P
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                        <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>{r.leads}</span> L
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                        <span className={isDark ? 'text-purple-400' : 'text-purple-600'}>{r.deals}</span> D
                      </div>
                    </div>

                    {/* Chevron */}
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-zinc-600' : 'text-slate-300'}`} />
                  </div>
                );
              })}
            </div>
          </>
        )}
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
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1a2535' : '#f1f5f9'} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8' }} tickLine={false} axisLine={false}
                tickFormatter={(v: string) => v.split(' ')[0]?.slice(0, 3) || v} />
              <YAxis tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8' }} tickLine={false} axisLine={false}
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
                activeDot={{ r: 6, fill: isDark ? '#818cf8' : '#6366f1', stroke: isDark ? '#111a2e' : '#fff', strokeWidth: 2 }} />
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
      <div className={`relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl animate-fade-in-up ${
        isDark ? 'bg-[rgba(8,13,27,0.92)] backdrop-blur-2xl border border-white/[0.06]' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'bg-[rgba(8,13,27,0.95)] backdrop-blur-xl border-white/[0.06]' : 'bg-white border-slate-200'
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
                  isDark ? 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] border border-white/[0.06]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Full Page
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-white/[0.06] text-zinc-400' : 'hover:bg-slate-100 text-slate-400'
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
