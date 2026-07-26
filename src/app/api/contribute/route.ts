import { NextRequest, NextResponse } from "next/server";

const GITHUB_OWNER = "julearning";
const GITHUB_REPO = "metadata";

interface SingleDoc {
  title: string;
  url: string;
  type: string;
  contributor: string;
  branch: string;
  semester: number;
  subject: string;
}

interface BulkDoc {
  title: string;
  url: string;
  type: string;
  subject: string;
  contributor: string;
}

function validate(body: unknown): { ok: true; mode: "single"; data: SingleDoc } | { ok: true; mode: "bulk"; contributor: string; docs: BulkDoc[] } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" };
  const b = body as Record<string, unknown>;

  if (b.mode === "bulk") {
    if (typeof b.contributor !== "string") return { ok: false, error: "Missing contributor" };
    if (!Array.isArray(b.docs) || b.docs.length === 0) return { ok: false, error: "Missing or empty docs array" };
    for (const doc of b.docs) {
      if (typeof doc.title !== "string" || typeof doc.url !== "string" || typeof doc.type !== "string" || typeof doc.subject !== "string" || typeof doc.contributor !== "string") {
        return { ok: false, error: "Each doc must have title, url, type, subject, contributor" };
      }
    }
    return { ok: true, mode: "bulk", contributor: b.contributor as string, docs: b.docs as BulkDoc[] };
  }

  // Default: single mode
  if (typeof b.title !== "string" || !b.title.trim().length ||
      typeof b.url !== "string" || !b.url.trim().length ||
      typeof b.type !== "string" ||
      typeof b.contributor !== "string" ||
      typeof b.branch !== "string" ||
      typeof b.semester !== "number" ||
      typeof b.subject !== "string" || !b.subject.trim().length) {
    return { ok: false, error: "Missing or invalid fields. Required: title, url, type, contributor, branch, semester, subject." };
  }
  return { ok: true, mode: "single", data: b as unknown as SingleDoc };
}

// Construct the JSON array for a subject group
function buildJson(docs: { title: string; url: string; type: string; contributor: string }[]): string {
  const today = new Date().toISOString().split("T")[0];
  const entries = docs.map(d => ({
    title: d.title.trim(),
    url: d.url.trim(),
    type: d.type,
    contributor: d.contributor.trim() || undefined,
    uploadedAt: today,
  }));
  return JSON.stringify(entries, null, 2);
}

