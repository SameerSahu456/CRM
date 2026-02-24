import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { dashboardApi } from '@/services/api';

interface DashboardDataContextType {
  data: any | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const DashboardDataContext = createContext<DashboardDataContextType | undefined>(undefined);

export const DashboardDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await dashboardApi.getAll();
      setData(all);
    } catch {
      // best-effort
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <DashboardDataContext.Provider value={{ data, isLoading, refresh: fetchData }}>
      {children}
    </DashboardDataContext.Provider>
  );
};

export const useDashboardData = (): DashboardDataContextType => {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) throw new Error('useDashboardData must be used within DashboardDataProvider');
  return ctx;
};
