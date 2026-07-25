import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BRANCHES } from "@/lib/types";
import type { Branch } from "@/lib/types";
import { documents } from "@/data/documents";
import { BRANCH_IMAGES } from "@/lib/images";

export default async function BranchPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  const branchInfo = BRANCHES.find((b) => b.id.toLowerCase() === branch.toLowerCase());
  if (!branchInfo) notFound();

  const branchUpper = branch.toUpperCase() as Branch;
  const branchDocs = documents.filter((d) => d.branch === branchUpper);
  const availableSemesters = [...new Set(branchDocs.map((d) => d.semester))].sort((a, b) => a - b);

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
            <span className="text-xs font-bold text-black">JU</span>
          </div>
          <span className="text-sm font-bold text-white">JU Learning</span>
        </Link>
      </div>

      {/* Hero banner */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img src={BRANCH_IMAGES[branchUpper]} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute bottom-8 left-6 sm:left-10">
          <Link href="/browse" className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors mb-3">
            <ArrowLeft className="h-3 w-3" /> All branches
          </Link>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">{branchInfo.id}</h1>
          <p className="mt-2 text-sm text-zinc-400">{branchDocs.length} documents</p>
        </div>
      </div>

      <div className="px-6 sm:px-10 py-12">
        <div className="space-y-12">
          {availableSemesters.map((semester) => {
            const semesterDocs = branchDocs.filter((d) => d.semester === semester);
            const semesterSubjects = [...new Set(semesterDocs.map((d) => d.subject))];

            return (
              <section key={semester}>
                <div className="mb-5 flex items-baseline gap-3">
                  <h2 className="text-lg font-semibold text-white">Semester {semester}</h2>
                  <span className="text-xs text-zinc-600">{semesterDocs.length} files</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {semesterSubjects.map((subject) => {
                    const subjectDocs = semesterDocs.filter((d) => d.subject === subject);
                    const tags = [...new Set(subjectDocs.flatMap((d) => d.tags))];
                    return (
                      <Link key={subject} href={`/search?branch=${branchUpper}&semester=${semester}&subject=${encodeURIComponent(subject)}`}
                        className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900">
                        <h3 className="text-sm font-semibold text-white">{subject}</h3>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-medium text-zinc-500">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p className="mt-3 text-xs text-zinc-600">{subjectDocs.length} file{subjectDocs.length !== 1 ? "s" : ""}</p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
