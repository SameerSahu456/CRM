import React from 'react';
import {
  LayoutDashboard, Users, Briefcase, BarChart3, Settings, Contact, LogOut, Hexagon, Building2,
  CheckSquare, Calendar, Megaphone, Ticket, Mail, FileText, TrendingUp, X
} from 'lucide-react';
import { NavigationItem } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeTab: NavigationItem;
  setActiveTab: (tab: NavigationItem) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface MenuSection {
  title: string;
  items: { id: NavigationItem; label: string; icon: React.ReactNode; badge?: number }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen = false, onClose }) => {
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const menuSections: MenuSection[] = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      ]
    },
    {
      title: 'Sales',
      items: [
        { id: 'leads', label: 'Leads', icon: <Users size={20} />, badge: 12 },
        { id: 'contacts', label: 'Contacts', icon: <Contact size={20} /> },
        { id: 'accounts', label: 'Accounts', icon: <Building2 size={20} /> },
        { id: 'deals', label: 'Deals', icon: <Briefcase size={20} />, badge: 5 },
      ]
    },
    {
      title: 'Activities',
      items: [
        { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={20} />, badge: 8 },
        { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
        { id: 'email', label: 'Email', icon: <Mail size={20} />, badge: 3 },
      ]
    },
    // Marketing & Support modules - commented out as not needed
    // {
    //   title: 'Marketing & Support',
    //   items: [
    //     { id: 'campaigns', label: 'Campaigns', icon: <Megaphone size={20} /> },
    //     { id: 'tickets', label: 'Tickets', icon: <Ticket size={20} />, badge: 4 },
    //   ]
    // },
    {
      title: 'Insights',
      items: [
        { id: 'reports', label: 'Reports', icon: <FileText size={20} /> },
        { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={20} /> },
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
      ]
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden animate-backdrop"
          onClick={onClose}
        />
      )}

      <aside className={`fixed left-0 top-0 h-screen w-64 border-r flex flex-col z-40 shadow-soft transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-black border-zinc-900'
          : 'bg-white border-slate-200'
      } ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Brand */}
        <div className={`h-20 flex items-center justify-between px-8 border-b ${theme === 'dark' ? 'border-zinc-900' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-glow animate-pulse-glow transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Hexagon size={20} fill="currentColor" />
            </div>
            <span className={`font-brand font-bold text-xl tracking-wider uppercase transition-colors duration-300 group-hover:text-brand-600 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>COMPRINT</span>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className={`lg:hidden p-2 rounded-lg transition-all duration-200 hover:rotate-90 ${
              theme === 'dark' ? 'hover:bg-zinc-900 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X size={20} />
          </button>
        </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-4 overflow-y-auto">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title} className={`animate-fade-in ${sectionIndex > 0 ? 'mt-6' : ''}`} style={{ animationDelay: `${sectionIndex * 0.1}s` }}>
            <div className={`px-4 mb-2 text-xs font-semibold uppercase tracking-widest font-brand ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}`}>
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map((item, itemIndex) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ripple animate-slide-in-left ${
                    activeTab === item.id
                      ? theme === 'dark'
                        ? 'bg-zinc-900 text-brand-400 font-medium shadow-sm ring-1 ring-zinc-800'
                        : 'bg-brand-50 text-brand-600 font-medium shadow-sm ring-1 ring-brand-100'
                      : theme === 'dark'
                        ? 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 hover:translate-x-1'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'
                  }`}
                  style={{ animationDelay: `${(sectionIndex * 0.1) + (itemIndex * 0.05)}s`, opacity: 0 }}
                >
                  <span className={`transition-all duration-200 group-hover:scale-110 ${
                    activeTab === item.id
                      ? theme === 'dark' ? 'text-brand-400' : 'text-brand-600'
                      : theme === 'dark' ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-slate-400 group-hover:text-slate-600'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="font-display tracking-wide text-sm">{item.label}</span>
                  {item.badge && (
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full transition-transform group-hover:scale-110 ${
                      activeTab === item.id
                        ? theme === 'dark' ? 'bg-brand-900 text-brand-300' : 'bg-brand-100 text-brand-700'
                        : theme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {activeTab === item.id && !item.badge && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-600 shadow-glow badge-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile / Logout */}
      <div className={`p-4 border-t animate-fade-in ${theme === 'dark' ? 'border-zinc-900' : 'border-slate-100'}`} style={{ animationDelay: '0.5s' }}>
        {user && (
          <div className="mb-4 flex items-center gap-3 px-4 group cursor-pointer">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white shadow-md transition-transform duration-300 group-hover:scale-110 ${
                theme === 'dark' ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700'
              }`}>
                {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
              </div>
            )}
            <div className="flex flex-col">
              <span className={`text-sm font-bold font-display ${theme === 'dark' ? 'text-zinc-100' : 'text-slate-900'}`}>
                {user.firstName} {user.lastName}
              </span>
              <span className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>
                {user.role}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={signOut}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ripple ${
            theme === 'dark'
              ? 'text-zinc-400 hover:bg-red-950 hover:text-red-400'
              : 'text-slate-500 hover:bg-red-50 hover:text-red-600'
          }`}
        >
          <LogOut size={20} className="transition-transform duration-300 group-hover:-translate-x-1" />
          <span className="font-display font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
};