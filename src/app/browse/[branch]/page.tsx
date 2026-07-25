import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Monitor, Radio, Zap, Cog, HardHat, BookOpen } from "lucide-react";
import { getDocumentsByBranch } from "@/data/documents";
import type { Branch } from "@/lib/types";

const BRANCH_MAP: Record<string, Branch> = {
  cse: "CSE",
  ece: "ECE",
  ee: "EE",
  me: "ME",
  ce: "CE",
};

const BRANCH_INFO: Record<Branch, { name: string; icon: typeof BookOpen }> = {
  CSE: { name: "Computer Science & Engineering", icon: Monitor },
  ECE: { name: "Electronics & Communication Engineering", icon: Radio },
  EE: { name: "Electrical Engineering", icon: Zap },
  ME: { name: "Mechanical Engineering", icon: Cog },
  CE: { name: "Civil Engineering", icon: HardHat },
};

export function generateStaticParams() {
  return Object.keys(BRANCH_MAP).map((slug) => ({ branch: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ branch: string }> }): Promise<Metadata> {
  const { branch: branchSlug } = await params;
  const branch = BRANCH_MAP[branchSlug];
  if (!branch) return { title: "Not Found" };
  const count = getDocumentsByBranch(branch).length;
  return {
    title: `${BRANCH_INFO[branch]?.name || branch} — JU Learning`,
    description: `Browse ${count} study materials for ${BRANCH_INFO[branch]?.name || branch}. Notes, PYQs, and more across all semesters.`,
  };
}

export default async function BranchPage({
  params,
}: {
  params: Promise<{ branch: string }>;
}) {
  const { branch: branchSlug } = await params;
  const branch = BRANCH_MAP[branchSlug];
  if (!branch) notFound();

  const info = BRANCH_INFO[branch];
  const Icon = info?.icon || BookOpen;
  const docs = getDocumentsByBranch(branch);

  // Get unique semesters that have documents
  const semesters = [...new Set(docs.map((d) => d.semester))].sort(
    (a, b) => a - b,
  );

  return (
    <div className="mx-auto max-w-5xl px-6 pb-16">
      <div className="pt-12 sm:pt-16">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/browse"
            className="transition-colors hover:text-foreground"
          >
            Browse
          </Link>
          <span>/</span>
          <span className="text-foreground">{branch}</span>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent">
            <Icon className="h-7 w-7 text-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {info?.name || branch}
            </h1>
            <p className="mt-1 text-base text-muted-foreground">
              {docs.length} document{docs.length !== 1 ? "s" : ""} across{" "}
              {semesters.length} semester{semesters.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {semesters.map((sem) => {
          const semesterDocs = docs.filter((d) => d.semester === sem);
          const subjects = [
            ...new Set(semesterDocs.map((d) => d.subject)),
          ].sort();

          return (
            <Link
              key={sem}
              href={`/browse/${branchSlug}/${sem}`}
              className="group rounded-xl border border-border bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <h2 className="text-xl font-semibold text-foreground">
                Semester {sem}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {subjects.length} subject{subjects.length !== 1 ? "s" : ""} ·{" "}
                {semesterDocs.length} document
                {semesterDocs.length !== 1 ? "s" : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {subjects.slice(0, 6).map((subject) => (
                  <span
                    key={subject}
                    className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    {subject}
                  </span>
                ))}
                {subjects.length > 6 && (
                  <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    +{subjects.length - 6}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
