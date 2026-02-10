import React, { useMemo } from 'react';
import { X, Eye, EyeOff, RotateCcw, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { WIDGET_REGISTRY } from '../config/widgetRegistry';
import { useDashboardLayout } from '../hooks/useDashboardLayout';

interface WidgetLibraryProps {
  onClose: () => void;
}

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl animate-fade-in-up ${isDark ? 'bg-dark-50 border border-zinc-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between ${isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'}`}>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Dashboard Widgets
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Customize which analytics cards appear on your dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-100 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'}`}
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-dark-100' : 'hover:bg-slate-100'}`}>
              <X className={`w-5 h-5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {categories.map(category => {
            const widgets = Object.values(WIDGET_REGISTRY).filter(w => w.category === category.key);
            if (widgets.length === 0) return null;

            return (
              <div key={category.key}>
                <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  {category.label}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {widgets.map(widget => (
                    <div
                      key={widget.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isWidgetVisible(widget.id)
                          ? isDark
                            ? 'bg-dark-100 border-zinc-800'
                            : 'bg-slate-50 border-slate-200'
                          : isDark
                          ? 'bg-dark-100/50 border-zinc-800/50 opacity-60'
                          : 'bg-slate-50/50 border-slate-200/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-brand-900/30 text-brand-400' : 'bg-brand-100 text-brand-600'}`}>
                            {widget.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {widget.label}
                            </h4>
                            <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                              {widget.description}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleVisibility(widget.id)}
                          className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                            isWidgetVisible(widget.id)
                              ? 'text-brand-600 hover:bg-brand-100'
                              : 'text-slate-400 hover:bg-slate-200'
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
        <div className={`sticky bottom-0 px-6 py-4 border-t flex items-center justify-between ${isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'}`}>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            {accessibleWidgets.filter(w => isWidgetVisible(w.id)).length} of {accessibleWidgets.length} widgets visible
          </p>
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
