import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, FileText } from "lucide-react";
import { BRANCHES } from "@/lib/types";
import type { Branch } from "@/lib/types";
import { documents } from "@/data/documents";
import { BRANCH_IMAGES } from "@/lib/images";
import { Navbar } from "@/components/Navbar";

export default async function BranchPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  const branchInfo = BRANCHES.find((b) => b.id.toLowerCase() === branch.toLowerCase());
  if (!branchInfo) notFound();

  const branchUpper = branch.toUpperCase() as Branch;
  const branchDocs = documents.filter((d) => d.branch === branchUpper);
  const availableSemesters = [...new Set(branchDocs.map((d) => d.semester))].sort((a, b) => a - b);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Banner */}
      <div className="relative h-48 sm:h-56 overflow-hidden">
        <img src={BRANCH_IMAGES[branchUpper]} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute bottom-5 left-4 sm:left-6 sm:bottom-6">
          <Link href="/browse" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="h-3 w-3" />
            All branches
          </Link>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">{branchInfo.id}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {branchDocs.length} docs across {availableSemesters.length} {availableSemesters.length === 1 ? "semester" : "semesters"}
          </p>
        </div>
      </div>

      {/* Semester sections */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-8">
          {availableSemesters.map((semester) => {
            const semesterDocs = branchDocs.filter((d) => d.semester === semester);
            const groupedSubjects: Record<string, typeof semesterDocs> = {};
            for (const doc of semesterDocs) {
              if (!groupedSubjects[doc.subject]) groupedSubjects[doc.subject] = [];
              groupedSubjects[doc.subject].push(doc);
            }

            return (
              <section key={semester}>
                <div className="mb-4 flex items-baseline gap-3">
                  <h2 className="font-heading text-base font-semibold text-foreground">Semester {semester}</h2>
                  <span className="text-xs text-muted-foreground">{semesterDocs.length} files</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(groupedSubjects).map(([subject, subjectDocs]) => {
                    const allTags = [...new Set(subjectDocs.flatMap((d) => d.tags))];
                    return (
                      <Link
                        key={subject}
                        href={`/search?branch=${branchUpper}&semester=${semester}&subject=${encodeURIComponent(subject)}`}
                        className="group rounded-2xl bg-surface p-5 transition-all hover:bg-surface-elevated"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-subtle transition-colors group-hover:bg-brand/20">
                            <BookOpen className="h-4 w-4 text-brand" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-brand">{subject}</h3>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {allTags.map((tag) => (
                                <span key={tag} className="tag">{tag}</span>
                              ))}
                            </div>
                            <p className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              {subjectDocs.length} {subjectDocs.length === 1 ? "file" : "files"}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground/40">
        JU Learning — Open source study materials.
      </footer>
    </div>
  );
}
