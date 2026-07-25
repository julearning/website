/**
 * Generates sample metadata files for all 5 B.Tech branches.
 * Run: node scripts/generate-sample-metadata.mjs
 *
 * This creates a comprehensive set of documents so the website
 * has real content to display during development.
 */

import fs from "fs";
import path from "path";

const METADATA_DIR = path.resolve(process.cwd(), "../metadata");

// ─── Document templates ─────────────────────────────────────────────

const documents = [
  // ═══ CSE - Semester 3 ═══
  {
    id: "cse-s3-dbms-notes-1",
    title: "DBMS Complete Notes - Unit 1 to 5",
    description: "Comprehensive database management systems notes covering ER diagrams, relational model, SQL, normalization, and transaction processing.",
    url: "https://drive.google.com/file/d/example-dbms-notes/view",
    fileType: "pdf", fileSize: 4_200_000,
    branch: "CSE", degree: "B.Tech", semester: 3, subject: "Database Management Systems", tags: ["notes", "typed"],
    contributor: "rahulsharma", uploadedAt: "2025-08-15T10:30:00Z", verified: true, downloads: 1243,
  },
  {
    id: "cse-s3-dbms-pyq-1",
    title: "DBMS Previous Year Papers (2020-2024)",
    description: "Collection of DBMS exam papers from the last 5 years with step-by-step solutions.",
    url: "https://drive.google.com/file/d/example-dbms-pyq/view",
    fileType: "pdf", fileSize: 8_500_000,
    branch: "CSE", degree: "B.Tech", semester: 3, subject: "Database Management Systems", tags: ["pyq", "typed"],
    contributor: "neha_verma", uploadedAt: "2025-06-20T14:00:00Z", verified: true, downloads: 2341,
  },
  {
    id: "cse-s3-dsa-notes-1",
    title: "Data Structures & Algorithms Handwritten Notes",
    description: "Handwritten notes on arrays, linked lists, trees, graphs, sorting algorithms, and dynamic programming with examples.",
    url: "https://drive.google.com/file/d/example-dsa-notes/view",
    fileType: "pdf", fileSize: 12_100_000,
    branch: "CSE", degree: "B.Tech", semester: 3, subject: "Data Structures & Algorithms", tags: ["notes", "handwritten"],
    contributor: "amankumar", uploadedAt: "2025-05-12T11:00:00Z", verified: true, downloads: 3456,
  },
  {
    id: "cse-s3-dsa-pyq-1",
    title: "DSA Previous Year Questions with Solutions",
    description: "Well-explained solutions to DSA exam questions covering arrays, trees, graphs, and algorithm analysis.",
    url: "https://drive.google.com/file/d/example-dsa-pyq/view",
    fileType: "pdf", fileSize: 5_300_000,
    branch: "CSE", degree: "B.Tech", semester: 3, subject: "Data Structures & Algorithms", tags: ["pyq", "typed"],
    contributor: "rohit_s", uploadedAt: "2025-04-18T16:30:00Z", verified: true, downloads: 2890,
  },
  {
    id: "cse-s3-dld-notes-1",
    title: "Digital Logic Design - Complete Guide",
    description: "Notes on boolean algebra, logic gates, combinational circuits, sequential circuits, flip-flops, and memory units.",
    url: "https://drive.google.com/file/d/example-dld-notes/view",
    fileType: "pdf", fileSize: 6_700_000,
    branch: "CSE", degree: "B.Tech", semester: 3, subject: "Digital Logic Design", tags: ["notes", "typed"],
    contributor: "sneha_m", uploadedAt: "2025-03-25T08:45:00Z", verified: true, downloads: 1567,
  },

  // ═══ CSE - Semester 4 ═══
  {
    id: "cse-s4-os-notes-1",
    title: "Operating Systems Concepts - Detailed Notes",
    description: "In-depth notes on process management, memory management, file systems, I/O, deadlocks, and scheduling algorithms.",
    url: "https://drive.google.com/file/d/example-os-notes/view",
    fileType: "pdf", fileSize: 7_400_000,
    branch: "CSE", degree: "B.Tech", semester: 4, subject: "Operating Systems", tags: ["notes", "typed"],
    contributor: "arjunr", uploadedAt: "2025-10-05T11:30:00Z", verified: true, downloads: 1876,
  },
  {
    id: "cse-s4-os-pyq-1",
    title: "OS Previous Year Solved Papers",
    description: "Solved question papers with detailed explanations for operating system concepts and numerical problems.",
    url: "https://drive.google.com/file/d/example-os-pyq/view",
    fileType: "pdf", fileSize: 4_900_000,
    branch: "CSE", degree: "B.Tech", semester: 4, subject: "Operating Systems", tags: ["pyq", "handwritten"],
    contributor: "divya_p", uploadedAt: "2025-09-20T15:00:00Z", verified: true, downloads: 2345,
  },
  {
    id: "cse-s4-cn-notes-1",
    title: "Computer Networks - Complete Reference",
    description: "Comprehensive notes on OSI model, TCP/IP protocol suite, routing algorithms, network security, and application layer protocols.",
    url: "https://drive.google.com/file/d/example-cn-notes/view",
    fileType: "pdf", fileSize: 9_200_000,
    branch: "CSE", degree: "B.Tech", semester: 4, subject: "Computer Networks", tags: ["notes", "typed"],
    contributor: "karan_s", uploadedAt: "2025-08-28T09:00:00Z", verified: true, downloads: 1654,
  },
  {
    id: "cse-s4-coa-notes-1",
    title: "Computer Organization & Architecture Notes",
    description: "Notes on CPU architecture, memory hierarchy, pipelining, cache design, and parallel processing concepts.",
    url: "https://drive.google.com/file/d/example-coa-notes/view",
    fileType: "pdf", fileSize: 6_100_000,
    branch: "CSE", degree: "B.Tech", semester: 4, subject: "Computer Organization & Architecture", tags: ["notes", "typed"],
    contributor: "prakash_m", uploadedAt: "2025-06-12T10:30:00Z", verified: true, downloads: 1432,
  },

  // ═══ CSE - Semester 5 ═══
  {
    id: "cse-s5-ai-notes-1",
    title: "Artificial Intelligence - Complete Notes",
    description: "Notes on search algorithms, knowledge representation, machine learning fundamentals, NLP, and computer vision basics.",
    url: "https://drive.google.com/file/d/example-ai-notes/view",
    fileType: "pdf", fileSize: 11_300_000,
    branch: "CSE", degree: "B.Tech", semester: 5, subject: "Artificial Intelligence", tags: ["notes", "typed"],
    contributor: "ishitas", uploadedAt: "2025-11-10T08:00:00Z", verified: true, downloads: 4567,
  },
  {
    id: "cse-s5-ai-pyq-1",
    title: "AI Previous Year Questions with Solutions",
    description: "Solved question papers covering search algorithms, logic, probabilistic reasoning, and machine learning fundamentals.",
    url: "https://drive.google.com/file/d/example-ai-pyq/view",
    fileType: "pdf", fileSize: 3_600_000,
    branch: "CSE", degree: "B.Tech", semester: 5, subject: "Artificial Intelligence", tags: ["pyq", "typed"],
    contributor: "tanishq_r", uploadedAt: "2025-10-20T16:00:00Z", verified: true, downloads: 3210,
  },
  {
    id: "cse-s5-se-notes-1",
    title: "Software Engineering - Complete Guide",
    description: "Notes on SDLC models, agile methodologies, requirements engineering, design patterns, software testing, and project management.",
    url: "https://drive.google.com/file/d/example-se-notes/view",
    fileType: "pdf", fileSize: 8_900_000,
    branch: "CSE", degree: "B.Tech", semester: 5, subject: "Software Engineering", tags: ["notes", "typed"],
    contributor: "akshay_p", uploadedAt: "2025-09-15T11:00:00Z", verified: true, downloads: 1876,
  },
  {
    id: "cse-s5-wt-notes-1",
    title: "Web Technologies - Full Stack Notes",
    description: "Notes on HTML5, CSS3, JavaScript, React, Node.js, databases, REST APIs, and cloud deployment.",
    url: "https://drive.google.com/file/d/example-wt-notes/view",
    fileType: "pdf", fileSize: 14_500_000,
    branch: "CSE", degree: "B.Tech", semester: 5, subject: "Web Technologies", tags: ["notes", "handwritten"],
    contributor: "shubham_b", uploadedAt: "2025-07-22T09:45:00Z", verified: false, downloads: 4321,
  },

  // ═══ CSE - Semester 6 ═══
  {
    id: "cse-s6-ml-notes-1",
    title: "Machine Learning - Complete Notes",
    description: "Notes on supervised learning, unsupervised learning, neural networks, SVM, ensemble methods, and evaluation metrics.",
    url: "https://drive.google.com/file/d/example-ml-notes/view",
    fileType: "pdf", fileSize: 13_200_000,
    branch: "CSE", degree: "B.Tech", semester: 6, subject: "Machine Learning", tags: ["notes", "typed"],
    contributor: "aditya_n", uploadedAt: "2025-11-20T10:00:00Z", verified: true, downloads: 5432,
  },
  {
    id: "cse-s6-ml-pyq-1",
    title: "Machine Learning Previous Year Papers",
    description: "Solved question papers covering ML algorithms, evaluation metrics, overfitting, and real-world case studies.",
    url: "https://drive.google.com/file/d/example-ml-pyq/view",
    fileType: "pdf", fileSize: 3_800_000,
    branch: "CSE", degree: "B.Tech", semester: 6, subject: "Machine Learning", tags: ["pyq", "typed"],
    contributor: "shreya_k", uploadedAt: "2025-10-25T14:00:00Z", verified: true, downloads: 3210,
  },
  {
    id: "cse-s6-cd-notes-1",
    title: "Compiler Design - Complete Notes",
    description: "Notes on lexical analysis, parsing techniques, syntax-directed translation, intermediate code generation, and optimization.",
    url: "https://drive.google.com/file/d/example-cd-notes/view",
    fileType: "pdf", fileSize: 7_600_000,
    branch: "CSE", degree: "B.Tech", semester: 6, subject: "Compiler Design", tags: ["notes", "handwritten"],
    contributor: "varun_t", uploadedAt: "2025-08-15T09:30:00Z", verified: true, downloads: 1654,
  },

  // ═══ ECE - Semester 3 ═══
  {
    id: "ece-s3-edc-notes-1",
    title: "Electronic Devices & Circuits - Complete Notes",
    description: "Notes on semiconductor physics, PN junction diodes, BJTs, FETs, amplifier circuits, and frequency response.",
    url: "https://drive.google.com/file/d/example-edc-notes/view",
    fileType: "pdf", fileSize: 8_400_000,
    branch: "ECE", degree: "B.Tech", semester: 3, subject: "Electronic Devices & Circuits", tags: ["notes", "typed"],
    contributor: "sakshi_r", uploadedAt: "2025-09-10T10:00:00Z", verified: true, downloads: 1567,
  },
  {
    id: "ece-s3-edc-pyq-1",
    title: "EDC Previous Year Solved Papers",
    description: "Solved question papers with numerical problems on biasing, amplifier analysis, and frequency response.",
    url: "https://drive.google.com/file/d/example-edc-pyq/view",
    fileType: "pdf", fileSize: 5_600_000,
    branch: "ECE", degree: "B.Tech", semester: 3, subject: "Electronic Devices & Circuits", tags: ["pyq", "typed"],
    contributor: "ajay_verma", uploadedAt: "2025-08-05T14:30:00Z", verified: true, downloads: 2100,
  },
  {
    id: "ece-s3-nt-notes-1",
    title: "Network Theory - Complete Reference",
    description: "Notes on network theorems, transient analysis, two-port networks, network functions, and filter design.",
    url: "https://drive.google.com/file/d/example-nt-notes/view",
    fileType: "pdf", fileSize: 7_200_000,
    branch: "ECE", degree: "B.Tech", semester: 3, subject: "Network Theory", tags: ["notes", "typed"],
    contributor: "priya_singh", uploadedAt: "2025-07-18T11:15:00Z", verified: true, downloads: 1234,
  },

  // ═══ ECE - Semester 4 ═══
  {
    id: "ece-s4-de-notes-1",
    title: "Digital Electronics - Complete Guide",
    description: "Notes on logic families, combinational logic circuits, sequential circuits, PLDs, and digital memory technologies.",
    url: "https://drive.google.com/file/d/example-de-notes/view",
    fileType: "pdf", fileSize: 6_800_000,
    branch: "ECE", degree: "B.Tech", semester: 4, subject: "Digital Electronics", tags: ["notes", "typed"],
    contributor: "vikram_d", uploadedAt: "2025-10-12T09:00:00Z", verified: true, downloads: 1432,
  },
  {
    id: "ece-s4-ss-notes-1",
    title: "Signals & Systems - Handwritten Notes",
    description: "Handwritten notes on signals classification, LTI systems, Fourier series, Laplace and Z-transforms with solved examples.",
    url: "https://drive.google.com/file/d/example-ss-notes/view",
    fileType: "pdf", fileSize: 10_100_000,
    branch: "ECE", degree: "B.Tech", semester: 4, subject: "Signals & Systems", tags: ["notes", "handwritten"],
    contributor: "nidhi_agr", uploadedAt: "2025-09-28T16:00:00Z", verified: true, downloads: 1876,
  },
  {
    id: "ece-s4-ss-assign-1",
    title: "Signals & Systems Problem Sets",
    description: "Assignment problems on convolution, Fourier analysis, system properties, and transform methods with solutions.",
    url: "https://drive.google.com/file/d/example-ss-assign/view",
    fileType: "pdf", fileSize: 2_400_000,
    branch: "ECE", degree: "B.Tech", semester: 4, subject: "Signals & Systems", tags: ["assignment", "typed"],
    contributor: "arjun_m", uploadedAt: "2025-08-15T12:00:00Z", verified: false, downloads: 765,
  },

  // ═══ ECE - Semester 5 ═══
  {
    id: "ece-s5-cs-notes-1",
    title: "Communication Systems - Complete Notes",
    description: "Notes on amplitude modulation, frequency modulation, digital modulation techniques, noise analysis, and information theory.",
    url: "https://drive.google.com/file/d/example-cs-notes/view",
    fileType: "pdf", fileSize: 9_400_000,
    branch: "ECE", degree: "B.Tech", semester: 5, subject: "Communication Systems", tags: ["notes", "typed"],
    contributor: "neha_k", uploadedAt: "2025-11-05T10:00:00Z", verified: true, downloads: 1456,
  },
  {
    id: "ece-s5-vlsi-notes-1",
    title: "VLSI Design - Handwritten Notes",
    description: "Notes on CMOS technology, fabrication processes, layout design, testing, and low-power VLSI design techniques.",
    url: "https://drive.google.com/file/d/example-vlsi-notes/view",
    fileType: "pdf", fileSize: 8_800_000,
    branch: "ECE", degree: "B.Tech", semester: 5, subject: "VLSI Design", tags: ["notes", "handwritten"],
    contributor: "rohan_g", uploadedAt: "2025-10-10T15:00:00Z", verified: false, downloads: 1032,
  },

  // ═══ EE - Semester 4 ═══
  {
    id: "ee-s4-ps-notes-1",
    title: "Power Systems - Complete Notes",
    description: "Notes on power generation, transmission line parameters, load flow analysis, fault analysis, and power system stability.",
    url: "https://drive.google.com/file/d/example-ps-notes/view",
    fileType: "pdf", fileSize: 9_300_000,
    branch: "EE", degree: "B.Tech", semester: 4, subject: "Power Systems", tags: ["notes", "typed"],
    contributor: "rajesh_k", uploadedAt: "2025-10-20T10:00:00Z", verified: true, downloads: 1345,
  },
  {
    id: "ee-s4-em-notes-1",
    title: "Electrical Machines - Complete Guide",
    description: "Notes on transformers, DC machines, synchronous machines, induction motors, and their characteristics.",
    url: "https://drive.google.com/file/d/example-em-notes/view",
    fileType: "pdf", fileSize: 8_900_000,
    branch: "EE", degree: "B.Tech", semester: 4, subject: "Electrical Machines", tags: ["notes", "handwritten"],
    contributor: "pooja_s", uploadedAt: "2025-09-15T11:30:00Z", verified: true, downloads: 1678,
  },
  {
    id: "ee-s4-em-pyq-1",
    title: "Electrical Machines Previous Year Questions",
    description: "Solved numerical problems on transformer equivalent circuits, motor characteristics, and generator operation.",
    url: "https://drive.google.com/file/d/example-em-pyq/view",
    fileType: "pdf", fileSize: 4_500_000,
    branch: "EE", degree: "B.Tech", semester: 4, subject: "Electrical Machines", tags: ["pyq", "typed"],
    contributor: "amit_89", uploadedAt: "2025-08-22T14:00:00Z", verified: true, downloads: 2341,
  },

  // ═══ ME - Semester 3 ═══
  {
    id: "me-s3-thermo-notes-1",
    title: "Thermodynamics - Complete Notes",
    description: "Notes on laws of thermodynamics, properties of pure substances, gas power cycles, and refrigeration cycles.",
    url: "https://drive.google.com/file/d/example-thermo-notes/view",
    fileType: "pdf", fileSize: 7_600_000,
    branch: "ME", degree: "B.Tech", semester: 3, subject: "Thermodynamics", tags: ["notes", "typed"],
    contributor: "sunil_y", uploadedAt: "2025-09-05T09:00:00Z", verified: true, downloads: 1567,
  },
  {
    id: "me-s3-thermo-pyq-1",
    title: "Thermodynamics Previous Year Solved Papers",
    description: "Solved numerical problems on thermodynamic cycles, entropy calculations, and exergy analysis.",
    url: "https://drive.google.com/file/d/example-thermo-pyq/view",
    fileType: "pdf", fileSize: 4_800_000,
    branch: "ME", degree: "B.Tech", semester: 3, subject: "Thermodynamics", tags: ["pyq", "typed"],
    contributor: "mohit_d", uploadedAt: "2025-08-10T15:00:00Z", verified: true, downloads: 2100,
  },
  {
    id: "me-s3-som-notes-1",
    title: "Strength of Materials - Complete Guide",
    description: "Notes on stress-strain analysis, bending moments, torsion, column theory, and strain energy methods.",
    url: "https://drive.google.com/file/d/example-som-notes/view",
    fileType: "pdf", fileSize: 6_500_000,
    branch: "ME", degree: "B.Tech", semester: 3, subject: "Strength of Materials", tags: ["notes", "typed"],
    contributor: "arun_k", uploadedAt: "2025-07-20T10:30:00Z", verified: true, downloads: 1234,
  },

  // ═══ ME - Semester 4 ═══
  {
    id: "me-s4-fm-notes-1",
    title: "Fluid Mechanics - Complete Notes",
    description: "Notes on fluid properties, fluid statics, kinematics, dynamics, boundary layer theory, and turbomachinery.",
    url: "https://drive.google.com/file/d/example-fm-notes/view",
    fileType: "pdf", fileSize: 8_100_000,
    branch: "ME", degree: "B.Tech", semester: 4, subject: "Fluid Mechanics", tags: ["notes", "typed"],
    contributor: "deepak_r", uploadedAt: "2025-10-15T11:00:00Z", verified: true, downloads: 1432,
  },
  {
    id: "me-s4-mp-notes-1",
    title: "Manufacturing Processes - Complete Notes",
    description: "Notes on casting, forming, welding, machining operations, and modern manufacturing techniques including 3D printing.",
    url: "https://drive.google.com/file/d/example-mp-notes/view",
    fileType: "pdf", fileSize: 10_200_000,
    branch: "ME", degree: "B.Tech", semester: 4, subject: "Manufacturing Processes", tags: ["notes", "handwritten"],
    contributor: "rahul_m", uploadedAt: "2025-08-30T09:30:00Z", verified: true, downloads: 1765,
  },

  // ═══ CE - Semester 3 ═══
  {
    id: "ce-s3-sa-notes-1",
    title: "Structural Analysis - Complete Notes",
    description: "Notes on determinate and indeterminate structures, methods of analysis, influence lines, and moment distribution.",
    url: "https://drive.google.com/file/d/example-sa-notes/view",
    fileType: "pdf", fileSize: 7_800_000,
    branch: "CE", degree: "B.Tech", semester: 3, subject: "Structural Analysis", tags: ["notes", "typed"],
    contributor: "aman_c", uploadedAt: "2025-09-12T10:00:00Z", verified: true, downloads: 1345,
  },
  {
    id: "ce-s3-sa-pyq-1",
    title: "Structural Analysis Previous Year Papers",
    description: "Solved problems on trusses, beams, rigid frames, and influence line diagrams for various loading conditions.",
    url: "https://drive.google.com/file/d/example-sa-pyq/view",
    fileType: "pdf", fileSize: 5_100_000,
    branch: "CE", degree: "B.Tech", semester: 3, subject: "Structural Analysis", tags: ["pyq", "typed"],
    contributor: "priyanka_t", uploadedAt: "2025-08-18T14:30:00Z", verified: true, downloads: 1890,
  },
  {
    id: "ce-s3-fm-notes-1",
    title: "Fluid Mechanics & Hydraulics - Notes",
    description: "Notes on fluid flow through pipes, open channel flow, hydraulic jump, pumps, and hydraulic machines.",
    url: "https://drive.google.com/file/d/example-ce-fm-notes/view",
    fileType: "pdf", fileSize: 6_900_000,
    branch: "CE", degree: "B.Tech", semester: 3, subject: "Fluid Mechanics & Hydraulics", tags: ["notes", "typed"],
    contributor: "vivek_p", uploadedAt: "2025-07-25T11:15:00Z", verified: true, downloads: 1123,
  },

  // ═══ CE - Semester 4 ═══
  {
    id: "ce-s4-geotech-notes-1",
    title: "Geotechnical Engineering - Complete Notes",
    description: "Notes on soil properties, consolidation, shear strength, slope stability, bearing capacity, and foundation engineering.",
    url: "https://drive.google.com/file/d/example-geotech-notes/view",
    fileType: "pdf", fileSize: 8_500_000,
    branch: "CE", degree: "B.Tech", semester: 4, subject: "Geotechnical Engineering", tags: ["notes", "typed"],
    contributor: "aniket_s", uploadedAt: "2025-10-22T09:00:00Z", verified: true, downloads: 1432,
  },
  {
    id: "ce-s4-ct-notes-1",
    title: "Concrete Technology - Complete Reference",
    description: "Notes on concrete ingredients, mix design methods, admixtures, durability, non-destructive testing, and quality control.",
    url: "https://drive.google.com/file/d/example-ct-notes/view",
    fileType: "pdf", fileSize: 7_200_000,
    branch: "CE", degree: "B.Tech", semester: 4, subject: "Concrete Technology", tags: ["notes", "typed"],
    contributor: "abhishek_g", uploadedAt: "2025-08-20T10:30:00Z", verified: true, downloads: 1654,
  },

  // ═══ Syllabuses ═══
  {
    id: "cse-syllabus",
    title: "CSE B.Tech Full Syllabus (2024-28)",
    description: "Complete course structure and semester-wise syllabus for CSE batch 2024-2028 with subject breakdowns.",
    url: "https://drive.google.com/file/d/example-cse-syllabus/view",
    fileType: "pdf", fileSize: 2_300_000,
    branch: "CSE", degree: "B.Tech", semester: 1, subject: "General", tags: ["syllabus", "typed"],
    contributor: "admin", uploadedAt: "2025-06-01T08:00:00Z", verified: true, downloads: 5678,
  },
  {
    id: "ece-syllabus",
    title: "ECE B.Tech Full Syllabus (2024-28)",
    description: "Complete course structure and semester-wise syllabus for ECE batch 2024-2028.",
    url: "https://drive.google.com/file/d/example-ece-syllabus/view",
    fileType: "pdf", fileSize: 2_100_000,
    branch: "ECE", degree: "B.Tech", semester: 1, subject: "General", tags: ["syllabus", "typed"],
    contributor: "admin", uploadedAt: "2025-06-01T08:00:00Z", verified: true, downloads: 3456,
  },
  {
    id: "me-syllabus",
    title: "ME B.Tech Full Syllabus (2024-28)",
    description: "Complete course structure for Mechanical Engineering batch 2024-2028 with subject details.",
    url: "https://drive.google.com/file/d/example-me-syllabus/view",
    fileType: "pdf", fileSize: 2_000_000,
    branch: "ME", degree: "B.Tech", semester: 1, subject: "General", tags: ["syllabus", "typed"],
    contributor: "admin", uploadedAt: "2025-06-01T08:00:00Z", verified: true, downloads: 2341,
  },
];

// ─── Write files ────────────────────────────────────────────────────

function sanitizeFolderName(name) {
  return name.toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-");
}

function writeDocument(doc) {
  const folder = path.join(
    METADATA_DIR,
    doc.branch.toLowerCase(),
    "semester-" + doc.semester,
    sanitizeFolderName(doc.subject),
  );

  const filename = doc.id + ".json";
  const filepath = path.join(folder, filename);

  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(filepath, JSON.stringify(doc, null, 2) + "\n", "utf-8");
  console.log("  " + filepath);
}

console.log("Generating " + documents.length + " metadata files...\n");

for (const doc of documents) {
  writeDocument(doc);
}

console.log("\nDone! Generated " + documents.length + " metadata files.");
