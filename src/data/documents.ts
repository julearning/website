/**
 * Document data source.
 *
 * At build time, scripts/generate-data.mjs clones julearning/metadata,
 * reads all subject-level JSON files, flattens sections into documents,
 * and generates src/data/generated-documents.ts with all document data.
 * This file re-exports from the generated file.
 */

export {
  documents,
  sources,
  getUniqueBranches,
  getUniqueSubjects,
  getUniqueSemesters,
  getDocumentsByBranch,
} from "./generated-documents";
export type { SourceMeta } from "./generated-documents";
