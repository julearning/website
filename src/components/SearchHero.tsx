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

interface SearchHeroProps {
  title?: string;
  subtitle?: string;
  defaultType?: DocType;
  searchOnMount?: boolean;
  /** Pre-select a source filter, e.g. from URL query param */
  defaultSource?: string;
}

/** Source display order: "jammu-university" always first, rest alphabetically */
const SOURCE_RANK: Record<string, number> = {
  "jammu-university": 0,
};

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    "jammu-university": "Jammu University",
  };
  return labels[source] || source.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getSourceTitle(source: string): string {
  const titles: Record<string, string> = {
    "jammu-university": "JU Learning",
  };
  return titles[source] || getSourceLabel(source);
}

function getSourceSubtitle(source: string): string {
  const subtitles: Record<string, string> = {
    "jammu-university": "Every branch. Every semester. Every note.",
  };
  return subtitles[source] || getSourceLabel(source);
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

/** Only JU documents for the browse chips */
const juDocs = documents.filter((d) => d.source === "jammu-university");

function getBranches(): string[] {
  return [...new Set(juDocs.map((d) => d.branch).filter(Boolean))].sort() as string[];
}

function getSemesters(branch: string): number[] {
  return [...new Set(juDocs.filter((d) => d.branch === branch).map((d) => d.semester))].filter((s): s is number => s != null).sort((a, b) => a - b);
}

function getSubjects(branch: string, semester: number): string[] {
  return [...new Set(juDocs.filter((d) => d.branch === branch && d.semester === semester).map((d) => d.subject).filter((s): s is string => !!s))]
    .filter((s) => !/^Semester\s+\d+$/i.test(s))
    .sort();
}

function BrowseChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-4 text-xl font-bold transition-all duration-200 sm:px-10 sm:py-5 sm:text-2xl ${
        active
          ? "bg-brand text-white"
          : "bg-surface text-foreground hover:bg-brand hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

export function SearchHero({
  title: propTitle,
  subtitle: propSubtitle,
  defaultType,
  searchOnMount,
  defaultSource,
}: SearchHeroProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [sort, setSort] = useState<SortOption>("relevance");
  const [activeType, setActiveType] = useState<DocType | null>(defaultType ?? null);
  const [activeSources, setActiveSources] = useState<string[]>(defaultSource ? [defaultSource] : []);
  const [activeBranch, setActiveBranch] = useState<string | null>(null);
  const [activeSemester, setActiveSemester] = useState<number | null>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine title/subtitle based on active source
  const selectedSource = activeSources.length === 1 ? activeSources[0] : null;
  const title = propTitle || (selectedSource ? getSourceTitle(selectedSource) : "JU Learning");
  const subtitle = propSubtitle || (selectedSource ? getSourceSubtitle(selectedSource) : "Every branch. Every semester. Every note.");

  // Compute browse chip options
  const branches = useMemo(() => getBranches(), []);
  const semesters = useMemo(() => activeBranch ? getSemesters(activeBranch) : [], [activeBranch]);
  const subjects = useMemo(() => activeBranch && activeSemester ? getSubjects(activeBranch, activeSemester) : [], [activeBranch, activeSemester]);

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
    subjectOverride?: string | null,
  ) {
    const qTrim = q.trim();
    const currentBranch = branchOverride ?? activeBranch;
    const currentSemester = semesterOverride ?? activeSemester;
    const currentSubject = subjectOverride ?? activeSubject;
    const currentSources = sourcesOverride ?? activeSources;
    const currentType = typeOverride ?? activeType;

    // Don't clear if there are browse selections
    if (!qTrim && !currentType && currentSources.length === 0 && !currentBranch && !currentSemester && !currentSubject) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsLoading(true);
    setHasSearched(true);

    await new Promise((r) => setTimeout(r, 200));

    const filters: FilterState = {
      query: q,
      branch: currentBranch as Branch | null,
      semester: currentSemester,
      subject: currentSubject,
      types: currentType ? [currentType] : [],
      sources: currentSources,
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

  // If a defaultSource was provided, sync dropdown + search on mount
  useEffect(() => {
    if (defaultSource) {
      setActiveSources([defaultSource]);
      performSearch("", undefined, undefined, [defaultSource]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSource]);

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
    setActiveSources(defaultSource ? [defaultSource] : []);
    setActiveBranch(null);
    setActiveSemester(null);
    setActiveSubject(null);
    inputRef.current?.focus();
  }

  function handleSortChange(newSort: SortOption) {
    setSort(newSort);
    if (hasSearched) {
      performSearch(query, newSort);
    }
  }

  function handleTypeChange(newType: DocType | null) {
    setActiveType(newType);
    performSearch(query, undefined, newType);
  }

  function handleSourcesChange(newSources: string[]) {
    setActiveSources(newSources);
    // If switching away from a single source, reset the title
    performSearch(query, undefined, undefined, newSources);
  }

  // Browse chip handlers
  function handleBranchClick(branch: string) {
    if (branch === activeBranch) {
      setActiveBranch(null);
      setActiveSemester(null);
      setActiveSubject(null);
      performSearch(query, undefined, undefined, undefined, null, null, null);
    } else {
      setActiveBranch(branch);
      setActiveSemester(null);
      setActiveSubject(null);
      performSearch(query, undefined, undefined, undefined, branch, null, null);
    }
  }

  function handleSemesterClick(sem: number) {
    if (sem === activeSemester) {
      setActiveSemester(null);
      setActiveSubject(null);
      performSearch(query, undefined, undefined, undefined, undefined, null, null);
    } else {
      setActiveSemester(sem);
      setActiveSubject(null);
      performSearch(query, undefined, undefined, undefined, undefined, sem, null);
    }
  }

  function handleSubjectClick(subject: string) {
    if (subject === activeSubject) {
      setActiveSubject(null);
      performSearch(query, undefined, undefined, undefined, undefined, undefined, null);
    } else {
      setActiveSubject(subject);
      performSearch(query, undefined, undefined, undefined, undefined, undefined, subject);
    }
  }

  // Group results by source
  const grouped = useMemo(() => {
    if (results.length === 0) return [];
    return groupBySource(results);
  }, [results]);

  const showSourceHeadings = activeSources.length <= 1 && availableSources.length > 1;

  // Step indicator
  const showStepIndicator = activeBranch || activeSemester || activeSubject;

  return (
    <>
      <div className="flex flex-col items-center text-center pt-12 sm:pt-16">
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

          {/* Filters — above browse chips */}
          <div className="flex flex-wrap items-center justify-end gap-1 pt-4">
            <SortDropdown value={sort} onChange={handleSortChange} />
            <TypeFilter activeType={activeType} onChange={handleTypeChange} />
            {availableSources.length > 1 && (
              <SourceDropdown
                availableSources={availableSources}
                activeSources={activeSources}
                onChange={handleSourcesChange}
              />
            )}
          </div>

          {/* Browse chips — right below the search bar, big and bold */}
          {branches.length > 0 && (
            <div className="mt-6 text-left">
              {showStepIndicator && (
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground/60">
                  <button
                    onClick={() => { setActiveBranch(null); setActiveSemester(null); setActiveSubject(null); setResults([]); setHasSearched(false); }}
                    className="hover:text-foreground transition-colors font-bold"
                  >
                    Browse
                  </button>
                  {activeBranch && <><span>/</span><span className="font-bold text-foreground">{activeBranch}</span></>}
                  {activeSemester && <><span>/</span><span className="font-bold text-foreground">Sem {activeSemester}</span></>}
                  {activeSubject && <><span>/</span><span className="font-bold text-foreground">{activeSubject}</span></>}
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                {!activeBranch ? (
                  /* Step 1: Show all branches */
                  branches.map((branch) => (
                    <BrowseChip
                      key={branch}
                      label={branch}
                      active={false}
                      onClick={() => handleBranchClick(branch)}
                    />
                  ))
                ) : !activeSemester ? (
                  /* Step 2: Show semesters for selected branch */
                  semesters.map((sem) => (
                    <BrowseChip
                      key={sem}
                      label={`Semester ${sem}`}
                      active={false}
                      onClick={() => handleSemesterClick(sem)}
                    />
                  ))
                ) : !activeSubject ? (
                  /* Step 3: Show subjects for selected branch + semester */
                  subjects.map((subj) => (
                    <BrowseChip
                      key={subj}
                      label={subj}
                      active={false}
                      onClick={() => handleSubjectClick(subj)}
                    />
                  ))
                ) : null}
              </div>

              {/* Back button when a selection is made */}
              {activeBranch && !activeSemester && (
                <button
                  onClick={() => handleBranchClick(activeBranch)}
                  className="mt-4 text-sm text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  ← Back to branches
                </button>
              )}
              {activeSemester && !activeSubject && (
                <button
                  onClick={() => handleSemesterClick(activeSemester)}
                  className="mt-4 text-sm text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  ← Back to semesters
                </button>
              )}
              {activeSubject && (
                <button
                  onClick={() => handleSubjectClick(activeSubject)}
                  className="mt-4 text-sm text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  ← Back to subjects
                </button>
              )}
            </div>
          )}


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
            <PaginatedGrid
              items={grouped[0].docs}
              renderItem={(result) => <ResultCard key={result.doc.id} result={result} />}
              itemsPerPage={9}
            />
          ) : (
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
