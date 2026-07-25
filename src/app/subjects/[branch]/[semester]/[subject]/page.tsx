import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { documents } from "@/data/documents";
import type { Branch } from "@/lib/types";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DocumentBrowser } from "./DocumentBrowser";
import { RelatedDocuments } from "@/components/RelatedDocuments";

const BRANCH_MAP: Record<string, Branch> = {
  cse: "CSE", ece: "ECE", ee: "EE", me: "ME", ce: "CE",
};

const BRANCH_NAMES: Record<Branch, string> = {
  CSE: "Computer Science & Engineering", ECE: "Electronics & Communication Engineering",
  EE: "Electrical Engineering", ME: "Mechanical Engineering", CE: "Civil Engineering",
};

export async function generateStaticParams() {
  const params: { branch: string; semester: string; subject: string }[] = [];
  for (const doc of documents) {
    const slug = Object.entries(BRANCH_MAP).find(([, v]) => v === doc.branch)?.[0];
    if (slug) {
      params.push({ branch: slug, semester: String(doc.semester), subject: encodeURIComponent(doc.subject) });
    }
  }
  const seen = new Set<string>();
  return params.filter((p) => {
    const key = `${p.branch}/${p.semester}/${p.subject}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function generateMetadata({ params }: { params: Promise<{ branch: string; semester: string; subject: string }> }): Promise<Metadata> {
  const { branch: branchSlug, semester: semStr, subject: subjectEncoded } = await params;
  const branch = BRANCH_MAP[branchSlug];
  const semester = Number(semStr);
  const subject = decodeURIComponent(subjectEncoded);
  if (!branch || isNaN(semester)) return { title: "Not Found" };
  const count = documents.filter((d) => d.branch === branch && d.semester === semester && d.subject === subject).length;
  return { title: `${subject} — ${branch} Semester ${semester} — JU Learning`, description: `Browse ${count} study materials for ${subject} — ${branch} Semester ${semester}.` };
}

export default async function SubjectPage({ params }: { params: Promise<{ branch: string; semester: string; subject: string }> }) {
  const { branch: branchSlug, semester: semStr, subject: subjectEncoded } = await params;
  const branch = BRANCH_MAP[branchSlug];
  const semester = Number(semStr);
  const subject = decodeURIComponent(subjectEncoded);
  if (!branch || isNaN(semester)) notFound();

  const subjectDocs = documents.filter((d) => d.branch === branch && d.semester === semester && d.subject === subject);
  if (subjectDocs.length === 0) notFound();

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
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Branches", href: "/branches" },
          { label: branch, href: `/branches/${branchSlug}` },
          { label: `Semester ${semester}`, href: `/semesters/${branchSlug}/${semester}` },
          { label: subject },
        ]} />
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{subject}</h1>
          <p className="mt-1 text-base text-muted-foreground">{BRANCH_NAMES[branch]} — Semester {semester} · {subjectDocs.length} document{subjectDocs.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
      <DocumentBrowser docs={subjectDocs} subject={subject} />
      <RelatedDocuments docs={relatedDocs} />
    </div>
  );
}
