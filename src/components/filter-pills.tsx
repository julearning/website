"use client";

import { X } from "lucide-react";
import type { Branch, Semester, DocumentTag, FilterState } from "@/lib/types";
import { BRANCHES, SEMESTERS, DOCUMENT_TAGS } from "@/lib/types";
import { getUniqueSubjects } from "@/data/documents";

interface FilterPillsProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export function FilterPills({ filters, onFilterChange }: FilterPillsProps) {
  const activeFilters: { label: string; onRemove: () => void }[] = [];

  if (filters.branch) {
    const branch = BRANCHES.find((b) => b.id === filters.branch);
    activeFilters.push({
      label: branch?.name || filters.branch,
      onRemove: () => onFilterChange({ ...filters, branch: null }),
    });
  }

  if (filters.semester) {
    activeFilters.push({
      label: `Semester ${filters.semester}`,
      onRemove: () => onFilterChange({ ...filters, semester: null }),
    });
  }

  if (filters.subject) {
    activeFilters.push({
      label: filters.subject,
      onRemove: () => onFilterChange({ ...filters, subject: null }),
    });
  }

  if (filters.fileType) {
    activeFilters.push({
      label: filters.fileType.toUpperCase(),
      onRemove: () => onFilterChange({ ...filters, fileType: null }),
    });
  }

  for (const tag of filters.tags) {
    const tagInfo = DOCUMENT_TAGS.find((t) => t.id === tag);
    activeFilters.push({
      label: tagInfo?.label || tag,
      onRemove: () =>
        onFilterChange({
          ...filters,
          tags: filters.tags.filter((t) => t !== tag),
        }),
    });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {activeFilters.map((filter, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-inset ring-blue-200/50"
        >
          {filter.label}
          <button
            onClick={filter.onRemove}
            className="inline-flex items-center justify-center rounded-full p-0.5 transition-colors hover:bg-blue-100"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        onClick={() =>
          onFilterChange({
            query: filters.query,
            branch: null,
            semester: null,
            subject: null,
            tags: [],
            fileType: null,
            sort: "relevance",
          })
        }
        className="text-[11px] font-medium text-zinc-400 transition-colors hover:text-zinc-600"
      >
        Clear all
      </button>
    </div>
  );
}

interface FilterDropdownsProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export function FilterDropdowns({ filters, onFilterChange }: FilterDropdownsProps) {
  const subjects = filters.branch ? getUniqueSubjects(filters.branch) : [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Branch */}
      <select
        value={filters.branch || ""}
        onChange={(e) =>
          onFilterChange({
            ...filters,
            branch: (e.target.value || null) as Branch | null,
            subject: null, // Reset subject when branch changes
          })
        }
        className="appearance-none rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <option value="">All Branches</option>
        {BRANCHES.map((b) => (
          <option key={b.id} value={b.id}>
            {b.id}
          </option>
        ))}
      </select>

      {/* Semester */}
      <select
        value={filters.semester || ""}
        onChange={(e) =>
          onFilterChange({
            ...filters,
            semester: (e.target.value ? Number(e.target.value) : null) as Semester | null,
          })
        }
        className="appearance-none rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <option value="">All Semesters</option>
        {SEMESTERS.map((s) => (
          <option key={s} value={s}>
            Semester {s}
          </option>
        ))}
      </select>

      {/* Subject */}
      <select
        value={filters.subject || ""}
        onChange={(e) =>
          onFilterChange({
            ...filters,
            subject: e.target.value || null,
          })
        }
        className="appearance-none rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        disabled={subjects.length === 0}
      >
        <option value="">All Subjects</option>
        {subjects.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Sort */}
      <select
        value={filters.sort}
        onChange={(e) =>
          onFilterChange({
            ...filters,
            sort: e.target.value as FilterState["sort"],
          })
        }
        className="appearance-none rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <option value="relevance">Sort: Relevance</option>
        <option value="newest">Sort: Newest</option>
        <option value="oldest">Sort: Oldest</option>
        <option value="name">Sort: Name</option>
        <option value="size">Sort: Size</option>
      </select>
    </div>
  );
}

interface TagFilterProps {
  selectedTags: DocumentTag[];
  onTagsChange: (tags: DocumentTag[]) => void;
}

export function TagFilter({ selectedTags, onTagsChange }: TagFilterProps) {
  const toggleTag = (tag: DocumentTag) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {DOCUMENT_TAGS.map((tag) => (
        <button
          key={tag.id}
          onClick={() => toggleTag(tag.id)}
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
            selectedTags.includes(tag.id)
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-zinc-50 text-zinc-500 ring-1 ring-zinc-200 hover:bg-zinc-100"
          }`}
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}
