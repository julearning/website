"use client";

import { Search, FileQuestion, BookOpen } from "lucide-react";

interface EmptyStateProps {
  type: "initial" | "no-results";
  query?: string;
}

export function EmptyState({ type, query }: EmptyStateProps) {
  if (type === "initial") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
          <Search className="h-7 w-7 text-blue-500" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-zinc-900">
          Find your study materials
        </h3>
        <p className="max-w-sm text-sm text-zinc-500">
          Search for notes, previous year questions, lab manuals, and more across
          all branches and semesters.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <span className="inline-flex items-center rounded-full bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200">
            Press <kbd className="mx-1 rounded bg-white px-1.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-300">⌘K</kbd> to search
          </span>
          <span className="inline-flex items-center rounded-full bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200">
            Use filters to narrow down
          </span>
        </div>
      </div>
    );
  }

  if (type === "no-results") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
          <FileQuestion className="h-7 w-7 text-amber-500" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-zinc-900">
          No results found
        </h3>
        <p className="max-w-sm text-sm text-zinc-500">
          {query ? (
            <>
              We couldn&apos;t find anything for &quot;<span className="font-medium text-zinc-700">{query}</span>&quot;.
              Try a broader search term or check your filters.
            </>
          ) : (
            <>
              No documents match your current filters. Try adjusting your
              search criteria.
            </>
          )}
        </p>
        <div className="mt-6 flex items-center gap-2 text-xs text-zinc-400">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Can&apos;t find what you need? Contribute on GitHub</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50">
        <Search className="h-7 w-7 text-zinc-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-zinc-900">
        Browse all documents
      </h3>
      <p className="max-w-sm text-sm text-zinc-500">
        Select a branch and semester to get started, or use the search bar
        above.
      </p>
    </div>
  );
}
