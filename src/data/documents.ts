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
  getUniqueDegrees,
  getUniqueBranches,
  getUniqueSubjects,
  getUniqueSemesters,
  getDocumentsByBranch,
  getDocumentsByDegree,
} from "./generated-documents";
export type { SourceMeta } from "./generated-documents";

// Re-export hierarchy helpers for convenient access
export {
  getAllDegrees,
  getBranchesByDegree,
  getSemestersByBranch,
  getSubjectsBySemester,
  getDocumentCount,
  getDegreeForBranch,
  getTypesForSubject,
} from "@/lib/hierarchy";
export type { DegreeInfo } from "@/lib/hierarchy";
