import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Activity, MoreHorizontal, ArrowUpRight, ArrowDownRight, Target, CheckCircle2, Clock, Calendar, Mail, Phone, Briefcase, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { dashboardApi, leadsApi, tasksApi, dealsApi } from '../services/api';
import { revenueByMonth, leadsBySource, pipelineSummary, topPerformers } from '../data/mockData';
import { Lead, Task, Deal } from '../types';
import { useNavigation } from '../contexts/NavigationContext';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardStats {
  totalLeads: number;
  totalDeals: number;
  totalAccounts: number;
  totalContacts: number;
  totalRevenue: number;
  openTasks: number;
  openTickets: number;
  conversionRate: number;
}

const colorMapLight = {
  brand: { bg: 'bg-brand-50', text: 'text-brand-600', border: 'border-brand-100' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
};

const colorMapDark = {
  brand: { bg: 'bg-brand-900/50', text: 'text-brand-400', border: 'border-brand-800' },
  green: { bg: 'bg-green-900/50', text: 'text-green-400', border: 'border-green-800' },
  blue: { bg: 'bg-blue-900/50', text: 'text-blue-400', border: 'border-blue-800' },
  purple: { bg: 'bg-purple-900/50', text: 'text-purple-400', border: 'border-purple-800' },
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'deal_won': return { icon: CheckCircle2, color: 'text-green-500 bg-green-50' };
    case 'new_lead': return { icon: Users, color: 'text-blue-500 bg-blue-50' };
    case 'email_opened': return { icon: Mail, color: 'text-purple-500 bg-purple-50' };
    case 'call_completed': return { icon: Phone, color: 'text-orange-500 bg-orange-50' };
    case 'task_completed': return { icon: CheckCircle2, color: 'text-green-500 bg-green-50' };
    default: return { icon: Activity, color: 'text-slate-500 bg-slate-50' };
  }
};

const activities = [
  { id: 1, type: 'deal_won', user: 'Sarah Jenkins', action: 'closed a deal worth', detail: '$45,000', entity: 'TechFlow Solutions', time: '2 hours ago' },
  { id: 2, type: 'new_lead', user: 'Michael Chen', action: 'added new lead', detail: '', entity: 'DataSync Corp', time: '3 hours ago' },
  { id: 3, type: 'email_opened', user: 'Emily Rodriguez', action: 'email was opened by', detail: '', entity: 'John Smith at Acme', time: '4 hours ago' },
  { id: 4, type: 'call_completed', user: 'Sarah Jenkins', action: 'completed call with', detail: '(15 min)', entity: 'Global Industries', time: '5 hours ago' },
  { id: 5, type: 'task_completed', user: 'Michael Chen', action: 'completed task', detail: '', entity: 'Send proposal to Nexus', time: '6 hours ago' },
];

// Mock dashboard stats for offline/development mode
const MOCK_STATS: DashboardStats = {
  totalLeads: 156,
  totalDeals: 42,
  totalAccounts: 89,
  totalContacts: 324,
  totalRevenue: 2450000,
  openTasks: 18,
  openTickets: 7,
  conversionRate: 28.5,
};

// Mock leads for dashboard
const MOCK_LEADS: Lead[] = [
  {
    id: 'lead-1', firstName: 'John', lastName: 'Smith', company: 'TechFlow Solutions',
    email: 'john.smith@techflow.com', phone: '+1 (555) 123-4567', status: 'Qualified',
    source: 'Website', score: 85, owner: 'Sarah Jenkins', createdAt: '2024-12-10T10:00:00Z',
    lastActive: '2024-12-18T14:30:00Z', avatar: '', notes: '', tags: ['Enterprise'],
    budget: 50000, timeline: 'Q1 2025', industry: 'Technology', jobTitle: 'IT Director',
  },
  {
    id: 'lead-2', firstName: 'Sarah', lastName: 'Davis', company: 'HealthPlus Medical',
    email: 'sarah.davis@healthplus.org', phone: '+1 (555) 456-7890', status: 'Proposal',
    source: 'Referral', score: 90, owner: 'Emily Rodriguez', createdAt: '2024-11-28T08:00:00Z',
    lastActive: '2024-12-18T09:00:00Z', avatar: '', notes: '', tags: ['Healthcare'],
    budget: 75000, timeline: 'Q1 2025', industry: 'Healthcare', jobTitle: 'Procurement Director',
  },
];

