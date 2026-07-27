import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  documents,
  getAllDegrees,
  getBranchesByDegree,
  getSemestersByBranch,
  getSubjectsBySemester,
  getDocumentCount,
} from "@/data/documents";
import { slugify, deslugifyDegree, semesterSlug, parseSemesterSlug, deslugify } from "@/lib/slugs";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export function generateStaticParams() {
  const params: { degree: string; branch: string; semester: string }[] = [];
  const degrees = getAllDegrees();
  for (const degree of degrees) {
    const branches = getBranchesByDegree(degree.id);
    for (const branch of branches) {
      const semesters = getSemestersByBranch(degree.id, branch);
      for (const sem of semesters) {
        params.push({
          degree: degree.id,
          branch: slugify(branch),
          semester: semesterSlug(sem),
        });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ degree: string; branch: string; semester: string }>;
}): Promise<Metadata> {
  const { degree: degreeSlug, branch: branchSlug, semester: semSlug } = await params;
  const degreeName = deslugifyDegree(degreeSlug);
  const branch = deslugify(branchSlug).toUpperCase();
  const semester = parseSemesterSlug(semSlug);
  const degrees = getAllDegrees();
  const degree = degrees.find((d) => d.id === degreeSlug);
  if (!degree || semester == null) return { title: "Not Found" };
  const count = getDocumentCount(degreeSlug, branch, semester);
  const name = branch;
  return {
    title: `${name} — Semester ${semester} — ${degree.name} — JU Learning`,
    description: `Browse ${count} study materials for ${name} Semester ${semester} (${degree.name}). Notes, PYQs, assignments, and lab manuals.`,
  };
}

export default async function SemesterPage({
  params,
}: {
  params: Promise<{ degree: string; branch: string; semester: string }>;
}) {
  const { degree: degreeSlug, branch: branchSlug, semester: semSlug } = await params;
  const degrees = getAllDegrees();
  const degree = degrees.find((d) => d.id === degreeSlug);
  const branch = deslugify(branchSlug).toUpperCase();
  const semester = parseSemesterSlug(semSlug);
  if (!degree || !getBranchesByDegree(degreeSlug).includes(branch) || semester == null) notFound();

  const subjects = getSubjectsBySemester(degreeSlug, branch, semester);
  const branchDocs = documents.filter(
    (d) => d.branch === branch && d.semester === semester,
  );
  if (branchDocs.length === 0) notFound();

  const name = branch;

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16">
      <div className="pt-16 sm:pt-20">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: degree.name, href: `/${degreeSlug}` },
            { label: branch, href: `/${degreeSlug}/${slugify(branch)}` },
            { label: `Semester ${semester}` },
          ]}
        />
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {name} — Semester {semester}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {subjects.length} subjects · {branchDocs.length} documents
          </p>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-3">
        {subjects.map((subject) => {
          const subjectDocs = branchDocs.filter((d) => d.subject === subject);

          return (
            <Link
              key={subject}
              href={`/${degreeSlug}/${slugify(branch)}/${semesterSlug(semester)}/${slugify(subject)}`}
              className="group bg-white p-8 transition-all duration-300 hover:bg-brand"
            >
              <h2 className="text-2xl font-bold text-foreground transition-colors duration-300 group-hover:text-white">
                {subject}
              </h2>
              <p className="mt-3 text-base text-muted-foreground transition-colors duration-300 group-hover:text-white/80">
                {subjectDocs.length} documents
              </p>
            </Link>
          );
        })}
      </div>

      {subjects.length === 0 && (
        <div className="mt-12 text-center text-sm text-muted-foreground">
          No subjects found for this semester.
        </div>
      )}
    </div>
  );
}
