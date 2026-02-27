import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ViewAccess } from '@/types';

interface ViewContextType {
  currentView: ViewAccess;
  setCurrentView: (view: ViewAccess) => void;
  canSwitchView: boolean;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

// Normalize view_access values from backend to valid frontend ViewAccess values
// Backend may have legacy values like 'all', 'team', 'own' that need mapping
function normalizeViewAccess(value?: string): ViewAccess {
  if (value === 'presales') return 'presales';
  if (value === 'postsales') return 'postsales';
  if (value === 'both' || value === 'all') return 'both';
  // Unknown values (e.g. 'team', 'own') default to 'both' so user sees everything
  return 'both';
}

export function ViewProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentView, setCurrentViewState] = useState<ViewAccess>('presales');

  const userView = normalizeViewAccess(user?.viewAccess);

  // Determine if user can switch views (admin/superadmin or users with 'both' access)
  const canSwitchView = user?.role === 'admin' || user?.role === 'superadmin' || userView === 'both';

  // Initialize view from user's viewAccess or localStorage
  useEffect(() => {
    if (!user) return;

    const savedView = localStorage.getItem('selectedView') as ViewAccess;

    if (user.role === 'admin' || user.role === 'superadmin' || userView === 'both') {
      // Admin or users with 'both' access can choose, default to saved or 'both' (all views)
      setCurrentViewState(savedView || 'both');
    } else {
      // Regular users use their assigned view
      setCurrentViewState(userView);
    }
  }, [user, userView]);

  const setCurrentView = (view: ViewAccess) => {
    if (!canSwitchView) return; // Only allow switching if user has permission
    setCurrentViewState(view);
    localStorage.setItem('selectedView', view);
  };

  return (
    <ViewContext.Provider value={{ currentView, setCurrentView, canSwitchView }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const context = useContext(ViewContext);
  if (context === undefined) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
}
