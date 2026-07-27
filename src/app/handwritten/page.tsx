import type { Metadata } from "next";
import Link from "next/link";
import { SearchHero } from "@/components/SearchHero";

export const metadata: Metadata = {
  title: "Handwritten Notes — JU Learning",
  description:
    "Browse handwritten notes scanned by students across all branches. Clear summaries and exam-oriented handwritten study materials.",
};

export default function HandwrittenPage() {
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
        title="Handwritten Notes"
        subtitle="Student-scanned handwritten summaries"
        defaultType="handwritten"
        searchOnMount
        hideTypeFilter
      />
    </main>
  );
}
