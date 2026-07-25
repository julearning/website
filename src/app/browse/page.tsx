import Link from "next/link";
import { ArrowRight, BookOpen, Monitor, Radio, Zap, Cog, Compass } from "lucide-react";
import { BRANCHES } from "@/lib/types";
import { documents, getUniqueSemesters } from "@/data/documents";
import { BRANCH_IMAGES } from "@/lib/images";
import { Navbar } from "@/components/Navbar";

const BRANCH_ICONS: Record<string, React.ReactNode> = {
  CSE: <Monitor className="h-5 w-5" />,
  ECE: <Radio className="h-5 w-5" />,
  EE: <Zap className="h-5 w-5" />,
  ME: <Cog className="h-5 w-5" />,
  CE: <Compass className="h-5 w-5" />,
};

export default function BrowsePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pt-12 pb-24 sm:px-6">
        <div className="mb-10">
          <p className="font-heading text-xs font-medium tracking-widest text-brand uppercase">Browse</p>
          <h1 className="font-heading mt-2 text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl">
            Choose a branch
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Select your branch to filter notes, PYQs, and assignments by semester and subject.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BRANCHES.map((branch, i) => {
            const branchDocs = documents.filter((d) => d.branch === branch.id);
            const semesters = getUniqueSemesters(branch.id);
            const subjectCount = [...new Set(branchDocs.map((d) => d.subject))].length;
            const isFeatured = i === 0;

            return (
              <Link
                key={branch.id}
                href={`/browse/${branch.id.toLowerCase()}`}
                className={`group relative overflow-hidden rounded-2xl bg-surface transition-all hover:bg-surface-elevated ${
                  isFeatured ? "sm:col-span-2" : ""
                }`}
              >
                <div className="absolute inset-0">
                  <img
                    src={BRANCH_IMAGES[branch.id]}
                    alt=""
                    className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30" />
                </div>

                <div className="relative flex h-full min-h-[280px] flex-col justify-end p-6 sm:p-8">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-subtle px-3 py-1 text-xs font-medium text-brand backdrop-blur-sm w-fit">
                    <BookOpen className="h-3 w-3" />
                    {subjectCount} {subjectCount === 1 ? "subject" : "subjects"}
                  </div>

                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
                      {BRANCH_ICONS[branch.id]}
                    </div>
                    <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">{branch.id}</h2>
                  </div>
                  <p className="max-w-xs text-sm text-white/50">{branch.name}</p>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {semesters.map((sem) => (
                        <span key={sem} className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/60">
                          S{sem}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-white/35">{branchDocs.length} docs</span>
                  </div>

                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand transition-all group-hover:gap-2.5">
                    Browse <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
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
