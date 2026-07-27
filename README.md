# JU Learning — Website

Frontend for JU Learning — a study material directory for engineering students. Discover notes, PYQs, textbooks, and reference materials across multiple sources.

**Live site:** [julearning.com](https://julearning.com)

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
| **Open Textbook Library** | Openly licensed textbooks |
| **Wikibooks** | Freely available textbooks from Wikimedia |
| **OpenStax** | Free peer-reviewed textbooks from Rice University |
| **Project Gutenberg** | Out-of-copyright math and CS books |

Search results are grouped by source — JU content appears first, then other sources alphabetically.

## Routes

| Path | Page |
|------|------|
| `/` | Home — search, PYQ/handwritten/digital categories, browse sections |
| `/contribute` | Single and multiple document submission (creates a PR) |
| `/pyq` | Previous year questions (pre-filtered) |
| `/handwritten` | Handwritten notes (pre-filtered) |
| `/digital-notes` | Digital notes (pre-filtered) |
| `/branches` | All branches |
| `/branches/[branch]` | Semesters for a branch |
| `/semesters/[branch]/[semester]` | Subjects for a semester |
| `/subjects/[branch]/[semester]/[subject]` | Documents for a subject |
| `/degree` | B.Tech overview |
| `/terms` | Terms |
| `/privacy` | Privacy |

## Architecture

1. **Build time**: `scripts/generate-data.mjs` clones the metadata repo, reads all JSON files, and generates a single documents array
2. **Static generation**: Next.js prerenders all pages from this data
3. **Runtime**: Search and filtering are entirely client-side. No API calls, no server logic.

The website is the frontend for a **link directory** — no files are hosted. Every document link points to Google Drive or another public source.

## Contributing documents

Anyone can contribute study materials via the `/contribute` page:
- **Single document**: Fill in title, URL, type, and metadata — a PR is created automatically
- **Multiple documents**: Paste a list of Drive links, configure each one, and submit as a single PR

The API route handles all GitHub interactions: branch creation, file creation/update, and PR creation. Contributor information is read from the submitted JSON, not from filenames.

## Design

All-white background, no borders, no rounded corners, no shadows. Cards invert colors on hover (background → `#BF00FF`, text → white).

## Build

```bash
npm run build
```

Generates all static pages. Each deploy rebuilds from scratch with the latest metadata.

## License

MIT
