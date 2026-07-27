import { NextRequest, NextResponse } from "next/server";

const GITHUB_OWNER = "julearning";
const GITHUB_REPO = "metadata";

interface SingleDoc {
  title: string;
  url: string;
  thumbnailUrl?: string;
  type: string;
  contributor: string;
  source?: string;
  isNewSource?: boolean;
  sourceName?: string;
  sourceDescription?: string;
  sourceUrl?: string;
  sourceThumbnailUrl?: string;
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
  branch: string;
  semester: number;
  degree?: string;
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
      if (typeof doc.branch !== "string" || !doc.branch.trim().length) return { ok: false, error: "Each doc must have branch" };
      if (typeof doc.semester !== "number") return { ok: false, error: "Each doc must have semester" };
    }
    return { ok: true, mode: "bulk", contributor: b.contributor as string, docs: b.docs as BulkDoc[] };
  }

  const source = typeof b.source === "string" ? b.source : "jammu-university";
  const isNewSource = b.isNewSource === true;

  if (isNewSource) {
    if (typeof b.sourceName !== "string" || !b.sourceName.trim().length ||
        typeof b.sourceUrl !== "string" || !b.sourceUrl.trim().length ||
        typeof b.title !== "string" || !b.title.trim().length ||
        typeof b.url !== "string" || !b.url.trim().length ||
        typeof b.type !== "string" ||
        typeof b.contributor !== "string") {
      return { ok: false, error: "Missing or invalid fields. Required: sourceName, sourceUrl, title, url, type, contributor." };
    }
  } else if (source === "jammu-university") {
    if (typeof b.title !== "string" || !b.title.trim().length ||
        typeof b.url !== "string" || !b.url.trim().length ||
        typeof b.type !== "string" ||
        typeof b.contributor !== "string" ||
        typeof b.branch !== "string" ||
        typeof b.semester !== "number" ||
        typeof b.subject !== "string" || !b.subject.trim().length) {
      return { ok: false, error: "Missing or invalid fields. Required: title, url, type, contributor, branch, semester, subject." };
    }
  } else {
    if (typeof b.title !== "string" || !b.title.trim().length ||
        typeof b.url !== "string" || !b.url.trim().length ||
        typeof b.type !== "string" ||
        typeof b.contributor !== "string") {
      return { ok: false, error: "Missing or invalid fields. Required: title, url, type, contributor." };
    }
  }

  return { ok: true, mode: "single", data: { ...(b as unknown as SingleDoc), source, isNewSource } };
}

function sanitizeSlug(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
}

/**
 * Fetch existing file from main, parse its JSON array, append new entries,
 * and return the merged JSON string + the existing file's SHA (if any).
 */
