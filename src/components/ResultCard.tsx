"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import type { SearchResult } from "@/lib/search";
import { formatFileSize, getThumbnailUrl } from "@/lib/types";

const TAG_LABELS: Record<string, string> = {
  notes: "Notes",
  pyq: "PYQ",
  assignment: "Assignment",
  "lab-manual": "Lab Manual",
  syllabus: "Syllabus",
  handwritten: "Handwritten",
  typed: "Typed",
  "reference-book": "Ref Book",
  "project-report": "Project",
};

export function ResultCard({ result }: { result: SearchResult }) {
  const [imgFailed, setImgFailed] = useState(false);
  const thumbUrl = getThumbnailUrl(result.doc.url);
  const showThumb = thumbUrl && !imgFailed;
  const { doc } = result;

  // Tags that represent document type (exclude handwritten/typed as they're format modifiers)
  const typeTags = doc.tags.filter((t) => !["handwritten", "typed", "reference-book"].includes(t));
  const formatTags = doc.tags.filter((t) => ["handwritten", "typed"].includes(t));

  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-xl border border-border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-accent">
        {showThumb ? (
          <img
            src={thumbUrl}
            alt={doc.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileText className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {/* Document type badges on thumbnail */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {typeTags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium shadow-sm backdrop-blur-sm"
            >
              {TAG_LABELS[tag] || tag}
            </span>
          ))}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold leading-snug text-foreground">
          {doc.title}
        </h3>

        {/* Subject — always visible, primary attribute */}
        <p className="mt-1.5 text-xs font-medium text-brand line-clamp-1">
          {doc.subject}
        </p>

        {/* Branch · Semester · Format tags */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium">{doc.branch}</span>
            <span>Sem {doc.semester}</span>
          </span>
          {formatTags.length > 0 && (
            <>
              <span className="text-muted-foreground/30">·</span>
              {formatTags.map((tag) => (
                <span key={tag} className="capitalize">{TAG_LABELS[tag] || tag}</span>
              ))}
            </>
          )}
        </div>

        {/* Description — optional, 2 lines max */}
        {doc.description && (
          <p className="mt-2 text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
            {doc.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
          <span className="text-[11px] text-muted-foreground">
            {formatFileSize(doc.fileSize)}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand transition-colors group-hover:text-brand/80">
            <Download className="h-3 w-3" />
            Download
          </span>
        </div>
      </div>
    </a>
  );
}
