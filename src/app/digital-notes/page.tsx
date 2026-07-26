import type { Metadata } from "next";
import { SearchHero } from "@/components/SearchHero";

export const metadata: Metadata = {
  title: "Digital Notes — JU Learning",
  description:
    "Browse clean typed notes and study materials across all branches. Well-organized digital notes for every subject.",
};

export default function DigitalNotesPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <SearchHero
        title="Digital Notes"
        subtitle="Clean typed notes and study materials"
        defaultTags={["typed"]}
        searchOnMount
      />
    </main>
  );
}
