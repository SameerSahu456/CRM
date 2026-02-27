import React from 'react';
import { Sun, Moon, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cx } from '@/utils/cx';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={cx(
      'sticky top-0 z-30 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6 border-b',
      'bg-white/60 border-gray-200/60 backdrop-blur-xl',
      'dark:bg-[rgba(3,7,18,0.8)] dark:border-white/[0.05]'
    )}>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onMenuClick}
          className={cx(
            'md:hidden p-2.5 -ml-1 rounded-xl transition-all active:scale-95',
            'hover:bg-gray-100 text-gray-500',
            'dark:hover:bg-white/[0.06] dark:text-zinc-400'
          )}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className={cx(
            'text-base sm:text-lg font-semibold font-display tracking-tight',
            'text-gray-900 dark:text-white'
          )}>{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cx(
            'p-2.5 rounded-xl transition-all active:scale-95',
            'text-gray-500 hover:text-brand-600 hover:bg-gray-100',
            'dark:text-zinc-400 dark:hover:text-amber-400 dark:hover:bg-amber-500/[0.08] dark:hover:shadow-[0_0_12px_rgba(251,191,36,0.1)]'
          )}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        {/* User avatar */}
        {user && (
          <div className={cx(
            'flex items-center gap-2.5 ml-2 pl-3 border-l',
            'border-gray-200 dark:border-white/[0.06]'
          )}>
            <div className={cx(
              'w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-transform hover:scale-105',
              'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm',
              'dark:from-brand-600/30 dark:to-brand-800/30 dark:text-brand-400 dark:ring-1 dark:ring-brand-500/25 brand-dot-glow'
            )}>
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium leading-tight text-gray-900 dark:text-white">
                {user.name}
              </p>
              <p className="text-[11px] leading-tight capitalize text-gray-400 dark:text-zinc-500">
                {user.role}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
