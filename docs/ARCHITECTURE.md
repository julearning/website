# JU Learning — Architecture & Design

> **Last updated:** July 27, 2026
> **Organization:** [github.com/julearning](https://github.com/julearning)
> **Live site:** [julearning.vercel.app](https://julearning.vercel.app)

---

## Overview

JU Learning is a **zero-database, zero-backend** static platform for discovering and downloading university study materials. The entire site is pre-rendered at build time from flat JSON files stored in a separate public GitHub repository.

JU Learning is a **discovery layer** — it doesn't host any files. It aggregates metadata from multiple freely-licensed sources, maps them to a consistent B.Tech curriculum structure, and provides a fast, searchable interface.

### Architecture at a glance

```
Content Sources (Google Drive, OTL, Wikibooks, OpenStax, PG, etc.)
        │
        │ Public URLs stored as JSON metadata
        ▼
GitHub — julearning/metadata (public repo, PR-based contributions)
        │
        │ Cloned at build time by the website
        ▼
Next.js Static Build (SSG) — clones metadata, flattens into documents, generates pages
        │
        ▼
Vercel CDN — serves pre-rendered static HTML
```

### Key philosophy

| Principle | Why |
|-----------|-----|
| **No database** | Zero hosting costs, no auth, no admin panel |
| **PR-based content** | Anyone can contribute via GitHub, CI validates automatically |
| **Storage-agnostic** | Only stores links — files live on Google Drive, OneDrive, etc. |
| **Static generation** | Pages pre-rendered, instant load from CDN |
| **Borderless design** | No borders, no shadows, no curves — typography-driven, single accent color |

---

## Repository structure

| Repo | Purpose | Visibility |
|------|---------|------------|
| `website` | Next.js frontend | Private |
| `metadata` | All document metadata as JSON files | Public |
| `.github` | Organization profile README | Public |

---

## Data flow

```
                            BUILD TIME
                                │
    ┌───────────────────────────┴───────────────────────────┐
    │                                                        │
    ▼                                                        ▼
metadata/ (GitHub repo)                              Aggregation scripts
  jammu-university/          ◄── PR-based contributions + curated
  open-textbook-library/     ◄── REST API → filter → map → generate
  wikibooks/                 ◄── MediaWiki API → search shelves
  openstax/                  ◄── Wagtail CMS API → list → detail
  project-gutenberg/         ◄── Gutendex API → multi-query → dedup
    │
    │  Cloned at build time
    ▼
website/scripts/generate-data.mjs
    │  1. Clone julearning/metadata
    │  2. Recursively scan all .json files
    │  3. Parse each file as an array of document objects
    │  4. Assign unique IDs (doc-0001 ... doc-NNNN)
    │  5. Write src/data/generated-documents.ts
    ▼
src/data/generated-documents.ts
    │  Document[] + helper functions
    │  (auto-generated, not committed)
    ▼
Next.js Build (SSG) → Vercel CDN
```

---

## Tech stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 16 (App Router) | SSG, file-based routing, edge CDN |
| Language | TypeScript | Type safety at build time |
| Styling | Tailwind CSS v4 | Utility-first, zero runtime |
| Fonts | Geist + Plus Jakarta Sans | Modern sans-serif |
| Search | Custom in `lib/search.ts` | Client-side, no external deps |
| Icons | Inline SVG | Minimal — no icon library |
| PDF thumbnails | Google Drive endpoint | `thumbnail?id=ID&sz=w1000` |
| Hosting | Vercel (free tier) | Automatic CDN deployment |
| CI/CD | GitHub Actions | JSON validation, link checking on PRs |

---

## Routes

### Top-level

| Route | Content |
|-------|---------|
| `/` | Home — hero search + all browse sections |
| `/pyq` | Past exam papers — pre-filtered to `pyq` type |
| `/handwritten` | Scanned handwritten notes — pre-filtered |
| `/digital-notes` | Clean typed notes — pre-filtered |
| `/branches` | All branches with document counts |
| `/subjects` | All subjects listed alphabetically |
| `/degree` | Degrees overview with branches |
| `/contribute` | Single + multiple document submission (PR-based) |

### Browse routes

| Route | Content |
|-------|---------|
| `/branches/[branch]` | Semesters for a branch |
| `/semesters/[branch]/[semester]` | Subjects for a branch + semester |
| `/subjects/[branch]/[semester]/[subject]` | Documents for a subject |

### Utility routes

| Route | Content |
|-------|---------|
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |

---

## Component architecture

```
RootLayout (server)
├── Navbar (client) — on all pages
│   ├── Logo, nav items, GitHub link
│   └── Mobile menu at < 1024px
├── {page content}
│   ├── SearchHero (client, reusable)
│   │   Props: title, subtitle, defaultType, searchOnMount, defaultSource, hideTypeFilter
│   │   Internal: query, results, sort, type, sources, progressive cascade
│   │   Children: SortDropdown, TypeFilter, SourceDropdown
│   ├── PaginatedGrid (client) — paginated results
│   │   └── ResultCard (client) — document cards with thumbnail
│   └── Browse-specific content
└── Footer (server)
```

### Key components

| Component | Client? | Purpose |
|-----------|---------|---------|
| `SearchHero` | ✅ | Core search — query, progressive cascade (degree→branch→semester→subject), filters, results |
| `ResultCard` | ✅ | Document card with thumbnail, type badge, metadata |
| `PaginatedGrid` | ✅ | Grid with pagination |
| `SortDropdown` | ✅ | Sort by relevance, newest, oldest, name |
| `TypeFilter` | ✅ | Filter by document type (PYQ, handwritten, digital, etc.) |
| `SourceDropdown` | ✅ | Filter by content source |
| `Navbar` | ✅ | Header with nav items, mobile hamburger |
| `Footer` | ❌ | Site-wide footer |
| `Breadcrumbs` | ❌ | Breadcrumb trail for browse pages |

### Progressive cascade

When a user searches JU content, they are guided through a step-by-step filter:

1. **Degree** — Select B.Tech (or other)
2. **Branch** — Select CSE, ECE, EE, ME, CE
3. **Semester** — Select 1–8
4. **Subject** — Select a specific subject
5. **Type** — Optional filter by document type

Each step narrows the available options for the next step. Users can also search directly by typing.

---

## File structure

```
website/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── contribute/page.tsx # Single + bulk document submission
│   │   ├── contribute/api/route.ts # GitHub PR creation API
│   │   ├── pyq/page.tsx
│   │   ├── handwritten/page.tsx
│   │   ├── digital-notes/page.tsx
│   │   ├── branches/
│   │   ├── semesters/
│   │   ├── subjects/
│   │   ├── degree/page.tsx
│   │   ├── contributors/page.tsx
│   │   ├── sources/
│   │   ├── terms/page.tsx
│   │   └── privacy/page.tsx
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── SearchHero.tsx
│   │   ├── ResultCard.tsx
│   │   ├── PaginatedGrid.tsx
│   │   ├── Breadcrumbs.tsx
│   │   ├── SortDropdown.tsx
│   │   ├── TypeFilter.tsx
│   │   └── SourceDropdown.tsx
│   ├── lib/
│   │   ├── search.ts           # Custom search engine
│   │   ├── types.ts            # Document, FilterState, DocType types
│   │   ├── hierarchy.ts        # Degree/branch/semester/subject tree
│   │   ├── slugs.ts            # Slugify/deslugify utilities
│   │   ├── preferences.ts      # localStorage preferences
│   │   ├── contributors.ts     # Contributor aggregation
│   │   └── report.ts           # Broken link reporting
│   └── data/
│       ├── documents.ts        # Re-exports from generated
│       └── generated-documents.ts # Auto-generated at build time
└── metadata/                   # Public content repo (cloned at build)
```

---

## Data model

### Consolidated document JSON (array of entries per subject)

```json
[
  {
    "title": "DBMS Unit 1 Notes",
    "url": "https://drive.google.com/file/d/FILE_ID/view",
    "type": "digital",
    "contributor": "github-username",
    "uploadedAt": "2026-07-27"
  }
]
```

### Fields

| Field | Required | Notes |
|-------|----------|-------|
| `title` | Yes | Document title |
| `url` | Yes | Public link (any provider) |
| `type` | Yes | `handwritten`, `digital`, `pyq`, `assignment`, `lab-manual`, `syllabus`, `reference-book`, `project-report`, `mixed` |
| `contributor` | No | GitHub username |
| `thumbnailUrl` | No | Thumbnail URL |
| `uploadedAt` | No | ISO date |

Multiple documents for the same subject are stored in a single JSON file as an array. The contributor field within each entry identifies who submitted it.

### Generated TypeScript interface

```typescript
export interface Document {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  branch: string;
  semester: number;
  subject: string;
  type: DocType;
  contributor?: string;
  uploadedAt?: string;
  source: string;
}
```

---

## Search system

The search runs entirely client-side — no API calls. The document array is embedded in the static JS bundle at build time.

### Algorithm

Custom search in `lib/search.ts`. No external libraries. Matches by:
- **Title** (highest weight)
- **Subject** name
- **Type** labels

### Filters

| Filter | Source | UI |
|--------|--------|-----|
| Degree | Hierarchy tree | SelectionChip buttons |
| Branch | Hierarchy tree | SelectionChip buttons |
| Semester | Hierarchy tree | SelectionChip buttons |
| Subject | Hierarchy tree | SelectionChip buttons |
| Type | Document `type` field | TypeFilter dropdown |
| Source | Document `source` field | SourceDropdown |
| Sort | Various | SortDropdown (relevance, newest, oldest, name) |

### Search flow

1. User types in search bar or selects a filter
2. Results are filtered by degree/branch/semester/subject/type/source
3. Sorted by the selected sort option
4. Displayed in PaginatedGrid (9 items per page)

---

## Contribution flow

The `/contribute` page allows anyone to add study materials without touching JSON:

### Single document
1. Select source, fill in branch/semester/subject, title, URL, type, and GitHub username
2. The API route creates a new branch on the metadata repo
3. Creates/updates the JSON file at the correct path
4. Opens a pull request for review

### Multiple documents
1. Enter GitHub username
2. Paste a list of tab-separated file names + Drive URLs
3. Configure each row with branch, semester, subject, and type
4. Confirm documents are publicly accessible
5. Submit — creates a single PR with all files

### API route (`/api/contribute`)
- Handles GitHub API interactions: branch creation, file read/write, PR creation
- Merges new entries with existing file content (does not overwrite)
- Generates correct file paths following the `sem-{N}` convention
- Cleans subject names (strips "Sem N" prefix) before slugifying

---

## Design system

### Visual principles

- **Borderless** — no `border`, no `border-radius`, no `box-shadow`
- **Typography-driven** — hierarchy through weight and size
- **White background** — `oklch(0.99 0 0)`
- **Single accent color** — `#BF00FF` (brand purple)
- **Hover state** — cards invert: background becomes brand purple, text becomes white
- **Masonry layout** — CSS columns for document grids

### Color palette

```css
:root {
  --bg:      oklch(0.99 0 0);
  --fg:      oklch(0.13 0.01 75);
  --surface: oklch(1 0 0);
  --muted:   oklch(0.95 0.005 75);
  --muted-fg: oklch(0.55 0.01 75);
  --accent:  oklch(0.93 0.01 75);
  --border:  oklch(0.88 0.01 75);
  --brand:   #bf00ff;
}
.dark {
  --bg:      oklch(0.07 0.005 75);
  --fg:      oklch(0.93 0.005 75);
  --surface: oklch(0.105 0.005 75);
  --muted:   oklch(0.14 0.005 75);
  --muted-fg: oklch(0.55 0.01 75);
  --accent:  oklch(0.13 0.005 75);
  --border:  oklch(0.18 0.005 75);
  --brand:   #bf00ff;
}
```

---

## CI/CD

### Metadata repo — GitHub Action

On every PR, validates:
- JSON validity
- Required fields (`title`, `url`, `type`, `contributor`)
- Branch values (CSE, ECE, EE, ME, CE)
- Semester values (1–8)
- URL format

### Website repo — Vercel auto-deploy

On every push to `main`:
1. Clones `julearning/metadata`
2. Runs `prebuild` (generate-data.mjs)
3. Runs `build` (next build)
4. Deploys static output to CDN

---

## Current stats

| Metric | Value |
|--------|-------|
| Total documents | 2,400+ |
| Content sources | 5 |
| Branches covered | 5 (CSE, ECE, EE, ME, CE) |
| Semesters | 1–8 |
| Contributors | 2+ |

---

## License compliance

| Source | License |
|--------|---------|
| Jammu University | Contributor's own work |
| Open Textbook Library | CC BY/NC/SA (OER) |
| Wikibooks | CC BY-SA 4.0 |
| OpenStax | CC BY-NC-SA 4.0 |
| Project Gutenberg | Public Domain |
