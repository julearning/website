"use client";

import { useMemo } from "react";
import Link from "next/link";
import { getAllContributors } from "@/lib/contributors";
import { documents } from "@/data/documents";

export function ContributorsPageClient() {
  const contributors = useMemo(() => {
    // Alphabetical order — everyone equal
    const all = getAllContributors();
    return all.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()));
  }, []);
  const totalDocs = documents.length;

  return (
    <main className="mx-auto max-w-5xl px-6 pb-16">
      <div className="pt-16 sm:pt-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Home
        </Link>
      </div>

      <div className="mt-12 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl">
          Contributors
        </h1>
        <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
          {contributors.length} contributor{contributors.length !== 1 ? "s" : ""} ·{" "}
          {totalDocs.toLocaleString()} documents and growing.
        </p>
      </div>

      {/* Contributor grid — every contributor treated equally */}
      <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {contributors.map((c) => (
          <a
            key={c.username}
            href={`https://github.com/${c.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-3 px-4 py-6 transition-all duration-200 hover:bg-accent"
          >
            <div className="relative">
              <img
                src={`https://github.com/${c.username}.png?size=80`}
                alt={c.username}
                className="h-16 w-16 transition-transform duration-200 group-hover:scale-110"
                loading="lazy"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-brand">
                {c.username}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/50">
                {c.count} document{c.count !== 1 ? "s" : ""}
              </p>
            </div>
          </a>
        ))}
      </div>

      {/* Join them CTA */}
      <div className="mt-20 text-center">
        <h2 className="text-2xl font-bold text-foreground">Want to join them?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Share your notes with the community. Every contribution helps someone.
        </p>
        <Link
          href="/contribute"
          className="mt-6 inline-block bg-brand px-10 py-4 text-lg font-bold text-white transition-opacity hover:opacity-90"
        >
          Contribute now
        </Link>
      </div>
    </main>
  );
}
