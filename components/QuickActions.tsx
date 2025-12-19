import React, { useState, useRef, useEffect } from 'react';
import { Plus, Users, Contact, Building2, Briefcase, CheckSquare, Mail, Calendar, X, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '../contexts/NavigationContext';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  tab: string;
  description: string;
}

export const QuickActions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { setActiveTab } = useNavigation();
  const isDark = theme === 'dark';

  const actions: QuickAction[] = [
    {
      id: 'lead',
      label: 'New Lead',
      icon: <Users size={20} />,
      color: 'bg-blue-500 hover:bg-blue-600',
      tab: 'leads',
      description: 'Add a new sales lead'
    },
    {
      id: 'contact',
      label: 'New Contact',
      icon: <Contact size={20} />,
      color: 'bg-green-500 hover:bg-green-600',
      tab: 'contacts',
      description: 'Create a new contact'
    },
    {
      id: 'account',
      label: 'New Account',
      icon: <Building2 size={20} />,
      color: 'bg-purple-500 hover:bg-purple-600',
      tab: 'accounts',
      description: 'Add a company account'
    },
    {
      id: 'deal',
      label: 'New Deal',
      icon: <Briefcase size={20} />,
      color: 'bg-orange-500 hover:bg-orange-600',
      tab: 'deals',
      description: 'Create a new opportunity'
    },
    {
      id: 'task',
      label: 'New Task',
      icon: <CheckSquare size={20} />,
      color: 'bg-cyan-500 hover:bg-cyan-600',
      tab: 'tasks',
      description: 'Schedule a task'
    },
    {
      id: 'email',
      label: 'Compose Email',
      icon: <Mail size={20} />,
      color: 'bg-pink-500 hover:bg-pink-600',
      tab: 'email',
      description: 'Send an email'
    },
    {
      id: 'meeting',
      label: 'Schedule Meeting',
      icon: <Calendar size={20} />,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      tab: 'calendar',
      description: 'Book a meeting'
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAction = (action: QuickAction) => {
    setActiveTab(action.tab as any);
    setIsOpen(false);
    // The individual pages will handle showing their add/create modals
    // We trigger a custom event that pages can listen to
    window.dispatchEvent(new CustomEvent('quickAction', { detail: { action: action.id } }));
  };

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
      {/* Action Menu */}
      <div className={`absolute bottom-16 right-0 transition-all duration-300 ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        <div className={`rounded-2xl shadow-2xl border overflow-hidden ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          <div className={`px-4 py-3 border-b ${
            isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-100 bg-slate-50'
          }`}>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-brand-500" />
              <span className={`text-sm font-semibold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                Quick Actions
              </span>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {actions.map((action, index) => (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isDark
                    ? 'hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100'
                    : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                }`}
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white ${action.color} transition-transform group-hover:scale-110`}>
                  {action.icon}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                    {action.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-slate-700 hover:bg-slate-600 rotate-45'
            : 'bg-brand-600 hover:bg-brand-700 hover:scale-110'
        }`}
        style={{
          boxShadow: isOpen
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(59, 130, 246, 0.4)'
        }}
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <Plus size={24} className="text-white" />
        )}
      </button>

      {/* Keyboard shortcut hint */}
      {!isOpen && (
        <div className={`absolute -top-8 right-0 text-xs px-2 py-1 rounded-lg whitespace-nowrap transition-opacity ${
          isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'
        }`}>
          Press <kbd className="font-mono bg-slate-200 dark:bg-zinc-700 px-1 rounded">+</kbd> for quick add
        </div>
      )}
    </div>
  );
};
