import type { Document } from "./types";

/**
 * Generates a pre-filled GitHub issue URL for reporting a broken link
 * in the julearning/metadata repository.
 */
export function getReportUrl(doc: Document): string {
  const title = encodeURIComponent(`Broken link: ${doc.title}`);
  const body = encodeURIComponent(
    `## Broken Link Report\n\n` +
    `**Document:** ${doc.title}\n` +
    `**URL:** ${doc.url}\n` +
    `**Branch:** ${doc.branch}\n` +
    `**Semester:** ${doc.semester}\n` +
    `**Subject:** ${doc.subject}\n` +
    `**Section:** ${doc.section || "N/A"}\n\n` +
    `**Issue:** The link appears to be broken.\n` +
    `- [ ] 404 Not Found\n` +
    `- [ ] Permission denied\n` +
    `- [ ] Wrong file\n` +
    `- [ ] Other (describe below)\n\n` +
    `**Additional context:**\n`
  );
  return `https://github.com/julearning/metadata/issues/new?title=${title}&body=${body}&labels=broken-link`;
}
