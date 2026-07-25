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

function SearchContent() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    query: "",
    branch: (searchParams.get("branch") as Branch) || null,
    semester: searchParams.get("semester") ? (Number(searchParams.get("semester")) as Semester) : null,
    subject: searchParams.get("subject") || null,
    tags: [], fileType: null, sort: "relevance",
  });

  useEffect(() => {
    const branch = searchParams.get("branch") as Branch | null;
    const semester = searchParams.get("semester") ? (Number(searchParams.get("semester")) as Semester) : null;
    const subject = searchParams.get("subject") || null;
    setFilters((prev) => ({ ...prev, branch: branch || prev.branch, semester: semester || prev.semester, subject: subject || prev.subject }));
  }, [searchParams]);

  useEffect(() => {
    setIsLoading(true);
    setResults(searchDocuments(documents, filters));
    setIsLoading(false);
  }, [filters]);

  const hasActiveFilters = !!(filters.branch || filters.semester || filters.subject || filters.tags.length > 0);
  const title = [filters.branch || "All", filters.semester ? `Sem ${filters.semester}` : null, filters.subject || null].filter(Boolean).join(" — ");

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
            <span className="text-xs font-bold text-black">JU</span>
          </div>
          <span className="text-sm font-bold text-white">JU Learning</span>
        </Link>
      </div>

      <div className="mx-auto max-w-4xl px-6 sm:px-10 py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-6">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>

        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{results.length} result{results.length !== 1 ? "s" : ""}</p>

        <div className="mt-8 mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <FilterBar filters={filters} onFilterChange={setFilters} />
        </div>

        <SearchResults results={results} query="" isLoading={isLoading} hasFilters={hasActiveFilters} />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-zinc-800" />
          <div className="h-4 w-32 rounded-lg bg-zinc-800" />
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
