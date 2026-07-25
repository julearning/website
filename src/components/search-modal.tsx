"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X } from "lucide-react";
import type { Document, FilterState, Branch, Semester, DocumentTag } from "@/lib/types";
import { BRANCHES, SEMESTERS, DOCUMENT_TAGS } from "@/lib/types";
import { getUniqueSubjects } from "@/data/documents";
import { searchDocuments, type SearchResult } from "@/lib/search";
import { SearchResults } from "./search-results";

interface SearchModalProps {
  documents: Document[];
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ documents, open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    query: "",
    branch: null,
    semester: null,
    subject: null,
    tags: [],
    fileType: null,
    sort: "relevance",
  });
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      setIsLoading(true);
      const searchResults = searchDocuments(documents, {
        ...filters,
        query,
      });
      setResults(searchResults);
      setSelectedIndex(0);
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [query, filters, documents, open]);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        window.open(results[selectedIndex].doc.url, "_blank");
      }
    },
    [results, selectedIndex, onClose],
  );

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selected = resultsRef.current.querySelector(
        `[data-index="${selectedIndex}"]`,
      );
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setFilters({
        query: "",
        branch: null,
        semester: null,
        subject: null,
        tags: [],
        fileType: null,
        sort: "relevance",
      });
    }
  }, [open]);

  if (!open) return null;

  const subjects = filters.branch ? getUniqueSubjects(filters.branch) : [];
  const hasActiveFilters = !!(
    filters.branch || filters.semester || filters.subject || filters.tags.length > 0
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-zinc-900/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/10">
          {/* Search input */}
          <div className="flex items-center border-b border-zinc-100 px-4">
            <Search className="h-4 w-4 shrink-0 text-zinc-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search notes, subjects, topics..."
              className="flex-1 border-0 bg-transparent px-3 py-4 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <span className="hidden rounded-md border border-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 sm:inline">
                {query ? `${results.length} results` : "⌘K"}
              </span>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick filters (shown when no query) */}
          {!query && (
            <div className="border-b border-zinc-100 px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                  Filters
                </span>
                <select
                  value={filters.branch || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      branch: (e.target.value || null) as Branch | null,
                      subject: null,
                    }))
                  }
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600"
                >
                  <option value="">All Branches</option>
                  {BRANCHES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.semester || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      semester: (e.target.value
                        ? Number(e.target.value)
                        : null) as Semester | null,
                    }))
                  }
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600"
                >
                  <option value="">All Semesters</option>
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      Sem {s}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.subject || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      subject: e.target.value || null,
                    }))
                  }
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600 disabled:opacity-50"
                  disabled={subjects.length === 0}
                >
                  <option value="">All Subjects</option>
                  {subjects.slice(0, 10).map((s) => (
                    <option key={s} value={s}>
                      {s.length > 30 ? `${s.slice(0, 30)}...` : s}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.sort}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sort: e.target.value as FilterState["sort"],
                    }))
                  }
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name">Name</option>
                </select>
              </div>
              {/* Tag filters */}
              <div className="mt-2 flex flex-wrap items-center gap-1">
                {DOCUMENT_TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        tags: prev.tags.includes(tag.id)
                          ? prev.tags.filter((t) => t !== tag.id)
                          : [...prev.tags, tag.id],
                      }))
                    }
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-all ${
                      filters.tags.includes(tag.id)
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-50 text-zinc-500 ring-1 ring-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div
            ref={resultsRef}
            className="max-h-[60vh] overflow-y-auto px-4 py-3"
          >
            <SearchResults
              results={results}
              query={query}
              isLoading={isLoading}
              hasFilters={hasActiveFilters}
            />
          </div>

          {/* Footer hints */}
          <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-2">
            <div className="flex items-center gap-3 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-200 px-1 py-0.5 text-[9px]">↑↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-200 px-1 py-0.5 text-[9px]">↵</kbd>
                <span>Open</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-200 px-1 py-0.5 text-[9px]">Esc</kbd>
                <span>Close</span>
              </span>
            </div>
            <span className="text-[10px] text-zinc-300">
              {results.length > 0 && `Showing ${results.length} of ${results.length}`}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
