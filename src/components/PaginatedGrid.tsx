"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";

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
  const sentinelRef = useRef<HTMLDivElement>(null);
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Reset page to 1 when the items array reference changes (new search results)
  useEffect(() => {
    if (prevItemsRef.current !== items) {
      setPage(1);
      prevItemsRef.current = items;
    }
  }, [items]);

  // Infinite scroll — load more when sentinel enters viewport
  const hasMore = page < totalPages;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => Math.min(p + 1, totalPages));
        }
      },
      { rootMargin: "200px" } // Start loading 200px before the sentinel
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, totalPages]);

  const visibleItems = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    // Add a small buffer: show itemsPerPage * safePage items
    // This ensures we show items in clean increments
    return items.slice(0, safePage * itemsPerPage);
  }, [items, page, itemsPerPage, totalPages]);

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
      {/* Masonry columns */}
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
        {visibleItems.map((item, index) => renderItem(item, index))}
      </div>

      {/* Footer showing count + sentinel for infinite scroll */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <p className="text-xs text-muted-foreground/50">
          Showing {visibleItems.length} of {items.length}
        </p>

        {/* Invisible sentinel: when visible, triggers next page load */}
        {hasMore && (
          <div
            ref={sentinelRef}
            className="flex items-center gap-2 text-sm text-muted-foreground/40"
          >
            <span className="h-3 w-3 animate-pulse rounded-full bg-brand/30" />
            Loading more...
          </div>
        )}
      </div>
    </>
  );
}
