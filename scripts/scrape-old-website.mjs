/**
 * Scrape old website (e-papers4u.blueocean5.com) for curriculum data.
 *
 * Crawls all branches → semesters → subjects and creates
 * the metadata JSON structure for julearning/metadata.
 *
 * Usage: node scripts/scrape-old-website.mjs
 * Output: ../metadata/ directory with new subject-level JSONs
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const BASE = "http://e-papers4u.blueocean5.com";

const BRANCHES = {
  cse: "Computer Science Engineering",
  civil: "Civil Engineering",
  mech: "Mechanical Engineering",
  ee: "Electrical Engineering",
  enc: "Electronics & Communication Engineering",
};

const BRANCH_SLUG_MAP = {
  cse: "cse",
  civil: "ce",
  mech: "me",
  ee: "ee",
  enc: "ece",
};

const METADATA_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../../metadata",
);

function fetchUrl(url) {
  try {
    const buf = execSync(
      `curl -s -L --connect-timeout 10 --max-time 15 "${url}"`,
      { encoding: "utf-8", timeout: 20000 },
    );
    return buf;
  } catch {
    return "";
  }
}

function extractSubjects(html) {
  const subjects = [];
  // HTML pattern: href = 'papers_content/stream/sem/Subject/Subject.html'
  // Note: spaces around = and single quotes
  const regex = /href\s*=\s*'([^']*papers_content\/[^']+\.html)'[^>]*>([^<]+)</gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const name = match[2].trim();
    if (name && name !== "Back" && !name.includes("Subjects")) {
      subjects.push(name);
    }
  }
  return [...new Set(subjects)];
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/--+/g, "-");
}

function getSubjectSlug(name) {
  const special = {
    "OOP Using Cpp": "oop-using-cpp",
    "C++": "cpp",
    "C#": "c-sharp",
    ".NET": "dot-net",
    "E.M. Theory": "em-theory",
    "E.M.I.": "emi",
    "Mathematics-III": "mathematics-3",
    "Mathematics-IV": "mathematics-4",
    "Mathematics-I": "mathematics-1",
    "Mathematics-II": "mathematics-2",
  };
  if (special[name]) return special[name];
  return slugify(name);
}

async function scrapeAll() {
  console.log("Scraping old website for curriculum data...\n");

  const results = {};

  for (const [stream, branchName] of Object.entries(BRANCHES)) {
    console.log(`\n${branchName} (${stream}):`);
    results[stream] = {};

    for (let sem = 1; sem <= 8; sem++) {
      const url = `${BASE}/semester.php?stream=${stream}&sem=${sem}`;

      const html = fetchUrl(url);
      if (!html || html.length < 100) {
        console.log(`  Semester ${sem}: no data`);
        continue;
      }

      const subjects = extractSubjects(html);
      if (subjects.length > 0) {
        console.log(`  Semester ${sem}: ${subjects.join(", ")}`);
        results[stream][sem] = subjects;
      } else {
        console.log(`  Semester ${sem}: no subjects found`);
      }

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return results;
}

function generateMetadata(results) {
  console.log("\nGenerating metadata files...\n");

  let totalFiles = 0;

  for (const [stream, semesters] of Object.entries(results)) {
    const branchSlug = BRANCH_SLUG_MAP[stream] || stream;

    for (const [sem, subjects] of Object.entries(semesters)) {
      for (const subjectName of subjects) {
        const subjectSlug = getSubjectSlug(subjectName);
        const fileName = `${subjectSlug}.json`;

        const semDir = path.join(METADATA_DIR, branchSlug, `semester-${sem}`);
        fs.mkdirSync(semDir, { recursive: true });

        const filePath = path.join(semDir, fileName);
        if (fs.existsSync(filePath)) {
          console.log(`  Skip existing: ${branchSlug}/semester-${sem}/${fileName}`);
          continue;
        }

        const metadata = {
          subject: subjectName,
          branch: branchSlug.toUpperCase(),
          semester: Number.parseInt(sem),
          sections: {
            "section-a": { chapters: [], documents: [] },
            "section-b": { chapters: [], documents: [] },
            mixed: { documents: [] },
          },
        };

        fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2) + "\n");
        console.log(`  Created: ${branchSlug}/semester-${sem}/${fileName}`);
        totalFiles++;
      }
    }
  }

  console.log(`\nCreated ${totalFiles} metadata files total`);
}

const allData = await scrapeAll();
generateMetadata(allData);

console.log("\nDone! Metadata generated in:", METADATA_DIR);
