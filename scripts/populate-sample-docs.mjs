/**
 * Populate sample documents into metadata JSON files.
 *
 * Adds real Drive links as sample documents to key subjects
 * so the website has content to display.
 *
 * Usage: node scripts/populate-sample-docs.mjs
 */

import fs from "fs";
import path from "path";

const METADATA_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../../metadata",
);

const SAMPLE_DOCS = [
  {
    title: "Complete Notes",
    url: "https://drive.google.com/file/d/14oai7JMdifnB2qGAqyBH4qYvqsjh0cgK/view?usp=drive_link",
    tags: ["notes", "typed"],
    fileSize: 2457600,
    description: "Comprehensive typed notes covering the full syllabus.",
  },
  {
    title: "Previous Year Questions",
    url: "https://drive.google.com/file/d/1-2nRaws68t_eckay75EK_17AVflSB60n/view?usp=drive_link",
    tags: ["pyq"],
    fileSize: 1048576,
    description: "Collection of previous year examination papers.",
  },
  {
    title: "Handwritten Summary",
    url: "https://docs.google.com/document/d/1EIuPAYpZpXKUq-p8o_sEuIMr8bg5f881fpJnJ_ZeYOQ/edit?usp=drive_link",
    tags: ["notes", "handwritten"],
    fileSize: 3145728,
    description: "Detailed handwritten summary of important topics.",
  },
];

const BRANCHES = {
  cse: "CSE",
  ee: "EE",
  ece: "ECE",
  ce: "CE",
  me: "ME",
};

const TARGET_SUBJECTS = [
  { branch: "cse", semester: "semester-3", file: "oop-using-cpp.json" },
  { branch: "cse", semester: "semester-3", file: "mathematics-3.json" },
  { branch: "cse", semester: "semester-4", file: "discrete-mathematics.json" },
  { branch: "cse", semester: "semester-5", file: "data-structures.json" },
  { branch: "cse", semester: "semester-5", file: "computer-networks.json" },
  { branch: "cse", semester: "semester-6", file: "operating-system.json" },
  { branch: "cse", semester: "semester-6", file: "analysis-and-design-of-algorithms.json" },
  { branch: "cse", semester: "semester-7", file: "computer-graphics.json" },
  { branch: "cse", semester: "semester-7", file: "network-security.json" },
  { branch: "cse", semester: "semester-8", file: "artificial-intelligence.json" },
  { branch: "ee", semester: "semester-3", file: "electronic-devices-and-circuits-i.json" },
  { branch: "ee", semester: "semester-4", file: "electrical-machine-i.json" },
  { branch: "ece", semester: "semester-3", file: "electronic-devices-and-circuits-i.json" },
  { branch: "ce", semester: "semester-3", file: "surveying-i.json" },
  { branch: "me", semester: "semester-3", file: "thermodynamics.json" },
];

let totalDocsAdded = 0;

for (const target of TARGET_SUBJECTS) {
  const filePath = path.join(METADATA_DIR, target.branch, target.semester, target.file);

  if (!fs.existsSync(filePath)) {
    console.log(`  Skip (not found): ${target.branch}/${target.semester}/${target.file}`);
    continue;
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    // Add documents to mixed section
    if (!data.sections) data.sections = { "section-a": { chapters: [], documents: [] }, "section-b": { chapters: [], documents: [] }, mixed: { documents: [] } };
    if (!data.sections.mixed) data.sections.mixed = { documents: [] };

    const branchLabel = BRANCHES[target.branch] || target.branch.toUpperCase();

    for (let i = 0; i < SAMPLE_DOCS.length; i++) {
      const doc = SAMPLE_DOCS[i];
      const docEntry = {
        ...doc,
        title: `${data.subject} ${doc.title}`,
        fileSize: doc.fileSize + Math.floor(Math.random() * 1000000),
        contributor: "julearning",
        uploadedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      };
      data.sections.mixed.documents.push(docEntry);
      totalDocsAdded++;
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
    console.log(`  Added docs: ${target.branch}/${target.semester}/${target.file} — ${data.subject}`);
  } catch (e) {
    console.error(`  Error: ${target.branch}/${target.semester}/${target.file} - ${e.message}`);
  }
}

console.log(`\nTotal documents added: ${totalDocsAdded}`);
