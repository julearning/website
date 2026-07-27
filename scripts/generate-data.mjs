/**
 * Build-time data generator.
 *
 * Clones julearning/metadata from GitHub, reads ALL JSON files in all
 * supported formats, flattens into individual Document entries, and
 * generates src/data/generated-documents.ts.
 *
 * Three formats are supported:
 *
 * 1. SIMPLIFIED (preferred) — array per subject file:
 *    [{
 *      "title": "...",
 *      "url": "https://drive.google.com/file/d/.../view",
 *      "type": "handwritten",
 *      "contributor": "aryanbatras",
 *      "uploadedAt": "2026-07-26"
 *    }]
 *    → branch/semester/subject inferred from folder path
 *    → tags derived from type field
 *
 * 2. ATOMIC (legacy) — one file per document with all fields:
 *    { "title": "...", "url": "...", "tags": [...], "subject": "...", "branch": "CSE", ... }
 *
 * 3. SUBJECT-LEVEL (legacy) — one file per subject with sections array:
 *    { "subject": "DBMS", "branch": "CSE", "semester": 4,
 *      "sections": { "section-a": { chapters: [], documents: [...] }, ... } }
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const PROJECT_ROOT = process.cwd();
const OUTPUT_FILE = path.resolve(PROJECT_ROOT, "src/data/generated-documents.ts");
const METADATA_REPO = "https://github.com/julearning/metadata.git";
const CLONE_DIR = path.resolve(os.tmpdir(), "julearning-metadata-" + Date.now());

// No hardcoded maps. Everything is derived from the folder structure.
// Branch folder names (e.g., "cse", "ece") are used as-is (uppercased).

function cloneMetadata() {
  console.log("Cloning julearning/metadata...");
  fs.mkdirSync(CLONE_DIR, { recursive: true });
  try {
    execSync(`git clone --depth 1 ${METADATA_REPO} "${CLONE_DIR}"`, {
      stdio: "pipe",
      timeout: 60_000,
    });
    console.log("Metadata cloned.");
  } catch (err) {
    console.error("Failed to clone metadata repository:", err.message);
    process.exit(1);
  }
}

function getFileIdFromUrl(url) {
  const match = url.match(/\/file\/d\/([^/]+)\//);
  return match ? match[1] : null;
}

function getThumbnailUrl(url) {
  const fileId = getFileIdFromUrl(url);
  if (!fileId) return "";
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}

function inferFileType(url) {
  if (url.includes("document/d/") || url.endsWith(".docx")) return "docx";
  return "pdf";
}

/** Check if a JSON file is a source metadata file (name/description/url format) */
function isSourceMeta(data) {
  return data && typeof data === "object" && !Array.isArray(data) && data.name && data.description && data.url;
}

/** Check if a URL is a Google Drive/Docs link with a file ID we can thumbnail */
function isDriveUrl(url) {
  return /\/(?:file|document|spreadsheets|presentation)\/d\/([^/]+)\//.test(url);
}

function scanDir(dir) {
  const allFiles = [];

  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
        scan(fullPath);
      } else if (entry.name.endsWith(".json") && !entry.name.startsWith(".")) {
        allFiles.push(fullPath);
      }
    }
  }

  scan(dir);
  return allFiles;
}

/**
 * Extract the source name from a file path relative to the clone root.
 * - "jammu-university/btech/cse/..." → "jammu-university"
 * - "other-sources/wikibooks/..."     → "wikibooks"
 * - "other-sources/foo/..."           → "foo"
 */
function inferSource(filePath, cloneRoot) {
  const relative = path.relative(cloneRoot, filePath);
  const segments = relative.split(path.sep).filter(Boolean);
  if (!segments.length) return "unknown";
  // Folders under other-sources/ use the subfolder as the source name
  if (segments[0] === "other-sources" && segments.length > 1) {
    // If it's a file directly in other-sources/ (e.g. wikibooks.json), strip .json
    if (segments.length === 2 && segments[1].endsWith(".json")) {
      return segments[1].replace(/\.json$/, "");
    }
    return segments[1];
  }
  return segments[0];
}

/**
 * Infer degree, branch, semester, and subject from a file path for jammu-university.
 * Path pattern: .../jammu-university/{degree}/{branch}/semester-{N}/{subject-folder}/{file}.json
 *
 * NOTHING is hardcoded. The folder structure IS the source of truth.
 *   segments[0] = source (e.g., "jammu-university")
 *   segments[1] = degree (e.g., "btech", "mtech")
 *   segments[2] = branch (e.g., "cse", "ece")
 *   segments[3] = semester (e.g., "semester-1")
 *   segments[4] = subject folder
 *   segments[5+] = filename(s)
 */
