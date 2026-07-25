# JU Learning — Website

Frontend for JU Learning — study materials for Jammu University engineering students.

**Live site:** [julearning.vercel.app](https://julearning.vercel.app)

---

This is a statically generated Next.js app. No backend, no database, no user accounts. All content comes from the [metadata repo](https://github.com/julearning/metadata) at build time.

### Tech stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4 with shadcn/ui primitives
- Fuse.js for search
- TypeScript
- Deployed on Vercel

### Routes

| Path | Page |
|------|------|
| `/` | Search, browse categories, contributor leaderboard |
| `/branches` | All 5 engineering branches |
| `/branches/[branch]` | Semesters for a branch |
| `/semesters/[branch]/[semester]` | Subjects for a branch + semester |
| `/subjects/[branch]/[semester]/[subject]` | Documents for a subject |
| `/degree` | B.Tech overview |
| `/terms` | Terms |
| `/privacy` | Privacy |

### Quick start

```bash
git clone https://github.com/julearning/website
cd website
npm install
npm run dev
```

The predev script clones the metadata repo, reads all JSON files, and generates the document data. You need git and internet access for this.

### Build

```bash
npm run build
```

Generates 289 static pages. Each deploy rebuilds from scratch with the latest metadata.

### Architecture

All document data lives as JSON files in the metadata repo. The website clones that repo during prebuild, flattens everything into a single documents array, and Next.js generates static pages from it. Search is entirely client-side with Fuse.js. No API calls, no server-side logic at runtime.

### License

MIT
