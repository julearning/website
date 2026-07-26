# JU Learning — Architecture & Design

## Overview

JU Learning is a static, open-source platform for sharing university study materials. It follows a **zero-database, zero-backend** philosophy — everything is built from flat JSON files at build time and served as static assets via CDN.

**Live site:** [julearning.vercel.app](https://julearning.vercel.app)  
**Organization:** [github.com/julearning](https://github.com/julearning)

---

## Repository structure

Three repositories under the `julearning` GitHub organization:

| Repo | Purpose |
|------|---------|
| `website` | Next.js frontend — the main website (private) |
| `metadata` | All document metadata as JSON files (public) |
| `.github` | Organization profile README (public) |

---

## Architecture flow

```
Contributor stores files in Google Drive (or any provider)
        │
        │ Folder must be public: Anyone with link → Viewer
        ▼

Contributor uses Drive automation tool at /automation/drive
        │ 1. Pastes file list from Google Drive Link Getter extension
        │ 2. Fills in default values (branch, semester, subject, etc.)
        │ 3. Downloads generated JSON files
        ▼

Pull Request to github.com/julearning/metadata
        │
        │ GitHub Action validates: JSON format, required fields, branch/semester/URL values
        ▼

Maintainer reviews and merges PR
        │
        ▼

Website build (triggered by Vercel on merge)
        │ 1. Clones the metadata repo
        │ 2. Reads all JSON files
        │ 3. Flattens into a single documents array
        │ 4. Generates 289+ static pages
        ▼

Vercel CDN — Students search, filter, and download
```

---

## Tech stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 16 (App Router) | SSG, file-based routing, edge CDN |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS v4 | Utility-first, ultra-lightweight |
| UI library | shadcn/ui primitives | Unstyled, composable components |
| Font | Geist + Plus Jakarta Sans | Modern, readable, fast-loading |
| Search | Fuse.js v7 | Client-side fuzzy search, no API calls |
| Icons | Lucide React (minimal use) | Lightweight |
| Hosting | Vercel (free tier) | Automatic static deployment |
| Storage | Any provider (Google Drive, OneDrive, Dropbox) | Only stores links, not files |
| CI/CD | GitHub Actions | JSON validation on PRs |

---

## Routes

### Top-level nav items (all have search + header)

| Route | Content |
|-------|---------|
| `/` | Home — hero search + browse sections (PYQs, Handwritten, Digital Notes, Contributors, Recent, Branches, Semesters, Subjects) |
| `/pyq` | Past exam papers — pre-filtered to `pyq` tag, auto-shows all PYQs on load |
| `/handwritten` | Scanned handwritten notes — pre-filtered to `handwritten` tag |
| `/digital-notes` | Clean typed notes — pre-filtered to `typed` tag |
| `/branches` | All 5 engineering branches with document counts |
| `/subjects` | All 166+ subjects listed alphabetically |
| `/degree` | B.Tech overview across all branches |

### Browse routes (deep navigation)

| Route | Content |
|-------|---------|
| `/branches/[branch]` | Semesters for a specific branch (e.g., `/branches/cse`) |
| `/semesters/[branch]/[semester]` | Subjects for a branch + semester |
| `/subjects/[branch]/[semester]/[subject]` | Documents for a specific subject |

### Other routes

| Route | Content |
|-------|---------|
| `/terms` | Terms of use |
| `/privacy` | Privacy policy |
| `/automation/drive` | Secret route — bulk JSON generator from Google Drive links |

---

## Component architecture

```
RootLayout (server component)
├── Navbar (client) — appears on ALL pages via layout.tsx
│   ├── Logo: "JU Learning" (text-3xl md:text-4xl extrabold)
│   └── 6 nav items: PYQs, Handwritten, Digital Notes, Branches, Subjects, Degree
│       └── All link to real routes with active state highlighting
│
├── {page content}
│
└── Footer (server)
```

### SearchHero component (client component, reusable)

The core search interface used on every page. Props:
- `title` — page heading (default: "JU Learning")
- `subtitle` — page description (default: "Every branch. Every semester. Every note.")
- `defaultTags` — pre-filter by tags (used on category pages)
- `searchOnMount` — auto-trigger search on load (used on category pages)

Internal state:
- Query, results, loading, sort, active tags
- 3-second debounce for auto-search
- Tab autocomplete (matches titles/subjects)
- Enter to search immediately
- Skeleton loading state while searching

### Page layout patterns

**Home page (`/`):**
```
<Navbar /> (from layout)
<SearchHero />   // Full hero with search
<Browse sections>  // PYQs, Handwritten, Digital Notes, Contributors, Recent, Branches, Semesters, Subjects
<Footer /> (from layout)
```

**Category pages (`/pyq`, `/handwritten`, `/digital-notes`):**
```
<Navbar />
<SearchHero title="..." subtitle="..." defaultTags={["..."]} searchOnMount />
<Footer />
```

**Browse pages (`/branches`, `/subjects`, `/degree`):**
```
<Navbar />
<SearchHero title="..." subtitle="..." />
<Page-specific content>  // Branch cards, subject cards, etc.
<Footer />
```

---

## Design system

### Visual principles

- **Borderless** — no borders, no border-radius, no shadows
- **Typography-driven** — hierarchy through weight and size, not boxes
- **White background** — pure white throughout
- **Single accent color** — `#BF00FF` (brand purple)
- **Hover state** — cards invert: background becomes brand purple, text becomes white, no borders on hover either

### Typography

| Element | Size | Weight |
|---------|------|--------|
| Logo | text-3xl md:text-4xl | Extrabold (800) |
| Nav items | text-xl | Semibold (600) |
| Hero heading | text-5xl sm:text-7xl lg:text-8xl | Bold (700) |
| Section headings | text-2xl | Bold (700) |
| Card title | text-sm | Semibold (600) |
| Body text | text-sm | Normal (400) |

### Colors

```
background:     #ffffff (white)
foreground:     #0a0a0b (near black)
muted:          #71717a (zinc-500)
border:         #e4e4e7 (zinc-200)
accent:         #f4f4f5 (zinc-100)
brand:          #BF00FF (purple)
```

### Interactive patterns

- All cards: `bg-white` → `hover:bg-brand` (text inverts to white)
- All links: no underline by default, `hover:text-foreground` transition
- Search input: `ring-1 ring-border/30` → `focus-within:ring-2 focus-within:ring-brand/20`
- No border-radius anywhere (`rounded-none`)

---

## Data model

### Metadata JSON format (one file per document)

```json
{
  "title": "DBMS Unit 1 Notes",
  "url": "https://drive.google.com/file/d/FILE_ID/view",
  "tags": ["notes", "typed"],
  "subject": "Database Management Systems",
  "branch": "CSE",
  "semester": 4,
  "section": "section-a",
  "chapters": ["Introduction to DBMS", "ER Model", "Relational Model"],
  "fileSize": 2048576,
  "contributor": "your-github-username",
  "uploadedAt": "2026-07-25",
  "description": "Complete notes covering Unit 1.",
  "language": "English",
  "pages": 42
}
```

### Fields

| Field | Required | Notes |
|-------|----------|-------|
| `title` | Yes | Document title |
| `url` | Yes | Public link (any provider — Google Drive, OneDrive, Dropbox, etc.) |
| `tags` | Yes | `notes`, `pyq`, `handwritten`, `typed`, `assignment`, `lab-manual`, `syllabus`, `reference-book`, `project-report` |
| `subject` | Yes | Full subject name |
| `branch` | Yes | `CSE`, `ECE`, `EE`, `ME`, `CE` |
| `semester` | Yes | 1-8 |
| `section` | Yes | `section-a`, `section-b`, `mixed` |
| `fileSize` | Yes | In bytes |
| `chapters` | No | Array of chapter/topic names |
| `contributor` | No | GitHub username |
| `uploadedAt` | No | Date (ISO format) |
| `description` | No | Brief description |
| `language` | No | Any language — system is language-agnostic |
| `pages` | No | Page count |

---

## Search

- **Library:** Fuse.js v7 (client-side only)
- **Scope:** Searches titles, subjects, descriptions, chapters, branches, and tags
- **Scoring:** Weighted by field — exact title match scores highest
- **Filters:** Branch, semester, subject, tags — applied before scoring
- **Sort options:** Relevance (default), newest, oldest, name, size
- **Auto-debounce:** Triggers 3 seconds after the user stops typing
- **Autocomplete:** Tab to complete matches document titles or subjects
- **Results per page:** 9 (paginated with `PaginatedGrid`)

---

## Storage philosophy

The system is **storage-agnostic** — it only stores third-party links, not files.

- Files can be hosted on any provider (Google Drive, OneDrive, Dropbox, etc.)
- Contributors use their own storage — just make sure links are public
- If a link breaks, anyone can submit a PR to update or remove it
- Google Drive thumbnails are auto-generated from the file ID for preview

---

## Automation: Drive to JSON (`/automation/drive`)

A secret route for bulk metadata generation:

1. **Make folder public** — Create a Google Drive folder, set "Anyone with link → Viewer"
2. **Get links** — Use the Google Drive Link Getter Chrome extension in List view
3. **Paste** — Copy the tab-separated file list into the textarea
4. **Generate** — Set defaults (branch, semester, subject, contributor, etc.), confirm, download JSON files
5. **PR** — Clone metadata repo, drop JSON files into correct folder, open a pull request

Supports: `/file/d/ID/view`, `/document/d/ID/edit`, `/spreadsheets/d/ID/edit`, `/presentation/d/ID/edit`. Auto-skips videos and images.

---

## Build process

```bash
npm run build
```

1. Prebuild script clones `github.com/julearning/metadata` into a temp directory
2. Reads all JSON files from the metadata repo
3. Flattens subject-level JSONs into a single documents array
4. Next.js generates 289+ static pages from the data
5. Output deployed to Vercel as static HTML

No API calls at runtime. No database queries. No server-side logic.

---

## Key design decisions

### Why no database?
- Zero hosting costs
- No authentication, no admin dashboard
- Content changes through PRs (validated by CI)
- Anyone can contribute via GitHub

### Why no collections?
- Documents are flat with tags and attributes
- "Collections" are derived as filtered views at runtime
- No separate collection model to maintain

### Why PR-based contributions?
- Scalable — anyone can fork, add JSON, submit PR
- Transparent — all changes are reviewed
- Automated validation catches mistakes
- Contributors get GitHub credit

### Why Fuse.js over FlexSearch?
- Simpler API, well-documented
- Better TypeScript support
- Sufficient for the dataset size (460 documents)

### Why /automation/drive is a secret route?
- Not linked from the Navbar to avoid confusion
- Only accessible by direct URL — for contributors who need it
- Reduces surface area for casual users who don't need it

---

## Current stats

- **Documents:** 460+
- **Branches:** 5 (CSE, ECE, EE, ME, CE)
- **Semesters:** 1-8
- **Subjects:** 166+
- **Static pages:** 289+ (generated at build time)
- **Contributors:** 2+

---

## Performance goals

- Lighthouse score: 95+ on all metrics
- Zero external API calls at runtime
- Search response: instant (client-side Fuse.js)
- Bundle size: minimal (Next.js SSG, no heavy dependencies)
