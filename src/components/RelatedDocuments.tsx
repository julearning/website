"use client";

import { useState } from "react";
import type { Document as JLDoc } from "@/lib/types";
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

function RelatedCard({ doc }: { doc: JLDoc }) {
  const [imgFailed, setImgFailed] = useState(false);
  const thumbUrl = getThumbnailUrl(doc.url);
  const showThumb = thumbUrl && !imgFailed;
  const displayTags = doc.tags.slice(0, 2);

  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-surface transition-all duration-300 hover:bg-brand"
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
          <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-accent to-accent/50 transition-colors duration-300 group-hover:from-brand group-hover:to-brand/80">
            <span className="text-3xl font-light text-muted-foreground/20 transition-colors duration-300 group-hover:text-white/30">
              {doc.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Tag badge */}
        {displayTags.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="bg-surface/95 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm transition-colors duration-300 group-hover:bg-white/20 group-hover:text-white"
              >
                {TAG_LABELS[tag] || tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 transition-colors duration-300">
        <h4 className="text-sm font-semibold leading-snug text-foreground transition-colors duration-300 group-hover:text-white">
          {doc.title}
        </h4>
        <p className="mt-2 text-xs text-muted-foreground/70 transition-colors duration-300 group-hover:text-white/70">
          {doc.branch} S{doc.semester}
          <span className="mx-1.5 text-muted-foreground/30 transition-colors duration-300 group-hover:text-white/30">·</span>
          {formatFileSize(doc.fileSize)}
        </p>

        {/* Contributor */}
        {doc.contributor && (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground/50 transition-colors duration-300 group-hover:text-white/60">
            <img
              src={`https://github.com/${doc.contributor}.png?size=20`}
              alt={doc.contributor}
              className="h-4 w-4"
              loading="lazy"
            />
            {doc.contributor}
          </p>
        )}
      </div>
    </a>
  );
}

interface Props {
  docs: JLDoc[];
}

export function RelatedDocuments({ docs }: Props) {
  if (docs.length === 0) return null;

  return (
    <section className="mt-16 border-t border-border/20 pt-10">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Related Documents</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Other study materials for <span className="font-medium text-foreground">{docs[0].subject}</span> across different branches and semesters
      </p>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((doc) => (
          <RelatedCard key={doc.id} doc={doc} />
        ))}
      </div>
      {docs.length >= 6 && (
        <p className="mt-4 text-center text-xs text-muted-foreground/50">
          Showing top {docs.length} related documents
        </p>
      )}
    </section>
  );
}
