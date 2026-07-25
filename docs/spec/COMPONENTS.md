# JU Learning — Component Map

## Component Hierarchy

```
RootLayout (layout.tsx)
├── Page Content (each route)
│   ├── Home (page.tsx)
│   │   ├── Navbar
│   │   ├── Hero Search
│   │   │   └── Search input (Enter to search)
│   │   ├── Browse by Branch (grid of cards)
│   │   └── PaginatedGrid (search results)
│   │       └── ResultCard[]
│   ├── Degree Page (degree/page.tsx)
│   │   ├── Breadcrumbs
│   │   └── Branch cards (grid)
│   ├── Branches Page (branches/page.tsx)
│   │   ├── Breadcrumbs
│   │   └── Branch cards (grid)
│   ├── Branch Detail (branches/[branch]/page.tsx)
│   │   ├── Breadcrumbs
│   │   └── Semester cards (grid)
│   ├── Semester Detail (semesters/[branch]/[semester]/page.tsx)
│   │   ├── Breadcrumbs
│   │   └── Subject cards (grid)
│   ├── Subject Detail (subjects/[...]/page.tsx)
│   │   ├── Breadcrumbs
│   │   └── DocumentBrowser (client)
│   │       ├── Filter search input
│   │       ├── Section tabs (All, Section A, Section B, Mixed)
│   │       ├── Tag counts display
│   │       └── PaginatedGrid
│   │           └── ResultCard[]
│   ├── Terms Page (terms/page.tsx)
│   │   ├── Breadcrumbs
│   │   └── Section cards
│   └── Privacy Page (privacy/page.tsx)
│       ├── Breadcrumbs
│       └── Section cards
└── Footer (layout.tsx)
```

---

## Navbar (`src/components/Navbar.tsx`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| *none* | — | — | Standalone component; renders fixed header |

| State | Type | Description |
|-------|------|-------------|
| `menuOpen` | `boolean` | Mobile hamburger menu state |
| `pathname` | derived | Current route for active link highlighting |

**Behavior:**
- Desktop: horizontal nav with 3 links (Branches, Degree, GitHub)
- Mobile: hamburger → dropdown overlay with same links
- Closes on route change and window resize to ≥640px
- Active link detection via `pathname.startsWith(link.href)`

**Links:**
| Label | Href | External |
|-------|------|----------|
| Branches | `/branches` | No |
| Degree | `/degree` | No |
| GitHub | `https://github.com/julearning` | Yes |

---

## Footer (`src/components/Footer.tsx`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| *none* | — | — | Standalone server component |

**Data source:** Imports `documents` and `getUniqueBranches` from `@/data/documents` (build-time static data).

**Layout (4-column grid):**

| Column | Content |
|--------|---------|
| Brand | Logo, description, stats badges (docCount, branchCount, semesters) |
| Browse | Links: Branches, Degrees, Search |
| Branches | Quick links: CSE, ECE, EE, ME, CE |
| About | GitHub Organization, Contribute, Terms, Privacy |

**Responsive:** `grid-cols-1 sm:grid-cols-2 md:grid-cols-4`

---

## Breadcrumbs (`src/components/Breadcrumbs.tsx`)

```tsx
<Breadcrumbs items={[
  { label: "Home", href: "/" },
  { label: "Branches", href: "/branches" },
  { label: "Computer Science & Engineering" },
]} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `Crumb[]` | required | Array of breadcrumb items |

```tsx
export type Crumb = {
  label: string;
  href?: string;  // If omitted, rendered as plain text (current page)
};
```

**Styling:** `text-xs text-muted-foreground/60` with `›` separator (styled at `text-muted-foreground/20`). Last item is plain text; all others are links if `href` is provided.

**Used on:** All content pages (degree, branches, branch detail, semester, subject, terms, privacy).

---

## ResultCard (`src/components/ResultCard.tsx`)

```tsx
<ResultCard result={{ doc: Document, score: 0 }} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `result` | `SearchResult` | required | Document + relevance score |

**Internal state:** `imgFailed` tracks Drive thumbnail load failures.

**Card layout:**
1. **Thumbnail** — Drive thumbnail via `getThumbnailUrl()`, variable aspect ratio, fallback gradient `h-56` with `FileText` icon
2. **Type badge** — Overlaid on thumbnail (e.g., "Notes", "PYQ", "Assignment"), capped at 2 tags
3. **Title** — `text-sm font-semibold`
4. **Subject** — `text-xs font-medium text-brand` (always visible)
5. **Taxonomy line** — `{branch} S{semester}` in `text-xs text-muted-foreground/70`
6. **Footer** — File size (left) + Download link (right)