async function mergeWithExisting(
  filePath: string,
  newEntries: Record<string, unknown>[],
  headers: Record<string, string>,
): Promise<{ json: string; sha: string | undefined }> {
  const getRes = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=main`,
    { headers },
  );
  if (!getRes.ok) {
    // File doesn't exist yet — just return new entries
    return { json: JSON.stringify(newEntries, null, 2), sha: undefined };
  }
  const getData: { sha: string; content: string; encoding: string } = await getRes.json();
  const existingContent = Buffer.from(getData.content, getData.encoding as "base64" | "utf-8").toString("utf-8");
  let merged: Record<string, unknown>[];
  try {
    const parsed = JSON.parse(existingContent);
    merged = Array.isArray(parsed) ? [...parsed, ...newEntries] : newEntries;
  } catch {
    merged = newEntries;
  }
  return { json: JSON.stringify(merged, null, 2), sha: getData.sha };
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
    const refRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/main`, { headers });
    if (!refRes.ok) {
      const err = await refRes.json().catch(() => ({}));
      return NextResponse.json({ error: `Failed to fetch main branch: ${(err as { message?: string }).message || refRes.statusText}` }, { status: 502 });
    }
    const refData: { object: { sha: string } } = await refRes.json();
    const mainSha = refData.object.sha;
    const timestamp = Date.now();

    if (parsed.mode === "single") {
      const { title, url, thumbnailUrl, type, contributor, source, isNewSource, sourceName, sourceDescription, sourceUrl, sourceThumbnailUrl, branch, semester, subject } = parsed.data;
      const ghUser = contributor.toLowerCase().replace(/[^a-z0-9-]/g, "") || "anonymous";
      const branchName = `contribute/${Date.now()}`;
      const sourceFolder = source || "jammu-university";

      // Build the new entry
      const today = new Date().toISOString().split("T")[0];
      const newEntry: Record<string, unknown> = {
        title: title.trim(),
        url: url.trim(),
        type,
        contributor: contributor.trim() || undefined,
        uploadedAt: today,
      };
      if (thumbnailUrl) newEntry.thumbnailUrl = thumbnailUrl;
      if (sourceFolder !== "jammu-university") newEntry.description = type;

      // Determine file paths
      let docFilePath: string;
      let metaFilePath: string | null = null;

      if (isNewSource && sourceName) {
        const sourceSlug = sanitizeSlug(sourceName);
        docFilePath = `other-sources/${sourceSlug}/${ghUser}.json`;
        metaFilePath = `other-sources/${sourceSlug}.json`;
      } else if (sourceFolder === "jammu-university") {
        const branchSlug = branch.toLowerCase().replace(/[^a-z0-9]/g, "");
        const cleanSubject = subject.replace(/^Sem\s+\d+\s*/i, "").trim();
        const subjectSlug = cleanSubject.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const folderSlug = `sem-${semester}-${subjectSlug}`;
        docFilePath = `jammu-university/btech/${branchSlug}/sem-${semester}/${folderSlug}/${folderSlug}.json`;
      } else {
        docFilePath = `other-sources/${sourceFolder}/${ghUser}.json`;
      }

      // Merge with existing content (if file already exists in main)
      const { json: mergedJson, sha: existingSha } = await mergeWithExisting(docFilePath, [newEntry], headers);

      // Create branch
      const br = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs`, {
        method: "POST", headers,
        body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: mainSha }),
      });
      if (!br.ok) {
        const e = await br.json().catch(() => ({}));
        return NextResponse.json({ error: `Failed to create branch: ${(e as { message?: string }).message || br.statusText}` }, { status: 502 });
      }

      // Create metadata file (for new sources)
      if (metaFilePath) {
        const metaContent = JSON.stringify({
          name: sourceName?.trim(),
          description: sourceDescription?.trim() || `${sourceName?.trim()} resources`,
          url: sourceUrl?.trim(),
          thumbnailUrl: sourceThumbnailUrl?.trim() || thumbnailUrl?.trim() || undefined,
        }, null, 2);
        const metaBase64 = Buffer.from(metaContent, "utf-8").toString("base64");
        const metaRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${metaFilePath}`, {
          method: "PUT", headers,
          body: JSON.stringify({ message: `Add source: ${sourceName?.trim()}`, content: metaBase64, branch: branchName }),
        });
        if (!metaRes.ok) {
          await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/${branchName}`, { method: "DELETE", headers }).catch(() => {});
          const e = await metaRes.json().catch(() => ({}));
          return NextResponse.json({ error: `Failed to create source metadata: ${(e as { message?: string }).message || metaRes.statusText}` }, { status: 502 });
        }
      }

      // Create / update document file
      const base64Content = Buffer.from(mergedJson, "utf-8").toString("base64");
      const frBody: Record<string, unknown> = { message: `Add ${title} by ${contributor || "anonymous"}`, content: base64Content, branch: branchName };
      if (existingSha) frBody.sha = existingSha;
      const fr = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${docFilePath}`, {
        method: "PUT", headers,
        body: JSON.stringify(frBody),
      });
      if (!fr.ok) {
        await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/${branchName}`, { method: "DELETE", headers }).catch(() => {});
        const e = await fr.json().catch(() => ({}));
        return NextResponse.json({ error: `Failed to create file: ${(e as { message?: string }).message || fr.statusText}` }, { status: 502 });
      }

      // Create PR
      const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://julearning.vercel.app";
      const prBody = [`## Document`, ``, `**Title:** ${title}`, `**Type:** ${type}`, `**Contributor:** ${contributor || "anonymous"}`, `**Source:** ${sourceFolder}`];
      if (isNewSource) {
        prBody.push(`**New Source:** ${sourceName}`, `**Source URL:** ${sourceUrl || ""}`);
      }
      if (!isNewSource && sourceFolder === "jammu-university") {
        prBody.push(`**Branch:** ${branch}`, `**Semester:** ${semester}`, `**Subject:** ${subject}`);
      }
      prBody.push(``, `**File:** \`${docFilePath}\``, ``, `---`, `_Created via [JU Learning](${siteUrl}/contribute)_`);

      const prR = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls`, {
        method: "POST", headers,
        body: JSON.stringify({
          title: `${isNewSource ? "New source:" : "Add:"} ${isNewSource ? sourceName : title} (${type})`,
          head: branchName, base: "main",
          body: prBody.join("\n"),
        }),
      });
      if (!prR.ok) {
        const e = await prR.json().catch(() => ({}));
        return NextResponse.json({ error: `Failed to create PR: ${(e as { message?: string }).message || prR.statusText}` }, { status: 502 });
      }
      const prData: { html_url: string; number: number } = await prR.json();
      return NextResponse.json({ success: true, prUrl: prData.html_url, prNumber: prData.number, filePath: docFilePath, metaFilePath });
    }

    // BULK mode
    const { contributor: bulkContributor, docs } = parsed;

    type GroupKey = string;
    function makeGroupKey(doc: BulkDoc): GroupKey {
      const degree = (doc.degree || "btech").toLowerCase().replace(/[^a-z0-9]/g, "");
      const branch = doc.branch.toLowerCase().replace(/[^a-z0-9]/g, "");
      return `${degree}|${branch}|${doc.semester}|${doc.subject.trim().toLowerCase()}`;
    }
    const groups = new Map<GroupKey, BulkDoc[]>();
    for (const doc of docs) {
      const key = makeGroupKey(doc);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(doc);
    }

    if (groups.size === 0) return NextResponse.json({ error: "No valid docs after grouping." }, { status: 400 });

    const branchName = `contribute/bulk-${timestamp}`;
    const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://julearning.vercel.app";

    const br = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs`, {
      method: "POST", headers,
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: mainSha }),
    });
    if (!br.ok) {
      const e = await br.json().catch(() => ({}));
      return NextResponse.json({ error: `Failed to create branch: ${(e as { message?: string }).message || br.statusText}` }, { status: 502 });
    }

    const filePaths: string[] = [];
    for (const [, groupDocs] of groups.entries()) {
      const first = groupDocs[0];
      const degreeSlug = (first.degree || "btech").toLowerCase().replace(/[^a-z0-9]/g, "");
      const branchSlug = first.branch.toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanSubject = first.subject.replace(/^Sem\s+\d+\s*/i, "").trim();
      const subjectSlug = sanitizeSlug(cleanSubject);
      const folderSlug = `sem-${first.semester}-${subjectSlug}`;
      const filePath = `jammu-university/${degreeSlug}/${branchSlug}/sem-${first.semester}/${folderSlug}/${folderSlug}.json`;
      filePaths.push(filePath);

      // Build new entries for this group
      const today = new Date().toISOString().split("T")[0];
      const newEntries: Record<string, unknown>[] = groupDocs.map(d => ({
        title: d.title.trim(),
        url: d.url.trim(),
        type: d.type,
        contributor: d.contributor.trim() || undefined,
        uploadedAt: today,
      }));

      // Merge with existing content (if file already exists in main)
      const { json: mergedJson, sha: existingSha } = await mergeWithExisting(filePath, newEntries, headers);
      const base64Content = Buffer.from(mergedJson, "utf-8").toString("base64");

      const frBody: Record<string, unknown> = { message: `Add ${first.subject} (${groupDocs.length} docs) for ${first.branch} S${first.semester}`, content: base64Content, branch: branchName };
      if (existingSha) frBody.sha = existingSha;
      const fr = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`, {
        method: "PUT", headers,
        body: JSON.stringify(frBody),
      });
      if (!fr.ok) {
        await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/${branchName}`, { method: "DELETE", headers }).catch(() => {});
        const e = await fr.json().catch(() => ({}));
        return NextResponse.json({ error: `Failed to create file ${filePath}: ${(e as { message?: string }).message || fr.statusText}` }, { status: 502 });
      }
    }

    const uniqueLocations = new Set(docs.map(d => `${d.branch} S${d.semester}`));
    const prR = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls`, {
      method: "POST", headers,
      body: JSON.stringify({
        title: `Add ${docs.length} documents (bulk)`,
        head: branchName, base: "main",
        body: [`## Multiple Documents Upload`, ``, `**Contributor:** ${bulkContributor || "anonymous"}`,
          `**Total documents:** ${docs.length}`, `**Files created:** ${filePaths.length}`,
          `**Locations:** ${[...uniqueLocations].join(", ")}`,
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
