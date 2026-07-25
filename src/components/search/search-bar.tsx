"use client";

import { Search, Command } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  variant?: "hero" | "compact";
}

export function SearchBar({ value, onChange, onFocus, onBlur, isFocused, variant = "hero" }: SearchBarProps) {
  return (
    <div
      className={cn(
        "group relative flex items-center transition-all duration-300",
        variant === "hero" ? "rounded-2xl" : "rounded-xl",
        isFocused
          ? "ring-2 ring-amber-500/30 ring-offset-2 ring-offset-black"
          : "",
      )}
    >
      <div
        className={cn(
          "flex w-full items-center transition-all duration-300",
          variant === "hero"
            ? "rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl hover:border-white/20"
            : "rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 hover:border-zinc-700",
          isFocused && variant === "hero" && "border-amber-500/40 bg-white/10",
        )}
      >
        <Search className={cn("shrink-0 transition-colors", isFocused ? "text-amber-400" : "text-zinc-500", variant === "hero" ? "h-5 w-5" : "h-4 w-4")} />
        <input
          id="hero-search"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Search notes, subjects, topics..."
          className={cn(
            "flex-1 border-0 bg-transparent text-white placeholder-zinc-500 outline-none focus:outline-none focus:ring-0",
            variant === "hero" ? "ml-3 text-base sm:text-lg" : "ml-2.5 text-sm",
          )}
        />
        {variant === "hero" && (
          <kbd className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-zinc-500 sm:inline-flex">
            <Command className="h-3 w-3" />
            <span>K</span>
          </kbd>
        )}
      </div>
    </div>
  );
}
