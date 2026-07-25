"use client";

import { useState, useRef } from "react";
import { Search } from "lucide-react";
import { documents } from "@/data/documents";
import { searchDocuments, type SearchResult } from "@/lib/search";
import type { FilterState } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { ResultCard } from "@/components/ResultCard";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function performSearch(q: string) {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsLoading(true);
    setHasSearched(true);
    const filters: FilterState = {
      query: q, branch: null, semester: null, subject: null,
      tags: [], sort: "relevance",
    };
    setResults(searchDocuments(documents, filters));
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

        {hasSearched && (
          <div className="mt-10">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-border bg-white p-4">
                    <div className="mb-3 h-40 rounded-lg bg-accent" />
                    <div className="mb-2 h-4 w-3/4 rounded bg-accent" />
                    <div className="h-3 w-1/2 rounded bg-accent" />
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <>
                <p className="mb-6 text-sm text-muted-foreground">
                  {results.length} result{results.length !== 1 ? "s" : ""}
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((result) => (
                    <ResultCard key={result.doc.id} result={result} />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-20 text-center">
                <Search className="mb-4 h-10 w-10 text-muted-foreground/20" />
                <p className="text-base text-muted-foreground">No results found</p>
                <p className="mt-1 text-sm text-muted-foreground/50">
                  Try a different search term.
                </p>
              </div>
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
