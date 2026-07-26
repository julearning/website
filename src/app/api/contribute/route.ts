import { NextRequest, NextResponse } from "next/server";

const GITHUB_OWNER = "julearning";
const GITHUB_REPO = "metadata";

interface ContributeBody {
  title: string;
  url: string;
  type: string;
  contributor: string;
  branch: string;
  semester: number;
  subject: string;
}

function validate(body: unknown): body is ContributeBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.title === "string" && b.title.trim().length > 0 &&
    typeof b.url === "string" && b.url.trim().length > 0 &&
    typeof b.type === "string" &&
    typeof b.contributor === "string" &&
    typeof b.branch === "string" &&
    typeof b.semester === "number" &&
    typeof b.subject === "string" && b.subject.trim().length > 0
  );
}

export async function POST(request: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Server not configured. The GITHUB_TOKEN environment variable is missing." },
      { status: 500 },
    );
  }

  let body: ContributeBody;
  try {
    const parsed = await request.json();
    if (!validate(parsed)) {
      return NextResponse.json(
        { error: "Missing or invalid fields. Required: title, url, type, contributor, branch, semester, subject." },
        { status: 400 },
      );
    }
    body = parsed;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const branchSlug = body.branch.toLowerCase().replace(/[^a-z0-9]/g, "");
  const semesterDir = `semester-${body.semester}`;
  const subjectSlug = body.subject
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const githubUser = body.contributor.toLowerCase().replace(/[^a-z0-9-]/g, "") || "anonymous";
  const timestamp = Date.now();
  const branchName = `contribute/${subjectSlug}-${timestamp}`;

  // Build the JSON content — simplified array format with one document
  const doc = {
    title: body.title.trim(),
    url: body.url.trim(),
    type: body.type,
    contributor: body.contributor.trim() || undefined,
    uploadedAt: new Date().toISOString().split("T")[0],
  };

  const jsonContent = JSON.stringify([doc], null, 2);
  const base64Content = Buffer.from(jsonContent, "utf-8").toString("base64");

  const filePath = `jammu-university/btech/${branchSlug}/${semesterDir}/${subjectSlug}/${subjectSlug}-${githubUser}.json`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  try {
    // 1. Get the SHA of main branch
    const refRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/main`,
      { headers },
    );

    if (!refRes.ok) {
      const err = await refRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to fetch main branch: ${(err as { message?: string }).message || refRes.statusText}` },
        { status: 502 },
      );
    }

    const refData: { object: { sha: string } } = await refRes.json();
    const mainSha = refData.object.sha;

    // 2. Create a new branch
    const branchRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: mainSha }),
      },
    );

    if (!branchRes.ok) {
      const err = await branchRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to create branch: ${(err as { message?: string }).message || branchRes.statusText}` },
        { status: 502 },
      );
    }

    // 3. Create the file on the new branch
    const fileRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Add ${body.title} by ${body.contributor || "anonymous"}`,
          content: base64Content,
          branch: branchName,
        }),
      },
    );

    if (!fileRes.ok) {
      // Clean up the branch on file creation failure
      await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/${branchName}`,
        { method: "DELETE", headers },
      ).catch(() => {});

      const err = await fileRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to create file: ${(err as { message?: string }).message || fileRes.statusText}` },
        { status: 502 },
      );
    }

    // 4. Create the pull request
    const siteUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://julearning.vercel.app";

    const prRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Add: ${body.title} (${body.type})`,
          head: branchName,
          base: "main",
          body: [
            `## Document`,
            ``,
            `**Title:** ${body.title}`,
            `**Type:** ${body.type}`,
            `**Contributor:** ${body.contributor || "anonymous"}`,
            `**Branch:** ${body.branch}`,
            `**Semester:** ${body.semester}`,
            `**Subject:** ${body.subject}`,
            ``,
            `**File:** \`${filePath}\``,
            ``,
            `---`,
            `_Created via [JU Learning](${siteUrl}/contribute)_`,
          ].join("\n"),
        }),
      },
    );

    if (!prRes.ok) {
      const err = await prRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to create PR: ${(err as { message?: string }).message || prRes.statusText}` },
        { status: 502 },
      );
    }

    const prData: { html_url: string; number: number } = await prRes.json();

    return NextResponse.json({
      success: true,
      prUrl: prData.html_url,
      prNumber: prData.number,
      filePath,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Internal error: ${message}` }, { status: 500 });
  }
}
