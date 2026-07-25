"use client";

import { useState, useRef, useEffect } from "react";

export type SortOption = "relevance" | "newest" | "oldest" | "name" | "size";

const SORT_LABELS: Record<SortOption, string> = {
  relevance: "Relevance",
  newest: "Newest",
  oldest: "Oldest",
  name: "Name A–Z",
  size: "File Size",
};

interface Props {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const options: SortOption[] = ["relevance", "newest", "oldest", "name", "size"];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="text-xs text-muted-foreground/40">Sort</span>
        <span className="font-medium">{SORT_LABELS[value]}</span>
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
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] bg-white py-1">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-accent ${
                value === option
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {SORT_LABELS[option]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
