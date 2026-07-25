import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, FileText, Monitor, Radio, Zap, Cog, HardHat } from "lucide-react";
import { documents, getDocumentsByBranch } from "@/data/documents";
import type { Branch } from "@/lib/types";
import { formatFileSize } from "@/lib/types";

const BRANCH_MAP: Record<string, Branch> = {
  cse: "CSE",
  ece: "ECE",
  ee: "EE",
  me: "ME",
  ce: "CE",
};

const BRANCH_ICONS: Record<Branch, typeof BookOpen> = {
  CSE: Monitor,
  ECE: Radio,
  EE: Zap,
  ME: Cog,
  CE: HardHat,
};

export async function generateStaticParams() {
  const params: { branch: string; semester: string }[] = [];
  for (const slug of Object.keys(BRANCH_MAP)) {
    const branch = BRANCH_MAP[slug];
    const semesters = [
      ...new Set(getDocumentsByBranch(branch).map((d) => d.semester)),
    ];
    for (const sem of semesters) {
      params.push({ branch: slug, semester: String(sem) });
    }
  }
  return params;
}

export default async function SemesterPage({
  params,
}: {
  params: Promise<{ branch: string; semester: string }>;
}) {
  const { branch: branchSlug, semester: semStr } = await params;
  const branch = BRANCH_MAP[branchSlug];
  const semester = Number(semStr);
  if (!branch || isNaN(semester) || semester < 1 || semester > 8)
    notFound();

  const Icon = BRANCH_ICONS[branch] || BookOpen;
  const branchDocs = documents.filter(
    (d) => d.branch === branch && d.semester === semester,
  );

  if (branchDocs.length === 0) notFound();

  // Group by subject
  const subjectMap = new Map<string, typeof branchDocs>();
  for (const doc of branchDocs) {
    const existing = subjectMap.get(doc.subject) || [];
    existing.push(doc);
    subjectMap.set(doc.subject, existing);
  }

  const subjects = [...subjectMap.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );

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
          <span className="text-foreground">Semester {semester}</span>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent">
            <Icon className="h-7 w-7 text-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {branch} — Semester {semester}
            </h1>
            <p className="mt-1 text-base text-muted-foreground">
              {subjects.length} subject{subjects.length !== 1 ? "s" : ""} · {branchDocs.length} document{branchDocs.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map(([subject, subjectDocs]) => {
          const tags = [
            ...new Set(subjectDocs.flatMap((d) => d.tags)),
          ];
          const totalSize = subjectDocs.reduce((sum, d) => sum + d.fileSize, 0);
          const sections = [
            ...new Set(subjectDocs.map((d) => d.section)),
          ];

          return (
            <Link
              key={subject}
              href={`/browse/${branchSlug}/${semester}/${encodeURIComponent(subject)}`}
              className="group rounded-xl border border-border bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent transition-colors group-hover:bg-brand/10">
                  <FileText className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-brand" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-foreground">
                    {subject}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {subjectDocs.length} document{subjectDocs.length !== 1 ? "s" : ""}
                    {totalSize > 0 && ` · ${formatFileSize(totalSize)}`}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground"
                  >
                    {tag.replace("-", " ")}
                  </span>
                ))}
              </div>

              {sections.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {sections.map((s) => (
                    <span
                      key={s}
                      className="rounded-md border border-border/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/60"
                    >
                      {s === "section-a" ? "Sec A" : s === "section-b" ? "Sec B" : "Mixed"}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
