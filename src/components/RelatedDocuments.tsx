"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { Document as JLDoc } from "@/lib/types";
import { getThumbnailUrl, TYPE_LABELS } from "@/lib/types";
import { JUThumbnail } from "./JUThumbnail";

function RelatedCard({ doc }: { doc: JLDoc }) {
  const [imgFailed, setImgFailed] = useState(false);
  const thumbUrl = doc.thumbnailUrl || getThumbnailUrl(doc.url);
  const showThumb = thumbUrl && !imgFailed;
  const docType = doc.type || (doc.tags && doc.tags[0]) || "";

  let thumbContent: ReactNode;
  if (showThumb) {
    thumbContent = (
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
    );
  } else if (doc.source === "jammu-university") {
    thumbContent = (
      <div className="aspect-[9/16] w-full overflow-hidden">
        <JUThumbnail />
      </div>
    );
  } else {
    thumbContent = (
      <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-accent to-accent/50 transition-colors duration-300 group-hover:from-brand group-hover:to-brand/80">
        <span className="text-3xl font-light text-muted-foreground/20 transition-colors duration-300 group-hover:text-white/30">
          {doc.title.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-surface transition-all duration-300 hover:bg-brand"
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden bg-accent">
        {thumbContent}
        {/* Type badge */}
        {docType && (
          <div className="absolute left-3 top-3">
            <span className="bg-surface/95 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm transition-colors duration-300 group-hover:bg-white/20 group-hover:text-white">
              {TYPE_LABELS[docType] || docType}
            </span>
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
      <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-3">
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
