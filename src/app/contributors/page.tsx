import type { Metadata } from "next";
import { ContributorsPageClient } from "./client";

export const metadata: Metadata = {
  title: "Contributors — JU Learning",
  description:
    "Leaderboard of top contributors who have shared study materials on JU Learning.",
};

export default function ContributorsPage() {
  return <ContributorsPageClient />;
}
