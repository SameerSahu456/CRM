import React, { useState, Suspense } from 'react';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Settings, Loader2 } from 'lucide-react';
import { useDashboardLayout } from '../../hooks/useDashboardLayout';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetLibrary } from '../WidgetLibrary';
import { WidgetDetailModal } from './WidgetDetailModal';
import { WIDGET_REGISTRY } from '../../config/widgetRegistry';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useView } from '../../contexts/ViewContext';
import { useNavigation } from '../../contexts/NavigationContext';


export const DashboardContainer: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { currentView } = useView();
  const { setActiveTab: navigate } = useNavigation();
  const isDark = theme === 'dark';

  const { accessibleWidgets, reorderWidgets, isLoading, isWidgetVisible } = useDashboardLayout();
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = accessibleWidgets.findIndex(w => w.id === active.id);
      const newIndex = accessibleWidgets.findIndex(w => w.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = [...accessibleWidgets];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);

        reorderWidgets(reordered.map(w => w.id));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const visibleWidgets = accessibleWidgets.filter(w => isWidgetVisible(w.id));

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5 animate-fade-in-up">
      {/* Customization Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowLibrary(true)}
          className="btn-premium flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-all shadow-sm hover:shadow-md"
        >
          <Settings className="w-4 h-4" />
          Customize Widgets
        </button>
      </div>

      {/* Drag-and-Drop Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleWidgets.map(w => w.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {visibleWidgets.map((widget, index) => {
              const meta = WIDGET_REGISTRY[widget.id];
              if (!meta) return null;

              const WidgetComponent = meta.component;
              const navigateTo = meta.navigateTo;

              return (
                <WidgetWrapper key={widget.id} id={widget.id}>
                  <Suspense
                    fallback={
                      <div className={`rounded-2xl p-5 flex items-center justify-center h-40 ${
                        isDark ? 'bg-[rgba(8,14,30,0.6)] border border-white/[0.07]' : 'bg-white/50 backdrop-blur-xl shadow-soft'
                      }`}>
                        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                      </div>
                    }
                  >
                    <div
                      className="widget-enter"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <WidgetComponent
                        isDark={isDark}
                        user={user}
                        currentView={currentView}
                        navigate={navigate}
                        onDetailClick={() => {
                          if (navigateTo) {
                            navigate(navigateTo);
                          }
                        }}
                      />
                    </div>
                  </Suspense>
                </WidgetWrapper>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Widget Library Modal */}
      {showLibrary && <WidgetLibrary onClose={() => setShowLibrary(false)} />}

      {/* Widget Detail Modal */}
      {selectedWidgetId && (
        <WidgetDetailModal
          widgetId={selectedWidgetId}
          isDark={isDark}
          onClose={() => setSelectedWidgetId(null)}
          navigate={navigate}
        />
      )}
    </div>
  );
};
