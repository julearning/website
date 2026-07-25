"use client";

import type { SearchResult } from "@/lib/search";
import { EmptyState } from "./empty-state";
import { DocumentCard } from "./document-card";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isLoading?: boolean;
  hasFilters?: boolean;
}

export function SearchResults({ results, query, isLoading, hasFilters }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 py-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-zinc-200/60 bg-white p-5"
          >
            <div className="flex items-start gap-4">
              <div className="h-9 w-9 rounded-lg bg-zinc-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-zinc-100" />
                <div className="h-3 w-1/2 rounded bg-zinc-50" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 rounded-md bg-zinc-50" />
                  <div className="h-5 w-20 rounded-md bg-zinc-50" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    if (!query && !hasFilters) {
      return <EmptyState type="initial" />;
    }
    return <EmptyState type="no-results" query={query} />;
  }

  return (
    <div className="space-y-2">
      <p className="px-1 text-xs text-zinc-400">
        {results.length} result{results.length !== 1 ? "s" : ""}
        {query && (
          <>
            {" "}for &quot;<span className="font-medium text-zinc-500">{query}</span>&quot;
          </>
        )}
      </p>
      <div className="space-y-2">
        {results.map((result) => (
          <DocumentCard
            key={result.doc.id}
            document={result.doc}
            highlight={query}
          />
        ))}
      </div>
    </div>
  );
}
