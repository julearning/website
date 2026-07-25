"use client";

import { X } from "lucide-react";
import type { Branch, Semester, DocumentTag, FilterState } from "@/lib/types";
import { BRANCHES, SEMESTERS, DOCUMENT_TAGS } from "@/lib/types";
import { getUniqueSubjects } from "@/data/documents";

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const subjects = filters.branch ? getUniqueSubjects(filters.branch) : [];

  const activeFilters: { label: string; onRemove: () => void }[] = [];
  if (filters.branch) {
    const b = BRANCHES.find((x) => x.id === filters.branch);
    activeFilters.push({ label: b?.id || filters.branch, onRemove: () => onFilterChange({ ...filters, branch: null, subject: null }) });
  }
  if (filters.semester) activeFilters.push({ label: `Sem ${filters.semester}`, onRemove: () => onFilterChange({ ...filters, semester: null }) });
  if (filters.subject) activeFilters.push({ label: filters.subject.length > 20 ? filters.subject.slice(0, 20) + "..." : filters.subject, onRemove: () => onFilterChange({ ...filters, subject: null }) });
  if (filters.fileType) activeFilters.push({ label: filters.fileType.toUpperCase(), onRemove: () => onFilterChange({ ...filters, fileType: null }) });
  for (const tag of filters.tags) {
    const t = DOCUMENT_TAGS.find((x) => x.id === tag);
    activeFilters.push({ label: t?.label || tag, onRemove: () => onFilterChange({ ...filters, tags: filters.tags.filter((x) => x !== tag) }) });
  }

  const selectClass = "h-9 appearance-none rounded-xl border border-zinc-800 bg-zinc-900 px-3 pr-8 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-300 focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/10";

  return (
    <div className="space-y-3">
      {/* Active pills */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeFilters.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
              {f.label}
              <button onClick={f.onRemove} className="inline-flex items-center justify-center rounded-full p-0.5 hover:bg-amber-500/20">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button onClick={() => onFilterChange({ query: filters.query, branch: null, semester: null, subject: null, tags: [], fileType: null, sort: "relevance" })}
            className="text-xs font-medium text-zinc-600 hover:text-zinc-400 transition-colors">Clear all</button>
        </div>
      )}

      {/* Dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={filters.branch || ""} onChange={(e) => onFilterChange({ ...filters, branch: (e.target.value || null) as Branch | null, subject: null })} className={selectClass}>
          <option value="">All Branches</option>
          {BRANCHES.map((b) => <option key={b.id} value={b.id}>{b.id}</option>)}
        </select>
        <select value={filters.semester || ""} onChange={(e) => onFilterChange({ ...filters, semester: (e.target.value ? Number(e.target.value) : null) as Semester | null })} className={selectClass}>
          <option value="">All Semesters</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        <select value={filters.subject || ""} onChange={(e) => onFilterChange({ ...filters, subject: e.target.value || null })} disabled={subjects.length === 0} className={`${selectClass} disabled:opacity-30`}>
          <option value="">All Subjects</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.sort} onChange={(e) => onFilterChange({ ...filters, sort: e.target.value as FilterState["sort"] })} className={selectClass}>
          <option value="relevance">Relevance</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name</option>
          <option value="size">Size</option>
        </select>
      </div>

      {/* Tag chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {DOCUMENT_TAGS.map((tag) => {
          const sel = filters.tags.includes(tag.id);
          return (
            <button key={tag.id} onClick={() => onFilterChange({ ...filters, tags: sel ? filters.tags.filter((t) => t !== tag.id) : [...filters.tags, tag.id] })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${sel ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"}`}>
              {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
