import React from 'react';
import { Bell, Sun, Moon, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-30 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6 border-b ${
      isDark
        ? 'bg-[rgba(5,10,21,0.75)] border-white/[0.05]'
        : 'bg-white/80 border-slate-200/80 backdrop-blur-xl'
    }`}>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onMenuClick}
          className={`lg:hidden p-2.5 -ml-1 rounded-xl transition-all active:scale-95 ${
            isDark ? 'hover:bg-white/[0.06] text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-base sm:text-lg font-semibold font-display tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-xl transition-all active:scale-95 ${
            isDark
              ? 'text-zinc-400 hover:text-amber-400 hover:bg-white/[0.06]'
              : 'text-slate-500 hover:text-brand-600 hover:bg-slate-100'
          }`}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        {/* Notifications */}
        <button className={`relative p-2.5 rounded-xl transition-all active:scale-95 ${
          isDark
            ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
        }`}>
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-dark-50" />
        </button>

        {/* User avatar */}
        {user && (
          <div className={`flex items-center gap-2.5 ml-2 pl-3 border-l ${
            isDark ? 'border-white/[0.06]' : 'border-slate-200'
          }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-transform hover:scale-105 ${
              isDark
                ? 'bg-gradient-to-br from-brand-600/30 to-brand-800/30 text-brand-400 ring-1 ring-brand-500/20'
                : 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm'
            }`}>
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block">
              <p className={`text-sm font-medium leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {user.name}
              </p>
              <p className={`text-[11px] leading-tight capitalize ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                {user.role}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
