import type { Metadata } from "next";
import Link from "next/link";
import { getUniqueBranches, getDocumentsByBranch, documents } from "@/data/documents";
import type { Branch } from "@/lib/types";
import { SearchHero } from "@/components/SearchHero";

const BRANCH_NAMES: Record<Branch, string> = {
  CSE: "Computer Science & Engineering",
  ECE: "Electronics & Communication Engineering",
  EE: "Electrical Engineering",
  ME: "Mechanical Engineering",
  CE: "Civil Engineering",
};

export const metadata: Metadata = {
  title: "B.Tech Degree — JU Learning",
  description: "Browse B.Tech study materials across all engineering branches. Access notes, PYQs, lab manuals, and more.",
};

export default function DegreePage() {
  const totalDocs = documents.length;
  const branches = getUniqueBranches();
  const allSems = [...new Set(documents.map((d) => d.semester).filter((s): s is number => s != null))].sort((a, b) => a - b);
  const allSubjects = [...new Set(documents.map((d) => d.subject).filter(Boolean))].sort();

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <SearchHero title="B.Tech Degree" subtitle="Browse all branches, semesters, and study materials for your engineering degree." />

      <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-3">
        {branches.map((branch) => {
          const name = BRANCH_NAMES[branch as Branch] || branch;
          const docs = getDocumentsByBranch(branch);
          const sems = [...new Set(docs.map((d) => d.semester))].sort((a, b) => a - b);
          const subs = [...new Set(docs.map((d) => d.subject))].sort();

          return (
            <Link
              key={branch}
              href={`/branches/${branch.toLowerCase()}`}
              className="group bg-white p-8 transition-all duration-300 hover:bg-brand"
            >
              <h2 className="text-2xl font-bold text-foreground transition-colors duration-300 group-hover:text-white">{name}</h2>
              <p className="mt-3 text-base text-muted-foreground transition-colors duration-300 group-hover:text-white/80">
                {docs.length} documents · {sems.length} semesters · {subs.length} subjects
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
