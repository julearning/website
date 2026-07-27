/**
 * URL-safe slug utilities for dynamic routes.
 *
 * Converts display names to URL-safe slugs and back:
 *   "Advanced Engineering Physics" → "advanced-engineering-physics"
 *   "Semester 1" → "sem-1"
 *   "B.Tech" → "btech"
 */

/**
 * Create a URL-safe slug from any display name.
 * - Lowercases, replaces spaces with hyphens
 * - Removes special characters except dots (for B.Tech → btech)
 * - Collapses multiple hyphens
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\./g, "") // Remove dots (B.Tech → btech)
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, "") // Trim leading/trailing hyphens
    .replace(/-+/g, "-"); // Collapse multiple hyphens
}

/**
 * Reverse a slug back to a display name.
 */
export function deslugify(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Create a degree slug (e.g., "B.Tech" → "btech", "M.Tech" → "mtech").
 */
export function degreeSlug(degree: string): string {
  return slugify(degree);
}

/**
 * Parse a degree slug back to a display name using the hierarchy module.
 * Falls back to simple deslugify if degree not found.
 */
export function deslugifyDegree(slug: string): string {
  // Dynamic import to avoid circular deps — hierarchy imports from generated-documents directly
  // We inline the display map here for the slug utility since it's display-only
  const DEGREE_DISPLAY: Record<string, string> = {
    btech: "B.Tech",
    mtech: "M.Tech",
    bca: "BCA",
    mca: "MCA",
  };
  return DEGREE_DISPLAY[slug] || deslugify(slug);
}

/**
 * Normalize semester names to a number.
 * Handles both "Sem 1", "Semester 1", "semester-1", etc.
 */
export function parseSemesterName(name: string): number | null {
  const match = name.match(/(?:sem(?:ester)?[\s-]*)?(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Build a semester slug from a number: "sem-1", "sem-2", etc.
 */
export function semesterSlug(semester: number): string {
  return `sem-${semester}`;
}

/**
 * Parse a semester slug back to a number: "sem-1" → 1, "semester-3" → 3.
 */
export function parseSemesterSlug(slug: string): number | null {
  const match = slug.match(/(?:sem(?:ester)?[-]?)(\d+)/i);
  if (match) return parseInt(match[1], 10);
  // Also try just a number
  const numMatch = slug.match(/^(\d+)$/);
  return numMatch ? parseInt(numMatch[1], 10) : null;
}

/**
 * Build a degree-aware URL path.
 * Example: buildPath("B.Tech", "CSE", 3, "Web Tech")
 *   → "/btech/cse/sem-3/web-tech"
 */
export function buildPath(
  degree: string,
  branch: string,
  semester?: number | null,
  subject?: string | null,
): string {
  const parts = [degreeSlug(degree), slugify(branch)];
  if (semester != null) {
    parts.push(semesterSlug(semester));
    if (subject) {
      parts.push(slugify(subject));
    }
  }
  return "/" + parts.join("/");
}
