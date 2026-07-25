import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocumentsByBranch } from "@/data/documents";
import type { Branch } from "@/lib/types";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const BRANCH_MAP: Record<string, Branch> = {
  cse: "CSE", ece: "ECE", ee: "EE", me: "ME", ce: "CE",
};

const BRANCH_NAMES: Record<Branch, string> = {
  CSE: "Computer Science & Engineering",
  ECE: "Electronics & Communication Engineering",
  EE: "Electrical Engineering",
  ME: "Mechanical Engineering",
  CE: "Civil Engineering",
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
    title: `${BRANCH_NAMES[branch] || branch} — JU Learning`,
    description: `Browse ${count} study materials for ${BRANCH_NAMES[branch] || branch}. Notes, PYQs, and more across all semesters.`,
  };
}

export default async function BranchPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch: branchSlug } = await params;
  const branch = BRANCH_MAP[branchSlug];
  if (!branch) notFound();

  const name = BRANCH_NAMES[branch] || branch;
  const docs = getDocumentsByBranch(branch);
  const semesters = [...new Set(docs.map((d) => d.semester))].sort((a, b) => a - b);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16">
      <div className="pt-12 sm:pt-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Branches", href: "/branches" }, { label: branch }]} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{name}</h1>
          <p className="mt-1 text-base text-muted-foreground">{docs.length} document{docs.length !== 1 ? "s" : ""} across {semesters.length} semester{semesters.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {semesters.map((sem) => {
          const semesterDocs = docs.filter((d) => d.semester === sem);
          const subjects = [...new Set(semesterDocs.map((d) => d.subject))].sort();

          return (
            <Link
              key={sem}
              href={`/semesters/${branchSlug}/${sem}`}
              className="group bg-white p-6 transition-all duration-300 hover:bg-brand"
            >
              <h2 className="text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-white">Semester {sem}</h2>
              <p className="mt-1 text-sm text-muted-foreground transition-colors duration-300 group-hover:text-white/70">
                {subjects.length} subject{subjects.length !== 1 ? "s" : ""} · {semesterDocs.length} document{semesterDocs.length !== 1 ? "s" : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {subjects.slice(0, 6).map((subject) => (
                  <span key={subject} className="bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors duration-300 group-hover:bg-white/15 group-hover:text-white/80">
                    {subject}
                  </span>
                ))}
                {subjects.length > 6 && (
                  <span className="bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors duration-300 group-hover:bg-white/15 group-hover:text-white/80">
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
