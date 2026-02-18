import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ViewAccess } from '@/types';

interface ViewContextType {
  currentView: ViewAccess;
  setCurrentView: (view: ViewAccess) => void;
  canSwitchView: boolean;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentView, setCurrentViewState] = useState<ViewAccess>('presales');

  // Determine if user can switch views (admin/superadmin or users with 'both' access)
  const canSwitchView = user?.role === 'admin' || user?.role === 'superadmin' || user?.viewAccess === 'both';

  // Initialize view from user's viewAccess or localStorage
  useEffect(() => {
    if (!user) return;

    const savedView = localStorage.getItem('selectedView') as ViewAccess;

    if (user.role === 'admin' || user.role === 'superadmin' || user.viewAccess === 'both') {
      // Admin or users with 'both' access can choose, default to saved or 'both' (all views)
      setCurrentViewState(savedView || 'both');
    } else {
      // Regular users use their assigned view
      setCurrentViewState(user.viewAccess || 'presales');
    }
  }, [user]);

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
