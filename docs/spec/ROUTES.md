# JU Learning — Routes

## Route Map

```
Home                    /                           (page.tsx)
├── Search results      (same page, Enter to search)
├── Browse Branches     → /branches
│                       
├── Degree Overview     /degree                     (degree/page.tsx)
│
├── Branches List       /branches                   (branches/page.tsx)
│   └── Branch Detail   /branches/[branch]          (branches/[branch]/page.tsx)
│       └── Semester     /semesters/[branch]/[semester]  (semesters/[branch]/[semester]/page.tsx)
│           └── Subject  /subjects/[branch]/[semester]/[subject]  (subjects/[...]/page.tsx)
│
├── Terms               /terms                      (terms/page.tsx)
├── Privacy             /privacy                    (privacy/page.tsx)
│
└── 404 (any other)      → custom not-found.tsx
```

## Page Details

### `/` — Home Page

| Property | Value |
|----------|-------|
| Type | Client Component (`"use client"`) |
| Route Segment | `src/app/page.tsx` |
| Static Prop | No (single page, no params) |

**Content:**
- Navbar (logged out, no user concept)
- Hero: "JU Learning" heading + "Study materials, for everyone." tagline
- Search bar (borderless, Enter-to-search, async loading skeleton)
- Browse by Branch grid (shown before first search)
- Result grid (shown after search, PaginatedGrid with ResultCards)
- Footer (at bottom)

**State management:**
| State | Type | Description |
|-------|------|-------------|
| `query` | `string` | Current search input text |
| `results` | `SearchResult[]` | Search results |
| `isLoading` | `boolean` | Loading state (200ms artificial delay for skeleton) |
| `hasSearched` | `boolean` | Whether user has initiated a search |
| `isFocused` | `boolean` | Search input focus state (for hint text) |

### `/branches` — Branch Listing

| Property | Value |
|----------|-------|
| Type | Server Component |
| Route Segment | `src/app/branches/page.tsx` |
| Static Prop | Yes (data from build-time import) |

**Content:**
- Breadcrumbs: Home > Branches
- H1: "Engineering Branches"
- Grid of 5 branch cards (CSE, ECE, EE, ME, CE)
- Each card: icon, full name, description, doc count, semester list

### `/branches/[branch]` — Branch Detail

| Property | Value |
|----------|-------|
| Type | Server Component |
| Route Segment | `src/app/branches/[branch]/page.tsx` |
| Dynamic Params | `branch`: cse, ece, ee, me, ce |
| Static Params | All 5 branches generated via `generateStaticParams()` |

**Content:**
- Breadcrumbs: Home > Branches > {Branch Name}
- Branch header: icon, full name, document + semester count
- Grid of semester cards (Semester 1-8 with subject counts)
- Each card: semester number, subject count, doc count, subject tag list (max 6 + overflow)

### `/semesters/[branch]/[semester]` — Semester Detail

| Property | Value |
|----------|-------|
| Type | Server Component |
| Route Segment | `src/app/semesters/[branch]/[semester]/page.tsx` |
| Dynamic Params | `branch`: slug, `semester`: 1-8 |
| Static Params | All branch-semester combos |

**Content:**
- Breadcrumbs: Home > Branches > {Branch} > Semester {N}
- Header: branch icon, title, subject + document counts
- Grid of subject cards
- Each card: icon, subject name, doc count, total file size, tags, section indicators

### `/subjects/[branch]/[semester]/[subject]` — Subject Detail

| Property | Value |
|----------|-------|
| Type | Server Component (parent) + Client Component (DocumentBrowser) |
| Route Segment | `src/app/subjects/[branch]/[semester]/[subject]/page.tsx` |
| Client Child | `DocumentBrowser.tsx` (client component) |
| Static Params | All unique subject+branch+semester combos (derived from documents) |

**Content:**
- Breadcrumbs: Home > Branches > {Branch} > Semester {N} > {Subject}
- Header: subject name, branch, semester, document count
- DocumentBrowser (client):
  - Inline filter search
  - Section tabs (All, Section A, Section B, Mixed)
  - Tag distribution display
  - PaginatedGrid of ResultCards

### `/degree` — B.Tech Overview

| Property | Value |
|----------|-------|
| Type | Server Component |
| Route Segment | `src/app/degree/page.tsx` |

**Content:**
- Breadcrumbs: Home > B.Tech
- H1: "Bachelor of Technology (B.Tech)"
- Stats: total docs, branches, semesters, subjects
- Grid of branch cards with stats badges

### `/terms` — Terms of Service

| Property | Value |
|----------|-------|
| Type | Server Component |
| Route Segment | `src/app/terms/page.tsx` |

**Content:**
- Breadcrumbs: Home > Terms of Service
- 6 sections in borderless cards: Acceptance, Open Source, Contributions, Liability, Changes, Contact

### `/privacy` — Privacy Policy

| Property | Value |
|----------|-------|
| Type | Server Component |
| Route Segment | `src/app/privacy/page.tsx` |

**Content:**
- Breadcrumbs: Home > Privacy Policy
- 6 sections in borderless cards: Collection, Third-Party, GitHub, Security, Changes, Contact

## Static Generation

All 288+ pages are pre-rendered at build time:

| Route Type | Pages Generated | Generation Method |
|------------|----------------|-------------------|
| `/` | 1 | Single page, no params |
| `/degree` | 1 | Single page, no params |
| `/branches` | 1 | Single page, no params |
| `/branches/[branch]` | 5 | `generateStaticParams()` |
| `/semesters/[branch]/[semester]` | 40 (varies) | `generateStaticParams()` |
| `/subjects/[branch]/[semester]/[subject]` | ~240 (unique) | `generateStaticParams()` |
| `/terms` | 1 | Single page, no params |
| `/privacy` | 1 | Single page, no params |
| 404 | 1 | `not-found.tsx` |

## Navigation Flow

```
Home
├── Search (Enter)
│   └── Results with PaginatedGrid
├── View all → /branches
│   └── Click branch → /branches/cse
│       └── Click semester → /semesters/cse/4
│           └── Click subject → /subjects/cse/4/DBMS
├── Click branch card → /branches/{branch}
├── Navbar Branches → /branches
├── Navbar Degree → /degree
├── Footer links → /branches, /degree, /terms, /privacy
└── Logo → /
```

## Metadata (SEO)

All pages have appropriate metadata via `export const metadata` or `generateMetadata()`:

```tsx
// Layout template ensures consistent title format
export const metadata: Metadata = {
  title: {
    default: "JU Learning",
    template: "%s — JU Learning",
  },
};
```

| Route | Title | Description |
|-------|-------|-------------|
| `/` | JU Learning | Open source study materials for B.Tech students |
| `/branches` | Branches — JU Learning | Browse B.Tech study materials by engineering branch |
| `/branches/cse` | Computer Science & Engineering — JU Learning | Browse 477 study materials for CSE |
| `/degree` | B.Tech Degree — JU Learning | Browse across all engineering branches |
| `/terms` | Terms of Service — JU Learning | Terms of Service |
| `/privacy` | Privacy Policy — JU Learning | Privacy Policy |
