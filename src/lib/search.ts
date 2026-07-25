import Fuse from "fuse.js";
import type { Document, FilterState } from "./types";

let fuseInstance: Fuse<Document> | null = null;

export type SearchResult = {
  doc: Document;
  score: number;
};

function createFuseInstance(docs: Document[]) {
  return new Fuse(docs, {
    keys: [
      { name: "title", weight: 8 },
      { name: "subject", weight: 6 },
      { name: "topic", weight: 5 },
      { name: "description", weight: 3 },
      { name: "branch", weight: 2 },
      { name: "tags", weight: 1 },
    ],
    threshold: 0.4,
    distance: 100,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 1,
  });
}

export function getSearchEngine(docs: Document[]) {
  if (!fuseInstance) {
    fuseInstance = createFuseInstance(docs);
  }
  return fuseInstance;
}

export function searchDocuments(
  docs: Document[],
  filters: FilterState,
): SearchResult[] {
  const { query, branch, semester, subject, tags, fileType, sort } = filters;

  // Apply filters first
  let filtered = [...docs];

  if (branch) filtered = filtered.filter((d) => d.branch === branch);
  if (semester) filtered = filtered.filter((d) => d.semester === semester);
  if (subject) {
    filtered = filtered.filter(
      (d) => d.subject.toLowerCase() === subject.toLowerCase(),
    );
  }
  if (tags.length > 0) {
    filtered = filtered.filter((d) => tags.every((t) => d.tags.includes(t)));
  }
  if (fileType) filtered = filtered.filter((d) => d.fileType === fileType);

  // If no query, sort and return
  if (!query || query.trim().length === 0) {
    return sortResults(filtered, sort);
  }

  // Use Fuse.js for fuzzy search
  const fuse = getSearchEngine(docs);
  const rawResults = fuse.search(query);

  // Map results to documents (intersect with filtered)
  const results: SearchResult[] = [];
  const filteredIds = new Set(filtered.map((d) => d.id));

  for (const result of rawResults) {
    if (filteredIds.has(result.item.id)) {
      results.push({
        doc: result.item,
        score: result.score ?? 1,
      });
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
      sorted.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      break;
    case "oldest":
      sorted.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
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

function sortResults(docs: Document[], sort: FilterState["sort"]): SearchResult[] {
  return sortDocumentsBy(docs, sort).map((doc) => ({ doc, score: 0 }));
}
