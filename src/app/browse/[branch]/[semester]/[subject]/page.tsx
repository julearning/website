import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Monitor, Radio, Zap, Cog, HardHat } from "lucide-react";
import { documents } from "@/data/documents";
import type { Branch } from "@/lib/types";
import { DocumentBrowser } from "./DocumentBrowser";

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
  const params: { branch: string; semester: string; subject: string }[] = [];
  for (const doc of documents) {
    const slug = Object.entries(BRANCH_MAP).find(([, v]) => v === doc.branch)?.[0];
    if (slug) {
      params.push({
        branch: slug,
        semester: String(doc.semester),
        subject: encodeURIComponent(doc.subject),
      });
    }
  }
  // Deduplicate
  const seen = new Set<string>();
  return params.filter((p) => {
    const key = `${p.branch}/${p.semester}/${p.subject}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ branch: string; semester: string; subject: string }>;
}) {
  const { branch: branchSlug, semester: semStr, subject: subjectEncoded } = await params;
  const branch = BRANCH_MAP[branchSlug];
  const semester = Number(semStr);
  const subject = decodeURIComponent(subjectEncoded);

  if (!branch || isNaN(semester)) notFound();

  const subjectDocs = documents.filter(
    (d) => d.branch === branch && d.semester === semester && d.subject === subject,
  );

  if (subjectDocs.length === 0) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 pb-16">
      <div className="pt-12 sm:pt-16">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/browse" className="transition-colors hover:text-foreground">Browse</Link>
          <span>/</span>
          <Link href={`/browse/${branchSlug}`} className="transition-colors hover:text-foreground">{branch}</Link>
          <span>/</span>
          <Link href={`/browse/${branchSlug}/${semester}`} className="transition-colors hover:text-foreground">Semester {semester}</Link>
          <span>/</span>
          <span className="text-foreground">{subject}</span>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {subject}
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {BRANCH_NAMES[branch]} — Semester {semester} · {subjectDocs.length} document{subjectDocs.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <DocumentBrowser docs={subjectDocs} subject={subject} />
    </div>
  );
}
