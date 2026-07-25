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
    <div className={cn("relative flex items-center", isFocused && "ring-2 ring-brand/20 ring-offset-2 ring-offset-background rounded-2xl")}>
      <div className={cn(
        "flex w-full items-center transition-all duration-200",
        variant === "hero"
          ? "rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 backdrop-blur-xl hover:border-white/20"
          : "rounded-xl border border-border bg-surface px-4 py-2.5 hover:border-border/80",
        isFocused && variant === "hero" && "border-brand/30 bg-white/8",
      )}>
        <Search className={cn("shrink-0 transition-colors", isFocused ? "text-brand" : "text-muted-foreground", variant === "hero" ? "h-5 w-5" : "h-4 w-4")} />
        <input
          id="hero-search"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Search notes, subjects, topics..."
          className={cn(
            "flex-1 border-0 bg-transparent text-foreground placeholder-muted-foreground outline-none focus:outline-none focus:ring-0",
            variant === "hero" ? "ml-3 text-base sm:text-lg" : "ml-2.5 text-sm",
          )}
        />
        {variant === "hero" && (
          <kbd className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-muted-foreground/50 sm:inline-flex">
            <Command className="h-3 w-3" />
            K
          </kbd>
        )}
      </div>
    </div>
  );
}
