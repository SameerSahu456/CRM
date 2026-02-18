import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps, GrowthData } from '@/types';
import { dashboardApi } from '@/services/api';
import { formatCompact } from '@/utils/dashboard';

export const RecentSalesWidget: React.FC<WidgetProps> = ({ isDark, navigate, onDetailClick }) => {
  const [growth, setGrowth] = useState<GrowthData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const all = await dashboardApi.getAll();
        setGrowth(all.growth);
      } catch {
        // Best-effort
      }
    };
    fetchData();
  }, []);

  return (
    <AnalyticsCard
      icon={<ShoppingCart className="w-4 h-4" />}
      iconBg={isDark ? 'bg-cyan-900/30' : 'bg-cyan-50'}
      iconColor={isDark ? 'text-cyan-400' : 'text-cyan-600'}
      title="Recent Sales"
      titleColor={isDark ? 'text-cyan-400' : 'text-cyan-700'}
      subtitle="Latest Transactions"
      isDark={isDark}
      onClick={() => onDetailClick?.()}
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
                  {sale.saleDate} {sale.salespersonName ? `· ${sale.salespersonName}` : ''}
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
  );
};
