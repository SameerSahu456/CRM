import React from 'react';
import {
  Users, Calendar, Building2, Layers, TrendingUp, Package,
  Target, CheckSquare, Award, ShoppingCart, BarChart3
} from 'lucide-react';
import { WidgetMetadata, DashboardPreferences } from '../types';

// Widget components will be imported as we create them
// import { SalesTeamWidget } from '../components/dashboard/widgets/SalesTeamWidget';
// ... etc

export const WIDGET_REGISTRY: Record<string, WidgetMetadata> = {
  'sales-team': {
    id: 'sales-team',
    label: 'Sales Team',
    description: 'Performance tracker for sales team',
    category: 'postsales',
    icon: <Users className="w-4 h-4" />,
    requiredView: 'postsales',
    defaultVisible: true,
    defaultOrder: 1,
    component: React.lazy(() => import('../components/dashboard/widgets/SalesTeamWidget').then(m => ({ default: m.SalesTeamWidget }))),
  },
  'monthly': {
    id: 'monthly',
    label: 'Monthly Revenue',
    description: 'Last 6 months revenue trend',
    category: 'postsales',
    icon: <Calendar className="w-4 h-4" />,
    requiredView: 'postsales',
    defaultVisible: true,
    defaultOrder: 2,
    component: React.lazy(() => import('../components/dashboard/widgets/MonthlyWidget').then(m => ({ default: m.MonthlyWidget }))),
  },
  'partners': {
    id: 'partners',
    label: 'Partners',
    description: 'Partner statistics and sales',
    category: 'postsales',
    icon: <Building2 className="w-4 h-4" />,
    requiredView: 'postsales',
    defaultVisible: true,
    defaultOrder: 3,
    component: React.lazy(() => import('../components/dashboard/widgets/PartnersWidget').then(m => ({ default: m.PartnersWidget }))),
  },
  'pipeline': {
    id: 'pipeline',
    label: 'Deal Pipeline',
    description: 'Stage distribution of deals',
    category: 'presales',
    icon: <Layers className="w-4 h-4" />,
    requiredView: 'presales',
    defaultVisible: true,
    defaultOrder: 4,
    component: React.lazy(() => import('../components/dashboard/widgets/PipelineWidget').then(m => ({ default: m.PipelineWidget }))),
  },
  'growth': {
    id: 'growth',
    label: 'Growth Metrics',
    description: 'Performance and growth indicators',
    category: 'postsales',
    icon: <TrendingUp className="w-4 h-4" />,
    requiredView: 'postsales',
    defaultVisible: true,
    defaultOrder: 5,
    component: React.lazy(() => import('../components/dashboard/widgets/GrowthWidget').then(m => ({ default: m.GrowthWidget }))),
  },
  'products': {
    id: 'products',
    label: 'Products',
    description: 'Portfolio performance by product',
    category: 'postsales',
    icon: <Package className="w-4 h-4" />,
    requiredView: 'postsales',
    defaultVisible: true,
    defaultOrder: 6,
    component: React.lazy(() => import('../components/dashboard/widgets/ProductsWidget').then(m => ({ default: m.ProductsWidget }))),
  },
  'leads': {
    id: 'leads',
    label: 'Leads',
    description: 'Lead funnel analysis',
    category: 'presales',
    icon: <Target className="w-4 h-4" />,
    requiredView: 'presales',
    defaultVisible: true,
    defaultOrder: 7,
    component: React.lazy(() => import('../components/dashboard/widgets/LeadsWidget').then(m => ({ default: m.LeadsWidget }))),
  },
  'tasks': {
    id: 'tasks',
    label: 'Tasks',
    description: 'Task status overview',
    category: 'both',
    icon: <CheckSquare className="w-4 h-4" />,
    requiredView: 'both',
    defaultVisible: true,
    defaultOrder: 8,
    component: React.lazy(() => import('../components/dashboard/widgets/TasksWidget').then(m => ({ default: m.TasksWidget }))),
  },
  'top-partners': {
    id: 'top-partners',
    label: 'Top Partners',
    description: 'Revenue rankings by partner',
    category: 'postsales',
    icon: <Award className="w-4 h-4" />,
    requiredView: 'postsales',
    defaultVisible: true,
    defaultOrder: 9,
    component: React.lazy(() => import('../components/dashboard/widgets/TopPartnersWidget').then(m => ({ default: m.TopPartnersWidget }))),
  },
  'recent-sales': {
    id: 'recent-sales',
    label: 'Recent Sales',
    description: 'Latest transactions',
    category: 'postsales',
    icon: <ShoppingCart className="w-4 h-4" />,
    requiredView: 'postsales',
    defaultVisible: true,
    defaultOrder: 10,
    component: React.lazy(() => import('../components/dashboard/widgets/RecentSalesWidget').then(m => ({ default: m.RecentSalesWidget }))),
  },
  'revenue-trend': {
    id: 'revenue-trend',
    label: 'Revenue Trend',
    description: 'Monthly revenue chart',
    category: 'analytics',
    icon: <BarChart3 className="w-4 h-4" />,
    requiredView: 'postsales',
    defaultVisible: true,
    defaultOrder: 11,
    component: React.lazy(() => import('../components/dashboard/widgets/RevenueTrendWidget').then(m => ({ default: m.RevenueTrendWidget }))),
  },
  'pipeline-chart': {
    id: 'pipeline-chart',
    label: 'Pipeline Chart',
    description: 'Deal pipeline visualization',
    category: 'analytics',
    icon: <Layers className="w-4 h-4" />,
    requiredView: 'presales',
    defaultVisible: true,
    defaultOrder: 12,
    component: React.lazy(() => import('../components/dashboard/widgets/PipelineChartWidget').then(m => ({ default: m.PipelineChartWidget }))),
  },
  'leads-distribution': {
    id: 'leads-distribution',
    label: 'Leads Distribution',
    description: 'Lead stage distribution chart',
    category: 'analytics',
    icon: <Target className="w-4 h-4" />,
    requiredView: 'presales',
    defaultVisible: true,
    defaultOrder: 13,
    component: React.lazy(() => import('../components/dashboard/widgets/LeadsDistributionWidget').then(m => ({ default: m.LeadsDistributionWidget }))),
  },
};

export const getDefaultPreferences = (): DashboardPreferences => ({
  widgets: Object.values(WIDGET_REGISTRY).map(w => ({
    id: w.id,
    visible: w.defaultVisible,
    order: w.defaultOrder,
  })),
  lastModified: new Date().toISOString(),
});

export const getWidgetsByCategory = (category: string) => {
  return Object.values(WIDGET_REGISTRY).filter(w => w.category === category);
};
