import { useState, useMemo } from 'react';

export function useMiniPagination<T>(items: T[], pageSize = 5) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safeP = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => items.slice((safeP - 1) * pageSize, safeP * pageSize),
    [items, safeP, pageSize],
  );
  return { page: safeP, setPage, totalPages, pageItems, totalItems: items.length };
}
