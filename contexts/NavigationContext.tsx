import React, { createContext, useContext, useState, useCallback } from 'react';
import { NavigationItem } from '../types';

interface NavigationContextType {
  activeTab: NavigationItem;
  setActiveTab: (tab: NavigationItem) => void;
  navigateToEntity: (type: 'account' | 'contact' | 'lead' | 'deal', id: string, name?: string) => void;
  selectedEntityId: string | null;
  selectedEntityName: string | null;
  clearSelectedEntity: () => void;
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
  setActiveTab
}) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedEntityName, setSelectedEntityName] = useState<string | null>(null);

  const navigateToEntity = useCallback((type: 'account' | 'contact' | 'lead' | 'deal', id: string, name?: string) => {
    setSelectedEntityId(id);
    setSelectedEntityName(name || null);

    switch (type) {
      case 'account':
        setActiveTab('accounts');
        break;
      case 'contact':
        setActiveTab('contacts');
        break;
      case 'lead':
        setActiveTab('leads');
        break;
      case 'deal':
        setActiveTab('deals');
        break;
    }
  }, [setActiveTab]);

  const clearSelectedEntity = useCallback(() => {
    setSelectedEntityId(null);
    setSelectedEntityName(null);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        activeTab,
        setActiveTab,
        navigateToEntity,
        selectedEntityId,
        selectedEntityName,
        clearSelectedEntity
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};
