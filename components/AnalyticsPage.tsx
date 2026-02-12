import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, IndianRupee, Target, ShoppingCart,
  BarChart3, Loader2, Users, CheckSquare, Clock, Layers,
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi, dealsApi, leadsApi, tasksApi, formatINR } from '../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardData {
  totalSales: number;
  totalCount: number;
  monthlyRevenue: number;
  totalPartners: number;
  pendingPartners: number;
  activeLeads: number;
  pendingPayments: number;
}

interface MonthlyStat {
  month: string;
  revenue: number;
  count: number;
}

interface TaskStatsData {
  pending: number;
  in_progress: number;
  completed: number;
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

const INRTooltip = ({ active, payload, label, isDark }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`px-3 py-2 rounded-xl shadow-lg text-xs border ${
      isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      <p className={`font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {formatINR(p.value)}
        </p>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AnalyticsPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  const [stats, setStats] = useState<DashboardData | null>(null);
  const [monthly, setMonthly] = useState<MonthlyStat[]>([]);
  const [dealStatsRaw, setDealStatsRaw] = useState<Record<string, { count: number; value: number }>>({});
  const [leadStatsData, setLeadStatsData] = useState<Record<string, number>>({});
  const [taskStatsData, setTaskStatsData] = useState<TaskStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const cardClass = `premium-card ${isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-soft'}`;

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsData, monthlyData, deals, leads, tasks] = await Promise.all([
        dashboardApi.getStats().catch(() => null),
        dashboardApi.monthlyStats().catch(() => []),
        dealsApi.stats().catch(() => ({})),
        leadsApi.stats().catch(() => ({})),
        tasksApi.stats().catch(() => null),
      ]);

