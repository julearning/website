import type { Metadata } from "next";
import Link from "next/link";
import { getUniqueBranches, getDocumentsByBranch, documents } from "@/data/documents";
import type { Branch } from "@/lib/types";
import { Breadcrumbs } from "@/components/Breadcrumbs";

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
  const allSems = [...new Set(documents.map((d) => d.semester))].sort((a, b) => a - b);
  const allSubjects = [...new Set(documents.map((d) => d.subject))].sort();

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16">
      <div className="pt-12 sm:pt-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "B.Tech" }]} />

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Bachelor of Technology (B.Tech)
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {totalDocs} study materials across {branches.length} branches, {allSems.length} semesters, and {allSubjects.length} subjects.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => {
          const name = BRANCH_NAMES[branch as Branch] || branch;
          const docs = getDocumentsByBranch(branch);
          const sems = [...new Set(docs.map((d) => d.semester))].sort((a, b) => a - b);
          const subs = [...new Set(docs.map((d) => d.subject))].sort();

          return (
            <Link
              key={branch}
              href={`/branches/${branch.toLowerCase()}`}
              className="group bg-white p-6 transition-all duration-300 hover:bg-brand"
            >
              <h2 className="text-lg font-semibold text-foreground transition-colors duration-300 group-hover:text-white">{name}</h2>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors duration-300 group-hover:bg-white/15 group-hover:text-white/80">
                  {docs.length} docs
                </span>
                <span className="bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors duration-300 group-hover:bg-white/15 group-hover:text-white/80">
                  {sems.length} semesters
                </span>
                <span className="bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors duration-300 group-hover:bg-white/15 group-hover:text-white/80">
                  {subs.length} subjects
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {sems.map((sem) => (
                  <span key={sem} className="bg-accent/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/70 transition-colors duration-300 group-hover:bg-white/10 group-hover:text-white/60">
                    S{sem}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
