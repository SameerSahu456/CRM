import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, TrendingUp, Users, Target,
  Loader2, Award, Layers
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi, salesApi, leadsApi, dealsApi, formatINR } from '@/services/api';
import { Card } from '@/components/ui';
import { cx } from '@/utils/cx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SalesByProduct { productName: string; totalAmount: number; count: number; }
interface SalesByPartner { partnerName: string; totalAmount: number; count: number; }
interface SalesBySalesperson { salespersonName: string; totalAmount: number; count: number; }

interface BreakdownData {
  byProduct?: SalesByProduct[];
  byPartner?: SalesByPartner[];
  bySalesperson?: SalesBySalesperson[];
}

interface MonthlyStat { month: string; revenue: number; count: number; }

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();

  const [monthlyStat, setMonthlyStat] = useState<MonthlyStat[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
  const [leadStats, setLeadStats] = useState<Record<string, number>>({});
  const [dealStatsRaw, setDealStatsRaw] = useState<Record<string, { count: number; value: number }>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [monthly, bd, leads, deals] = await Promise.all([
        dashboardApi.monthlyStats().catch(() => []),
        salesApi.breakdown().catch(() => null),
        leadsApi.stats().catch(() => ({})),
        dealsApi.stats().catch(() => ({})),
      ]);
      setMonthlyStat(Array.isArray(monthly) ? monthly : []);
      setBreakdown(bd);
      setLeadStats(leads || {});
      setDealStatsRaw(deals || {});
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

  const productData = (breakdown?.byProduct || []).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 8);
  const partnerData = (breakdown?.byPartner || []).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 10);
  const salespersonData = (breakdown?.bySalesperson || []).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 10);

  // Deal pipeline
  const DEAL_STAGE_ORDER = ['New', 'Proposal', 'Cold', 'Negotiation', 'Closed Lost', 'Closed Won'];
  const PIPELINE_COLORS: Record<string, string> = {
    New: '#06b6d4', Proposal: '#a855f7', Cold: '#3b82f6',
    Negotiation: '#f97316', 'Closed Lost': '#ef4444', 'Closed Won': '#10b981',
  };
  const pipelineData = DEAL_STAGE_ORDER
    .filter(s => dealStatsRaw[s])
    .map(s => ({
      stage: s.replace('Closed ', 'C.').replace('Needs Analysis', 'Analysis'),
      fullStage: s,
      count: dealStatsRaw[s]?.count ?? 0,
      value: dealStatsRaw[s]?.value ?? 0,
      fill: PIPELINE_COLORS[s] || '#94a3b8',
    }));

  // Lead conversion
  const leadValues = Object.values(leadStats) as number[];
  const totalLeads = leadValues.reduce((a, b) => a + b, 0);
  const wonLeads = leadStats['Closed Won'] ?? 0;
  const lostLeads = leadStats['Closed Lost'] ?? 0;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  // Chart constants
  const gridColor = 'var(--chart-grid, #f1f5f9)';
  const axisStyle = { fontSize: 11, fill: 'var(--chart-axis, #94a3b8)' };

  // Product bar colors (gradient from brand to cyan)
  const PRODUCT_COLORS = ['#6366f1', '#7c3aed', '#8b5cf6', '#06b6d4', '#0891b2', '#0d9488', '#059669', '#f59e0b'];

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-sm text-slate-500 dark:text-zinc-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Reports</h1>
        <p className="text-sm mt-1 text-slate-500 dark:text-zinc-400">Sales analytics and performance insights</p>
      </div>

      {/* 2x3 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Sales by Product -- Horizontal Bar */}
        <Card glass padding="md" className="animate-fade-in-up stagger-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-50 dark:bg-brand-900/20">
              <BarChart3 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Sales by Product</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Revenue by product category</p>
            </div>
          </div>

          {productData.length === 0 ? (
            <div className="h-48 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
              <p className="text-sm text-slate-400 dark:text-zinc-500">No product data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(productData.length * 40, 160)}>
              <BarChart data={productData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false}
                  tickFormatter={(v: number) => v >= 100000 ? `${(v / 100000).toFixed(0)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                <YAxis type="category" dataKey="productName" tick={{ fontSize: 10, fill: 'var(--chart-axis-label, #64748b)' }}
                  tickLine={false} axisLine={false} width={80} />
                <Tooltip content={({ active, payload }: any) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="px-3 py-2 rounded-xl shadow-lg text-xs border bg-white border-slate-200 text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                      <p className="font-semibold">{d.productName}</p>
                      <p>{formatINR(d.totalAmount)} &middot; {d.count} sale{d.count !== 1 ? 's' : ''}</p>
                    </div>
                  );
                }} />
                <Bar dataKey="totalAmount" radius={[0, 6, 6, 0]} maxBarSize={24}>
                  {productData.map((_, i) => <Cell key={i} fill={PRODUCT_COLORS[i % PRODUCT_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* 2. Sales by Partner -- Table */}
        <Card glass padding="md" className="animate-fade-in-up stagger-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/20">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Sales by Partner</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Top 10 partners by revenue</p>
            </div>
          </div>

          {partnerData.length === 0 ? (
            <div className="h-48 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
              <p className="text-sm text-slate-400 dark:text-zinc-500">No partner data</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[320px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800">
                    <th className="pb-2 text-left text-xs font-semibold text-slate-400 dark:text-zinc-500">#</th>
                    <th className="pb-2 text-left text-xs font-semibold text-slate-400 dark:text-zinc-500">Partner</th>
                    <th className="pb-2 text-right text-xs font-semibold text-slate-400 dark:text-zinc-500">Amount</th>
                    <th className="pb-2 text-right text-xs font-semibold text-slate-400 dark:text-zinc-500">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {partnerData.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-0 border-slate-50 dark:border-zinc-800/50">
                      <td className="py-2 text-xs text-slate-400 dark:text-zinc-500">{idx + 1}</td>
                      <td className="py-2 font-medium truncate max-w-[200px] text-slate-700 dark:text-zinc-300">
                        {item.partnerName || 'Unknown'}
                      </td>
                      <td className="py-2 text-right font-semibold text-slate-900 dark:text-white">
                        {formatINR(item.totalAmount)}
                      </td>
                      <td className="py-2 text-right text-slate-500 dark:text-zinc-400">{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* 3. Sales Leaderboard */}
        <Card glass padding="md" className="animate-fade-in-up stagger-3">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-900/20">
              <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Sales Leaderboard</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Top performers by revenue</p>
            </div>
          </div>

          {salespersonData.length === 0 ? (
            <div className="h-48 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
              <p className="text-sm text-slate-400 dark:text-zinc-500">No salesperson data</p>
            </div>
          ) : (
            <div className="space-y-2">
              {salespersonData.map((item, idx) => {
                const medalColors = ['text-amber-500', 'text-slate-400', 'text-orange-600'];
                return (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50">
                    <div className={cx(
                      'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
                      idx < 3 ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-slate-100 dark:bg-zinc-800'
                    )}>
                      <span className={idx < 3 ? medalColors[idx] : 'text-slate-400 dark:text-zinc-500'}>{idx + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate text-slate-900 dark:text-white">
                        {item.salespersonName || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500">{item.count} sale{item.count !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0 text-brand-600 dark:text-brand-400">{formatINR(item.totalAmount)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* 4. Pipeline Summary -- Bar Chart */}
        <Card glass padding="md" className="animate-fade-in-up stagger-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 dark:bg-purple-900/20">
              <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Kanban Summary</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Deal stages overview</p>
            </div>
          </div>

          {pipelineData.length === 0 ? (
            <div className="h-48 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
              <p className="text-sm text-slate-400 dark:text-zinc-500">No pipeline data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={pipelineData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 9, fill: 'var(--chart-axis, #94a3b8)' }} tickLine={false} axisLine={false} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false}
                  tickFormatter={(v: number) => v >= 100000 ? `${(v / 100000).toFixed(0)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                <Tooltip content={({ active, payload }: any) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="px-3 py-2 rounded-xl shadow-lg text-xs border bg-white border-slate-200 text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                      <p className="font-semibold">{d.fullStage}</p>
                      <p>{d.count} deal{d.count !== 1 ? 's' : ''} &middot; {formatINR(d.value)}</p>
                    </div>
                  );
                }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {pipelineData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* 5. Lead Conversion -- Ring */}
        <Card glass padding="md" className="animate-fade-in-up stagger-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20">
              <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Lead Conversion</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Leads converted to Won</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" className="stroke-slate-100 dark:stroke-[#1a2535]" strokeWidth="12" />
                <circle cx="80" cy="80" r="70" fill="none" className="stroke-emerald-600 dark:stroke-emerald-500" strokeWidth="12"
                  strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - conversionRate / 100)}`} style={{ transition: 'all 1s' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{conversionRate}%</span>
                <span className="text-xs text-slate-400 dark:text-zinc-500">Conversion</span>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900 dark:text-white">{totalLeads}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Total Leads</p>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-zinc-800" />
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{wonLeads}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Won</p>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-zinc-800" />
              <div className="text-center">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{lostLeads}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Lost</p>
              </div>
            </div>
          </div>
        </Card>

        {/* 6. Monthly Revenue -- Area Chart */}
        <Card glass padding="md" className="animate-fade-in-up stagger-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-50 dark:bg-cyan-900/20">
              <TrendingUp className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Monthly Revenue</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Revenue trend over time</p>
            </div>
          </div>

          {monthlyStat.length === 0 ? (
            <div className="h-56 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
              <p className="text-sm text-slate-400 dark:text-zinc-500">No monthly data</p>
            </div>
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyStat} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rptGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="month" tick={axisStyle} tickLine={false} axisLine={false}
                    tickFormatter={(v: string) => v.length > 3 ? v.slice(0, 3) : v} />
                  <YAxis tick={axisStyle} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                  <Tooltip content={({ active, payload, label }: any) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="px-3 py-2 rounded-xl shadow-lg text-xs border bg-white border-slate-200 text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                        <p className="font-medium mb-1 text-slate-500 dark:text-zinc-300">{label}</p>
                        <p className="font-semibold" style={{ color: '#06b6d4' }}>Revenue: {formatINR(payload[0].value)}</p>
                      </div>
                    );
                  }} />
                  <Area type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2.5} fill="url(#rptGrad)"
                    dot={{ fill: '#06b6d4', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#06b6d4', stroke: 'var(--chart-dot-ring, #fff)', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <div>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">Total Revenue</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatINR(monthlyStat.reduce((sum, m) => sum + m.revenue, 0))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 dark:text-zinc-500">Avg Monthly</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatINR(Math.round(monthlyStat.reduce((sum, m) => sum + m.revenue, 0) / (monthlyStat.length || 1)))}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
