import type { Metadata } from "next";
import { SearchHero } from "@/components/SearchHero";

export const metadata: Metadata = {
  title: "Handwritten Notes — JU Learning",
  description:
    "Browse handwritten notes scanned by students across all branches. Clear summaries and exam-oriented handwritten study materials.",
};

export default function HandwrittenPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <SearchHero
        title="Handwritten Notes"
        subtitle="Student-scanned handwritten summaries"
        defaultTags={["handwritten"]}
        searchOnMount
      />
    </main>
  );
}
