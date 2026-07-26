/**
 * Build-time data generator.
 *
 * Clones julearning/metadata from GitHub, reads ALL JSON files (both atomic
 * document-level files and legacy subject-level files), flattens into
 * individual Document entries, and generates src/data/generated-documents.ts.
 *
 * Two formats are supported:
 *
 * 1. ATOMIC (preferred) — one file per document:
 *    {
 *      "title": "...",
 *      "url": "https://drive.google.com/file/d/.../view",
 *      "tags": ["notes", "handwritten"],
 *      "subject": "DBMS",
 *      "branch": "CSE",
 *      "semester": 4,
 *      "section": "section-a",
 *      "chapters": ["Chapter 1", "Chapter 2"],
 *      "fileSize": 2048576,
 *      "contributor": "aryanbatra",
 *      "uploadedAt": "2026-07-25",
 *      ...
 *    }
 *
 * 2. LEGACY subject-level — one file per subject with sections array:
 *    {
 *      "subject": "DBMS",
 *      "branch": "CSE",
 *      "semester": 4,
 *      "sections": { "section-a": { chapters: [], documents: [...] }, ... }
 *    }
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const PROJECT_ROOT = process.cwd();
const OUTPUT_FILE = path.resolve(PROJECT_ROOT, "src/data/generated-documents.ts");
const METADATA_REPO = "https://github.com/julearning/metadata.git";
const CLONE_DIR = path.resolve(os.tmpdir(), "julearning-metadata-" + Date.now());

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

function isAtomicDoc(data) {
  // An atomic document has a 'title' and 'url' at the top level,
  // and does NOT have a 'sections' key.
  return data.title && data.url && !data.sections;
}

function scanDir(dir) {
  const allFiles = [];

  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        // Skip .git and node_modules
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
 * Uses the first directory segment as the source.
 * E.g., "jammu-university/btech/cse/semester-4/..." → "jammu-university"
 *        "open-textbook-library/calculus/..." → "open-textbook-library"
 */
function inferSource(filePath, cloneRoot) {
  const relative = path.relative(cloneRoot, filePath);
  const segments = relative.split(path.sep).filter(Boolean);
  return segments[0] || "unknown";
}

function flattenDocuments(jsonFiles, cloneRoot) {
  const docs = [];
  let idCounter = 1;

  for (const filePath of jsonFiles) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      const source = inferSource(filePath, cloneRoot);

      if (isAtomicDoc(data)) {
        // --- ATOMIC format: one file = one document ---
        const fileType = data.fileType || inferFileType(data.url);
        const id = `doc-${String(idCounter).padStart(4, "0")}`;
        idCounter++;

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
          section: data.section || "mixed",
          tags: data.tags || [],
          chapters: data.chapters || [],
          contributor: data.contributor || "",
          uploadedAt: data.uploadedAt || new Date().toISOString(),
          language: data.language || "English",
          pages: data.pages,
          downloads: data.downloads,
          source,
        });
      } else if (data.subject && data.branch && data.semester !== undefined) {
        // --- LEGACY format: subject-level with sections ---
        const branch = data.branch;
        const semester = data.semester;
        const subject = data.subject;
        const sections = data.sections || {};

        for (const [sectionKey, sectionData] of Object.entries(sections)) {
          if (sectionData && sectionData.documents) {
            for (const doc of sectionData.documents) {
              if (!doc.title || !doc.url) {
                console.warn("Skipping doc in " + filePath + ": missing title or url");
                continue;
              }

              const id = `doc-${String(idCounter).padStart(4, "0")}`;
              idCounter++;

              const fileType = doc.fileType || inferFileType(doc.url);
              const chapters = sections[sectionKey]?.chapters || [];

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
                section: sectionKey,
                tags: doc.tags || [],
                chapters,
                contributor: doc.contributor || "",
                uploadedAt: doc.uploadedAt || new Date().toISOString(),
                language: doc.language || "English",
                pages: doc.pages,
                downloads: doc.downloads,
                source,
              });
            }
          }
        }
      } else {
        // Skip syllabus files and other non-document JSON files
        console.log("Skipping " + filePath + ": not a document or subject file");
      }
    } catch (e) {
      console.warn("Error reading " + filePath + ": " + e.message);
    }
  }

  return docs;
}

function generateFile(docs) {
  const json = JSON.stringify(docs, null, 2);
  // Use `as Document[]` type assertion (not `: Document[]` annotation)
  // to avoid TypeScript's "union type too complex" error on large arrays.
  // A type assertion skips the structural compatibility check.
  const lines = [
    "// Auto-generated at build time. Do not edit.",
    "// Generated by scripts/generate-data.mjs from julearning/metadata",
    "",
    'import type { Document } from "@/lib/types";',
    "",
    "export const documents = " + json + " as Document[];",
    "",
    "export function getUniqueBranches(): string[] {",
    '  return [...new Set(documents.map((d: Document) => d.branch))];',
    "}",
    "",
    "export function getUniqueSubjects(branch?: string): string[] {",
    "  const filtered = branch ? documents.filter((d: Document) => d.branch === branch) : documents;",
    "  return [...new Set(filtered.map((d: Document) => d.subject))].sort();",
    "}",
    "",
    "export function getUniqueSemesters(branch?: string): number[] {",
    "  const filtered = branch ? documents.filter((d: Document) => d.branch === branch) : documents;",
    "  return [...new Set(filtered.map((d: Document) => d.semester))].sort((a: number, b: number) => a - b);",
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
