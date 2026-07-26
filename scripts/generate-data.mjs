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

const BRANCH_MAP = {
  cse: "CSE",
  ece: "ECE",
  ee: "EE",
  me: "ME",
  ce: "CE",
};

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
 * E.g., "jammu-university/btech/cse/semester-4/..." → "jammu-university"
 */
function inferSource(filePath, cloneRoot) {
  const relative = path.relative(cloneRoot, filePath);
  const segments = relative.split(path.sep).filter(Boolean);
  return segments[0] || "unknown";
}

/**
 * Infer branch, semester, and subject from a file path for jammu-university.
 * Path pattern: .../jammu-university/btech/{branch}/semester-{N}/{subject-folder}/{file}.json
 */
function inferFromPath(filePath, cloneRoot) {
  const relative = path.relative(cloneRoot, filePath);
  const segments = relative.split(path.sep).filter(Boolean);

  let branch = "CSE";
  let semester = 1;
  let subject = "Unknown";

  // jammu-university path: [source, degree, branch, semester-folder, subject-folder, file]
  if (segments.length >= 5) {
    const branchSeg = segments[2]?.toLowerCase();
    branch = BRANCH_MAP[branchSeg] || branchSeg?.toUpperCase() || "CSE";

    const semSeg = segments[3] || "";
    const semMatch = semSeg.match(/semester-(\d+)/i);
    if (semMatch) semester = parseInt(semMatch[1], 10);

    // Subject = second-to-last segment (the folder name)
    const subjectSeg = segments[segments.length - 2] || "";
    subject = subjectSeg
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return { branch, semester, subject };
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
  let idCounter = 1;

  for (const filePath of jsonFiles) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      const source = inferSource(filePath, cloneRoot);

      // --- Format 1: Simplified array ---
      if (isArrayFormat(data)) {
        const { branch, semester, subject } = inferFromPath(filePath, cloneRoot);

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
            description: `${subject} — ${doc.type || "mixed"}`,
            url: doc.url,
            thumbnailUrl: doc.thumbnailUrl || getThumbnailUrl(doc.url),
            fileType,
            fileSize: doc.fileSize || 0,
            branch,
            semester,
            subject,
            type: doc.type || "mixed",
            contributor: doc.contributor || "",
            uploadedAt: doc.uploadedAt || "",
            source,
          });
        }
      }
      // --- Format 2: Simplified single doc ---
      else if (isSimplifiedDoc(data)) {
        const { branch, semester, subject } = inferFromPath(filePath, cloneRoot);
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
          fileSize: data.fileSize || 0,
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

        docs.push({
          id,
          title: data.title,
          description: data.description || `${data.subject || ""} — ${data.section || "mixed"}`,
          url: data.url,
          thumbnailUrl: data.thumbnailUrl || getThumbnailUrl(data.url),
          fileType,
          fileSize: data.fileSize || 0,
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
                fileSize: doc.fileSize || 0,
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

  return docs;
}

function generateFile(docs) {
  const json = JSON.stringify(docs, null, 2);
  const lines = [
    "// Auto-generated at build time. Do not edit.",
    "// Generated by scripts/generate-data.mjs from julearning/metadata",
    "",
    'import type { Document } from "@/lib/types";',
    "",
    "export const documents = " + json + " as Document[];",
    "",
    "export function getUniqueBranches(): string[] {",
    "  return [...new Set(documents.map((d: Document) => d.branch).filter(Boolean))] as string[];",
    "}",
    "",
    "export function getUniqueSubjects(branch?: string): string[] {",
    "  const filtered = branch ? documents.filter((d: Document) => d.branch === branch) : documents;",
    "  return [...new Set(filtered.map((d: Document) => d.subject))].sort();",
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

  const docs = flattenDocuments(jsonFiles, CLONE_DIR);
  console.log(`Flattened into ${docs.length} documents`);

  const content = generateFile(docs);
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, content, "utf-8");

  console.log("Generated " + OUTPUT_FILE);
} finally {
  cleanup();
}
