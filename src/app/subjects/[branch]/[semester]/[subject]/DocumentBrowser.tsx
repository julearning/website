"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";

import type { Document as JLDoc } from "@/lib/types";
import { searchDocuments, type SearchResult } from "@/lib/search";
import type { FilterState } from "@/lib/types";
import { ResultCard } from "@/components/ResultCard";
import { PaginatedGrid } from "@/components/PaginatedGrid";

const SECTION_LABELS: Record<string, string> = {
  "section-a": "Section A",
  "section-b": "Section B",
  mixed: "Mixed",
};

interface Props {
  docs: JLDoc[];
  subject: string;
}

export function DocumentBrowser({ docs, subject }: Props) {
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = useMemo(() => {
    const secs = [...new Set(docs.map((d) => d.section))].filter(Boolean) as string[];
    return secs;
  }, [docs]);

  const filtered = useMemo(() => {
    let filtered = docs;
    if (activeSection) {
      filtered = filtered.filter((d) => d.section === activeSection);
    }
    if (query.trim()) {
      const filters: FilterState = {
        query, branch: null, semester: null, subject: null,
        tags: [], sources: [], sort: "relevance",
      };
      filtered = searchDocuments(filtered, filters).map((r) => r.doc);
    }
    return filtered;
  }, [docs, query, activeSection]);

  return (
    <>
      <div className="mb-6 max-w-md">
        <div className="flex items-center bg-surface ring-1 ring-border/30 transition-all duration-200 focus-within:ring-2 focus-within:ring-brand/20 px-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search within ${subject}...`}
            className="flex-1 border-0 bg-transparent px-3 py-3 text-sm text-foreground placeholder-muted-foreground outline-none"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      {sections.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveSection(null)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeSection === null ? "bg-foreground text-background" : "bg-accent text-muted-foreground hover:text-foreground"}`}
          >
            All ({docs.length})
          </button>
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setActiveSection(sec)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeSection === sec ? "bg-foreground text-background" : "bg-accent text-muted-foreground hover:text-foreground"}`}
            >
              {SECTION_LABELS[sec] || sec} ({docs.filter((d) => d.section === sec).length})
            </button>
          ))}
        </div>
      )}

      <p className="mb-4 text-sm text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? "s" : ""}{query && ` for "${query}"`}</p>
      <PaginatedGrid
        items={filtered}
        renderItem={(doc) => <ResultCard key={doc.id} result={{ doc, score: 0 }} />}
        itemsPerPage={12}
        emptyMessage={query ? "No documents found. Try a different search term." : "No documents in this section yet."}
        emptyIcon={<Search className="mb-4 h-10 w-10 text-muted-foreground/20" />}
      />
    </>
  );
}
