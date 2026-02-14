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
            ? 'bg-[rgba(8,14,30,0.6)] hover:bg-[rgba(10,18,38,0.7)] text-white border border-white/[0.07]'
            : 'bg-white/50 hover:bg-white/70 text-slate-900 border border-white/50 shadow-sm backdrop-blur-md'
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
            className={`absolute top-full left-0 mt-2 w-full min-w-[240px] rounded-xl border z-50 overflow-hidden animate-scale-in ${
              isDark ? 'bg-[rgba(5,10,22,0.94)] border-white/[0.07] backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5),_0_0_1px_rgba(255,255,255,0.06)]' : 'bg-white/70 border-white/50 backdrop-blur-2xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)]'
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
                      ? 'hover:bg-white/[0.04]'
                      : 'hover:bg-white/40'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? isDark
                          ? 'bg-brand-600/30 text-brand-400'
                          : 'bg-brand-100 text-brand-600'
                        : isDark
                        ? 'bg-white/[0.04] text-zinc-400'
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
