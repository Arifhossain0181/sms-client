"use client";

import { type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showSummary?: boolean;
  summaryTemplate?: (current: number, total: number) => string;
  className?: string;
  maxVisible?: number;
};

function getPageNumbers(current: number, total: number, maxVisible: number): (number | "ellipsis")[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];
  pages.push(1);

  if (current > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  pages.push(total);

  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showSummary = true,
  summaryTemplate,
  className = "",
  maxVisible = 5,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages, maxVisible);
  const summary =
    summaryTemplate?.(currentPage, totalPages) ??
    `Page ${currentPage} of ${totalPages}`;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      {showSummary && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{summary}</p>
      )}
      <div className="flex items-center gap-1.5">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </motion.button>

        {pages.map((p, idx) =>
          p === "ellipsis" ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-8 h-8 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 select-none"
            >
              ...
            </span>
          ) : (
            <motion.button
              key={p}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                p === currentPage
                  ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/30"
                  : "border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
              }`}
              aria-current={p === currentPage ? "page" : undefined}
            >
              {p}
            </motion.button>
          ),
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </div>
  );
}
