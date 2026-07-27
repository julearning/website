/**
 * Degree-aware hierarchy helpers — FULLY DATA-DRIVEN.
 *
 * NOTHING is hardcoded. Everything comes from the document data,
 * which is itself generated from the folder structure in the
 * julearning/metadata repository.
 *
 * Folder structure: jammu-university/{degree}/{branch}/semester-{N}/{subject}/
 *
 * If a contributor adds a new folder like "mtech/it/sem-3/", the website
 * will automatically show the new degree, branch, semester, and subjects.
 */

import { documents } from "@/data/generated-documents";
import type { Document } from "@/lib/types";

export interface DegreeInfo {
  id: string;   // Folder name: "btech", "mtech", "bca"
  name: string; // Display name: "B.Tech", "M.Tech", "BCA"
  fullName: string;
  description: string;
}

/** Known degree display formatter — maps folder name to display name */
const DEGREE_DISPLAY: Record<string, { name: string; fullName: string }> = {
  btech: { name: "B.Tech", fullName: "Bachelor of Technology" },
  mtech: { name: "M.Tech", fullName: "Master of Technology" },
  bca: { name: "BCA", fullName: "Bachelor of Computer Applications" },
  mca: { name: "MCA", fullName: "Master of Computer Applications" },
};

// ─── Core Helpers ───────────────────────────────────────────────────

/**
 * Get all curriculum documents (those from jammu-university with hierarchy data).
 */
function getCurriculumDocs(): Document[] {
  return documents.filter((d) => d.source === "jammu-university" && d.degree != null);
}

/**
 * Get all available degrees directly from the document data.
 */
export function getAllDegrees(): DegreeInfo[] {
  const degreeSet = new Set<string>();
  for (const doc of getCurriculumDocs()) {
    if (doc.degree) degreeSet.add(doc.degree);
  }
  return Array.from(degreeSet).sort().map((id) => {
    const display = DEGREE_DISPLAY[id];
    return {
      id,
      name: display?.name || id.toUpperCase(),
      fullName: display?.fullName || id.toUpperCase(),
      description: `Study materials for ${display?.name || id.toUpperCase()}.`,
    };
  });
}

/**
 * Get branches for a given degree, directly from document data.
 */
export function getBranchesByDegree(degreeId: string): string[] {
  const branchSet = new Set<string>();
  for (const doc of getCurriculumDocs()) {
    if (doc.degree === degreeId && doc.branch) {
      branchSet.add(doc.branch);
    }
  }
  return Array.from(branchSet).sort();
}

/**
 * Get semesters for a given degree and branch, directly from document data.
 */
export function getSemestersByBranch(degreeId: string, branch: string): number[] {
  const semesterSet = new Set<number>();
  for (const doc of getCurriculumDocs()) {
    if (doc.degree === degreeId && doc.branch === branch && doc.semester != null) {
      semesterSet.add(doc.semester);
    }
  }
  return Array.from(semesterSet).sort((a, b) => a - b);
}

/**
 * Get subjects for a given degree, branch, and semester.
 * Filters out semester-level catch-all subjects (e.g., "Semester 4") and "Unknown".
 */
export function getSubjectsBySemester(
  degreeId: string,
  branch: string,
  semester: number,
): string[] {
  const subjectSet = new Set<string>();
  for (const doc of getCurriculumDocs()) {
    if (
      doc.degree === degreeId &&
      doc.branch === branch &&
      doc.semester === semester &&
      doc.subject &&
      !isSemesterLevelSubject(doc.subject)
    ) {
      subjectSet.add(doc.subject);
    }
  }
  return Array.from(subjectSet).sort((a, b) => a.localeCompare(b));
}

/**
 * Check if a subject name is a semester-level catch-all (not a real subject).
 */
function isSemesterLevelSubject(subject: string): boolean {
  return /^(sem(?:ester)?\s*\d+|unknown|uncategorized)$/i.test(subject.trim());
}

/**
 * Get document types available for a specific subject.
 */
export function getTypesForSubject(
  degreeId: string,
  branch: string,
  semester: number,
  subject: string,
): string[] {
  const typeSet = new Set<string>();
  for (const doc of getCurriculumDocs()) {
    if (
      doc.degree === degreeId &&
      doc.branch === branch &&
      doc.semester === semester &&
      doc.subject === subject &&
      doc.type
    ) {
      typeSet.add(doc.type);
    }
  }
  return Array.from(typeSet).sort();
}

/**
 * Count documents matching the given criteria.
 */
export function getDocumentCount(
  degreeId?: string | null,
  branch?: string | null,
  semester?: number | null,
  subject?: string | null,
): number {
  let filtered = documents;
  if (degreeId) filtered = filtered.filter((d) => d.degree === degreeId);
  if (branch) filtered = filtered.filter((d) => d.branch === branch);
  if (semester != null) filtered = filtered.filter((d) => d.semester === semester);
  if (subject) filtered = filtered.filter((d) => d.subject === subject);
  return filtered.length;
}

/**
 * Get the degree ID for a given branch by looking at the data.
 */
export function getDegreeForBranch(branch: string): string | null {
  for (const doc of getCurriculumDocs()) {
    if (doc.branch === branch && doc.degree) return doc.degree;
  }
  return null;
}
