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
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi, dealsApi, leadsApi, tasksApi, formatINR } from '@/services/api';
import { Card, Badge } from '@/components/ui';
import { cx } from '@/utils/cx';

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

const INRTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl shadow-lg text-xs border bg-white border-slate-200 text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
      <p className="font-medium mb-1 text-slate-500 dark:text-zinc-300">{label}</p>
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
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardData | null>(null);
  const [monthly, setMonthly] = useState<MonthlyStat[]>([]);
  const [dealStatsRaw, setDealStatsRaw] = useState<Record<string, { count: number; value: number }>>({});
  const [leadStatsData, setLeadStatsData] = useState<Record<string, number>>({});
  const [taskStatsData, setTaskStatsData] = useState<TaskStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  const DEAL_STAGE_ORDER = ['New', 'Proposal', 'Cold', 'Negotiation', 'Closed Lost', 'Closed Won'];
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

  // Chart colors – use CSS variable approach; the raw hex is needed for recharts SVG
  const BRAND_LIGHT = '#6366f1';
  const BRAND_DARK = '#818cf8';

  const LEAD_COLORS: Record<string, string> = {
    New: '#06b6d4', Proposal: '#a855f7', Cold: '#3b82f6',
    Negotiation: '#f97316', 'Closed Lost': '#ef4444', 'Closed Won': '#10b981',
  };

  const PIPELINE_COLORS: Record<string, string> = {
    New: '#06b6d4', Proposal: '#a855f7', Cold: '#3b82f6',
    Negotiation: '#f97316', 'Closed Lost': '#ef4444', 'Closed Won': '#10b981',
  };

  const leadPieData = Object.entries(leadStatsData)
    .filter(([, v]) => (v as number) > 0)
    .map(([key, value]) => ({ name: key, value: value as number, fill: LEAD_COLORS[key] || '#94a3b8' }));

  const pipelineBarData = pipelineStages.map(s => ({
    stage: s.stage.replace('Closed ', 'C.').replace('Needs Analysis', 'Analysis'),
    fullStage: s.stage, count: s.count, value: s.totalValue,
    fill: PIPELINE_COLORS[s.stage] || '#94a3b8',
  }));

  // Detect dark mode for recharts (SVG elements can't use Tailwind dark:)
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const BRAND = isDarkMode ? BRAND_DARK : BRAND_LIGHT;
  const axisStyle = { fontSize: 11, fill: isDarkMode ? '#64748b' : '#94a3b8' };
  const gridColor = isDarkMode ? '#1a2535' : '#f1f5f9';

  // KPIs
  const kpiCards = [
    { label: 'Total Revenue', value: formatINR(totalRevenue), icon: <IndianRupee className="w-5 h-5" />,
      bgClass: 'bg-brand-50 dark:bg-brand-900/20', textClass: 'text-brand-600 dark:text-brand-400', trend: revenueGrowthPct },
    { label: 'Monthly Avg', value: formatINR(monthlyAvgRevenue), icon: <BarChart3 className="w-5 h-5" />,
      bgClass: 'bg-cyan-50 dark:bg-cyan-900/20', textClass: 'text-cyan-600 dark:text-cyan-400', trend: null },
    { label: 'Active Deals', value: String(activeDeals), icon: <ShoppingCart className="w-5 h-5" />,
      bgClass: 'bg-purple-50 dark:bg-purple-900/20', textClass: 'text-purple-600 dark:text-purple-400', trend: null },
    { label: 'Deal Win Rate', value: `${dealWinRate}%`, icon: <Target className="w-5 h-5" />,
      bgClass: 'bg-emerald-50 dark:bg-emerald-900/20', textClass: 'text-emerald-600 dark:text-emerald-400', trend: null },
    { label: 'Active Leads', value: String(activeLeads), icon: <Users className="w-5 h-5" />,
      bgClass: 'bg-blue-50 dark:bg-blue-900/20', textClass: 'text-blue-600 dark:text-blue-400', trend: null },
    { label: 'Tasks Pending', value: String(tasksPending), icon: <CheckSquare className="w-5 h-5" />,
      bgClass: 'bg-amber-50 dark:bg-amber-900/20', textClass: 'text-amber-600 dark:text-amber-400', trend: null },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-sm text-slate-500 dark:text-zinc-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-sm mt-1 text-slate-500 dark:text-zinc-400">Key performance indicators and trends</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card, i) => (
          <Card key={card.label} hover padding="none" className={cx('p-4 animate-fade-in-up', `stagger-${i + 1}`)}>
            <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', card.bgClass)}>
              <span className={card.textClass}>{card.icon}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">{card.label}</p>
            <p className="text-xl font-bold mt-0.5 text-slate-900 dark:text-white">{card.value}</p>
            {card.trend !== null && (
              <div className="flex items-center gap-1 mt-1.5">
                {card.trend >= 0
                  ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  : <ArrowDownRight className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />}
                <span className={cx(
                  'text-xs font-medium',
                  card.trend >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                )}>
                  {Math.abs(card.trend)}% vs last month
                </span>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Monthly Revenue – Area Chart */}
      <Card padding="none" className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-50 dark:bg-brand-900/20">
              <TrendingUp className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Monthly Revenue Trend</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Last {monthly.length} months</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400 dark:text-zinc-500">Current Month</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{formatINR(currentMonthRevenue)}</p>
            </div>
            {revenueGrowthPct !== 0 && (
              <Badge
                variant={revenueGrowthPct >= 0 ? 'emerald' : 'red'}
                size="sm"
              >
                <span className="flex items-center gap-1">
                  {revenueGrowthPct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {Math.abs(revenueGrowthPct)}%
                </span>
              </Badge>
            )}
          </div>
        </div>

        {monthly.length === 0 ? (
          <div className="h-64 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
            <p className="text-sm text-slate-400 dark:text-zinc-500">No monthly data available</p>
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
              <Tooltip content={<INRTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke={BRAND} strokeWidth={2.5}
                fill="url(#areaGrad)" dot={{ fill: BRAND, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 6, fill: BRAND, stroke: isDarkMode ? '#111a2e' : '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Bottom row: Pipeline + Leads + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pipeline Bar Chart */}
        <Card padding="none" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 dark:bg-purple-900/20">
              <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Deal Stages</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">{totalDeals} deals &middot; {formatINR(totalDealValue)}</p>
            </div>
          </div>

          {pipelineBarData.length === 0 ? (
            <div className="h-52 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
              <p className="text-sm text-slate-400 dark:text-zinc-500">No pipeline data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pipelineBarData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 9, fill: isDarkMode ? '#64748b' : '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={({ active, payload }: any) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="px-3 py-2 rounded-xl shadow-lg text-xs border bg-white border-slate-200 text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
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
        </Card>

        {/* Leads Pie Chart */}
        <Card padding="none" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/20">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Leads by Stage</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">{totalLeads} total leads</p>
            </div>
          </div>

          {leadPieData.length === 0 ? (
            <div className="h-52 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
              <p className="text-sm text-slate-400 dark:text-zinc-500">No leads data</p>
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
                      <div className="px-3 py-2 rounded-xl shadow-lg text-xs border bg-white border-slate-200 text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
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
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Tasks Summary */}
        <Card padding="none" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-900/20">
              <CheckSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Task Summary</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">{tasksTotal} total tasks</p>
            </div>
          </div>

          {tasksTotal === 0 ? (
            <div className="h-52 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
              <p className="text-sm text-slate-400 dark:text-zinc-500">No tasks data</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center py-2">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" className="stroke-slate-100 dark:stroke-[#1a2535]" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none" className="stroke-emerald-600 dark:stroke-emerald-500" strokeWidth="10"
                      strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 50}`}
                      strokeDashoffset={`${2 * Math.PI * 50 * (1 - tasksCompletionPct / 100)}`} style={{ transition: 'all 1s' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-slate-900 dark:text-white">{tasksCompletionPct}%</span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">Done</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl text-center bg-slate-50 dark:bg-zinc-900/50">
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{tasksCompleted}</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500">Completed</p>
                </div>
                <div className="p-2.5 rounded-xl text-center bg-slate-50 dark:bg-zinc-900/50">
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{tasksPending}</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500">Pending</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Metrics */}
      <Card padding="none" className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20">
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Quick Metrics</h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500">At-a-glance summary</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <IndianRupee className="w-4 h-4" />, label: 'Total Sales', value: formatINR(totalRevenue), iconColor: 'text-brand-600 dark:text-brand-400' },
            { icon: <ShoppingCart className="w-4 h-4" />, label: 'Deal Count', value: String(totalDeals), iconColor: 'text-purple-600 dark:text-purple-400' },
            { icon: <Users className="w-4 h-4" />, label: 'Accounts', value: String(stats?.totalPartners ?? 0), iconColor: 'text-blue-600 dark:text-blue-400' },
            { icon: <Clock className="w-4 h-4" />, label: 'Pending Payments', value: String(stats?.pendingPayments ?? 0), iconColor: 'text-amber-600 dark:text-amber-400' },
          ].map(m => (
            <div key={m.label} className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2 mb-2">
                <span className={m.iconColor}>{m.icon}</span>
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">{m.label}</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{m.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
