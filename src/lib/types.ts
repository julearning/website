export interface Document {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  fileType: "pdf" | "docx";
  fileSize: number;
  branch: Branch;
  semester: number;
  subject: string;
  section?: "section-a" | "section-b" | "mixed";
  tags: string[];
  chapters: string[];
  contributor?: string;
  uploadedAt?: string;
  language?: string;
  pages?: number;
  downloads?: number;
}

export type Branch = "CSE" | "ECE" | "EE" | "ME" | "CE";

export type SubjectMetadata = {
  subject: string;
  branch: string;
  semester: number;
  sections: {
    "section-a": SectionData;
    "section-b": SectionData;
    mixed: { documents: RawDocument[] };
  };
};

export type SectionData = {
  chapters: string[];
  documents: RawDocument[];
};

export type RawDocument = {
  title: string;
  url: string;
  tags: string[];
  fileSize: number;
  description?: string;
  fileType?: string;
  uploadedAt?: string;
  contributor?: string;
  language?: string;
  pages?: number;
  downloads?: number;
};

export type FilterState = {
  query: string;
  branch: Branch | null;
  semester: number | null;
  subject: string | null;
  tags: string[];
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
