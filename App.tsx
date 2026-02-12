import React, { useState, Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NavigationItem } from './types';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { ViewProvider } from './contexts/ViewContext';

// Lazy load all page components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const SalesEntryPage = lazy(() => import('./components/SalesEntryPage').then(m => ({ default: m.SalesEntryPage })));
const CRMPage = lazy(() => import('./components/CRMPage').then(m => ({ default: m.CRMPage })));
const AdminPage = lazy(() => import('./components/AdminPage').then(m => ({ default: m.AdminPage })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AccountsPage = lazy(() => import('./components/AccountsPage').then(m => ({ default: m.AccountsPage })));
const ContactsPage = lazy(() => import('./components/ContactsPage').then(m => ({ default: m.ContactsPage })));
const DealsPage = lazy(() => import('./components/DealsPage').then(m => ({ default: m.DealsPage })));
const ReportsPage = lazy(() => import('./components/ReportsPage').then(m => ({ default: m.ReportsPage })));
const LoginPage = lazy(() => import('./components/LoginPage'));

const pageTitles: Record<NavigationItem, string> = {
  'dashboard': 'Dashboard',
  'sales-entry': 'Sales Entry',
  'crm': 'Leads',
  'accounts': 'Accounts',
  'contacts': 'Contacts',
  'deals': 'Deals',
  'quote-builder': 'Quote Builder',
  'reports': 'Reports',
  'admin': 'Admin Panel',
  'settings': 'Settings',
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavigationItem>(() => {
    const saved = localStorage.getItem('zenith-active-tab');
    if (saved && saved in pageTitles) return saved as NavigationItem;
    return 'dashboard';
  });

  // Persist active tab to localStorage
  const handleSetActiveTab = (tab: NavigationItem) => {
    setActiveTab(tab);
    localStorage.setItem('zenith-active-tab', tab);
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-100">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className="text-sm text-slate-500 dark:text-zinc-400">Loading...</p>
          </div>
        </div>
      }>
        <LoginPage />
      </Suspense>
    );
  }

  // Loading fallback component
  const PageLoader = () => (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-zinc-400">Loading page...</p>
      </div>
    </div>
  );

  const renderPage = () => {
    let PageComponent: React.LazyExoticComponent<React.ComponentType<any>>;
    switch (activeTab) {
      case 'dashboard':
        PageComponent = Dashboard;
        break;
      case 'sales-entry':
        PageComponent = SalesEntryPage;
        break;
      case 'crm':
        PageComponent = CRMPage;
        break;
      case 'accounts':
        PageComponent = AccountsPage;
        break;
      case 'contacts':
        PageComponent = ContactsPage;
        break;
      case 'deals':
        PageComponent = DealsPage;
        break;
      case 'reports':
        PageComponent = ReportsPage;
        break;
      case 'admin':
        PageComponent = AdminPage;
        break;
      case 'settings':
        PageComponent = SettingsPage;
        break;
      default:
        PageComponent = Dashboard;
    }

    return (
      <Suspense fallback={<PageLoader />}>
        <PageComponent />
      </Suspense>
    );
  };

  return (
    <NavigationProvider activeTab={activeTab} setActiveTab={handleSetActiveTab}>
      <div className="flex h-screen overflow-clip">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleSetActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col lg:ml-64 min-h-screen overflow-clip">
          <Header
            onMenuClick={() => setSidebarOpen(true)}
            title={pageTitles[activeTab] || 'Dashboard'}
          />
          <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-dark-100 safe-area-bottom">
            {renderPage()}
          </main>
        </div>
      </div>
    </NavigationProvider>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ViewProvider>
          <AppContent />
        </ViewProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
