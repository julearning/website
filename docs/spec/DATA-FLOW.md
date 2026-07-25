# JU Learning — Data Flow

## Overview

Data flows in one direction: **metadata JSON → build-time generation → static page → client render**. There is no runtime API, no database, no authentication.

```
┌──────────────────────────────────────────────────────────────────┐
│                     BUILD TIME                                    │
│                                                                  │
│  Metadata JSON files          Generate Script                    │
│  (julearning/metadata)  ───►  (scripts/generate-data.mjs)       │
│  249+ subject files                                              │
│  ┌──────────────────┐        ┌─────────────────────────┐         │
│  │ CSE/              │        │ 1. Clone metadata repo  │         │
│  │  semester-3/      │        │ 2. Walk all JSON files  │         │
│  │   DS.json         │        │ 3. Parse each subject   │         │
│  │   OOP.json        │        │ 4. Flatten sections     │         │
│  │  semester-4/      │        │ 5. Assign unique IDs    │         │
│  │   DBMS.json       │        │ 6. Write TypeScript     │         │
│  │   OS.json         │        └──────────┬──────────────┘         │
│  └──────────────────┘                   │                         │
│                                          ▼                        │
│                                ┌──────────────────┐               │
│                                │ generated-       │               │
│                                │ documents.ts     │               │
│                                │ 477 Document[]   │               │
│                                │ + helper fns     │               │
│                                └──────────────────┘               │
│                                          │                         │
│                                          ▼                         │
│                                ┌──────────────────┐               │
│                                │ Next.js Build     │               │
│                                │ 288+ static pages │               │
│                                └──────────────────┘               │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                     RUNTIME (Browser)                            │
│                                                                  │
│  Static HTML/CSS/JS                                              │
│  ┌──────────────────────────────────────┐                        │
│  │ Search (Enter)                       │                        │
│  │  → Fuse-free inline scoring engine   │                        │
│  │  → Scores 477 docs by relevance      │                        │
│  │  → Returns sorted SearchResult[]     │                        │
│  │  → PaginatedGrid renders results     │                        │
│  │                                     │                        │
│  │ Browse (click)                       │                        │
│  │  → Pre-rendered page                 │                        │
│  │  → Instant navigation (no loading)   │                        │
│  │                                     │                        │
│  │ Download (click)                     │                        │
│  │  → Direct Google Drive link          │                        │
│  │  → Opens in new tab                 │                        │
│  └──────────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────────┘
```

## Metadata File Format

### Subject-Level JSON (stored in `julearning/metadata`)

```json
{
  "subject": "Database Management Systems",
  "branch": "CSE",
  "semester": 4,
  "sections": {
    "section-a": {
      "chapters": [
        "Introduction to DBMS",
        "Entity-Relationship Model",
        "Relational Model",
        "SQL"
      ],
      "documents": [
        {
          "title": "DBMS Complete Notes",
          "url": "https://drive.google.com/file/d/.../view",
          "tags": ["notes", "handwritten"],
          "fileSize": 5242880,
          "description": "Comprehensive notes covering all 5 units",
          "uploadedAt": "2024-01-15"
        }
      ]
    },
    "section-b": {
      "chapters": [
        "Normalization",
        "Transaction Processing",
        "Concurrency Control"
      ],
      "documents": [
        {
          "title": "DBMS PYQ 2024",
          "url": "https://drive.google.com/file/d/.../view",
          "tags": ["pyq", "typed"],
          "fileSize": 1048576
        }
      ]
    },
    "mixed": {
      "documents": []
    }
  }
}
```

### File Naming Convention

```
{branch}/{semester-n}/{subject-name}.json

Examples:
  CSE/semester-3/Data-Structures.json
  CSE/semester-4/Database-Management-Systems.json
  ECE/semester-3/Digital-Electronics.json
```

### Folder Structure (Drive Mirror)

