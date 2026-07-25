/**
 * Migration script: converts legacy subject-level JSON files into atomic
 * document-level JSON files (one file per document).
 *
 * Run: node scripts/migrate-to-atomic.mjs [--target ../metadata]
 *
 * Before:
 *   CSE/semester-4/DBMS.json  ← subject-level with sections.documents
 *
 * After:
 *   CSE/semester-4/DBMS/
 *     dbms-unit-1-notes.json  ← atomic
 *     dbms-paper-1.json       ← atomic
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Default target is the website root (where scripts/ lives)
const DEFAULT_TARGET = path.resolve(__dirname, "..");
// Accept --target argument for external metadata repo
const targetArg = process.argv.find((a) => a.startsWith("--target="));
const METADATA_DIR = targetArg ? path.resolve(targetArg.split("=")[1]) : DEFAULT_TARGET;

console.log("Metadata directory:", METADATA_DIR);

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/--+/g, "-")
    .substring(0, 60);
}

function scanAllJsonFiles(dir) {
  const files = [];
  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "examples") continue;
        scan(fullPath);
      } else if (entry.name.endsWith(".json") && !entry.name.endsWith(".bak")) {
        files.push(fullPath);
      }
    }
  }
  scan(dir);
  return files;
}

function isSubjectLevel(data) {
  return data.subject && data.branch && data.semester !== undefined && data.sections;
}

function getSubjectFolder(filePath) {
  // e.g., .../CSE/semester-4/DBMS.json → .../CSE/semester-4/DBMS/
  const dir = path.dirname(filePath);
  const base = path.basename(filePath, ".json");
  const parentDir = path.basename(dir);
  // Only create subject folders if file is directly in semester-* directory
  if (parentDir.startsWith("semester-")) {
    return path.join(dir, base);
  }
  return null; // Already in a subfolder
}

function migrate() {
  const allFiles = scanAllJsonFiles(METADATA_DIR);
  console.log(`Found ${allFiles.length} JSON files`);

  let subjectFilesConverted = 0;
  let atomicDocsWritten = 0;

  for (const filePath of allFiles) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);

      if (isSubjectLevel(data)) {
        // LEGACY subject-level file: explode into atomic docs
        // Determine target folder based on whether file is in semester-* dir or already in subfolder
        const dir = path.dirname(filePath);
        const base = path.basename(filePath, ".json");
        const parentDir = path.basename(dir);
        
        let subjectFolderPath;
        if (parentDir.startsWith("semester-")) {
          // e.g., .../CSE/semester-4/DBMS.json → .../CSE/semester-4/DBMS/
          subjectFolderPath = path.join(dir, base);
        } else {
          // Already in a subfolder — keep it there
          subjectFolderPath = dir;
        }

        console.log(`\nConverting: ${path.relative(METADATA_DIR, filePath)}`);
        console.log(`  → Target folder: ${path.relative(METADATA_DIR, subjectFolderPath)}`);

        // Create subject folder
        fs.mkdirSync(subjectFolderPath, { recursive: true });

        const { subject, branch, semester, sections } = data;
        let docCount = 0;

        for (const [sectionKey, sectionData] of Object.entries(sections || {})) {
          if (!sectionData || !sectionData.documents) continue;

          for (const doc of sectionData.documents) {
            if (!doc.title || !doc.url) continue;

            docCount++;
            const slug = slugify(doc.title);
            const atomicPath = path.join(subjectFolderPath, `${slug}.json`);

            const atomicDoc = {
              title: doc.title,
              url: doc.url,
              tags: doc.tags || [],
              subject: subject,
              branch: branch,
              semester: semester,
              section: sectionKey,
              chapters: sectionData.chapters || [],
              fileSize: doc.fileSize || 0,
              contributor: doc.contributor || "",
              uploadedAt: doc.uploadedAt || "",
              description: doc.description || `${subject} — ${sectionKey.replace("section-", "Section ").toUpperCase()}`,
              language: doc.language || "English",
              pages: doc.pages,
              downloads: doc.downloads,
            };

            if (!fs.existsSync(atomicPath)) {
              fs.writeFileSync(atomicPath, JSON.stringify(atomicDoc, null, 2) + "\n", "utf-8");
              console.log(`  ✓ ${slug}.json`);
              atomicDocsWritten++;
            } else {
              console.log(`  ~ ${slug}.json (already exists, skipping)`);
            }
          }
        }

        if (docCount > 0) {
          // Rename original file to .bak 
          const bakPath = filePath + ".bak";
          fs.renameSync(filePath, bakPath);
          console.log(`  → Original renamed to ${path.basename(bakPath)}`);
          subjectFilesConverted++;
        }
      } else if (data.sections && data.id) {
        // Existing atomic file with nested sections (e.g., cse-s5-ai-notes-1.json)
        const dir = path.dirname(filePath);
        console.log(`\nFlattening: ${path.relative(METADATA_DIR, filePath)}`);

        const { subject, branch, semester, sections } = data;
        let docCount = 0;

        for (const [sectionKey, sectionData] of Object.entries(sections || {})) {
          if (!sectionData || !sectionData.documents) continue;

          for (const doc of sectionData.documents) {
            if (!doc.title || !doc.url) continue;

            docCount++;
            const slug = slugify(doc.title);
            const atomicPath = path.join(dir, `${slug}.json`);

            const atomicDoc = {
              title: doc.title,
              url: doc.url,
              tags: doc.tags || [],
              subject: subject || data.subject || data.title,
              branch: branch,
              semester: semester,
              section: sectionKey,
              chapters: sectionData.chapters || [],
              fileSize: doc.fileSize || 0,
              contributor: doc.contributor || "",
              uploadedAt: doc.uploadedAt || "",
              description: doc.description || "",
              language: doc.language || "English",
              pages: doc.pages,
              downloads: doc.downloads,
            };

            if (!fs.existsSync(atomicPath)) {
              fs.writeFileSync(atomicPath, JSON.stringify(atomicDoc, null, 2) + "\n", "utf-8");
              console.log(`  ✓ ${slug}.json`);
              atomicDocsWritten++;
            } else {
              console.log(`  ~ ${slug}.json (already exists, skipping)`);
            }
          }
        }

        if (docCount > 0) {
          fs.unlinkSync(filePath);
          console.log(`  → Removed old ${path.basename(filePath)}`);
          subjectFilesConverted++;
        }
      }
      // else: already atomic or syllabus file — skip
    } catch (e) {
      console.warn(`Error processing ${path.relative(METADATA_DIR, filePath)}: ${e.message}`);
    }
  }

  // Remove all .bak files
  const bakFiles = scanAllJsonFiles(METADATA_DIR).filter(f => f.endsWith(".bak"));
  for (const bak of bakFiles) {
    fs.unlinkSync(bak);
    console.log(`Cleaned up: ${bak}`);
  }

  const allAfter = scanAllJsonFiles(METADATA_DIR);
  console.log("\n=== Migration Complete ===");
  console.log(`Files processed: ${subjectFilesConverted}`);
  console.log(`Atomic documents written: ${atomicDocsWritten}`);
  console.log(`Total JSON files after: ${allAfter.length}`);
  console.log("Done.");
}

migrate();
