# Content Aggregation — Comprehensive Audit & Specification

> **Status:** Final audit (24+ web researchers deployed across 2 phases)
> **Last updated:** July 26, 2026

---

## Executive Summary

We evaluated **24+ sources** across open textbooks, Indian-specific educational repositories, public archives, academic APIs, community collections, and web archives. The result is a prioritized 3-tier roadmap for populating the metadata repo with freely-available engineering study materials.

**Key finding:** The best approach is NOT to rely on a single source, but to build a **source-adapter pipeline** that aggregates from 5-6 well-chosen sources during local development, generating metadata JSONs that get committed to the metadata repo.

---

## Full Audit Results (All 24+ Sources)

### Phase 1 Researchers: Deep Technical Audits

---

#### 1. NPTEL (nptel.ac.in)

| Factor | Finding |
|--------|---------|
| **Public API** | ❌ No public API exists |
| **PDF download without enrollment** | ❌ Generally requires enrollment (free). Some course pages expose PDFs |
| **URL patterns** | Course-specific, no predictable pattern |
| **Community scrapers** | Exist on GitHub (`nptel-downloader`) but fragile, often break, may violate ToS |
| **Robots.txt** | Restrictive — blocks automated crawling |
| **License** | Varies. NPTEL content often CC-BY-NC-SA. Individual faculty retain copyright |
| **Relevance to JU** | ⭐⭐⭐⭐⭐ Highly relevant — Indian engineering curriculum |
| **Verdict** | Too risky for automated aggregation. Consider manual curation of NPTEL links via PRs |

**Bottom line:** Skip automated NPTEL aggregation. Too legally and technically risky. Manual PR contributions for NPTEL links only.

---

#### 2. SWAYAM (swayam.gov.in)

| Factor | Finding |
|--------|---------|
| **Public API** | ❌ No public API or RSS feed |
| **Materials without enrollment** | ❌ Full materials gated behind enrollment |
| **Course organization** | By National Coordinator (NPTEL, UGC, CEC, AICTE). Course IDs in URLs |
| **Community scrapers** | Fragile, break often due to fragmented subdomain architecture |
| **Robots.txt** | Restrictive |
| **License** | Copyright-protected unless explicitly CC-licensed |
| **Verdict** | Skip. Not accessible programmatically. |

---

#### 3. National Digital Library of India (NDLI - ndl.iitkgp.ac.in)

| Factor | Finding |
|--------|---------|
| **Public API** | ⚠️ OAI-PMH exists but NOT publicly documented for third-party devs |
| **PDF downloads** | ❌ Most full-text gated behind login/registration |
| **Role** | Acts as a **discovery layer** — links out to host repositories |
| **Relevance to JU** | ⭐⭐⭐⭐⭐ Highly relevant — all Indian academic disciplines |
| **License** | Varies per source — no unified license |
| **Scraping legality** | ❌ Legally inadvisable. ToS restricts automated access |
| **Verdict** | Skip automated. If you want NDLI content, contact them directly for institutional partnership. |

---

#### 4. eGyanKosh (IGNOU - egyankosh.ac.in)

| Factor | Finding |
|--------|---------|
| **OAI-PMH endpoint** | ✅ `https://egyankosh.ac.in/oai/request` |
| **PDF downloads** | ✅ DIRECTLY downloadable — no login required |
| **Engineering content** | ✅ School of Engineering & Technology has thousands of modules |
| **License** | ⚠️ IGNOU Open Access — non-commercial, non-derivative. NOT CC-licensed usually |
| **DSpace-based** | ✅ Structured using DSpace Communities & Collections |
| **Relevance to JU** | ⭐⭐⭐ Medium — IGNOU materials cover similar topics but are not JU-specific |
| **Verdict** | **✅ Recommended.** OAI-PMH harvestable, PDFs directly downloadable, engineering content available. |

**Technical details:**
- Base URL: `https://egyankosh.ac.in/oai/request`
- List records: `?verb=ListRecords&metadataPrefix=oai_dc`
- Filter by set: Use `ListSets` first to find engineering communities
- Rate limit: Be polite — space requests, respect `Retry-After`
- Volume: 2,200+ total courses, engineering/CS is a major portion

