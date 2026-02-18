import { useState, useCallback, useRef, useEffect } from 'react';

interface UseColumnResizeOptions {
  /** Initial widths in px for each column */
  initialWidths: number[];
  /** Minimum column width in px (default: 40) */
  minWidth?: number;
}

export function useColumnResize({ initialWidths, minWidth = 40 }: UseColumnResizeOptions) {
  const [colWidths, setColWidths] = useState<number[]>(initialWidths);
  const dragRef = useRef<{ colIndex: number; startX: number; startWidth: number } | null>(null);

  const onMouseDown = useCallback(
    (colIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = {
        colIndex,
        startX: e.clientX,
        startWidth: colWidths[colIndex],
      };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [colWidths],
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { colIndex, startX, startWidth } = dragRef.current;
      const delta = e.clientX - startX;
      const newWidth = Math.max(minWidth, startWidth + delta);
      setColWidths(prev => {
        const next = [...prev];
        next[colIndex] = newWidth;
        return next;
      });
    };

    const onMouseUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [minWidth]);

  return { colWidths, onMouseDown };
}
