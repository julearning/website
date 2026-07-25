"use client";

import { Search, Command } from "lucide-react";
import { type SearchResult } from "@/lib/search";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  results: SearchResult[];
  isFocused: boolean;
}

export function SearchBar({
  value,
  onChange,
  onFocus,
  onBlur,
  results,
  isFocused,
}: SearchBarProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`group relative flex items-center rounded-2xl border bg-white shadow-sm transition-all duration-200 ${
          isFocused
            ? "border-blue-300 shadow-blue-100/50 ring-4 ring-blue-50"
            : "border-zinc-200 hover:border-zinc-300 hover:shadow-md"
        }`}
      >
        <Search
          className={`ml-5 h-5 w-5 transition-colors ${
            isFocused ? "text-blue-500" : "text-zinc-400"
          }`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Search notes, subjects, topics..."
          className="flex-1 border-0 bg-transparent px-4 py-4 text-base text-zinc-900 placeholder-zinc-400 outline-none focus:outline-none sm:text-lg"
        />
        <div className="mr-4 flex items-center gap-2">
          {value && (
            <kbd className="hidden rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-medium text-zinc-400 sm:inline">
              {results.length} results
            </kbd>
          )}
          <kbd className="hidden items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-medium text-zinc-400 sm:inline-flex">
            <Command className="h-3 w-3" />
            K
          </kbd>
        </div>
      </div>

      {/* Quick filters hint */}
      {!value && !isFocused && (
        <div className="mt-3 text-center">
          <div className="flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center rounded-full bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-500 ring-1 ring-zinc-200">
              Press <kbd className="mx-1 rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 ring-1 ring-zinc-200">⌘K</kbd> for advanced search
            </span>
            <span className="inline-flex items-center rounded-full bg-zinc-50 px-3 py-1 text-[11px] font-medium text-zinc-500 ring-1 ring-zinc-200">
              Filter by branch, semester & subject
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
