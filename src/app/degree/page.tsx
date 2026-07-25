import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Monitor, Radio, Zap, Cog, HardHat } from "lucide-react";
import { getUniqueBranches, getDocumentsByBranch, documents } from "@/data/documents";
import type { Branch } from "@/lib/types";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "B.Tech Degree — JU Learning",
  description: "Browse B.Tech study materials across all engineering branches. Access notes, PYQs, lab manuals, and more.",
};

const BRANCH_INFO: Record<Branch, { name: string; description: string; icon: typeof BookOpen }> = {
  CSE: { name: "Computer Science & Engineering", description: "Software, algorithms, AI, and computing systems", icon: Monitor },
  ECE: { name: "Electronics & Communication Engineering", description: "Circuits, signals, VLSI, and communication systems", icon: Radio },
  EE: { name: "Electrical Engineering", description: "Power systems, machines, and energy", icon: Zap },
  ME: { name: "Mechanical Engineering", description: "Design, thermal, manufacturing, and mechanics", icon: Cog },
  CE: { name: "Civil Engineering", description: "Structures, materials, construction, and environment", icon: HardHat },
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
          const info = BRANCH_INFO[branch as Branch];
          const Icon = info?.icon || BookOpen;
          const docs = getDocumentsByBranch(branch);
          const sems = [...new Set(docs.map((d) => d.semester))].sort((a, b) => a - b);
          const subs = [...new Set(docs.map((d) => d.subject))].sort();

          return (
            <Link
              key={branch}
              href={`/branches/${branch.toLowerCase()}`}
              className="group rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent transition-colors group-hover:bg-brand/10">
                <Icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-brand" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{info?.name || branch}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{info?.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{docs.length} docs</span>
                <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{sems.length} semesters</span>
                <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{subs.length} subjects</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {sems.map((sem) => (
                  <span key={sem} className="rounded-md bg-accent/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/70">S{sem}</span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
