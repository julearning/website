import type { Metadata } from "next";
import Link from "next/link";
import { getUniqueBranches, getDocumentsByBranch } from "@/data/documents";
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
  title: "Branches — JU Learning",
  description: "Browse B.Tech study materials by engineering branch. Access notes, PYQs, lab manuals, and more for CSE, ECE, EE, ME, and CE.",
};

export default function BranchesPage() {
  const branches = getUniqueBranches();

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <SearchHero title="Engineering Branches" subtitle="Select your branch to browse study materials by semester and subject." />

      <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-3">
        {branches.map((branch) => {
          const name = BRANCH_NAMES[branch as Branch] || branch;
          const docCount = getDocumentsByBranch(branch).length;
          const semesters = [...new Set(getDocumentsByBranch(branch).map((d) => d.semester))].filter((s): s is number => s != null).sort((a, b) => a - b);

          return (
            <Link
              key={branch}
              href={`/branches/${branch.toLowerCase()}`}
              className="group bg-white p-8 transition-all duration-300 hover:bg-brand"
            >
              <h2 className="text-2xl font-bold text-foreground transition-colors duration-300 group-hover:text-white">{name}</h2>
              <p className="mt-3 text-base text-muted-foreground transition-colors duration-300 group-hover:text-white/80">
                {docCount} documents · {semesters.length} semesters
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
