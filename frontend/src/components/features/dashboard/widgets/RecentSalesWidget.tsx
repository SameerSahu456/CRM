import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { AnalyticsCard } from '../AnalyticsCard';
import { WidgetProps, GrowthData } from '@/types';
import { useDashboardData } from '@/contexts/DashboardDataContext';
import { formatCompact } from '@/utils/dashboard';

export const RecentSalesWidget: React.FC<WidgetProps> = ({ navigate, onDetailClick }) => {
  const { data: all } = useDashboardData();
  const growth: GrowthData | null = all?.growth ?? null;

  return (
    <AnalyticsCard
      icon={<ShoppingCart className="w-4 h-4" />}
      iconBg="bg-cyan-50 dark:bg-cyan-900/30"
      iconColor="text-cyan-600 dark:text-cyan-400"
      title="Recent Sales"
      titleColor="text-cyan-700 dark:text-cyan-400"
      subtitle="Latest Transactions"
      onClick={() => onDetailClick?.()}
    >
      {!growth?.recentSales?.length ? (
        <div className="h-32 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/50">
          <p className="text-xs text-slate-400 dark:text-zinc-500">No recent sales</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {growth.recentSales.slice(0, 8).map(sale => (
            <div key={sale.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium truncate max-w-[120px] text-slate-900 dark:text-white">
                  {sale.customerName || sale.partnerName || 'N/A'}
                </p>
                <p className="text-xs font-bold flex-shrink-0 text-slate-900 dark:text-white">
                  {formatCompact(sale.amount)}
                </p>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                  {sale.saleDate} {sale.salespersonName ? `· ${sale.salespersonName}` : ''}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                  sale.paymentStatus === 'paid'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : sale.paymentStatus === 'overdue'
                      ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
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
