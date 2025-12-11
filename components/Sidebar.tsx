import React from 'react';
import {
  LayoutDashboard, Users, Briefcase, BarChart3, Settings, Contact, LogOut, Hexagon, Building2,
  CheckSquare, Calendar, Megaphone, Ticket, Mail, FileText, TrendingUp
} from 'lucide-react';
import { NavigationItem } from '../types';

interface SidebarProps {
  activeTab: NavigationItem;
  setActiveTab: (tab: NavigationItem) => void;
}

interface MenuSection {
  title: string;
  items: { id: NavigationItem; label: string; icon: React.ReactNode; badge?: number }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
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
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-20 shadow-soft transition-all duration-300">
      {/* Brand */}
      <div className="h-20 flex items-center px-8 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-glow">
            <Hexagon size={20} fill="currentColor" />
          </div>
          <span className="font-brand font-bold text-xl tracking-wider text-slate-900 uppercase">ZENITH</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-4 overflow-y-auto">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
            <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-widest font-brand">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                    activeTab === item.id
                      ? 'bg-brand-50 text-brand-600 font-medium shadow-sm ring-1 ring-brand-100'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={`transition-colors duration-200 ${activeTab === item.id ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {item.icon}
                  </span>
                  <span className="font-display tracking-wide text-sm">{item.label}</span>
                  {item.badge && (
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      activeTab === item.id
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {activeTab === item.id && !item.badge && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-600 shadow-glow" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile / Logout */}
      <div className="p-4 border-t border-slate-100">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors">
          <LogOut size={20} />
          <span className="font-display font-medium">Sign Out</span>
        </button>
        <div className="mt-4 flex items-center gap-3 px-4">
          <img 
            src="https://picsum.photos/100/100" 
            alt="User" 
            className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 font-display">Sarah Jenkins</span>
            <span className="text-xs text-slate-500">Sales Manager</span>
          </div>
        </div>
      </div>
    </aside>
  );
};