---

#### 5. Shodhganga (shodhganga.inflibnet.ac.in)

| Factor | Finding |
|--------|---------|
| **OAI-PMH endpoint** | ✅ `https://shodhganga.inflibnet.ac.in/oai/request` |
| **PDF downloads** | ✅ Yes, but split into multiple files per thesis (chapters, TOC, etc.) |
| **REST API** | ❌ No REST API — OAI-PMH only |
| **Subject filtering** | ✅ Can browse by department/university |
| **Theses count** | 600,000+ total theses, tens of thousands in engineering |
| **License** | ✅ CC-BY-NC 4.0 mostly — open access for non-commercial |
| **Relevance to JU** | ⭐⭐ Low — PhD theses too advanced for B.Tech notes |
| **Verdict** | ❌ Skip for B.Tech notes. Theses are research-level, not undergraduate teaching materials. |

---

#### 6. Internet Archive (archive.org)

| Factor | Finding |
|--------|---------|
| **API/library** | ✅ `internetarchive` Python library (CLI + Python module) |
| **PDF downloads** | ✅ Yes, via S3-compatible API |
| **Rate limits** | ⚠️ ~15 requests/min for general API. Use exponential backoff |
| **Subject filtering** | ✅ Lucene-like query: `subject:"engineering" AND mediatype:"texts" AND (licenseurl:"http://creativecommons.org/..." OR publicdomain:true)` |
| **Bulk data** | ✅ Official datasets available at archive.org/details/datasets |
| **Engineering textbooks** | ✅ THOUSANDS available. Filter by subject + language + downloads |
| **License** | Mixed: Public Domain + CC BY + CC BY-NC + All Rights Reserved |
| **Attribution** | Required for CC items. Always include source URL |
| **Relevance to JU** | ⭐⭐⭐ Medium — good for foundational textbooks, less for JU-specific curriculum |
| **Verdict** | **✅ Recommended.** Massive collection, good API, but must carefully filter by license. |

**Usage pattern:**
```python
from internetarchive import search_items, get_item

# Search for engineering textbooks
search = search_items('subject:"engineering" AND mediatype:texts AND language:eng')

# For each result, get item and download PDF
for result in search:
    item = get_item(result['identifier'])
    # Check license before downloading
    if 'licenseurl' in item.metadata:
        # Download PDF
        item.download(formats=['PDF'])
```

---

#### 7. Wikibooks (en.wikibooks.org)

| Factor | Finding |
|--------|---------|
| **MediaWiki API** | ✅ Fully open, CORS-friendly |
| **Native PDF export** | ❌ DECOMMISSIONED. No official PDF export API anymore |
| **Alternative for PDF** | ⚠️ Must aggregate wiki pages and convert via `wkhtmltopdf`, Puppeteer, or similar |
| **CS books count** | 549 pages in `Shelf:Computer_science/all_books` (includes chapters, not just books) |
| **Key categories** | `Category:Shelf:Computer_science/all_books`, `Category:Subject:Computer_science` |
| **Rate limits** | 10 req/min (unauthenticated), 200 req/min (with User-Agent), 2,000 req/min (authenticated) |
| **Metadata available** | ✅ Yes via `action=query&prop=info|pageprops` |
| **License** | CC-BY-SA |
| **Relevance to JU** | ⭐⭐⭐ Medium — covers CS topics (DBMS, OS, Networks, DS, Algorithms) |
| **Verdict** | **✅ Recommended** but with caveats — no native PDF export means we must build our own PDF generation from wiki markup, or just link to Wikibooks HTML pages. |

**API example:**
```
https://en.wikibooks.org/w/api.php?action=query&list=categorymembers
  &cmtitle=Category:Shelf:Computer_science/all_books
  &format=json&origin=*
```

---

#### 8. Open Textbook Library (open.umn.edu/opentextbooks)

