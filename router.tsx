import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { RootLayout } from './components/RootLayout';

// Lazy-loaded pages
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const SalesEntryPage = lazy(() => import('./components/SalesEntryPage').then(m => ({ default: m.SalesEntryPage })));
const CRMPage = lazy(() => import('./components/CRMPage').then(m => ({ default: m.CRMPage })));
const AdminPage = lazy(() => import('./components/AdminPage').then(m => ({ default: m.AdminPage })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AccountsPage = lazy(() => import('./components/AccountsPage').then(m => ({ default: m.AccountsPage })));
const ContactsPage = lazy(() => import('./components/ContactsPage').then(m => ({ default: m.ContactsPage })));
const DealsPage = lazy(() => import('./components/DealsPage').then(m => ({ default: m.DealsPage })));
const ReportsPage = lazy(() => import('./components/ReportsPage').then(m => ({ default: m.ReportsPage })));
const QuoteBuilderPage = lazy(() => import('./components/QuoteBuilderPage').then(m => ({ default: m.QuoteBuilderPage })));
const LoginPage = lazy(() => import('./components/LoginPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      <p className="text-sm text-slate-500 dark:text-zinc-400">Loading page...</p>
    </div>
  </div>
);

function SuspenseWrap({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const LoginGuard = () => {
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

  // Already logged in — redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

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
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginGuard />,
  },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <SuspenseWrap><Dashboard /></SuspenseWrap> },
      { path: 'sales-entry', element: <SuspenseWrap><SalesEntryPage /></SuspenseWrap> },

      { path: 'crm', element: <SuspenseWrap><CRMPage /></SuspenseWrap> },
      { path: 'accounts', element: <SuspenseWrap><AccountsPage /></SuspenseWrap> },
      { path: 'contacts', element: <SuspenseWrap><ContactsPage /></SuspenseWrap> },
      { path: 'deals', element: <SuspenseWrap><DealsPage /></SuspenseWrap> },
      { path: 'quote-builder', element: <SuspenseWrap><QuoteBuilderPage /></SuspenseWrap> },
      { path: 'reports', element: <SuspenseWrap><ReportsPage /></SuspenseWrap> },
      { path: 'admin', element: <SuspenseWrap><AdminPage /></SuspenseWrap> },
      { path: 'settings', element: <SuspenseWrap><SettingsPage /></SuspenseWrap> },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);
