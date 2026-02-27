import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RootLayout } from '@/components/layout/RootLayout';
import { lazyWithRetry } from '@/utils/lazyWithRetry';

// Only LoginPage is rendered by the router — all other pages are in RootLayout
const LoginPage = lazyWithRetry(() => import('@/pages/LoginPage'));

// Sub-route pages (lazy-loaded)
const LeadFormPage = lazyWithRetry(() => import('@/pages/LeadFormPage').then(m => ({ default: m.LeadFormPage })));
const DealFormPage = lazyWithRetry(() => import('@/pages/DealFormPage').then(m => ({ default: m.DealFormPage })));

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
      // Page rendering is handled by RootLayout keep-alive — routes just validate URLs
      { path: 'dashboard', element: null },
      { path: 'sales-entry', element: null },
      { path: 'leads', children: [
        { index: true, element: null },
        { path: 'create', element: <Suspense fallback={null}><LeadFormPage /></Suspense> },
        { path: 'edit/:id', element: <Suspense fallback={null}><LeadFormPage /></Suspense> },
        { path: 'view/:id', element: <Suspense fallback={null}><LeadFormPage /></Suspense> },
      ]},
      { path: 'crm', element: <Navigate to="/leads" replace /> },
      { path: 'collections', element: null },
      { path: 'accounts', element: null },
      { path: 'contacts', element: null },
      { path: 'deals', children: [
        { index: true, element: null },
        { path: 'create', element: <Suspense fallback={null}><DealFormPage /></Suspense> },
        { path: 'edit/:id', element: <Suspense fallback={null}><DealFormPage /></Suspense> },
        { path: 'view/:id', element: <Suspense fallback={null}><DealFormPage /></Suspense> },
      ]},
      { path: 'inventory', element: null },
      { path: 'quote-builder', element: null },
      { path: 'tasks', element: null },
      { path: 'calendar', element: null },
      { path: 'meetings', element: null },
      { path: 'reports', element: null },
      { path: 'admin', element: null },
      { path: 'settings', element: null },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);
