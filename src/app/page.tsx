"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { documents, getUniqueBranches, getDocumentsByBranch } from "@/data/documents";
import type { Branch, Document } from "@/lib/types";
import { getThumbnailUrl } from "@/lib/types";
import { getReportUrl } from "@/lib/report";
import { SearchHero } from "@/components/SearchHero";
import { RevealSection } from "@/components/RevealSection";
import { ContributorCircle } from "@/components/ContributorCircle";

const CATEGORY_SECTIONS = [
  { tag: "pyq", title: "Previous Year Questions", subtitle: "Past exam papers from all semesters" },
  { tag: "handwritten", title: "Handwritten Notes", subtitle: "Student-scanned handwritten summaries" },
  { tag: "typed", title: "Digital Notes", subtitle: "Clean typed notes and study materials" },
] as const;

export default function Home() {
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
        .filter((d) => d.tags.includes(cat.tag))
        .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())
        .slice(0, 6),
    }));
  }, []);

  // Contributor leaderboard: count documents per contributor
  const allContributors = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const doc of documents) {
      const c = doc.contributor || "unknown";
      counts[c] = (counts[c] || 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([username, count]) => ({ username, count }));
  }, []);

  const topContributors = allContributors.slice(0, 8);

  const branches = getUniqueBranches();
  const allSemesters = [...new Set(documents.map((d) => d.semester))].sort((a, b) => a - b);
  const allSubjects = [...new Set(documents.map((d) => d.subject))].sort();
  const topSubjects = allSubjects.slice(0, 12);

  function formatDate(dateStr: string | undefined) {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "";
    }
  }

  function ContributorCard({ username, count }: { username: string; count: number }) {
    const [imgFailed, setImgFailed] = useState(false);

    return (
      <a
        href={`https://github.com/${username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 bg-surface px-4 py-3 transition-all duration-300 hover:bg-brand"
      >
        {!imgFailed ? (
          <img
            src={`https://github.com/${username}.png?size=40`}
            alt={username}
            className="h-8 w-8 transition-opacity duration-300 group-hover:opacity-90"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center bg-accent text-xs font-bold text-muted-foreground transition-colors duration-300 group-hover:bg-surface/20 group-hover:text-white/80">
            {username.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground transition-colors duration-300 group-hover:text-white">
            {username}
          </p>
          <p className="text-[11px] text-muted-foreground/60 transition-colors duration-300 group-hover:text-white/70">
            {count} document{count !== 1 ? "s" : ""}
          </p>
        </div>
      </a>
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

        {/* Footer: contributor + report */}
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
          <a
            href={getReportUrl(doc)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="block px-4 py-1.5 text-[10px] text-muted-foreground/40 opacity-0 transition-all duration-300 hover:text-foreground group-hover:opacity-100 group-hover:text-white/60"
          >
            Report broken link
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      {/* Search hero — reusable component with all search logic */}
      <SearchHero />

      {/* Browse sections — always visible below search results */}
      <div className="mt-16 space-y-20">
        {/* Category Sections: PYQs, Handwritten, Digital Notes */}
        {categoryDocs.map((cat) =>
          cat.docs.length > 0 ? (
            <RevealSection key={cat.tag} id={cat.tag}>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground">{cat.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{cat.subtitle}</p>
              </div>
              <div className="columns-2 gap-3 lg:columns-3">
                {cat.docs.map((doc) => (
                  <CategoryCard key={doc.id} doc={doc} />
                ))}
              </div>
            </RevealSection>
          ) : null
        )}

        {/* Contributors */}
        {topContributors.length > 0 && (
          <RevealSection delay={0.1}>
            <h2 className="mb-6 text-lg font-semibold text-foreground">Top Contributors</h2>
            <p className="mb-4 text-sm text-muted-foreground">Students who have shared study materials with the community.</p>
            <div className="flex flex-wrap gap-3">
              {topContributors.map(({ username, count }) => (
                <ContributorCard key={username} username={username} count={count} />
              ))}
            </div>
          </RevealSection>
        )}

        {/* Recently Added */}
        <RevealSection delay={0.15}>
          <h2 className="mb-6 text-lg font-semibold text-foreground">Recently Added</h2>
          <div className="columns-2 gap-5 lg:columns-3">
            {recentDocs.map((doc) => (
              <CategoryCard key={doc.id} doc={doc} />
            ))}
          </div>
        </RevealSection>

        {/* Browse by Branch */}
        <RevealSection delay={0.2}>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Browse by Branch</h2>
            <Link href="/branches" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {branches.map((branch) => {
              const docCount = getDocumentsByBranch(branch).length;
              const semesters = [...new Set(getDocumentsByBranch(branch).map((d) => d.semester))].sort();

              return (
                <Link
                  key={branch}
                  href={`/branches/${branch.toLowerCase()}`}
                  className="group bg-surface p-7 transition-all duration-300 hover:bg-brand"
                >
                  <p className="text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-white">{branch}</p>
                  <p className="mt-2 text-sm text-muted-foreground/60 transition-colors duration-300 group-hover:text-white/70">
                    {docCount} documents · {semesters.length} semesters
                  </p>
                </Link>
              );
            })}
          </div>
        </RevealSection>

        {/* Browse by Semester */}
        <RevealSection delay={0.25}>
          <h2 className="mb-6 text-lg font-semibold text-foreground">Browse by Semester</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {allSemesters.map((sem) => {
              const docCount = documents.filter((d) => d.semester === sem).length;
              return (
                <Link
                  key={sem}
                  href={`/semesters/cse/${sem}`}
                  className="group bg-surface p-6 text-center transition-all duration-300 hover:bg-brand"
                >
                  <p className="text-2xl font-semibold text-foreground transition-colors duration-300 group-hover:text-white">{sem}</p>
                  <p className="mt-1 text-sm text-muted-foreground/60 transition-colors duration-300 group-hover:text-white/70">{docCount} docs</p>
                </Link>
              );
            })}
          </div>
        </RevealSection>

        {/* Browse by Subject */}
        <RevealSection delay={0.3}>
          <h2 className="mb-6 text-lg font-semibold text-foreground">Browse by Subject</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {topSubjects.map((subject) => {
              const docCount = documents.filter((d) => d.subject === subject).length;
              const firstDoc = documents.find((d) => d.subject === subject);
              const branchSlug = firstDoc ? firstDoc.branch.toLowerCase() : "cse";
              const sem = firstDoc ? firstDoc.semester : 1;
              return (
                <Link
                  key={subject}
                  href={`/subjects/${branchSlug}/${sem}/${encodeURIComponent(subject)}`}
                  className="group bg-surface p-6 text-left transition-all duration-300 hover:bg-brand"
                >
                  <p className="text-base font-medium text-foreground transition-colors duration-300 group-hover:text-white">{subject}</p>
                  <p className="mt-1 text-sm text-muted-foreground/60 transition-colors duration-300 group-hover:text-white/70">{docCount} documents</p>
                </Link>
              );
            })}
          </div>
        </RevealSection>

        {/* JU Learning is all of us */}
        {allContributors.length > 0 && (
          <RevealSection delay={0.35}>
            <ContributorCircle contributors={allContributors} />
          </RevealSection>
        )}
      </div>
    </main>
  );
}
