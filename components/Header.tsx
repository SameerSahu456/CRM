import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, HelpCircle, X, CheckCircle2, Users, Briefcase, Mail, Calendar, AlertCircle, Clock, CheckCheck, Settings, ExternalLink, Loader2, Sun, Moon, Menu, LogOut, User, ChevronDown } from 'lucide-react';
import { notificationsApi } from '../services/api';
import { Notification } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'deal_won': return { icon: CheckCircle2, color: 'bg-green-100 text-green-600' };
    case 'deal_lost': return { icon: AlertCircle, color: 'bg-red-100 text-red-600' };
    case 'new_lead': return { icon: Users, color: 'bg-blue-100 text-blue-600' };
    case 'task_due': return { icon: Clock, color: 'bg-orange-100 text-orange-600' };
    case 'meeting_reminder': return { icon: Calendar, color: 'bg-purple-100 text-purple-600' };
    case 'email_received': return { icon: Mail, color: 'bg-cyan-100 text-cyan-600' };
    case 'mention': return { icon: Users, color: 'bg-brand-100 text-brand-600' };
    default: return { icon: Bell, color: 'bg-slate-100 text-slate-600' };
  }
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { setActiveTab } = useNavigation();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationsApi.getAll();
        setNotifications(data as Notification[]);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Mock search results
  const searchResults = searchQuery.length > 0 ? [
    { type: 'Lead', name: 'John Smith', subtitle: 'TechFlow Solutions', icon: Users },
    { type: 'Deal', name: 'Enterprise License', subtitle: '$45,000 - Proposal', icon: Briefcase },
    { type: 'Contact', name: 'Sarah Johnson', subtitle: 'VP Sales at DataSync', icon: Users },
  ].filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())) : [];

  return (
    <header className={`h-16 lg:h-20 backdrop-blur-md border-b sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between transition-all duration-300 ${
      theme === 'dark'
        ? 'bg-black/90 border-zinc-900'
        : 'bg-white/80 border-slate-200'
    }`}>
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className={`lg:hidden p-2 rounded-lg ${
            theme === 'dark'
              ? 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <Menu size={24} />
        </button>
        <h1 className={`text-lg lg:text-2xl font-display font-bold tracking-tight ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}>{title}</h1>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        {/* Global Search - hidden on mobile */}
        <div className="relative hidden md:block" ref={searchRef}>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search leads, deals, contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              className={`pl-10 pr-4 py-2 w-48 lg:w-80 border border-transparent rounded-lg text-sm placeholder-slate-400 outline-none transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-zinc-900 text-zinc-100 focus:bg-zinc-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20'
                  : 'bg-slate-50 text-slate-700 focus:bg-white focus:border-brand-200 focus:ring-4 focus:ring-brand-50'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showSearch && searchQuery.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
              {searchResults.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                        <result.icon size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{result.name}</p>
                        <p className="text-xs text-slate-500">{result.type} • {result.subtitle}</p>
                      </div>
                      <ExternalLink size={14} className="text-slate-400" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm text-slate-500">No results found for "{searchQuery}"</p>
                </div>
              )}
              <div className="p-2 bg-slate-50 border-t border-slate-100">
                <p className="text-xs text-slate-500 text-center">Press Enter to search all</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={`flex items-center gap-2 lg:gap-3 border-l pl-3 lg:pl-6 ${theme === 'dark' ? 'border-zinc-800' : 'border-slate-200'}`}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all ${
              theme === 'dark'
                ? 'text-yellow-400 hover:text-yellow-300 hover:bg-zinc-900'
                : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
            }`}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button className="hidden lg:block p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-all">
            <HelpCircle size={20} />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-full transition-all relative ${
                showNotifications ? 'text-brand-600 bg-brand-50' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
              }`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">Notifications</h3>
                    <p className="text-xs text-slate-500">{unreadCount} unread</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                    >
                      <CheckCheck size={14} /> Mark all read
                    </button>
                    <button className="p-1 text-slate-400 hover:text-slate-600">
                      <Settings size={16} />
                    </button>
                  </div>
                </div>

                {/* Notification List */}
                <div className="max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">Loading notifications...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell size={40} className="mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notifications.map((notification) => {
                        const { icon: Icon, color } = getNotificationIcon(notification.type);
                        return (
                          <div
                            key={notification.id}
                            className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer group ${
                              !notification.read ? 'bg-brand-50/50' : ''
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                                <Icon size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-sm ${!notification.read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                                    {notification.title}
                                  </p>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">{notification.message}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[10px] text-slate-400">{formatTime(notification.createdAt)}</span>
                                  {!notification.read && (
                                    <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-slate-100 bg-slate-50">
                  <button className="w-full text-center text-sm text-brand-600 hover:text-brand-700 font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-2 p-1.5 rounded-lg transition-all ${
                  showUserMenu
                    ? theme === 'dark'
                      ? 'bg-zinc-900'
                      : 'bg-slate-100'
                    : theme === 'dark'
                      ? 'hover:bg-zinc-900'
                      : 'hover:bg-slate-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  theme === 'dark'
                    ? 'bg-brand-600 text-white'
                    : 'bg-brand-100 text-brand-700'
                }`}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.firstName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <p className={`text-sm font-medium leading-tight ${
                    theme === 'dark' ? 'text-zinc-200' : 'text-slate-700'
                  }`}>
                    {user.firstName} {user.lastName}
                  </p>
                  <p className={`text-xs ${
                    theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'
                  }`}>
                    {user.role}
                  </p>
                </div>
                <ChevronDown size={16} className={`hidden lg:block ${
                  theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'
                }`} />
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className={`absolute top-full right-0 mt-2 w-64 rounded-xl shadow-xl border overflow-hidden z-50 ${
                  theme === 'dark'
                    ? 'bg-zinc-950 border-zinc-900'
                    : 'bg-white border-slate-200'
                }`}>
                  {/* User Info */}
                  <div className={`p-4 border-b ${
                    theme === 'dark' ? 'border-zinc-900' : 'border-slate-100'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium ${
                        theme === 'dark'
                          ? 'bg-brand-600 text-white'
                          : 'bg-brand-100 text-brand-700'
                      }`}>
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.firstName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          {user.firstName} {user.lastName}
                        </p>
                        <p className={`text-sm truncate ${
                          theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'
                        }`}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.role === 'Admin'
                          ? 'bg-purple-100 text-purple-700'
                          : user.role === 'Sales Manager'
                            ? 'bg-blue-100 text-blue-700'
                            : user.role === 'Sales Rep'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setActiveTab('settings');
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        theme === 'dark'
                          ? 'text-zinc-300 hover:bg-zinc-900'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <User size={18} />
                      My Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setActiveTab('settings');
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        theme === 'dark'
                          ? 'text-zinc-300 hover:bg-zinc-900'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Settings size={18} />
                      Settings
                    </button>
                  </div>

                  {/* Sign Out */}
                  <div className={`py-2 border-t ${
                    theme === 'dark' ? 'border-zinc-900' : 'border-slate-100'
                  }`}>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        theme === 'dark'
                          ? 'text-red-400 hover:bg-zinc-900'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
