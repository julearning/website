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

The dev server starts on port 3000. The predev script clones the metadata repo — you need internet access for the first run. The generated data includes ~1,600+ documents across 5 sources.

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
│   ├── automation/drive/
│   ├── terms/
│   └── privacy/
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── SearchHero.tsx             # Search bar + results grid + filters
│   ├── ResultCard.tsx             # Document card in search results
│   ├── CategoryCard.tsx           # Homepage category cards
│   ├── RecentDocs.tsx
│   ├── ContributorCircle.tsx      # Contributor gravity display
│   ├── PaginatedGrid.tsx          # Grid with pagination
│   ├── SortDropdown.tsx
│   ├── TypeFilter.tsx
│   ├── SourceDropdown.tsx
│   ├── Breadcrumbs.tsx
│   └── RevealSection.tsx
├── lib/
│   ├── search.ts                  # Custom search + sort (no external lib)
│   ├── types.ts                   # Document, FilterState types
│   └── report.ts                  # Broken link reporting
└── data/
    └── generated-documents.ts     # Auto-generated at build time
```

## Content sources

The website aggregates documents from five sources. Search results are grouped by source with JU content appearing first.

| Source | Documents | Hierarchy |
|--------|-----------|-----------|
| jammu-university | ~30 | `degree/branch/semester/subject` |
| open-textbook-library | 631 | Flat |
| openstax | 56 | Flat |
| project-gutenberg | 524 | Flat |
| wikibooks | 401 | Flat |

## Coding conventions

- **TypeScript**. No `any`. No `// @ts-ignore`.
- **Tailwind CSS** for all styling. No CSS modules, no styled-components.
- **Server components by default**. Only add `"use client"` when you need interactivity (event handlers, state, effects).
- **No `console.log`** in committed code.
- **Imports order**: React/Next → libraries → local components → local utilities → types

## Component patterns

**Card components** (`ResultCard`, `CategoryCard`):
- Accept a `Document` or `SearchResult` prop
- Use the `group` + `group-hover:` pattern for hover state inversion (white → `#BF00FF`)
- Drive thumbnail auto-generated from URL via `getThumbnailUrl()`
- Handle thumbnail load failure with `imgFailed` state + letter fallback
- Contributor link should not be nested inside the main card link (invalid HTML)

**Dropdown components** (`SortDropdown`, `TypeFilter`, `SourceDropdown`):
- Click-outside-to-close via `useRef` + `mousedown` event listener
- Absolutely positioned below the trigger button
- No borders, no rounded corners, no shadows

**SearchHero**:
- Custom search implementation (not Fuse.js)
- Debounce-based auto-search (1s delay)
- Results grouped by source (JU first, others alphabetically)
- Supports sort, type filter, and source selection

**Page components:**
- Use `Breadcrumbs` for navigation context
- Use `generateMetadata` for page titles and descriptions
- Filter data with standard array methods

## Handle undefined data gracefully

Documents from different sources may have different fields:
- JU documents have `branch`, `semester`, `subject` (from folder hierarchy)
- Non-JU documents may have `subject` but no `branch` or `semester`
- Always use optional chaining (`?.`) and fallbacks when accessing fields that could be undefined

Bad: `doc.branch.toLowerCase()`
Good: `doc.branch?.toLowerCase() || "cse"`

## Pull request process

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `npm run build` — it must pass with zero errors
4. Open a PR with a clear title and description
5. If your PR changes UI, mention what it looks like (or add a screenshot)
6. Wait for review. Merge happens after at least one approval

## Build checks

The build does two things:
1. **Data generation**: Clones metadata repo, reads JSON, generates `src/data/generated-documents.ts`
2. **Next.js build**: TypeScript check + static page generation (18+ routes)

Both must pass. Run locally before pushing.

## Reporting issues

If you find a bug, open an issue. Include:
- What you expected to happen
- What actually happened
- Browser and OS
- Steps to reproduce

For broken document links, use the "Report broken link" button on the website.