**Styling:** `rounded-2xl`, no border, `shadow-[0_2px_8px_rgba(0,0,0,0.04)]`, `hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]`, `hover:-translate-y-0.5`. Cards have `break-inside-avoid` and `mb-5` for CSS columns masonry.

---

## PaginatedGrid (`src/components/PaginatedGrid.tsx`)

```tsx
<PaginatedGrid
  items={results}
  renderItem={(item) => <ResultCard key={item.doc.id} result={item} />}
  itemsPerPage={9}
  emptyMessage="No results found."
  emptyIcon={<Search className="..." />}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `T[]` | required | Array of items to paginate |
| `renderItem` | `(item: T, index) => ReactNode` | required | Render function per item |
| `itemsPerPage` | `number` | `9` | How many items per page load |
| `emptyMessage` | `string?` | `"Nothing here yet."` | Message when items is empty |
| `emptyIcon` | `ReactNode?` | `null` | Icon shown above empty message |

**Internal state:**
- `page` — Current page number (resets to 1 when items reference changes)
- `prevItemsRef` — Tracks items array reference for reset detection

**Layout:**
- Masonry: `columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4`
- "Show more" button appears when `visibleItems.length < items.length`
- Button: `rounded-2xl bg-foreground px-8 py-3.5 text-sm font-medium text-background`
- Counter: `text-xs text-muted-foreground/50` showing "Showing X of Y"

**Used in:**
- Home page search results (`itemsPerPage=9`)
- DocumentBrowser subject docs (`itemsPerPage=12`)

---

## DocumentBrowser (`src/app/subjects/[...]/DocumentBrowser.tsx`)

```tsx
<DocumentBrowser docs={Document[]} subject={string} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `docs` | `Document[]` | required | All documents for this subject |
| `subject` | `string` | required | Subject name for placeholder text |

| State | Type | Description |
|-------|------|-------------|
| `query` | `string` | Client-side filter search within subject |
| `activeSection` | `string \| null` | Active section tab (null = All) |

**Features:**
1. **Search input** — Real-time filter within subject documents, borderless `rounded-2xl` style
2. **Section tabs** — Shown only when >1 section exists (Section A, Section B, Mixed)
3. **Tag counts** — Shows document type distribution when no filter active
4. **PaginatedGrid** — Results with 12 items per page

---

## Data Files

### `src/data/documents.ts`

```tsx
// Re-exports from auto-generated file
export { documents, getUniqueBranches, getUniqueSubjects, 
         getUniqueSemesters, getDocumentsByBranch } from "./generated-documents";
```

### `src/data/generated-documents.ts`

Auto-generated by `scripts/generate-data.mjs` at build time. Contains:
- `documents: Document[]` — Flat array of all 477 documents
- `getUniqueBranches()` — Returns unique branch names
- `getUniqueSubjects(branch?)` — Returns subjects, optionally filtered by branch
- `getUniqueSemesters(branch?)` — Returns semesters, optionally filtered
- `getDocumentsByBranch(branch)` — Returns documents for a given branch

**Not committed to git** — regenerated on every build.

---

## Library Modules

### `src/lib/search.ts`

Exports:
| Export | Type | Description |
|--------|------|-------------|
| `searchDocuments` | `(docs, filters) => SearchResult[]` | Main search function |
| `SearchResult` | `{ doc: Document; score: number }` | Search result type |

**Scoring algorithm:** Per-word scoring against title (0-0.2), subject (0.15-0.3), description/chapters (0.35-0.4), branch (0.5), tags (0.55), word-level partial matching (0.3-0.45). Score < 1 = match.

**Filters applied before scoring:** branch, semester, subject, tags.

**Sort options:** relevance, newest, oldest, name, size.

### `src/lib/types.ts`

Core types: `Document`, `Branch`, `SubjectMetadata`, `FilterState`, `RawDocument`.

Utility functions: `formatFileSize()`, `getFileIdFromUrl()`, `getThumbnailUrl()`, `getPreviewUrl()`.

### `src/lib/utils.ts`

- `cn()` — Tailwind class merge utility (clsx + tailwind-merge)
- `buildReportIssueUrl()` — Generates pre-filled GitHub Issue URL for broken link reporting

### `src/lib/images.ts`

- `BRANCH_IMAGES` — Unsplash image URLs mapped to each branch for header backgrounds
