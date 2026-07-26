import type { Metadata } from "next";
import Link from "next/link";
import { documents } from "@/data/documents";
import { SearchHero } from "@/components/SearchHero";

export const metadata: Metadata = {
  title: "Subjects — JU Learning",
  description:
    "Browse B.Tech subjects from Jammu University. Find notes, PYQs, and study materials by subject.",
};

export default function SubjectsPage() {
  // Only JU documents have valid branch/semester for browse navigation
  const juDocs = documents.filter((d) => d.source === "jammu-university");

  // Build a map: subject → { docCount, branch, semester }
  // Since each subject lives in one branch+semester (JU curriculum), use the first match
  const subjectMap = new Map<
    string,
    { docCount: number; branch: string; semester: number }
  >();
  for (const doc of juDocs) {
    if (!subjectMap.has(doc.subject)) {
      subjectMap.set(doc.subject, {
        docCount: 0,
        branch: doc.branch,
        semester: doc.semester,
      });
    }
    const entry = subjectMap.get(doc.subject)!;
    entry.docCount++;
  }

  const subjects = [...subjectMap.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <SearchHero title="All Subjects" subtitle="B.Tech subjects from Jammu University curriculum." />

      {subjects.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">No subjects found.</p>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-3">
          {subjects.map(([subject, info]) => {
            const branchSlug = info.branch?.toLowerCase() || "cse";
            const sem = info.semester ?? 1;

            return (
              <Link
                key={subject}
                href={`/subjects/${branchSlug}/${sem}/${encodeURIComponent(subject)}`}
                className="group bg-white p-7 transition-all duration-300 hover:bg-brand"
              >
                <h2 className="text-xl font-bold text-foreground transition-colors duration-300 group-hover:text-white">
                  {subject}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground/60 transition-colors duration-300 group-hover:text-white/70">
                  {info.docCount} document{info.docCount !== 1 ? "s" : ""}
                </p>
                <p className="mt-2 text-xs text-muted-foreground/40 transition-colors duration-300 group-hover:text-white/60">
                  {info.branch} · Semester {sem}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
