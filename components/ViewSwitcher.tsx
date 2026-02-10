import React from 'react';
import { ChevronDown, Briefcase, Handshake, LayoutGrid } from 'lucide-react';
import { useView } from '../contexts/ViewContext';
import { useTheme } from '../contexts/ThemeContext';

export const ViewSwitcher: React.FC = () => {
  const { currentView, setCurrentView, canSwitchView } = useView();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = React.useState(false);

  if (!canSwitchView) return null; // Don't show if user can't switch

  const views = [
    { value: 'both' as const, label: 'All Views', icon: LayoutGrid, description: 'Pre-Sales + Post-Sales' },
    { value: 'presales' as const, label: 'Pre-Sales', icon: Briefcase, description: 'Leads, Accounts, Contacts, Deals' },
    { value: 'postsales' as const, label: 'Post-Sales', icon: Handshake, description: 'Sales Entry, Partners' },
  ];

  const currentViewData = views.find(v => v.value === currentView) || views[0];
  const Icon = currentViewData.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          isDark
            ? 'bg-dark-100 hover:bg-dark-200 text-white border border-zinc-800'
            : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-sm'
        }`}
      >
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{currentViewData.label}</span>
        <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div
            className={`absolute top-full left-0 mt-2 w-full min-w-[240px] rounded-xl shadow-lg border z-50 overflow-hidden ${
              isDark ? 'bg-dark-50 border-zinc-800' : 'bg-white border-slate-200'
            }`}
          >
            {views.map((view) => {
              const ViewIcon = view.icon;
              const isSelected = currentView === view.value;
              return (
                <button
                  key={view.value}
                  onClick={() => {
                    setCurrentView(view.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 flex items-start gap-3 transition-all text-left ${
                    isSelected
                      ? isDark
                        ? 'bg-brand-600/20 border-l-2 border-brand-500'
                        : 'bg-brand-50 border-l-2 border-brand-500'
                      : isDark
                      ? 'hover:bg-dark-100'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? isDark
                          ? 'bg-brand-600/30 text-brand-400'
                          : 'bg-brand-100 text-brand-600'
                        : isDark
                        ? 'bg-dark-100 text-zinc-400'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <ViewIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-semibold mb-0.5 ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {view.label}
                    </div>
                    <div
                      className={`text-xs truncate ${
                        isDark ? 'text-zinc-500' : 'text-slate-500'
                      }`}
                    >
                      {view.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${isDark ? 'bg-brand-500' : 'bg-brand-600'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
