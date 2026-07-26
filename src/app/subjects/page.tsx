import type { Metadata } from "next";
import Link from "next/link";
import { documents, getUniqueSubjects } from "@/data/documents";
import { SearchHero } from "@/components/SearchHero";

export const metadata: Metadata = {
  title: "Subjects — JU Learning",
  description:
    "Browse all subjects available across every engineering branch. Find notes, PYQs, and study materials by subject name.",
};

export default function SubjectsPage() {
  const subjects = getUniqueSubjects();

  // Build a map: subject → { docCount, branches: Set<branch>, semesters: Set<semester> }
  const subjectMap = new Map<
    string,
    { docCount: number; branches: Set<string>; semesters: Set<number> }
  >();
  for (const doc of documents) {
    if (!subjectMap.has(doc.subject)) {
      subjectMap.set(doc.subject, {
        docCount: 0,
        branches: new Set(),
        semesters: new Set(),
      });
    }
    const entry = subjectMap.get(doc.subject)!;
    entry.docCount++;
    entry.branches.add(doc.branch);
    entry.semesters.add(doc.semester);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <SearchHero title="All Subjects" subtitle="Browse study materials organized by subject." />

      <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-3">
        {subjects.map((subject) => {
          const info = subjectMap.get(subject)!;
          const branchesList = [...info.branches].sort().join(", ");
          const semRange =
            info.semesters.size === 1
              ? `Semester ${[...info.semesters][0]}`
              : `Semesters ${Math.min(...info.semesters)}–${Math.max(...info.semesters)}`;

          // Link to the subject's page — use the first branch that offers it
          const firstBranch = [...info.branches].sort()[0].toLowerCase();
          const firstSem = Math.min(...info.semesters);

          return (
            <Link
              key={subject}
              href={`/subjects/${firstBranch}/${firstSem}/${encodeURIComponent(subject)}`}
              className="group bg-white p-7 transition-all duration-300 hover:bg-brand"
            >
              <h2 className="text-xl font-bold text-foreground transition-colors duration-300 group-hover:text-white">
                {subject}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground/60 transition-colors duration-300 group-hover:text-white/70">
                {info.docCount} document{info.docCount !== 1 ? "s" : ""}
              </p>
              <p className="mt-2 text-xs text-muted-foreground/40 transition-colors duration-300 group-hover:text-white/60">
                {branchesList} · {semRange}
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
