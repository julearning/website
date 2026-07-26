import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { documents, getDocumentsByBranch } from "@/data/documents";
import type { Branch } from "@/lib/types";
import { formatFileSize } from "@/lib/types";
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

export async function generateStaticParams() {
  const params: { branch: string; semester: string }[] = [];
  for (const slug of Object.keys(BRANCH_MAP)) {
    const branch = BRANCH_MAP[slug];
    const semesters = [...new Set(getDocumentsByBranch(branch).map((d) => d.semester))];
    for (const sem of semesters) {
      params.push({ branch: slug, semester: String(sem) });
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ branch: string; semester: string }> }): Promise<Metadata> {
  const { branch: branchSlug, semester: semStr } = await params;
  const branch = BRANCH_MAP[branchSlug];
  const semester = Number(semStr);
  if (!branch || isNaN(semester)) return { title: "Not Found" };
  const count = documents.filter((d) => d.branch === branch && d.semester === semester).length;
  return { title: `${branch} Semester ${semester} — JU Learning`, description: `Browse ${count} study materials for ${BRANCH_NAMES[branch] || branch} Semester ${semester}. Notes, PYQs, assignments, and lab manuals.` };
}

export default async function SemesterPage({ params }: { params: Promise<{ branch: string; semester: string }> }) {
  const { branch: branchSlug, semester: semStr } = await params;
  const branch = BRANCH_MAP[branchSlug];
  const semester = Number(semStr);
  if (!branch || isNaN(semester) || semester < 1 || semester > 8) notFound();

  const branchDocs = documents.filter((d) => d.branch === branch && d.semester === semester);
  if (branchDocs.length === 0) notFound();

  const subjectMap = new Map<string, typeof branchDocs>();
  for (const doc of branchDocs) {
    const existing = subjectMap.get(doc.subject) || [];
    existing.push(doc);
    subjectMap.set(doc.subject, existing);
  }
  const subjects = [...subjectMap.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16">
      <div className="pt-16 sm:pt-20">
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Branches", href: "/branches" },
          { label: branch, href: `/branches/${branchSlug}` },
          { label: `Semester ${semester}` },
        ]} />
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{BRANCH_NAMES[branch] || branch} — Semester {semester}</h1>
          <p className="mt-3 text-base text-muted-foreground">{subjects.length} subjects · {branchDocs.length} documents</p>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-3">
        {subjects.map(([subject, subjectDocs]) => {
          const totalSize = subjectDocs.reduce((sum, d) => sum + d.fileSize, 0);

          return (
            <Link
              key={subject}
              href={`/subjects/${branchSlug}/${semester}/${encodeURIComponent(subject)}`}
              className="group bg-white p-8 transition-all duration-300 hover:bg-brand"
            >
              <h2 className="text-2xl font-bold text-foreground transition-colors duration-300 group-hover:text-white">{subject}</h2>
              <p className="mt-3 text-base text-muted-foreground transition-colors duration-300 group-hover:text-white/80">
                {subjectDocs.length} documents{totalSize > 0 && ` · ${formatFileSize(totalSize)}`}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