| Factor | Finding |
|--------|---------|
| **REST API** | ✅ Available (OAS 3.0 documented) |
| **Endpoints** | `GET /textbooks.json`, `GET /subjects.json`, `GET /textbooks/{id}.json` |
| **Direct PDF URLs** | ✅ Available in API responses |
| **Total textbooks** | 1,700+ across all subjects |
| **Subject filtering** | ✅ Via `/subjects.json` endpoint |
| **Rate limits** | No explicit published limits — be responsible |
| **License** | ✅ CC BY, CC BY-NC, CC BY-SA, Public Domain |
| **Relevance to JU** | ⭐⭐⭐ Medium — college-level textbooks for first/second-year subjects |
| **Verdict** | **✅ Highly recommended.** Clean REST API, direct PDF links, clear licensing, good volume. |

---

#### 9. OpenStax (openstax.org)

| Factor | Finding |
|--------|---------|
| **Official API** | ❌ No public API |
| **Predictable URL pattern** | ❌ NOT reliable — patterns change with site updates |
| **Book listing** | ⚠️ Must scrape their Subjects page (requires JS rendering) |
| **Number of books** | ~60+ peer-reviewed textbooks |
| **Subjects** | Physics, Calculus, Chemistry, Biology, Statistics, Economics, Psychology, Sociology |
| **License** | CC BY-NC-SA 4.0 (NON-COMMERCIAL) |
| **Bulk download** | ❌ Strongly discouraged — rate limiting, IP bans |
| **Partner program** | ✅ For legitimate educational use, contact via openstax.org/partners |
| **Relevance to JU** | ⭐⭐⭐ Medium — first-year subjects (Physics, Maths) |
| **Verdict** | **⚠️ Use with caution.** No API, CC BY-NC-SA limits commercial use, scraping discouraged. Best approached via manual download for a few key books. |

---

#### 10. Project Gutenberg (gutenberg.org)

| Factor | Finding |
|--------|---------|
| **Official API** | ❌ No official REST API |
| **Bulk access** | ✅ Robot harvest server: `www.gutenberg.org/robot/harvest` (with 2s delay) |
| **Catalog dump** | ✅ CSV catalog updated weekly, RDF/XML also available |
| **Third-party API** | ✅ Gutendex (gutendex.com) — unofficial but popular REST API |
| **PDFs** | ✅ Available but not for all books (TXT and EPUB are more common) |
| **Engineering content** | ⚠️ Mostly historical (pre-1929). Foundational math/physics but no modern engineering |
| **License** | ✅ Public Domain |
| **Relevance to JU** | ⭐⭐ Low — classic literature, historical science. Few engineering textbooks |
| **Verdict** | **❌ Low priority.** Historical content has limited value for modern B.Tech curriculum. Gutendex API is useful but creator advises against production use — recommends self-hosting. |

---

#### 11. Google Books API

| Factor | Finding |
|--------|---------|
| **REST API** | ✅ Free with API key |
| **Rate limits** | 1,000 requests/day free tier |
| **Filter for free books** | ✅ `filter=free-ebooks` or `filter=full` |
| **Direct PDF downloads** | ❌ Preview links only, NOT direct PDF download URLs |
| **Metadata** | ✅ Rich metadata (ISBN, authors, description, subjects, ratings) |
| **Full-view engineering textbooks** | Unknown count — depends on copyright status |
| **Relevance to JU** | ⭐⭐ Low — mostly previews, not downloadable PDFs |
| **Verdict** | **❌ Skip for content aggregation.** Previews aren't downloadable PDFs. Use Open Library API instead for open access books. |

---

#### 12. arXiv.org

| Factor | Finding |
|--------|---------|
| **API endpoint** | ✅ `http://export.arxiv.org/api/query` |
| **Response format** | Atom 1.0 (XML) |
| **Subject filtering** | ✅ `cat:cs.LG`, `cat:math.*`, `cat:stat.*` etc. |
| **Rate limits** | 1 request per 3 seconds, single connection |
| **PDF downloads** | ✅ Free — but cannot rehost on your servers |
| **CS volume** | Hundreds of thousands of papers |
| **Survey papers** | ✅ Searchable: `ti:survey AND cat:cs.LG` |
| **License** | Varies — authors retain copyright |
| **Relevance to JU** | ⭐⭐ Low-medium — research papers, not teaching materials |
| **Verdict** | **❌ Skip for B.Tech notes.** Research papers aren't undergraduate study materials. |

