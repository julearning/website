"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { documents, getUniqueBranches, getDocumentsByBranch } from "@/data/documents";
import { searchDocuments, type SearchResult } from "@/lib/search";
import type { FilterState, Branch, Document } from "@/lib/types";
import { getThumbnailUrl } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { ResultCard } from "@/components/ResultCard";
import { PaginatedGrid } from "@/components/PaginatedGrid";
import { SortDropdown, type SortOption } from "@/components/SortDropdown";
import { FilterDropdown } from "@/components/FilterDropdown";

const CATEGORY_SECTIONS = [
  { tag: "pyq", title: "Previous Year Questions", subtitle: "Past exam papers from all semesters" },
  { tag: "handwritten", title: "Handwritten Notes", subtitle: "Student-scanned handwritten summaries" },
  { tag: "typed", title: "Digital Notes", subtitle: "Clean typed notes and study materials" },
] as const;

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [sort, setSort] = useState<SortOption>("relevance");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function performSearch(q: string, sortOverride?: SortOption, tagsOverride?: string[]) {
    if (!q.trim()) {
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

    const filters: FilterState = {
      query: q,
      branch: null,
      semester: null,
      subject: null,
      tags: currentTags,
      sort: currentSort,
    };
    const found = searchDocuments(documents, filters);
    setResults(found);
    setIsLoading(false);
  }

  // Debounced auto-search: triggers 3s after the user stops typing
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
    }, 3000);
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
    setActiveTags([]);
    inputRef.current?.focus();
  }

  function handleSortChange(newSort: SortOption) {
    setSort(newSort);
    if (hasSearched && query.trim()) {
      performSearch(query, newSort);
    }
  }

  function handleTagsChange(newTags: string[]) {
    setActiveTags(newTags);
    if (hasSearched && query.trim()) {
      performSearch(query, undefined, newTags);
    }
  }

  // Recent documents sorted by upload date (newest first)
  const recentDocs = useMemo(() => {
    return [...documents]
      .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())
      .slice(0, 6);
  }, []);

  // Category sections: filter documents by tag, take 6 recent
  const categoryDocs = useMemo(() => {
    return CATEGORY_SECTIONS.map((cat) => ({
      ...cat,
      docs: [...documents]
        .filter((d) => d.tags.includes(cat.tag))
        .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())
        .slice(0, 6),
    }));
  }, []);

  // Contributor leaderboard: count documents per contributor, take top 8
  const topContributors = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const doc of documents) {
      const c = doc.contributor || "unknown";
      counts[c] = (counts[c] || 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([username, count]) => ({ username, count }));
  }, []);

  const branches = getUniqueBranches();
  const allSemesters = [...new Set(documents.map((d) => d.semester))].sort((a, b) => a - b);
  const allSubjects = [...new Set(documents.map((d) => d.subject))].sort();
  const topSubjects = allSubjects.slice(0, 12);

  function formatDate(dateStr: string | undefined) {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "";
    }
  }

  function ContributorCard({ username, count }: { username: string; count: number }) {
    const [imgFailed, setImgFailed] = useState(false);

    return (
      <a
        href={`https://github.com/${username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 bg-white px-4 py-3 transition-all duration-300 hover:bg-brand"
      >
        {!imgFailed ? (
          <img
            src={`https://github.com/${username}.png?size=40`}
            alt={username}
            className="h-8 w-8 transition-opacity duration-300 group-hover:opacity-90"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center bg-accent text-xs font-bold text-muted-foreground transition-colors duration-300 group-hover:bg-white/20 group-hover:text-white/80">
            {username.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground transition-colors duration-300 group-hover:text-white">
            {username}
          </p>
          <p className="text-[11px] text-muted-foreground/60 transition-colors duration-300 group-hover:text-white/70">
            {count} document{count !== 1 ? "s" : ""}
          </p>
        </div>
      </a>
    );
  }

  function CategoryCard({ doc }: { doc: Document }) {
    const [imgFailed, setImgFailed] = useState(false);
    const thumb = getThumbnailUrl(doc.url);
    const showThumb = thumb && !imgFailed;

    return (
      <a
        href={doc.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block break-inside-avoid bg-white transition-all duration-300 hover:bg-brand mb-5"
      >
        <div className="relative overflow-hidden bg-accent">
          {showThumb ? (
            <img
              src={thumb}
              alt={doc.title}
              className="w-full transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-accent to-accent/50 transition-colors duration-300 group-hover:from-brand group-hover:to-brand/80">
              <span className="text-3xl font-light text-muted-foreground/20 transition-colors duration-300 group-hover:text-white/30">
                {doc.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="p-4 transition-colors duration-300">
          <p className="text-sm font-semibold leading-snug text-foreground transition-colors duration-300 group-hover:text-white">
            {doc.title}
          </p>
          <p className="mt-2 text-xs text-muted-foreground/70 transition-colors duration-300 group-hover:text-white/70">
            {doc.branch} S{doc.semester} · {doc.subject}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/40 transition-colors duration-300 group-hover:text-white/50">
            {formatDate(doc.uploadedAt)}
          </p>
          {doc.contributor && (
            <div className="mt-2 flex items-center gap-1.5">
              <img
                src={`https://github.com/${doc.contributor}.png?size=20`}
                alt={doc.contributor}
                className="h-3.5 w-3.5"
                loading="lazy"
              />
              <span className="text-[10px] text-muted-foreground/50 transition-colors duration-300 group-hover:text-white/60">
                {doc.contributor}
              </span>
            </div>
          )}
        </div>
      </a>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 pb-16">
        {/* Hero — truly centered in remaining viewport space after navbar */}
        <div className="flex min-h-[calc(100dvh-60px)] flex-col items-center justify-center text-center">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl">
            JU Learning
          </h1>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl lg:text-2xl">
            Every branch. Every semester. Every note.
          </p>

          {/* Search — bigger, no curves */}
          <div className="relative mt-12 w-full max-w-2xl">
            <div className="flex items-center bg-white ring-1 ring-border/30 transition-all duration-200 focus-within:ring-2 focus-within:ring-brand/20">
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
          </div>
        </div>

        {/* Sort & Filter toolbar — always visible, right below the search bar */}
        <div className="flex items-center justify-end gap-1 border-b border-border/10 pb-4">
          <SortDropdown value={sort} onChange={handleSortChange} />
          <FilterDropdown activeTags={activeTags} onChange={handleTagsChange} />
        </div>

        {/* Search results */}
        {hasSearched && (
          <div className="mt-8">
            {!isLoading && (
              <p className="mb-4 text-sm text-muted-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""}
                {isFocused && query.trim() && <span className="ml-2 text-muted-foreground/40">· auto-searching in 3s</span>}
              </p>
            )}

            {isLoading ? (
              <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="mb-5 animate-pulse break-inside-avoid overflow-hidden bg-white">
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

        {/* Browse sections — always visible below search results */}
        <div className="mt-16 space-y-20">
          {/* Category Sections: PYQs, Handwritten, Digital Notes */}
          {categoryDocs.map((cat) =>
            cat.docs.length > 0 ? (
              <section key={cat.tag}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground">{cat.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{cat.subtitle}</p>
                </div>
                <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
                  {cat.docs.map((doc) => (
                    <CategoryCard key={doc.id} doc={doc} />
                  ))}
                </div>
              </section>
            ) : null
          )}

          {/* Contributors */}
          {topContributors.length > 0 && (
            <section>
              <h2 className="mb-6 text-lg font-semibold text-foreground">Top Contributors</h2>
              <p className="mb-4 text-sm text-muted-foreground">Students who have shared study materials with the community.</p>
              <div className="flex flex-wrap gap-3">
                {topContributors.map(({ username, count }) => (
                  <ContributorCard key={username} username={username} count={count} />
                ))}
              </div>
            </section>
          )}

          {/* Recently Added */}
          <section>
            <h2 className="mb-6 text-lg font-semibold text-foreground">Recently Added</h2>
            <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
              {recentDocs.map((doc) => (
                <CategoryCard key={doc.id} doc={doc} />
              ))}
            </div>
          </section>

          {/* Browse by Branch */}
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Browse by Branch</h2>
              <Link href="/branches" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch) => {
                const docCount = getDocumentsByBranch(branch).length;
                const semesters = [...new Set(getDocumentsByBranch(branch).map((d) => d.semester))].sort();

                return (
                  <Link
                    key={branch}
                    href={`/branches/${branch.toLowerCase()}`}
                    className="group bg-white p-7 transition-all duration-300 hover:bg-brand"
                  >
                    <p className="text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-white">{branch}</p>
                    <p className="mt-2 text-sm text-muted-foreground/60 transition-colors duration-300 group-hover:text-white/70">
                      {docCount} documents · {semesters.length} semesters
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Browse by Semester */}
          <section>
            <h2 className="mb-6 text-lg font-semibold text-foreground">Browse by Semester</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
              {allSemesters.map((sem) => {
                const docCount = documents.filter((d) => d.semester === sem).length;
                return (
                  <button
                    key={sem}
                    onClick={() => {
                      setQuery(`semester ${sem}`);
                      performSearch(`semester ${sem}`);
                    }}
                    className="group bg-white p-6 text-center transition-all duration-300 hover:bg-brand"
                  >
                    <p className="text-2xl font-semibold text-foreground transition-colors duration-300 group-hover:text-white">{sem}</p>
                    <p className="mt-1 text-sm text-muted-foreground/60 transition-colors duration-300 group-hover:text-white/70">{docCount} docs</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Browse by Subject */}
          <section>
            <h2 className="mb-6 text-lg font-semibold text-foreground">Browse by Subject</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {topSubjects.map((subject) => {
                const docCount = documents.filter((d) => d.subject === subject).length;
                return (
                  <button
                    key={subject}
                    onClick={() => {
                      setQuery(subject);
                      performSearch(subject);
                    }}
                    className="group bg-white p-6 text-left transition-all duration-300 hover:bg-brand"
                  >
                    <p className="text-base font-medium text-foreground transition-colors duration-300 group-hover:text-white">{subject}</p>
                    <p className="mt-1 text-sm text-muted-foreground/60 transition-colors duration-300 group-hover:text-white/70">{docCount} documents</p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
