"use client";

import { useState, useRef, useEffect } from "react";

export interface FilterOption {
  tag: string;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { tag: "pyq", label: "PYQ" },
  { tag: "handwritten", label: "Handwritten" },
  { tag: "typed", label: "Digital Notes" },
  { tag: "notes", label: "Notes" },
  { tag: "assignment", label: "Assignments" },
  { tag: "lab-manual", label: "Lab Manuals" },
  { tag: "reference-book", label: "Reference Books" },
  { tag: "project-report", label: "Projects" },
];

interface Props {
  activeTags: string[];
  onChange: (tags: string[]) => void;
}

export function FilterDropdown({ activeTags, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasActiveFilters = activeTags.length > 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleTag(tag: string) {
    if (activeTags.includes(tag)) {
      onChange(activeTags.filter((t) => t !== tag));
    } else {
      onChange([...activeTags, tag]);
    }
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="text-xs text-muted-foreground/40">Filter</span>
        {hasActiveFilters ? (
          <span className="font-medium text-brand">
            {activeTags.length} active
          </span>
        ) : (
          <span className="font-medium">All Types</span>
        )}
        <svg
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M3 5l3 3 3-3" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] bg-surface py-1 ring-1 ring-border/30">
          {FILTER_OPTIONS.map((option) => {
            const isActive = activeTags.includes(option.tag);
            return (
              <button
                key={option.tag}
                onClick={() => toggleTag(option.tag)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-accent ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center border text-[9px] font-bold transition-colors ${
                    isActive
                      ? "border-brand bg-brand text-white"
                      : "border-border text-transparent"
                  }`}
                >
                  {isActive ? "✓" : ""}
                </span>
                {option.label}
              </button>
            );
          })}
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="block w-full border-t border-border/50 px-4 py-2 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export { FILTER_OPTIONS };
