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

  return (
    <a
      href={result.doc.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-xl border border-border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-accent">
        {showThumb ? (
          <img
            src={thumbUrl}
            alt={result.doc.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileText className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur-sm">
          {result.doc.branch} S{result.doc.semester}
        </div>
        <div className="absolute right-2 top-2 flex flex-wrap gap-1">
          {result.doc.tags.slice(0, 2).map((tag) => (
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
          {result.doc.title}
        </h3>
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
          {result.doc.description || result.doc.subject}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {formatFileSize(result.doc.fileSize)}
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
