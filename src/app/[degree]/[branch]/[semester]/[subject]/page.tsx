import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  documents,
  getAllDegrees,
  getBranchesByDegree,
  getSemestersByBranch,
  getSubjectsBySemester,
} from "@/data/documents";
import { slugify, deslugifyDegree, semesterSlug, parseSemesterSlug, deslugify } from "@/lib/slugs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DocumentBrowser } from "./DocumentBrowser";
import { RelatedDocuments } from "@/components/RelatedDocuments";

export function generateStaticParams() {
  const params: { degree: string; branch: string; semester: string; subject: string }[] = [];
  const degrees = getAllDegrees();
  for (const degree of degrees) {
    const branches = getBranchesByDegree(degree.id);
    for (const branch of branches) {
      const semesters = getSemestersByBranch(degree.id, branch);
      for (const sem of semesters) {
        const subjects = getSubjectsBySemester(degree.id, branch, sem);
        for (const subject of subjects) {
          params.push({
            degree: degree.id,
            branch: slugify(branch),
            semester: semesterSlug(sem),
            subject: slugify(subject),
          });
        }
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ degree: string; branch: string; semester: string; subject: string }>;
}): Promise<Metadata> {
  const { degree: degreeSlug, branch: branchSlug, semester: semSlug, subject: subjectSlug } = await params;
  const degreeName = deslugifyDegree(degreeSlug);
  const branch = deslugify(branchSlug).toUpperCase();
  const semester = parseSemesterSlug(semSlug);
  const subject = deslugify(subjectSlug);
  const degrees = getAllDegrees();
  const degree = degrees.find((d) => d.id === degreeSlug);
  if (!degree || semester == null) return { title: "Not Found" };
  const count = documents.filter(
    (d) => d.branch === branch && d.semester === semester && d.subject === subject,
  ).length;
  const name = branch;
  return {
    title: `${subject} — ${name} Semester ${semester} — ${degree.name} — JU Learning`,
    description: `Browse ${count} study materials for ${subject} — ${name} Semester ${semester} (${degree.name}).`,
  };
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ degree: string; branch: string; semester: string; subject: string }>;
}) {
  const { degree: degreeSlug, branch: branchSlug, semester: semSlug, subject: subjectSlug } = await params;
  const degrees = getAllDegrees();
  const degree = degrees.find((d) => d.id === degreeSlug);
  const branch = deslugify(branchSlug).toUpperCase();
  const semester = parseSemesterSlug(semSlug);
  const subject = deslugify(subjectSlug);

  if (!degree || !getBranchesByDegree(degreeSlug).includes(branch) || semester == null) notFound();

  const subjectDocs = documents.filter(
    (d) => d.branch === branch && d.semester === semester && d.subject === subject,
  );
  if (subjectDocs.length === 0) notFound();

  const name = branch;

  // Related documents: same subject, different branch/semester, sorted newest first, max 6
  const relatedDocIds = new Set(subjectDocs.map((d) => d.id));
  const relatedDocs = documents
    .filter((d) => d.subject === subject && !relatedDocIds.has(d.id))
    .sort((a, b) => {
      if (a.uploadedAt && b.uploadedAt) return b.uploadedAt.localeCompare(a.uploadedAt);
      return 0;
    })
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16">
      <div className="pt-12 sm:pt-16">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: degree.name, href: `/${degreeSlug}` },
            { label: branch, href: `/${degreeSlug}/${slugify(branch)}` },
            { label: `Semester ${semester}`, href: `/${degreeSlug}/${slugify(branch)}/${semesterSlug(semester)}` },
            { label: subject },
          ]}
        />
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {subject}
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {name} — Semester {semester} · {subjectDocs.length} document
            {subjectDocs.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <DocumentBrowser docs={subjectDocs} subject={subject} degree={degreeSlug} />
      <RelatedDocuments docs={relatedDocs} />
    </div>
  );
}
