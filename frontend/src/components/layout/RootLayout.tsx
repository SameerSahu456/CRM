import React, { useState, Suspense, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NavigationProvider, useNavigation } from '@/contexts/NavigationContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { pageTitles } from '@/utils/navigation';
import { NavigationItem } from '@/types';
import { lazyWithRetry } from '@/utils/lazyWithRetry';

// Lazy load all page components
const Dashboard = lazyWithRetry(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const SalesEntryPage = lazyWithRetry(() => import('@/pages/SalesEntryPage').then(m => ({ default: m.SalesEntryPage })));
const CRMPage = lazyWithRetry(() => import('@/pages/CRMPage').then(m => ({ default: m.CRMPage })));
const AdminPage = lazyWithRetry(() => import('@/pages/AdminPage').then(m => ({ default: m.AdminPage })));
const SettingsPage = lazyWithRetry(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AccountsPage = lazyWithRetry(() => import('@/pages/AccountsPage').then(m => ({ default: m.AccountsPage })));
const ContactsPage = lazyWithRetry(() => import('@/pages/ContactsPage').then(m => ({ default: m.ContactsPage })));
const DealsPage = lazyWithRetry(() => import('@/pages/DealsPage').then(m => ({ default: m.DealsPage })));
const ReportsPage = lazyWithRetry(() => import('@/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const InventoryPage = lazyWithRetry(() => import('@/pages/InventoryPage').then(m => ({ default: m.InventoryPage })));
const CollectionsPage = lazyWithRetry(() => import('@/pages/CollectionsPage').then(m => ({ default: m.CollectionsPage })));
const ActivityLogPage = lazyWithRetry(() => import('@/pages/ActivityLogPage').then(m => ({ default: m.ActivityLogPage })));
const TasksPage = lazyWithRetry(() => import('@/pages/TasksPage').then(m => ({ default: m.TasksPage })));
const CalendarPage = lazyWithRetry(() => import('@/pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const MeetingsPage = lazyWithRetry(() => import('@/pages/MeetingsPage').then(m => ({ default: m.MeetingsPage })));

const PAGE_COMPONENTS: Record<NavigationItem, React.LazyExoticComponent<React.ComponentType>> = {
  'dashboard': Dashboard,
  'sales-entry': SalesEntryPage,
  'leads': CRMPage,
  'collections': CollectionsPage,
  'accounts': AccountsPage,
  'contacts': ContactsPage,
  'deals': DealsPage,
  'inventory': InventoryPage,
  'tasks': TasksPage,
  'calendar': CalendarPage,
  'meetings': MeetingsPage,
  'reports': ReportsPage,
  'admin': AdminPage,
  'activity-log': ActivityLogPage,
  'settings': SettingsPage,
};

const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      <p className="text-sm text-gray-500 dark:text-zinc-400">Loading page...</p>
    </div>
  </div>
);

const LayoutShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeTab } = useNavigation();
  const [visitedPages, setVisitedPages] = useState<Set<NavigationItem>>(() => new Set([activeTab]));

  useEffect(() => {
    setVisitedPages(prev => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col md:ml-16 lg:ml-64 min-h-0 min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={pageTitles[activeTab] || 'Dashboard'}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-dark-100 safe-area-bottom">
          <Outlet />
          {Array.from(visitedPages).map(page => {
            const PageComponent = PAGE_COMPONENTS[page];
            if (!PageComponent) return null;
            const isActive = activeTab === page;
            return (
              <div
                key={page}
                style={{ display: isActive ? 'block' : 'none' }}
              >
                <Suspense fallback={<PageLoader />}>
                  <PageComponent />
                </Suspense>
              </div>
            );
          })}
        </main>
      </div>
    </div>
  );
};

export const RootLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-sm text-gray-500 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <NavigationProvider>
      <LayoutShell />
    </NavigationProvider>
  );
};
