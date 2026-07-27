import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllDegrees,
  getBranchesByDegree,
  getSemestersByBranch,
  getDocumentCount,
  getSubjectsBySemester,
} from "@/data/documents";
import { slugify, deslugifyDegree, semesterSlug, deslugify } from "@/lib/slugs";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export function generateStaticParams() {
  const params: { degree: string; branch: string }[] = [];
  const degrees = getAllDegrees();
  for (const degree of degrees) {
    const branches = getBranchesByDegree(degree.id);
    for (const branch of branches) {
      params.push({ degree: degree.id, branch: slugify(branch) });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ degree: string; branch: string }>;
}): Promise<Metadata> {
  const { degree: degreeSlug, branch: branchSlug } = await params;
  const degreeName = deslugifyDegree(degreeSlug);
  const branch = deslugify(branchSlug).toUpperCase();
  const degrees = getAllDegrees();
  const degree = degrees.find((d) => d.id === degreeSlug);
  if (!degree) return { title: "Not Found" };
  const count = getDocumentCount(degreeSlug, branch);
  const name = branch;
  return {
    title: `${name} — ${degree.name} — JU Learning`,
    description: `Browse ${count} study materials for ${name} (${degree.name}). Notes, PYQs, and more across all semesters.`,
  };
}

export default async function BranchPage({
  params,
}: {
  params: Promise<{ degree: string; branch: string }>;
}) {
  const { degree: degreeSlug, branch: branchSlug } = await params;
  const degrees = getAllDegrees();
  const degree = degrees.find((d) => d.id === degreeSlug);
  const branch = deslugify(branchSlug).toUpperCase();
  if (!degree || !getBranchesByDegree(degreeSlug).includes(branch)) notFound();

  const name = branch;
  const semesters = getSemestersByBranch(degreeSlug, branch);
  const docCount = getDocumentCount(degreeSlug, branch);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16">
      <div className="pt-16 sm:pt-20">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: degree.name, href: `/${degreeSlug}` },
            { label: branch },
          ]}
        />
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {name}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {docCount} documents across {semesters.length} semesters
          </p>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-3">
        {semesters.map((sem) => {
          const subjects = getSubjectsBySemester(degreeSlug, branch, sem);
          const semDocCount = getDocumentCount(degreeSlug, branch, sem);

          return (
            <Link
              key={sem}
              href={`/${degreeSlug}/${slugify(branch)}/${semesterSlug(sem)}`}
              className="group bg-white p-8 transition-all duration-300 hover:bg-brand"
            >
              <h2 className="text-2xl font-bold text-foreground transition-colors duration-300 group-hover:text-white">
                Semester {sem}
              </h2>
              <p className="mt-3 text-base text-muted-foreground transition-colors duration-300 group-hover:text-white/80">
                {subjects.length} subjects · {semDocCount} documents
              </p>
            </Link>
          );
        })}
      </div>

      {semesters.length === 0 && (
        <div className="mt-12 text-center text-sm text-muted-foreground">
          No semesters found for this branch.
        </div>
      )}
    </div>
  );
}
