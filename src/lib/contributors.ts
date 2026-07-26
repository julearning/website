/**
 * Contributor data — shared across the leaderboard and homepage circle.
 * Extracts all unique contributors from documents with their counts.
 */

import { documents } from "@/data/documents";

export interface Contributor {
  username: string;
  count: number;
}

/** Get all contributors sorted by count descending */
export function getAllContributors(): Contributor[] {
  const counts: Record<string, number> = {};
  for (const doc of documents) {
    const c = doc.contributor || "unknown";
    counts[c] = (counts[c] || 0) + 1;
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([username, count]) => ({ username, count }));
}

/** Get total document count */
export function getTotalDocuments(): number {
  return documents.length;
}
