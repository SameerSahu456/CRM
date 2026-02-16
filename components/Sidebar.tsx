import React from 'react';
import {
  LayoutDashboard, ShoppingCart, Target, Shield as ShieldIcon,
  Settings, LogOut, X, Building2, Contact, Handshake,
  BarChart3, Package, Wallet
} from 'lucide-react';
import { NavigationItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useView } from '../contexts/ViewContext';
import { useNavigation } from '../contexts/NavigationContext';
import { ViewSwitcher } from './ViewSwitcher';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: NavigationItem;
  label: string;
  icon: React.ReactNode;
  section: string;
  roles?: string[];
  view?: 'presales' | 'postsales' | 'both'; // Which view this item belongs to
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, section: 'Overview', view: 'both' },
  // Post-Sales items
  { id: 'sales-entry', label: 'Sales Entry', icon: <ShoppingCart className="w-4 h-4" />, section: 'Post-Sales', view: 'postsales' },
  { id: 'collections', label: 'Collections', icon: <Wallet className="w-4 h-4" />, section: 'Post-Sales', view: 'postsales' },
  // Pre-Sales items
  { id: 'leads', label: 'Leads', icon: <Target className="w-4 h-4" />, section: 'Pre-Sales', view: 'presales' },
  { id: 'deals', label: 'Deals', icon: <Handshake className="w-4 h-4" />, section: 'Pre-Sales', view: 'presales' },
  { id: 'accounts', label: 'Accounts', icon: <Building2 className="w-4 h-4" />, section: 'Pre-Sales', view: 'presales' },
  { id: 'contacts', label: 'Contacts', icon: <Contact className="w-4 h-4" />, section: 'Pre-Sales', view: 'presales' },
  // Post-Sales items (continued)
  { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" />, section: 'Inventory', view: 'both' },
  // Tools (available in both views)
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" />, section: 'Tools', view: 'both' },
  // System (available in both views)
  { id: 'admin', label: 'Admin', icon: <ShieldIcon className="w-4 h-4" />, section: 'System', roles: ['admin', 'superadmin'], view: 'both' },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, section: 'System', view: 'both' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab } = useNavigation();
  const { signOut, user } = useAuth();
  const { theme } = useTheme();
  const { currentView } = useView();

  const sections = ['Overview', 'Pre-Sales', 'Post-Sales', 'Inventory', 'Tools', 'System'];

  const filteredItems = navItems.filter(item => {
    // Filter by role
    if (item.roles && user) {
      if (!item.roles.includes(user.role)) return false;
    }

    // Filter by view
    if (item.view) {
      if (item.view === 'both') return true;
      if (currentView === 'both') return true;
      return item.view === currentView;
    }

    return true;
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden animate-backdrop" onClick={onClose} />
      )}

      <aside className={`fixed top-0 left-0 z-50 h-[100dvh] flex flex-col overflow-hidden sidebar-premium border-r transition-all duration-300 ${
        theme === 'dark' ? 'border-white/[0.06]' : 'border-slate-200'
      } ${
        isOpen
          ? 'w-[72vw] sm:w-64 translate-x-0'
          : '-translate-x-full md:translate-x-0 md:w-16 lg:w-64'
      }`}>

        {/* Brand */}
        <div className={`h-14 sm:h-16 flex-shrink-0 flex items-center justify-between px-4 sm:px-5 border-b ${
          theme === 'dark' ? 'border-white/[0.06]' : 'border-slate-200'
        }`}>
          <button
            onClick={() => { setActiveTab('dashboard'); onClose(); }}
            className="flex items-center cursor-pointer overflow-hidden"
          >
            <div className="comprint-logo text-[22px]">
              <span className={`${!isOpen ? 'hidden lg:inline' : ''} ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>COMPRINT</span>
              <span className={`comprint-dot ${!isOpen ? 'md:ml-0' : ''} ${
                theme === 'dark' ? 'bg-brand-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]' : 'bg-slate-900 shadow-sm'
              }`} />
            </div>
          </button>
          <button onClick={onClose} className={`md:hidden p-1.5 rounded-lg transition-colors ${
            theme === 'dark' ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher — hidden in collapsed mode */}
        <div className={`px-3 py-3 flex-shrink-0 border-b ${!isOpen ? 'hidden lg:block' : ''} ${
          theme === 'dark' ? 'border-white/[0.06]' : 'border-slate-200'
        }`}>
          <ViewSwitcher />
        </div>

        {/* Navigation */}
        <nav className={`flex-1 min-h-0 overflow-y-auto py-4 ${isOpen ? 'px-3' : 'px-1 md:px-1 lg:px-3'}`}>
          {sections.map(section => {
            const sectionItems = filteredItems.filter(item => item.section === section);
            if (sectionItems.length === 0) return null;
            return (
              <div key={section} className="mb-4">
                {/* Section label — hidden in collapsed mode */}
                <p className={`px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider ${
                  !isOpen ? 'hidden lg:block' : ''
                } ${
                  theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'
                }`}>{section}</p>
                {sectionItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); onClose(); }}
                    title={item.label}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                      !isOpen ? 'md:justify-center lg:justify-start' : ''
                    } ${
                      activeTab === item.id
                        ? theme === 'dark'
                          ? 'bg-brand-600/15 text-brand-400 shadow-[0_0_20px_rgba(99,102,241,0.15)] border border-brand-500/25 backdrop-blur-sm'
                          : 'bg-brand-50/70 text-brand-700 shadow-sm border border-brand-100/60 backdrop-blur-sm'
                        : theme === 'dark'
                          ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 border border-transparent'
                    }`}
                  >
                    <span className={`flex-shrink-0 transition-transform ${activeTab === item.id ? 'scale-110' : ''}`}>
                      {item.icon}
                    </span>
                    <span className={`${!isOpen ? 'hidden lg:inline' : ''}`}>{item.label}</span>
                    {activeTab === item.id && (
                      <span className={`ml-auto w-1.5 h-1.5 rounded-full ${!isOpen ? 'hidden lg:block' : ''} ${
                        theme === 'dark' ? 'bg-brand-400 shadow-[0_0_6px_rgba(129,140,248,0.6)]' : 'bg-brand-600'
                      }`} />
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className={`flex-shrink-0 p-3 sm:p-4 border-t safe-area-bottom ${theme === 'dark' ? 'border-white/[0.06]' : 'border-slate-200'}`}>
          {user && (
            <div className={`flex items-center gap-3 mb-3 px-2 ${!isOpen ? 'md:justify-center lg:justify-start' : ''} ${
              theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'
            }`}>
              <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/30 dark:to-brand-800/20 flex items-center justify-center text-brand-600 dark:text-brand-400 text-sm font-bold ring-2 ring-brand-200/50 dark:ring-brand-500/20">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className={`min-w-0 flex-1 ${!isOpen ? 'hidden lg:block' : ''}`}>
                <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{user.name}</p>
                <p className="text-xs truncate capitalize">{user.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={signOut}
            title="Sign Out"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
              !isOpen ? 'md:justify-center lg:justify-start' : ''
            } ${
              theme === 'dark'
                ? 'text-red-400 hover:bg-red-900/20'
                : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className={`${!isOpen ? 'hidden lg:inline' : ''}`}>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
