# Research Findings & Design Decisions

> **Last updated:** July 26, 2026
> **Covers:** Web search feasibility, content aggregation research, metadata simplification, search design, automation flow, dark mode removal, design choices

---

## Table of Contents

1. [Web Search for PDFs — Feasibility Research](#1-web-search-for-pdfs--feasibility-research)
2. [Content Source Legal Audit](#2-content-source-legal-audit)
3. [Metadata Simplification Decision](#3-metadata-simplification-decision)
4. [Search Result Segregation Design](#4-search-result-segregation-design)
5. [Automation/Drive Tool Redesign](#5-automationdrive-tool-redesign)
6. [Dark Mode Removal Decision](#6-dark-mode-removal-decision)
7. [GitHub Badge Design Choice](#7-github-badge-design-choice)
8. [File Naming Convention](#8-file-naming-convention)
9. [Document Type System (Tags → Type)](#9-document-type-system-tags--type)
10. [Two-Column Mobile Grid Decision](#10-two-column-mobile-grid-decision)

---

## 1. Web Search for PDFs — Feasibility Research

### Question

Can we augment our static catalog with live web search results for PDFs? Specifically, can users search for educational PDFs across the open web directly from JU Learning?

### Research conducted

2 parallel web researchers were spawned covering:
- DuckDuckGo API availability
- Google Programmable Search Engine (Custom Search API)
- Bing Web Search API free tier
- SerpAPI and other SERP wrappers
- CORE.ac.uk API (academic papers)
- arXiv API
- Legal/ToS implications of automated search queries
- Client-side vs server-side approaches with Next.js

### Findings

| Approach | Free? | Reliable? | Legal? | Works from static site? |
|----------|:-----:|:---------:|:------:|:----------------------:|
| **DuckDuckGo scraping** (unofficial libs) | ✅ Free | ❌ Brittle | ❌ ToS violation | ❌ Would expose scraper |
| **Google Programmable Search API** | 100 req/day free | ✅ | ✅ | ❌ Needs backend proxy for API key |
| **Bing Web Search API** | ❌ Paid only | ✅ | ✅ | ❌ Needs backend |
| **SerpAPI** | 100 req/mo free | ✅ | ⚠️ Grey area | ❌ Needs backend |
| **CORE.ac.uk API** | ✅ Free (1k tokens/day) | ✅ | ✅ Academic only | ❌ Needs backend but content is research, not notes |
| **arXiv API** | ✅ Free | ✅ | ✅ | ❌ STEM preprints only |
| **Self-scraping search engines** | ✅ Free | ❌ Blocks/CAPTCHAs | ❌ ToS violation | ❌ |

### Verdict

**❌ Not feasible for JU Learning** for these reasons:

1. **Every viable search API requires a backend proxy** to hide API keys. JU Learning is a fully static site (SSG on Vercel) with no running backend. Adding Next.js API routes would mean:
   - An always-running server instance (Vercel Serverless Functions can work but add latency)
   - API key management
   - Rate limiting and costs at scale

2. **The content overlap is minimal.** Web search for PDFs returns:
   - Research papers (too advanced for B.Tech)
   - Blog posts exported as PDF (not curriculum-relevant)
   - Copyrighted textbooks (legal risk)
   - Low-quality scanned notes

3. **Our existing static catalog already covers the curriculum** with 2,442+ documents from 5 curated sources, all mapped to the B.Tech syllabus.

4. **The contributor model scales better.** Instead of automated web scraping, the `/automation/drive` tool lets contributors add their own notes from Google Drive. This produces higher-quality, curriculum-specific content.

### Decision

**Do not implement live web search.** The static catalog + contributor model is the right approach for our use case. If the catalog needs to grow, add more curated source adapters (see [content-aggregation.md](./content-aggregation.md)) rather than attempting general web search.

---

## 2. Content Source Legal Audit

### Background

With 5 content sources (Jammu University, Open Textbook Library, OpenStax, Project Gutenberg, Wikibooks) contributing 2,442+ documents, we performed a comprehensive legal audit to ensure every document in the catalog is 100% legal to index and link to.

### Audit methodology

Each source was evaluated against:
1. **License type** — Is the content openly licensed?
2. **Linking policy** — Does the source allow third-party links to their content?
3. **Rehosting policy** — Are we allowed to store/download/rehost?
4. **Attribution requirements** — What attribution is needed?
5. **Terms of Service** — Does our usage violate any ToS?

### Results

| Source | Documents | License | Legal to Index? | Notes |
|--------|:---------:|---------|:---------------:|-------|
| **Jammu University** (Drive links) | 459 | Contributor's own work | ✅ | Contributors upload own notes, retain ownership. JU only indexes links. |
| **Open Textbook Library** | 631 | CC BY, CC BY-NC, CC BY-SA | ✅ | Library is designed for educators to link to. All OER content. |
| **OpenStax** | 56 | CC BY-NC-SA 4.0 | ✅ | Non-commercial use OK. JU is donation-supported, open source. |
| **Project Gutenberg** | 524 | Public Domain (pre-1929) | ✅ | Public domain. Links go to canonical `gutenberg.org/ebooks/{id}` pages (fixed from direct download links per PG policy). |
| **Wikibooks** | 401 | CC BY-SA 4.0 | ✅ | Links go to `en.wikibooks.org/wiki/...` pages. Standard web linking. |

### Legal boundary (what we DON'T do)

- ❌ We do NOT rehost or serve any files ourselves
- ❌ We do NOT hotlink images from any source
- ❌ We do NOT bypass paywalls or access restricted content
- ❌ We do NOT scrape content from sites that prohibit it
- ✅ We only link to publicly accessible, freely licensed content

### License fields in metadata

| Source | License Stored? | Value |
|--------|:--------------:|-------|
| OpenStax | ✅ | `CC BY-NC-SA 4.0` |
| Project Gutenberg | ✅ | `Public Domain` |
| Open Textbook Library | ❌ | Not stored (implicitly OER — future improvement) |
| Wikibooks | ❌ | Not stored (implicitly CC BY-SA — future improvement) |
| JU Notes | ❌ | Contributor's own work (no license field needed) |

### Decision

All 5 sources are legal to index. Adding license fields to OTL and Wikibooks would be a good future improvement but isn't urgently needed — both are universally OER platforms.

---

## 3. Metadata Simplification Decision

### Problem

The original metadata format required contributors to fill in many fields per document:

```json
{
  "title": "...",
  "url": "...",
  "tags": ["notes", "typed"],
  "subject": "...",
  "branch": "CSE",
  "semester": 4,
  "section": "section-a",
  "chapters": [],
  "language": "English",
  "pages": 0,
  "fileSize": 0,
  "description": "...",
  "contributor": "...",
  "uploadedAt": "..."
}
```

This created two problems:
1. **High barrier for contributors** — too many fields, most redundant
2. **Folders already define the hierarchy** — branch, semester, subject, section are already encoded in the folder path

### Analysis

The folder structure already encodes:
```
jammu-university/btech/cse/semester-4/database-management-systems/webtech-aryanbatras.json
```

This tells us:
- **Source:** jammu-university
- **Degree:** btech
- **Branch:** CSE
- **Semester:** 4
- **Subject:** Database Management Systems
- **Contributor:** aryanbatras (from filename)

So the JSON inside only needs:
- `title` — display name of the document
- `url` — the actual download link
- `type` — what kind of document (handwritten, digital, pyq, etc.)
- `uploadedAt` — when it was added (for sorting by recency)

### Fields removed

| Removed Field | Why |
|--------------|-----|
| `tags` | Replaced by single `type` field. Tags were redundant — a document is handwritten OR typed, not both. |
| `subject` | Inferred from folder name |
| `branch` | Inferred from folder hierarchy |
| `semester` | Inferred from folder hierarchy |
| `section` | Inferred from folder name (section-a, section-b, mixed) |
| `chapters` | Inferred from folder structure or file listing |
| `language` | Always English for JU content |
| `pages` | Unreliable — most contributors don't know exact page count |
| `fileSize` | Unreliable — changes based on format |
| `description` | Redundant with title in most cases |

### New simplified format

```json
{
  "title": "Database Management Systems Notes",
  "url": "https://drive.google.com/file/d/.../view",
  "type": "handwritten",
  "contributor": "aryanbatras",
  "uploadedAt": "2026-07-26"
}
```

Or for a subject with multiple files (merged format):

```json
[
  {
    "title": "DBMS Chapter 1 Notes",
    "url": "https://drive.google.com/file/d/.../view",
    "type": "handwritten",
    "contributor": "aryanbatras",
    "uploadedAt": "2026-07-26"
  },
  {
    "title": "DBMS PYQ 2023",
    "url": "https://drive.google.com/file/d/.../view",
    "type": "pyq",
    "contributor": "aryanbatras",
    "uploadedAt": "2026-07-26"
  }
]
```

### Backward compatibility

The TypeScript `Document` interface keeps old fields (`tags[]`, `language`, `section`, `chapters`) as optional for backward compat with existing generated data. Components fall back from `doc.type` → `doc.tags?.[0]` → `""`.

### Decision

New documents should use the simplified format. Old documents will continue to work via backward-compat fallbacks. When a document has both `type` and `tags`, `type` takes precedence.

---

## 4. Search Result Segregation Design

### Problem

When a user searches "math", they get results mixed together from all 5 sources:
- Open Textbook Library math textbooks
- Project Gutenberg math books (historical)
- Jammu University math notes
- Wikibooks math pages
- OpenStax math textbooks

This creates a confusing mix where curriculum-specific JU notes are buried under general reference books.

### Design decision

**Group results by source, with JU always first.**

```ruby
results = search("math")

render:
  Section: "Jammu University"
    [3 results — curriculum-specific notes]
  Section: "Open Textbook Library"
    [12 results — college textbooks]
  Section: "OpenStax"
    [4 results — peer-reviewed textbooks]
  Section: "Project Gutenberg"
    [2 results — historical texts]
  Section: "Wikibooks"
    [8 results — community-written pages]
```

### Implementation

In `SearchHero.tsx`:

1. `searchDocuments()` returns a flat `SearchResult[]` as before
2. `groupBySource()` groups results by `doc.source`:
   - "jammu-university" always gets rank 0 (first)
   - All other sources sorted alphabetically
3. When only one source is active in the filter, results render flat (no headings)
4. When multiple sources are active, each group gets a heading
5. Pagination applies per-group (each group has its own PaginatedGrid)

### Why not mix them?

Mixing by relevance score would bury JU-specific notes under general reference books that happen to match the query better by title length.

### Special handling

- The "Source" dropdown filter still works — if a user selects only "Jammu University", results show flat without headings
- The default state (all sources) shows grouped results

---

## 5. Automation/Drive Tool Redesign

### Problem

The original `/automation/drive` tool had a single defaults form (branch, semester, section, language, chapters, pages, fileSize, description, tags) that applied to ALL uploaded files. This was:
1. **Too many fields** — most are now inferred from folder structure
2. **Not contributor-friendly** — all files got the same tags/subject/branch
3. **Wrong output format** — produced per-file JSONs instead of merged-by-subject JSONs
4. **Wrong file naming** — used `{branch}-sem{semester}-{sanitized-id}.json` instead of `{subject}-{github-username}.json`

### Redesigned flow (4 steps)

```
Step 1: Username
  ┌──────────────────────────────┐
  │ Your GitHub Username         │
  │ [________________________]   │
  │ This becomes the contributor │
  │ field in every generated JSON│
  └──────────────┬───────────────┘
                 ▼
Step 2: Paste
  ┌──────────────────────────────┐
  │ Paste Drive links here       │
  │ (tab-separated from Drive    │
  │  Link Getter extension)      │
  └──────────────┬───────────────┘
                 ▼
Step 3: Table (per-row editing)
  ┌──────┬──────────────┬──────────┬──────────────────┐
  │  #   │ File         │ Type     │ Subject          │
  ├──────┼──────────────┼──────────┼──────────────────┤
  │  1   │ DBMS Notes   │ [▼] Hand│ Database Mgmt    │
  │  2   │ PYQ 2023     │ [▼] PYQ  │ Database Mgmt    │
  │  3   │ Web Tech HW  │ [▼] Assig│ Web Technology   │
  └──────┴──────────────┴──────────┴──────────────────┘
  Type auto-detected from filename (e.g., "PYQ" → pyq).
  Subject must be filled manually.
  All rows must be complete before proceeding.
                 ▼
Step 4: Done (merge + download)
  ┌────────────────────────────────────┐
  │ database-management-aryanbatras.json   │ 2 documents
  │ {                                    │
  │   {"title":"DBMS Notes",...},        │
  │   {"title":"PYQ 2023",...}          │
  │ }                                    │
  └────────────────────────────────────┘
  ┌────────────────────────────────────┐
  │ web-technology-aryanbatras.json        │ 1 document
  │ {                                    │
  │   {"title":"Web Tech HW",...}       │
  │ }                                    │
  └────────────────────────────────────┘
```

### Key changes from v1

| Aspect | Old (v1) | New (v2) |
|--------|----------|----------|
| **GitHub username** | Optional field in defaults form | Required FIRST step |
| **Defaults form** | 11 fields (branch, semester, section, language, chapters, pages, fileSize, description, tags, contributor, subject) | Removed entirely |
| **Per-row editing** | ❌ Global defaults only | ✅ Each row gets its own type dropdown + subject input |
| **Type** | Multi-tag (notes, typed) | Single type (handwritten/digital/pyq/assignment/etc.) |
| **Merging** | None — per-file JSONs | Merged by subject into arrays |
| **File naming** | `{branch}-sem{semester}-{sanitized-id}.json` | `{subject-slug}-{github-username}.json` |
| **JSON fields** | title, url, tags[], subject, branch, semester, section, chapters, language, pages, fileSize, description, contributor, uploadedAt | title, url, type, contributor, uploadedAt |
| **Media filtering** | Videos/images skipped | Videos/images skipped (fixed) |

### Why this design

1. **Contributor-first**: The contributor's GitHub username is the most important piece of info — it's used for attribution, reporting broken links, and the Hall of Fame leaderboard.
2. **Subject merge**: A contributor often uploads multiple files for the same subject. Merging them into one JSON reduces file clutter in the metadata repo and makes the folder structure cleaner.
3. **File naming convention**: `{subject}-{contributor}.json` makes it immediately obvious who contributed what. If a contributor's links go dead, all their files can be identified by their username in the filename.
4. **Simplified JSON**: The folder hierarchy already encodes branch/semester/subject — no need to repeat in the JSON.

---

## 6. Dark Mode Removal Decision

### Problem

Dark mode was implemented using CSS custom properties with a `.dark` class, a toggle button, and localStorage persistence. It caused:
1. **Flickering on page load** — the inline script that reads localStorage adds `dark` class after initial render
2. **Layout shift** — card hover states and background transitions behave differently in dark mode
3. **Maintenance burden** — every new component needs dark mode styles
4. **Inconsistent colors** — the OKLCH values looked different in dark mode than intended

### Research on alternatives

| Approach | Pros | Cons |
|----------|------|------|
| `prefers-color-scheme` only | No toggle, follows OS | No manual control |
| Toggle + localStorage (current) | User control | Flickering, complexity |
| No dark mode | Zero complexity, predictable design | Some users prefer dark |
| System-font inverted colors | Zero code | Unpredictable results |

### Decision

**Remove dark mode entirely.** JU Learning is a light-only website.

Removed:
- `ThemeToggle.tsx` component (deleted)
- `.dark` CSS class + `@custom-variant dark` from `globals.css`
- `suppressHydrationWarning` from `layout.tsx` (needed by dark mode script)
- Inline dark mode script in `<head>` (read localStorage, apply class)
- Theme toggle button from both desktop and mobile nav

---

## 7. GitHub Badge Design Choice

### Requirement

Replace the separate "GitHub" link in the nav bar with a visual badge/overlay that:
- Is always visible in the top-right corner
- Shows the GitHub Octocat icon
- **Responds on hover** (the cat "wakes up")
- Links to the `julearning` GitHub organization

### Options considered

| Option | Description | Chosen? |
|--------|-------------|:-------:|
| **"Fork me on GitHub" ribbon** | Classic fixed-position ribbon in corner | ❌ Too heavy, dated aesthetic |
| **Octocat icon in nav bar** | Inline icon among nav items | ❌ Was the old approach |
| **Fixed overlay badge** | `fixed right-4 top-4 z-50` outside normal flow | ✅ |
| **Footer-only link** | Only in page footer | ❌ Too hidden |

### Final design

```html
<a href="https://github.com/julearning" 
   class="fixed right-4 top-4 z-50 ... hover:scale-110">
  <!-- GitHub Octocat SVG -->
</a>
```

- **Position:** `fixed right-4 top-4 z-50` — sits outside the `<header>` flow, always visible
- **Hover response:** `hover:scale-110` — the cat "responds" with a subtle scale animation
- **Mobile:** Same position, always visible
- **Mobile menu:** Still has "GitHub ↗" link in the mobile menu for tap-friendly access

---

## 8. File Naming Convention

### Requirement

Every JSON file in the metadata repo needs a consistent, human-readable name that makes it immediately obvious:
1. What subject it covers
2. Who contributed it

### Options considered

| Convention | Example | Problem |
|------------|---------|---------|
| Auto-increment ID | `doc-0042.json` | Meaningless — need to open to see what it is |
| Title-based | `dbms-notes-aryanbatras.json` | Too long, title may change |
| **Subject-Contributor** | `webtech-aryanbatras.json` | ✅ Clear, short, durable |
| Contributor-subject | `aryanbatras-webtech.json` | Files from same person don't group together alphabetically |

### Chosen convention

`{subject-slug}-{github-username}.json`

Examples:
- `webtech-aryanbatras.json`
- `dbms-nanakaur.json`
- `maths-content-bot.json`

### Benefits

1. **Alphabetically grouped by subject** when listed in a folder
2. **Immediate identification** of both subject and contributor
3. **Dead link management** — if "nanakaur" deletes her Drive folder, all `*-nanakaur.json` files can be easily identified
4. **No collision risk** — same subject, different contributors = different filenames

### Sanitization rules

- Lowercase
- Spaces → hyphens
- Remove all non-alphanumeric characters (except hyphens)
- Collapse multiple hyphens
- Max 50 characters
- No extension in the slug

---

## 9. Document Type System (Tags → Type)

### Problem

The original system used `tags: string[]` to categorize documents. Common tag combinations:
```json
"tags": ["notes", "typed"]
"tags": ["pyq"]
"tags": ["handwritten"]
"tags": ["assignment", "typed"]
```

This caused:
1. **Combinatorial explosion** — a document could have `notes + typed` or `handwritten + notes` or `pyq + typed`, making filtering complex
2. **Unclear primary type** — is a "handwritten PYQ" a PYQ or handwritten?
3. **Hard to filter** — the FilterDropdown had to support multi-select

### The insight

A document has ONE primary type:
- Is it a **handwritten** scan of notes?
- Is it a **digital** (typed) document?
- Is it a **PYQ** (previous year question)?
- Is it an **assignment**?
- Is it a **lab manual**?
- etc.

The `mixed` type exists for documents that don't fit any category.

### New system: single `type` field

```typescript
type DocType = "handwritten" | "digital" | "pyq" | "assignment" 
            | "lab-manual" | "syllabus" | "reference-book" 
            | "project-report" | "mixed" | "other";
```

### Changes made

| File | Change |
|------|--------|
| `lib/types.ts` | Added `type: DocType` (optional), added `TYPE_LABELS` map, kept `tags?` for backward compat |
| `lib/search.ts` | Filter by `types: DocType[]` instead of `tags: string[]`. Score function uses `type` |
| `components/SearchHero.tsx` | `activeType: DocType | null` instead of `activeTags: string[]` |
| `components/TypeFilter.tsx` | **New** — single-select type dropdown |
| `components/FilterDropdown.tsx` | **Deleted** — replaced by TypeFilter |
| `components/ResultCard.tsx` | Shows single type badge from `TYPE_LABELS` |
| `components/RelatedDocuments.tsx` | Same — single type badge |
| `app/page.tsx` | Category sections filter by `d.type` instead of `d.tags.includes(...)` |
| `app/pyq/page.tsx` | Uses `defaultType="pyq"` instead of `defaultTags={["pyq"]}` |
| `app/handwritten/page.tsx` | Uses `defaultType="handwritten"` |
| `app/digital-notes/page.tsx` | Uses `defaultType="digital"` |
| `app/subjects/.../DocumentBrowser.tsx` | Uses `types: []` instead of `tags: []` |

### Backward compat

The search system uses: `doc.type || doc.tags?.[0] || ""` — so old data with `tags: ["pyq"]` still works when filtering by type "pyq".

---

## 10. Two-Column Mobile Grid Decision

### Problem

On mobile screens (< 640px), search results and browse grids showed in single-column layout. This wasted vertical space and required more scrolling.

### Decision

Change the default mobile layout from 1 column to 2 columns across all grid/column containers.

### Files changed (11 total)

| File | Before | After |
|------|--------|-------|
| `app/page.tsx` (3 grids) | `columns-1 sm:columns-2` | `columns-2 lg:columns-3` |
| `components/PaginatedGrid.tsx` | `columns-1 gap-5 sm:columns-2` | `columns-2 gap-5 lg:columns-3` |
| `components/SearchHero.tsx` | `columns-1 gap-5 sm:columns-2` | `columns-2 gap-5 lg:columns-3` |
| `components/RelatedDocuments.tsx` | `grid-cols-1 sm:grid-cols-2` | `grid-cols-2 gap-5 lg:grid-cols-3` |
| `components/Footer.tsx` | `grid-cols-1 sm:grid-cols-2` | `grid-cols-2 gap-8 md:grid-cols-4` |
| `app/branches/page.tsx` | `grid-cols-1 sm:grid-cols-2` | `grid-cols-2 gap-6 lg:grid-cols-3` |
| `app/branches/[branch]/page.tsx` | `grid-cols-1 sm:grid-cols-2` | `grid-cols-2 gap-6 lg:grid-cols-3` |
| `app/subjects/page.tsx` | `grid-cols-1 sm:grid-cols-2` | `grid-cols-2 gap-6 lg:grid-cols-3` |
| `app/degree/page.tsx` | `grid-cols-1 sm:grid-cols-2` | `grid-cols-2 gap-6 lg:grid-cols-3` |
| `app/semesters/[branch]/[semester]/page.tsx` | `grid-cols-1 sm:grid-cols-2` | `grid-cols-2 gap-6 lg:grid-cols-3` |
| `app/automation/drive/page.tsx` | `grid-cols-1 gap-4 sm:grid-cols-2` | `grid-cols-2 gap-4 lg:grid-cols-3` |

### Rationale

- 2 columns on mobile means ~50% less vertical scrolling
- Card sizes on 320-375px screens are still readable at 2 columns
- The `sm:grid-cols-2` and `sm:columns-2` breakpoints were redundant — just make 2 columns the default and scale up at larger breakpoints

---

## Appendix: Architecture diagram (updated)

```
                    BUILD TIME
                        │
    ┌───────────────────┴───────────────────┐
    │                                        │
    ▼                                        ▼
metadata/ (GitHub repo)               Aggregation scripts
  jammu-university/                   (run locally, commit results)
  open-textbook-library/
  wikibooks/
  openstax/
  project-gutenberg/
    │
    │ Cloned by scripts/generate-data.mjs
    ▼
generate-data.mjs
  → Recursively scans all .json files
  → Assigns IDs, flattens to Document[]
  → Writes src/data/generated-documents.ts
    │
    ▼
Next.js Build (SSG)
  → Prerenders 300+ pages
  → 2,442+ documents indexed
  → Fuse.js bundle for client-side search
    │
    ▼
Vercel CDN
  → Static HTML/CSS/JS
  → Instant loads from edge
    │
    ▼
Browser (Runtime)
  → Search (Enter or 1s debounce)
  → Results grouped by source (JU first)
  → Infinite scroll via PaginatedGrid
  → Browse via pre-rendered pages
```

