"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { documents, getUniqueBranches, getDocumentsByBranch } from "@/data/documents";
import { searchDocuments, type SearchResult } from "@/lib/search";
import type { FilterState, Branch } from "@/lib/types";
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      performSearch(query);
      inputRef.current?.blur();
    }
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  }

  const branches = getUniqueBranches();
  const allSemesters = [...new Set(documents.map((d) => d.semester))].sort((a, b) => a - b);
  const allSubjects = [...new Set(documents.map((d) => d.subject))].sort();
  const topSubjects = allSubjects.slice(0, 12);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 pb-16">
        {/* Hero — centered, brand-focused */}
        <div className="relative flex min-h-[60vh] flex-col items-center justify-center text-center sm:min-h-[65vh]">
          {/* Decorative background */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <img
              src="/images/hero-bg.jpg"
              alt=""
              className="h-full w-full object-cover opacity-[0.04] saturate-0"
            />
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl">
            JU Learning
          </h1>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl lg:text-2xl">
            Every branch. Every semester. Every note.
          </p>

          {/* Search — clean, centered, no shadows */}
          <div className="relative mt-10 w-full max-w-xl">
            <div className="flex items-center rounded-2xl bg-white ring-1 ring-border/30 transition-all duration-200 focus-within:ring-2 focus-within:ring-brand/20">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Search notes, subjects, topics..."
                className="flex-1 border-0 bg-transparent px-6 py-4 text-base text-foreground placeholder-muted-foreground/40 outline-none sm:text-lg"
                autoComplete="off"
                spellCheck={false}
              />
              {isFocused && !query.trim() && (
                <span className="mr-5 hidden text-xs text-muted-foreground/40 sm:inline">
                  Press Enter
                </span>
              )}
              {query && (
                <button
                  onClick={handleClear}
                  className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:text-foreground"
                >
                  <span className="text-lg leading-none">&times;</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Browse sections — shown when nothing is searched */}
        {!hasSearched && (
          <div className="mt-8 space-y-16">
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
                      className="group rounded-2xl bg-white p-6 transition-all duration-300 hover:bg-brand hover:border-2 hover:border-foreground"
                    >
                      <p className="text-sm font-semibold text-foreground transition-colors duration-300 group-hover:text-white">
                        {branch}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground/60 transition-colors duration-300 group-hover:text-white/70">
                        {docCount} documents · {semesters.length} semesters
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {semesters.slice(0, 5).map((sem) => (
                          <span
                            key={sem}
                            className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors duration-300 group-hover:bg-white/15 group-hover:text-white/80"
                          >
                            S{sem}
                          </span>
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Browse by Semester */}
            <section>
              <h2 className="mb-6 text-lg font-semibold text-foreground">Browse by Semester</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Pick a semester to find materials across all branches.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                {allSemesters.map((sem) => {
                  const docCount = documents.filter((d) => d.semester === sem).length;
                  return (
                    <button
                      key={sem}
                      onClick={() => {
                        setQuery(`semester ${sem}`);
                        performSearch(`semester ${sem}`);
                      }}
                      className="group rounded-2xl bg-white p-5 text-center transition-all duration-300 hover:bg-brand hover:border-2 hover:border-foreground"
                    >
                      <p className="text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-white">
                        {sem}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/60 transition-colors duration-300 group-hover:text-white/70">
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
              <p className="mb-4 text-sm text-muted-foreground">
                Jump straight to a subject across all semesters.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {topSubjects.map((subject) => {
                  const docCount = documents.filter((d) => d.subject === subject).length;
                  return (
                    <button
                      key={subject}
                      onClick={() => {
                        setQuery(subject);
                        performSearch(subject);
                      }}
                      className="group rounded-2xl bg-white p-5 text-left transition-all duration-300 hover:bg-brand hover:border-2 hover:border-foreground"
                    >
                      <p className="text-sm font-medium text-foreground transition-colors duration-300 group-hover:text-white">
                        {subject}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/60 transition-colors duration-300 group-hover:text-white/70">
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
                  <div key={i} className="mb-5 animate-pulse break-inside-avoid overflow-hidden rounded-2xl bg-white">
                    <div className="h-56 bg-accent" />
                    <div className="p-4">
                      <div className="mb-2 h-4 w-3/4 rounded bg-accent/50" />
                      <div className="h-3 w-1/2 rounded bg-accent/30" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p className="mb-6 text-sm text-muted-foreground">
                  {results.length} result{results.length !== 1 ? "s" : ""}
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