      setStats(statsData);
      setMonthly(Array.isArray(monthlyData) ? monthlyData : []);
      setDealStatsRaw(deals || {});
      setLeadStatsData(leads || {});
      setTaskStatsData(tasks);
    } catch {
      // Best-effort
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------------------------------------------------------------------------
  // Computed data
  // ---------------------------------------------------------------------------

  const totalRevenue = stats?.totalSales ?? 0;
  const monthlyAvgRevenue = monthly.length > 0
    ? Math.round(monthly.reduce((sum, m) => sum + m.revenue, 0) / monthly.length)
    : 0;

  // Transform deal stats: { "Qualification": { count, value } } → array
  const DEAL_STAGE_ORDER = ['Discovery', 'Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  const pipelineStages = DEAL_STAGE_ORDER
    .filter(s => dealStatsRaw[s])
    .map(s => ({
      stage: s,
      count: dealStatsRaw[s]?.count ?? 0,
      totalValue: dealStatsRaw[s]?.value ?? 0,
    }));
  const totalDeals = pipelineStages.reduce((sum, s) => sum + s.count, 0);
  const wonDeals = dealStatsRaw['Closed Won']?.count ?? 0;
  const lostDeals = dealStatsRaw['Closed Lost']?.count ?? 0;
  const activeDeals = totalDeals - wonDeals - lostDeals;
  const dealWinRate = (wonDeals + lostDeals) > 0
    ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100) : 0;
  const totalDealValue = pipelineStages.reduce((sum, s) => sum + s.totalValue, 0);

  // Leads
  const totalLeads = (Object.values(leadStatsData) as number[]).reduce((a, b) => a + b, 0);
  const activeLeads = stats?.activeLeads ?? totalLeads;

  // Tasks
  const tasksCompleted = taskStatsData?.completed ?? 0;
  const tasksPending = (taskStatsData?.pending ?? 0) + (taskStatsData?.in_progress ?? 0);
  const tasksTotal = tasksCompleted + tasksPending;
  const tasksCompletionPct = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

  // Trend
  const currentMonthRevenue = monthly.length > 0 ? monthly[monthly.length - 1]?.revenue ?? 0 : 0;
  const previousMonthRevenue = monthly.length > 1 ? monthly[monthly.length - 2]?.revenue ?? 0 : 0;
  const revenueGrowthPct = previousMonthRevenue > 0
    ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100) : 0;

  // Chart colors
  const BRAND = isDark ? '#818cf8' : '#6366f1';

  const LEAD_COLORS: Record<string, string> = {
    New: '#3b82f6', Contacted: '#06b6d4', Qualified: '#f59e0b',
    Proposal: '#a855f7', Negotiation: '#f97316', Won: '#10b981', Lost: '#ef4444',
  };

  const PIPELINE_COLORS: Record<string, string> = {
    Discovery: '#06b6d4', Qualification: '#3b82f6', 'Needs Analysis': '#8b5cf6',
    Proposal: '#a855f7', Negotiation: '#f97316', 'Closed Won': '#10b981', 'Closed Lost': '#ef4444',
  };

  const leadPieData = Object.entries(leadStatsData)
    .filter(([, v]) => (v as number) > 0)
    .map(([key, value]) => ({ name: key, value: value as number, fill: LEAD_COLORS[key] || '#94a3b8' }));

  const pipelineBarData = pipelineStages.map(s => ({
    stage: s.stage.replace('Closed ', 'C.').replace('Needs Analysis', 'Analysis'),
    fullStage: s.stage, count: s.count, value: s.totalValue,
    fill: PIPELINE_COLORS[s.stage] || '#94a3b8',
  }));

  // KPIs
  const kpiCards = [
    { label: 'Total Revenue', value: formatINR(totalRevenue), icon: <IndianRupee className="w-5 h-5" />,
      bgLight: 'bg-brand-50', bgDark: 'bg-brand-900/20', textLight: 'text-brand-600', textDark: 'text-brand-400', trend: revenueGrowthPct },
    { label: 'Monthly Avg', value: formatINR(monthlyAvgRevenue), icon: <BarChart3 className="w-5 h-5" />,
      bgLight: 'bg-cyan-50', bgDark: 'bg-cyan-900/20', textLight: 'text-cyan-600', textDark: 'text-cyan-400', trend: null },
    { label: 'Active Deals', value: String(activeDeals), icon: <ShoppingCart className="w-5 h-5" />,
      bgLight: 'bg-purple-50', bgDark: 'bg-purple-900/20', textLight: 'text-purple-600', textDark: 'text-purple-400', trend: null },
    { label: 'Deal Win Rate', value: `${dealWinRate}%`, icon: <Target className="w-5 h-5" />,
      bgLight: 'bg-emerald-50', bgDark: 'bg-emerald-900/20', textLight: 'text-emerald-600', textDark: 'text-emerald-400', trend: null },
    { label: 'Active Leads', value: String(activeLeads), icon: <Users className="w-5 h-5" />,
      bgLight: 'bg-blue-50', bgDark: 'bg-blue-900/20', textLight: 'text-blue-600', textDark: 'text-blue-400', trend: null },
    { label: 'Tasks Pending', value: String(tasksPending), icon: <CheckSquare className="w-5 h-5" />,
      bgLight: 'bg-amber-50', bgDark: 'bg-amber-900/20', textLight: 'text-amber-600', textDark: 'text-amber-400', trend: null },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const axisStyle = { fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8' };
  const gridColor = isDark ? '#1a2535' : '#f1f5f9';

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>Analytics</h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Key performance indicators and trends</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card, i) => (
          <div key={card.label} className={`${cardClass} p-4 hover-lift animate-fade-in-up stagger-${i + 1}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isDark ? card.bgDark : card.bgLight}`}>
              <span className={isDark ? card.textDark : card.textLight}>{card.icon}</span>
            </div>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{card.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{card.value}</p>
            {card.trend !== null && (
              <div className="flex items-center gap-1 mt-1.5">
                {card.trend >= 0
                  ? <ArrowUpRight className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  : <ArrowDownRight className={`w-3.5 h-3.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />}
                <span className={`text-xs font-medium ${card.trend >= 0
                  ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                  : isDark ? 'text-red-400' : 'text-red-600'}`}>
                  {Math.abs(card.trend)}% vs last month
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Monthly Revenue – Area Chart */}
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-brand-900/20' : 'bg-brand-50'}`}>
              <TrendingUp className={`w-5 h-5 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Monthly Revenue Trend</h3>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Last {monthly.length} months</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Current Month</p>
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatINR(currentMonthRevenue)}</p>
            </div>
            {revenueGrowthPct !== 0 && (
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                revenueGrowthPct >= 0
                  ? isDark ? 'bg-emerald-900/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                  : isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'
              }`}>
                {revenueGrowthPct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {Math.abs(revenueGrowthPct)}%
              </div>
            )}
          </div>
        </div>

        {monthly.length === 0 ? (
          <div className={`h-64 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No monthly data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} tickLine={false} axisLine={false}
                tickFormatter={(v: string) => v.length > 3 ? v.slice(0, 3) : v} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false}
                tickFormatter={(v: number) => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
              <Tooltip content={<INRTooltip isDark={isDark} />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke={BRAND} strokeWidth={2.5}
                fill="url(#areaGrad)" dot={{ fill: BRAND, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 6, fill: BRAND, stroke: isDark ? '#111a2e' : '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom row: Pipeline + Leads + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pipeline Bar Chart */}
        <div className={`${cardClass} p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
              <Layers className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Deal Pipeline</h3>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{totalDeals} deals &middot; {formatINR(totalDealValue)}</p>
            </div>
          </div>

          {pipelineBarData.length === 0 ? (
            <div className={`h-52 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
              <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No pipeline data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pipelineBarData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 9, fill: isDark ? '#64748b' : '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={({ active, payload }: any) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className={`px-3 py-2 rounded-xl shadow-lg text-xs border ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                      <p className="font-semibold">{d.fullStage}</p>
                      <p>{d.count} deals &middot; {formatINR(d.value)}</p>
                    </div>
                  );
                }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={32}>
                  {pipelineBarData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Leads Pie Chart */}
        <div className={`${cardClass} p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <Users className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Leads by Stage</h3>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{totalLeads} total leads</p>
            </div>
          </div>

          {leadPieData.length === 0 ? (
            <div className={`h-52 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
              <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No leads data</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={leadPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                    {leadPieData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className={`px-3 py-2 rounded-xl shadow-lg text-xs border ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                        <p className="font-semibold">{d.name}: {d.value}</p>
                      </div>
                    );
                  }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
                {leadPieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                    <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tasks Summary */}
        <div className={`${cardClass} p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-900/20' : 'bg-amber-50'}`}>
              <CheckSquare className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Task Summary</h3>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{tasksTotal} total tasks</p>
            </div>
          </div>

          {tasksTotal === 0 ? (
            <div className={`h-52 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
              <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No tasks data</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center py-2">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke={isDark ? '#1a2535' : '#f1f5f9'} strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke={isDark ? '#10b981' : '#059669'} strokeWidth="10"
                      strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 50}`}
                      strokeDashoffset={`${2 * Math.PI * 50 * (1 - tasksCompletionPct / 100)}`} className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{tasksCompletionPct}%</span>
                    <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Done</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2.5 rounded-xl text-center ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
                  <p className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{tasksCompleted}</p>
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Completed</p>
                </div>
                <div className={`p-2.5 rounded-xl text-center ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
                  <p className={`text-lg font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{tasksPending}</p>
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Pending</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Metrics */}
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
            <Activity className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick Metrics</h3>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>At-a-glance summary</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <IndianRupee className="w-4 h-4" />, label: 'Total Sales', value: formatINR(totalRevenue), iconColor: isDark ? 'text-brand-400' : 'text-brand-600' },
            { icon: <ShoppingCart className="w-4 h-4" />, label: 'Deal Count', value: String(totalDeals), iconColor: isDark ? 'text-purple-400' : 'text-purple-600' },
            { icon: <Users className="w-4 h-4" />, label: 'Partners', value: String(stats?.totalPartners ?? 0), iconColor: isDark ? 'text-blue-400' : 'text-blue-600' },
            { icon: <Clock className="w-4 h-4" />, label: 'Pending Payments', value: String(stats?.pendingPayments ?? 0), iconColor: isDark ? 'text-amber-400' : 'text-amber-600' },
          ].map(m => (
            <div key={m.label} className={`p-4 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={m.iconColor}>{m.icon}</span>
                <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{m.label}</span>
              </div>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
