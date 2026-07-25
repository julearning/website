# Contributing to JU Learning Website

PRs are welcome. This document covers what you need to know before sending one.

---

### Setup

```bash
git clone https://github.com/julearning/website
cd website
npm install
npm run dev
```

The dev server starts on port 3000. The predev script clones the metadata repo — you need internet access for the first run. If you're working on UI changes without needing real data, the sample documents in the generated data should be enough.

### Project structure

```
src/
├── app/
│   ├── page.tsx                    # Home page (search + browse sections)
│   ├── layout.tsx                  # Root layout with Navbar + Footer
│   ├── branches/
│   ├── semesters/
│   ├── subjects/
│   ├── degree/
│   ├── terms/
│   └── privacy/
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── ResultCard.tsx              # Document card in search results
│   ├── RelatedDocuments.tsx        # Related docs on subject pages
│   ├── PaginatedGrid.tsx           # Grid with infinite scroll
│   ├── SortDropdown.tsx
│   ├── FilterDropdown.tsx
│   └── Breadcrumbs.tsx
├── lib/
│   ├── search.ts                   # Fuse.js search + sort
│   └── types.ts                    # Document, Branch, FilterState types
└── data/
    └── documents.ts                # Re-exports from generated-documents.ts
```

### What to work on

Check the [issues](https://github.com/julearning/website/issues) tab. Things that are always helpful:

- Fixing dead links or broken document URLs
- Improving search relevance (tuning Fuse.js options)
- Adding new browse views (e.g., filtering by language or year)
- Improving mobile responsiveness
- Performance improvements (lazy loading, code splitting)
- Accessibility fixes

### Coding conventions

- **TypeScript**. No `any`. No `// @ts-ignore`.
- **Tailwind CSS** for all styling. No CSS modules, no styled-components, no inline styles (except for dynamic values).
- **Server components by default**. Only add `"use client"` when you need interactivity (event handlers, state, effects).
- **Functional components.** No classes. No HOCs when hooks will do.
- **Imports order**: React/Next → libraries → local components → local utilities → types
- **No console.log** in committed code. Use the debugger or a proper logger if needed.

### Component patterns

**Card components** (`ResultCard`, `CategoryCard`, `RelatedCard`):
- Accept a `Document` or `SearchResult` prop
- Use the `group` + `group-hover:` pattern for hover state inversion (white → brand purple)
- Drive thumbnail is auto-generated from the URL via `getThumbnailUrl()`
- Handle thumbnail load failure with `imgFailed` state + letter fallback
- Contributor link should not be nested inside the main card link (invalid HTML)

**Dropdown components** (`SortDropdown`, `FilterDropdown`):
- Click-outside-to-close via `useRef` + `mousedown` event listener
- Absolutely positioned below the trigger button
- No borders, no rounded corners

**Page components:**
- Use `Breadcrumbs` for navigation context
- Use `generateMetadata` for page titles and descriptions
- Filter data with standard array methods (no extra state management)

### Pull request process

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `npm run build` — it must pass with zero errors
4. Open a PR with a clear title and description of what changed and why
5. If your PR changes UI, mention what it looks like (or add a screenshot)
6. Wait for review. Merge happens after at least one approval

### Build checks

The build does two things:
1. **Data generation**: Clones metadata repo, reads JSON, generates `src/data/generated-documents.ts`
2. **Next.js build**: TypeScript check + static page generation

Both must pass. Run locally before pushing.

### Reporting issues

If you find a bug, open an issue. Include:
- What you expected to happen
- What actually happened
- Browser and OS
- Steps to reproduce (if applicable)

For broken document links, use the "Report broken link" button on the website — it pre-fills an issue in the metadata repo automatically.
