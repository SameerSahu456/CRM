import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Users, Target, ShoppingCart, IndianRupee,
  ArrowUpRight, ArrowDownRight, Calendar, Loader2, Minus,
  CheckSquare, Layers, Handshake, Award, Building2, Package,
  BarChart3, MapPin
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { NavigationItem } from '../types';
import { dashboardApi, formatINR } from '../services/api';

// ---------- Types ----------
interface DashboardData {
  totalSales: number;
  totalCount: number;
  monthlyRevenue: number;
  totalPartners: number;
  pendingPartners: number;
  activeLeads: number;
  pendingPayments: number;
}

interface GrowthData {
  thisMonth: number;
  lastMonth: number;
  growthPct: number;
  recentSales: Array<{
    id: string;
    customerName: string;
    amount: number;
    saleDate: string;
    partnerName: string;
    salespersonName: string;
    paymentStatus: string;
  }>;
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

interface BreakdownItem {
  totalAmount: number;
  count: number;
  productName?: string;
  partnerName?: string;
  salespersonName?: string;
}

interface BreakdownData {
  byProduct: BreakdownItem[];
  byPartner: BreakdownItem[];
  bySalesperson: BreakdownItem[];
}

// ---------- Helpers ----------
const formatCompact = (amount: number): string => {
  if (amount >= 10000000) return `\u20B9${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `\u20B9${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `\u20B9${(amount / 1000).toFixed(1)}K`;
  return `\u20B9${amount.toLocaleString('en-IN')}`;
};

const pctChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

// ---------- Reusable card shell ----------
const AnalyticsCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  titleColor?: string;
  badge?: { value: number; suffix?: string };
  badgeRight?: React.ReactNode;
  isDark: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ icon, iconBg, iconColor, title, subtitle, titleColor, badge, badgeRight, isDark, onClick, children, className = '' }) => {
  const [collapsed, setCollapsed] = useState(false);
  const cardClass = `premium-card ${isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white shadow-soft'}`;

  return (
    <div className={`${cardClass} p-4 sm:p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onClick}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <span className={iconColor}>{icon}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-sm font-bold ${titleColor || (isDark ? 'text-white' : 'text-slate-900')}`}>{title}</h3>
              {badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-0.5 ${
                  badge.value >= 0
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {badge.value >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                  {badge.value >= 0 ? '+' : ''}{badge.value}{badge.suffix || '%'}
                </span>
              )}
            </div>
            <p className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {badgeRight}
          <button
            onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-slate-100 text-slate-400'
            }`}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {/* Body */}
      {!collapsed && children}
    </div>
  );
};

// ---------- Main Dashboard ----------
export const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { setActiveTab } = useNavigation();
  const isDark = theme === 'dark';
  const navigate = (tab: NavigationItem) => setActiveTab(tab);

  const [stats, setStats] = useState<DashboardData | null>(null);
  const [growth, setGrowth] = useState<GrowthData | null>(null);
  const [monthly, setMonthly] = useState<MonthlyStat[]>([]);
  const [leadStats, setLeadStats] = useState<Record<string, number>>({});
  const [dealStatsRaw, setDealStatsRaw] = useState<Record<string, { count: number; value: number }>>({});
  const [taskStatsData, setTaskStatsData] = useState<TaskStatsData | null>(null);
  const [breakdownData, setBreakdownData] = useState<BreakdownData>({ byProduct: [], byPartner: [], bySalesperson: [] });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Single API call replaces 7 separate requests — much faster on Vercel serverless
      const all = await dashboardApi.getAll();
      setStats(all.stats);
      setGrowth(all.growth);
      setMonthly(Array.isArray(all.monthlyStats) ? all.monthlyStats : []);
      setLeadStats(all.leadStats || {});
      setDealStatsRaw(all.dealStats || {});
      setTaskStatsData(all.taskStats || null);
      setBreakdownData(all.breakdown || { byProduct: [], byPartner: [], bySalesperson: [] });
    } catch {
      // Dashboard is best-effort
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------- Computed data ----------
  const sortedSalespersons = [...breakdownData.bySalesperson].sort((a, b) => b.totalAmount - a.totalAmount);
  const sortedPartners = [...breakdownData.byPartner].sort((a, b) => b.totalAmount - a.totalAmount);
  const sortedProducts = [...breakdownData.byProduct].sort((a, b) => b.totalAmount - a.totalAmount);

  const totalSalesAmount = sortedSalespersons.reduce((s, sp) => s + sp.totalAmount, 0);
  const totalSalesCount = sortedSalespersons.reduce((s, sp) => s + sp.count, 0);
  const totalPartnerRevenue = sortedPartners.reduce((s, p) => s + p.totalAmount, 0);
  const totalPartnerDeals = sortedPartners.reduce((s, p) => s + p.count, 0);
  const totalProductRevenue = sortedProducts.reduce((s, p) => s + p.totalAmount, 0);
  const totalProductDeals = sortedProducts.reduce((s, p) => s + p.count, 0);

  // Monthly with % change
  const monthlyWithChange = monthly.slice(-6).map((m, i, arr) => {
    const prev = i > 0 ? arr[i - 1].revenue : 0;
    return { ...m, change: i > 0 ? pctChange(m.revenue, prev) : 0 };
  });
  const totalMonthlyRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  const totalMonthlyDeals = monthly.reduce((s, m) => s + m.count, 0);
  const monthlyChange = monthly.length >= 2 ? pctChange(monthly[monthly.length - 1].revenue, monthly[monthly.length - 2].revenue) : 0;

  // Deal pipeline
  const DEAL_STAGE_ORDER = ['Discovery', 'Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  const pipelineStages = DEAL_STAGE_ORDER
    .filter(s => dealStatsRaw[s])
    .map(s => ({ stage: s, count: dealStatsRaw[s]?.count ?? 0, value: dealStatsRaw[s]?.value ?? 0 }));
  const totalDeals = pipelineStages.reduce((sum, s) => sum + s.count, 0);
  const totalDealValue = pipelineStages.reduce((sum, s) => sum + s.value, 0);
  const wonDeals = dealStatsRaw['Closed Won']?.count ?? 0;
  const lostDeals = dealStatsRaw['Closed Lost']?.count ?? 0;
  const dealWinRate = (wonDeals + lostDeals) > 0 ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100) : 0;

  // Lead stats
  const LEAD_STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  const totalLeads = (Object.values(leadStats) as number[]).reduce((a, b) => a + b, 0);
  const wonLeads = (leadStats['Won'] as number) || 0;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  // Tasks
  const tasksCompleted = taskStatsData?.completed ?? 0;
  const tasksPending = (taskStatsData?.pending ?? 0) + (taskStatsData?.in_progress ?? 0);
  const tasksTotal = tasksCompleted + tasksPending;
  const tasksCompletionPct = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

  // Growth
  const momChange = growth ? pctChange(growth.thisMonth, growth.lastMonth) : 0;

  // Table helpers
  const thClass = `text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`;
  const tdClass = `text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`;
  const tdBold = `text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`;
  const rowBorder = isDark ? 'border-zinc-800/50' : 'border-slate-100';

  const PIPELINE_COLORS: Record<string, string> = {
    Discovery: '#06b6d4', Qualification: '#3b82f6', 'Needs Analysis': '#8b5cf6',
    Proposal: '#a855f7', Negotiation: '#f97316', 'Closed Won': '#10b981', 'Closed Lost': '#ef4444',
  };

  const LEAD_COLORS: Record<string, string> = {
    New: '#3b82f6', Contacted: '#06b6d4', Qualified: '#f59e0b',
    Proposal: '#a855f7', Negotiation: '#f97316', Won: '#10b981', Lost: '#ef4444',
  };

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5 animate-fade-in-up">
      {/* ==================== ROW 1: Main Analytics Cards ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 sm:gap-5">

        {/* ===== 1. SALES TEAM — Performance Tracker ===== */}
        <AnalyticsCard
          icon={<Users className="w-4 h-4" />}
          iconBg={isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'}
          iconColor={isDark ? 'text-emerald-400' : 'text-emerald-600'}
          title="Sales Team"
          titleColor={isDark ? 'text-emerald-400' : 'text-emerald-700'}
          subtitle="Performance Tracker"
          badge={momChange !== 0 ? { value: momChange } : undefined}
          isDark={isDark}
          onClick={() => navigate('reports')}
        >
          {/* Big metric */}
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCompact(totalSalesAmount)}
              </p>
              <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                Total Achieved
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {totalSalesCount}
              </p>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Deals</p>
            </div>
          </div>

          {/* Table */}
          {sortedSalespersons.length === 0 ? (
            <div className={`h-24 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No sales data</p>
            </div>
          ) : (
            <div className="max-h-[200px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${rowBorder}`}>
                    <th className={`${thClass} text-left pb-2`}>Name</th>
                    <th className={`${thClass} text-right pb-2`}>Achieved</th>
                    <th className={`${thClass} text-right pb-2`}>%</th>
                    <th className={`${thClass} text-right pb-2`}>Deals</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSalespersons.slice(0, 10).map((sp, i) => {
                    const pct = totalSalesAmount > 0 ? Math.round((sp.totalAmount / totalSalesAmount) * 100) : 0;
                    return (
                      <tr key={i} className={`border-b last:border-0 ${rowBorder}`}>
                        <td className={`${tdClass} py-2 truncate max-w-[100px]`}>{sp.salespersonName || 'Unknown'}</td>
                        <td className={`${tdBold} py-2 text-right`}>{formatCompact(sp.totalAmount)}</td>
                        <td className={`text-xs py-2 text-right ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{pct}%</td>
                        <td className={`${tdClass} py-2 text-right`}>{sp.count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AnalyticsCard>

        {/* ===== 2. MONTHLY — Last 6 Months ===== */}
        <AnalyticsCard
          icon={<Calendar className="w-4 h-4" />}
          iconBg={isDark ? 'bg-green-900/30' : 'bg-green-50'}
          iconColor={isDark ? 'text-green-400' : 'text-green-600'}
          title="Monthly"
          titleColor={isDark ? 'text-green-400' : 'text-green-700'}
          subtitle="Last 6 Months"
          badge={monthlyChange !== 0 ? { value: monthlyChange } : undefined}
          isDark={isDark}
          onClick={() => navigate('reports')}
        >
          {/* Big metric */}
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <p className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCompact(totalMonthlyRevenue)}
              </p>
              <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                Total Revenue
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                {totalMonthlyDeals.toLocaleString()}
              </p>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Deals</p>
            </div>
          </div>

          {/* Mini sparkline */}
          {monthlyWithChange.length > 1 && (
            <div className="mb-3">
              <ResponsiveContainer width="100%" height={40}>
                <LineChart data={monthlyWithChange}>
                  <Line type="monotone" dataKey="revenue" stroke={isDark ? '#4ade80' : '#16a34a'} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          {monthlyWithChange.length === 0 ? (
            <div className={`h-24 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No monthly data</p>
            </div>
          ) : (
            <div className="max-h-[200px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${rowBorder}`}>
                    <th className={`${thClass} text-left pb-2`}>Mon</th>
                    <th className={`${thClass} text-right pb-2`}>Amount</th>
                    <th className={`${thClass} text-right pb-2`}>%</th>
                    <th className={`${thClass} text-right pb-2`}>Deals</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyWithChange.map((m, i) => (
                    <tr key={i} className={`border-b last:border-0 ${rowBorder}`}>
                      <td className={`${tdClass} py-2`}>{m.month.split(' ')[0]?.slice(0, 3) || m.month}</td>
                      <td className={`${tdBold} py-2 text-right`}>{formatCompact(m.revenue)}</td>
                      <td className="py-2 text-right">
                        {i > 0 && (
                          <span className={`text-[10px] font-semibold ${m.change >= 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
                            {m.change >= 0 ? '+' : ''}{m.change}%
                          </span>
                        )}
                      </td>
                      <td className={`${tdClass} py-2 text-right`}>{m.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AnalyticsCard>

        {/* ===== 3. PARTNERS — Current Month ===== */}
        <AnalyticsCard
          icon={<Building2 className="w-4 h-4" />}
          iconBg={isDark ? 'bg-blue-900/30' : 'bg-blue-50'}
          iconColor={isDark ? 'text-blue-400' : 'text-blue-600'}
          title="Partners"
          titleColor={isDark ? 'text-blue-400' : 'text-blue-700'}
          subtitle={currentMonth}
          isDark={isDark}
          onClick={() => navigate('partners')}
        >
          {/* Status badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className={`px-2.5 py-1.5 rounded-lg text-center ${isDark ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-sm font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{stats?.totalPartners ?? 0}</p>
              <p className={`text-[9px] uppercase tracking-wider font-medium ${isDark ? 'text-blue-500/70' : 'text-blue-500'}`}>Active</p>
            </div>
            <div className={`px-2.5 py-1.5 rounded-lg text-center ${isDark ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-200'}`}>
              <p className={`text-sm font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{stats?.pendingPartners ?? 0}</p>
              <p className={`text-[9px] uppercase tracking-wider font-medium ${isDark ? 'text-amber-500/70' : 'text-amber-500'}`}>Pending</p>
            </div>
            <div className={`px-2.5 py-1.5 rounded-lg text-center ${isDark ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-emerald-50 border border-emerald-200'}`}>
              <p className={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{sortedPartners.filter(p => p.totalAmount > 0).length}</p>
              <p className={`text-[9px] uppercase tracking-wider font-medium ${isDark ? 'text-emerald-500/70' : 'text-emerald-500'}`}>Billed</p>
            </div>
          </div>

          {/* Partner table */}
          {sortedPartners.length === 0 ? (
            <div className={`h-24 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No partner data</p>
            </div>
          ) : (
            <>
              <div className="max-h-[160px] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${rowBorder}`}>
                      <th className={`${thClass} text-left pb-2`}>Partner</th>
                      <th className={`${thClass} text-right pb-2`}>Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPartners.slice(0, 8).map((p, i) => (
                      <tr key={i} className={`border-b last:border-0 ${rowBorder}`}>
                        <td className={`${tdClass} py-1.5 truncate max-w-[140px]`}>{p.partnerName || 'Unknown'}</td>
                        <td className={`${tdBold} py-1.5 text-right`}>{formatCompact(p.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Footer */}
              <div className={`flex items-center justify-between pt-3 mt-3 border-t ${rowBorder}`}>
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalPartnerDeals}</span>
                <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Deals</span>
              </div>
            </>
          )}
        </AnalyticsCard>

        {/* ===== 4. DEAL PIPELINE — Stage Distribution ===== */}
        <AnalyticsCard
          icon={<Layers className="w-4 h-4" />}
          iconBg={isDark ? 'bg-purple-900/30' : 'bg-purple-50'}
          iconColor={isDark ? 'text-purple-400' : 'text-purple-600'}
          title="Pipeline"
          titleColor={isDark ? 'text-purple-400' : 'text-purple-700'}
          subtitle="Stage Distribution"
          badgeRight={
            <div className="flex items-center gap-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-600'}`}>{totalDeals}</span>
            </div>
          }
          isDark={isDark}
          onClick={() => navigate('deals')}
        >
          {/* Big metric */}
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCompact(totalDealValue)}
              </p>
              <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                Total Value
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{dealWinRate}%</p>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Win Rate</p>
            </div>
          </div>

          {/* Table */}
          {pipelineStages.length === 0 ? (
            <div className={`h-24 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No pipeline data</p>
            </div>
          ) : (
            <div className="max-h-[200px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${rowBorder}`}>
                    <th className={`${thClass} text-left pb-2`}>Stage</th>
                    <th className={`${thClass} text-right pb-2`}>Amount</th>
                    <th className={`${thClass} text-right pb-2`}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelineStages.map((s, i) => {
                    const pct = totalDealValue > 0 ? Math.round((s.value / totalDealValue) * 100) : 0;
                    return (
                      <tr key={i} className={`border-b last:border-0 ${rowBorder}`}>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIPELINE_COLORS[s.stage] || '#94a3b8' }} />
                            <span className={`${tdClass} truncate`}>{s.stage}</span>
                          </div>
                        </td>
                        <td className={`${tdBold} py-2 text-right`}>{formatCompact(s.value)}</td>
                        <td className={`text-xs py-2 text-right ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AnalyticsCard>

        {/* ===== 5. GROWTH — Performance Metrics ===== */}
        <AnalyticsCard
          icon={<TrendingUp className="w-4 h-4" />}
          iconBg={isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'}
          iconColor={isDark ? 'text-indigo-400' : 'text-indigo-600'}
          title="Growth"
          titleColor={isDark ? 'text-indigo-400' : 'text-indigo-700'}
          subtitle="Performance Metrics"
          badge={momChange !== 0 ? { value: momChange } : undefined}
          isDark={isDark}
          onClick={() => navigate('reports')}
        >
          {/* This Month */}
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <p className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCompact(growth?.thisMonth ?? 0)}
              </p>
              <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                This Month
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{stats?.totalCount ?? 0}</p>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Deals</p>
            </div>
          </div>

          {/* Last month + MOM */}
          <div className={`p-3 rounded-xl mb-3 ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Last Month</p>
                <p className={`text-sm font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCompact(growth?.lastMonth ?? 0)}</p>
              </div>
              <div className="text-right">
                <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>MOM Change</p>
                <div className={`flex items-center justify-end gap-1 mt-0.5`}>
                  {momChange >= 0 ? (
                    <ArrowUpRight className={`w-3 h-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  ) : (
                    <ArrowDownRight className={`w-3 h-3 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  )}
                  <span className={`text-sm font-semibold ${momChange >= 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
                    {momChange >= 0 ? '+' : ''}{momChange}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary metrics */}
          <div className="space-y-2">
            <div className={`flex items-center justify-between p-2.5 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
              <span className={`text-xs font-semibold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Total Revenue</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{formatCompact(stats?.totalSales ?? 0)}</span>
              </div>
            </div>
            <div className={`flex items-center justify-between p-2.5 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
              <span className={`text-xs font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Pending Payments</span>
              <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{stats?.pendingPayments ?? 0}</span>
            </div>
          </div>
        </AnalyticsCard>
      </div>

      {/* ==================== ROW 2: Secondary Analytics Cards ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 sm:gap-5">

        {/* ===== 6. PRODUCTS — Portfolio Performance ===== */}
        <AnalyticsCard
          icon={<Package className="w-4 h-4" />}
          iconBg={isDark ? 'bg-teal-900/30' : 'bg-teal-50'}
          iconColor={isDark ? 'text-teal-400' : 'text-teal-600'}
          title="Products"
          titleColor={isDark ? 'text-teal-400' : 'text-teal-700'}
          subtitle="Portfolio Performance"
          isDark={isDark}
          onClick={() => navigate('reports')}
        >
          {/* Big metric */}
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatCompact(totalProductRevenue)}
              </p>
              <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Revenue</p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>{totalProductDeals}</p>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Deals</p>
            </div>
          </div>

          {sortedProducts.length === 0 ? (
            <div className={`h-24 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No product data</p>
            </div>
          ) : (
            <div className="max-h-[200px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${rowBorder}`}>
                    <th className={`${thClass} text-left pb-2`}>Product</th>
                    <th className={`${thClass} text-right pb-2`}>Amount</th>
                    <th className={`${thClass} text-right pb-2`}>Deals</th>
                    <th className={`${thClass} text-right pb-2`}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.slice(0, 8).map((p, i) => {
                    const pct = totalProductRevenue > 0 ? Math.round((p.totalAmount / totalProductRevenue) * 100) : 0;
                    return (
                      <tr key={i} className={`border-b last:border-0 ${rowBorder}`}>
                        <td className={`${tdClass} py-1.5 truncate max-w-[100px]`}>{p.productName || 'Unknown'}</td>
                        <td className={`${tdBold} py-1.5 text-right`}>{formatCompact(p.totalAmount)}</td>
                        <td className={`${tdClass} py-1.5 text-right`}>{p.count}</td>
                        <td className={`py-1.5 text-right`}>
                          <span className={`text-[10px] font-semibold ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>{pct}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AnalyticsCard>

        {/* ===== 7. LEADS — Funnel Analysis ===== */}
        <AnalyticsCard
          icon={<Target className="w-4 h-4" />}
          iconBg={isDark ? 'bg-orange-900/30' : 'bg-orange-50'}
          iconColor={isDark ? 'text-orange-400' : 'text-orange-600'}
          title="Leads"
          titleColor={isDark ? 'text-orange-400' : 'text-orange-700'}
          subtitle="Funnel Analysis"
          isDark={isDark}
          onClick={() => navigate('crm')}
        >
          {/* Big metric */}
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {totalLeads}
              </p>
              <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                Total Leads
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{conversionRate}%</p>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Conversion</p>
            </div>
          </div>

          {totalLeads === 0 ? (
            <div className={`h-24 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No leads data</p>
            </div>
          ) : (
            <div className="max-h-[200px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${rowBorder}`}>
                    <th className={`${thClass} text-left pb-2`}>Stage</th>
                    <th className={`${thClass} text-right pb-2`}>Count</th>
                    <th className={`${thClass} text-right pb-2`}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {LEAD_STAGES.filter(s => (leadStats[s] ?? 0) > 0).map((stage, i) => {
                    const count = (leadStats[stage] as number) || 0;
                    const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                    return (
                      <tr key={i} className={`border-b last:border-0 ${rowBorder}`}>
                        <td className="py-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: LEAD_COLORS[stage] || '#94a3b8' }} />
                            <span className={tdClass}>{stage}</span>
                          </div>
                        </td>
                        <td className={`${tdBold} py-1.5 text-right`}>{count}</td>
                        <td className={`text-xs py-1.5 text-right ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Conversion ring */}
              <div className={`flex items-center justify-center gap-4 pt-3 mt-3 border-t ${rowBorder}`}>
                <div className="relative w-12 h-12">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="18" fill="none" stroke={isDark ? '#27272a' : '#f1f5f9'} strokeWidth="4" />
                    <circle cx="24" cy="24" r="18" fill="none" stroke="#10b981" strokeWidth="4"
                      strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 18}`}
                      strokeDashoffset={`${2 * Math.PI * 18 * (1 - conversionRate / 100)}`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-[10px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{conversionRate}%</span>
                  </div>
                </div>
                <div>
                  <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Won: {wonLeads}</p>
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Lost: {(leadStats['Lost'] as number) || 0}</p>
                </div>
              </div>
            </div>
          )}
        </AnalyticsCard>

        {/* ===== 8. TASKS — Status Overview ===== */}
        <AnalyticsCard
          icon={<CheckSquare className="w-4 h-4" />}
          iconBg={isDark ? 'bg-amber-900/30' : 'bg-amber-50'}
          iconColor={isDark ? 'text-amber-400' : 'text-amber-600'}
          title="Tasks"
          titleColor={isDark ? 'text-amber-400' : 'text-amber-700'}
          subtitle="Status Overview"
          isDark={isDark}
          onClick={() => navigate('tasks')}
        >
          {/* Completion ring */}
          <div className="flex items-center justify-center gap-5 mb-4">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke={isDark ? '#27272a' : '#f1f5f9'} strokeWidth="6" />
                <circle cx="40" cy="40" r="32" fill="none" stroke={isDark ? '#10b981' : '#059669'} strokeWidth="6"
                  strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - tasksCompletionPct / 100)}`}
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{tasksCompletionPct}%</span>
                <span className={`text-[8px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Done</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div>
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{tasksTotal}</p>
                <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total</p>
              </div>
            </div>
          </div>

          {/* Status rows */}
          <div className="space-y-2">
            {[
              { label: 'Completed', value: tasksCompleted, color: isDark ? 'text-emerald-400' : 'text-emerald-600', bg: isDark ? 'bg-emerald-900/20' : 'bg-emerald-50' },
              { label: 'In Progress', value: taskStatsData?.in_progress ?? 0, color: isDark ? 'text-blue-400' : 'text-blue-600', bg: isDark ? 'bg-blue-900/20' : 'bg-blue-50' },
              { label: 'Pending', value: taskStatsData?.pending ?? 0, color: isDark ? 'text-amber-400' : 'text-amber-600', bg: isDark ? 'bg-amber-900/20' : 'bg-amber-50' },
            ].map(item => (
              <div key={item.label} className={`flex items-center justify-between p-2.5 rounded-xl ${item.bg}`}>
                <span className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>{item.label}</span>
                <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </AnalyticsCard>

        {/* ===== 9. TOP PARTNERS — Revenue Rankings ===== */}
        <AnalyticsCard
          icon={<Award className="w-4 h-4" />}
          iconBg={isDark ? 'bg-rose-900/30' : 'bg-rose-50'}
          iconColor={isDark ? 'text-rose-400' : 'text-rose-600'}
          title="Top Partners"
          titleColor={isDark ? 'text-rose-400' : 'text-rose-700'}
          subtitle="Revenue Rankings"
          isDark={isDark}
          onClick={() => navigate('partners')}
        >
          {sortedPartners.length === 0 ? (
            <div className={`h-32 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No partner data</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {sortedPartners.slice(0, 8).map((p, i) => {
                const pct = totalPartnerRevenue > 0 ? Math.round((p.totalAmount / totalPartnerRevenue) * 100) : 0;
                return (
                  <div key={i} className={`flex items-center gap-2.5 p-2 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : i === 1 ? 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
                      : i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      : `${isDark ? 'bg-zinc-800 text-zinc-500' : 'bg-white text-slate-400'}`
                    }`}>
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {p.partnerName || 'Unknown'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCompact(p.totalAmount)}</p>
                      <p className={`text-[9px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{pct}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AnalyticsCard>

        {/* ===== 10. RECENT SALES — Latest Transactions ===== */}
        <AnalyticsCard
          icon={<ShoppingCart className="w-4 h-4" />}
          iconBg={isDark ? 'bg-cyan-900/30' : 'bg-cyan-50'}
          iconColor={isDark ? 'text-cyan-400' : 'text-cyan-600'}
          title="Recent Sales"
          titleColor={isDark ? 'text-cyan-400' : 'text-cyan-700'}
          subtitle="Latest Transactions"
          isDark={isDark}
          onClick={() => navigate('sales-entry')}
        >
          {!growth?.recentSales?.length ? (
            <div className={`h-32 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No recent sales</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {growth.recentSales.slice(0, 8).map(sale => (
                <div key={sale.id} className={`p-2.5 rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-medium truncate max-w-[120px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {sale.customerName || sale.partnerName || 'N/A'}
                    </p>
                    <p className={`text-xs font-bold flex-shrink-0 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatCompact(sale.amount)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {sale.saleDate} {sale.salespersonName ? `\u00B7 ${sale.salespersonName}` : ''}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                      sale.paymentStatus === 'paid'
                        ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                        : sale.paymentStatus === 'overdue'
                          ? isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'
                          : isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {sale.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AnalyticsCard>
      </div>

      {/* ==================== ROW 3: Charts Row ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Revenue Trend Chart */}
        <AnalyticsCard
          icon={<BarChart3 className="w-4 h-4" />}
          iconBg={isDark ? 'bg-brand-900/30' : 'bg-brand-50'}
          iconColor={isDark ? 'text-brand-400' : 'text-brand-600'}
          title="Revenue Trend"
          titleColor={isDark ? 'text-brand-400' : 'text-brand-700'}
          subtitle={`Last ${monthly.length} months`}
          badge={monthlyChange !== 0 ? { value: monthlyChange } : undefined}
          isDark={isDark}
          onClick={() => navigate('reports')}
        >
          {monthly.length === 0 ? (
            <div className={`h-44 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? '#818cf8' : '#6366f1'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isDark ? '#818cf8' : '#6366f1'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#f1f5f9'} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: isDark ? '#71717a' : '#94a3b8' }} tickLine={false} axisLine={false}
                  tickFormatter={(v: string) => v.split(' ')[0]?.slice(0, 3) || v} />
                <YAxis tick={{ fontSize: 10, fill: isDark ? '#71717a' : '#94a3b8' }} tickLine={false} axisLine={false}
                  tickFormatter={(v: number) => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                <Tooltip content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className={`px-3 py-2 rounded-xl shadow-lg text-xs border ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                      <p className={`font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>{label}</p>
                      <p className="font-semibold" style={{ color: isDark ? '#818cf8' : '#6366f1' }}>Revenue: {formatINR(payload[0].value)}</p>
                    </div>
                  );
                }} />
                <Area type="monotone" dataKey="revenue" stroke={isDark ? '#818cf8' : '#6366f1'} strokeWidth={2.5} fill="url(#dashGrad)"
                  dot={{ fill: isDark ? '#818cf8' : '#6366f1', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: isDark ? '#818cf8' : '#6366f1', stroke: isDark ? '#18181b' : '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </AnalyticsCard>

        {/* Deal Pipeline Bar Chart */}
        <AnalyticsCard
          icon={<Layers className="w-4 h-4" />}
          iconBg={isDark ? 'bg-purple-900/30' : 'bg-purple-50'}
          iconColor={isDark ? 'text-purple-400' : 'text-purple-600'}
          title="Pipeline Chart"
          titleColor={isDark ? 'text-purple-400' : 'text-purple-700'}
          subtitle={`${totalDeals} deals \u00B7 ${formatCompact(totalDealValue)}`}
          isDark={isDark}
          onClick={() => navigate('deals')}
        >
          {pipelineStages.length === 0 ? (
            <div className={`h-44 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No pipeline data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pipelineStages.map(s => ({
                stage: s.stage.replace('Closed ', 'C.').replace('Needs Analysis', 'Analysis'),
                fullStage: s.stage, count: s.count, value: s.value,
                fill: PIPELINE_COLORS[s.stage] || '#94a3b8',
              }))} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#f1f5f9'} vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 9, fill: isDark ? '#71717a' : '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: isDark ? '#71717a' : '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
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
                  {pipelineStages.map((s, i) => (
                    <Cell key={i} fill={PIPELINE_COLORS[s.stage] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </AnalyticsCard>

        {/* Lead Distribution Donut */}
        <AnalyticsCard
          icon={<Users className="w-4 h-4" />}
          iconBg={isDark ? 'bg-blue-900/30' : 'bg-blue-50'}
          iconColor={isDark ? 'text-blue-400' : 'text-blue-600'}
          title="Leads Distribution"
          titleColor={isDark ? 'text-blue-400' : 'text-blue-700'}
          subtitle={`${totalLeads} total leads`}
          isDark={isDark}
          onClick={() => navigate('crm')}
        >
          {totalLeads === 0 ? (
            <div className={`h-44 flex items-center justify-center rounded-xl ${isDark ? 'bg-zinc-900/50' : 'bg-slate-50'}`}>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>No leads data</p>
            </div>
          ) : (() => {
            const pieData = Object.entries(leadStats)
              .filter(([, v]) => (v as number) > 0)
              .map(([key, value]) => ({ name: key, value: value as number, fill: LEAD_COLORS[key] || '#94a3b8' }));
            return (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
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
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </AnalyticsCard>
      </div>
    </div>
  );
};
