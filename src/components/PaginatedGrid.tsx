"use client";

import { useState, useMemo, useEffect, useRef } from "react";

interface PaginatedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemsPerPage?: number;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}

export function PaginatedGrid<T>({
  items,
  renderItem,
  itemsPerPage = 9,
  emptyMessage,
  emptyIcon,
}: PaginatedGridProps<T>) {
  const [page, setPage] = useState(1);
  const prevItemsRef = useRef(items);
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Reset page to 1 when the items array reference changes (new search results)
  useEffect(() => {
    if (prevItemsRef.current !== items) {
      setPage(1);
      prevItemsRef.current = items;
    }
  }, [items]);

  const visibleItems = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    return items.slice(0, safePage * itemsPerPage);
  }, [items, page, itemsPerPage, totalPages]);

  const hasMore = visibleItems.length < items.length;
  const remaining = items.length - visibleItems.length;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        {emptyIcon}
        <p className="text-base text-muted-foreground">{emptyMessage || "Nothing here yet."}</p>
      </div>
    );
  }

  return (
    <>
      {/* Pinterest-style masonry columns */}
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
        {visibleItems.map((item, index) => renderItem(item, index))}
      </div>
      {hasMore && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground/50">
            Showing {visibleItems.length} of {items.length}
          </p>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-8 py-3.5 text-sm font-medium text-background shadow-sm transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
          >
            Show {remaining > itemsPerPage ? itemsPerPage : remaining} more
          </button>
        </div>
      )}
    </>
  );
}
