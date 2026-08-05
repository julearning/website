# Contributing to JU Learning Website

PRs are welcome. This document covers what you need to know before sending one.

---

## Setup

```bash
git clone https://github.com/julearning/website
cd website
npm install
npm run dev
```

The dev server starts on port 3000. The predev script clones the metadata repo — you need internet access for the first run. The generated data includes documents from the sources defined in the metadata repo.

## Project structure

```
src/
├── app/
│   ├── page.tsx                   # Home page (search + browse sections)
│   ├── layout.tsx                 # Root layout with Navbar + Footer
│   ├── contribute/               # Single + multiple document submission via PR
│   ├── pyq/                      # Dedicated PYQ page (pre-filtered)
│   ├── handwritten/              # Dedicated handwritten notes page
│   ├── digital-notes/            # Dedicated digital notes page
│   ├── branches/                 # Browse by branch
│   ├── semesters/                # Browse by semester
│   ├── subjects/                 # Browse by subject
│   ├── degree/                   # Degree overview
│   ├── sources/                  # Dynamic sources page
│   ├── contributors/             # Contributor leaderboard
│   ├── terms/
│   └── privacy/
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── SearchHero.tsx            # Search bar + progressive cascade + results
│   ├── ResultCard.tsx            # Document card
│   ├── PaginatedGrid.tsx         # Grid with pagination
│   ├── SortDropdown.tsx
│   ├── TypeFilter.tsx
│   ├── SourceDropdown.tsx
│   ├── Breadcrumbs.tsx
│   └── ContributorCircle.tsx
├── lib/
│   ├── search.ts                 # Custom search + sort
│   ├── types.ts                  # Document, FilterState, DocType
│   ├── hierarchy.ts              # Degree/branch/semester/subject tree
│   ├── slugs.ts                  # Slugify/deslugify utilities
│   ├── preferences.ts            # User preferences (localStorage)
│   ├── contributors.ts           # Contributor aggregation
│   └── report.ts                 # Broken link reporting
├── scripts/
│   └── generate-data.mjs         # Build-time data generator
└── data/
    └── generated-documents.ts    # Auto-generated at build time
```

## Content sources

Sources are defined by the metadata repository's folder structure:
- `jammu-university/` — hierarchical (degree/branch/semester/subject), PR-based contributions
- `other-sources/{name}/` — flat (non-JU sources like wikibooks, openstax)

Each source in `other-sources/` has a `{name}.json` metadata file and a `{name}/` folder with individual document files. The website discovers all sources automatically.

## Metadata path convention

Document JSON files follow this path convention:

```
jammu-university/btech/{branch}/sem-{N}/sem-{N}-{subject}/sem-{N}-{subject}.json
```

Example: `jammu-university/btech/cse/sem-4/sem-4-data-structures-and-algorithms/sem-4-data-structures-and-algorithms.json`

Each file contains an array of document entries (multiple contributions per file):

```json
[
  {
    "title": "DBMS Unit 1 Notes",
    "url": "https://drive.google.com/file/d/.../view",
    "type": "digital",
    "contributor": "github-username",
    "uploadedAt": "2026-07-27"
  }
]
```

## Contributing documents

The website has a built-in contribution flow at `/contribute`:
1. **Single document** — Fill in title, URL, type, and branch/semester/subject. A GitHub username is optional; if omitted, the contribution is credited to JU Learning.
2. **Multiple documents** — Paste a list of Google Drive links, configure each row with branch/semester/subject/type, confirm accessibility, and submit. The GitHub username step is optional.

Every contribution earns **₹10** — for PYQs, notes, documents, anything. A pull request is created automatically for each submission. To claim the reward, email **julearning.com@gmail.com** with your PR link; you'll be contacted soon and will definitely receive your money.

Both modes create a pull request on the metadata repo automatically. No manual JSON editing required.

## Coding conventions

- **TypeScript**. No `any`. No `// @ts-ignore`.
- **Tailwind CSS** for all styling.
- **Server components by default**. Only add `"use client"` when you need interactivity.
- **No `console.log`** in committed code.
- **Imports order**: React/Next → libraries → local components → local utilities → types

## Handle nullable fields gracefully

Documents from different sources have different fields:
- JU documents have `branch`, `semester`, `subject`
- Non-JU documents have `branch: null`, `semester: null`, `subject: null`
- Always use optional chaining and null-safe patterns when accessing document fields

When sorting or creating `Set`s from nullable fields, always filter out nulls first:
```ts
.filter((s): s is number => s != null)
.sort((a, b) => a - b)
```

## Pull request process

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `npm run build` — it must pass with zero errors
4. Open a PR with a clear title and description
5. If your PR changes UI, mention what it looks like (or add a screenshot)

## Build checks

1. **Data generation**: Clones metadata repo, reads JSON, generates `src/data/generated-documents.ts`
2. **Next.js build**: TypeScript check + static page generation

Both must pass. Run locally before pushing.

## Reporting issues

For bugs, open an issue. Include what you expected, what happened, browser and OS.

For broken document links, use the "Report broken link" button on any document card — it creates an issue automatically.