function inferFromPath(filePath, cloneRoot) {
  const relative = path.relative(cloneRoot, filePath);
  const segments = relative.split(path.sep).filter(Boolean);

  let degree = null;
  let branch = null;
  let semester = null;
  let subject = null;

  if (segments.length >= 5) {
    // Degree = segments[1] — folder name like "btech", "mtech", "bca"
    degree = segments[1] || null;

    // Branch = segments[2] — folder name like "cse", "ece"
    const branchSeg = segments[2] || "";
    branch = branchSeg.toUpperCase() || null;

    // Semester = segments[3] — folder name like "semester-1"
    const semSeg = segments[3] || "";
    const semMatch = semSeg.match(/(?:sem(?:ester)?[-]?)(\d+)/i);
    if (semMatch) semester = parseInt(semMatch[1], 10);

    // Subject = second-to-last segment (the folder name)
    const subjectSeg = segments[segments.length - 2] || "";
    subject = subjectSeg
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) || null;
  }

  return { degree, branch, semester, subject };
}

/** Check if data is a simplified array format: [{title, url, type, ...}] */
function isArrayFormat(data) {
  return Array.isArray(data) && data.length > 0 && data[0].title && data[0].url;
}

/** Check if data is a simplified single doc (minimal fields, no branch/tags directly) */
function isSimplifiedDoc(data) {
  return data.title && data.url && !data.branch && !data.subject && !data.tags && !data.sections;
}

/** Check if data is legacy atomic doc (has title, url, and extra fields like branch/tags) */
function isLegacyAtomic(data) {
  return data.title && data.url && !data.sections && (data.branch || data.tags || data.subject);
}

/** Check if data is legacy subject-level format */
function isLegacySubject(data) {
  return data.subject && data.branch && data.semester !== undefined && data.sections;
}

function flattenDocuments(jsonFiles, cloneRoot) {
  const docs = [];
  const sources = [];
  const sourceThumbnailMap = new Map();
  let idCounter = 1;

  for (const filePath of jsonFiles) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      const source = inferSource(filePath, cloneRoot);

      // --- Format 0: Source metadata file (e.g. wikibooks.json in other-sources/) ---
      if (isSourceMeta(data)) {
        const thumbnailUrl = data.thumbnailUrl || "";
        sources.push({
          id: source,
          name: data.name,
          description: data.description,
          url: data.url,
          thumbnailUrl,
        });
        // Track source thumbnail for backfilling document thumbnails
        if (thumbnailUrl) {
          sourceThumbnailMap.set(source, thumbnailUrl);
        }
        continue;
      }

      // --- Format 1: Simplified array ---
      if (isArrayFormat(data)) {
        // For JU sources: infer degree/branch/semester/subject from folder path
        // For non-JU sources: leave them empty (just title, description, url)
        const hasPathContext = source === "jammu-university";
        const { degree, branch, semester, subject } = hasPathContext
          ? inferFromPath(filePath, cloneRoot)
          : { degree: null, branch: null, semester: null, subject: null };

        for (const doc of data) {
          if (!doc.title || !doc.url) {
            console.warn("  Skipping doc in " + path.basename(filePath) + ": missing title or url");
            continue;
          }

          const id = `doc-${String(idCounter).padStart(4, "0")}`;
          idCounter++;
          const fileType = doc.fileType || inferFileType(doc.url);

          docs.push({
            id,
            title: doc.title,
            description: doc.description || "",
            url: doc.url,
            thumbnailUrl: doc.thumbnailUrl || "",
            fileType,
            degree,
            branch,
            semester,
            subject,
            type: doc.type || null,
            contributor: doc.contributor || null,
            uploadedAt: doc.uploadedAt || null,
            source,
          });
        }
      }
      // --- Format 2: Simplified single doc ---
      else if (isSimplifiedDoc(data)) {
        const { degree, branch, semester, subject } = inferFromPath(filePath, cloneRoot);
        const id = `doc-${String(idCounter).padStart(4, "0")}`;
        idCounter++;
        const fileType = data.fileType || inferFileType(data.url);

        docs.push({
          id,
          title: data.title,
          description: `${subject} — ${data.type || "mixed"}`,
          url: data.url,
          thumbnailUrl: data.thumbnailUrl || getThumbnailUrl(data.url),
          fileType,
          degree,
          branch,
          semester,
          subject,
          type: data.type || "mixed",
          contributor: data.contributor || "",
          uploadedAt: data.uploadedAt || "",
          source,
        });
      }
      // --- Format 3: Legacy atomic doc ---
      else if (isLegacyAtomic(data)) {
        const id = `doc-${String(idCounter).padStart(4, "0")}`;
        idCounter++;
        const fileType = data.fileType || inferFileType(data.url);
        // Also get degree from path for atomic docs
        const { degree: pathDegree } = inferFromPath(filePath, cloneRoot);

        docs.push({
          id,
          title: data.title,
          description: data.description || `${data.subject || ""} — ${data.section || "mixed"}`,
          url: data.url,
          thumbnailUrl: data.thumbnailUrl || getThumbnailUrl(data.url),
          fileType,
          degree: pathDegree,
          branch: data.branch,
          semester: data.semester,
          subject: data.subject,
          type: data.type || (data.tags && data.tags[0]) || "mixed",
          tags: data.tags || [],
          contributor: data.contributor || "",
          uploadedAt: data.uploadedAt || "",
          source,
        });
      }
      // --- Format 4: Legacy subject-level with sections ---
      else if (isLegacySubject(data)) {
        const branch = data.branch;
        const semester = data.semester;
        const subject = data.subject;
        const sections = data.sections || {};
        // Get degree from path for legacy subject-level docs
        const { degree } = inferFromPath(filePath, cloneRoot);

        for (const [sectionKey, sectionData] of Object.entries(sections)) {
          if (sectionData && sectionData.documents) {
            for (const doc of sectionData.documents) {
              if (!doc.title || !doc.url) {
                console.warn("  Skipping doc in " + filePath + ": missing title or url");
                continue;
              }

              const id = `doc-${String(idCounter).padStart(4, "0")}`;
              idCounter++;
              const fileType = doc.fileType || inferFileType(doc.url);

              docs.push({
                id,
                title: doc.title,
                description: doc.description || `${subject} — ${sectionKey.replace("section-", "Section ").toUpperCase()}`,
                url: doc.url,
                thumbnailUrl: doc.thumbnailUrl || getThumbnailUrl(doc.url),
                fileType,
              degree,
              branch,
              semester,
              subject,
                type: doc.type || (doc.tags && doc.tags[0]) || "mixed",
                tags: doc.tags || [],
                contributor: doc.contributor || "",
                uploadedAt: doc.uploadedAt || "",
                source,
              });
            }
          }
        }
      } else {
        console.log("  Skipping " + path.basename(filePath) + ": unrecognized format");
      }
    } catch (e) {
      console.warn("  Error reading " + path.basename(filePath) + ": " + e.message);
    }
  }

  // Backfill thumbnails for non-JU documents: use the source's thumbnail
  // (individual files from other sources use the source logo as their thumbnail)
  // For Google Drive links, dynamic thumbnail via getThumbnailUrl() works for any source
  for (const doc of docs) {
    if (doc.source !== "jammu-university" && !doc.thumbnailUrl) {
      // If it's a Google Drive link, the dynamic thumbnail works for any source
      if (isDriveUrl(doc.url)) {
        doc.thumbnailUrl = getThumbnailUrl(doc.url);
      } else {
        // Use the source's own thumbnail image as the document thumbnail
        doc.thumbnailUrl = sourceThumbnailMap.get(doc.source) || "";
      }
    }
  }

  return { docs, sources };
}

