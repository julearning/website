/**
 * Populate ALL 248 subjects with sample documents.
 *
 * Distributes the 3 real Drive links across all subjects
 * with randomized titles, sizes, and section placement.
 *
 * Usage: node scripts/populate-all-subjects.mjs
 */

import fs from "fs";
import path from "path";

const METADATA_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../../metadata",
);

const DRIVE_URLS = [
  "https://drive.google.com/file/d/14oai7JMdifnB2qGAqyBH4qYvqsjh0cgK/view?usp=drive_link",
  "https://drive.google.com/file/d/1-2nRaws68t_eckay75EK_17AVflSB60n/view?usp=drive_link",
  "https://docs.google.com/document/d/1EIuPAYpZpXKUq-p8o_sEuIMr8bg5f881fpJnJ_ZeYOQ/edit?usp=drive_link",
];

const DOC_TEMPLATES = [
  { suffix: "Complete Notes", tags: ["notes", "typed"], baseSize: 2500000 },
  { suffix: "Previous Year Questions", tags: ["pyq"], baseSize: 1200000 },
  { suffix: "Handwritten Summary", tags: ["notes", "handwritten"], baseSize: 3500000 },
];

const SECTIONS = ["section-a", "section-b", "mixed"];

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function findSubjectFiles(dir) {
  const files = [];
  function scan(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      const fp = path.join(current, e.name);
      if (e.isDirectory() && !e.name.startsWith(".")) scan(fp);
      else if (e.name.endsWith(".json")) files.push(fp);
    }
  }
  scan(dir);
  return files;
}

const files = findSubjectFiles(METADATA_DIR);
console.log(`Found ${files.length} subject files`);

let populated = 0;
let skipped = 0;
let docsAdded = 0;

for (const filePath of files) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  if (!data.sections) {
    data.sections = {
      "section-a": { chapters: [], documents: [] },
      "section-b": { chapters: [], documents: [] },
      mixed: { documents: [] },
    };
  }

  // Check if already has documents
  const existingCount =
    (data.sections["section-a"]?.documents?.length || 0) +
    (data.sections["section-b"]?.documents?.length || 0) +
    (data.sections.mixed?.documents?.length || 0);

  if (existingCount > 0) {
    skipped++;
    continue;
  }

  // Generate a seed from the subject name for deterministic randomness
  const seed = data.subject.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRandom(seed);

  // Pick 2-3 document types
  const numDocs = 2 + Math.floor(rand() * 2);
  const used = new Set();

  for (let i = 0; i < numDocs; i++) {
    const tmplIdx = Math.floor(rand() * DOC_TEMPLATES.length);
    if (used.has(tmplIdx)) continue;
    used.add(tmplIdx);

    const tmpl = DOC_TEMPLATES[tmplIdx];
    const section = SECTIONS[Math.floor(rand() * SECTIONS.length)];
    const urlIdx = Math.floor(rand() * DRIVE_URLS.length);

    if (!data.sections[section]) {
      data.sections[section] = { chapters: [], documents: [] };
    }

    data.sections[section].documents.push({
      title: `${data.subject} ${tmpl.suffix}`,
      url: DRIVE_URLS[urlIdx],
      tags: [...tmpl.tags],
      fileSize: tmpl.baseSize + Math.floor(rand() * 2000000),
      description: `${tmpl.suffix.replace(/-/g, " ")} for ${data.subject} — ${data.branch} Semester ${data.semester}.`,
      contributor: "julearning",
      uploadedAt: new Date(
        Date.now() - Math.floor(rand() * 365 * 24 * 60 * 60 * 1000),
      ).toISOString(),
    });

    docsAdded++;
  }

  // Ensure all sections exist
  for (const sec of SECTIONS) {
    if (!data.sections[sec]) {
      data.sections[sec] = sec === "mixed" ? { documents: [] } : { chapters: [], documents: [] };
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
  populated++;
}

console.log(`\nResults:
  Total subject files: ${files.length}
  Already had docs (skipped): ${skipped}
  Newly populated: ${populated}
  Total documents added: ${docsAdded}
  Expected total docs in repo: ~${skipped * 3 + docsAdded}`);
