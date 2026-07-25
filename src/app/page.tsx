"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Search, Monitor, Radio, Zap, Cog, HardHat, BookOpen } from "lucide-react";
import { documents, getUniqueBranches, getDocumentsByBranch } from "@/data/documents";
import { searchDocuments, type SearchResult } from "@/lib/search";
import type { FilterState, Branch } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { ResultCard } from "@/components/ResultCard";
import { PaginatedGrid } from "@/components/PaginatedGrid";

const BRANCH_INFO: Record<Branch, { name: string; icon: typeof BookOpen }> = {
  CSE: { name: "Computer Science & Engineering", icon: Monitor },
  ECE: { name: "Electronics & Communication Engineering", icon: Radio },
  EE: { name: "Electrical Engineering", icon: Zap },
  ME: { name: "Mechanical Engineering", icon: Cog },
  CE: { name: "Civil Engineering", icon: HardHat },
};

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

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 pb-16">
        <div className="pt-16 sm:pt-24">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            JU Learning
          </h1>
          <p className="mt-3 text-lg text-muted-foreground sm:text-xl">
            Study materials, for everyone.
          </p>

          <div className="relative mt-8 max-w-2xl">
            <div className="flex items-center rounded-xl border border-border bg-white shadow-sm transition-shadow duration-200 hover:shadow-md focus-within:shadow-md focus-within:border-brand/50">
              <Search className="ml-4 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Search notes, subjects, topics..."
                className="flex-1 border-0 bg-transparent px-3 py-4 text-base text-foreground placeholder-muted-foreground outline-none focus:outline-none sm:text-lg"
                autoComplete="off"
                spellCheck={false}
              />
              {isFocused && !query.trim() && (
                <span className="mr-3 hidden text-[11px] text-muted-foreground/40 sm:inline">
                  Press Enter to search
                </span>
              )}
              {query && (
                <button
                  onClick={handleClear}
                  className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <span className="text-lg leading-none">&times;</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {!hasSearched && (
          <div className="mt-16">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Browse by Branch</h2>
              <Link href="/branches" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {getUniqueBranches().map((branch) => {
                const info = BRANCH_INFO[branch as Branch];
                const Icon = info?.icon || BookOpen;
                const docCount = getDocumentsByBranch(branch).length;
                const semesters = [...new Set(getDocumentsByBranch(branch).map((d) => d.semester))].sort();

                return (
                  <Link
                    key={branch}
                    href={`/branches/${branch.toLowerCase()}`}
                    className="group rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent transition-colors group-hover:bg-brand/10">
                        <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-brand" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {info?.name || branch}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {docCount} documents · {semesters.length} semesters
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {semesters.slice(0, 5).map((sem) => (
                        <span key={sem} className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          S{sem}
                        </span>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {hasSearched && (
          <div className="mt-10">
            {isLoading ? (
              <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="mb-5 animate-pulse break-inside-avoid overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
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
                  emptyIcon={<Search className="mb-4 h-10 w-10 text-muted-foreground/20" />}
                />
              </>
            )}
          </div>
        )}

        <footer className="mt-20 py-8 text-center">
          <p className="text-xs text-muted-foreground/50">
            Open source study materials.{" "}
            <a
              href="https://github.com/julearning/metadata"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors hover:text-muted-foreground"
            >
              Contribute on GitHub
            </a>
          </p>
        </footer>
      </main>
    </>
  );
}
