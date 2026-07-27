"use client";

import { useState, useRef, useEffect } from "react";

export interface SourceOption {
  id: string;
  label: string;
}

interface Props {
  availableSources: SourceOption[];
  activeSources: string[];
  onChange: (sources: string[]) => void;
}

export function SourceDropdown({ availableSources, activeSources, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // All sources explicitly selected = "show all".
  // No implicit "all" state — each source toggles independently.
  const allSelected = activeSources.length === availableSources.length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleSource(id: string) {
    if (activeSources.includes(id)) {
      // Click to deselect — remove from filter
      const next = activeSources.filter((s) => s !== id);
      // If no sources are left, reset to all (show everything)
      onChange(next.length === 0 ? availableSources.map((s) => s.id) : next);
    } else {
      // Click to select — add to filter
      const next = [...activeSources, id];
      onChange(next.length === availableSources.length ? availableSources.map((s) => s.id) : next);
    }
  }

  const triggerLabel = allSelected
    ? "All Sources"
    : activeSources.length === 1
      ? (availableSources.find((s) => s.id === activeSources[0])?.label || activeSources[0])
      : `${activeSources.length} Sources`;

  function isSourceActive(id: string): boolean {
    return activeSources.includes(id);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="text-xs text-muted-foreground/40">Source</span>
        <span className="font-medium">{triggerLabel}</span>
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
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[200px] bg-surface py-1 ring-1 ring-border/30">
          {availableSources.map((source) => {
            const active = isSourceActive(source.id);
            return (
              <button
                key={source.id}
                onClick={() => toggleSource(source.id)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-accent ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center border text-[9px] font-bold transition-colors ${
                    active
                      ? "border-brand bg-brand text-white"
                      : "border-border text-transparent"
                  }`}
                >
                  {active ? "✓" : ""}
                </span>
                {source.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
