"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { documents } from "@/data/documents";
import { searchDocuments, type SearchResult } from "@/lib/search";
import type { FilterState, DocType, Branch } from "@/lib/types";
import { TYPE_LABELS } from "@/lib/types";
import { ResultCard } from "@/components/ResultCard";
import { PaginatedGrid } from "@/components/PaginatedGrid";
import { SortDropdown, type SortOption } from "@/components/SortDropdown";
import { TypeFilter } from "@/components/TypeFilter";
import { SourceDropdown, type SourceOption } from "@/components/SourceDropdown";
import { FilterDropdown } from "@/components/FilterDropdown";

interface SearchHeroProps {
  title?: string;
  subtitle?: string;
  defaultType?: DocType;
  searchOnMount?: boolean;
}

/** Source display order: "jammu-university" always first, rest alphabetically */
const SOURCE_RANK: Record<string, number> = {
  "jammu-university": 0,
};

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    "jammu-university": "Jammu University",
    "open-textbook-library": "Open Textbook Library",
    "openstax": "OpenStax",
    "project-gutenberg": "Project Gutenberg",
    "wikibooks": "Wikibooks",
  };
  return labels[source] || source;
}

/** Group results by source, JU first, others alphabetically */
function groupBySource(results: SearchResult[]): Array<{ source: string; label: string; docs: SearchResult[] }> {
  const groups = new Map<string, SearchResult[]>();
  for (const r of results) {
    const s = r.doc.source || "other";
    if (!groups.has(s)) groups.set(s, []);
    groups.get(s)!.push(r);
  }
  const sorted = Array.from(groups.entries()).map(([source, docs]) => ({
    source,
    label: getSourceLabel(source),
    docs,
  }));
  sorted.sort((a, b) => {
    const ra = SOURCE_RANK[a.source] ?? 1;
    const rb = SOURCE_RANK[b.source] ?? 1;
    if (ra !== rb) return ra - rb;
    return a.label.localeCompare(b.label);
  });
  return sorted;
}

