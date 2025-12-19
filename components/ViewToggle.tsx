import React from 'react';
import { List, LayoutGrid } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export type ViewMode = 'list' | 'kanban';

interface ViewToggleProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ view, onViewChange }) => {
  const { theme } = useTheme();

  return (
    <div className={`flex rounded-lg p-1 ${theme === 'dark' ? 'bg-zinc-900' : 'bg-slate-100'}`}>
      <button
        onClick={() => onViewChange('list')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          view === 'list'
            ? theme === 'dark'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm'
              : 'bg-white text-slate-900 shadow-sm'
            : theme === 'dark'
              ? 'text-zinc-500 hover:text-zinc-300'
              : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <List size={16} />
        List
      </button>
      <button
        onClick={() => onViewChange('kanban')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          view === 'kanban'
            ? theme === 'dark'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm'
              : 'bg-white text-slate-900 shadow-sm'
            : theme === 'dark'
              ? 'text-zinc-500 hover:text-zinc-300'
              : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <LayoutGrid size={16} />
        Kanban
      </button>
    </div>
  );
};
