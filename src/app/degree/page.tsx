import type { Metadata } from "next";
import Link from "next/link";
import { getUniqueBranches, getDocumentsByBranch, documents } from "@/data/documents";
import type { Branch } from "@/lib/types";
import { SearchHero } from "@/components/SearchHero";

const DEGREES = [
  {
    id: "btech",
    name: "B.Tech",
    fullName: "Bachelor of Technology",
    description: "4-year engineering degree with 8 semesters across 5 branches.",
  },
];

const BRANCH_NAMES: Record<Branch, string> = {
  CSE: "Computer Science & Engineering",
  ECE: "Electronics & Communication Engineering",
  EE: "Electrical Engineering",
  ME: "Mechanical Engineering",
  CE: "Civil Engineering",
};

export const metadata: Metadata = {
  title: "Degrees — JU Learning",
  description: "Select your degree to browse study materials by branch, semester, and subject.",
};

export default function DegreePage() {
  const branches = getUniqueBranches();

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <SearchHero title="Select Your Degree" subtitle="Choose your degree program to find your study materials." />

      <div className="mt-12 space-y-12">
        {DEGREES.map((degree) => {
          const degreeDocs = documents.filter((d) => d.source === "jammu-university");
          const total = degreeDocs.length;
          const sems = new Set(degreeDocs.map((d) => d.semester));
          const subs = new Set(degreeDocs.map((d) => d.subject));

          return (
            <div key={degree.id}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">{degree.fullName} ({degree.name})</h2>
                <p className="mt-1 text-sm text-muted-foreground">{degree.description}</p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  {total} documents · {branches.length} branches · {sems.size} semesters · {subs.size} subjects
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
                {branches.map((branch) => {
                  const name = BRANCH_NAMES[branch as Branch] || branch;
                  const docs = getDocumentsByBranch(branch);
                  const branchSems = [...new Set(docs.map((d) => d.semester))].filter((s): s is number => s != null).sort((a, b) => a - b);
                  const branchSubs = [...new Set(docs.map((d) => d.subject))].sort();

                  return (
                    <Link
                      key={branch}
                      href={`/branches/${branch.toLowerCase()}`}
                      className="group bg-white p-8 transition-all duration-300 hover:bg-brand"
                    >
                      <h3 className="text-2xl font-bold text-foreground transition-colors duration-300 group-hover:text-white">{name}</h3>
                      <p className="mt-3 text-base text-muted-foreground transition-colors duration-300 group-hover:text-white/80">
                        {docs.length} documents · {branchSems.length} semesters · {branchSubs.length} subjects
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
