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

  const displayTags = doc.tags.slice(0, 2);

  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block break-inside-avoid overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 mb-5"
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden bg-accent">
        {showThumb ? (
          <img
            src={thumbUrl}
            alt={doc.title}
            className="w-full transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-56 w-full items-center justify-center bg-gradient-to-br from-accent to-accent/50">
            <FileText className="h-16 w-16 text-muted-foreground/20" />
          </div>
        )}
        {/* Type badge */}
        {displayTags.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur-sm"
              >
                {TAG_LABELS[tag] || tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-semibold leading-snug text-foreground">
          {doc.title}
        </h3>

        {/* Taxonomy row: subject · branch S{sem} */}
        <p className="mt-2 text-xs text-muted-foreground/70">
          {doc.subject}
          <span className="mx-1.5 text-muted-foreground/30">·</span>
          {doc.branch} S{doc.semester}
        </p>

        {/* File size + download */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground/50">{formatFileSize(doc.fileSize)}</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/60 transition-colors group-hover:text-brand">
            <Download className="h-3 w-3" />
            Download
          </span>
        </div>
      </div>
    </a>
  );
}
