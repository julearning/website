"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { documents } from "@/data/documents";
import { searchDocuments, type SearchResult } from "@/lib/search";
import type { FilterState } from "@/lib/types";
import { ResultCard } from "@/components/ResultCard";
import { PaginatedGrid } from "@/components/PaginatedGrid";
import { SortDropdown, type SortOption } from "@/components/SortDropdown";
import { FilterDropdown } from "@/components/FilterDropdown";
import { SourceDropdown, type SourceOption } from "@/components/SourceDropdown";

interface SearchHeroProps {
  title?: string;
  subtitle?: string;
  defaultTags?: string[];
  searchOnMount?: boolean;
}

export function SearchHero({ title = "JU Learning", subtitle = "Every branch. Every semester. Every note.", defaultTags, searchOnMount }: SearchHeroProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [sort, setSort] = useState<SortOption>("relevance");
  const [activeTags, setActiveTags] = useState<string[]>(defaultTags ?? []);
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute available sources from documents
  const availableSources: SourceOption[] = useMemo(() => {
    const sourceSet = new Set(documents.map((d) => d.source));
    return Array.from(sourceSet).sort().map((id) => ({
      id,
      label: id === "jammu-university" ? "Jammu University" : id,
    }));
  }, []);

  async function performSearch(q: string, sortOverride?: SortOption, tagsOverride?: string[], sourcesOverride?: string[]) {
    // Allow empty query when tags or sources are active (shows all docs matching filters)
    if (!q.trim() && (tagsOverride ?? activeTags).length === 0 && (sourcesOverride ?? activeSources).length === 0) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsLoading(true);
    setHasSearched(true);

    // Yield to React so the loading skeleton renders before results
    await new Promise((r) => setTimeout(r, 200));

    const currentSort = sortOverride ?? sort;
    const currentTags = tagsOverride ?? activeTags;
    const currentSources = sourcesOverride ?? activeSources;

    const filters: FilterState = {
      query: q,
      branch: null,
      semester: null,
      subject: null,
      tags: currentTags,
      sources: currentSources,
      sort: currentSort,
    };
    const found = searchDocuments(documents, filters);
    setResults(found);
    setIsLoading(false);
  }

  // Debounced auto-search: triggers 1s after the user stops typing
  const debouncedSearch = (q: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      performSearch(q);
    }, 1000);
  };

  // Search autocomplete: match titles/subjects that start with the typed query
  const suggestion = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 1) return "";

    // Try to match a document title first
    for (const doc of documents) {
      const lower = doc.title.toLowerCase();
      if (lower.startsWith(q) && lower.length > q.length) {
        return doc.title.slice(query.trim().length);
      }
    }
    // Then try subjects
    for (const doc of documents) {
      const lower = doc.subject.toLowerCase();
      if (lower.startsWith(q) && lower.length > q.length) {
        return doc.subject.slice(query.trim().length);
      }
    }
    return "";
  }, [query]);

  // Trigger initial search on mount if searchOnMount is true
  useEffect(() => {
    if (searchOnMount && defaultTags && defaultTags.length > 0) {
      performSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    debouncedSearch(val);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Tab" && suggestion) {
      // Fill in the suggestion on Tab
      e.preventDefault();
      setQuery(query.trim() + suggestion);
      return;
    }
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      performSearch(query);
      inputRef.current?.blur();
    }
  }

  function handleClear() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setSort("relevance");
    setActiveTags(defaultTags ?? []);
    setActiveSources([]);
    inputRef.current?.focus();
  }

  function handleSortChange(newSort: SortOption) {
    setSort(newSort);
    if (hasSearched && (query.trim() || activeTags.length > 0 || activeSources.length > 0)) {
      performSearch(query, newSort);
    }
  }

  function handleTagsChange(newTags: string[]) {
    setActiveTags(newTags);
    // Always search when tags change — shows docs matching tags even without a query
    performSearch(query, undefined, newTags);
  }

  function handleSourcesChange(newSources: string[]) {
    setActiveSources(newSources);
    // Always search when sources change — shows docs from selected sources even without a query
    performSearch(query, undefined, undefined, newSources);
  }

  return (
    <>
      {/* Hero — truly centered in remaining viewport space after navbar */}
      <div className="flex min-h-[calc(100dvh-60px)] flex-col items-center justify-center text-center">
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl">
          {title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground sm:text-xl lg:text-2xl">
          {subtitle}
        </p>

        {/* Search — bigger, no curves */}
        <div className="relative mt-12 w-full max-w-2xl">
          <div className="flex items-center bg-surface ring-1 ring-border/30 transition-all duration-200 focus-within:ring-2 focus-within:ring-brand/20">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Search notes, subjects, topics..."
                className="relative w-full border-0 bg-transparent px-8 py-6 text-xl text-foreground placeholder-muted-foreground/40 outline-none sm:text-2xl"
                autoComplete="off"
                spellCheck={false}
                style={{ background: "transparent" }}
              />
              {/* Ghost suggestion text */}
              {suggestion && isFocused && (
                <span
                  className="pointer-events-none absolute left-8 top-0 flex h-full items-center text-xl sm:text-2xl text-muted-foreground/20"
                  aria-hidden="true"
                >
                  {query.trim()}
                  <span className="text-muted-foreground/40">{suggestion.toLowerCase()}</span>
                </span>
              )}
            </div>
            {isFocused && !query.trim() && (
              <span className="mr-6 hidden text-xs text-muted-foreground/40 sm:inline">
                Press Enter or wait
              </span>
            )}
            {isFocused && query.trim() && suggestion && (
              <span className="mr-6 hidden text-xs text-muted-foreground/40 sm:inline">
                Tab to complete
              </span>
            )}
            {query && (
              <button
                onClick={handleClear}
                className="mr-4 flex h-10 w-10 items-center justify-center text-muted-foreground/50 transition-colors hover:text-foreground"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            )}
          </div>

          {/* Sort, Filter, Source — right under the search bar, tight gap */}
          <div className="flex items-center justify-end gap-1 pt-2">
            <SortDropdown value={sort} onChange={handleSortChange} />
            <FilterDropdown activeTags={activeTags} onChange={handleTagsChange} />
            {availableSources.length > 1 && (
              <SourceDropdown
                availableSources={availableSources}
                activeSources={activeSources}
                onChange={handleSourcesChange}
              />
            )}
          </div>
        </div>
      </div>

      {/* Search results */}
      {hasSearched && (
        <div className="mt-8">
          {!isLoading && (
            <p className="mb-4 text-sm text-muted-foreground">
              {results.length} result{results.length !== 1 ? "s" : ""}
                           {isFocused && query.trim() && !isLoading && <span className="ml-2 text-muted-foreground/40">· auto-searching in 1s</span>}
            </p>
          )}

          {isLoading ? (
            <div className="columns-2 gap-5 lg:columns-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="mb-5 animate-pulse break-inside-avoid overflow-hidden bg-surface">
                  <div className="h-56 bg-accent" />
                  <div className="p-4">
                    <div className="mb-2 h-4 w-3/4 bg-accent/50" />
                    <div className="h-3 w-1/2 bg-accent/30" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PaginatedGrid
              items={results}
              renderItem={(result) => <ResultCard key={result.doc.id} result={result} />}
              itemsPerPage={9}
              emptyMessage="No results found. Try adjusting your filters or search term."
            />
          )}
        </div>
      )}
    </>
  );
}
