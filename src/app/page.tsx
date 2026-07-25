"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Download, FileText } from "lucide-react";
import { documents } from "@/data/documents";
import { searchDocuments, type SearchResult } from "@/lib/search";
import type { FilterState } from "@/lib/types";
import { formatFileSize, getThumbnailUrl } from "@/lib/types";
import { Navbar } from "@/components/Navbar";

const TAG_LABELS: Record<string, string> = {
  notes: "Notes",
  pyq: "PYQ",
  assignment: "Assignment",
  "lab-manual": "Lab Manual",
  syllabus: "Syllabus",
  handwritten: "Handwritten",
  typed: "Typed",
  "reference-book": "Ref Book",
  "project-report": "Project",
};

function ResultCard({ result }: { result: SearchResult }) {
  const [imgFailed, setImgFailed] = useState(false);
  const thumbUrl = getThumbnailUrl(result.doc.url);
  const showThumb = thumbUrl && !imgFailed;

  return (
    <a
      href={result.doc.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-xl border border-border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-accent">
        {showThumb ? (
          <img
            src={thumbUrl}
            alt={result.doc.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileText className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur-sm">
          {result.doc.branch} S{result.doc.semester}
        </div>
        <div className="absolute right-2 top-2 flex flex-wrap gap-1">
          {result.doc.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium shadow-sm backdrop-blur-sm"
            >
              {TAG_LABELS[tag] || tag}
            </span>
          ))}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold leading-snug text-foreground">
          {result.doc.title}
        </h3>
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
          {result.doc.description || result.doc.subject}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {formatFileSize(result.doc.fileSize)}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand transition-colors group-hover:text-brand/80">
            <Download className="h-3 w-3" />
            Download
          </span>
        </div>
      </div>
    </a>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsLoading(true);
    setHasSearched(true);
    const timer = setTimeout(() => {
      const filters: FilterState = {
        query, branch: null, semester: null, subject: null,
        tags: [], sort: "relevance",
      };
      setResults(searchDocuments(documents, filters));
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

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
                placeholder="Search notes, subjects, topics..."
                className="flex-1 border-0 bg-transparent px-3 py-4 text-base text-foreground placeholder-muted-foreground outline-none focus:outline-none sm:text-lg"
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); inputRef.current?.focus(); }}
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
