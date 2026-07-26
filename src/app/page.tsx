"use client";

import { useState, useMemo, useEffect } from "react";
import { documents } from "@/data/documents";
import type { Document } from "@/lib/types";
import { getThumbnailUrl } from "@/lib/types";
import { reportBrokenLink } from "@/lib/report";
import { SearchHero } from "@/components/SearchHero";

const CATEGORY_SECTIONS = [
  { type: "pyq" as const, title: "Previous Year Questions", subtitle: "Past exam papers from all semesters" },
  { type: "handwritten" as const, title: "Handwritten Notes", subtitle: "Student-scanned handwritten summaries" },
  { type: "digital" as const, title: "Digital Notes", subtitle: "Clean typed notes and study materials" },
];

export default function Home() {
  const [defaultSource, setDefaultSource] = useState<string | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("source");
    if (source) setDefaultSource(source);
  }, []);

  // Recent documents sorted by upload date (newest first)
  const recentDocs = useMemo(() => {
    return [...documents]
      .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())
      .slice(0, 6);
  }, []);

  // Category sections: filter documents by tag, take 6 recent
  const categoryDocs = useMemo(() => {
    return CATEGORY_SECTIONS.map((cat) => ({
      ...cat,
      docs: [...documents]
        .filter((d) => d.type === cat.type || (d.tags && d.tags.includes(cat.type)))
        .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())
        .slice(0, 6),
    }));
  }, []);

  function formatDate(dateStr: string | undefined) {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "";
    }
  }

  function ReportButton({ doc }: { doc: Document }) {
    const [reporting, setReporting] = useState(false);
    const [reportMsg, setReportMsg] = useState("");
    return (
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
            setReportMsg("Failed");
          }
          setTimeout(() => { setReporting(false); setReportMsg(""); }, 3000);
        }}
        className="block w-full px-4 py-1.5 text-[10px] text-left text-muted-foreground/40 opacity-0 transition-all duration-300 hover:text-foreground group-hover:opacity-100 group-hover:text-white/60"
      >
        {reportMsg || (reporting ? "Reporting..." : "Report broken link")}
      </button>
    );
  }

  function CategoryCard({ doc }: { doc: Document }) {
    const [imgFailed, setImgFailed] = useState(false);
    const thumb = getThumbnailUrl(doc.url);
    const showThumb = thumb && !imgFailed;

    return (
      <div className="group block break-inside-avoid bg-surface transition-all duration-300 hover:bg-brand mb-5">
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden"
        >
          <div className="relative overflow-hidden bg-accent">
            {showThumb ? (
              <img
                src={thumb}
                alt={doc.title}
                className="w-full transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-accent to-accent/50 transition-colors duration-300 group-hover:from-brand group-hover:to-brand/80">
                <span className="text-3xl font-light text-muted-foreground/20 transition-colors duration-300 group-hover:text-white/30">
                  {doc.title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="p-4 transition-colors duration-300">
            <p className="text-sm font-semibold leading-snug text-foreground transition-colors duration-300 group-hover:text-white">
              {doc.title}
            </p>
            <p className="mt-2 text-xs text-muted-foreground/70 transition-colors duration-300 group-hover:text-white/70">
              {doc.branch} S{doc.semester} · {doc.subject}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground/40 transition-colors duration-300 group-hover:text-white/50">
              {formatDate(doc.uploadedAt)}
            </p>
          </div>
        </a>

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
          <ReportButton doc={doc} />
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <SearchHero defaultSource={defaultSource} />

      {/* Browse sections */}
      <div className="mt-16 space-y-20">
        {/* Category Sections: PYQs, Handwritten, Digital Notes */}
        {categoryDocs.map((cat) =>
          cat.docs.length > 0 ? (
            <section key={cat.type}>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground">{cat.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{cat.subtitle}</p>
              </div>
              <div className="columns-2 gap-3 lg:columns-3">
                {cat.docs.map((doc) => (
                  <CategoryCard key={doc.id} doc={doc} />
                ))}
              </div>
            </section>
          ) : null
        )}

        {/* Recently Added */}
        {recentDocs.length > 0 && (
          <section>
            <h2 className="mb-6 text-xl font-bold text-foreground">Recently Added</h2>
            <div className="columns-2 gap-5 lg:columns-3">
              {recentDocs.map((doc) => (
                <CategoryCard key={doc.id} doc={doc} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
