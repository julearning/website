# JU Learning — Performance

## Performance Philosophy

JU Learning is designed to be **ultra-lightweight and ultra-fast**. Every dependency and optimization decision is evaluated against the principle: *"Does this make the site faster?"*

### Key Metrics

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint | < 1s | ~0.5s (static CDN) |
| Search Response | < 50ms | ~2ms (inline scoring on 477 docs) |
| Client JS Bundle | < 50KB | ~30KB |
| Total Page Weight | < 200KB | ~100KB (HTML + CSS + minimal JS) |
| Lighthouse Performance | 95+ | TBD |
| Build Time | < 10s | ~5s (generate + compile + 288 pages) |

## Optimization Summary

| Optimization | Impact | What Changed |
|-------------|--------|-------------|
| Remove framer-motion | −5.6MB node_modules | Not imported anywhere; removed from package.json |
| Remove GSAP | −6.3MB node_modules | Not imported anywhere; removed from package.json |
| Replace Fuse.js (444KB) | −444KB client bundle | Replaced with inline `queryScore()` — 50 lines of zero-dependency code |
| Static Site Generation | Instant page loads | All 288 pages pre-rendered at build time |
| CSS columns (no JS masonry) | Zero JS for layout | Pinterest-style masonry via CSS `columns` property |
| No runtime data fetching | Zero network requests | All data embedded in static pages |
| Lucide icons (tree-shakeable) | Minimal icon weight | Only imported icons are bundled |
| Next.js App Router + SSG | Code splitting per page | Only necessary JS loaded per route |

## Bundle Analysis

### Before Optimization

| Dependency | Size (minified) | Notes |
|------------|----------------|-------|
| Fuse.js | ~444KB | Full fuzzy search library |
| framer-motion | ~30KB (gzipped) | Animation library (unused) |
| gsap | ~65KB (gzipped) | Animation library (unused) |
| **Total** | **~539KB+** | Heavy for a notes site |

### After Optimization

| Dependency | Size (minified) | Notes |
|------------|----------------|-------|
| lucide-react | ~15KB (tree-shaken) | Only icons used |
| clsx + tailwind-merge | ~3KB | CSS utility |
| @radix-ui/react-slot | ~2KB | Component primitive |
| class-variance-authority | ~2KB | Variant helper |
| Inline search | ~1KB | Custom scoring (50 lines) |
| **Total** | **~23KB** | Ultra-lightweight |

### Removed Dependencies

| Package | Size | Reason |
|---------|------|--------|
| framer-motion | 5.6MB disk, ~30KB gzip bundle | Zero imports in codebase |
| gsap | 6.3MB disk, ~65KB gzip bundle | Zero imports in codebase |
| fuse.js | 444KB bundle | Replaced with inline scoring |

## Build Metrics

```
✓ Data generation (249 subject files → 477 documents) ~1.5s
✓ TypeScript compilation                                                   ~2s
✓ Static page generation (288 pages)                                      ~1s
──────────────────────────────────────────────────────────
  Total build time                                                        ~5s
```

### Static Pages Generated

| Route Type | Count |
|------------|-------|
| Home | 1 |
| Degree | 1 |
| Branches | 1 |
| Branch detail | 5 |
| Semester detail | ~40 |
| Subject detail | ~240 |
| Terms | 1 |
| Privacy | 1 |
| 404 | 1 |
| **Total** | **~288** |

## Search Performance

The inline search engine (`src/lib/search.ts`) runs in ~2ms for 477 documents:

```typescript
// Scoring tiers (per word):
//  0.00  Exact title match
//  0.10  Title starts with query
//  0.15  Exact subject match
//  0.20  Title includes query / subject starts with
//  0.30  Subject includes query / word-level partial title
//  0.35  Description includes query
//  0.40  Chapters include query
//  0.45  Word-level partial subject
//  0.50  Branch includes query
//  0.55  Tags include query
//  1.00  No match (excluded from results)
```

**Why not Fuse.js?**
- Fuse.js is 444KB for fuzzy matching that we don't need
- Our search needs: exact word matching, partial word matching, and field-weighted scoring
- Custom implementation: ~1KB, no dependencies, instant performance
- Multi-word queries: split into individual words, best score across all words wins

## CSS Strategy

- **Tailwind CSS v4** — utility-first, JIT compilation, zero unused CSS
- **No CSS-in-JS** — no runtime style computation
- **CSS Columns for masonry** — `columns-1 sm:columns-2 lg:columns-3 xl:columns-4` with `break-inside-avoid` on cards — zero JavaScript for layout
- **Hardware-accelerated animations** — `transform` and `opacity` only (no `top`/`left`/`width`/`height`)
- **Native CSS transitions** — no animation libraries (framer-motion, GSAP removed)

## Font Loading

```typescript
const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});
```

- **Geist** — Vercel's proprietary font, optimized for web, ~15KB woff2
- **Plus Jakarta Sans** — Google Font, subset latin, only 4 weights, `display: swap`
- Fonts loaded via `next/font` — auto-optimized, no layout shift

## Image Strategy

- **Google Drive thumbnails** — served from Google's CDN, `loading="lazy"` on all images
- **Fallback gradient** — `bg-gradient-to-br from-accent to-accent/50` with icon for documents without thumbnails
- **No Unsplash dependency** — branch images use direct Unsplash URLs, no SDK
- **`w-full` images** — natural aspect ratio, no fixed dimensions

## Future Optimizations

These would further reduce page weight:

| Optimization | Estimated Impact | Effort |
|-------------|-----------------|--------|
| Lazy load ResultCard images with IntersectionObserver | Deferred thumbnail loading below-fold | Low |
| Preload first 9 search results | Faster initial search display | Low |
| Add `next/image` optimization for thumbnails | Better responsive images | Medium |
| Remove more unused packages (clsx, cva, slot) | -7KB bundle | Medium |
| Convert to fully static with `output: "export"` | No JS runtime on CDN | Low |
