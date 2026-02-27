import { useState, useCallback, useRef } from 'react';
import type { KanbanColumnState } from '@/components/common/KanbanBoard';

const KANBAN_PAGE_SIZE = 5;

interface UseKanbanOptions<T extends { id: string }> {
  stages: string[];
  fetchPage: (stage: string, page: number, limit: number) => Promise<{
    data: T[];
    pagination: { page: number; limit: number; total: number; hasNext: boolean };
  }>;
  fetchCounts: () => Promise<Record<string, number>>;
  onStageChange: (itemId: string, newStage: string) => Promise<void>;
  onReorder: (stage: string, orderedIds: string[]) => Promise<void>;
}

export function useKanban<T extends { id: string }>({
  stages,
  fetchPage,
  fetchCounts,
  onStageChange,
  onReorder,
}: UseKanbanOptions<T>) {
  // Column states
  const [columnStates, setColumnStates] = useState<Record<string, KanbanColumnState<T>>>(() => {
    const initial: Record<string, KanbanColumnState<T>> = {};
    for (const stage of stages) {
      initial[stage] = { page: 0, hasNext: true, loading: false, initialLoading: true, items: [], total: 0 };
    }
    return initial;
  });

  // Keep a ref in sync so callbacks always see fresh state
  const columnStatesRef = useRef(columnStates);
  columnStatesRef.current = columnStates;

  // Counts
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Track if initial load happened
  const initializedRef = useRef(false);

  // Prevent concurrent loads per stage
  const loadingStagesRef = useRef<Set<string>>(new Set());

  // Load a single page for a column
  const loadColumnPage = useCallback(async (stage: string, page: number, append: boolean) => {
    // Prevent duplicate loads
    if (append && loadingStagesRef.current.has(stage)) return;
    if (append) loadingStagesRef.current.add(stage);

    setColumnStates(prev => ({
      ...prev,
      [stage]: {
        ...prev[stage],
        loading: true,
        initialLoading: page === 1 && !append,
      },
    }));

    try {
      const result = await fetchPage(stage, page, KANBAN_PAGE_SIZE);
      setColumnStates(prev => ({
        ...prev,
        [stage]: {
          page,
          hasNext: result.pagination.hasNext,
          loading: false,
          initialLoading: false,
          items: append ? [...prev[stage].items, ...result.data] : result.data,
          total: result.pagination.total,
        },
      }));
    } catch {
      setColumnStates(prev => ({
        ...prev,
        [stage]: { ...prev[stage], loading: false, initialLoading: false },
      }));
    } finally {
      loadingStagesRef.current.delete(stage);
    }
  }, [fetchPage]);

  // Load next page for a column (infinite scroll) — reads from ref to avoid stale closure
  const loadMore = useCallback((stage: string) => {
    const state = columnStatesRef.current[stage];
    if (!state || state.loading || !state.hasNext) return;
    if (loadingStagesRef.current.has(stage)) return;
    loadColumnPage(stage, state.page + 1, true);
  }, [loadColumnPage]);

  // Load counts
  const loadCounts = useCallback(async () => {
    try {
      const data = await fetchCounts();
      setCounts(data);
    } catch {
      // non-critical
    }
  }, [fetchCounts]);

  // Initialize all columns + counts
  const initializeBoard = useCallback(async () => {
    // Reset all columns
    const reset: Record<string, KanbanColumnState<T>> = {};
    for (const stage of stages) {
      reset[stage] = { page: 0, hasNext: true, loading: false, initialLoading: true, items: [], total: 0 };
    }
    setColumnStates(reset);
    columnStatesRef.current = reset;
    loadingStagesRef.current.clear();

    // Load first page for all columns in parallel + counts
    await Promise.all([
      ...stages.map(stage => loadColumnPage(stage, 1, false)),
      loadCounts(),
    ]);
    initializedRef.current = true;
  }, [stages, loadColumnPage, loadCounts]);

  // Move item across columns (optimistic)
  const moveAcross = useCallback(async (itemId: string, fromCol: string, toCol: string, targetIndex?: number) => {
    // Find item from ref for freshest state
    const fromState = columnStatesRef.current[fromCol];
    const toState = columnStatesRef.current[toCol];
    const item = fromState?.items.find(i => i.id === itemId);
    if (!item) return;
    const sourceIndex = fromState.items.findIndex(i => i.id === itemId);
    const initialInsertAt = Math.max(0, Math.min(targetIndex ?? toState?.items.length ?? 0, toState?.items.length ?? 0));

    // Optimistic update
    setColumnStates(prev => {
      const fromItems = prev[fromCol].items.filter(i => i.id !== itemId);
      const toItems = [...prev[toCol].items];
      const insertAt = Math.max(0, Math.min(initialInsertAt, toItems.length));
      toItems.splice(insertAt, 0, item);
      return {
        ...prev,
        [fromCol]: { ...prev[fromCol], items: fromItems, total: prev[fromCol].total - 1 },
        [toCol]: { ...prev[toCol], items: toItems, total: prev[toCol].total + 1 },
      };
    });

    // Optimistic count update
    setCounts(prev => ({
      ...prev,
      [fromCol]: Math.max(0, (prev[fromCol] || 0) - 1),
      [toCol]: (prev[toCol] || 0) + 1,
    }));

    try {
      await onStageChange(itemId, toCol);
      // Refresh counts from server
      loadCounts();
    } catch {
      // Revert on failure
      setColumnStates(prev => {
        const toItems = prev[toCol].items.filter(i => i.id !== itemId);
        const fromItems = [...prev[fromCol].items];
        const safeSourceIndex = Math.max(0, Math.min(sourceIndex, fromItems.length));
        fromItems.splice(safeSourceIndex, 0, item);
        return {
          ...prev,
          [fromCol]: { ...prev[fromCol], items: fromItems, total: prev[fromCol].total + 1 },
          [toCol]: { ...prev[toCol], items: toItems, total: prev[toCol].total - 1 },
        };
      });
      setCounts(prev => ({
        ...prev,
        [fromCol]: (prev[fromCol] || 0) + 1,
        [toCol]: Math.max(0, (prev[toCol] || 0) - 1),
      }));
    }
  }, [onStageChange, loadCounts]);

  // Reorder within a column (optimistic)
  const reorderColumn = useCallback(async (columnId: string, orderedIds: string[]) => {
    // Optimistic reorder
    setColumnStates(prev => {
      const itemMap = new Map(prev[columnId].items.map(i => [i.id, i]));
      const reordered = orderedIds.map(id => itemMap.get(id)!).filter(Boolean);
      return {
        ...prev,
        [columnId]: { ...prev[columnId], items: reordered },
      };
    });

    try {
      await onReorder(columnId, orderedIds);
    } catch {
      // Could revert, but reorder failure is usually non-critical
    }
  }, [onReorder]);

  // Reset and reload all (e.g., when filters change)
  const resetAndReload = useCallback(async () => {
    await initializeBoard();
  }, [initializeBoard]);

  return {
    columnStates,
    counts,
    loadMore,
    moveAcross,
    reorderColumn,
    initializeBoard,
    resetAndReload,
    loadCounts,
  };
}
