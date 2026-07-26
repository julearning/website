import type { Document } from "./types";

/**
 * Reports a broken link to the julearning/metadata repo via the API.
 * Returns the issue URL on success, or throws on failure.
 */
export async function reportBrokenLink(doc: Document): Promise<{ issueUrl: string; issueNumber: number }> {
  const res = await fetch("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: doc.title,
      url: doc.url,
      branch: doc.branch || undefined,
      semester: doc.semester || undefined,
      subject: doc.subject || undefined,
      contributor: doc.contributor || undefined,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to report broken link");
  }
  return { issueUrl: data.issueUrl, issueNumber: data.issueNumber };
}
