export interface Document {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  fileType: "pdf" | "docx";
  fileSize: number;
  /** Folder-derived hierarchy — only for jammu-university documents */
  branch: Branch | null;
  semester: number | null;
  subject: string | null;
  /** Single document type — handwritten, digital, pyq (optional: backward compat) */
  type?: DocType;
  /** Backward-compat: old data has tags[] instead of type */
  tags?: string[];
  contributor?: string;
  uploadedAt?: string;
  description?: string;
  /** Source identifier: "jammu-university", "open-textbook-library", etc. */
  source: string;
  /** Old fields kept optional for data compatibility */
  section?: string;
  chapters?: string[];
  language?: string;
  pages?: number;
  downloads?: number;
  /** Folder path within the source, e.g. "btech/cse/semester-4" */
  sourcePath?: string;
}

export type Branch = "CSE" | "ECE" | "EE" | "ME" | "CE";

export type DocType = "handwritten" | "digital" | "pyq" | "assignment" | "lab-manual" | "syllabus" | "reference-book" | "project-report" | "mixed" | "other";

export type SubjectMetadata = {
  subject: string;
  branch: string;
  semester: number;
  documents: RawDocument[];
};

export type RawDocument = {
  title: string;
  url: string;
  type?: DocType;
  tags?: string[];
  fileSize?: number;
  description?: string;
  fileType?: string;
  uploadedAt?: string;
  contributor?: string;
};

export type FilterState = {
  query: string;
  branch: Branch | null;
  semester: number | null;
  subject: string | null;
  types: DocType[];
  sources: string[];
  sort: "relevance" | "newest" | "oldest" | "name" | "size";
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIdFromUrl(url: string): string | null {
  const match = url.match(/\/file\/d\/([^/]+)\//);
  return match ? match[1] : null;
}

export function getThumbnailUrl(url: string): string {
  const fileId = getFileIdFromUrl(url);
  if (!fileId) return "";
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}

export function getPreviewUrl(url: string): string {
  const fileId = getFileIdFromUrl(url);
  if (!fileId) return url;
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export const TYPE_LABELS: Record<string, string> = {
  handwritten: "Handwritten",
  digital: "Digital Notes",
  pyq: "PYQ",
  assignment: "Assignment",
  "lab-manual": "Lab Manual",
  syllabus: "Syllabus",
  "reference-book": "Ref Book",
  "project-report": "Project",
  mixed: "Mixed",
  other: "Other",
  notes: "Notes",
  typed: "Typed",
  "past-year": "Past Year",
  pyqs: "PYQs",
};