export async function POST(request: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GITHUB_TOKEN environment variable is missing." }, { status: 500 });
  }

  let parsed: ReturnType<typeof validate>;
  try { parsed = validate(await request.json()); }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };

  try {
    // 1. Get main branch SHA
    const refRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/main`, { headers });
    if (!refRes.ok) {
      const err = await refRes.json().catch(() => ({}));
      return NextResponse.json({ error: `Failed to fetch main branch: ${(err as { message?: string }).message || refRes.statusText}` }, { status: 502 });
    }
    const refData: { object: { sha: string } } = await refRes.json();
    const mainSha = refData.object.sha;
    const timestamp = Date.now();

    if (parsed.mode === "single") {
      const { title, url, type, contributor, branch, semester, subject } = parsed.data;
      const branchSlug = branch.toLowerCase().replace(/[^a-z0-9]/g, "");
      const subjectSlug = subject.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const ghUser = contributor.toLowerCase().replace(/[^a-z0-9-]/g, "") || "anonymous";
      const branchName = `contribute/${subjectSlug}-${timestamp}`;
      const filePath = `jammu-university/btech/${branchSlug}/semester-${semester}/${subjectSlug}/${subjectSlug}-${ghUser}.json`;
      const jsonContent = buildJson([{ title, url, type, contributor }]);
      const base64Content = Buffer.from(jsonContent, "utf-8").toString("base64");

      // Create branch
      const br = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs`, {
        method: "POST", headers,
        body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: mainSha }),
      });
      if (!br.ok) {
        const e = await br.json().catch(() => ({}));
        return NextResponse.json({ error: `Failed to create branch: ${(e as { message?: string }).message || br.statusText}` }, { status: 502 });
      }

      // Create file
      const fr = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`, {
        method: "PUT", headers,
        body: JSON.stringify({ message: `Add ${title} by ${contributor || "anonymous"}`, content: base64Content, branch: branchName }),
      });
      if (!fr.ok) {
        await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/${branchName}`, { method: "DELETE", headers }).catch(() => {});
        const e = await fr.json().catch(() => ({}));
        return NextResponse.json({ error: `Failed to create file: ${(e as { message?: string }).message || fr.statusText}` }, { status: 502 });
      }

      // Create PR
      const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://julearning.vercel.app";
      const prR = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls`, {
        method: "POST", headers,
        body: JSON.stringify({
          title: `Add: ${title} (${type})`,
          head: branchName, base: "main",
          body: [`## Document`, ``, `**Title:** ${title}`, `**Type:** ${type}`, `**Contributor:** ${contributor || "anonymous"}`,
            `**Branch:** ${branch}`, `**Semester:** ${semester}`, `**Subject:** ${subject}`, ``, `**File:** \`${filePath}\``,
            ``, `---`, `_Created via [JU Learning](${siteUrl}/contribute)_`].join("\n"),
        }),
      });
      if (!prR.ok) {
        const e = await prR.json().catch(() => ({}));
        return NextResponse.json({ error: `Failed to create PR: ${(e as { message?: string }).message || prR.statusText}` }, { status: 502 });
      }
      const prData: { html_url: string; number: number } = await prR.json();
      return NextResponse.json({ success: true, prUrl: prData.html_url, prNumber: prData.number, filePath });
    }

    // BULK mode
    const { contributor: bulkContributor, docs } = parsed;

    // Group docs by subject
    const groups = new Map<string, { title: string; url: string; type: string; contributor: string }[]>();
    for (const doc of docs) {
      const key = doc.subject.trim().toLowerCase();
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(doc);
    }

    if (groups.size === 0) return NextResponse.json({ error: "No valid docs after grouping by subject." }, { status: 400 });

    const ghUser = bulkContributor.toLowerCase().replace(/[^a-z0-9-]/g, "") || "anonymous";
    const branchName = `contribute/bulk-${timestamp}`;
    const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://julearning.vercel.app";

    // Create branch
    const br = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs`, {
      method: "POST", headers,
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: mainSha }),
    });
    if (!br.ok) {
      const e = await br.json().catch(() => ({}));
      return NextResponse.json({ error: `Failed to create branch: ${(e as { message?: string }).message || br.statusText}` }, { status: 502 });
    }

    // For bulk with no specific branch/semester, place in a "bulk" folder
    const filePaths: string[] = [];
    for (const [subjectKey, subjectDocs] of groups.entries()) {
      const subjectSlug = sanitizeSlug(subjectKey);
      const filePath = `jammu-university/bulk/${subjectSlug}/${subjectSlug}-${ghUser}.json`;
      filePaths.push(filePath);
      const jsonContent = buildJson(subjectDocs);
      const base64Content = Buffer.from(jsonContent, "utf-8").toString("base64");

      const fr = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`, {
        method: "PUT", headers,
        body: JSON.stringify({ message: `Add ${subjectKey} (${subjectDocs.length} docs) by ${bulkContributor || "anonymous"}`, content: base64Content, branch: branchName }),
      });
      if (!fr.ok) {
        await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/${branchName}`, { method: "DELETE", headers }).catch(() => {});
        const e = await fr.json().catch(() => ({}));
        return NextResponse.json({ error: `Failed to create file ${filePath}: ${(e as { message?: string }).message || fr.statusText}` }, { status: 502 });
      }
    }

    // Create PR
    const prR = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls`, {
      method: "POST", headers,
      body: JSON.stringify({
        title: `Add ${docs.length} documents (bulk) by ${bulkContributor || "anonymous"}`,
        head: branchName, base: "main",
        body: [`## Bulk Document Upload`, ``, `**Contributor:** ${bulkContributor || "anonymous"}`,
          `**Total documents:** ${docs.length}`, `**Files created:** ${filePaths.length}`,
          ``, `**Files:**`, ...filePaths.map(p => `- \`${p}\``),
          ``, `---`, `_Created via [JU Learning](${siteUrl}/contribute)_`].join("\n"),
      }),
    });
    if (!prR.ok) {
      const e = await prR.json().catch(() => ({}));
      return NextResponse.json({ error: `Failed to create PR: ${(e as { message?: string }).message || prR.statusText}` }, { status: 502 });
    }
    const prData: { html_url: string; number: number } = await prR.json();
    return NextResponse.json({ success: true, prUrl: prData.html_url, prNumber: prData.number, filePaths, docCount: docs.length });
  } catch (err) {
    return NextResponse.json({ error: `Internal error: ${err instanceof Error ? err.message : "Unknown"}` }, { status: 500 });
  }
}

function sanitizeSlug(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
}
