import React from 'react';
import { X, Eye, EyeOff, RotateCcw, Loader2 } from 'lucide-react';
import { WIDGET_REGISTRY } from '@/config/widgetRegistry';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { Modal } from '@/components/ui';

interface WidgetLibraryProps {
  onClose: () => void;
}

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({ onClose }) => {
  const {
    accessibleWidgets,
    isWidgetVisible,
    toggleVisibility,
    resetToDefaults,
    isSaving,
  } = useDashboardLayout();

  // Group widgets by category
  const categories = [
    { key: 'presales', label: 'Pre-Sales' },
    { key: 'postsales', label: 'Post-Sales' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'both', label: 'Common' },
  ];

  return (
    <Modal open={true} onClose={onClose} size="2xl" raw>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between bg-white/70 backdrop-blur-xl border-gray-100 dark:bg-zinc-900 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Dashboard Widgets
          </h2>
          <p className="text-sm mt-1 text-gray-500 dark:text-zinc-400">
            Customize which analytics cards appear on your dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-600 hover:text-gray-900 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button onClick={onClose} className="group p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer">
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {categories.map(category => {
          const widgets = Object.values(WIDGET_REGISTRY).filter(w => w.category === category.key);
          if (widgets.length === 0) return null;

          return (
            <div key={category.key}>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 text-gray-400 dark:text-zinc-500">
                {category.label}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {widgets.map(widget => (
                  <div
                    key={widget.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isWidgetVisible(widget.id)
                        ? 'bg-gray-50 border-gray-200 dark:bg-zinc-800/50 dark:border-zinc-700'
                        : 'bg-gray-50/50 border-gray-200/50 opacity-60 dark:bg-zinc-800/30 dark:border-zinc-700/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                          {widget.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {widget.label}
                          </h4>
                          <p className="text-sm mt-1 text-gray-500 dark:text-zinc-400">
                            {widget.description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleVisibility(widget.id)}
                        className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                          isWidgetVisible(widget.id)
                            ? 'text-brand-600 hover:bg-brand-100'
                            : 'text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {isWidgetVisible(widget.id) ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 px-6 py-4 border-t flex items-center justify-between bg-gray-50 border-gray-100 dark:bg-zinc-900 dark:border-zinc-800">
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          {accessibleWidgets.filter(w => isWidgetVisible(w.id)).length} of {accessibleWidgets.length} widgets visible
        </p>
        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </div>
        )}
      </div>
    </Modal>
  );
};
