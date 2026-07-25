# JU Learning — Architecture

## System Overview

JU Learning is a **zero-database, zero-backend** static platform for sharing university study materials. The entire site is pre-rendered at build time from flat JSON files stored in a separate GitHub repository, served as static assets via CDN. There are no API servers, databases, or authentication systems to maintain.

```
┌─────────────────────────────────────────────────────────────┐
│                     Google Drive / Any Cloud                │
│  Stores PDFs/docx files in human-friendly folders           │
│  e.g. JU Learning/B.Tech/CSE/Semester 4/DBMS/Notes/        │
└───────────┬─────────────────────────────────────────────────┘
            │ Public URLs stored in metadata
            ▼
┌─────────────────────────────────────────────────────────────┐
│              GitHub — julearning/metadata                   │
│  Repository of subject-level JSON files (no DB)            │
│  ├── CSE/semester-3/Data-Structures.json                   │
│  ├── CSE/semester-4/DBMS.json                             │
│  ├── ECE/semester-3/Digital-Electronics.json              │
│  │   ...249+ subject files                                 │
│  └── .github/workflows/validate.yml                       │
│                                                            │
│  Changes via Pull Requests → GitHub Actions validates      │
│  JSON schema, checks URLs, verifies no duplicates          │
└───────────┬─────────────────────────────────────────────────┘
            │ Cloned at build time
            ▼
┌─────────────────────────────────────────────────────────────┐
│         Next.js Static Build (SSG)                         │
│                                                            │
│  1. prebuild: scripts/generate-data.mjs                    │
│     ├── Clones julearning/metadata repo                    │
│     ├── Reads ALL subject JSON files                       │
│     ├── Flattens sections (A/B/Mixed) into documents       │
│     └── Generates src/data/generated-documents.ts          │
│                                                            │
│  2. build: next build                                      │
│     ├── TypeScript compilation                             │
│     ├── Pre-renders 288+ static pages                      │
│     └── Generates optimized static assets                  │
└───────────┬─────────────────────────────────────────────────┘
            │ Static HTML/CSS/JS
            ▼
┌─────────────────────────────────────────────────────────────┐
│  Vercel (CDN)                                              │
│  └── Serves pre-rendered pages instantly                   │
│      No server-side computation at request time            │
└─────────────────────────────────────────────────────────────┘
```

## Key Architectural Decisions

### 1. No Database / No Backend

| Decision | Rationale |
|----------|-----------|
| JSON files in GitHub instead of Postgres | Zero hosting costs, no auth, no admin dashboard |
| PR-based content workflow | Anyone can contribute via GitHub, CI validates automatically |
| Build-time data generation | `scripts/generate-data.mjs` runs before every build |
| Static Site Generation (SSG) | All 288+ pages pre-rendered, instant load |

### 2. Two Repository Architecture

The project spans two GitHub repositories:

| Repository | Purpose | Visibility | Content |
|------------|---------|------------|---------|
| `julearning/website` | Application code (this repo) | Private | Next.js, React, Tailwind, all components |
| `julearning/metadata` | Content data (JSON files) | Public | Subject-level JSON, contributor PRs |

The website clones the metadata repo at build time. This separation ensures:
- Content contributors only deal with JSON, never touch React code
- Website source code stays private
- Each repo has its own CI/CD pipeline
- Content updates don't require code deployments

### 3. Google Drive as Decoupled Storage

Documents are stored on Google Drive (or any public cloud storage). The metadata only stores the file URL — the application is **storage-provider agnostic**.

| Property | Detail |
|----------|--------|
| Storage | Google Drive (primary), any public URL works |
| Bandwidth | Unlimited (Google handles CDN) |
| Folder structure | Human-friendly for direct Drive browsing |
| Multi-provider | Contributors can use their own Drive, Dropbox, etc. |
| Thumbnails | Google Drive undocumented endpoint: `thumbnail?id=FILE_ID&sz=w1000` |

### 4. Content Contribution Workflow

