"use client";

import { useState, useMemo, useCallback } from "react";
import type { DocType } from "@/lib/types";
import { TYPE_LABELS } from "@/lib/types";

interface ParsedFile {
  fileName: string;
  url: string;
  fileId: string;
  googleType: "file" | "document" | "spreadsheet" | "presentation" | "unknown";
  ext: string;
}

interface RowData {
  id: number;
  title: string;
  url: string;
  detectedType: DocType | "";
  subject: string;
  isMedia: boolean; // video/image — skipped on generate
}

interface MergedJSON {
  subject: string;
  fileName: string;
  content: string;
  docCount: number;
}

const TYPE_OPTIONS: DocType[] = [
  "handwritten", "digital", "pyq", "assignment",
  "lab-manual", "syllabus", "reference-book", "project-report", "mixed",
];

function parseLink(line: string): ParsedFile | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const parts = trimmed.split("\t");
  let fileName = parts[0]?.trim() || "";
  let url = parts[1]?.trim() || "";

  if (!url) {
    const spaceIdx = trimmed.lastIndexOf("http");
    if (spaceIdx > 0) {
      fileName = trimmed.slice(0, spaceIdx).trim();
      url = trimmed.slice(spaceIdx).trim();
    } else {
      return null;
    }
  }

  let fileId: string | null = null;
  let googleType: ParsedFile["googleType"] = "unknown";

  const fileMatch = url.match(/\/file\/d\/([^/]+)\//);
  if (fileMatch) { fileId = fileMatch[1]; googleType = "file"; }

  const docMatch = url.match(/\/document\/d\/([^/]+)\//);
  if (docMatch) { fileId = docMatch[1]; googleType = "document"; }

  const sheetMatch = url.match(/\/spreadsheets\/d\/([^/]+)\//);
  if (sheetMatch) { fileId = sheetMatch[1]; googleType = "spreadsheet"; }

  const presMatch = url.match(/\/presentation\/d\/([^/]+)\//);
  if (presMatch) { fileId = presMatch[1]; googleType = "presentation"; }

  if (!fileId) return null;

  const ext = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";
  return { fileName, url, fileId, googleType, ext };
}

function isMedia(ext: string): boolean {
  const imgExts = ["png", "jpg", "jpeg", "gif", "webp", "svg", "ico"];
  const vidExts = ["mp4", "mov", "avi", "mkv", "webm"];
  return imgExts.includes(ext) || vidExts.includes(ext);
}

function detectTypeFromName(fileName: string): DocType | "" {
  const lower = fileName.toLowerCase();
  if (lower.includes("pyq") || lower.includes("past year") || lower.includes("question paper") || lower.includes("exam")) return "pyq";
  if (lower.includes("handwritten") || lower.includes("hand written")) return "handwritten";
  if (lower.includes("assignment") || lower.includes("assign")) return "assignment";
  if (lower.includes("lab") || lower.includes("manual") || lower.includes("practical")) return "lab-manual";
  if (lower.includes("syllabus")) return "syllabus";
  if (lower.includes("reference") || lower.includes("book")) return "reference-book";
  if (lower.includes("project") || lower.includes("report")) return "project-report";
  return "";
}

function sanitizeSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

let rowCounter = 0;

export default function DriveAutomationPage() {
  const [step, setStep] = useState<"username" | "paste" | "table" | "done">("username");
  const [githubUser, setGithubUser] = useState("");
  const [rawText, setRawText] = useState("");
  const [rows, setRows] = useState<RowData[]>([]);
  const [mergedJsons, setMergedJsons] = useState<MergedJSON[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Parse text into rows
  const parsedFiles = useMemo(() => {
    if (!rawText.trim()) return [];
    return rawText
      .split("\n")
      .map(parseLink)
      .filter((f): f is ParsedFile => f !== null && !isMedia(f.ext));
  }, [rawText]);

  // Go from paste → table
  const handleParse = useCallback(() => {
    const newRows: RowData[] = parsedFiles.map((f) => {
      const nameNoExt = f.fileName.replace(/\.[^/.]+$/, "").trim();
      return {
        id: ++rowCounter,
        title: nameNoExt,
        url: f.url,
        detectedType: detectTypeFromName(f.fileName),
        subject: "",
        isMedia: false,
      };
    });
    setRows(newRows);
    setStep("table");
  }, [parsedFiles]);

  function updateRow(id: number, field: "subject" | "type", value: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, [field]: field === "type" ? (value as DocType) : value }
          : r
      )
    );
  }

  function handleGenerate() {
    setShowConfirm(true);
  }

  function confirmGenerate() {
    setIsGenerating(true);
    const today = new Date().toISOString().split("T")[0];

    // Group rows by subject (lowercase)
    const groups = new Map<string, RowData[]>();
    for (const row of rows) {
      const key = row.subject.trim().toLowerCase();
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    const results: MergedJSON[] = [];
    for (const [subjectKey, subjectRows] of groups.entries()) {
      const documents = subjectRows.map((r) => ({
        title: r.title,
        url: r.url,
        type: (r.detectedType || "mixed") as DocType,
        contributor: githubUser,
        uploadedAt: today,
      }));
      const content = JSON.stringify(documents, null, 2);
      const slug = sanitizeSlug(subjectKey);
      const fileName = `${slug}-${sanitizeSlug(githubUser)}.json`;
      results.push({ subject: subjectKey, fileName, content, docCount: documents.length });
    }

    setMergedJsons(results);
    setShowConfirm(false);
    setIsGenerating(false);
    setStep("done");
  }

  function downloadFile(item: MergedJSON) {
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
    mergedJsons.forEach((item, i) => {
      if (i === 0) downloadFile(item);
      else setTimeout(() => downloadFile(item), i * 500);
    });
  }

  function resetAll() {
    setStep("username");
    setGithubUser("");
    setRawText("");
    setRows([]);
    setMergedJsons([]);
  }

  const validForGenerate = rows.length > 0 && rows.every((r) => r.subject.trim() && r.detectedType);
  const totalDocs = rows.length;

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <div className="mt-12 sm:mt-16">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Drive to JSON
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Turn Google Drive links into metadata JSON files for JU Learning.
          Videos and images are auto-skipped.
        </p>
      </div>

      {/* Instructions */}
      <div className="mt-10 border-l-2 border-brand/40 bg-surface px-6 py-5">
        <h2 className="text-lg font-bold text-foreground">How it works</h2>
        <div className="mt-3 flex flex-col gap-3 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground">Step 0: Make your Drive folder public</p>
            <p className="mt-1">Create a folder in Google Drive, right-click → <strong>Share</strong> → <strong>General access</strong> → <strong>Anyone with the link</strong> → <strong>Viewer</strong>. Drop your files in — they inherit the folder's public visibility.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Step 1: Get your links</p>
            <p className="mt-1">Open the folder in <strong>List view</strong>. Click the <strong>Google Drive Link Getter</strong> extension in your browser toolbar to list all files with their public URLs.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Step 2: Paste here</p>
            <p className="mt-1">Enter your GitHub username, paste the tab-separated list, and select the type and subject for each file.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Step 3: Merge &amp; download</p>
            <p className="mt-1">Files with the same subject are merged into a single JSON. Download the files and open a PR in the metadata repo.</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground/60">
          Extension:{" "}
          <a href="https://chromewebstore.google.com/detail/Google%20Drive%20Link%20Getter/pcepfnopeaalfdibnbflpphaapbfoicl" target="_blank" rel="noopener noreferrer" className="text-brand underline">
            Google Drive Link Getter
          </a>
        </p>
      </div>

      {/* STEP: Username */}
      {step === "username" && (
        <div className="mt-12">
          <label className="block text-sm font-semibold text-foreground">Your GitHub Username</label>
          <p className="mt-1 text-sm text-muted-foreground">
            This will be used as the contributor name in every generated JSON file.
          </p>
          <input
            type="text"
            value={githubUser}
            onChange={(e) => setGithubUser(e.target.value)}
            placeholder="e.g. aryanbatras"
            className="mt-3 w-full max-w-md border-0 bg-surface px-5 py-4 text-base text-foreground ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/20 outline-none"
            autoFocus
          />
          <button
            onClick={() => githubUser.trim() && setStep("paste")}
            disabled={!githubUser.trim()}
            className="mt-6 inline-block bg-brand px-8 py-4 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      )}

      {/* STEP: Paste links */}
      {step === "paste" && (
        <div className="mt-12">
          <p className="mb-1 text-sm text-muted-foreground">
            Contributor: <span className="font-semibold text-foreground">{githubUser}</span>
            {" · "}
            <button onClick={() => setStep("username")} className="text-xs text-brand underline">change</button>
          </p>
          <label className="block text-sm font-semibold text-foreground mt-6">
            Paste your Drive links here
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste the tab-separated list from Google Drive Link Getter..."
            rows={8}
            className="mt-2 w-full border-0 bg-surface px-5 py-4 text-sm text-foreground ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/20 outline-none resize-y"
            autoFocus
          />

          {rawText.trim() && (
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span>{parsedFiles.length} valid file{parsedFiles.length !== 1 ? "s" : ""} detected</span>
            </div>
          )}

          {parsedFiles.length > 0 && (
            <button
              onClick={handleParse}
              className="mt-6 bg-brand px-8 py-4 text-base font-bold text-white transition-opacity hover:opacity-90"
            >
              Set types &amp; subjects →
            </button>
          )}
        </div>
      )}

      {/* STEP: Table — per-row type/subject */}
      {step === "table" && (
        <div className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Contributor: <span className="font-semibold text-foreground">{githubUser}</span>
              {" · "}
              <button onClick={() => setStep("username")} className="text-xs text-brand underline">change</button>
              {" · "}
              <button onClick={() => { setStep("paste"); setRows([]); }} className="text-xs text-brand underline">back to paste</button>
            </p>
          </div>

          {/* Scrollable table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/20 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  <th className="px-3 py-3 font-normal">#</th>
                  <th className="px-3 py-3 font-normal">File</th>
                  <th className="px-3 py-3 font-normal min-w-[140px]">Type</th>
                  <th className="px-3 py-3 font-normal min-w-[180px]">Subject</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id} className="border-b border-border/10 transition-colors hover:bg-accent/30">
                    <td className="px-3 py-3 text-xs text-muted-foreground/50">{i + 1}</td>
                    <td className="px-3 py-3 max-w-[280px]">
                      <p className="truncate font-medium text-foreground">{row.title}</p>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={row.detectedType}
                        onChange={(e) => updateRow(row.id, "type", e.target.value)}
                        className={`w-full border-0 bg-surface px-3 py-2.5 text-sm ring-1 ring-border/30 outline-none transition-all focus:ring-2 focus:ring-brand/20 ${
                          row.detectedType ? "text-foreground" : "text-muted-foreground/50"
                        }`}
                      >
                        <option value="" disabled>Select type...</option>
                        {TYPE_OPTIONS.map((t) => (
                          <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={row.subject}
                        onChange={(e) => updateRow(row.id, "subject", e.target.value)}
                        placeholder="e.g. Database Management Systems"
                        className="w-full border-0 bg-surface px-3 py-2.5 text-sm text-foreground ring-1 ring-border/30 outline-none transition-all focus:ring-2 focus:ring-brand/20 placeholder:text-muted-foreground/30"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>{totalDocs} file{totalDocs !== 1 ? "s" : ""}</span>
            {rows.filter((r) => !r.subject.trim()).length > 0 && (
              <span className="text-muted-foreground/50">
                {rows.filter((r) => !r.subject.trim()).length} missing subject
              </span>
            )}
            {rows.filter((r) => !r.detectedType).length > 0 && (
              <span className="text-muted-foreground/50">
                {rows.filter((r) => !r.detectedType).length} missing type
              </span>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={!validForGenerate}
            className="mt-6 bg-brand px-8 py-4 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Generate JSON ({totalDocs} file{totalDocs !== 1 ? "s" : ""})
          </button>

          {!validForGenerate && (
            <p className="mt-3 text-xs text-muted-foreground/50">
              Fill in type and subject for every file to continue.
            </p>
          )}
        </div>
      )}

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="mx-4 max-w-md bg-surface p-8">
            <p className="text-lg font-bold text-foreground">
              Generate JSON for {totalDocs} file{totalDocs !== 1 ? "s" : ""}?
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Files with the same subject will be merged into a single JSON. You'll get{" "}
              {new Set(rows.filter((r) => r.subject.trim()).map((r) => r.subject.trim().toLowerCase())).size} JSON file
              {new Set(rows.filter((r) => r.subject.trim()).map((r) => r.subject.trim().toLowerCase())).size !== 1 ? "s" : ""} total.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={confirmGenerate}
                disabled={isGenerating}
                className="flex-1 bg-brand px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "Yes, generate"}
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

      {/* STEP: Done — preview & download */}
      {step === "done" && (
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              Ready — {mergedJsons.length} JSON file{mergedJsons.length !== 1 ? "s" : ""}
            </h2>
            <div className="flex gap-3">
              <button
                onClick={resetAll}
                className="bg-accent px-6 py-3 text-sm font-bold text-foreground transition-opacity hover:opacity-70"
              >
                Start over
              </button>
              {mergedJsons.length > 1 && (
                <button
                  onClick={downloadAll}
                  className="bg-brand px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Download all
                </button>
              )}
            </div>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Files named as <code className="rounded bg-accent px-1.5 py-0.5 text-xs">{`{subject}-{github-username}.json`}</code>.{" "}
            Each JSON contains an array of documents sharing the same subject.
          </p>

          <div className="mt-6 space-y-6">
            {mergedJsons.map((item, i) => (
              <div key={i} className="bg-surface ring-1 ring-border/10">
                <div className="flex items-center justify-between border-b border-border/10 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.subject}</p>
                    <p className="text-xs text-muted-foreground/60">{item.fileName} · {item.docCount} document{item.docCount !== 1 ? "s" : ""}</p>
                  </div>
                  <button
                    onClick={() => downloadFile(item)}
                    className="ml-4 shrink-0 bg-brand px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                  >
                    Download JSON
                  </button>
                </div>
                <pre className="max-h-64 overflow-y-auto px-5 py-4 text-xs text-muted-foreground/70 leading-relaxed">
                  {item.content}
                </pre>
              </div>
            ))}
          </div>

          {/* Next steps */}
          <div className="mt-16 border-t border-border/10 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Clone the{" "}
              <a href="https://github.com/julearning/metadata" target="_blank" rel="noopener noreferrer" className="text-brand font-semibold underline">
                metadata repo
              </a>
              , place each JSON file in the correct subject folder, commit, and open a pull request.
            </p>
            <p className="mt-2 text-xs text-muted-foreground/50">
              The folder path is: <code className="rounded bg-accent px-1.5 py-0.5">jammu-university/btech/{`{branch}`}/{`{semester}`}/{`{subject}`}/</code>
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
