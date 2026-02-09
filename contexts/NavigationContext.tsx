import React, { createContext, useContext, useState } from 'react';
import { NavigationItem } from '../types';

interface NavigationContextType {
  activeTab: NavigationItem;
  setActiveTab: (tab: NavigationItem) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
  activeTab: NavigationItem;
  setActiveTab: (tab: NavigationItem) => void;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  activeTab,
  setActiveTab,
}) => {
  return (
    <NavigationContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </NavigationContext.Provider>
  );
};