export function SearchHero({ title = "JU Learning", subtitle = "Every branch. Every semester. Every note.", defaultType, searchOnMount }: SearchHeroProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [sort, setSort] = useState<SortOption>("relevance");
  const [activeType, setActiveType] = useState<DocType | null>(defaultType ?? null);
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const [activeBranch, setActiveBranch] = useState<string | null>(null);
  const [activeSemester, setActiveSemester] = useState<number | null>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute filter options from JU documents
  const juDocs = useMemo(() => documents.filter((d) => d.source === "jammu-university"), []);

  const availableBranches = useMemo(() => {
    return [...new Set(juDocs.map((d) => d.branch).filter(Boolean))].sort() as string[];
  }, [juDocs]);

  const availableSemesters = useMemo(() => {
    return [...new Set(juDocs.map((d) => d.semester).filter((s): s is number => s != null))].sort((a, b) => a - b);
  }, [juDocs]);

  const availableSubjects = useMemo(() => {
    return [...new Set(juDocs.map((d) => d.subject).filter(Boolean))].sort();
  }, [juDocs]);

  // Compute available sources from documents
  const availableSources: SourceOption[] = useMemo(() => {
    const sourceSet = new Set(documents.map((d) => d.source));
    return Array.from(sourceSet).sort((a, b) => {
      const ra = SOURCE_RANK[a] ?? 1;
      const rb = SOURCE_RANK[b] ?? 1;
      if (ra !== rb) return ra - rb;
      return a.localeCompare(b);
    }).map((id) => ({
      id,
      label: getSourceLabel(id),
    }));
  }, []);

  async function performSearch(
    q: string,
    sortOverride?: SortOption,
    typeOverride?: DocType | null,
    sourcesOverride?: string[],
    branchOverride?: string | null,
    semesterOverride?: number | null,
    subjectOverride?: string | null
  ) {
    const qTrim = q.trim();
    if (!qTrim && !(typeOverride ?? activeType) && (sourcesOverride ?? activeSources).length === 0 && !(branchOverride ?? activeBranch) && !(semesterOverride ?? activeSemester) && !(subjectOverride ?? activeSubject)) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsLoading(true);
    setHasSearched(true);

    await new Promise((r) => setTimeout(r, 200));

    const filters: FilterState = {
      query: q,
      branch: (branchOverride ?? activeBranch) as Branch | null,
      semester: semesterOverride ?? activeSemester,
      subject: subjectOverride ?? activeSubject,
      types: (typeOverride ?? activeType) ? [(typeOverride ?? activeType)!] : [],
      sources: sourcesOverride ?? activeSources,
      sort: sortOverride ?? sort,
    };
    const found = searchDocuments(documents, filters);
    setResults(found);
    setIsLoading(false);
  }

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
    }, 1000);
  };

  // Search autocomplete
  const suggestion = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 1) return "";

    for (const doc of documents) {
      const lower = doc.title.toLowerCase();
      if (lower.startsWith(q) && lower.length > q.length) {
        return doc.title.slice(query.trim().length);
      }
    }
    for (const doc of documents) {
      const subjectStr = doc.subject || "";
      const lower = subjectStr.toLowerCase();
      if (lower.startsWith(q) && lower.length > q.length) {
        return subjectStr.slice(query.trim().length);
      }
    }
    return "";
  }, [query]);

  useEffect(() => {
    if (searchOnMount && defaultType) {
      performSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setActiveType(defaultType ?? null);
    setActiveSources([]);
    setActiveBranch(null);
    setActiveSemester(null);
    setActiveSubject(null);
    inputRef.current?.focus();
  }

  function handleSortChange(newSort: SortOption) {
    setSort(newSort);
    if (hasSearched && (query.trim() || activeType || activeSources.length > 0)) {
      performSearch(query, newSort);
    }
  }

  function handleTypeChange(newType: DocType | null) {
    setActiveType(newType);
    performSearch(query, undefined, newType);
  }

  function handleBranchChange(branch: string | null) {
    setActiveBranch(branch);
    setActiveSemester(null); // reset dependent filters
    setActiveSubject(null);
    performSearch(query, undefined, undefined, undefined, branch, null, null);
  }

  function handleSemesterChange(semester: number | null) {
    setActiveSemester(semester);
    setActiveSubject(null); // reset subject when semester changes
    performSearch(query, undefined, undefined, undefined, undefined, semester, null);
  }

  function handleSubjectChange(subject: string | null) {
    setActiveSubject(subject);
    performSearch(query, undefined, undefined, undefined, undefined, undefined, subject);
  }

  function handleSourcesChange(newSources: string[]) {
    setActiveSources(newSources);
    performSearch(query, undefined, undefined, newSources);
  }

  // Group results by source
  const grouped = useMemo(() => {
    if (results.length === 0) return [];
    return groupBySource(results);
  }, [results]);

  const showSourceHeadings = activeSources.length <= 1 && availableSources.length > 1;

  return (
    <>
      <div className="flex min-h-[calc(100dvh-60px)] flex-col items-center justify-center text-center">
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl">
          {title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground sm:text-xl lg:text-2xl">
          {subtitle}
        </p>

        <div className="relative mt-12 w-full max-w-2xl">
          <div className="flex items-center bg-surface ring-1 ring-border/30 transition-all duration-200 focus-within:ring-2 focus-within:ring-brand/20">
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
            {query && (
              <button
                onClick={handleClear}
                className="mr-4 flex h-10 w-10 items-center justify-center text-muted-foreground/50 transition-colors hover:text-foreground"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            )}
          </div>

          {/* Filters — under the search bar */}
          <div className="flex flex-wrap items-center justify-end gap-1 pt-2">
            <SortDropdown value={sort} onChange={handleSortChange} />
            <TypeFilter activeType={activeType} onChange={handleTypeChange} />
            <FilterDropdown
              label="Branch"
              options={availableBranches}
              active={activeBranch}
              placeholder="All Branches"
              onChange={handleBranchChange}
            />
            <FilterDropdown
              label="Sem"
              options={availableSemesters.map((s) => String(s))}
              active={activeSemester !== null ? String(activeSemester) : null}
              placeholder="All Sems"
              onChange={(val) => handleSemesterChange(val !== null ? Number(val) : null)}
            />
            <FilterDropdown
              label="Subject"
              options={availableSubjects}
              active={activeSubject}
              placeholder="All Subjects"
              onChange={handleSubjectChange}
            />
            {availableSources.length > 1 && (
              <SourceDropdown
                availableSources={availableSources}
                activeSources={activeSources}
                onChange={handleSourcesChange}
              />
            )}
          </div>
        </div>
      </div>

      {/* Search results */}
      {hasSearched && (
        <div className="mt-8">
          {!isLoading && (
            <p className="mb-4 text-sm text-muted-foreground">
              {results.length} result{results.length !== 1 ? "s" : ""}
              {isFocused && query.trim() && !isLoading && <span className="ml-2 text-muted-foreground/40">· auto-searching in 1s</span>}
            </p>
          )}

          {isLoading ? (
            <div className="columns-2 gap-5 lg:columns-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="mb-5 animate-pulse break-inside-avoid overflow-hidden bg-surface">
                  <div className="h-56 bg-accent" />
                  <div className="p-4">
                    <div className="mb-2 h-4 w-3/4 bg-accent/50" />
                    <div className="h-3 w-1/2 bg-accent/30" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 h-12 w-12 text-muted-foreground/20">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M8 11h6" /><path d="M11 8v6" />
              </svg>
              <p className="text-base font-medium text-muted-foreground">No results found.</p>
              <p className="mt-2 text-sm text-muted-foreground/50">Try broadening your search or removing some filters.</p>
            </div>
          ) : grouped.length === 1 ? (
            /* Single source: show flat results */
            <PaginatedGrid
              items={grouped[0].docs}
              renderItem={(result) => <ResultCard key={result.doc.id} result={result} />}
              itemsPerPage={9}
            />
          ) : (
            /* Multiple sources: show grouped with source headings */
            <div className="space-y-12">
              {grouped.map((group) => (
                <section key={group.source}>
                  {showSourceHeadings && (
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground/60">
                      {group.label}
                    </h2>
                  )}
                  <PaginatedGrid
                    items={group.docs}
                    renderItem={(result) => <ResultCard key={result.doc.id} result={result} />}
                    itemsPerPage={9}
                  />
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
