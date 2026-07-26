"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";

import type { Document as JLDoc } from "@/lib/types";
import { searchDocuments, type SearchResult } from "@/lib/search";
import type { FilterState } from "@/lib/types";
import { ResultCard } from "@/components/ResultCard";
import { PaginatedGrid } from "@/components/PaginatedGrid";

interface Props {
  docs: JLDoc[];
  subject: string;
}

export function DocumentBrowser({ docs, subject }: Props) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    let filtered = docs;
    if (query.trim()) {
      const filters: FilterState = {
        query, branch: null, semester: null, subject: null,
        types: [], sources: [], sort: "relevance",
      };
      filtered = searchDocuments(filtered, filters).map((r) => r.doc);
    }
    return filtered;
  }, [docs, query]);

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
