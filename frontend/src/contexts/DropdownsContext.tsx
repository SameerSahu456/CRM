import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { dropdownsApi } from '@/services/api';

export interface DropdownOption {
  value: string;
  label: string;
  metadata?: Record<string, any>;
}

interface DropdownsContextType {
  data: Record<string, DropdownOption[]>;
  isLoading: boolean;
  getOptions: (entity: string) => DropdownOption[];
  getValues: (entity: string) => string[];
  refresh: () => Promise<void>;
}

const DropdownsContext = createContext<DropdownsContextType | undefined>(undefined);

export const DropdownsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<Record<string, DropdownOption[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadDropdowns = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const raw = await dropdownsApi.getAll();
      const mapped: Record<string, DropdownOption[]> = {};
      for (const [entity, items] of Object.entries(raw)) {
        mapped[entity] = (items as any[]).map((item) => ({
          value: item.value,
          label: item.label,
          metadata: item.metadata || {},
        }));
      }
      setData(mapped);
    } catch (err) {
      console.error('Failed to load dropdowns:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadDropdowns();
  }, [loadDropdowns]);

  const getOptions = useCallback(
    (entity: string): DropdownOption[] => data[entity] || [],
    [data]
  );

  const getValues = useCallback(
    (entity: string): string[] => (data[entity] || []).map((o) => o.value),
    [data]
  );

  return (
    <DropdownsContext.Provider value={{ data, isLoading, getOptions, getValues, refresh: loadDropdowns }}>
      {children}
    </DropdownsContext.Provider>
  );
};

export const useDropdowns = (): DropdownsContextType => {
  const ctx = useContext(DropdownsContext);
  if (!ctx) throw new Error('useDropdowns must be used within DropdownsProvider');
  return ctx;
};
