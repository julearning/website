"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { documents } from "@/data/documents";
import { searchDocuments, type SearchResult } from "@/lib/search";
import type { FilterState } from "@/lib/types";
import { SearchBar } from "@/components/search/search-bar";
import { SearchResults } from "@/components/search/search-results";
import { FilterBar } from "@/components/search/filter-bar";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
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
      gsap.from(content, { y: 60, opacity: 0, duration: 1, ease: "power4.out" });
      gsap.to(".hero-overlay", {
        y: -80, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 2 },
      });
      gsap.to(content, {
        y: 40, opacity: 0.4, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1.5 },
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
      <div ref={heroRef} className="relative min-h-[90dvh] flex flex-col overflow-hidden">
        {/* Background image with overlay */}
        <div className="hero-overlay absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&q=80"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-background" />
          <div className="absolute inset-0 hero-grain" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 shadow-lg shadow-amber-500/20">
              <BookOpen className="h-5 w-5 text-black" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">JU Learning</span>
          </div>
          <nav className="flex items-center gap-1">
            <a href="/browse" className="px-3.5 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">Browse</a>
            <a href="/about" className="px-3.5 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">About</a>
            <a href="https://github.com/JU-Learning/julearning" target="_blank" rel="noopener noreferrer" className="ml-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:border-white/40 transition-colors">
              GitHub
            </a>
          </nav>
        </div>

        {/* Hero Content */}
        <div ref={contentRef} className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/60 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-amber-400" />
            {documents.length} open source study documents
          </div>

          <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl">
            Study smarter,<br />
            <span className="text-amber-400">together.</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">
            Search notes, PYQs, lab manuals, and assignments across all B.Tech branches. Free, open source, built by students.
          </p>

          <div className="mt-10 w-full max-w-xl">
            <SearchBar
              value={query}
              onChange={setQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              isFocused={isFocused}
              variant="hero"
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-white/40">
            {["CSE", "ECE", "EE", "ME", "CE"].map((b) => (
              <a key={b} href={`/browse/${b.toLowerCase()}`} className="transition-colors hover:text-white/70">
                {b}
              </a>
            ))}
            <span className="text-white/20">|</span>
            <span>8 semesters</span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 flex justify-center pb-8">
          <div className="h-8 w-5 rounded-full border border-white/20 flex items-start justify-center p-1">
            <div className="h-2 w-1 rounded-full bg-white/40 animate-bounce" />
          </div>
        </div>
      </div>

      {/* ─── Results ─── */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
        <AnimatePresence>
          {(query || hasActiveFilters || isFocused) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="pb-24"
            >
              <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-sm">
                <FilterBar filters={filters} onFilterChange={setFilters} />
              </div>
              <SearchResults results={results} query={query} isLoading={isLoading} hasFilters={hasActiveFilters} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Browse Teaser ─── */}
      {!query && !hasActiveFilters && !isFocused && (
        <div className="relative z-10 mx-auto max-w-5xl px-4 pb-32 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Browse by branch</h2>
            <p className="mt-2 text-sm text-zinc-500">Pick your branch and start finding what you need.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-5">
            {["CSE", "ECE", "EE", "ME", "CE"].map((branch, i) => (
              <motion.a
                key={branch}
                href={`/browse/${branch.toLowerCase()}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
                className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center transition-all hover:border-amber-500/30 hover:bg-zinc-900"
              >
                <div className="text-3xl mb-2">{["💻", "📡", "⚡", "⚙️", "🏗️"][i]}</div>
                <div className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">{branch}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  {documents.filter(d => d.branch === branch).length} docs
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800 py-8 text-center text-xs text-zinc-600">
        JU Learning — Open source study materials. Built by students, for students.
      </footer>
    </>
  );
}