```
Contributor                             Website
    │                                      │
    ├─ Forks julearning/metadata           │
    ├─ Uploads PDF to their Google Drive   │
    ├─ Edits subject JSON to add entry     │
    ├─ Opens Pull Request                  │
    │                                      │
    ▼                                      │
GitHub Actions                             │
    ├─ Validates JSON schema               │
    ├─ Checks required fields              │
    ├─ Verifies URL accessibility          │
    ├─ Checks for duplicate IDs            │
    │                                      │
    ▼                                      │
Maintainer reviews & merges                │
    │                                      │
    └─────────────────────────────────────►│
                                           ▼
                                    Vercel auto-rebuilds
                                    New content live
```

### 5. Dead Link Reporting

Users can report broken links via a pre-filled GitHub Issue template:

```
Click "Report" → Pre-filled Issue with:
  - Document ID
  - Document URL
  - Checkboxes: 404, Permission Denied, Wrong File, Other
  - Opens automatically on github.com/julearning/metadata
```

Reports accumulate as Issues, and contributors can fix them via PRs.

## Build Pipeline

```bash
# Local development
npm run generate    # Clone metadata, generate documents.ts
npm run dev         # Start dev server on port 3000

# Production build
npm run build       # generate → TypeScript → SSG → output
```

The `generate-data.mjs` script:
1. Clones (or pulls) `github.com/julearning/metadata` into `../metadata/`
2. Recursively scans all `.json` files
3. Parses each subject-level JSON into typed `Document` objects
4. Flattens section-a, section-b, mixed into a single documents array
5. Assigns unique IDs based on branch/semester/subject/title
6. Writes `src/data/generated-documents.ts`

## Tech Stack

| Layer | Choice | Version | Rationale |
|-------|--------|---------|-----------|
| Framework | Next.js | 16.2.11 | App Router, SSG, edge CDN |
| Language | TypeScript | 5.x | Type safety at build time |
| Styling | Tailwind CSS | v4 | Utility-first, zero runtime CSS |
| Font | Geist + Plus Jakarta Sans | — | Modern sans-serif for body + headings |
| Search | Inline scoring (no library) | — | 1KB vs 444KB (Fuse.js removed) |
| Icons | Lucide React | 1.26.0 | Lightweight, tree-shakeable |
| Hosting | Vercel | — | Automatic CDN, free tier |
| CI/CD | GitHub Actions | — | JSON validation, link checking |

## File Structure

```
website/
├── docs/
│   └── spec/                    ← This documentation
├── public/                      ← Static assets
├── scripts/
│   └── generate-data.mjs        ← Build-time data generator
├── src/
│   ├── app/                     ← Next.js App Router pages
│   │   ├── layout.tsx           ← Root layout (fonts, footer)
│   │   ├── page.tsx             ← Home (search + browse)
│   │   ├── not-found.tsx        ← 404 page
│   │   ├── branches/            ← Browse by branch
│   │   ├── degree/              ← B.Tech overview
│   │   ├── semesters/           ← Semester detail
│   │   ├── subjects/            ← Subject document browser
│   │   ├── terms/               ← Terms of Service
│   │   └── privacy/             ← Privacy Policy
│   ├── components/              ← Shared React components
│   │   ├── Navbar.tsx           ← Navigation header
│   │   ├── Footer.tsx           ← Site footer
│   │   ├── Breadcrumbs.tsx      ← Navigation breadcrumbs
│   │   ├── ResultCard.tsx       ← Document card (Pinterest-style)
│   │   ├── PaginatedGrid.tsx    ← Masonry grid with "Show more"
│   │   └── Breadcrumbs.tsx      ← Reusable breadcrumb trail
│   ├── data/
│   │   ├── documents.ts         ← Re-exports from generated
│   │   └── generated-documents.ts ← Auto-generated at build time
│   └── lib/
│       ├── types.ts             ← Document, Branch, FilterState types
│       ├── search.ts            ← Inline search engine
│       ├── images.ts            ← Branch header images
│       └── utils.ts             ← cn(), buildReportIssueUrl()
└── package.json
```
