import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui';
import { cx } from '@/utils/cx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KanbanColumnConfig {
  id: string;
  label: string;
  dotColor?: string;
  icon?: React.ReactNode;
}

export interface KanbanColumnState<T> {
  page: number;
  hasNext: boolean;
  loading: boolean;
  initialLoading: boolean;
  items: T[];
  total: number;
}

interface KanbanBoardProps<T extends { id: string }> {
  columns: KanbanColumnConfig[];
  columnStates: Record<string, KanbanColumnState<T>>;
  counts: Record<string, number>;
  renderCard: (item: T, isDragging?: boolean) => React.ReactNode;
  renderOverlayCard?: (item: T) => React.ReactNode;
  onLoadMore: (columnId: string) => void;
  onMoveAcross: (itemId: string, fromColumn: string, toColumn: string, targetIndex?: number) => void;
  onReorder: (columnId: string, orderedIds: string[]) => void;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Shimmer placeholder
// ---------------------------------------------------------------------------

const ShimmerCard: React.FC = () => (
  <div className="p-3 rounded-xl border border-gray-100 dark:border-zinc-800 animate-pulse space-y-2">
    <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-3/4" />
    <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded w-1/2" />
    <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded w-1/3" />
  </div>
);

// ---------------------------------------------------------------------------
// Sortable Card wrapper
// ---------------------------------------------------------------------------

function SortableCard<T extends { id: string }>({
  item,
  renderCard,
}: {
  item: T;
  renderCard: (item: T, isDragging?: boolean) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.2 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {renderCard(item, isDragging)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single Column (with useDroppable so empty columns accept drops)
// ---------------------------------------------------------------------------

function KanbanColumn<T extends { id: string }>({
  config,
  state,
  count,
  renderCard,
  onLoadMore,
  isOverColumn,
}: {
  config: KanbanColumnConfig;
  state: KanbanColumnState<T>;
  count: number;
  renderCard: (item: T, isDragging?: boolean) => React.ReactNode;
  onLoadMore: () => void;
  isOverColumn?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  const { setNodeRef: setDroppableRef } = useDroppable({ id: config.id });

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !state.hasNext || state.loading) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom && !loadingMoreRef.current) {
      loadingMoreRef.current = true;
      onLoadMore();
    }
  }, [state.hasNext, state.loading, onLoadMore]);

  useEffect(() => {
    if (!state.loading) {
      loadingMoreRef.current = false;
    }
  }, [state.loading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleScroll();
    }, 100);
    return () => clearTimeout(timer);
  }, [state.items.length, state.loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const itemIds = state.items.map(i => i.id);

  return (
    <div
      ref={setDroppableRef}
      className={cx(
        'rounded-2xl border p-3 flex flex-col min-h-[200px] transition-colors bg-white dark:bg-dark-50',
        isOverColumn
          ? 'border-brand-400 bg-brand-50/30 dark:border-brand-500 dark:bg-brand-900/10'
          : 'border-gray-200 dark:border-zinc-800'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          {config.icon || (
            <div className={cx('w-2 h-2 rounded-full', config.dotColor || 'bg-gray-400')} />
          )}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {config.label}
          </h3>
        </div>
        <Badge variant="gray" size="sm">{count}</Badge>
      </div>

      {/* Scrollable card list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="space-y-2 overflow-y-auto max-h-[70vh] flex-1 pr-0.5 scrollbar-thin"
      >
        {state.initialLoading ? (
          <>
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </>
        ) : (
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {state.items.length === 0 ? (
              <p className="text-xs text-center py-6 text-gray-300 dark:text-zinc-600">
                No items
              </p>
            ) : (
              state.items.map(item => (
                <SortableCard
                  key={item.id}
                  item={item}
                  renderCard={renderCard}
                />
              ))
            )}
          </SortableContext>
        )}

        {state.loading && !state.initialLoading && (
          <div className="space-y-2 pt-1">
            <ShimmerCard />
            <ShimmerCard />
          </div>
        )}

        {!state.hasNext && state.items.length > 0 && !state.loading && (
          <p className="text-[10px] text-center py-2 text-gray-300 dark:text-zinc-700">
            End of list
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main KanbanBoard
// ---------------------------------------------------------------------------

// Global drag flag — cards check this to suppress click-navigation after a drag
let _kanbanDragActive = false;
let _kanbanDragEndTime = 0;
export function wasRecentlyDragging(): boolean {
  return _kanbanDragActive || (Date.now() - _kanbanDragEndTime < 200);
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  columnStates,
  counts,
  renderCard,
  renderOverlayCard,
  onLoadMore,
  onMoveAcross,
  onReorder,
}: KanbanBoardProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [overlayWidth, setOverlayWidth] = useState<number | null>(null);
  const [previewColumnStates, setPreviewColumnStates] = useState<Record<string, KanbanColumnState<T>> | null>(null);
  const dragStartColumnRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const cloneColumnStates = useCallback((source: Record<string, KanbanColumnState<T>>) => {
    const cloned: Record<string, KanbanColumnState<T>> = {};
    for (const col of columns) {
      const state = source[col.id];
      cloned[col.id] = state
        ? { ...state, items: [...state.items] }
        : { page: 0, hasNext: false, loading: false, initialLoading: true, items: [], total: 0 };
    }
    return cloned;
  }, [columns]);

  const findColumnInStates = useCallback(
    (states: Record<string, KanbanColumnState<T>>, itemId: string): string | null => {
      for (const col of columns) {
        const state = states[col.id];
        if (state?.items.some(i => i.id === itemId)) return col.id;
      }
      return null;
    },
    [columns]
  );

  const resolveColumnIdInStates = useCallback(
    (id: string, states: Record<string, KanbanColumnState<T>>): string | null => {
      if (columns.some(c => c.id === id)) return id;
      return findColumnInStates(states, id);
    },
    [columns, findColumnInStates]
  );

  const getDropIndex = useCallback((
    overId: string,
    toCol: string,
    toItems: T[],
    overRect: { top: number; height: number } | null,
    pointerY: number | null
  ): number => {
    if (overId === toCol) return toItems.length;
    const hoveredIndex = toItems.findIndex(i => i.id === overId);
    if (hoveredIndex === -1) return toItems.length;
    if (!overRect || pointerY === null) return hoveredIndex;
    const midY = overRect.top + overRect.height / 2;
    return pointerY > midY ? hoveredIndex + 1 : hoveredIndex;
  }, []);

  const displayedColumnStates = previewColumnStates ?? columnStates;

  const activeItem = useMemo(() => {
    if (!activeId) return null;
    for (const col of columns) {
      const item = displayedColumnStates[col.id]?.items.find(i => i.id === activeId);
      if (item) return item;
    }
    return null;
  }, [activeId, columns, displayedColumnStates]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const draggedId = String(event.active.id);
      _kanbanDragActive = true;
      setActiveId(draggedId);
      setOverlayWidth(event.active.rect.current.initial?.width ?? null);
      setPreviewColumnStates(cloneColumnStates(columnStates));
      dragStartColumnRef.current = findColumnInStates(columnStates, draggedId);
    },
    [cloneColumnStates, columnStates, findColumnInStates]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) {
        setOverColumnId(null);
        return;
      }
      const draggedId = String(active.id);
      const overId = String(over.id);

      setPreviewColumnStates(prev => {
        const base = prev ? cloneColumnStates(prev) : cloneColumnStates(columnStates);
        const fromCol = findColumnInStates(base, draggedId);
        const toCol = resolveColumnIdInStates(overId, base);
        if (!fromCol || !toCol) return base;

        setOverColumnId(toCol);

        const pointerY = event.active.rect.current.translated
          ? event.active.rect.current.translated.top + event.active.rect.current.translated.height / 2
          : null;

        if (fromCol === toCol) {
          const items = [...base[fromCol].items];
          const oldIndex = items.findIndex(i => i.id === draggedId);
          if (oldIndex === -1) return base;
          const targetIndex = Math.max(
            0,
            Math.min(
              getDropIndex(overId, toCol, items, over.rect ?? null, pointerY),
              items.length - 1
            )
          );
          if (targetIndex === oldIndex) return base;
          base[fromCol] = {
            ...base[fromCol],
            items: arrayMove(items, oldIndex, targetIndex),
          };
          return base;
        }

        const fromItems = base[fromCol].items.filter(i => i.id !== draggedId);
        const item = base[fromCol].items.find(i => i.id === draggedId);
        if (!item) return base;
        const toItems = [...base[toCol].items];
        const insertAt = Math.max(
          0,
          Math.min(getDropIndex(overId, toCol, toItems, over.rect ?? null, pointerY), toItems.length)
        );
        toItems.splice(insertAt, 0, item);

        base[fromCol] = {
          ...base[fromCol],
          items: fromItems,
          total: Math.max(0, base[fromCol].total - 1),
        };
        base[toCol] = {
          ...base[toCol],
          items: toItems,
          total: base[toCol].total + 1,
        };
        return base;
      });
    },
    [cloneColumnStates, columnStates, findColumnInStates, getDropIndex, resolveColumnIdInStates]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const finalStates = previewColumnStates ?? columnStates;
      const draggedId = String(active.id);
      const fromCol = dragStartColumnRef.current || findColumnInStates(columnStates, draggedId);
      const toCol = findColumnInStates(finalStates, draggedId);

      _kanbanDragActive = false;
      _kanbanDragEndTime = Date.now();
      setActiveId(null);
      setOverColumnId(null);
      setOverlayWidth(null);
      setPreviewColumnStates(null);
      dragStartColumnRef.current = null;

      if (!over || !fromCol || !toCol) return;

      if (fromCol !== toCol) {
        const targetIndex = Math.max(0, finalStates[toCol].items.findIndex(i => i.id === draggedId));
        onMoveAcross(draggedId, fromCol, toCol, targetIndex);
      } else {
        const before = (columnStates[fromCol]?.items || []).map(i => i.id);
        const after = (finalStates[fromCol]?.items || []).map(i => i.id);
        if (before.length === after.length && before.some((id, idx) => id !== after[idx])) {
          onReorder(fromCol, after);
        }
      }
    },
    [columnStates, previewColumnStates, findColumnInStates, onMoveAcross, onReorder]
  );

  const handleDragCancel = useCallback(() => {
    _kanbanDragActive = false;
    _kanbanDragEndTime = Date.now();
    setActiveId(null);
    setOverColumnId(null);
    setOverlayWidth(null);
    setPreviewColumnStates(null);
    dragStartColumnRef.current = null;
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="overflow-x-auto">
        <div className="flex items-start gap-4 w-max min-w-full pb-1">
          {columns.map(col => (
            <div key={col.id} className="w-[300px] min-w-[300px]">
              <KanbanColumn
                config={col}
                state={displayedColumnStates[col.id] || { page: 0, hasNext: false, loading: false, initialLoading: true, items: [], total: 0 }}
                count={counts[col.id] || 0}
                renderCard={renderCard}
                onLoadMore={() => onLoadMore(col.id)}
                isOverColumn={overColumnId === col.id && findColumnInStates(displayedColumnStates, activeId || '') !== col.id}
              />
            </div>
          ))}
        </div>
      </div>
      {typeof document !== 'undefined'
        ? createPortal(
            <DragOverlay>
              {activeItem ? (
                <div
                  className="pointer-events-none"
                  style={{
                    width: overlayWidth ?? undefined,
                    boxShadow: '0 18px 40px rgba(0,0,0,0.2)',
                  }}
                >
                  {renderOverlayCard ? renderOverlayCard(activeItem) : renderCard(activeItem, true)}
                </div>
              ) : null}
            </DragOverlay>,
            document.body
          )
        : null}
    </DndContext>
  );
}
