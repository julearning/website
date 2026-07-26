"use client";

import { useMemo } from "react";
import { ContributorLeaderboard } from "@/components/ContributorLeaderboard";
import { getAllContributors, getTotalDocuments } from "@/lib/contributors";

export default function ContributorsPage() {
  const contributors = useMemo(() => getAllContributors(), []);
  const totalDocs = useMemo(() => getTotalDocuments(), []);

  const totalContributors = contributors.length;
  const totalDocsFromContributors = contributors.reduce((s, c) => s + c.count, 0);

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <div className="pt-16 sm:pt-20">
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl">
          Contributors
        </h1>
        <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
          The people building JU Learning
        </p>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3">
        <div className="p-8 text-center">
          <p className="text-4xl font-black text-foreground sm:text-5xl">{totalContributors}</p>
          <p className="mt-2 text-base font-semibold text-muted-foreground">Contributors</p>
        </div>
        <div className="p-8 text-center">
          <p className="text-4xl font-black text-foreground sm:text-5xl">{totalDocsFromContributors.toLocaleString()}</p>
          <p className="mt-2 text-base font-semibold text-muted-foreground">Documents</p>
        </div>
        <div className="col-span-1 p-8 text-center">
          <p className="text-4xl font-black text-foreground sm:text-5xl">{totalDocs}</p>
          <p className="mt-2 text-base font-semibold text-muted-foreground">Catalog</p>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="mb-8 text-2xl font-bold text-foreground">Leaderboard</h2>
        <ContributorLeaderboard contributors={contributors} />
      </section>
    </main>
  );
}