// Mock tasks for dashboard
const MOCK_TASKS: Task[] = [
  {
    id: 'task-1', title: 'Follow up with Acme Corp on proposal', description: '',
    type: 'Call', status: 'Not Started', priority: 'High',
    dueDate: new Date().toISOString().split('T')[0], dueTime: '14:00',
    assignedTo: 'Sarah Jenkins', createdBy: 'Sarah Jenkins', createdAt: '2024-12-17T09:00:00Z',
    completedAt: '', relatedTo: { type: 'Deal', id: 'deal-1', name: 'Enterprise Software License' },
  },
  {
    id: 'task-2', title: 'Prepare demo for TechStart', description: '',
    type: 'Demo', status: 'In Progress', priority: 'Urgent',
    dueDate: new Date().toISOString().split('T')[0], dueTime: '10:00',
    assignedTo: 'Michael Chen', createdBy: 'Michael Chen', createdAt: '2024-12-16T14:00:00Z',
    completedAt: '', relatedTo: { type: 'Deal', id: 'deal-2', name: 'CRM Implementation' },
  },
];

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setActiveTab } = useNavigation();
  const { theme } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let statsData: DashboardStats;
        let leadsData: Lead[];
        let tasksData: Task[];

        try {
          const [fetchedStats, fetchedLeads, fetchedTasks] = await Promise.all([
            dashboardApi.getStats(),
            leadsApi.getAll(),
            tasksApi.getAll(),
          ]);
          statsData = fetchedStats;
          leadsData = fetchedLeads as Lead[];
          tasksData = fetchedTasks as Task[];
        } catch {
          // API unavailable, use mock data
          console.log('API unavailable, using mock dashboard data');
          statsData = MOCK_STATS;
          leadsData = MOCK_LEADS;
          tasksData = MOCK_TASKS;
        }

        setStats(statsData);
        setLeads(leadsData);
        setTasks(tasksData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.dueDate === today && t.status !== 'Completed');
  const overdueTasks = tasks.filter(t => t.dueDate < today && t.status !== 'Completed');
  const hotLeads = leads.filter(l => l.status === 'Qualified' || l.status === 'Proposal');

  const kpiStats = [
    { label: 'Total Revenue', value: stats ? `$${(stats.totalRevenue / 1000000).toFixed(1)}M` : '-', change: 12.5, trend: 'up' as const, icon: DollarSign, color: 'brand', navigateTo: 'reports' as const },
    { label: 'Active Deals', value: stats?.totalDeals?.toString() || '-', change: 8.2, trend: 'up' as const, icon: Briefcase, color: 'green', navigateTo: 'deals' as const },
    { label: 'New Leads', value: stats?.totalLeads?.toString() || '-', change: 15.3, trend: 'up' as const, icon: Users, color: 'blue', navigateTo: 'leads' as const },
    { label: 'Win Rate', value: stats ? `${stats.conversionRate}%` : '-', change: 4.2, trend: 'up' as const, icon: Target, color: 'purple', navigateTo: 'reports' as const },
  ];

  const isDark = theme === 'dark';

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className={isDark ? 'text-zinc-500' : 'text-slate-500'}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className={`rounded-xl p-6 text-center ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-red-300' : 'text-red-800'}`}>Failed to load dashboard</h3>
          <p className={isDark ? 'text-red-400' : 'text-red-600'}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
      {/* KPI Cards with Premium Animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiStats.map((stat, index) => {
          const colorMap = isDark ? colorMapDark : colorMapLight;
          const colors = colorMap[stat.color as keyof typeof colorMap];
          return (
            <button
              key={index}
              onClick={() => setActiveTab(stat.navigateTo)}
              className={`relative p-6 rounded-2xl shadow-soft border transition-all duration-300 text-left cursor-pointer group hover-lift ripple overflow-hidden animate-fade-in-up stagger-${index + 1} ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 hover:border-brand-500'
                  : 'bg-white border-slate-100 hover:border-brand-300'
              }`}
              style={{ opacity: 0 }}
            >
              {/* Animated gradient background on hover */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                isDark
                  ? 'bg-gradient-to-br from-brand-900/20 via-transparent to-purple-900/20'
                  : 'bg-gradient-to-br from-brand-50/50 via-transparent to-purple-50/50'
              }`} />

              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 animate-shimmer" />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className={`font-medium text-sm font-display uppercase tracking-wide ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                      {stat.label}
                    </p>
                    <h3 className={`text-3xl font-bold mt-1 font-brand group-hover:text-brand-600 transition-colors animate-count-up ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                      {stat.value}
                    </h3>
                  </div>
                  <div className={`p-3 rounded-xl ${colors.bg} ${colors.text} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 icon-bounce`}>
                    <stat.icon size={24} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold flex items-center gap-0.5 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    <span className="group-hover:animate-bounce">
                      {stat.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </span>
                    {Math.abs(stat.change)}%
                  </span>
                  <span className={`text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>vs last month</span>
                </div>
              </div>

              {/* Glowing border effect on hover */}
              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                isDark ? 'shadow-[inset_0_0_20px_rgba(99,102,241,0.15)]' : 'shadow-[inset_0_0_20px_rgba(79,70,229,0.1)]'
              }`} />
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Revenue Chart */}
        <div className={`md:col-span-2 p-4 md:p-6 rounded-2xl shadow-soft border hover-lift transition-all duration-300 animate-fade-in-up stagger-5 ${
          isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-100 hover:border-slate-200'
        }`} style={{ opacity: 0 }}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className={`text-lg font-bold font-display ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Revenue Overview</h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Monthly revenue vs targets for 2024</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-600"></div>
                <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Target</span>
              </div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonth}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#f1f5f9'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDark ? '#71717a' : '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#71717a' : '#94a3b8', fontSize: 12}} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#18181b' : '#1e1b4b', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="target" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources */}
        <div className={`p-6 rounded-2xl shadow-soft border hover-lift transition-all duration-300 animate-fade-in-up stagger-6 ${
          isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-100 hover:border-slate-200'
        }`} style={{ opacity: 0 }}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className={`text-lg font-bold font-display ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Lead Sources</h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Distribution this quarter</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={leadsBySource} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {leadsBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {leadsBySource.map((source, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: source.color }}></div>
                <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{source.name}</span>
                <span className={`text-xs font-bold ml-auto ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{source.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Pipeline Summary */}
        <div className={`p-6 rounded-2xl shadow-soft border hover-lift transition-all duration-300 animate-fade-in-up stagger-7 ${
          isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-100 hover:border-slate-200'
        }`} style={{ opacity: 0 }}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className={`text-lg font-bold font-display ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Pipeline Summary</h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Current deal stages</p>
            </div>
            <button onClick={() => setActiveTab('deals')} className="text-sm text-brand-600 hover:text-brand-700 font-medium animated-underline">View all</button>
          </div>
          <div className="space-y-4">
            {pipelineSummary.map((stage, index) => (
              <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{stage.stage}</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>${(stage.value / 1000).toFixed(0)}k</span>
                </div>
                <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                  <div className="h-2 rounded-full animate-progress" style={{ width: `${Math.min((stage.value / Math.max(...pipelineSummary.map(s => s.value))) * 100, 100)}%`, backgroundColor: stage.color }}></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{stage.count} deals</span>
                  <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{((stage.value / 2400000) * 100).toFixed(0)}% of total</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`p-6 rounded-2xl shadow-soft border hover-lift transition-all duration-300 animate-fade-in-up stagger-8 ${
          isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-100 hover:border-slate-200'
        }`} style={{ opacity: 0 }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-lg font-bold font-display ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Recent Activity</h3>
            <button onClick={() => setActiveTab('reports')} className="text-sm text-brand-600 hover:text-brand-700 font-medium animated-underline">View all</button>
          </div>
          <div className="space-y-4">
            {activities.slice(0, 5).map((activity, index) => {
              const { icon: Icon, color } = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex gap-3 animate-slide-in-left" style={{ animationDelay: `${index * 0.08}s`, opacity: 0 }}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-110 ${isDark ? color.replace('bg-', 'bg-opacity-20 bg-') : color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
                      <span className={`font-semibold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{activity.user}</span> {activity.action}{' '}
                      {activity.detail && <span className="font-semibold text-green-500">{activity.detail}</span>}{' '}
                      <span className="text-brand-500">{activity.entity}</span>
                    </p>
                    <span className={`text-xs ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>{activity.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performers */}
        <div className={`p-6 rounded-2xl shadow-soft border hover-lift transition-all duration-300 animate-fade-in-up ${
          isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-100 hover:border-slate-200'
        }`} style={{ opacity: 0, animationDelay: '0.45s' }}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className={`text-lg font-bold font-display ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Top Performers</h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>This month</p>
            </div>
          </div>
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center gap-4 animate-slide-in-right transition-all hover:translate-x-1" style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}>
                <div className="relative group">
                  <img src={performer.avatar} alt={performer.name} className={`w-10 h-10 rounded-full object-cover border-2 shadow-sm transition-transform group-hover:scale-110 ${isDark ? 'border-zinc-800' : 'border-white'}`} />
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] font-bold text-yellow-900 badge-pulse">1</div>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{performer.name}</p>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{performer.deals} deals closed</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>${(performer.revenue / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-green-500">+{performer.change}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Tasks Due Today */}
        <div className={`p-6 rounded-2xl shadow-soft border hover-lift transition-all duration-300 animate-fade-in-up ${
          isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-100 hover:border-slate-200'
        }`} style={{ opacity: 0, animationDelay: '0.5s' }}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h3 className={`text-lg font-bold font-display ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Tasks Due Today</h3>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>{todayTasks.length}</span>
            </div>
            <button onClick={() => setActiveTab('tasks')} className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View all <ChevronRight size={14} />
            </button>
          </div>
          {todayTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 size={40} className="mx-auto text-green-400 mb-3" />
              <p className={isDark ? 'text-zinc-500' : 'text-slate-500'}>All caught up! No tasks due today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.slice(0, 4).map((task) => (
                <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-50'
                }`}>
                  <button className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-green-400' : 'text-slate-400 hover:text-green-500'}`}>
                    <CheckCircle2 size={20} />
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{task.title}</p>
                    {task.relatedTo && (
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{task.relatedTo.type}: {task.relatedTo.name}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    task.priority === 'Urgent'
                      ? (isDark ? 'bg-red-900/50 text-red-400 border-red-800' : 'bg-red-50 text-red-600 border-red-200')
                      : task.priority === 'High'
                        ? (isDark ? 'bg-orange-900/50 text-orange-400 border-orange-800' : 'bg-orange-50 text-orange-600 border-orange-200')
                        : (isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-slate-50 text-slate-600 border-slate-200')
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
          {overdueTasks.length > 0 && (
            <div className={`mt-4 p-3 rounded-lg border ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-100'}`}>
              <div className={`flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                <AlertCircle size={16} />
                <span className="text-sm font-medium">{overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>

        {/* Hot Leads */}
        <div className={`p-6 rounded-2xl shadow-soft border hover-lift transition-all duration-300 animate-fade-in-up ${
          isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-100 hover:border-slate-200'
        }`} style={{ opacity: 0, animationDelay: '0.55s' }}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h3 className={`text-lg font-bold font-display ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Hot Leads</h3>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${isDark ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>{hotLeads.length}</span>
            </div>
            <button onClick={() => setActiveTab('leads')} className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {hotLeads.slice(0, 4).map((lead) => (
              <div key={lead.id} className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-50'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  isDark ? 'bg-brand-900/50 text-brand-400' : 'bg-brand-100 text-brand-600'
                }`}>
                  {lead.firstName[0]}{lead.lastName[0]}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{lead.firstName} {lead.lastName}</p>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{lead.company} • {lead.jobTitle}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    lead.status === 'Qualified'
                      ? (isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-50 text-green-600')
                      : lead.status === 'Proposal'
                        ? (isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-50 text-purple-600')
                        : (isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-blue-600')
                  }`}>
                    {lead.status}
                  </span>
                  {lead.budget && (
                    <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>${lead.budget.toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Bar - Premium Animated */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 p-4 lg:p-6 rounded-2xl text-white animate-fade-in-up animate-gradient" style={{ opacity: 0, animationDelay: '0.6s', backgroundSize: '200% 200%' }}>
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-64 h-64 -top-32 -left-32 bg-white/5 rounded-full blur-3xl animate-float"></div>
          <div className="absolute w-64 h-64 -bottom-32 -right-32 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold neon-text">Quick Actions</h3>
            <p className="text-brand-200 text-sm mt-1">Jump to common tasks</p>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2 lg:gap-3">
            <button
              onClick={() => setActiveTab('leads')}
              className="flex items-center justify-center gap-2 px-3 lg:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg ripple"
            >
              <Users size={16} className="icon-bounce" /> <span className="hidden sm:inline">Add</span> Lead
            </button>
            <button
              onClick={() => setActiveTab('deals')}
              className="flex items-center justify-center gap-2 px-3 lg:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg ripple"
            >
              <Briefcase size={16} className="icon-bounce" /> <span className="hidden sm:inline">Create</span> Deal
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className="flex items-center justify-center gap-2 px-3 lg:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg ripple"
            >
              <Calendar size={16} className="icon-bounce" /> <span className="hidden sm:inline">Schedule</span> Meeting
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className="flex items-center justify-center gap-2 px-3 lg:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg ripple"
            >
              <Mail size={16} className="icon-bounce" /> <span className="hidden sm:inline">Send</span> Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
