import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface WidgetWrapperProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ id, children, className }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative group rounded-2xl ${className || ''}`}>
      {/* Drag Handle — left side, inside card padding */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-5 z-10 p-1 rounded-lg cursor-grab active:cursor-grabbing opacity-40 hover:opacity-100 transition-opacity touch-none"
      >
        <GripVertical className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
      </div>

      {/* Widget Content */}
      {children}
    </div>
  );
};
