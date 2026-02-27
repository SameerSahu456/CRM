import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { dashboardApi } from '@/services/api';

interface DashboardDataContextType {
  data: any | null;
  mySummary: any | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const DashboardDataContext = createContext<DashboardDataContextType | undefined>(undefined);

export const DashboardDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<any | null>(null);
  const [mySummary, setMySummary] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allResult, myResult] = await Promise.allSettled([
        dashboardApi.getAll(),
        dashboardApi.getMySummary(),
      ]);
      setData(allResult.status === 'fulfilled' ? allResult.value : null);
      setMySummary(myResult.status === 'fulfilled' ? myResult.value : null);
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
    <DashboardDataContext.Provider value={{ data, mySummary, isLoading, refresh: fetchData }}>
      {children}
    </DashboardDataContext.Provider>
  );
};

export const useDashboardData = (): DashboardDataContextType => {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) throw new Error('useDashboardData must be used within DashboardDataProvider');
  return ctx;
};