---

#### 13. Indian Engineering Notes Websites (LearnEngineering, EasyEngineering, etc.)

| Factor | Finding |
|--------|---------|
| **API availability** | ❌ No APIs |
| **Content access** | ⚠️ Manual download only, often gated behind ads/CAPTCHAs |
| **License clarity** | ❌ Unclear — likely copyrighted |
| **Legal risk** | ⚠️ High — redistributing potentially copyrighted materials |
| **Verdict** | **❌ Skip entirely.** Legal grey area, no API, gated access. |

---

### Phase 2 Researchers: Niche & Community Sources

---

#### 14. GitHub B.Tech Notes Repositories

| Factor | Finding |
|--------|---------|
| **Quantity** | DOZENS of repos with B.Tech notes |
| **Format** | Mostly PDFs + Markdown + Google Drive links |
| **License** | MIT, Apache 2.0, or unspecified |
| **Caveat** | 🔴 License may not cover included third-party copyrighted content |
| **Activity** | "Archive" style — active during exam seasons, dormant otherwise |
| **Relevance to JU** | ⭐⭐⭐ Medium — covers Indian B.Tech curriculum broadly |
| **Examples found** | `madhurimarawat/Semester-Notes`, `rushik008/B.Tech.-Computer-Science-Notes-Materials`, `Anmol-Baranwal/College-Made-Easy`, `Amey-Thakur/APPLIED-MATHEMATICS-III`, and many more |
| **Verdict** | **✅ Valuable reference.** Can manually curate links from these repos. Automated cloning risky due to unclear copyright on third-party content. |

---

#### 15. Telegram / WhatsApp / Google Drive Sharing Ecosystem

| Factor | Finding |
|--------|---------|
| **Content volume** | Massive — channels with thousands of PDFs |
| **Technical scrapability** | ⚠️ Possible (Telegram API + regex), but legally risky |
| **Legal risk** | 🔴 HIGH — shared content is often copyrighted |
| **ToS risk** | ⚠️ Scraping violates Telegram/Google ToS |
| **Recommendation** | 🔴 Do NOT scrape. If you're a student, you can manually contribute links you have permission to share |
| **Verdict** | **❌ Skip automated aggregation.** Too much legal risk. Manual contributions only. |

---

#### 16. Gutendex API (gutendex.com)

| Factor | Finding |
|--------|---------|
| **Base URL** | `https://gutendex.com/books` |
| **Filter by topic** | ✅ `?topic=mathematics` |
| **Filter by PDF** | ✅ `?mime_type=application/pdf` |
| **Rate limits** | No documented limits — but NOT recommended for production |
| **Reliability** | ⚠️ Project owner says: *"For long-term use, run your own server"* |
| **Self-hosting** | ✅ Open source on GitHub — can self-host |
| **Verdict** | ⚠️ Use for prototyping. Self-host if going to production. But Project Gutenberg content has limited value for modern B.Tech. |

---

#### 17. CORE API (core.ac.uk)

| Factor | Finding |
|--------|---------|
| **Authentication** | ✅ API key required (free registration) |
| **Free tier** | ~1,000 tokens/day, 25 req/min |
| **Full-text PDFs** | ✅ `downloadUrl` available in responses |
| **Subject filtering** | ✅ Keyword search across full text metadata |
| **Bulk data** | ✅ Dedicated Dataset Service for large-scale |
| **Content type** | ⚠️ RESEARCH PAPERS, not teaching materials |
| **Relevance to JU** | ⭐ Low — academic research, not B.Tech study notes |
| **Verdict** | **❌ Skip.** Research-focused. Not suitable for undergraduate study materials. |

---

#### 18. BASE (Bielefeld Academic Search Engine)

| Factor | Finding |
|--------|---------|
| **API** | ⚠️ OAI-PMH based — no modern REST API for developers |
| **Total documents** | 240-300 million, 60-70% open access |
| **Engineering content** | ✅ Good — indexes institutional repositories globally |
| **Direct PDF links** | ⚠️ Links to landing pages, not direct PDFs |
| **Rate limits** | ⚠️ Automated scraping blocked. OAI-PMH harvesting requires polite practices |
| **Verdict** | ⚠️ Technically viable via OAI-PMH but high effort for uncertain yield of undergraduate-level materials. |

