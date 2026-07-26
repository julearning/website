"use client";

import { useMemo } from "react";
import { SearchHero } from "@/components/SearchHero";
import { ContributorLeaderboard } from "@/components/ContributorLeaderboard";
import { getAllContributors, getTotalDocuments } from "@/lib/contributors";

export default function ContributorsPage() {
  const contributors = useMemo(() => getAllContributors(), []);
  const totalDocs = useMemo(() => getTotalDocuments(), []);

  const totalContributors = contributors.length;
  const totalDocsFromContributors = contributors.reduce((s, c) => s + c.count, 0);

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <SearchHero
        title="Contributors"
        subtitle="The people building JU Learning"
      />

      <div className="mt-8 space-y-20">
        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="group bg-surface p-8 text-center transition-all duration-300 hover:bg-brand">
            <p className="text-3xl font-bold text-foreground transition-colors duration-300 group-hover:text-white sm:text-4xl">
              {totalContributors}
            </p>
            <p className="mt-2 text-sm text-muted-foreground transition-colors duration-300 group-hover:text-white/70">
              Contributors
            </p>
          </div>
          <div className="group bg-surface p-8 text-center transition-all duration-300 hover:bg-brand">
            <p className="text-3xl font-bold text-foreground transition-colors duration-300 group-hover:text-white sm:text-4xl">
              {totalDocsFromContributors.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-muted-foreground transition-colors duration-300 group-hover:text-white/70">
              Documents indexed
            </p>
          </div>
          <div className="col-span-2 bg-surface p-8 text-center transition-all duration-300 hover:bg-brand sm:col-span-1">
            <p className="text-3xl font-bold text-foreground transition-colors duration-300 group-hover:text-white sm:text-4xl">
              {totalDocs}
            </p>
            <p className="mt-2 text-sm text-muted-foreground transition-colors duration-300 group-hover:text-white/70">
              Total catalog
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        <section>
          <h2 className="mb-2 text-xl font-bold text-foreground">Leaderboard</h2>
          <p className="mb-8 text-sm text-muted-foreground">
            Ranked by number of documents contributed.
          </p>
          <ContributorLeaderboard contributors={contributors} />
        </section>
      </div>
    </main>
  );
}
