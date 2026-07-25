"use client";

import { Search, FileQuestion, BookOpen } from "lucide-react";
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
          <div key={i} className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-zinc-800" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-3/4 rounded bg-zinc-800" />
                <div className="h-3 w-1/2 rounded bg-zinc-800/50" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 rounded-full bg-zinc-800" />
                  <div className="h-5 w-20 rounded-full bg-zinc-800" />
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
      <p className="px-1 text-xs text-zinc-600">
        <span className="font-medium text-zinc-400">{results.length}</span> result{results.length !== 1 ? "s" : ""}
        {query && <> for &ldquo;<span className="text-zinc-400">{query}</span>&rdquo;</>}
      </p>
      <div className="space-y-2">
        {results.map((r, i) => <DocumentCard key={r.doc.id} document={r.doc} index={i} />)}
      </div>
    </div>
  );
}

function InitialState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900">
        <Search className="h-7 w-7 text-zinc-500" />
      </div>
      <h3 className="text-lg font-semibold text-white">Find your study materials</h3>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">Search notes, PYQs, lab manuals, and more across all B.Tech branches.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <span className="inline-flex items-center rounded-full border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-500">
          Press <kbd className="mx-1 rounded-md bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">⌘K</kbd> to search
        </span>
      </div>
    </div>
  );
}

function NoResults({ query }: { query?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900">
        <FileQuestion className="h-7 w-7 text-zinc-500" />
      </div>
      <h3 className="text-lg font-semibold text-white">No results found</h3>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">
        {query ? <>Nothing for &ldquo;{query}&rdquo;. Try a broader search.</> : <>No documents match your filters.</>}
      </p>
    </div>
  );
}
