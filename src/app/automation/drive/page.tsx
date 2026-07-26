"use client";

import { useState, useMemo, useRef } from "react";

interface ParsedFile {
  fileName: string;
  url: string;
  fileId: string | null;
  googleType: "file" | "document" | "spreadsheet" | "presentation" | "unknown";
  ext: string;
}

interface GeneratedJSON {
  fileName: string;
  content: string;
  title: string;
}

const ALLOWED_TAGS = [
  "notes", "pyq", "handwritten", "typed", "assignment",
  "lab-manual", "syllabus", "reference-book", "project-report",
];

const BRANCHES = ["CSE", "ECE", "EE", "ME", "CE"];

const SECTIONS = ["section-a", "section-b", "mixed"];

function parseLink(line: string): ParsedFile | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Tab-separated: FileName\tURL
  const parts = trimmed.split("\t");
  let fileName = parts[0]?.trim() || "";
  let url = parts[1]?.trim() || "";

  // If only one part, try space-separated (fallback)
  if (!url) {
    const spaceIdx = trimmed.lastIndexOf("http");
    if (spaceIdx > 0) {
      fileName = trimmed.slice(0, spaceIdx).trim();
      url = trimmed.slice(spaceIdx).trim();
    } else {
      return null;
    }
  }

  // Extract file ID from various Google URL formats
  let fileId: string | null = null;
  let googleType: ParsedFile["googleType"] = "unknown";

  // /file/d/FILE_ID/view
  const fileMatch = url.match(/\/file\/d\/([^/]+)\//);
  if (fileMatch) {
    fileId = fileMatch[1];
    googleType = "file";
  }

  // /document/d/FILE_ID/edit
  const docMatch = url.match(/\/document\/d\/([^/]+)\//);
  if (docMatch) {
    fileId = docMatch[1];
    googleType = "document";
  }

  // /spreadsheets/d/FILE_ID/edit
  const sheetMatch = url.match(/\/spreadsheets\/d\/([^/]+)\//);
  if (sheetMatch) {
    fileId = sheetMatch[1];
    googleType = "spreadsheet";
  }

  // /presentation/d/FILE_ID/edit
  const presMatch = url.match(/\/presentation\/d\/([^/]+)\//);
  if (presMatch) {
    fileId = presMatch[1];
    googleType = "presentation";
  }

  if (!fileId) return null;

  const ext = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";

  return { fileName, url, fileId, googleType, ext };
}

function getContentType(ext: string, googleType: string): string {
  if (ext === "pdf") return "pdf";
  if (ext === "docx" || googleType === "document") return "document";
  if (googleType === "spreadsheet") return "spreadsheet";
  if (googleType === "presentation") return "presentation";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
  if (["mp4", "mov", "avi"].includes(ext)) return "video";
  return "pdf";
}

function autoDetectTags(fileName: string, ext: string): string[] {
  const lower = fileName.toLowerCase();
  const tags: string[] = [];
  if (lower.includes("pyq") || lower.includes("past year") || lower.includes("question paper") || lower.includes("exam")) tags.push("pyq");
  if (lower.includes("handwritten") || lower.includes("hand written")) tags.push("handwritten");
  if (lower.includes("assignment") || lower.includes("assign")) tags.push("assignment");
  if (lower.includes("lab") || lower.includes("manual") || lower.includes("practical")) tags.push("lab-manual");
  if (lower.includes("syllabus")) tags.push("syllabus");
  if (lower.includes("reference") || lower.includes("book")) tags.push("reference-book");
  if (lower.includes("project")) tags.push("project-report");
  if (tags.length === 0) tags.push("notes");
  if (!lower.includes("handwritten")) tags.push("typed");
  return tags;
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/\.[^/.]+$/, "") // remove extension
    .replace(/[^\w\s-]/g, "")  // remove special chars
    .replace(/\s+/g, "-")      // spaces to hyphens
    .replace(/-+/g, "-")       // collapse hyphens
    .toLowerCase()
    .slice(0, 60) + ".json";
}

export default function DriveAutomationPage() {
  const [rawText, setRawText] = useState("");
  const [generated, setGenerated] = useState<GeneratedJSON[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [defaults, setDefaults] = useState({
    contributor: "",
    branch: "CSE",
    semester: "4",
    section: "section-a",
    subject: "",
    tags: "notes, typed",
    language: "English",
    description: "",
    pages: "",
    chapters: "",
    fileSize: "",
  });

  const parsedFiles = useMemo(() => {
    if (!rawText.trim()) return [];
    const lines = rawText.split("\n");
    return lines.map(parseLink).filter((f): f is ParsedFile => f !== null);
  }, [rawText]);

  // Reset generated results when pasted text changes
  const prevRawRef = useRef(rawText);
  if (prevRawRef.current !== rawText) {
    prevRawRef.current = rawText;
    if (generated.length > 0) {
      setGenerated([]);
    }
  }

  function handleGenerate() {
    const jsons: GeneratedJSON[] = [];
    const today = new Date().toISOString().split("T")[0];

    for (const file of parsedFiles) {
      const contentType = getContentType(file.ext, file.googleType);
      if (contentType === "video" || contentType === "image") continue;

      const tagList = defaults.tags
        ? defaults.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : autoDetectTags(file.fileName, file.ext);

      const title = file.fileName.replace(/\.[^/.]+$/, "").trim();
      const sanitizedId = sanitizeFileName(title);

      const doc: Record<string, unknown> = {
        title,
        url: file.url,
        tags: tagList,
        subject: defaults.subject || title.split("-").join(" ").split("_").join(" "),
        branch: defaults.branch,
        semester: Number(defaults.semester) || 4,
        section: defaults.section,
        chapters: defaults.chapters
          ? defaults.chapters.split(",").map((c) => c.trim()).filter(Boolean)
          : [],
      };

      // Only include fields that have actual values
      const fileSize = Number(defaults.fileSize);
      if (fileSize > 0) doc.fileSize = fileSize;
      if (defaults.contributor) doc.contributor = defaults.contributor;
      if (defaults.description) doc.description = defaults.description;
      doc.language = defaults.language || "English";
      const pages = Number(defaults.pages);
      if (pages > 0) doc.pages = pages;
      doc.uploadedAt = today;

      const content = JSON.stringify(doc, null, 2);
      const fileName = `${defaults.branch.toLowerCase()}-sem${defaults.semester}-${sanitizedId}`;

      jsons.push({ fileName, content, title });
    }

    setGenerated(jsons);
    setShowConfirm(false);
  }

  function downloadJSON(item: GeneratedJSON) {
    const blob = new Blob([item.content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadAll() {
    generated.forEach((item, i) => {
      if (i === 0) {
        downloadJSON(item);
      } else {
        // Browsers block multiple popup downloads — space them out
        setTimeout(() => downloadJSON(item), i * 500);
      }
    });
  }

  const fileCount = parsedFiles.length;
  const skippedCount = parsedFiles.filter((f) => {
    const ct = getContentType(f.ext, f.googleType);
    return ct === "video" || ct === "image";
  }).length;
  const validCount = fileCount - skippedCount;

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <div className="mt-12 sm:mt-16">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Drive to JSON
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Bulk-generate metadata JSON files from Google Drive links. Videos and images are auto-skipped.
        </p>
      </div>

      {/* Instructions */}
      <div className="mt-10 border-l-2 border-brand/40 bg-white px-6 py-5">
        <h2 className="text-lg font-bold text-foreground">How it works</h2>
        <div className="mt-3 flex flex-col gap-3 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground">Step 0: Make your Drive folder public</p>
            <p className="mt-1">Create a folder in Google Drive, right-click → <strong>Share</strong> → <strong>General access</strong> → <strong>Anyone with the link</strong> → <strong>Viewer</strong>. Drop your files in — they inherit the folder's public visibility automatically. No need to set sharing per file.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Step 1: Get your links</p>
            <p className="mt-1">Open the folder in <strong>List view</strong> (View → List or press <code className="rounded bg-accent px-1 py-0.5 text-xs">Ctrl+Shift+6</code>). Click the <strong>Google Drive Link Getter</strong> extension in your browser toolbar to list all files with their public URLs.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Step 2: Copy &amp; paste</p>
            <p className="mt-1">Copy the entire list (tab-separated: <code className="rounded bg-accent px-1 py-0.5 text-xs">FileName\tURL</code>) and paste it into the textarea below.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Step 3: Generate JSON</p>
            <p className="mt-1">Fill in default values, click Generate, and download each JSON file. Upload them to the <a href="https://github.com/julearning/metadata" target="_blank" rel="noopener noreferrer" className="text-brand underline transition-opacity hover:opacity-70">metadata repo</a>.</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground/60">
          Get the extension:{" "}
          <a
            href="https://chromewebstore.google.com/detail/Google%20Drive%20Link%20Getter/pcepfnopeaalfdibnbflpphaapbfoicl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline transition-opacity hover:opacity-70"
          >
            Google Drive Link Getter
          </a>
        </p>
      </div>

      {/* Defaults form */}
      <details className="mt-8">
        <summary className="cursor-pointer text-sm font-semibold text-foreground transition-opacity hover:opacity-70">
          Default values for all generated files
        </summary>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">GitHub Username</label>
            <input
              type="text"
              value={defaults.contributor}
              onChange={(e) => setDefaults({ ...defaults, contributor: e.target.value })}
              placeholder="your-github-username"
              className="mt-1 w-full border-0 bg-white px-4 py-3 text-sm text-foreground ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Branch</label>
            <select
              value={defaults.branch}
              onChange={(e) => setDefaults({ ...defaults, branch: e.target.value })}
              className="mt-1 w-full border-0 bg-white px-4 py-3 text-sm text-foreground ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/20 outline-none"
            >
              {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Semester</label>
            <select
              value={defaults.semester}
              onChange={(e) => setDefaults({ ...defaults, semester: e.target.value })}
              className="mt-1 w-full border-0 bg-white px-4 py-3 text-sm text-foreground ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/20 outline-none"
            >
              {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Section</label>
            <select
              value={defaults.section}
              onChange={(e) => setDefaults({ ...defaults, section: e.target.value })}
              className="mt-1 w-full border-0 bg-white px-4 py-3 text-sm text-foreground ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/20 outline-none"
            >
              {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject Name</label>
            <input
              type="text"
              value={defaults.subject}
              onChange={(e) => setDefaults({ ...defaults, subject: e.target.value })}
              placeholder="e.g. Database Management Systems"
              className="mt-1 w-full border-0 bg-white px-4 py-3 text-sm text-foreground ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags (comma-separated)</label>
            <input
              type="text"
              value={defaults.tags}
              onChange={(e) => setDefaults({ ...defaults, tags: e.target.value })}
              placeholder="notes, typed"
              className="mt-1 w-full border-0 bg-white px-4 py-3 text-sm text-foreground ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Language</label>
            <input
              type="text"
              value={defaults.language}
              onChange={(e) => setDefaults({ ...defaults, language: e.target.value })}
              placeholder="English"
              className="mt-1 w-full border-0 bg-white px-4 py-3 text-sm text-foreground ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">File Size (bytes)</label>
            <input
              type="number"
              value={defaults.fileSize}
              onChange={(e) => setDefaults({ ...defaults, fileSize: e.target.value })}
              placeholder="0"
              className="mt-1 w-full border-0 bg-white px-4 py-3 text-sm text-foreground ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chapters (comma-separated)</label>
            <input
              type="text"
              value={defaults.chapters}
              onChange={(e) => setDefaults({ ...defaults, chapters: e.target.value })}
              placeholder="Introduction, ER Model, SQL"
              className="mt-1 w-full border-0 bg-white px-4 py-3 text-sm text-foreground ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/20 outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
            <input
              type="text"
              value={defaults.description}
              onChange={(e) => setDefaults({ ...defaults, description: e.target.value })}
              placeholder="Optional description for all files"
              className="mt-1 w-full border-0 bg-white px-4 py-3 text-sm text-foreground ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/20 outline-none"
            />
          </div>
        </div>
      </details>

      {/* Textarea */}
      <div className="mt-8">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Paste links here
        </label>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste the tab-separated list from Google Drive Link Getter..."
          rows={8}
          className="mt-1 w-full border-0 bg-white px-5 py-4 text-sm text-foreground ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/20 outline-none resize-y"
        />
      </div>

      {/* Parse info */}
      {rawText.trim() && (
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span>{fileCount} file{fileCount !== 1 ? "s" : ""} detected</span>
          {skippedCount > 0 && (
            <span className="text-muted-foreground/40">
              ({skippedCount} video/image{skippedCount !== 1 ? "s" : ""} skipped)
            </span>
          )}
        </div>
      )}

      {/* Generate button */}
      {parsedFiles.length > 0 && generated.length === 0 && (
        <button
          onClick={() => setShowConfirm(true)}
          className="mt-6 bg-brand px-8 py-4 text-base font-bold text-white transition-opacity hover:opacity-90"
        >
          Generate {validCount} JSON file{validCount !== 1 ? "s" : ""}
        </button>
      )}

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="mx-4 max-w-md bg-white p-8">
            <p className="text-lg font-bold text-foreground">
              Generate {validCount} JSON file{validCount !== 1 ? "s" : ""}?
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Each file will use your default values. You can edit individual files after generation.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleGenerate}
                className="flex-1 bg-brand px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Yes, generate
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-accent px-6 py-3 text-sm font-bold text-foreground transition-opacity hover:opacity-70"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated JSON preview */}
      {generated.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              Generated {generated.length} JSON file{generated.length !== 1 ? "s" : ""}
            </h2>
            <button
              onClick={downloadAll}
              className="bg-brand px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Download all
            </button>
          </div>

          <div className="mt-6 space-y-6">
            {generated.map((item, i) => (
              <div key={i} className="bg-white ring-1 ring-border/10">
                <div className="flex items-center justify-between border-b border-border/10 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground/50 truncate">{item.fileName}</p>
                  </div>
                  <button
                    onClick={() => downloadJSON(item)}
                    className="ml-4 shrink-0 bg-brand px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                  >
                    Download JSON
                  </button>
                </div>
                <pre className="overflow-x-auto px-5 py-4 text-xs text-muted-foreground/70 leading-relaxed">
                  {item.content}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Link to contribution guide */}
      <div className="mt-16 border-t border-border/10 pt-8 text-center">
        <p className="text-sm text-muted-foreground">
          First time here? Read the{" "}
          <a
            href="https://github.com/julearning/metadata/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand font-semibold underline transition-opacity hover:opacity-70"
          >
            contribution guide
          </a>
          {" "}to understand how metadata files work and how to submit them.
        </p>
      </div>
    </main>
  );
}
