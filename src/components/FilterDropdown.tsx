"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  label: string;
  options: string[];
  active: string | null;
  placeholder: string;
  onChange: (value: string | null) => void;
}

export function FilterDropdown({ label, options, active, placeholder, onChange }: Props) {
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
        <span className="text-xs text-muted-foreground/40">{label}</span>
        <span className={`font-medium ${active ? "text-brand" : ""}`}>
          {active || placeholder}
        </span>
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
        <div className="absolute right-0 top-full z-20 mt-1 max-h-60 min-w-[160px] overflow-y-auto bg-surface py-1 ring-1 ring-border/30">
          <button
            onClick={() => { onChange(null); setOpen(false); }}
            className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-accent ${
              !active ? "font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-accent ${
                active === opt
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
