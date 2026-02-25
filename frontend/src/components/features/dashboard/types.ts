import { User, ViewAccess, NavigationItem } from '@/types';

export interface WidgetProps {
  user: User | null;
  currentView: ViewAccess;
  navigate: (tab: NavigationItem) => void;
  onDetailClick?: () => void;
}

export interface DashboardData {
  totalSales: number;
  totalCount: number;
  monthlyRevenue: number;
  totalPartners: number;
  pendingPartners: number;
  activeLeads: number;
  pendingPayments: number;
}

export interface GrowthData {
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

export interface MonthlyStat {
  month: string;
  revenue: number;
  count: number;
}

export interface TaskStatsData {
  pending: number;
  in_progress: number;
  completed: number;
}

export interface BreakdownItem {
  totalAmount: number;
  count: number;
  productName?: string;
  partnerName?: string;
  salespersonName?: string;
}

export interface BreakdownData {
  byProduct: BreakdownItem[];
  byPartner: BreakdownItem[];
  bySalesperson: BreakdownItem[];
}
