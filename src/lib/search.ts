import type { Document, FilterState, DocType } from "./types";

export type SearchResult = {
  doc: Document;
  score: number;
};

function singleWordScore(doc: {
  title: string;
  subject: string | null;
  description?: string;
  branch: string | null;
  type?: DocType;
  tags?: string[];
}, word: string): number {
  const title = (doc.title || "").toLowerCase();
  const subject = (doc.subject || "").toLowerCase();
  const description = (doc.description || "").toLowerCase();
  const branch = (doc.branch || "").toLowerCase();
  const docType = doc.type || doc.tags?.[0] || "";

  // Exact title match
  if (title === word) return 0;
  if (title.startsWith(word)) return 0.1;
  if (title.includes(word)) return 0.2;

  // Subject match
  if (subject === word) return 0.15;
  if (subject.startsWith(word)) return 0.2;
  if (subject.includes(word)) return 0.3;

  // Description / type match
  if (description.includes(word)) return 0.35;
  if (docType.includes(word)) return 0.4;

  // Branch match
  if (branch.includes(word)) return 0.5;

  // Word-level partial match in title
  const titleWords = title.split(/\s+/);
  for (const tw of titleWords) {
    if (tw.startsWith(word) || word.startsWith(tw)) return 0.3;
  }

  // Word-level partial match in subject
  const subjectWords = subject.split(/\s+/);
  for (const sw of subjectWords) {
    if (sw.startsWith(word) || word.startsWith(sw)) return 0.45;
  }

  return 1;
}

function queryScore(doc: Document, q: string): number {
  const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;

  // Score each word separately, use the best (lowest) score across all words
  let bestScore = 1;
  for (const word of words) {
    const score = singleWordScore(doc, word);
    if (score < bestScore) bestScore = score;
    // If any word is an exact title match, overall is 0
    if (bestScore === 0) break;
  }
  return bestScore;
}

export function searchDocuments(
  docs: Document[],
  filters: FilterState,
): SearchResult[] {
  const { query, degree, branch, semester, subject, types, sources, sort } = filters;

  // Apply filters first
  let filtered = [...docs];

  if (degree) filtered = filtered.filter((d) => d.degree === degree);
  if (branch) filtered = filtered.filter((d) => d.branch === branch);
  if (semester) filtered = filtered.filter((d) => d.semester === semester);
  if (subject) {
    filtered = filtered.filter(
      (d) => (d.subject || "").toLowerCase() === (subject || "").toLowerCase(),
    );
  }
  if (types.length > 0) {
    filtered = filtered.filter((d) => types.includes(d.type as DocType) || (d.tags && d.tags.some((t) => types.includes(t as DocType))));
  }
  if (sources.length > 0) {
    filtered = filtered.filter((d) => sources.includes(d.source));
  }

  // If no query, sort and return
  if (!query || query.trim().length === 0) {
    return filtered.map((doc) => ({ doc, score: 0 }));
  }

  // Score each document against the query
  const results: SearchResult[] = [];
  for (const doc of filtered) {
    const score = queryScore(doc, query);
    if (score < 1) {
      results.push({ doc, score });
    }
  }

  // Sort by score (lower = better match)
  results.sort((a, b) => a.score - b.score);

  // Apply sort override if not relevance
  if (sort !== "relevance") {
    return sortDocumentsBy(results.map((r) => r.doc), sort).map((doc) => {
      const found = results.find((r) => r.doc.id === doc.id);
      return { doc, score: found?.score ?? 0 };
    });
  }

  return results;
}

function sortDocumentsBy(docs: Document[], sort: FilterState["sort"]): Document[] {
  const sorted = [...docs];
  switch (sort) {
    case "newest":
      sorted.sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());
      break;
    case "oldest":
      sorted.sort((a, b) => new Date(a.uploadedAt || 0).getTime() - new Date(b.uploadedAt || 0).getTime());
      break;
    case "name":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "size":
      sorted.sort((a, b) => b.fileSize - a.fileSize);
      break;
    default:
      break;
  }
  return sorted;
}
