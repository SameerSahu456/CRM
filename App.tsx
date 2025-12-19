import React, { useState, useEffect, createContext, useContext } from 'react';
import { Loader2 } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Pipeline } from './components/Pipeline';
import { LeadsTable } from './components/LeadsTable';
import { AccountsTable } from './components/AccountsTable';
import { AccountDetailView } from './components/AccountDetailView';
import { AnalyticsView } from './components/AnalyticsView';
import { ContactsTable } from './components/ContactsTable';
import { TasksView } from './components/TasksView';
import { CalendarView } from './components/CalendarView';
// Marketing & Support modules - commented out as not needed
// import { CampaignsView } from './components/CampaignsView';
// import { TicketsView } from './components/TicketsView';
import { EmailView } from './components/EmailView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { LoginPage } from './components/LoginPage';
import { QuickActions } from './components/QuickActions';
import { NavigationItem } from './types';
import { NavigationProvider } from './contexts/NavigationContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Detail View Context for managing full-page detail views
interface DetailViewContextType {
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  selectedContactId: string | null;
  setSelectedContactId: (id: string | null) => void;
}

const DetailViewContext = createContext<DetailViewContextType | undefined>(undefined);

export const useDetailView = () => {
  const context = useContext(DetailViewContext);
  if (!context) {
    throw new Error('useDetailView must be used within DetailViewProvider');
  }
  return context;
};

// Loading spinner component
function LoadingSpinner() {
  const { theme } = useTheme();
  return (
    <div className={`min-h-screen flex items-center justify-center ${
      theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
        <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
          Loading...
        </p>
      </div>
    </div>
  );
}

// Main dashboard content (protected)
function DashboardContent() {
  // Persist active tab in localStorage
  const [activeTab, setActiveTab] = useState<NavigationItem>(() => {
    const saved = localStorage.getItem('comprint-active-tab');
    return (saved as NavigationItem) || 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();

  // Detail view states - persist in localStorage
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(() => {
    return localStorage.getItem('comprint-selected-account');
  });
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(() => {
    return localStorage.getItem('comprint-selected-lead');
  });
  const [selectedContactId, setSelectedContactId] = useState<string | null>(() => {
    return localStorage.getItem('comprint-selected-contact');
  });

  // Save active tab to localStorage
  useEffect(() => {
    localStorage.setItem('comprint-active-tab', activeTab);
  }, [activeTab]);

  // Save selected IDs to localStorage
  useEffect(() => {
    if (selectedAccountId) {
      localStorage.setItem('comprint-selected-account', selectedAccountId);
    } else {
      localStorage.removeItem('comprint-selected-account');
    }
  }, [selectedAccountId]);

  useEffect(() => {
    if (selectedLeadId) {
      localStorage.setItem('comprint-selected-lead', selectedLeadId);
    } else {
      localStorage.removeItem('comprint-selected-lead');
    }
  }, [selectedLeadId]);

  useEffect(() => {
    if (selectedContactId) {
      localStorage.setItem('comprint-selected-contact', selectedContactId);
    } else {
      localStorage.removeItem('comprint-selected-contact');
    }
  }, [selectedContactId]);

  // Close sidebar when navigating on mobile
  const handleSetActiveTab = (tab: NavigationItem) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    // Clear detail views when navigating to a different module
    if (tab !== 'accounts') setSelectedAccountId(null);
    if (tab !== 'leads') setSelectedLeadId(null);
    if (tab !== 'contacts') setSelectedContactId(null);
  };

  // Close sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderContent = () => {
    // Check for detail views first
    if (activeTab === 'accounts' && selectedAccountId) {
      return <AccountDetailView accountId={selectedAccountId} onBack={() => setSelectedAccountId(null)} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'deals':
        return <Pipeline />;
      case 'leads':
        return <LeadsTable />;
      case 'accounts':
        return <AccountsTable />;
      case 'contacts':
        return <ContactsTable />;
      case 'tasks':
        return <TasksView />;
      case 'calendar':
        return <CalendarView />;
      // Marketing & Support modules - commented out as not needed
      // case 'campaigns':
      //   return <CampaignsView />;
      // case 'tickets':
      //   return <TicketsView />;
      case 'email':
        return <EmailView />;
      case 'reports':
        return <ReportsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard />;
    }
  };

  const getTitle = () => {
    if (activeTab === 'accounts' && selectedAccountId) {
      return 'Account Details';
    }
    return activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
  };

  const detailViewContextValue = {
    selectedAccountId,
    setSelectedAccountId,
    selectedLeadId,
    setSelectedLeadId,
    selectedContactId,
    setSelectedContactId,
  };

  return (
    <DetailViewContext.Provider value={detailViewContextValue}>
      <NavigationProvider activeTab={activeTab} setActiveTab={handleSetActiveTab}>
        <div className={`flex min-h-screen font-sans transition-colors duration-300 overflow-x-hidden ${
          theme === 'dark'
            ? 'bg-zinc-950 text-zinc-100'
            : 'bg-slate-50 text-slate-900'
        }`}>
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <main className={`flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300 w-full max-w-full overflow-x-hidden ${
            theme === 'dark' ? 'bg-zinc-950' : ''
          }`}>
            <Header title={getTitle()} onMenuClick={() => setSidebarOpen(true)} />

            <div className={`flex-1 overflow-x-hidden overflow-y-auto relative ${
              theme === 'dark' ? 'bg-zinc-950' : ''
            }`}>
              {renderContent()}
            </div>
          </main>

          {/* Quick Actions FAB */}
          <QuickActions />
        </div>
      </NavigationProvider>
    </DetailViewContext.Provider>
  );
}

// App content with auth check
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <DashboardContent />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;