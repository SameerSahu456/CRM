import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NavigationProvider, useNavigation } from '../contexts/NavigationContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { pageTitles } from '../utils/navigation';

const LayoutShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeTab } = useNavigation();

  return (
    <div className="flex h-screen overflow-clip">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col lg:ml-64 min-h-screen overflow-clip">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={pageTitles[activeTab] || 'Dashboard'}
        />
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-dark-100 safe-area-bottom">
          <Outlet />
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
