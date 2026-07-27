import type { Metadata } from "next";
import Link from "next/link";
import { SearchHero } from "@/components/SearchHero";

export const metadata: Metadata = {
  title: "Previous Year Questions — JU Learning",
  description:
    "Browse previous year question papers across all branches and semesters. Practice with real exam papers from previous years.",
};

export default function PYQPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
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
      <SearchHero
        title="Previous Year Questions"
        subtitle="Past exam papers from all semesters"
        defaultType="pyq"
        searchOnMount
        hideTypeFilter
      />
    </main>
  );
}