---

#### 19. Pressbooks Directory (pressbooks.directory) & OER Commons (oercommons.org)

| Factor | Pressbooks Directory | OER Commons |
|--------|---------------------|-------------|
| **Public API** | ❌ No | ❌ No |
| **Subject filtering** | Web UI only | Web UI only |
| **PDF exports** | ✅ (on individual Pressbooks instances) | ✅ (if creator enabled) |
| **Engineering resources** | Hundreds | Hundreds |
| **Verdict** | ❌ Skip (no API) | ❌ Skip (no API) |

---

#### 20. Indian University OER / Open Repositories

| Source | Type | Downloadable | Relevance |
|--------|------|-------------|-----------|
| **IIT Delhi IR** | Research theses | ✅ PDF | ⭐⭐ (research) |
| **IIT Bombay DSpace** | Research theses | ✅ PDF | ⭐⭐ (research) |
| **IIT Kanpur PK Kelkar Library** | Theses + research | ✅ PDF | ⭐⭐ (research) |
| **NIT repositories** | Varies by NIT | ⚠️ Inconsistent | ⭐⭐ |
| **FOSSEE (IIT Bombay)** | Software manuals | ✅ PDF + code | ⭐⭐⭐ (specific topics) |
| **Spoken Tutorial** | Audio/video tutorials | ✅ Downloadable | ⭐⭐ (software training) |
| **Virtual Labs** | Lab simulations | ❌ Web only | ⭐ (simulations, no PDFs) |

**Verdict:** FOSSEE and Spoken Tutorial have some downloadable content but limited to specific software topics. IIT repositories are research-focused. Low applicability for B.Tech notes.

---

#### 21. Wayback Machine / Internet Archive CDX (for broken links)

| Factor | Finding |
|--------|---------|
| **CDX API endpoint** | ✅ `https://web.archive.org/cdx/search/cdx?url=...` |
| **Filter by file type** | ✅ `&filter=mimetype:application/pdf` |
| **Rate limits** | ~60 req/min |
| **Legal risk** | ⚠️ Aggregating archived content = potential copyright infringement |
| **Best use case** | 🔍 Recovering BROKEN DRIVE LINKS — if a file was public when indexed, it may exist in Wayback |
| **Verdict** | ✅ **Valuable for link recovery.** If a Google Drive link breaks, check Wayback Machine. For new content aggregation, legal risk is high. |

---

#### 22. Open Library API (openlibrary.org)

| Factor | Finding |
|--------|---------|
| **API endpoints** | ✅ REST API available |
| **Free books filter** | ✅ Can find public domain / freely downloadable books |
| **Subject filtering** | ✅ By subject (engineering, computer science) |
| **Direct PDF downloads** | ⚠️ Links to Internet Archive copies — not always direct PDF |
| **Rate limits** | Standard — be polite |
| **Relevance** | ⭐⭐ Low-medium — overlaps with Internet Archive |
| **Verdict** | ✅ Useful supplement to Internet Archive search. |

---

#### 23. WikiEducator & WikiToLearn

| Source | Status | API | Verdict |
|--------|--------|-----|---------|
| **WikiEducator** | Still active | MediaWiki API | ⚠️ Small collection, mostly not engineering |
| **WikiToLearn** | ⚠️ Largely inactive/dead | N/A | ❌ Skip |

---

#### 24. BCcampus OpenEd

| Factor | Finding |
|--------|---------|
| **Infrastructure** | DSpace-based institutional repository |
| **API** | ✅ OAI-PMH endpoint |
| **PDFs** | ✅ Yes, via handle.net URLs |
| **Subjects** | Wide range of OER textbooks |
| **License** | CC BY, CC BY-SA, etc. |
| **Verdict** | ✅ Decent supplement — OAI-PMH harvestable, good licensing. |

---

## ⭐ Recommended Sources (Ranked)

### Tier 1: Implement Now (Good API + Permissive License + Valuable Content)

