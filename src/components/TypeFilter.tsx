"use client";

import { useState, useRef, useEffect } from "react";
import type { DocType } from "@/lib/types";
import { TYPE_LABELS } from "@/lib/types";

const TYPE_OPTIONS: DocType[] = [
  "pyq", "handwritten", "digital", "assignment",
  "lab-manual", "reference-book", "project-report",
];

interface Props {
  activeType: DocType | null;
  onChange: (type: DocType | null) => void;
}

export function TypeFilter({ activeType, onChange }: Props) {
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="text-xs text-muted-foreground/40">Type</span>
        {activeType ? (
          <span className="font-medium text-brand">{TYPE_LABELS[activeType]}</span>
        ) : (
          <span className="font-medium">All</span>
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
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] bg-surface py-1 ring-1 ring-border/30">
          {/* "All" option */}
          <button
            onClick={() => { onChange(null); setOpen(false); }}
            className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-accent ${
              !activeType ? "font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            All Types
          </button>
          {TYPE_OPTIONS.map((type) => (
            <button
              key={type}
              onClick={() => { onChange(type); setOpen(false); }}
              className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-accent ${
                activeType === type
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
