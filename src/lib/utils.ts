import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildReportIssueUrl(doc: {
  id: string;
  title: string;
  url: string;
}): string {
  const title = encodeURIComponent(`[Broken Link] ${doc.title}`);
  const body = encodeURIComponent(
    [
      "## Broken Link Report",
      "",
      "**Document ID:** " + doc.id,
      "**Title:** " + doc.title,
      "**URL:** " + doc.url,
      "",
      "**Issue:**",
      "- [ ] 404 Not Found",
      "- [ ] Permission Denied",
      "- [ ] Wrong File",
      "- [ ] Other",
      "",
      "**Additional context:**",
      "",
      "---",
      "> This issue was automatically generated from the report button.",
    ].join("\n"),
  );
  return `https://github.com/JU-Learning/julearning/issues/new?title=${title}&body=${body}`;
}