| Rank | Source | API Type | Est. Yield | Effort | JU Relevance | License |
|------|--------|----------|------------|--------|--------------|---------|
| 🥇 | **Open Textbook Library** | REST JSON | 100-300 textbooks | Low | ⭐⭐⭐ | CC BY/NC/SA |
| 🥇 | **Wikibooks** | MediaWiki API | 50-200 engineering books | Medium | ⭐⭐⭐ | CC BY-SA |
| 🥇 | **Internet Archive** | Python library | 500-2000+ PDFs | Medium | ⭐⭐⭐ | Public Domain + CC |
| 🥇 | **eGyanKosh (IGNOU)** | OAI-PMH | 200-500 modules | Medium | ⭐⭐⭐ | Open Access (non-commercial) |

### Tier 2: Add Later (More Effort or Lower Value)

| Rank | Source | API Type | Est. Yield | Effort | JU Relevance | Notes |
|------|--------|----------|------------|--------|--------------|-------|
| 🥈 | **BCcampus OpenEd** | OAI-PMH | 100-300 textbooks | Medium | ⭐⭐ | Good supplement |
| 🥈 | **Open Library** | REST API | Hundreds | Low | ⭐⭐ | Overlaps with Internet Archive |
| 🥈 | **GitHub B.Tech repos** | Git clone | Hundreds | Medium | ⭐⭐⭐ | Manual curation needed |
| 🥈 | **OpenStax** | Manual scrape | 30-50 textbooks | Low | ⭐⭐⭐ | CC BY-NC-SA, no API |

### Tier 3: Maybe Later (High Effort or Low Value)

| Rank | Source | Why |
|------|--------|-----|
| 🥉 | **Gutendex (self-hosted)** | Historical content, limited modern engineering value |
| 🥉 | **BASE (OAI-PMH)** | Too much effort for uncertain yield |
| 🥉 | **FOSSEE / Spoken Tutorial** | Too niche (software-specific) |
| ❌ | NPTEL | No API, legal risk, scraping blocks |
| ❌ | SWAYAM | No API, gated content |
| ❌ | NDLI | Auth required, gated PDFs |
| ❌ | Shodhganga | PhD theses, not B.Tech level |
| ❌ | arXiv/CORE/Unpaywall | Research papers, not study materials |
| ❌ | LearnEngineering/EasyEngineering | Copyright grey area, no API |
| ❌ | Telegram/WhatsApp/Drive sharing | High legal risk |

---

## Technical Architecture (Updated)

### The aggregation pipeline

```
┌─────────────────────────────────────────────────────┐
│                  aggregate-sources.mjs               │
│                                                       │
│  Source Adapter 1 (Open Textbook Library) ──────┐    │
│  Source Adapter 2 (Wikibooks) ────────────────┐│    │
│  Source Adapter 3 (Internet Archive) ────────┐││    │
│  Source Adapter 4 (eGyanKosh) ─────────────┐ │││    │
│  Source Adapter 5 (BCcampus OpenEd) ──────┐│ │││    │
│                                            ││ │││    │
│  ┌─────────────────────────────────────────┘│ ││    │
│  │  ┌───────────────────────────────────────┘ ││    │
│  │  │  ┌──────────────────────────────────────┘│    │
│  │  │  │  ┌────────────────────────────────────┘    │
│  │  │  │  │                                         │
│  ▼  ▼  ▼  ▼                                         │
│  ┌──────────────────────────────────┐                │
│  │       Subject Mapping Engine      │                │
│  │  (keyword → branch/sem/subject)   │                │
│  └──────────────┬───────────────────┘                │
│                 ▼                                     │
│  ┌──────────────────────────────────┐                │
│  │    Metadata JSON Generator        │                │
│  └──────────────┬───────────────────┘                │
│                 ▼                                     │
│  ┌──────────────────────────────────┐                │
│  │  metadata/generated/{source}/    │                │
│  │    ├── wikibooks/                │                │
│  │    ├── open-textbook-library/    │                │
│  │    ├── internet-archive/         │                │
│  │    └── egyankosh/               │                │
│  └──────────────────────────────────┘                │
└─────────────────────────────────────────────────────┘
         │  (Run locally only)
         ▼
    Commit to metadata repo
```

