import React, { createContext, useContext, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavigationItem } from '../types';
import { navigationItemToPath, pathToNavigationItem } from '../utils/navigation';

interface NavigationContextType {
  activeTab: NavigationItem;
  setActiveTab: (tab: NavigationItem, params?: Record<string, string>) => void;
  consumeNavParams: () => Record<string, string> | null;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const nav = useNavigate();
  const location = useLocation();
  const navParamsRef = useRef<Record<string, string> | null>(null);

  const activeTab = pathToNavigationItem(location.pathname);

  const setActiveTab = useCallback((tab: NavigationItem, params?: Record<string, string>) => {
    navParamsRef.current = params || null;
    nav(navigationItemToPath(tab));
  }, [nav]);

  const consumeNavParams = useCallback((): Record<string, string> | null => {
    const params = navParamsRef.current;
    navParamsRef.current = null;
    return params;
  }, []);

  return (
    <NavigationContext.Provider value={{ activeTab, setActiveTab, consumeNavParams }}>
      {children}
    </NavigationContext.Provider>
  );
};
