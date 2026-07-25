import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BRANCHES } from "@/lib/types";
import { documents, getUniqueSemesters } from "@/data/documents";
import { BRANCH_IMAGES } from "@/lib/images";

export default function BrowsePage() {

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
            <span className="text-xs font-bold text-black">JU</span>
          </div>
          <span className="text-sm font-bold text-white">JU Learning</span>
        </Link>
        <Link href="/about" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">About</Link>
      </div>

      {/* Title */}
      <div className="px-6 sm:px-10 pt-8 pb-12">
        <p className="text-xs font-medium tracking-widest text-amber-500 uppercase">Browse</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Choose your<br />
          <span className="text-zinc-500">branch</span>
        </h1>
      </div>

      {/* Magazine-style branch grid */}
      <div className="px-6 sm:px-10 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BRANCHES.map((branch, i) => {
            const branchDocs = documents.filter((d) => d.branch === branch.id);
            const semesters = getUniqueSemesters(branch.id);
            const subjectCount = [...new Set(branchDocs.map((d) => d.subject))].length;

            const isLarge = i === 0;

            return (
              <Link
                key={branch.id}
                href={`/browse/${branch.id.toLowerCase()}`}
                className={`group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 transition-all hover:border-amber-500/30 ${
                  isLarge ? "sm:col-span-2 sm:row-span-1" : ""
                }`}
              >
                {/* Background image */}
                <div className="absolute inset-0">
                  <img
                    src={BRANCH_IMAGES[branch.id]}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative flex h-full min-h-[320px] flex-col justify-end p-6 sm:p-8">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-400 backdrop-blur-sm w-fit">
                    {subjectCount} subjects
                  </div>
                  <h2 className="text-3xl font-bold text-white sm:text-4xl">{branch.id}</h2>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/60">
                    {branch.name}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {semesters.map((sem) => (
                        <span key={sem} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-sm">
                          S{sem}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-white/40">{branchDocs.length} documents</span>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-amber-400 transition-all group-hover:gap-2.5">
                    Browse {branch.id} <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Minimal footer */}
      <footer className="border-t border-zinc-800 py-6 text-center text-xs text-zinc-600">
        JU Learning — Open source study materials.
      </footer>
    </div>
  );
}
