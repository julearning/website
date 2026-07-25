"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { documents } from "@/data/documents";
import { searchDocuments, type SearchResult } from "@/lib/search";
import type { FilterState, Branch, Semester } from "@/lib/types";
import { SearchResults } from "@/components/search/search-results";
import { FilterBar } from "@/components/search/filter-bar";
import { SearchBar } from "@/components/search/search-bar";
import { Navbar } from "@/components/Navbar";

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    query: searchParams.get("q") || "",
    branch: (searchParams.get("branch") as Branch) || null,
    semester: searchParams.get("semester") ? (Number(searchParams.get("semester")) as Semester) : null,
    subject: searchParams.get("subject") || null,
    tags: [], fileType: null, sort: "relevance",
  });

  useEffect(() => {
    const branch = searchParams.get("branch") as Branch | null;
    const semester = searchParams.get("semester") ? (Number(searchParams.get("semester")) as Semester) : null;
    const subject = searchParams.get("subject") || null;
    setFilters((prev) => ({
      ...prev,
      query: searchParams.get("q") || prev.query,
      branch: branch || prev.branch,
      semester: semester || prev.semester,
      subject: subject || prev.subject,
    }));
  }, [searchParams]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setResults(searchDocuments(documents, { ...filters, query }));
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [filters, query]);

  const hasActiveFilters = !!(filters.branch || filters.semester || filters.subject || filters.tags.length > 0);
  const titleParts = [filters.branch || null, filters.semester ? `Sem ${filters.semester}` : null, filters.subject || null].filter(Boolean);
  const title = titleParts.length > 0 ? titleParts.join(" — ") : "Search";

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-3 w-3" />
          Back
        </Link>

        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{results.length} {results.length === 1 ? "result" : "results"}</p>
        </div>

        <div className="mb-5">
          <SearchBar value={query} onChange={(v) => { setQuery(v); setFilters((prev) => ({ ...prev, query: v })); }}
            onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} isFocused={isFocused} variant="compact" />
        </div>

        <div className="mb-6 rounded-2xl bg-surface p-4">
          <FilterBar filters={filters} onFilterChange={setFilters} />
        </div>

        <SearchResults results={results} query={query} isLoading={isLoading} hasFilters={hasActiveFilters} />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-muted" />
          <div className="h-4 w-32 rounded-lg bg-muted" />
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