function generateFile({ docs, sources }) {
  const lines = [
    "// Auto-generated at build time. Do not edit.",
    "// Generated by scripts/generate-data.mjs from julearning/metadata",
    "",
    'import type { Document } from "@/lib/types";',
    "",
    "export const documents = " + JSON.stringify(docs, null, 2) + " as Document[];",
    "",
    "export interface SourceMeta {",
    '  id: string;',
    '  name: string;',
    '  description: string;',
    '  url: string;',
    '  thumbnailUrl?: string;',
    "}",
    "",
    "export const sources: SourceMeta[] = " + JSON.stringify(sources, null, 2) + ";",
    "",
    "export function getUniqueDegrees(): string[] {",
    "  return [...new Set(documents.map((d: Document) => d.degree).filter(Boolean))] as string[];",
    "}",
    "",
    "export function getUniqueBranches(degree?: string): string[] {",
    "  const filtered = degree ? documents.filter((d: Document) => d.degree === degree) : documents;",
    "  return [...new Set(filtered.map((d: Document) => d.branch).filter(Boolean))] as string[];",
    "}",
    "",
    "export function getUniqueSubjects(branch?: string): string[] {",
    "  const filtered = branch ? documents.filter((d: Document) => d.branch === branch) : documents;",
    "  return [...new Set(filtered.map((d: Document) => d.subject).filter((s): s is string => !!s))].sort();",
    "}",
    "",
    "export function getUniqueSemesters(branch?: string): number[] {",
    "  const filtered = branch ? documents.filter((d: Document) => d.branch === branch) : documents;",
    "  return [...new Set(filtered.map((d: Document) => d.semester).filter((s): s is number => s != null))].sort((a: number, b: number) => a - b);",
    "}",
    "",
    "export function getDocumentsByBranch(branch: string): Document[] {",
    "  return documents.filter((d: Document) => d.branch === branch);",
    "}",
    "",
    "export function getDocumentsByDegree(degree: string): Document[] {",
    "  return documents.filter((d: Document) => d.degree === degree);",
    "}",
    "",
  ];
  return lines.join("\n");
}

function cleanup() {
  if (fs.existsSync(CLONE_DIR)) {
    fs.rmSync(CLONE_DIR, { recursive: true, force: true });
    console.log("Temp metadata cleaned up.");
  }
}

try {
  cloneMetadata();

  console.log("Scanning for JSON files...");
  const jsonFiles = scanDir(CLONE_DIR);
  console.log(`Found ${jsonFiles.length} JSON files`);

  const result = flattenDocuments(jsonFiles, CLONE_DIR);
  console.log(`Flattened into ${result.docs.length} documents from ${result.sources.length} sources`);

  const content = generateFile(result);
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, content, "utf-8");

  console.log("Generated " + OUTPUT_FILE);
} finally {
  cleanup();
}
