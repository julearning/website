import type { Metadata } from "next";
import { SearchHero } from "@/components/SearchHero";

export const metadata: Metadata = {
  title: "Previous Year Questions — JU Learning",
  description:
    "Browse previous year question papers across all branches and semesters. Practice with real exam papers from previous years.",
};

export default function PYQPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <SearchHero
        title="Previous Year Questions"
        subtitle="Past exam papers from all semesters"
        defaultTags={["pyq"]}
        searchOnMount
      />
    </main>
  );
}
