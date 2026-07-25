"use client";

import { useState } from "react";
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

function getReportUrl(doc: SearchResult["doc"]): string {
  const title = encodeURIComponent(`Broken link: ${doc.title}`);
  const body = encodeURIComponent(
    `## Broken Link Report\n\n` +
    `**Document:** ${doc.title}\n` +
    `**URL:** ${doc.url}\n` +
    `**Branch:** ${doc.branch}\n` +
    `**Semester:** ${doc.semester}\n` +
    `**Subject:** ${doc.subject}\n` +
    `**Section:** ${doc.section || "N/A"}\n\n` +
    `**Issue:** The link appears to be broken.\n` +
    `- [ ] 404 Not Found\n` +
    `- [ ] Permission denied\n` +
    `- [ ] Wrong file\n` +
    `- [ ] Other (describe below)\n\n` +
    `**Additional context:**\n`
  );
  return `https://github.com/julearning/metadata/issues/new?title=${title}&body=${body}&labels=broken-link`;
}

export function ResultCard({ result }: { result: SearchResult }) {
  const [imgFailed, setImgFailed] = useState(false);
  const thumbUrl = getThumbnailUrl(result.doc.url);
  const showThumb = thumbUrl && !imgFailed;
  const { doc } = result;

  const displayTags = doc.tags.slice(0, 2);

  return (
    <div className="group block break-inside-avoid bg-white transition-all duration-300 hover:bg-brand mb-5">
      <a
        href={doc.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden"
      >
        {/* Thumbnail */}
        <div className="relative overflow-hidden bg-accent">
          {showThumb ? (
            <>
              <img
                src={thumbUrl}
                alt={doc.title}
                className="w-full transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={() => setImgFailed(true)}
              />
              <div className="absolute inset-0 bg-transparent transition-colors duration-300 group-hover:bg-[#bf00ff]/10" />
            </>
          ) : (
            <div className="flex h-56 w-full items-center justify-center bg-gradient-to-br from-accent to-accent/50 transition-colors duration-300 group-hover:from-brand group-hover:to-brand/80">
              <span className="text-4xl font-light text-muted-foreground/20 transition-colors duration-300 group-hover:text-white/30">
                {doc.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Type badge */}
          {displayTags.length > 0 && (
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              {displayTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-white/95 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm transition-colors duration-300 group-hover:bg-white/20 group-hover:text-white"
                >
                  {TAG_LABELS[tag] || tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 transition-colors duration-300">
          <h3 className="text-sm font-semibold leading-snug text-foreground transition-colors duration-300 group-hover:text-white">
            {doc.title}
          </h3>

          {/* Taxonomy row */}
          <p className="mt-2 text-xs text-muted-foreground/70 transition-colors duration-300 group-hover:text-white/70">
            {doc.subject}
            <span className="mx-1.5 text-muted-foreground/30 transition-colors duration-300 group-hover:text-white/30">·</span>
            {doc.branch} S{doc.semester}
          </p>

          {/* File size + download */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground/50 transition-colors duration-300 group-hover:text-white/50">
              {formatFileSize(doc.fileSize)}
            </span>
            <span className="text-[11px] font-medium text-foreground/60 transition-colors duration-300 group-hover:text-white/80">
              Download
            </span>
          </div>
        </div>
      </a>

      {/* Report broken link — visible on hover only */}
      <a
        href={getReportUrl(doc)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="block border-t border-border/30 px-4 py-2 text-[10px] text-muted-foreground/40 opacity-0 transition-all duration-300 hover:text-foreground group-hover:opacity-100 group-hover:border-white/20 group-hover:text-white/60"
      >
        Report broken link
      </a>
    </div>
  );
}
