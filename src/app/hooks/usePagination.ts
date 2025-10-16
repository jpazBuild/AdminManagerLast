"use client";
import { useEffect, useMemo, useState } from "react";

export type UsePaginationReturn<T> = {
  page: number;
  setPage: (n: number) => void;
  pageSize: number;
  setPageSize: (n: number) => void;
  totalItems: number;
  totalPages: number;
  start: number;
  end: number;
  items: T[];
};

export function usePagination<T>(source: T[], initialPageSize = 10): UsePaginationReturn<T> {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  const totalItems = source.length;
  const totalPages = Math.max(1, Math.ceil((totalItems || 0) / Math.max(1, pageSize || 1)));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, totalItems);

  const items = useMemo(() => source.slice(start, end), [source, start, end]);

  return { page, setPage, pageSize, setPageSize, totalItems, totalPages, start, end, items };
}
