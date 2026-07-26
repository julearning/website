import type { Metadata } from "next";
import Link from "next/link";
import { documents, sources } from "@/data/documents";
import type { SourceMeta } from "@/data/documents";

export const metadata: Metadata = {
  title: "Sources — JU Learning",
  description: "All content sources available on JU Learning. Discover study materials from various open repositories.",
};

/* Jammu University gets a hardcoded entry since it's always present */
const JU_SOURCE: SourceMeta = {
  id: "jammu-university",
  name: "Jammu University",
  description: "Notes, PYQs, and assignments contributed by JU students and alumni. Covers the B.Tech curriculum across all branches and semesters.",
  url: "https://jammuuniversity.ac.in/",
};

export default function SourcesPage() {
  // Count documents per source
  const sourceCounts = new Map<string, number>();
  for (const doc of documents) {
    const s = doc.source || "other";
    sourceCounts.set(s, (sourceCounts.get(s) || 0) + 1);
  }

  // Combine hardcoded JU + dynamic sources from metadata
  const allSources: (SourceMeta & { count: number })[] = [
    { ...JU_SOURCE, count: sourceCounts.get("jammu-university") || 0 },
    ...sources.map((s) => ({ ...s, count: sourceCounts.get(s.id) || 0 })),
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <div className="pt-16 sm:pt-20">
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl">
          Sources
        </h1>
        <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
          All study materials on JU Learning come from these sources.
        </p>
      </div>

      <div className="mt-16 space-y-6">
        {allSources.map((source) => (
          <div key={source.id} className="bg-surface p-8 transition-all duration-300 hover:bg-brand group">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground transition-colors duration-300 group-hover:text-white">
                  {source.name}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground/70 transition-colors duration-300 group-hover:text-white/70 max-w-2xl">
                  {source.description}
                </p>
              </div>
              <p className="text-lg font-bold text-foreground transition-colors duration-300 group-hover:text-white whitespace-nowrap ml-6">
                {source.count}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <Link
                href={source.id === "jammu-university" ? "/" : `/?source=${source.id}`}
                className="text-sm font-bold text-foreground transition-colors duration-300 group-hover:text-white underline underline-offset-4"
              >
                Browse {source.name} materials →
              </Link>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors duration-300 hover:underline group-hover:text-white/60"
              >
                Visit site ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
