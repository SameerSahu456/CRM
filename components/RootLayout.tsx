import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NavigationProvider, useNavigation } from '../contexts/NavigationContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { pageTitles } from '../utils/navigation';
import { NavigationItem } from '../types';

// Lazy load all page components
const Dashboard = lazy(() => import('./Dashboard').then(m => ({ default: m.Dashboard })));
const SalesEntryPage = lazy(() => import('./SalesEntryPage').then(m => ({ default: m.SalesEntryPage })));
const CRMPage = lazy(() => import('./CRMPage').then(m => ({ default: m.CRMPage })));
const AdminPage = lazy(() => import('./AdminPage').then(m => ({ default: m.AdminPage })));
const SettingsPage = lazy(() => import('./SettingsPage').then(m => ({ default: m.SettingsPage })));
const AccountsPage = lazy(() => import('./AccountsPage').then(m => ({ default: m.AccountsPage })));
const ContactsPage = lazy(() => import('./ContactsPage').then(m => ({ default: m.ContactsPage })));
const DealsPage = lazy(() => import('./DealsPage').then(m => ({ default: m.DealsPage })));
const ReportsPage = lazy(() => import('./ReportsPage').then(m => ({ default: m.ReportsPage })));
const InventoryPage = lazy(() => import('./InventoryPage').then(m => ({ default: m.InventoryPage })));

const PAGE_COMPONENTS: Record<NavigationItem, React.LazyExoticComponent<React.ComponentType>> = {
  'dashboard': Dashboard,
  'sales-entry': SalesEntryPage,
  'crm': CRMPage,
  'accounts': AccountsPage,
  'contacts': ContactsPage,
  'deals': DealsPage,
  'inventory': InventoryPage,
  'reports': ReportsPage,
  'admin': AdminPage,
  'settings': SettingsPage,
};

const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      <p className="text-sm text-slate-500 dark:text-zinc-400">Loading page...</p>
    </div>
  </div>
);

const LayoutShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeTab } = useNavigation();
  const [visitedPages, setVisitedPages] = useState<Set<NavigationItem>>(() => new Set([activeTab]));

  // Track visited pages — once a page is visited, keep it mounted
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
      <div className="flex-1 flex flex-col md:ml-16 lg:ml-64 min-h-0 overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={pageTitles[activeTab] || 'Dashboard'}
        />
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-dark-100 safe-area-bottom">
          {/* Outlet handles index redirect & catch-all — renders null for normal pages */}
          <Outlet />
          {/* Keep-alive pages: once visited, stay mounted and hidden when inactive */}
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-sm text-slate-500 dark:text-zinc-400">Loading...</p>
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
