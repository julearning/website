"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, BookOpen, FileText } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { documents } from "@/data/documents";
import { searchDocuments, type SearchResult } from "@/lib/search";
import type { FilterState } from "@/lib/types";
import { SearchBar } from "@/components/search/search-bar";
import { SearchResults } from "@/components/search/search-results";
import { FilterBar } from "@/components/search/filter-bar";
import { Navbar } from "@/components/Navbar";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const BRANCH_INFO: { id: string; name: string; icon: typeof BookOpen }[] = [
  { id: "CSE", name: "Computer Science & Engineering", icon: BookOpen },
  { id: "ECE", name: "Electronics & Communication", icon: BookOpen },
  { id: "EE", name: "Electrical Engineering", icon: BookOpen },
  { id: "ME", name: "Mechanical Engineering", icon: BookOpen },
  { id: "CE", name: "Civil Engineering", icon: BookOpen },
];

const branchDocCounts: Record<string, number> = {};
for (const b of BRANCH_INFO) {
  branchDocCounts[b.id] = documents.filter((d) => d.branch === b.id).length;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    query: "", branch: null, semester: null, subject: null,
    tags: [], fileType: null, sort: "relevance",
  });

  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const content = contentRef.current;
    if (!hero || !content) return;

    const ctx = gsap.context(() => {
      gsap.from(content, { y: 40, opacity: 0, duration: 1, ease: "power3.out" });
      gsap.to(".hero-bg", {
        y: -40, scale: 1.03, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1.5 },
      });
      gsap.to(content, {
        y: 30, opacity: 0.3, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1 },
      });
    }, hero);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(true);
      const sr = searchDocuments(documents, { ...filters, query });
      setResults(sr);
      setIsLoading(false);
    }, 120);
    return () => clearTimeout(timer);
  }, [query, filters]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("hero-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasActiveFilters = !!(filters.branch || filters.semester || filters.subject || filters.tags.length > 0);

  return (
    <>
      {/* ─── Hero ─── */}
      <div ref={heroRef} className="relative min-h-[85dvh] flex flex-col overflow-hidden">
        {/* Background */}
        <div className="hero-bg absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&q=80"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-background" />
        </div>

        <div className="relative z-10">
          <Navbar />
        </div>

        {/* Hero content — left-aligned */}
        <div ref={contentRef} className="relative z-10 flex flex-1 flex-col justify-center px-6 pb-20 sm:px-12">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-subtle px-3 py-1 text-xs font-medium text-brand">
              <FileText className="h-3 w-3" />
              {documents.length} open source documents
            </div>

            <h1 className="font-heading max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              Study materials,
              <br />
              <span className="text-brand">for everyone.</span>
            </h1>

            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/45 sm:text-lg">
              Search notes, PYQs, lab manuals, and assignments across all B.Tech branches. Built by students, for students.
            </p>

            <div className="mt-8 w-full max-w-lg">
              <SearchBar
                value={query}
                onChange={setQuery}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                isFocused={isFocused}
                variant="hero"
              />
            </div>

            <div className="mt-6 flex items-center gap-4 text-xs text-white/30">
              <span className="text-white/20">Quick links:</span>
              {BRANCH_INFO.filter((b) => branchDocCounts[b.id] > 0).map((b) => (
                <a key={b.id} href={`/browse/${b.id.toLowerCase()}`} className="transition-colors hover:text-white/60">
                  {b.id}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Results ─── */}
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
        <AnimatePresence>
          {(query || hasActiveFilters || isFocused) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="pb-24"
            >
              <div className="mb-6 rounded-2xl bg-surface p-5">
                <FilterBar filters={filters} onFilterChange={setFilters} />
              </div>
              <SearchResults results={results} query={query} isLoading={isLoading} hasFilters={hasActiveFilters} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Browse teaser ─── */}
      {!query && !hasActiveFilters && !isFocused && (
        <div className="relative mx-auto max-w-6xl px-4 pb-32 sm:px-6">
          <div className="mb-10">
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Browse by branch</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Pick your branch and start finding what you need.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-5">
            {BRANCH_INFO.filter((b) => branchDocCounts[b.id] > 0).map((branch, i) => (
              <motion.a
                key={branch.id}
                href={`/browse/${branch.id.toLowerCase()}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                className="group rounded-2xl bg-surface p-6 text-center transition-all hover:bg-surface-elevated"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-subtle transition-colors group-hover:bg-brand/20">
                  <BookOpen className="h-5 w-5 text-brand" />
                </div>
                <div className="font-heading text-lg font-bold text-foreground transition-colors group-hover:text-brand">
                  {branch.id}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {branchDocCounts[branch.id]} {branchDocCounts[branch.id] === 1 ? "doc" : "docs"}
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      )}

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground/40">
        JU Learning — Open source study materials.
      </footer>
    </>
  );
}
