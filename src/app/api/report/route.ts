import { NextRequest, NextResponse } from "next/server";

const GITHUB_OWNER = "julearning";
const GITHUB_REPO = "metadata";

export async function POST(request: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GITHUB_TOKEN environment variable is missing." }, { status: 500 });
  }

  let body: { title: string; url: string; branch?: string; semester?: number; subject?: string; contributor?: string };
  try {
    body = await request.json();
    if (!body.title || !body.url) {
      return NextResponse.json({ error: "title and url are required." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const issueTitle = encodeURIComponent(`Broken link: ${body.title}`);
  const issueBody = [
    `## Broken Link Report`,
    ``,
    `**Document:** ${body.title}`,
    `**URL:** ${body.url}`,
    body.branch ? `**Branch:** ${body.branch}` : "",
    body.semester ? `**Semester:** ${body.semester}` : "",
    body.subject ? `**Subject:** ${body.subject}` : "",
    body.contributor ? `**Contributor:** ${body.contributor}` : "",
    ``,
    `The link above appears to be broken.`,
    `---`,
    `_Reported via [JU Learning](https://julearning.vercel.app)_`,
  ].filter(Boolean).join("\n");

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Broken link: ${body.title}`,
          body: issueBody,
          labels: ["broken-link"],
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to create issue: ${(err as { message?: string }).message || res.statusText}` },
        { status: 502 }
      );
    }

    const data: { html_url: string; number: number } = await res.json();
    return NextResponse.json({ success: true, issueUrl: data.html_url, issueNumber: data.number });
  } catch (err) {
    return NextResponse.json(
      { error: `Internal error: ${err instanceof Error ? err.message : "Unknown"}` },
      { status: 500 }
    );
  }
}
