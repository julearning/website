# JU Learning — Architecture & Design

> **Last updated:** July 26, 2026
> **Organization:** [github.com/julearning](https://github.com/julearning)
> **Live site:** [julearning.vercel.app](https://julearning.vercel.app)

---

## Overview

JU Learning is a **zero-database, zero-backend** static platform for discovering and downloading university study materials. The entire site is pre-rendered at build time from flat JSON files stored in a separate public GitHub repository. There are no API servers, databases, or authentication systems to maintain.

At its core, JU Learning is a **discovery layer** — it doesn't host any files. It aggregates metadata from multiple freely-licensed sources (Open Textbook Library, Wikibooks, OpenStax, Project Gutenberg, and hand-curated Jammu University notes), maps them to a consistent B.Tech curriculum structure, and provides a fast, searchable interface.

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
| **Storage-agnostic** | Only stores third-party links — files live on Google Drive, OneDrive, Dropbox, etc. |
| **Static generation** | 300+ pages pre-rendered, instant load from CDN |
| **Borderless design** | No borders, no shadows, no curves — typography-driven, single accent color |

---

## Repository structure

Three repositories under the `julearning` GitHub organization:

| Repo | Purpose | Visibility | URL |
|------|---------|------------|-----|
| `website` | Next.js frontend (this repo) | Private | github.com/julearning/website |
| `metadata` | All document metadata as JSON files | Public | github.com/julearning/metadata |
| `.github` | Organization profile README | Public | github.com/julearning/.github |

The separation ensures:
- Content contributors only deal with JSON, never touch React code
- Each repo has its own CI/CD pipeline
- Content updates don't require code deployments

---

## Data flow

```
                            BUILD TIME
                                │
    ┌───────────────────────────┴───────────────────────────┐
    │                                                        │
    ▼                                                        ▼
metadata/ (GitHub repo)                              Aggregation scripts
  jammu-university/          ◄── Scrape old website + hand-curated
  open-textbook-library/     ◄── REST API → filter → map → generate
  wikibooks/                 ◄── MediaWiki API → search shelves
  openstax/                  ◄── Wagtail CMS API → list → detail
  project-gutenberg/         ◄── Gutendex API → multi-query → dedup
    │
    │  Cloned at build time by scripts/generate-data.mjs
    ▼
website/scripts/generate-data.mjs
    │  1. Clone julearning/metadata (git clone --depth 1)
    │  2. Recursively scan all .json files
    │  3. Parse each as atomic doc or legacy subject-level file
    │  4. Assign unique IDs (doc-0001 ... doc-NNNN)
    │  5. Write src/data/generated-documents.ts
    ▼
src/data/generated-documents.ts
    │  2,442+ Document[] + helper functions
    │  (auto-generated, not committed to git)
    ▼
Next.js Build (SSG)
    │  Pre-renders 300+ static pages
    ▼
Vercel CDN (static HTML/CSS/JS)
    │
    └───────────────────────────┬───────────────────────────┘
                                │
                            RUNTIME (Browser)
                                │
    ┌───────────────────────────┴───────────────────────────┐
    │                                                        │
    ▼                                                        ▼
Search (Enter or 1s debounce)                         Browse (click)
    │                                                        │
    ▼                                                        ▼
Fuse.js fuzzy search                                   Pre-rendered page
  → scores 2,442+ docs by relevance                      → instant navigation
  → filters by branch/semester/subject/tags/source       → no loading state
  → returns sorted SearchResult[]
    │
    ▼
PaginatedGrid renders 9 per page with infinite scroll

```

---

## Tech stack

| Layer | Choice | Version | Rationale |
|-------|--------|---------|-----------|
| Framework | Next.js (App Router) | 16.2.11 | SSG, file-based routing, edge CDN, Turbopack |
| Language | TypeScript | 5.x | Type safety at build time |
| Styling | Tailwind CSS | v4 | Utility-first, `@theme` tokens, zero runtime |
| Fonts | Geist + Plus Jakarta Sans | — | Modern sans-serif for body + headings |
| Search | Fuse.js | 7.x | Client-side fuzzy search, no API calls |
| Animations | GSAP + ScrollTrigger | 3.15.0 | Scroll-triggered section reveals |
| Icons | Lucide React | — | Minimal — SVG inline preferred |
| PDF thumbnails | Google Drive endpoint | — | `thumbnail?id=ID&sz=w1000` (undocumented, no auth) |
| Hosting | Vercel (free tier) | — | Automatic CDN deployment |
| CI/CD | GitHub Actions | — | JSON validation, link checking on PRs |

---

## Routes

### Top-level nav items (all have search + header)

| Route | Content | Type |
|-------|---------|------|
| `/` | Home — hero search + all browse sections | Full page |
| `/pyq` | Past exam papers — pre-filtered to `pyq` tag | Category |
| `/handwritten` | Scanned handwritten notes — pre-filtered to `handwritten` tag | Category |
| `/digital-notes` | Clean typed notes — pre-filtered to `typed` tag | Category |
| `/branches` | All 5 engineering branches with document counts | Browse |
| `/subjects` | All subjects listed alphabetically | Browse |
| `/degree` | Degrees overview with branches | Browse |

### Browse routes (deep navigation)

| Route | Content |
|-------|---------|
| `/branches/[branch]` | Semesters for a specific branch (e.g., `/branches/cse`) |
| `/semesters/[branch]/[semester]` | Subjects for a branch + semester (e.g., `/semesters/cse/4`) |
| `/subjects/[branch]/[semester]/[subject]` | Documents for a specific subject (e.g., `/subjects/cse/4/DBMS`) |

### Utility routes

| Route | Content |
|-------|---------|
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |
| `/automation/drive` | Secret route — bulk JSON generator from Google Drive links |

---

## Component architecture

```
RootLayout (server — wraps all pages)
├── Navbar (client) — on ALL pages via layout.tsx
│   ├── Logo: "JU Learning" (text-3xl lg:text-4xl extrabold)
│   ├── 6 nav items + GitHub link + ThemeToggle
│   └── Mobile menu at < 1024px (lg breakpoint)
│
├── {page content}
│   │
│   ├── SearchHero (client, reusable)
│   │   Props: title, subtitle, defaultTags[], searchOnMount
│   │   Internal: query, results, loading, sort, tags, sources
│   │   Children: SortDropdown, FilterDropdown, SourceDropdown
│   │
│   ├── PaginatedGrid (client) — infinite scroll results
│   │   └── ResultCard (client) — document cards with thumbnail
│   │
│   ├── RevealSection (client) — GSAP scroll-triggered fade-in
│   │   Props: delay, from (bottom/left/right/none)
│   │
│   └── Browse-specific content (branch cards, subject lists, etc.)
│
└── Footer (server)
    Navigation: Browse links, branch links, GitHub, Terms, Privacy
```

### Key components

| Component | Client? | Purpose |
|-----------|---------|---------|
| `Navbar` | ✅ | Header with nav items, mobile hamburger, theme toggle |
| `Footer` | ❌ | Site-wide footer with navigation and legal links |
| `SearchHero` | ✅ | Core search interface — query, filters, sort, results |
| `ResultCard` | ✅ | Document card with thumbnail, tags, metadata, contributor |
| `PaginatedGrid` | ✅ | Masonry grid with infinite scroll pagination |
| `RevealSection` | ✅ | GSAP scroll-triggered fade-in animation wrapper |
| `Breadcrumbs` | ❌ | Reusable breadcrumb trail for browse pages |
| `SortDropdown` | ✅ | Sort by relevance, newest, oldest, name, size |
| `FilterDropdown` | ✅ | Filter by document type (PYQ, handwritten, typed, etc.) |
| `SourceDropdown` | ✅ | Filter by content source (multi-source support) |
| `ThemeToggle` | ✅ | Light/dark mode toggle with localStorage persistence |

### SearchHero pattern

Every route page uses `SearchHero` the same way:

```tsx
// Home page — search + browse
<SearchHero />

// Category page — filter by tag, auto-search on mount
<SearchHero title="PYQs" subtitle="..." defaultTags={["pyq"]} searchOnMount />

// Browse page — search + content below
<SearchHero title="Branches" subtitle="..." />
```

---

## File structure

```
julearning-root/
├── website/                       ← Next.js app (private repo)
│   ├── docs/
│   │   └── ARCHITECTURE.md       ← This file
│   ├── scripts/
│   │   └── generate-data.mjs     ← Build-time data generator
│   ├── src/
│   │   ├── app/                  ← App Router pages
│   │   │   ├── layout.tsx        ← Root layout (fonts, nav, footer)
│   │   │   ├── page.tsx          ← Home page
│   │   │   ├── not-found.tsx
│   │   │   ├── globals.css       ← Tailwind + design tokens
│   │   │   ├── pyq/page.tsx
│   │   │   ├── handwritten/page.tsx
│   │   │   ├── digital-notes/page.tsx
│   │   │   ├── branches/[branch]/page.tsx
│   │   │   ├── branches/page.tsx
│   │   │   ├── subjects/[branch]/[semester]/[subject]/page.tsx
│   │   │   ├── subjects/page.tsx
│   │   │   ├── semesters/[branch]/[semester]/page.tsx
│   │   │   ├── degree/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   └── privacy/page.tsx
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── SearchHero.tsx
│   │   │   ├── ResultCard.tsx
│   │   │   ├── PaginatedGrid.tsx
│   │   │   ├── RevealSection.tsx      ← GSAP scroll animations
│   │   │   ├── Breadcrumbs.tsx
│   │   │   ├── SortDropdown.tsx
│   │   │   ├── FilterDropdown.tsx
│   │   │   ├── SourceDropdown.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── RelatedDocuments.tsx
│   │   ├── data/
│   │   │   ├── documents.ts          ← Re-exports from generated
│   │   │   └── generated-documents.ts ← Auto-generated at build time
│   │   └── lib/
│   │       ├── types.ts              ← Document, Branch, FilterState
│   │       ├── search.ts             ← Fuse.js search engine
│   │       ├── report.ts             ← Dead link reporting
│   │       ├── images.ts             ← Branch header images
│   │       └── utils.ts              ← Helpers
│   └── package.json
│
└── metadata/                         ← Public content repo
    ├── jammu-university/
    │   └── btech/{branch}/{semester}/{subject}-notes.json
    ├── open-textbook-library/
    │   └── {book-slug}.json
    ├── wikibooks/
    │   └── {book-slug}.json
    ├── openstax/
    │   └── {book-slug}.json
    ├── project-gutenberg/
    │   └── {book-slug}.json
    ├── scripts/
    │   ├── aggregate-open-textbook-library.mjs
    │   ├── aggregate-wikibooks.mjs
    │   ├── aggregate-openstax.mjs
    │   ├── aggregate-gutenberg.mjs
    │   ├── aggregate-internet-archive.py   ← Not finalized
    │   └── scrape-old-website.mjs
    ├── .github/workflows/
    │   └── validate.yml
    └── CONTRIBUTING.md
```

---

## Data model

### Atomic document JSON (one file per document — preferred format)

```json
{
  "title": "DBMS Unit 1 Notes",
  "url": "https://drive.google.com/file/d/FILE_ID/view",
  "tags": ["notes", "typed"],
  "subject": "Database Management Systems",
  "branch": "CSE",
  "semester": 4,
  "section": "section-a",
  "chapters": ["Introduction", "ER Model"],
  "fileSize": 2048576,
  "contributor": "github-username",
  "uploadedAt": "2026-07-25",
  "description": "Complete notes covering Unit 1.",
  "language": "English",
  "pages": 42,
  "source": "jammu-university"
}
```

### Fields

| Field | Required | Notes |
|-------|----------|-------|
| `title` | Yes | Document title |
| `url` | Yes | Public link (any provider) |
| `tags` | Yes | `notes`, `pyq`, `handwritten`, `typed`, `assignment`, `lab-manual`, `syllabus`, `reference-book`, `project-report` |
| `subject` | Yes | Full subject name |
| `branch` | Yes | `CSE`, `ECE`, `EE`, `ME`, `CE` |
| `semester` | Yes | 1–8 |
| `section` | Yes | `section-a`, `section-b`, `mixed` |
| `fileSize` | Yes | In bytes |
| `chapters` | No | Array of chapter/topic names |
| `contributor` | No | GitHub username |
| `uploadedAt` | No | ISO date |
| `description` | No | Brief description |
| `language` | No | Any language — system is language-agnostic |
| `license` | No | License info (e.g., "CC BY-NC-SA 4.0", "Public Domain") |
| `source` | Yes | Content source identifier |

### Generated TypeScript interface

```typescript
export interface Document {
  id: string;           // "doc-0001" ... "doc-NNNN"
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string; // Auto-derived from Google Drive URLs
  fileType: "pdf" | "docx";
  fileSize: number;
  branch: Branch;       // "CSE" | "ECE" | "EE" | "ME" | "CE"
  semester: number;
  subject: string;
  section?: "section-a" | "section-b" | "mixed";
  tags: string[];
  chapters: string[];
  contributor?: string;
  uploadedAt?: string;
  language?: string;
  pages?: number;
  downloads?: number;
  source: string;
}
```

---

## Content sources

### Source 1: Jammu University (459 documents)

| Detail | Value |
|--------|-------|
| **Type** | Hand-curated B.Tech notes |
| **Storage** | Google Drive (contributor-owned) |
| **License** | Contributor's own work |
| **Coverage** | All 5 branches, semesters 1–8 |
| **Format** | PDF, Google Docs |
| **Thumbnails** | ✅ Google Drive auto-generated |

### Source 2: Open Textbook Library (631 documents)

| Detail | Value |
|--------|-------|
| **API** | `open.umn.edu/opentextbooks/textbooks.json` (REST) |
| **Method** | Fetch all pages → filter by relevance → map to JU subjects |
| **License** | CC BY / CC BY-NC / CC BY-SA (implicitly OER) |
| **Format** | Direct PDF URLs from OTL CDN |
| **Thumbnails** | ❌ Not available (shows gradient fallback) |
| **Script** | `aggregate-open-textbook-library.mjs` |

### Source 3: Wikibooks (401 documents)

| Detail | Value |
|--------|-------|
| **API** | `en.wikibooks.org/w/api.php` (MediaWiki) |
| **Method** | Query 7 CS/engineering shelves → dedup → map subjects |
| **License** | CC BY-SA 4.0 |
| **Format** | Links to canonical `en.wikibooks.org/wiki/...` pages |
| **Thumbnails** | ❌ Not available (shows gradient fallback) |
| **Script** | `aggregate-wikibooks.mjs` |

### Source 4: OpenStax (56 documents)

| Detail | Value |
|--------|-------|
| **API** | `openstax.org/apps/cms/api/v2/pages/?type=books.Book` (Wagtail CMS) |
| **Method** | Paginate listing → fetch detail per book → filter → map |
| **License** | CC BY-NC-SA 4.0 (stored in metadata) |
| **Format** | Direct PDF URLs from `assets.openstax.org` |
| **Thumbnails** | ❌ Not available (shows gradient fallback) |
| **Script** | `aggregate-openstax.mjs` |

### Source 5: Project Gutenberg (524 documents)

| Detail | Value |
|--------|-------|
| **API** | `gutendex.com/books` (third-party API) |
| **Method** | 17 search queries → dedup by ID → relevance filter → map |
| **License** | Public Domain (stored in metadata) |
| **Format** | Links to canonical `gutenberg.org/ebooks/{id}` pages |
| **Thumbnails** | ❌ Not available (shows gradient fallback) |
| **Page limit** | 5 pages per query to prevent timeout |
| **Script** | `aggregate-gutenberg.mjs` |

### Catalog summary

| Source | Documents | Method | License |
|--------|:---------:|--------|---------|
| Jammu University | 459 | Hand-curated | Contributor's own work |
| Open Textbook Library | 631 | REST API | CC BY/NC/SA (OER) |
| Wikibooks | 401 | MediaWiki API | CC BY-SA 4.0 |
| OpenStax | 56 | Wagtail CMS API | CC BY-NC-SA 4.0 |
| Project Gutenberg | 524 | Gutendex API | Public Domain |
| **Total** | **2,442** | **5 sources** | |

### Sources excluded (after audit)

| Source | Reason |
|--------|--------|
| NPTEL | No API, legal risk, scraping blocks |
| SWAYAM | No API, gated content |
| eGyanKosh | OAI-PMH blocked (403) |
| NDLI | Auth required, no public API |
| Shodhganga | PhD theses, not B.Tech level |
| arXiv / CORE | Research papers, not study materials |
| BCcampus OpenEd | Cloudflare blocked |
| LearnEngineering / EasyEngineering | Copyright grey area |
| Telegram / WhatsApp sharing | High legal risk |

---

## Search system

### Library: Fuse.js v7

The search runs entirely client-side — no API calls. At build time, the 2,442 documents are embedded in the static JS bundle as a typed array.

### Scoring

Fuse.js uses a weighted fuzzy-search algorithm. Fields and their weights:

| Field | Weight | Notes |
|-------|--------|-------|
| `title` | 0.4 | Highest — exact title match ranks first |
| `subject` | 0.3 | Subject name match |
| `tags` | 0.15 | Document type matches |
| `description` | 0.1 | Description text |
| `chapters` | 0.05 | Syllabus topics |

### Filters (applied before scoring)

| Filter | Source | UI |
|--------|--------|-----|
| Branch | Document metadata | SearchHero dropdown |
| Semester | Document metadata | SearchHero dropdown |
| Subject | Document metadata | SearchHero dropdown |
| Tags | Document tags | FilterDropdown component |
| Sources | Document source field | SourceDropdown component |

### Sort options

| Option | Logic | When to use |
|--------|-------|-------------|
| `relevance` | Fuse.js score ascending | Default — best matches first |
| `newest` | `uploadedAt` descending | Find recently added docs |
| `oldest` | `uploadedAt` ascending | Historical materials |
| `name` | `title` alphabetical | Browse by name |
| `size` | `fileSize` descending | Largest files first |

### Autocomplete

When typing in the search bar, a ghost suggestion appears below the input (opacity text). It matches:
1. Document titles that start with the typed query
2. Subject names that start with the typed query

Press **Tab** to accept the suggestion.

### Debounce

- **Auto-search**: Triggers 1 second after the user stops typing (configurable)
- **Enter**: Triggers immediately and blurs the input (dismisses mobile keyboard)
- Results appear below the hero in a paginated masonry grid

---

## Build process

```bash
npm run build
```

The `prebuild` script (`scripts/generate-data.mjs`) runs automatically:

1. **Clone** — `git clone --depth 1 github.com/julearning/metadata` into a temp directory
2. **Scan** — Recursively find all `.json` files (skipping `.git`, `node_modules`)
3. **Parse** — Each file is either:
   - **Atomic** (preferred): Has `title` + `url` at top level → one document
   - **Legacy subject-level**: Has `subject` + `sections` → flatten into multiple documents
   - **Other**: Skipped (syllabus files, etc.)
4. **Infer source** — First directory segment = source name (`jammu-university`, `open-textbook-library`, etc.)
5. **Assign IDs** — `doc-0001` through `doc-NNNN`
6. **Generate** — Write `src/data/generated-documents.ts` with:
   - `export const documents = [...] as Document[]`
   - Helper functions: `getUniqueBranches()`, `getUniqueSubjects()`, `getUniqueSemesters()`, `getDocumentsByBranch()`

The `as Document[]` assertion (not `: Document[]` annotation) avoids TypeScript's "union type too complex" error on the 2,442-element array literal.

### Build output

```
✓ Compiled successfully in 2.0s
✓ Prerendered 306 static routes
```

---

## Design system

### Visual principles

- **Borderless** — no `border`, no `border-radius`, no `box-shadow` on cards
- **Typography-driven** — hierarchy through weight and size, not boxes
- **White background** — `oklch(0.99 0 0)` pure white throughout
- **Single accent color** — `#BF00FF` (brand purple)
- **Hover state** — cards invert: background becomes brand purple, text becomes white
- **No curves** — `rounded-none` everywhere
- **Masonry layout** — Pinterest-style CSS columns for document grids

### Color palette

```css
/* Light (default) */
:root {
  --bg:      oklch(0.99 0 0);       /* white */
  --fg:      oklch(0.13 0.01 75);   /* near black */
  --muted:   oklch(0.95 0.005 75);
  --muted-fg: oklch(0.55 0.01 75);
  --accent:  oklch(0.93 0.01 75);
  --surface: oklch(1 0 0);          /* pure white for cards */
  --border:  oklch(0.88 0.01 75);
  --brand:   #bf00ff;
}

/* Dark */
.dark {
  --bg:      oklch(0.07 0.005 75);
  --fg:      oklch(0.93 0.005 75);
  --muted:   oklch(0.14 0.005 75);
  --muted-fg: oklch(0.55 0.01 75);
  --accent:  oklch(0.13 0.005 75);
  --surface: oklch(0.105 0.005 75);
  --border:  oklch(0.18 0.005 75);
  --brand:   #bf00ff;               /* same brand in both modes */
}
```

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Site title (hero) | Geist | 5xl sm:7xl lg:8xl | Bold |
| Nav items | Plus Jakarta Sans | xl | Semibold |
| Section headings | Plus Jakarta Sans | lg–xl | Bold/Semibold |
| Card title | Geist | sm | Semibold |
| Taxonomy line | Geist | xs | Normal |
| Badge text | Geist | 11px | Medium |
| Footer links | Geist | sm | Normal |

### Interactive patterns

| Element | Default | Hover | Transition |
|---------|---------|-------|------------|
| Cards (ResultCard) | `bg-surface` | `bg-brand`, text → white | 300ms all |
| Navigation cards | `bg-surface` | `bg-brand`, text → white | 300ms all |
| Nav links | `text-muted-foreground` | `text-foreground` | 200ms color |
| Search input | `ring-1 ring-border/30` | `focus-within:ring-2 ring-brand/20` | 200ms |
| Theme toggle | `text-muted-foreground` | `text-foreground` | 200ms |

### Responsive breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Default | < 640px | Single column |
| `sm` | ≥ 640px | 2 columns |
| `lg` | ≥ 1024px | Desktop nav, 3+ columns |
| `xl` | ≥ 1280px | 4 columns (masonry) |

The mobile menu (hamburger) appears at **1024px** (`lg`), not the default 768px (`md`).

---

## Animations

### GSAP ScrollTrigger

Homepage sections use `RevealSection` (a client component wrapping GSAP + ScrollTrigger):

```tsx
<RevealSection delay={0} from="bottom">
  {/* content fades in when 88% from viewport top */}
</RevealSection>
```

| Section | Delay | Direction |
|---------|-------|-----------|
| PYQs section | 0s | bottom |
| Contributors | 0.1s | bottom |
| Recently Added | 0.15s | bottom |
| Browse by Branch | 0.2s | bottom |
| Browse by Semester | 0.25s | bottom |
| Browse by Subject | 0.3s | bottom |

- **Duration**: 600ms
- **Easing**: `power2.out`
- **Trigger**: `scrollTrigger.start: "top 88%"`
- **Cleanup**: `gsap.context()` reverts on unmount

---

## Automation tool

### `/automation/drive` route

A secret (unlinked) route for bulk metadata generation from Google Drive:

1. **Make folder public** — Set Drive folder to "Anyone with link → Viewer"
2. **Get links** — Use Google Drive Link Getter Chrome extension (List view)
3. **Paste** — Copy tab-separated file list into the textarea
4. **Generate** — Fill defaults (branch, semester, subject, contributor), confirm, download individual JSON files
5. **PR** — Clone metadata repo, drop JSON files, open a pull request

Supported URL patterns: `/file/d/ID/view`, `/document/d/ID/edit`, `/spreadsheets/d/ID/edit`, `/presentation/d/ID/edit`. Videos and images are auto-skipped.

---

## Dead link reporting

Every `ResultCard` has a "Report broken link" link (visible on hover). Clicking opens a pre-filled GitHub Issue:

```
https://github.com/julearning/metadata/issues/new
  ?title=[Broken Link] Document Title
  &body=## Broken Link Report
  **Document ID:** doc-0123
  **URL:** https://drive.google.com/...
  **Issue:** [ ] 404 | [ ] Permission Denied | [ ] Wrong File | [ ] Other
```

Reports accumulate as Issues. Contributors fix them via PRs.

---

## CI/CD

### Metadata repo — GitHub Action (`validate.yml`)

On every PR, validates:

| Check | What it tests |
|-------|---------------|
| JSON validity | All `.json` files parse correctly |
| Required fields | `title`, `url`, `tags`, `subject`, `branch`, `semester`, `section` |
| Branch values | Must be one of `CSE`, `ECE`, `EE`, `ME`, `CE` |
| Semester values | Must be 1–8 |
| URL format | Must be a valid URL |
| Duplicate IDs | No two documents with the same title + branch + subject |

### Website repo — Vercel auto-deploy

On every push to `main`, Vercel:
1. Clones `julearning/metadata` (latest)
2. Runs `prebuild` (generate-data.mjs)
3. Runs `build` (next build)
4. Deploys static output to CDN

---

## Performance

| Metric | Target | Current |
|--------|--------|---------|
| Build time | < 10s | ~4.4s (2.0s compile + 2.4s SSG) |
| Page weight | < 200KB | Minimal (static HTML) |
| Search response | Instant | Client-side Fuse.js |
| External API calls | 0 at runtime | All data embedded at build |
| Lighthouse | 95+ | All static, no JS blocking |

### Optimization decisions

- **`as Document[]`** — Type assertion avoids "union type too complex" on 2,442-element array
- **No runtime API calls** — All data pre-bundled
- **No database** — Everything is flat JSON
- **Minimal icons** — Lucide React with tree-shaking
- **CSS animations** — No heavy animation libraries on main thread (ScrollTrigger only for scroll reveals)
- **No external fonts** — Geist + Plus Jakarta Sans self-hosted via next/font

---

## Current stats

| Metric | Value |
|--------|-------|
| Total documents | 2,442 |
| Content sources | 5 |
| Branches covered | 5 (CSE, ECE, EE, ME, CE) |
| Semesters | 1–8 |
| Static routes | 306 |
| Build time | ~4.4s |
| Contributors | 2+ |
| Storage used | ~3.5MB (all JSON metadata) |

---

## Key design decisions (summary)

### Why no database?
Zero hosting costs, no authentication, no admin dashboard. Content changes through PRs validated by CI. Anyone can contribute via GitHub.

### Why PR-based contributions?
Scalable — anyone can fork, add JSON, submit PR. Transparent — all changes are reviewed. Automated CI catches mistakes. Contributors get GitHub credit.

### Why storage-agnostic?
No vendor lock-in. Contributors use their own Google Drive, OneDrive, Dropbox, etc. Only store links, not files. If a provider goes down, switch to another.

### Why metadata in a separate public repo?
Content contributors only deal with JSON — never touch React code. Website source code stays private. Each repo has independent CI/CD.

### Why GSAP for scroll animations?
Lightweight (~30KB gzipped with ScrollTrigger), well-maintained, excellent scroll-trigger support. Used only for section reveals — not for heavy animation.

### Why Fuse.js?
Simple API, excellent TypeScript support, sufficient for 2,442 documents. Performs all search client-side with no network requests.

### Why 1024px mobile breakpoint?
Nav items are text-heavy (long words like "Handwritten", "Digital Notes"). At 768px (Tailwind default `md`), the nav items would be too cramped.

---

## License compliance

| Source | License | Notes |
|--------|---------|-------|
| Jammu University | Contributor's own work | No rehosting — only linking |
| Open Textbook Library | CC BY/NC/SA (OER) | Links to OTL-hosted PDFs |
| Wikibooks | CC BY-SA 4.0 | Links to canonical wiki pages |
| OpenStax | CC BY-NC-SA 4.0 | Links to OpenStax CDN PDFs |
| Project Gutenberg | Public Domain | Links to canonical ebook pages (per PG linking policy) |

**What we don't do:** We don't rehost any files. We don't hotlink images. We don't bypass paywalls. We only link to publicly accessible, freely licensed content.
