"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { documents } from "@/data/documents";
import { searchDocuments, type SearchResult } from "@/lib/search";
import type { FilterState, DocType } from "@/lib/types";
import { TYPE_LABELS } from "@/lib/types";
import { ResultCard } from "@/components/ResultCard";
import { PaginatedGrid } from "@/components/PaginatedGrid";
import { SortDropdown, type SortOption } from "@/components/SortDropdown";
import { TypeFilter } from "@/components/TypeFilter";
import { SourceDropdown, type SourceOption } from "@/components/SourceDropdown";
import {
  getAllDegrees,
  getBranchesByDegree,
  getSemestersByBranch,
  getSubjectsBySemester,
  getTypesForSubject,
  getDocumentCount,
  type DegreeInfo,
} from "@/lib/hierarchy";
import { slugify, deslugifyDegree } from "@/lib/slugs";
import { loadPreferences } from "@/lib/preferences";
import { useRouter } from "next/navigation";

interface SearchHeroProps {
  title?: string;
  subtitle?: string;
  defaultType?: DocType;
  searchOnMount?: boolean;
  /** Pre-select a source filter, e.g. from URL query param */
  defaultSource?: string;
  /** Hide the type filter dropdown — used on dedicated type pages */
  hideTypeFilter?: boolean;
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

function SelectionChip({
  label,
  active,
  onClick,
  size = "md",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  size?: "md" | "lg";
}) {
  const sizeClasses =
    size === "lg"
      ? "px-6 py-4 text-xl sm:px-10 sm:py-5 sm:text-2xl"
      : "px-4 py-2.5 text-base sm:px-6 sm:py-3 sm:text-lg";

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses} font-bold transition-all duration-200 ${
        active
          ? "bg-brand text-white shadow-lg shadow-brand/20"
          : "bg-surface text-foreground hover:bg-brand hover:text-white hover:shadow-lg hover:shadow-brand/20"
      }`}
    >
      {label}
    </button>
  );
}



export function SearchHero({
  title: propTitle,
  subtitle: propSubtitle,
  defaultType,    searchOnMount,
  defaultSource,
  hideTypeFilter,
}: SearchHeroProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [sort, setSort] = useState<SortOption>("relevance");
  const [activeType, setActiveType] = useState<DocType | null>(defaultType ?? null);
  // Initialize with all source IDs by default — each source toggles independently
  // (no implicit "all" state that causes unexpected deselection)
  const allSourceIds = useMemo(
    () => [...new Set(documents.map((d) => d.source))],
    [],
  );
  const [activeSources, setActiveSources] = useState<string[]>(
    defaultSource ? [defaultSource] : allSourceIds,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Progressive Cascade State ──────────────────────────────────
  const degrees = useMemo(() => getAllDegrees(), []);
  const [selectedDegree, setSelectedDegree] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Derived options for each step
  const branches = useMemo(
    () => (selectedDegree ? getBranchesByDegree(selectedDegree) : []),
    [selectedDegree],
  );
  const semesters = useMemo(
    () =>
      selectedDegree && selectedBranch
        ? getSemestersByBranch(selectedDegree, selectedBranch)
        : [],
    [selectedDegree, selectedBranch],
  );
  const subjects = useMemo(
    () =>
      selectedDegree && selectedBranch && selectedSemester != null
        ? getSubjectsBySemester(selectedDegree, selectedBranch, selectedSemester)
        : [],
    [selectedDegree, selectedBranch, selectedSemester],
  );
  const types = useMemo(
    () =>
      selectedDegree && selectedBranch && selectedSemester != null && selectedSubject
        ? getTypesForSubject(selectedDegree, selectedBranch, selectedSemester, selectedSubject)
        : [],
    [selectedDegree, selectedBranch, selectedSemester, selectedSubject],
  );

  // Determine title/subtitle based on active source
  const selectedSource = activeSources.length === 1 ? activeSources[0] : null;
  const title = propTitle || (selectedSource ? getSourceTitle(selectedSource) : "JU Learning");
  const subtitle = propSubtitle || (selectedSource ? getSourceSubtitle(selectedSource) : "Every branch. Every semester. Every note.");

  // Cascade (degree/branch/semester) only shows when jammu-university source is active
  // Other sources are flat (no hierarchy), so the cascade is meaningless
  const jammuActive = activeSources.includes("jammu-university");

  // Compute available sources from documents
  const availableSources: SourceOption[] = useMemo(() => {
    const sourceSet = new Set(documents.map((d) => d.source));
    return Array.from(sourceSet)
      .sort((a, b) => {
        const ra = SOURCE_RANK[a] ?? 1;
        const rb = SOURCE_RANK[b] ?? 1;
        if (ra !== rb) return ra - rb;
        return a.localeCompare(b);
      })
      .map((id) => ({
        id,
        label: getSourceLabel(id),
      }));
  }, []);

  async function performSearch(
    q: string,
    sortOverride?: SortOption,
    typeOverride?: DocType | null,
    sourcesOverride?: string[],
  ) {
    const qTrim = q.trim();
    const currentSources = sourcesOverride ?? activeSources;
    const currentType = typeOverride ?? activeType;

    // Build filter state from cascade + type + source
    const filters: FilterState = {
      query: q,
      degree: selectedDegree,
      branch: (selectedBranch as any) || null,
      semester: selectedSemester,
      subject: selectedSubject,
      types: currentType ? [currentType] : [],
      sources: currentSources,
      sort: sortOverride ?? sort,
    };

    // If nothing is selected and no query, clear results
    if (
      !qTrim &&
      !currentType &&
      currentSources.length === 0 &&
      !selectedDegree &&
      !selectedBranch &&
      selectedSemester == null &&
      !selectedSubject
    ) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    await new Promise((r) => setTimeout(r, 200));

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

  // Load saved preferences from localStorage on mount
  // React 18 batches all state updates in effects, so all three are applied in one render
  useEffect(() => {
    const prefs = loadPreferences();
    if (prefs.degree) {
      setSelectedDegree(prefs.degree);
      if (prefs.branch) setSelectedBranch(prefs.branch);
      if (prefs.semester != null) setSelectedSemester(prefs.semester);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for preference changes from the SettingsPanel (in navbar)
  useEffect(() => {
    function onPrefsChanged() {
      const prefs = loadPreferences();
      setSelectedDegree(prefs.degree);
      setSelectedBranch(prefs.degree ? prefs.branch : null);
      setSelectedSemester(prefs.degree && prefs.branch ? prefs.semester : null);
      setSelectedSubject(null);
      setActiveType(defaultType ?? null);
    }
    window.addEventListener("julearning-preferences-changed", onPrefsChanged);
    return () => window.removeEventListener("julearning-preferences-changed", onPrefsChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Re-run search when cascade selections change
  useEffect(() => {
    if (hasSearched || selectedDegree || selectedBranch || selectedSemester != null || selectedSubject) {
      performSearch(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch, selectedSemester, selectedSubject, selectedDegree, activeType]);

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
    setActiveSources(defaultSource ? [defaultSource] : allSourceIds);
    setSelectedDegree(null);
    setSelectedBranch(null);
    setSelectedSemester(null);
    setSelectedSubject(null);
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
    // When jammu-university is removed from active sources, clear the cascade
    // (other sources don't have degree/branch/semester hierarchy)
    const juWasActive = activeSources.includes("jammu-university");
    const juNowActive = newSources.includes("jammu-university");
    if (juWasActive && !juNowActive) {
      setSelectedDegree(null);
      setSelectedBranch(null);
      setSelectedSemester(null);
      setSelectedSubject(null);
      setActiveType(defaultType ?? null);
    }
    setActiveSources(newSources);
    // Only search if there's an actual query — changing sources with an empty
    // search bar should not trigger results
    if (query.trim()) {
      performSearch(query, undefined, undefined, newSources);
    }
  }

  // ── Cascade Handlers ───────────────────────────────────────────
  function handleDegreeClick(degreeId: string) {
    if (degreeId === selectedDegree) {
      // Deselect
      setSelectedDegree(null);
      setSelectedBranch(null);
      setSelectedSemester(null);
      setSelectedSubject(null);
      setActiveType(defaultType ?? null);
    } else {
      setSelectedDegree(degreeId);
      setSelectedBranch(null);
      setSelectedSemester(null);
      setSelectedSubject(null);
      setActiveType(defaultType ?? null);
    }
  }

  function handleBranchClick(branch: string) {
    if (branch === selectedBranch) {
      setSelectedBranch(null);
      setSelectedSemester(null);
      setSelectedSubject(null);
      setActiveType(defaultType ?? null);
    } else {
      setSelectedBranch(branch);
      setSelectedSemester(null);
      setSelectedSubject(null);
      setActiveType(defaultType ?? null);
    }
  }

  function handleSemesterClick(sem: number) {
    if (sem === selectedSemester) {
      setSelectedSemester(null);
      setSelectedSubject(null);
      setActiveType(defaultType ?? null);
    } else {
      setSelectedSemester(sem);
      setSelectedSubject(null);
      setActiveType(defaultType ?? null);
    }
  }

  function handleSubjectClick(subject: string) {
    if (subject === selectedSubject) {
      setSelectedSubject(null);
      setActiveType(defaultType ?? null);
    } else {
      setSelectedSubject(subject);
      setActiveType(null); // Reset type when subject changes
    }
  }

  // Navigate to the full page for the current selection
  function handleBrowseToPage() {
    if (!selectedDegree || !selectedBranch) return;
    let path = `/${selectedDegree}/${slugify(selectedBranch)}`;
    if (selectedSemester != null) {
      path += `/sem-${selectedSemester}`;
      if (selectedSubject) {
        path += `/${slugify(selectedSubject)}`;
      }
    }
    router.push(path);
  }

  // Group results by source
  const grouped = useMemo(() => {
    if (results.length === 0) return [];
    return groupBySource(results);
  }, [results]);

  const showSourceHeadings = activeSources.length <= 1 && availableSources.length > 1;

  // Selection state for showing the cascade
  const hasAnySelection = selectedDegree || selectedBranch || selectedSemester != null || selectedSubject;
  const selectionCount = [selectedDegree, selectedBranch, selectedSemester != null, !!selectedSubject].filter(Boolean).length;

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

          {/* Filters — above the cascade */}
          <div className="flex flex-wrap items-center justify-end gap-1 pt-4">
            <SortDropdown value={sort} onChange={handleSortChange} />
            {!hideTypeFilter && <TypeFilter activeType={activeType} onChange={handleTypeChange} />}
            {availableSources.length > 1 && (
              <SourceDropdown
                availableSources={availableSources}
                activeSources={activeSources}
                onChange={handleSourcesChange}
              />
            )}
          </div>

          {/* ── Progressive Cascade ─────────────────────────────────── */}
          {/* Only shown when jammu-university is active — other sources are flat (no hierarchy) */}
          {jammuActive && (
            <div className="mt-8 text-left">
              {/* Breadcrumb-style indicator */}
              {hasAnySelection && (
                <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
                  <button
                    onClick={() => {
                      setSelectedDegree(null);
                      setSelectedBranch(null);
                      setSelectedSemester(null);
                      setSelectedSubject(null);
                      setActiveType(defaultType ?? null);
                      setResults([]);
                      setHasSearched(false);
                    }}
                    className="font-bold text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    Browse
                  </button>
                  {selectedDegree && (
                    <>
                      <span className="text-muted-foreground/30">/</span>
                      <span className="font-bold text-foreground">
                        {deslugifyDegree(selectedDegree)}
                      </span>
                    </>
                  )}
                  {selectedBranch && (
                    <>
                      <span className="text-muted-foreground/30">/</span>
                      <span className="font-bold text-foreground">{selectedBranch}</span>
                    </>
                  )}
                  {selectedSemester != null && (
                    <>
                      <span className="text-muted-foreground/30">/</span>
                      <span className="font-bold text-foreground">Sem {selectedSemester}</span>
                    </>
                  )}
                  {selectedSubject && (
                    <>
                      <span className="text-muted-foreground/30">/</span>
                      <span className="font-bold text-foreground">{selectedSubject}</span>
                    </>
                  )}
                </div>
              )}

              {/* Step 1: Degree (always starts here — user must choose) */}
              {degrees.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
                    {!selectedDegree ? "Select your degree" : "Degree"}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {degrees.map((deg) => (
                      <SelectionChip
                        key={deg.id}
                        label={deg.name}
                        active={selectedDegree === deg.id}
                        onClick={() => handleDegreeClick(deg.id)}
                        size="md"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Branch */}
              {selectedDegree && branches.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
                    {!selectedBranch ? "Select your branch" : "Branch"}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {branches.map((branch) => (
                      <SelectionChip
                        key={branch}
                        label={branch}
                        active={selectedBranch === branch}
                        onClick={() => handleBranchClick(branch)}
                        size="lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Semester */}
              {selectedBranch && semesters.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
                    {selectedSemester == null ? "Select your semester" : "Semester"}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {semesters.map((sem) => (
                      <SelectionChip
                        key={sem}
                        label={`Semester ${sem}`}
                        active={selectedSemester === sem}
                        onClick={() => handleSemesterClick(sem)}
                        size="md"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Subject */}
              {selectedSemester != null && subjects.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
                    {!selectedSubject ? "Select your subject" : "Subject"}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {subjects.map((subj) => (
                      <SelectionChip
                        key={subj}
                        label={subj}
                        active={selectedSubject === subj}
                        onClick={() => handleSubjectClick(subj)}
                        size="md"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Type filter (only when subject selected) */}
              {selectedSubject && types.length > 1 && (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
                    Filter by type
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <SelectionChip
                      label="All"
                      active={activeType === null}
                      onClick={() => handleTypeChange(null)}
                      size="md"
                    />
                    {types.map((t) => (
                      <SelectionChip
                        key={t}
                        label={TYPE_LABELS[t] || t}
                        active={activeType === t}
                        onClick={() => handleTypeChange(t as DocType)}
                        size="md"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* View full page button */}
              {selectedDegree && selectedBranch && (
                <div className="mt-5">
                  <button
                    onClick={handleBrowseToPage}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white font-bold text-sm transition-all duration-200 hover:opacity-90"
                  >
                    View all{" "}
                    {selectedBranch}
                    {selectedSemester != null ? ` Sem ${selectedSemester}` : ""}
                    {selectedSubject ? ` · ${selectedSubject}` : ""}
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search results */}
      {hasSearched && (
        <div className="mt-8">
          {!isLoading && (
            <div className="mb-4 flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""}
                {isFocused && query.trim() && !isLoading && (
                  <span className="ml-2 text-muted-foreground/40">· auto-searching in 1s</span>
                )}
              </p>
              <button
                onClick={handleClear}
                className="text-xs font-semibold text-muted-foreground/50 underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Clear results
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="columns-2 gap-5 lg:columns-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="mb-5 animate-pulse break-inside-avoid overflow-hidden bg-surface"
                >
                  <div className="h-56 bg-accent" />
                  <div className="p-4">
                    <div className="mb-2 h-4 w-3/4 bg-accent/50" />
                    <div className="h-3 w-1/2 bg-accent/30" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 && query.trim() ? (
            <div className="flex flex-col items-center py-20 text-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-4 h-12 w-12 text-muted-foreground/20"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
                <path d="M8 11h6" />
                <path d="M11 8v6" />
              </svg>
              <p className="text-base font-medium text-muted-foreground">No results found.</p>
              <p className="mt-2 text-sm text-muted-foreground/50">
                Try broadening your search or removing some filters.
              </p>
            </div>
          ) : results.length > 0 ? (
            grouped.length === 1 ? (
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
                      renderItem={(result) => (
                        <ResultCard key={result.doc.id} result={result} />
                      )}
                      itemsPerPage={9}
                    />
                  </section>
                ))}
              </div>
            )
          ) : null}
        </div>
      )}
    </>
  );
}


