import type { Metadata } from "next";
import { documents } from "@/data/documents";

export const metadata: Metadata = {
  title: "Sources — JU Learning",
  description: "All content sources available on JU Learning. Discover study materials from Jammu University, OpenStax, Project Gutenberg, and more.",
};

const SOURCE_INFO: Record<string, { name: string; description: string; url: string }> = {
  "jammu-university": {
    name: "Jammu University",
    description: "Notes, PYQs, and assignments contributed by JU students and alumni. Covers the B.Tech curriculum across all branches and semesters.",
    url: "https://jammuuniversity.ac.in/",
  },
  "open-textbook-library": {
    name: "Open Textbook Library",
    description: "Openly licensed textbooks reviewed by faculty from across the US. Covers engineering, mathematics, and science subjects.",
    url: "https://open.umn.edu/opentextbooks/",
  },
  "openstax": {
    name: "OpenStax",
    description: "Free peer-reviewed textbooks from Rice University. CC BY-NC-SA licensed. High-quality math, science, and engineering references.",
    url: "https://openstax.org/",
  },
  "project-gutenberg": {
    name: "Project Gutenberg",
    description: "Out-of-copyright books digitized by volunteers. Includes classic works in mathematics, computer science, and engineering.",
    url: "https://www.gutenberg.org/",
  },
  "wikibooks": {
    name: "Wikibooks",
    description: "Open-content textbooks from the Wikimedia Foundation. Community-written and freely available under Creative Commons.",
    url: "https://en.wikibooks.org/",
  },
};

export default function SourcesPage() {
  // Count documents per source
  const sourceCounts = new Map<string, number>();
  for (const doc of documents) {
    const s = doc.source || "other";
    sourceCounts.set(s, (sourceCounts.get(s) || 0) + 1);
  }

  const sources = Object.entries(SOURCE_INFO).map(([id, info]) => ({
    id,
    ...info,
    count: sourceCounts.get(id) || 0,
  }));

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
        {sources.map((source) => (
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
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-semibold text-muted-foreground transition-colors duration-300 hover:underline group-hover:text-white/80"
            >
              Visit {source.name} ↗
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
