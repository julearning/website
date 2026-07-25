"use client";

import { Search, FileQuestion } from "lucide-react";
import { type SearchResult } from "@/lib/search";
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
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl bg-surface p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted/50" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 rounded-full bg-muted" />
                  <div className="h-5 w-20 rounded-full bg-muted" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    if (!query && !hasFilters) return <InitialState />;
    return <NoResults query={query} />;
  }

  return (
    <div className="space-y-2">
      <p className="px-1 text-xs text-muted-foreground/60">
        <span className="font-medium text-muted-foreground">{results.length}</span> result{results.length !== 1 ? "s" : ""}
        {query && <> for &ldquo;<span className="text-muted-foreground">{query}</span>&rdquo;</>}
      </p>
      <div className="space-y-[1px]">
        {results.map((r, i) => <DocumentCard key={r.doc.id} document={r.doc} index={i} />)}
      </div>
    </div>
  );
}

function InitialState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
        <Search className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">Find your study materials</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">Search notes, PYQs, lab manuals, and more across all B.Tech branches.</p>
      <div className="mt-8">
        <span className="inline-flex items-center rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
          Press <kbd className="mx-1 rounded bg-muted/50 px-1.5 py-0.5 text-xs text-foreground">&#8984;K</kbd> to search
        </span>
      </div>
    </div>
  );
}

function NoResults({ query }: { query?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
        <FileQuestion className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">No results found</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {query ? <>Nothing for &ldquo;{query}&rdquo;. Try a broader search.</> : <>No documents match your filters.</>}
      </p>
    </div>
  );
}