### Source adapter interface (TypeScript)

```typescript
interface SourceAdapter {
  name: string;
  fetchCatalog(): Promise<CatalogItem[]>;
}

interface CatalogItem {
  title: string;
  url: string;                   // Direct download URL
  description?: string;
  fileSize?: number;
  language?: string;
  license?: string;              // e.g., "CC BY-SA 4.0", "Public Domain"
  source: string;                // e.g., "wikibooks", "open-textbook-library"
  subjectHints: string[];        // Keywords for mapping to JU subjects
  externalId: string;            // ID in the source system
  thumbnailUrl?: string;         // Cover image if available
  tags?: string[];               // e.g., ["notes", "reference-book"]
}
```

### Subject mapping table (JSON config)

```json
{
  "mappings": [
    { "keywords": ["calculus", "calculus volume 1", "differential calculus", "integral calculus"],
      "branch": "CSE", "semester": 1, "subject": "Mathematics-I" },
    { "keywords": ["linear algebra", "matrix", "vectors"],
      "branch": "CSE", "semester": 2, "subject": "Mathematics-II" },
    { "keywords": ["physics", "university physics", "college physics", "engineering physics"],
      "branch": "CSE", "semester": 1, "subject": "Engineering Physics" },
    { "keywords": ["chemistry", "general chemistry", "engineering chemistry"],
      "branch": "CSE", "semester": 1, "subject": "Engineering Chemistry" },
    { "keywords": ["programming", "c programming", "python programming", "java programming"],
      "branch": "CSE", "semester": 1, "subject": "Programming for Problem Solving" },
    { "keywords": ["data structures", "algorithms", "dsa"],
      "branch": "CSE", "semester": 3, "subject": "Data Structures & Algorithms" },
    { "keywords": ["database", "dbms", "sql"],
      "branch": "CSE", "semester": 4, "subject": "Database Management Systems" },
    { "keywords": ["operating system", "os"],
      "branch": "CSE", "semester": 4, "subject": "Operating Systems" },
    { "keywords": ["computer network", "networking", "data communication"],
      "branch": "CSE", "semester": 5, "subject": "Computer Networks" },
    { "keywords": ["software engineering"],
      "branch": "CSE", "semester": 5, "subject": "Software Engineering" },
    { "keywords": ["machine learning", "artificial intelligence"],
      "branch": "CSE", "semester": 6, "subject": "Machine Learning" }
  ],
  "defaultBranch": "CSE",
  "defaultSemester": 1,
  "defaultSection": "mixed"
}
```

---

## Updated Implementation Plan

### Phase 1: Build the pipeline (2-3 days)

1. **Create `scripts/aggregate-sources.mjs`** with the source adapter pattern
2. **Implement Open Textbook Library adapter** — easiest (clean REST API)
3. **Implement Wikibooks adapter** — most content for CS subjects
4. **Create subject mapping config** — map external subjects to JU structure
5. **Test with a dry run** — generate JSON files, review output

### Phase 2: Bulk aggregation (3-5 days)

6. **Implement Internet Archive adapter** — most volume but needs license filtering
7. **Implement eGyanKosh adapter** — OAI-PMH harvester for Indian engineering content
8. **Run full aggregation** — generate all JSONs, review, discard/approve
9. **Hand-curate the best matches** — move from `generated/` into main folder structure

### Phase 3: Polish

10. **Implement BCcampus OpenEd adapter** — supplementary content
11. **Wayback Machine checker** — for recovering broken Drive links
12. **Write docs** — document how the aggregation pipeline works for contributors

---

## Legal Matrix (Complete)

