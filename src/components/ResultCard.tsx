"use client";

import { useState } from "react";
import type { SearchResult } from "@/lib/search";
import { formatFileSize, getThumbnailUrl, TYPE_LABELS } from "@/lib/types";
import { reportBrokenLink } from "@/lib/report";

export function ResultCard({ result }: { result: SearchResult }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportMsg, setReportMsg] = useState("");
  const thumbUrl = getThumbnailUrl(result.doc.url);
  const showThumb = thumbUrl && !imgFailed;
  const { doc } = result;

  const docType = doc.type || (doc.tags && doc.tags[0]) || "";

  return (
    <div className="group block break-inside-avoid bg-surface transition-all duration-300 hover:bg-brand mb-5">
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
            <div className="flex h-72 w-full items-center justify-center bg-gradient-to-br from-accent to-accent/50 transition-colors duration-300 group-hover:from-brand group-hover:to-brand/80">
              <span className="text-6xl font-light text-muted-foreground/20 transition-colors duration-300 group-hover:text-white/30">
                {doc.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
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
        <div className="p-5 transition-colors duration-300">
          <h3 className="text-base font-bold leading-snug text-foreground transition-colors duration-300 group-hover:text-white">
            {doc.title}
          </h3>

          {/* Taxonomy row */}
          <p className="mt-2 text-sm text-muted-foreground/70 transition-colors duration-300 group-hover:text-white/70">
            {doc.subject}
            <span className="mx-1.5 text-muted-foreground/30 transition-colors duration-300 group-hover:text-white/30">·</span>
            {doc.branch} S{doc.semester}
          </p>

          {/* File size + download */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground/50 transition-colors duration-300 group-hover:text-white/50">
              {formatFileSize(doc.fileSize)}
            </span>
            <span className="text-xs font-semibold text-foreground/60 transition-colors duration-300 group-hover:text-white/80">
              Download
            </span>
          </div>
        </div>
      </a>

      {/* Footer: contributor + report link */}
      <div className="border-t border-border/30 transition-colors duration-300 group-hover:border-white/20">
        {doc.contributor && (
          <a
            href={`https://github.com/${doc.contributor}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-4 py-2 transition-colors duration-300 hover:opacity-80"
          >
            <img
              src={`https://github.com/${doc.contributor}.png?size=20`}
              alt={doc.contributor}
              className="h-3.5 w-3.5"
              loading="lazy"
            />
            <span className="text-[10px] text-muted-foreground/50 transition-colors duration-300 group-hover:text-white/60">
              {doc.contributor}
            </span>
          </a>
        )}
        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (reporting) return;
            setReporting(true);
            setReportMsg("");
            try {
              const { issueUrl } = await reportBrokenLink(doc);
              setReportMsg("Reported!");
              setTimeout(() => window.open(issueUrl, "_blank"), 300);
            } catch {
              setReportMsg("Failed — try again");
            }
            setTimeout(() => { setReporting(false); setReportMsg(""); }, 3000);
          }}
          className="block w-full px-4 py-1.5 text-[10px] text-left text-muted-foreground/40 opacity-0 transition-all duration-300 hover:text-foreground group-hover:opacity-100 group-hover:text-white/60"
        >
          {reportMsg || (reporting ? "Reporting..." : "Report broken link")}
        </button>
      </div>
    </div>
  );
}
