export interface Document {
  id: string;
  title: string;
  description: string;
  url: string;
  fileType: "pdf" | "docx" | "pptx" | "image";
  fileSize: number;

  // Taxonomy
  branch: Branch;
  degree: Degree;
  semester: Semester;
  subject: string;
  topic?: string;

  // Classification
  tags: DocumentTag[];

  // Metadata
  contributor: string;
  uploadedAt: string;
  verified: boolean;
  downloads?: number;
}

export type Branch = "CSE" | "ECE" | "EE" | "ME" | "CE";
export type Degree = "B.Tech";
export type Semester = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type DocumentTag =
  | "notes"
  | "pyq"
  | "assignment"
  | "lab-manual"
  | "syllabus"
  | "handwritten"
  | "typed"
  | "reference-book"
  | "project-report";

export interface Subject {
  code: string;
  name: string;
  branch: Branch;
  semesters: Semester[];
}

export interface BranchInfo {
  id: Branch;
  name: string;
  description: string;
  icon: string;
}

export interface FilterState {
  query: string;
  branch: Branch | null;
  semester: Semester | null;
  subject: string | null;
  tags: DocumentTag[];
  fileType: string | null;
  sort: "relevance" | "newest" | "oldest" | "name" | "size";
}

export const BRANCHES: BranchInfo[] = [
  { id: "CSE", name: "Computer Science & Engineering", description: "Software, algorithms, AI, and computing systems", icon: "💻" },
  { id: "ECE", name: "Electronics & Communication", description: "Circuits, signals, VLSI, and communication systems", icon: "📡" },
  { id: "EE", name: "Electrical Engineering", description: "Power systems, machines, and energy", icon: "⚡" },
  { id: "ME", name: "Mechanical Engineering", description: "Design, thermal, manufacturing, and mechanics", icon: "⚙️" },
  { id: "CE", name: "Civil Engineering", description: "Structures, materials, construction, and environment", icon: "🏗️" },
];

export const SEMESTERS: Semester[] = [1, 2, 3, 4, 5, 6, 7, 8];

export const DOCUMENT_TAGS: { id: DocumentTag; label: string }[] = [
  { id: "notes", label: "Notes" },
  { id: "pyq", label: "Previous Year Questions" },
  { id: "assignment", label: "Assignments" },
  { id: "lab-manual", label: "Lab Manuals" },
  { id: "syllabus", label: "Syllabus" },
  { id: "handwritten", label: "Handwritten" },
  { id: "typed", label: "Typed" },
  { id: "reference-book", label: "Reference Books" },
  { id: "project-report", label: "Project Reports" },
];

export const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: "file-text",
  docx: "file-text",
  pptx: "presentation",
  image: "image",
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
