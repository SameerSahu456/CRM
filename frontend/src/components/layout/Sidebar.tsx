import React from 'react';
import {
  LayoutDashboard, ShoppingCart, Target, Shield as ShieldIcon,
  Settings, LogOut, X, Building2, Contact, Handshake,
  BarChart3, Package, Wallet, CheckSquare, CalendarDays, Video
} from 'lucide-react';
import { NavigationItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useView } from '@/contexts/ViewContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { ViewSwitcher } from '@/components/common/ViewSwitcher';
import { cx } from '@/utils/cx';

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
  view?: 'presales' | 'postsales' | 'both';
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, section: 'Overview', view: 'both' },
  { id: 'sales-entry', label: 'Sales Entry', icon: <ShoppingCart className="w-4 h-4" />, section: 'Post-Sales', view: 'postsales' },
  { id: 'leads', label: 'Leads', icon: <Target className="w-4 h-4" />, section: 'Pre-Sales', view: 'presales' },
  { id: 'deals', label: 'Deals', icon: <Handshake className="w-4 h-4" />, section: 'Pre-Sales', view: 'presales' },
  { id: 'accounts', label: 'Accounts', icon: <Building2 className="w-4 h-4" />, section: 'Pre-Sales', view: 'presales' },
  { id: 'contacts', label: 'Contacts', icon: <Contact className="w-4 h-4" />, section: 'Pre-Sales', view: 'presales' },
  { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" />, section: 'Inventory', view: 'both' },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-4 h-4" />, section: 'Tools', view: 'both' },
  { id: 'calendar', label: 'Calendar', icon: <CalendarDays className="w-4 h-4" />, section: 'Tools', view: 'both' },
  { id: 'meetings', label: 'Meetings', icon: <Video className="w-4 h-4" />, section: 'Tools', view: 'both' },
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" />, section: 'Tools', view: 'both' },
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
    if (item.roles && user) {
      if (!item.roles.includes(user.role)) return false;
    }
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

      <aside className={cx(
        'fixed top-0 left-0 z-50 h-[100dvh] flex flex-col overflow-hidden sidebar-premium border-r transition-all duration-300',
        'border-gray-200 dark:border-white/[0.06]',
        isOpen
          ? 'w-[72vw] sm:w-64 translate-x-0'
          : '-translate-x-full md:translate-x-0 md:w-16 lg:w-64'
      )}>

        {/* Brand */}
        <div className={cx(
          'h-14 sm:h-16 flex-shrink-0 flex items-center justify-between px-4 sm:px-5 border-b',
          'border-gray-200 dark:border-white/[0.06]'
        )}>
          <button
            onClick={() => { setActiveTab('dashboard'); onClose(); }}
            className="flex items-center cursor-pointer overflow-hidden"
          >
            <div className="comprint-logo text-[22px]">
              <span className={cx(
                !isOpen ? 'hidden lg:inline' : '',
                'text-gray-900 dark:text-white'
              )}>COMPRINT</span>
              <span className={cx(
                'comprint-dot',
                !isOpen ? 'md:ml-0' : '',
                'bg-gray-900 shadow-sm dark:bg-brand-400 dark:shadow-[0_0_10px_rgba(129,140,248,0.5)]'
              )} />
            </div>
          </button>
          <button onClick={onClose} className={cx(
            'md:hidden p-1.5 rounded-lg transition-colors',
            'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
            'dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800'
          )}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher */}
        <div className={cx(
          'px-3 py-3 flex-shrink-0 border-b',
          !isOpen ? 'hidden lg:block' : '',
          'border-gray-200 dark:border-white/[0.06]'
        )}>
          <ViewSwitcher />
        </div>

        {/* Navigation */}
        <nav className={cx('flex-1 min-h-0 overflow-y-auto py-4', isOpen ? 'px-3' : 'px-1 md:px-1 lg:px-3')}>
          {sections.map(section => {
            const sectionItems = filteredItems.filter(item => item.section === section);
            if (sectionItems.length === 0) return null;
            return (
              <div key={section} className="mb-4">
                <p className={cx(
                  'px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider',
                  !isOpen ? 'hidden lg:block' : '',
                  'text-gray-400 dark:text-zinc-500'
                )}>{section}</p>
                {sectionItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); onClose(); }}
                    title={item.label}
                    className={cx(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98]',
                      !isOpen ? 'md:justify-center lg:justify-start' : '',
                      activeTab === item.id
                        ? cx(
                            'bg-brand-50/70 text-brand-700 shadow-sm border border-brand-100/60 backdrop-blur-sm',
                            'dark:bg-brand-600/15 dark:text-brand-400 dark:shadow-[0_0_20px_rgba(99,102,241,0.15)] dark:border-brand-500/25 dark:backdrop-blur-sm'
                          )
                        : cx(
                            'text-gray-600 hover:text-gray-900 hover:bg-white/40 border border-transparent',
                            'dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-white/[0.04]'
                          )
                    )}
                  >
                    <span className={cx('flex-shrink-0 transition-transform', activeTab === item.id ? 'scale-110' : '')}>
                      {item.icon}
                    </span>
                    <span className={!isOpen ? 'hidden lg:inline' : ''}>{item.label}</span>
                    {activeTab === item.id && (
                      <span className={cx(
                        'ml-auto w-1.5 h-1.5 rounded-full',
                        !isOpen ? 'hidden lg:block' : '',
                        'bg-brand-600 dark:bg-brand-400 dark:shadow-[0_0_6px_rgba(129,140,248,0.6)]'
                      )} />
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className={cx(
          'flex-shrink-0 p-3 sm:p-4 border-t safe-area-bottom',
          'border-gray-200 dark:border-white/[0.06]'
        )}>
          {user && (
            <div className={cx(
              'flex items-center gap-3 mb-3 px-2',
              !isOpen ? 'md:justify-center lg:justify-start' : '',
              'text-gray-600 dark:text-zinc-400'
            )}>
              <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/30 dark:to-brand-800/20 flex items-center justify-center text-brand-600 dark:text-brand-400 text-sm font-bold ring-2 ring-brand-200/50 dark:ring-brand-500/20">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className={cx('min-w-0 flex-1', !isOpen ? 'hidden lg:block' : '')}>
                <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-xs truncate capitalize">{user.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={signOut}
            title="Sign Out"
            className={cx(
              'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all',
              !isOpen ? 'md:justify-center lg:justify-start' : '',
              'text-error-600 hover:bg-error-50',
              'dark:text-red-400 dark:hover:bg-red-900/20'
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className={!isOpen ? 'hidden lg:inline' : ''}>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
