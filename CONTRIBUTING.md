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
│   ├── branches/
│   ├── semesters/
│   ├── subjects/
│   ├── degree/
│   ├── handwritten/
│   ├── digital-notes/
│   ├── pyq/
│   ├── contribute/               # Single + bulk document submission
│   ├── sources/                   # Dynamic sources page (reads from metadata)
│   ├── contributors/
│   ├── terms/
│   └── privacy/
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── SearchHero.tsx             # Search bar + results grid + filters
│   ├── ResultCard.tsx             # Document card in search results
│   ├── PaginatedGrid.tsx          # Grid with infinite scroll
│   ├── SortDropdown.tsx
│   ├── TypeFilter.tsx
│   ├── SourceDropdown.tsx
│   ├── Breadcrumbs.tsx
│   └── ContributorCircle.tsx
├── lib/
│   ├── search.ts                  # Custom search + sort (no external lib)
│   ├── types.ts                   # Document, FilterState types
│   └── report.ts                  # Broken link reporting (creates GitHub issue)
├── scripts/
│   └── generate-data.mjs          # Build-time data generator
└── data/
    └── generated-documents.ts     # Auto-generated at build time
```

## Content sources

Sources are defined by the metadata repository's folder structure:
- `jammu-university/` — hierarchical (degree/branch/semester/subject)
- `other-sources/{name}/` — flat (non-JU sources like wikibooks)

Each source in `other-sources/` has a `{name}.json` metadata file (name, description, url) and a `{name}/` folder with individual document files. The website discovers all sources automatically — add a new folder to the metadata repo and it appears on the next build.

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

Bad: `d.branch === branch`  
Good: `d.branch && d.branch === branch`

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
2. **Next.js build**: TypeScript check + static page generation (33+ routes)

Both must pass. Run locally before pushing.

## Reporting issues

For bugs, open an issue. Include what you expected, what happened, browser and OS.

For broken document links, use the "Report broken link" button on any document card — it creates an issue automatically.