```
julearning/metadata/
├── CSE/
│   ├── semester-1/
│   │   ├── Engineering-Mathematics-1.json
│   │   └── Programming-for-Problem-Solving.json
│   ├── semester-2/
│   │   ├── Engineering-Mathematics-2.json
│   │   └── Physics.json
│   ├── semester-3/
│   │   ├── Data-Structures.json
│   │   └── Object-Oriented-Programming.json
│   └── semester-4/
│       ├── Database-Management-Systems.json
│       └── Operating-Systems.json
├── ECE/
│   └── ...
├── EE/
│   └── ...
├── ME/
│   └── ...
└── CE/
    └── ...
```

## Data Flow Through the Application

### Document Type

```typescript
export interface Document {
  id: string;          // Auto-generated: "{branch}-S{sem}-{subject-slug}-{title-slug}"
  title: string;       // From metadata JSON
  description: string; // From metadata JSON
  url: string;         // Google Drive public URL
  thumbnailUrl: string;// Auto-derived from url (Google Drive thumbnail endpoint)
  fileType: "pdf" | "docx";
  fileSize: number;    // Bytes
  branch: Branch;      // "CSE" | "ECE" | "EE" | "ME" | "CE"
  semester: number;    // 1-8
  subject: string;     // Full subject name
  section?: "section-a" | "section-b" | "mixed";
  tags: string[];      // Document type tags
  chapters: string[];  // Syllabus chapters covered
  contributor?: string;// GitHub username
  uploadedAt?: string; // ISO 8601
  language?: string;   // e.g., "english", "hindi"
  pages?: number;      // PDF page count
  downloads?: number;  // Download count (placeholder)
}
```

### Generated Data Flow

```
Raw JSON                     JavaScript/TypeScript
─────────                    ────────────────────
SubjectMetadata              Document (flattened)
├── subject                  ├── subject
├── branch                   ├── branch
├── semester                 ├── semester
├── sections                 ├── section
│   ├── section-a            ├── tags
│   │   ├── chapters      ──►├── chapters
│   │   └── documents[]      ├── title
│   ├── section-b            ├── url
│   └── mixed                ├── fileSize
│       └── documents[]      ├── description
                             ├── uploadedAt
                             └── contributor
```

The generator script (`scripts/generate-data.mjs`):
1. Reads each JSON file
2. Iterates over each section (section-a, section-b, mixed)
3. For each document in the section, creates a `Document` object:
   - Copies shared fields (subject, branch, semester, chapters) from the parent
   - Adds section-specific fields (title, url, tags, fileSize, etc.)
   - Generates a unique ID from branch + semester + subject-slug + title-slug
4. Collects all documents into a flat array
5. Generates helper functions (getUniqueBranches, etc.)
6. Writes the complete TypeScript file

## Search Flow

```
User types query → Enter key
       │
       ▼
performSearch(query)
    │
    ├── setIsLoading(true)       ← Triggers skeleton render
    ├── await 200ms delay        ← Yields to React for skeleton
    │
    ├── Build FilterState:
    │   { query, branch: null, semester: null, 
    │     subject: null, tags: [], sort: "relevance" }
    │
    ├── searchDocuments(docs, filters)
    │   │
    │   ├── Apply filters (branch, sem, subject, tags)
    │   ├── Score each filtered doc:
    │   │   singleWordScore(doc, word) → number (0 = perfect, 1 = no match)
    │   │   queryScore(doc, query) → min(score per word)
    │   │
    │   ├── Filter: score < 1 (any field matched)
    │   └── Sort: score ascending (best matches first)
    │
    └── setResults(found)
        └── PaginatedGrid renders with page=1
```

## Building the "Show More" URL for Broken Links

```typescript
function buildReportIssueUrl(doc: { id: string; title: string; url: string }): string {
  // Generates: https://github.com/JU-Learning/julearning/issues/new
  //   ?title=[Broken Link] Document Title
  //   &body=## Broken Link Report\n**Document ID:** ...\n**URL:** ...
}
```

## Thumbnail Generation

```typescript
function getThumbnailUrl(url: string): string {
  // Extracts file ID from Google Drive URL
  // Returns: https://drive.google.com/thumbnail?id=FILE_ID&sz=w1000
  // Uses undocumented Google Drive endpoint
}
```

This works for PDFs, documents, and images — Google generates a first-page preview thumbnail automatically. No API key or OAuth required.
