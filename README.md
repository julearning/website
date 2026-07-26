# JU Learning — Website

Frontend for JU Learning — a study material directory for engineering students. Discover notes, PYQs, textbooks, and reference materials across 5 sources.

**Live site:** [julearning.vercel.app](https://julearning.vercel.app)

---

Statically generated Next.js app. No backend, no database, no user accounts. All content comes from the [metadata repo](https://github.com/julearning/metadata) at build time.

## Tech stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- TypeScript
- Custom search (no external search library)
- Deployed on Vercel

## Quick start

```bash
git clone https://github.com/julearning/website
cd website
npm install
npm run dev
```

The predev script clones the metadata repo and generates the document data. Requires git and internet.

## Content sources

| Source | Description |
|--------|-------------|
| **Jammu University** | Notes, PYQs, assignments from JU students (curriculum-aligned) |
| **Open Textbook Library** | 631 openly licensed textbooks |
| **OpenStax** | 56 free peer-reviewed textbooks from Rice University |
| **Project Gutenberg** | 524 out-of-copyright math and CS books |
| **Wikibooks** | 401 freely available textbooks from Wikimedia |

Search results are grouped by source — JU content appears first, then other sources alphabetically.

## Routes

| Path | Page |
|------|------|
| `/` | Home page |
| `/branches` | All branches |
| `/branches/[branch]` | Semesters for a branch |
| `/semesters/[branch]/[semester]` | Subjects for a semester |
| `/subjects/[branch]/[semester]/[subject]` | Documents for a subject |
| `/degree` | B.Tech overview |
| `/handwritten` | Handwritten notes |
| `/digital-notes` | Digital notes |
| `/pyq` | Previous year questions |
| `/automation/drive` | Drive link → JSON converter for contributors |
| `/terms` | Terms |
| `/privacy` | Privacy |

## Architecture

1. **Build time**: `scripts/generate-data.mjs` clones the metadata repo, reads all JSON files (1,600+ across 5 sources), and generates a single documents array
2. **Static generation**: Next.js prerenders all pages from this data
3. **Runtime**: Search and filtering are entirely client-side. No API calls, no server logic.

The website is the frontend for a **link directory** — no files are hosted. Every document link points to Google Drive, Open Textbook Library, OpenStax, or another public source.

## Design

All-white background, no borders, no rounded corners, no shadows. Cards invert colors on hover (background → `#BF00FF`, text → white).

## Build

```bash
npm run build
```

Generates all static pages. Each deploy rebuilds from scratch with the latest metadata.

## License

MIT
