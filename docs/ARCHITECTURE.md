# JU Learning — Architecture & Design

## Overview

JU Learning is a static, open-source platform for sharing university study materials. It follows a **zero-database, zero-backend** philosophy — everything is built from flat JSON files at compile time and served as static assets via CDN.

## Architecture

```
Google Drive / Cloud Storage (any provider)
        │
        │ stores PDFs in human-friendly folders
        │
        │   JU Learning/
        │     B.Tech/
        │       CSE/
        │         Semester 4/
        │           DBMS/
        │             Notes/
        │             PYQs/
        │             Assignments/
        ▼

GitHub Repository (julearning)
    metadata/*.json              ← Document metadata (PR-able JSON)
    .github/workflows/validate   ← Auto-validate PRs

        │
        │ Pull Request → CI Validation → Merge to main
        ▼

Next.js Static Build (SSG)
    ├── Reads all metadata JSON files
    ├── Generates FlexSearch index
    └── Pre-renders all pages

        │
        ▼

Vercel (CDN)
    └── Students search, filter, and download
```

## Key Decisions

### 1. No Database

Metadata lives as JSON files in the GitHub repository. This eliminates:
- Database hosting costs
- Authentication systems
- Admin dashboards
- API maintenance

Content changes happen through Pull Requests, which are validated by GitHub Actions before merge.

### 2. Google Drive as Storage Backend

Files are stored in Google Drive (or any public cloud storage) for:
- **Unlimited bandwidth** — Google handles CDN and streaming
- **Human-friendly folders** — students can browse Drive directly
- **Familiar UI** — non-technical users already understand Drive
- **Multi-provider support** — metadata only stores a URL, so any storage works

### 3. No Collections Entity

Documents are flat — they have tags and attributes. The UI derives "collections" (like "All DBMS Notes" or "Semester 4 PYQs") as filtered views at runtime. No separate collection model to maintain.

### 4. PR-Based Contribution Workflow

```yaml
Contributor:
  1. Forks the repository
  2. Adds a JSON file to metadata/
  3. Opens a Pull Request
    
GitHub Actions:
  1. Validates JSON schema
  2. Checks all required fields
  3. Verifies URL is accessible
  4. Checks for duplicate IDs
  5. Blocks merge on failure

Maintainer:
  1. Reviews the content
  2. Merges the PR
  3. Site auto-rebuilds on Vercel
```

## Data Model

```typescript
interface Document {
  id: string;           // Unique identifier
  title: string;
  description: string;
  url: string;          // Direct download link
  fileType: "pdf" | "docx" | "pptx" | "image";
  fileSize: number;     // bytes

  // Taxonomy
  branch: "CSE" | "ECE" | "EE" | "ME" | "CE";
  degree: "B.Tech";
  semester: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  subject: string;
  topic?: string;

  // Classification
  tags: Array<
    "notes" | "pyq" | "assignment" | "lab-manual" |
    "syllabus" | "handwritten" | "typed" | "reference-book" |
    "project-report"
  >;

  // Metadata
  contributor: string;   // GitHub username
  uploadedAt: string;    // ISO 8601
  verified: boolean;
  downloads?: number;
}
```

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 16 (App Router) | SSG, file-based routing, edge CDN |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS v4 | Utility-first, ultra-lightweight |
| Font | Geist (Vercel) | Modern, technical, fast-loading |
| Search | FlexSearch | Client-side, <10KB, instant fuzzy search |
| Icons | Lucide React | Lightweight, consistent icon set |
| Hosting | Vercel | Automatic ISR, CDN, free tier |
| Storage | Google Drive (or any) | Public URL-based, provider-agnostic |
| CI/CD | GitHub Actions | JSON validation, link checking |

## Design Philosophy

### Visual Direction

The design is inspired by Google Search and Linear — borderless, typography-driven, extremely minimal.

**Principles:**
- **One purpose per page** — the home page is just a search bar
- **Typography is the UI** — hierarchy through weight and color, not boxes
- **Whitespace as separator** — space replaces borders and cards
- **Keyboard-first** — ⌘K for search, arrows to navigate, Esc to close
- **Monochromatic + one accent** — zinc grays + deep blue accent

**Color Palette:**
- Background: `#ffffff`
- Text: `#0a0a0b` (zinc-950)
- Secondary text: `#71717a` (zinc-500)
- Accent: `#2563eb` (blue-600)
- Subtle surfaces: `#fafafa` (zinc-50)
- Borders: `#e4e4e7` (zinc-200)

### Component Tree

```
RootLayout
├── Header (sticky, borderless)
│   ├── Logo + "JU Learning"
│   └── Nav (Browse, About, GitHub)
├── Page Content
│   ├── Home (Hero Search)
│   │   ├── SearchBar
│   │   ├── FilterDropdowns
│   │   ├── TagFilter
│   │   ├── FilterPills
│   │   └── SearchResults
│   │       └── DocumentCard[]
│   ├── Search Modal (⌘K)
│   │   ├── Search Input
│   │   ├── Quick Filters
│   │   └── Results List
│   ├── Browse (Branch Grid)
│   │   └── Branch → Semester → Subject
│   ├── Search Results Page
│   └── About Page
└── Footer
```

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Home — hero search bar |
| `/search?branch=&semester=&subject=` | Search results with filters |
| `/browse` | Browse all branches |
| `/browse/[branch]` | Browse branch → semesters → subjects |
| `/about` | About the project |

## Search Architecture

- **FlexSearch** runs entirely on the client
- Index is built at build time from the metadata JSON
- Search fields weighted by importance: title (10x) > subject (5x) > topic (4x) > description (2x)
- Filters applied before search for performance
- Keyboard navigation (↑↓) and result highlighting

## GitHub Integration

### Broken Link Reporting

Documents display a flag icon on hover. Clicking it opens a pre-filled GitHub Issue:

```
Title: "[Broken Link] DBMS Complete Notes"
Body: Includes document ID, URL, and reason checkboxes
```

### Future: PR Validation Workflow

```yaml
name: Validate Content
on: pull_request
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate JSON
        run: npx ajv validate -s schema.json -d "metadata/*.json"
      - name: Check URLs
        run: npx broken-link-checker metadata/
      - name: Check duplicates
        run: node scripts/check-duplicates.mjs
```

## Performance Goals

- Lighthouse score: 95+ on all metrics
- First Contentful Paint: < 1s
- Search response: < 50ms (client-side)
- Bundle size: < 100KB JS (target)
- Zero external API calls at runtime

## Future Considerations

- **Dark mode** — CSS variables make this trivial to add
- **Document preview** — PDF.js viewer for inline previews
- **Download count tracking** — lightweight analytics via Vercel Analytics
- **Sitemap generation** — for SEO on browse pages
- **RSS/Atom feed** — for new document notifications