| Source | License Type | Can we store PDF URL? | Can we download PDF? | Can we rehost PDF? | Attribution Required? |
|--------|-------------|----------------------|---------------------|-------------------|----------------------|
| Open Textbook Library | CC BY / CC BY-NC / CC BY-SA | ✅ | ✅ | ⚠️ Depends on license | ✅ |
| Wikibooks | CC BY-SA 4.0 | ✅ | ✅ | ⚠️ Same license applies | ✅ |
| Internet Archive (PD) | Public Domain | ✅ | ✅ | ✅ | No legal requirement |
| Internet Archive (CC) | CC BY / CC BY-NC / etc. | ✅ | ✅ | ⚠️ Depends on license | ✅ |
| eGyanKosh | IGNOU Open Access (non-commercial) | ✅ | ✅ | ⚠️ Non-commercial only | ✅ |
| BCcampus OpenEd | CC BY / CC BY-SA | ✅ | ✅ | ✅ | ✅ |
| Project Gutenberg | Public Domain | ✅ | ✅ | ✅ | Recommended |
| OpenStax | CC BY-NC-SA 4.0 | ✅ | ✅ | ❌ Non-commercial only | ✅ |
| Open Library | Varies | ✅ | ⚠️ Depends | ⚠️ Depends | ✅ |
| NPTEL | CC BY-NC-SA (some) | ⚠️ | ⚠️ | ❌ | ✅ |
| GitHub B.Tech repos | MIT/Apache (on notes) | ✅ | ✅ | ⚠️ Check per-file copyright | ✅ |
| Telegram/WhatsApp | Unclear / copyrighted | ❌ | ❌ | ❌ | N/A |

**Our approach:** We store third-party links (storage-agnostic). We NEVER rehost copyrighted PDFs on our servers. We just point to the original source URL. This is legally safer than downloading and rehosting.

---

## Summary Table

| Source | API | PDF Download | JU Relevance | Effort | Risk | Priority |
|--------|-----|-------------|-------------|--------|------|----------|
| Open Textbook Library | ✅ REST | ✅ Direct | ⭐⭐⭐ | Low | Low | **🥇** |
| Wikibooks | ✅ MediaWiki | ✅ (manual convert) | ⭐⭐⭐ | Medium | Low | **🥇** |
| Internet Archive | ✅ Python lib | ✅ Direct | ⭐⭐⭐ | Medium | Low | **🥇** |
| eGyanKosh (IGNOU) | ✅ OAI-PMH | ✅ Direct | ⭐⭐⭐ | Medium | Low | **🥇** |
| BCcampus OpenEd | ✅ OAI-PMH | ✅ Direct | ⭐⭐ | Medium | Low | 🥈 |
| Open Library | ✅ REST | ⚠️ Indirect | ⭐⭐ | Low | Low | 🥈 |
| GitHub B.Tech repos | ✅ Git | ✅ Direct | ⭐⭐⭐ | Medium | Medium | 🥈 |
| OpenStax | ❌ Manual | ✅ Direct | ⭐⭐⭐ | Low | Low | 🥈 |
| Project Gutenberg | ✅ Robot | ✅ Direct | ⭐ | Low | Low | 🥉 |
| Gutendex | ✅ REST | ✅ Indirect | ⭐ | Low | Low | 🥉 |
| FOSSEE | ❌ Manual | ✅ Direct | ⭐⭐ | Medium | Low | 🥉 |
| NPTEL | ❌ None | ⚠️ Limited | ⭐⭐⭐⭐⭐ | High | **High** | ❌ |
| SWAYAM | ❌ None | ❌ Gated | ⭐⭐⭐⭐⭐ | High | **High** | ❌ |
| NDLI | ⚠️ Auth | ❌ Gated | ⭐⭐⭐⭐⭐ | High | **High** | ❌ |
| Shodhganga | ✅ OAI-PMH | ✅ Split PDFs | ⭐ | Medium | Low | ❌ |
| Telegram/GDrive | ❌ None | ⚠️ Risky | ⭐⭐⭐ | High | **HIGH** | ❌ |
| CORE / arXiv | ✅ REST | ✅ PDFs | ⭐ | Low | Low | ❌ |

---

## Recommendation

**Build the pipeline for Tier 1 first** (Open Textbook Library, Wikibooks, Internet Archive, eGyanKosh). These 4 sources alone could yield 800-3,500+ engineering-relevant documents with good APIs and clear permissive licenses.

Skip NPTEL/SWAYAM/NDLI for automated aggregation — they're too legally/technically risky. Instead, encourage contributors to add NPTEL/Drive links manually via PRs using the `/automation/drive` tool.
