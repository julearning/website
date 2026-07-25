# JU Learning — Design System

## Design Philosophy

JU Learning follows a **borderless, Pinterest-inspired** aesthetic — minimal, typography-driven, with soft shadows replacing visible borders. The design prioritizes content (documents) over chrome (UI chrome).

### Core Principles

| Principle | Application |
|-----------|-------------|
| **Content first** | Cards show thumbnails prominently, text is secondary |
| **No borders** | Cards use soft shadows instead of `border` — `shadow-[0_2px_8px_rgba(0,0,0,0.04)]` |
| **Masonry layout** | Pinterest-style CSS columns for document grids |
| **Bigger thumbnails** | Variable-height images at natural aspect ratio |
| **Minimal taxonomy** | Single line: `{subject} · {branch} S{semester}` |
| **Whitespace as separator** | Space replaces borders between sections |

## Color Palette

```css
/* Background */
--color-background: #ffffff;        /* Pure white site background */

/* Text */
--color-foreground: #0a0a0b;       /* Zinc-950 — primary text */
--color-muted-foreground: #71717a;  /* Zinc-500 — secondary text */

/* Accent (brand) */
--color-brand: #2563eb;            /* Blue-600 — subject names, links */

/* Surfaces */
--color-accent: #f4f4f5;           /* Zinc-100 — subtle backgrounds */
--color-border: #e4e4e7;           /* Zinc-200 — only used sparingly */

/* Card shadows (not borders) */
--shadow-card-default: 0 2px 8px rgba(0,0,0,0.04);
--shadow-card-hover: 0 8px 30px rgba(0,0,0,0.08);
--shadow-dropdown: 0 8px 30px rgba(0,0,0,0.08);
```

### Usage Rules

| Token | Where to Use |
|-------|-------------|
| `bg-background` (white) | Page backgrounds, card backgrounds |
| `text-foreground` | Headings, titles, primary text |
| `text-muted-foreground` | Body text, descriptions, metadata |
| `text-muted-foreground/60` | Breadcrumbs, secondary metadata |
| `text-muted-foreground/50` | Footer text, file sizes |
| `text-muted-foreground/30` | Icons, dividers |
| `text-muted-foreground/20` | Empty state icons |
| `text-brand` | Subject names in search results, links |
| `bg-accent` | Badge backgrounds, icon containers |
| `border-border` | UNUSED in card design (except Navbar mobile) |

## Shadow Tokens

All cards and interactive elements follow a consistent shadow system:

```css
/* Default state (cards) */
shadow-[0_2px_8px_rgba(0,0,0,0.04)]

/* Hover state (cards, links) */
hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]

/* Focus state (search bars) */
focus-within:shadow-[0_8px_30px_rgba(0,0,0,0.08)]

/* Dropdown (mobile menu) */
shadow-[0_8px_30px_rgba(0,0,0,0.08)]
```

These are deliberately subtle — a "diffusion shadow" that creates depth without visual noise. No `border` is used on cards.

## Typography

| Element | Font | Size | Weight | Class |
|---------|------|------|--------|-------|
| Site title (hero) | Geist | 5xl–7xl | Bold | `font-bold tracking-tight` |
| Page heading (H1) | Plus Jakarta Sans | 3xl–4xl | Bold | `font-bold tracking-tight` |
| Card title | Geist | sm | Semibold | `font-semibold leading-snug` |
| Subject name | Geist | xs | Medium | `text-xs font-medium text-brand` |
| Taxonomy line | Geist | xs | Normal | `text-xs text-muted-foreground/70` |
| Description | Geist | xs | Normal | `text-xs text-muted-foreground/70` |
| Breadcrumbs | Geist | xs | Normal | `text-xs text-muted-foreground/60` |
| File size | Geist | 11px | Normal | `text-[11px] text-muted-foreground/50` |
| Badge text | Geist | 10-11px | Medium | `text-[10px] font-medium` |
| Footer heading | Geist | xs | Semibold | `text-xs font-semibold uppercase tracking-wider` |
| Footer links | Geist | sm | Normal | `text-sm text-muted-foreground` |

### Font Stack

