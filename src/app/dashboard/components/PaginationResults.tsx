"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SearchField } from "@/app/components/SearchField";

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 50];

type PaginationResultsProps = {
  totalItems: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  page: number;
  setPage: (page: number) => void;
  className?: string;
  darkMode?: boolean;
};

const PaginationResults = ({
  totalItems,
  pageSize,
  setPageSize,
  page,
  setPage,
  className = "",
  darkMode = false,
}: PaginationResultsProps) => {
  const totalPages = Math.max(1, Math.ceil((totalItems || 0) / Math.max(1, pageSize || 1)));
  const clampedPage = Math.min(Math.max(page, 1), totalPages);
  const start = (clampedPage - 1) * pageSize;
  const end = Math.min(start + pageSize, totalItems);

  const options = useMemo(
    () => PAGE_SIZE_OPTIONS.map((opt) => ({ label: String(opt), value: String(opt) })),
    []
  );

  return (
    <div
      className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3 ${className} ${
        darkMode ? "text-white" : "text-primary"
      }`}
    >
      <div className="flex items-center gap-2">
        <label
          htmlFor="pageSize"
          className={`text-sm ${darkMode ? "text-white/80" : "text-primary/80"}`}
        >
          Items per page:
        </label>

        <SearchField
          placeholder="Items per page"
          value={String(pageSize)}
          options={options}
          onChange={(val) => {
            const next = Number(val) || 10;
            setPageSize(next);
            setPage(1);
          }}
          className="!w-18 h-8"
          widthComponent="w-22"
          showSearch={false}
          darkMode={darkMode}
        />

        <span className={`ml-3 text-sm ${darkMode ? "text-white/70" : "text-primary/80"}`}>
          Show {totalItems === 0 ? 0 : start + 1}–{end} of {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className={[
            "cursor-pointer flex gap-2 items-center px-2 py-1 text-sm rounded disabled:opacity-50",
            darkMode
              ? "bg-gray-800 text-white/80 hover:bg-gray-700"
              : "bg-gray-200 text-primary/80 hover:bg-gray-300",
          ].join(" ")}
          onClick={() => setPage(Math.max(1, clampedPage - 1))}
          disabled={clampedPage <= 1}
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <span className={`px-2 text-sm ${darkMode ? "text-white/80" : "text-primary/80"}`}>
          Page {clampedPage} / {totalPages}
        </span>

        <button
          type="button"
          className={[
            "cursor-pointer flex gap-2 items-center px-2 py-1 text-sm rounded disabled:opacity-50",
            darkMode
              ? "bg-gray-800 text-white/80 hover:bg-gray-700"
              : "bg-gray-200 text-primary/80 hover:bg-gray-300",
          ].join(" ")}
          onClick={() => setPage(Math.min(totalPages, clampedPage + 1))}
          disabled={clampedPage >= totalPages}
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PaginationResults;
