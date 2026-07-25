"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import type { Document as JLDoc } from "@/lib/types";
import { searchDocuments, type SearchResult } from "@/lib/search";
import type { FilterState } from "@/lib/types";
import { ResultCard } from "@/components/ResultCard";

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
        tags: [], sort: "relevance",
      };
      filtered = searchDocuments(filtered, filters).map((r) => r.doc);
    }
    return filtered;
  }, [docs, query, activeSection]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of docs) {
      for (const tag of d.tags) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
    return counts;
  }, [docs]);

  return (
    <>
      <div className="mb-6 max-w-md">
        <div className="flex items-center rounded-xl border border-border bg-white px-4 shadow-sm transition-shadow duration-200 focus-within:shadow-md focus-within:border-brand/50">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search within ${subject}...`}
            className="flex-1 border-0 bg-transparent px-3 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      {sections.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveSection(null)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeSection === null ? "bg-foreground text-background" : "bg-accent text-muted-foreground hover:text-foreground"}`}
          >
            All ({docs.length})
          </button>
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setActiveSection(sec)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeSection === sec ? "bg-foreground text-background" : "bg-accent text-muted-foreground hover:text-foreground"}`}
            >
              {SECTION_LABELS[sec] || sec} ({docs.filter((d) => d.section === sec).length})
            </button>
          ))}
        </div>
      )}

      {!query && !activeSection && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {Object.entries(tagCounts).map(([tag, count]) => (
            <span key={tag} className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
              {tag.replace("-", " ")} ({count})
            </span>
          ))}
        </div>
      )}

      {filtered.length > 0 ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? "s" : ""}{query && ` for "${query}"`}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((doc) => (
              <ResultCard key={doc.id} result={{ doc, score: 0 }} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center py-16 text-center">
          <Search className="mb-4 h-10 w-10 text-muted-foreground/20" />
          <p className="text-base text-muted-foreground">No documents found</p>
          <p className="mt-1 text-sm text-muted-foreground/50">
            {query ? "Try a different search term." : "No documents in this section yet."}
          </p>
        </div>
      )}
    </>
  );
}
