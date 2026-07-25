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

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function performSearch(q: string) {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsLoading(true);
    setHasSearched(true);

    // Yield to React so the loading skeleton renders before results
    await new Promise((r) => setTimeout(r, 200));

    const filters: FilterState = {
      query: q, branch: null, semester: null, subject: null,
      tags: [], sort: "relevance",
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
    if (e.key === "Enter") {
      // Cancel any pending debounce and search immediately
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
    inputRef.current?.focus();
  }

  // Recent documents sorted by upload date (newest first)
  const recentDocs = useMemo(() => {
    return [...documents]
      .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())
      .slice(0, 6);
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

  function RecentCard({ doc }: { doc: Document }) {
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
        </div>
      </a>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 pb-16">
        {/* Hero — full-screen, centered */}
        <div className="flex min-h-screen flex-col items-center justify-center text-center">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl">
            JU Learning
          </h1>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl lg:text-2xl">
            Every branch. Every semester. Every note.
          </p>

          {/* Search — bigger, no curves */}
          <div className="relative mt-12 w-full max-w-2xl">
            <div className="flex items-center bg-white ring-1 ring-border/30 transition-all duration-200 focus-within:ring-2 focus-within:ring-brand/20">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Search notes, subjects, topics..."
                className="flex-1 border-0 bg-transparent px-8 py-6 text-xl text-foreground placeholder-muted-foreground/40 outline-none sm:text-2xl"
                autoComplete="off"
                spellCheck={false}
              />
              {isFocused && !query.trim() && (
                <span className="mr-6 hidden text-xs text-muted-foreground/40 sm:inline">
                  {results.length > 0 ? "Searching..." : "Press Enter or wait"}
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

        {/* Browse sections — shown when nothing is searched */}
        {!hasSearched && (
          <div className="space-y-20">
            {/* Recently Added */}
            <section>
              <h2 className="mb-6 text-lg font-semibold text-foreground">Recently Added</h2>
              <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
                {recentDocs.map((doc) => (
                  <RecentCard key={doc.id} doc={doc} />
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
                      <p className="text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-white">
                        {branch}
                      </p>
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
                      <p className="text-2xl font-semibold text-foreground transition-colors duration-300 group-hover:text-white">
                        {sem}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground/60 transition-colors duration-300 group-hover:text-white/70">
                        {docCount} docs
                      </p>
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
                      <p className="text-base font-medium text-foreground transition-colors duration-300 group-hover:text-white">
                        {subject}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground/60 transition-colors duration-300 group-hover:text-white/70">
                        {docCount} documents
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Search results */}
        {hasSearched && (
          <div className="mt-10">
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
              <>
                <p className="mb-6 text-sm text-muted-foreground">
                  {results.length} result{results.length !== 1 ? "s" : ""}
                  {isFocused && query.trim() && <span className="ml-2 text-muted-foreground/40">· auto-searching in 3s</span>}
                </p>
                <PaginatedGrid
                  items={results}
                  renderItem={(result) => <ResultCard key={result.doc.id} result={result} />}
                  itemsPerPage={9}
                  emptyMessage="No results found. Try a different search term."
                />
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
}
