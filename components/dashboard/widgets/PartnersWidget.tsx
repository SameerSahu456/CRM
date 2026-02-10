import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps, DashboardData, BreakdownData } from '../types';
import { dashboardApi } from '../../../services/api';
import { formatCompact } from '../../../utils/dashboard';

export const PartnersWidget: React.FC<WidgetProps> = ({ isDark, navigate }) => {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [breakdownData, setBreakdownData] = useState<BreakdownData>({ byProduct: [], byPartner: [], bySalesperson: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const all = await dashboardApi.getAll();
        setStats(all.stats);
        setBreakdownData(all.breakdown || { byProduct: [], byPartner: [], bySalesperson: [] });
      } catch {
        // Best-effort
      }
    };
    fetchData();
  }, []);

  const sortedPartners = [...breakdownData.byPartner].sort((a, b) => b.totalAmount - a.totalAmount);
  const totalPartnerDeals = sortedPartners.reduce((s, p) => s + p.count, 0);
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const thClass = `text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`;
  const tdClass = `text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`;
  const tdBold = `text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`;
  const rowBorder = isDark ? 'border-zinc-800/50' : 'border-slate-100';

  return (
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
  );
};
