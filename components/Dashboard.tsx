import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Activity, MoreHorizontal, ArrowUpRight, ArrowDownRight, Target, CheckCircle2, Clock, Calendar, Mail, Phone, Briefcase, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { dashboardApi, leadsApi, tasksApi, dealsApi } from '../services/api';
import { revenueByMonth, leadsBySource, pipelineSummary, topPerformers } from '../data/mockData';
import { Lead, Task, Deal } from '../types';
import { useNavigation } from '../contexts/NavigationContext';

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

const colorMap = {
  brand: { bg: 'bg-brand-50', text: 'text-brand-600', border: 'border-brand-100' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
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

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setActiveTab } = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, leadsData, tasksData] = await Promise.all([
          dashboardApi.getStats(),
          leadsApi.getAll(),
          tasksApi.getAll(),
        ]);
        setStats(statsData);
        setLeads(leadsData as Lead[]);
        setTasks(tasksData as Task[]);
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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to load dashboard</h3>
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
    <div className="p-8 space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiStats.map((stat, index) => {
          const colors = colorMap[stat.color as keyof typeof colorMap];
          return (
            <button
              key={index}
              onClick={() => setActiveTab(stat.navigateTo)}
              className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 hover:shadow-lg hover:border-brand-200 transition-all duration-300 text-left cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-slate-500 font-medium text-sm font-display uppercase tracking-wide">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1 font-brand group-hover:text-brand-600 transition-colors">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${colors.bg} ${colors.text} group-hover:scale-110 transition-transform`}>
                  <stat.icon size={24} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold flex items-center ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {Math.abs(stat.change)}%
                </span>
                <span className="text-slate-400 text-sm">vs last month</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-soft border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">Revenue Overview</h3>
              <p className="text-slate-500 text-sm mt-1">Monthly revenue vs targets for 2024</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-600"></div>
                <span className="text-xs text-slate-500">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span className="text-xs text-slate-500">Target</span>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1e1b4b', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="target" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">Lead Sources</h3>
              <p className="text-slate-500 text-sm mt-1">Distribution this quarter</p>
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
                <span className="text-xs text-slate-600">{source.name}</span>
                <span className="text-xs font-bold text-slate-900 ml-auto">{source.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">Pipeline Summary</h3>
              <p className="text-slate-500 text-sm mt-1">Current deal stages</p>
            </div>
            <button onClick={() => setActiveTab('deals')} className="text-sm text-brand-600 hover:text-brand-700 font-medium">View all</button>
          </div>
          <div className="space-y-4">
            {pipelineSummary.map((stage, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">{stage.stage}</span>
                  <span className="text-sm font-bold text-slate-900">${(stage.value / 1000).toFixed(0)}k</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${(stage.value / 500000) * 100}%`, backgroundColor: stage.color }}></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-slate-500">{stage.count} deals</span>
                  <span className="text-xs text-slate-500">{((stage.value / 2400000) * 100).toFixed(0)}% of total</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 font-display">Recent Activity</h3>
            <button onClick={() => setActiveTab('reports')} className="text-sm text-brand-600 hover:text-brand-700 font-medium">View all</button>
          </div>
          <div className="space-y-4">
            {activities.slice(0, 5).map((activity) => {
              const { icon: Icon, color } = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">{activity.user}</span> {activity.action}{' '}
                      {activity.detail && <span className="font-semibold text-green-600">{activity.detail}</span>}{' '}
                      <span className="text-brand-600">{activity.entity}</span>
                    </p>
                    <span className="text-xs text-slate-400">{activity.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">Top Performers</h3>
              <p className="text-slate-500 text-sm mt-1">This month</p>
            </div>
          </div>
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="relative">
                  <img src={performer.avatar} alt={performer.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] font-bold text-yellow-900">1</div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{performer.name}</p>
                  <p className="text-xs text-slate-500">{performer.deals} deals closed</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">${(performer.revenue / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-green-600">+{performer.change}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Due Today */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-slate-900 font-display">Tasks Due Today</h3>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">{todayTasks.length}</span>
            </div>
            <button onClick={() => setActiveTab('tasks')} className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View all <ChevronRight size={14} />
            </button>
          </div>
          {todayTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 size={40} className="mx-auto text-green-400 mb-3" />
              <p className="text-slate-500">All caught up! No tasks due today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <button className="text-slate-400 hover:text-green-500 transition-colors">
                    <CheckCircle2 size={20} />
                  </button>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{task.title}</p>
                    {task.relatedTo && (
                      <p className="text-xs text-slate-500">{task.relatedTo.type}: {task.relatedTo.name}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    task.priority === 'Urgent' ? 'bg-red-50 text-red-600 border-red-200' :
                    task.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
          {overdueTasks.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">{overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>

        {/* Hot Leads */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-slate-900 font-display">Hot Leads</h3>
              <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs font-semibold rounded-full">{hotLeads.length}</span>
            </div>
            <button onClick={() => setActiveTab('leads')} className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {hotLeads.slice(0, 4).map((lead) => (
              <div key={lead.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                  {lead.firstName[0]}{lead.lastName[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{lead.firstName} {lead.lastName}</p>
                  <p className="text-xs text-slate-500">{lead.company} • {lead.jobTitle}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    lead.status === 'Qualified' ? 'bg-green-50 text-green-600' :
                    lead.status === 'Proposal' ? 'bg-purple-50 text-purple-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {lead.status}
                  </span>
                  {lead.budget && (
                    <p className="text-xs text-slate-500 mt-1">${lead.budget.toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-800 p-6 rounded-2xl text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Quick Actions</h3>
            <p className="text-brand-200 text-sm mt-1">Jump to common tasks</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('leads')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              <Users size={16} /> Add Lead
            </button>
            <button
              onClick={() => setActiveTab('deals')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              <Briefcase size={16} /> Create Deal
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              <Calendar size={16} /> Schedule Meeting
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              <Mail size={16} /> Send Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
