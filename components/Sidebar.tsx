import React from 'react';
import {
  LayoutDashboard, ShoppingCart, Users, Target, FileText, Shield as ShieldIcon,
  Settings, LogOut, X, Hexagon, Package, Building2, Contact, Handshake,
  CheckSquare, Calendar, Mail, BarChart3
} from 'lucide-react';
import { NavigationItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  activeTab: NavigationItem;
  setActiveTab: (tab: NavigationItem) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: NavigationItem;
  label: string;
  icon: React.ReactNode;
  section: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, section: 'Overview' },
  { id: 'sales-entry', label: 'Sales Entry', icon: <ShoppingCart className="w-4 h-4" />, section: 'Sales' },
  { id: 'partners', label: 'Partners', icon: <Users className="w-4 h-4" />, section: 'Sales' },
  { id: 'crm', label: 'CRM / Leads', icon: <Target className="w-4 h-4" />, section: 'Sales' },
  { id: 'accounts', label: 'Accounts', icon: <Building2 className="w-4 h-4" />, section: 'Sales' },
  { id: 'contacts', label: 'Contacts', icon: <Contact className="w-4 h-4" />, section: 'Sales' },
  { id: 'deals', label: 'Deals', icon: <Handshake className="w-4 h-4" />, section: 'Sales' },
  { id: 'quote-builder', label: 'Quote Builder', icon: <FileText className="w-4 h-4" />, section: 'Tools' },
  { id: 'carepacks', label: 'Carepack Tracker', icon: <Package className="w-4 h-4" />, section: 'Tools' },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-4 h-4" />, section: 'Tools' },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" />, section: 'Tools' },
  { id: 'emails', label: 'Emails', icon: <Mail className="w-4 h-4" />, section: 'Tools' },
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" />, section: 'Tools' },
  { id: 'admin', label: 'Admin', icon: <ShieldIcon className="w-4 h-4" />, section: 'System', roles: ['admin', 'superadmin'] },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, section: 'System' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { signOut, user } = useAuth();
  const { theme } = useTheme();

  const sections = ['Overview', 'Sales', 'Tools', 'System'];

  const filteredItems = navItems.filter(item => {
    if (item.roles && user) {
      return item.roles.includes(user.role);
    }
    return true;
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden animate-backdrop" onClick={onClose} />
      )}

      <aside className={`fixed top-0 left-0 z-50 h-full w-[72vw] sm:w-64 sidebar-premium border-r transition-transform duration-300 ${
        theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'
      } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Brand */}
        <div className={`h-14 sm:h-16 flex items-center justify-between px-4 sm:px-5 border-b ${
          theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-brand-500 to-brand-700 shadow-dark-glow'
                : 'bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow'
            }`}>
              <Hexagon className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className={`font-bold font-brand text-[17px] leading-tight block ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>Comprint</span>
              <span className={`text-[10px] font-medium tracking-[0.15em] uppercase leading-tight ${
                theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'
              }`}>CRM Platform</span>
            </div>
          </div>
          <button onClick={onClose} className={`lg:hidden p-1.5 rounded-lg transition-colors ${
            theme === 'dark' ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {sections.map(section => {
            const sectionItems = filteredItems.filter(item => item.section === section);
            if (sectionItems.length === 0) return null;
            return (
              <div key={section} className="mb-4">
                <p className={`px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider ${
                  theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'
                }`}>{section}</p>
                {sectionItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); onClose(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                      activeTab === item.id
                        ? theme === 'dark'
                          ? 'bg-brand-600/15 text-brand-400 shadow-inner-glow'
                          : 'bg-brand-50 text-brand-700 shadow-sm'
                        : theme === 'dark'
                          ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`transition-transform ${activeTab === item.id ? 'scale-110' : ''}`}>
                      {item.icon}
                    </span>
                    {item.label}
                    {activeTab === item.id && (
                      <span className={`ml-auto w-1.5 h-1.5 rounded-full ${
                        theme === 'dark' ? 'bg-brand-400' : 'bg-brand-600'
                      }`} />
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className={`p-3 sm:p-4 border-t safe-area-bottom ${theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'}`}>
          {user && (
            <div className={`flex items-center gap-3 mb-3 px-2 ${
              theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'
            }`}>
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 text-sm font-bold">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{user.name}</p>
                <p className="text-xs truncate capitalize">{user.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={signOut}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
              theme === 'dark'
                ? 'text-red-400 hover:bg-red-900/20'
                : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};
