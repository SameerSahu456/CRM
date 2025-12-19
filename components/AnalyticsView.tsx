import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const data = [
  { name: 'Jan', revenue: 4000, leads: 2400 },
  { name: 'Feb', revenue: 3000, leads: 1398 },
  { name: 'Mar', revenue: 2000, leads: 9800 },
  { name: 'Apr', revenue: 2780, leads: 3908 },
  { name: 'May', revenue: 1890, leads: 4800 },
  { name: 'Jun', revenue: 2390, leads: 3800 },
  { name: 'Jul', revenue: 3490, leads: 4300 },
];

const sourceData = [
  { name: 'Direct', value: 400 },
  { name: 'Social', value: 300 },
  { name: 'Referral', value: 300 },
  { name: 'Organic', value: 200 },
];

export const AnalyticsView: React.FC = () => {
  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">

        {/* Revenue vs Leads */}
        <div className="bg-white p-4 lg:p-8 rounded-2xl shadow-soft border border-slate-200">
          <h3 className="text-lg lg:text-xl font-bold text-slate-900 font-display mb-4 lg:mb-6">Revenue vs Lead Volume</h3>
          <div className="h-64 lg:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} dy={10} />
                <YAxis yAxisId="left" orientation="left" stroke="#4f46e5" axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" axisLine={false} tickLine={false} />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{ backgroundColor: '#1e1b4b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="leads" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Trend */}
        <div className="bg-white p-4 lg:p-8 rounded-2xl shadow-soft border border-slate-200">
          <h3 className="text-lg lg:text-xl font-bold text-slate-900 font-display mb-4 lg:mb-6">Monthly Growth Trend</h3>
          <div className="h-64 lg:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip contentStyle={{ backgroundColor: '#1e1b4b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff'}} />
                <Line type="monotone" dataKey="leads" stroke="#e11d48" strokeWidth={3} dot={{r: 4, fill: '#e11d48', strokeWidth: 2, stroke: '#fff'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

       {/* Bottom Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        {['Avg Deal Size', 'Sales Cycle Length', 'Win Rate'].map((metric, i) => (
          <div key={i} className="bg-gradient-to-br from-brand-600 to-brand-800 p-4 lg:p-6 rounded-2xl shadow-glow text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
            <p className="text-brand-100 font-medium text-xs lg:text-sm font-display uppercase tracking-wide relative z-10">{metric}</p>
            <h4 className="text-2xl lg:text-3xl font-brand font-bold mt-2 relative z-10">
              {i === 0 ? '$12.4k' : i === 1 ? '18 Days' : '34%'}
            </h4>
            <div className="mt-3 lg:mt-4 flex items-center text-xs lg:text-sm font-medium text-brand-200 relative z-10">
              <span className="bg-white/20 px-2 py-0.5 rounded text-white mr-2">+{(i + 2) * 2.3}%</span>
              vs previous period
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};