```css
/* Primary font (body, UI) */
--font-sans: 'Geist', system-ui, sans-serif;

/* Heading font */
--font-heading: 'Plus Jakarta Sans', system-ui, sans-serif;
```

## Spacing System

| Token | Value | Used For |
|-------|-------|----------|
| `gap-4` | 16px | Grid gaps between cards |
| `gap-5` | 20px | CSS column gaps |
| `p-4` | 16px | Card inner padding |
| `p-6` | 24px | Branch/subject/semester card padding |
| `px-6` | 24px | Page horizontal padding |
| `py-12` | 48px | Footer vertical padding |
| `pb-16` | 64px | Page bottom padding |
| `pt-12 sm:pt-16` | 48-64px | Page top padding (below navbar) |
| `mt-10` | 40px | Section spacing |
| `mb-5` | 20px | Masonry card bottom margin |
| `mb-6` | 24px | Section heading margins |

## Layout

```css
/* Default page container */
.mx-auto max-w-6xl px-6 pb-16

/* Search bar */
.max-w-2xl

/* Card grid (search results) */
.columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4

/* Card grid (navigation cards: branches, semesters, subjects) */
.grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3

/* Terms/Privacy content */
.max-w-3xl
```

## Responsive Breakpoints

| Breakpoint | Width | Layout Change |
|------------|-------|---------------|
| Default | < 640px | Single column, stacked |
| `sm` | ≥ 640px | 2 columns |
| `md` | ≥ 768px | Footer: 4 columns |
| `lg` | ≥ 1024px | 3 columns (navigation) |
| `xl` | ≥ 1280px | 4 columns (masonry search results) |

## Navbar

```css
/* Desktop */
<header className="py-5">
  <div className="mx-auto flex max-w-6xl items-center justify-between px-6">

  Nav links: text-sm, gap-5, hover transitions

/* Mobile (< 640px) */
Hamburger menu → dropdown:
  rounded-2xl bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)]
```

## Breadcrumbs

```css
/* Clean, minimal breadcrumb trail */
text-xs text-muted-foreground/60
Separator: › (styled at text-muted-foreground/20)
Last item: text-foreground/60
Links: hover:text-foreground/60
Margin: mb-4
```

## Card Patterns

### ResultCard (Document — Pinterest Style)

```
┌──────────────────────────────┐
│                              │
│          [Thumbnail]         │  ← Variable height, natural aspect ratio
│   [Notes]                    │  ← Badge on image (left-3 top-3)
│                              │
├──────────────────────────────┤
│                              │
│  Database Management System  │  ← Title (text-sm font-semibold)
│  DBMS · CSE S4               │  ← Subject (text-brand) + Taxonomy
│  2.5 MB            Download  │  ← File size + Download link
└──────────────────────────────┘
  No border | rounded-2xl | shadow-[0_2px_8px_rgba(0,0,0,0.04)]
  hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5
  break-inside-avoid | mb-5
```

### Navigation Card (Branch, Semester, Subject)

```
┌──────────────────────────────┐
│        [Icon]                │
│  Computer Science & Engg.    │
│  Software, algorithms, AI... │
│  477 docs · 8 semesters      │
│  [S1] [S2] [S3] [S4] [S5]   │
└──────────────────────────────┘
  Nol border | rounded-2xl | p-6 | same shadow tokens
```

### "Show More" Button

```css
rounded-2xl bg-foreground px-8 py-3.5 text-sm font-medium text-background
hover:opacity-90 hover:-translate-y-0.5
```

### Active Filter / Section Button

```css
/* Active state */
bg-foreground text-background

/* Inactive state */  
bg-accent text-muted-foreground hover:text-foreground
```

## Motion & Transitions

| Element | Transition | Duration | Easing |
|---------|-----------|----------|--------|
| Card hover | `all` | 300ms | Default |
| Image zoom | `transform` | 500ms | Default |
| Shadow changes | `shadow` | 300ms | Default |
| Link hovers | `color` | 200ms | Default |
| Navbar links | `color` | 200ms | Default |

All transitions use CSS native transitions — no animation libraries (framer-motion, GSAP removed for bundle size).
