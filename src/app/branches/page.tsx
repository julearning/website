import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Monitor, Zap, Cog, HardHat, Radio } from "lucide-react";
import { getUniqueBranches, getDocumentsByBranch } from "@/data/documents";
import type { Branch } from "@/lib/types";

export const metadata: Metadata = {
  title: "Branches — JU Learning",
  description: "Browse B.Tech study materials by engineering branch. Access notes, PYQs, lab manuals, and more for CSE, ECE, EE, ME, and CE.",
};

const BRANCH_INFO: Record<Branch, { name: string; description: string; icon: typeof BookOpen }> = {
  CSE: { name: "Computer Science & Engineering", description: "Software, algorithms, AI, and computing systems", icon: Monitor },
  ECE: { name: "Electronics & Communication Engineering", description: "Circuits, signals, VLSI, and communication systems", icon: Radio },
  EE: { name: "Electrical Engineering", description: "Power systems, machines, and energy", icon: Zap },
  ME: { name: "Mechanical Engineering", description: "Design, thermal, manufacturing, and mechanics", icon: Cog },
  CE: { name: "Civil Engineering", description: "Structures, materials, construction, and environment", icon: HardHat },
};

export default function BranchesPage() {
  const branches = getUniqueBranches();

  return (
    <div className="mx-auto max-w-5xl px-6 pb-16">
      <div className="pt-12 sm:pt-16">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
          <span>/</span>
          <span className="text-foreground">Branches</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Engineering Branches</h1>
        <p className="mt-2 text-base text-muted-foreground">Select your branch to browse study materials by semester and subject.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => {
          const info = BRANCH_INFO[branch as Branch];
          const Icon = info?.icon || BookOpen;
          const docCount = getDocumentsByBranch(branch).length;
          const semesters = [...new Set(getDocumentsByBranch(branch).map((d) => d.semester))].sort((a, b) => a - b);

          return (
            <Link
              key={branch}
              href={`/branches/${branch.toLowerCase()}`}
              className="group rounded-xl border border-border bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent transition-colors group-hover:bg-brand/10">
                <Icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-brand" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{info?.name || branch}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{info?.description}</p>
              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{docCount} document{docCount !== 1 ? "s" : ""}</span>
                <span className="text-muted-foreground/30">·</span>
                <span>{semesters.length} semester{semesters.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {semesters.map((sem) => (
                  <span key={sem} className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground">S{sem}</span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
