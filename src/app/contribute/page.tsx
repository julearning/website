"use client";

import { useState, useMemo, useRef } from "react";
import { documents } from "@/data/documents";
import type { DocType } from "@/lib/types";
import { TYPE_LABELS } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Shared constants                                                  */
/* ------------------------------------------------------------------ */

const DRIVE_PATTERN = /^(https?:\/\/)?(drive\.google\.com\/(file|document|presentation|spreadsheets)\/d\/|docs\.google\.com\/(document|presentation|spreadsheets)\/d\/)/i;
const CUSTOM_OPTION = "__custom__";

const TYPES: Array<{ id: DocType | string; label: string }> = [
  { id: "handwritten", label: "Handwritten Notes" },
  { id: "digital", label: "Digital Notes" },
  { id: "pyq", label: "Previous Year Questions" },
  { id: "assignment", label: "Assignment" },
  { id: "lab-manual", label: "Lab Manual" },
  { id: "syllabus", label: "Syllabus" },
  { id: "reference-book", label: "Reference Book" },
  { id: "mixed", label: "Mixed / Other" },
];

/* Source label helpers — kept in one place so both contribute and SearchHero can style them */
const SOURCE_LABELS: Record<string, string> = {
  "jammu-university": "Jammu University",
};

function getSourceLabel(id: string): string {
  return SOURCE_LABELS[id] || id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* Dynamically compute available sources from the document data */
const AVAILABLE_SOURCES = [...new Set(documents.map((d) => d.source))]
  .filter(Boolean)
  .sort()
  .map((id) => ({ id, label: getSourceLabel(id) }));

/* ------------------------------------------------------------------ */
/*  JU document helpers                                               */
/* ------------------------------------------------------------------ */const juDocs = documents.filter((d) => d.source === "jammu-university");

function getBranches() { return [...new Set(juDocs.map(d => d.branch).filter(Boolean))].sort() as string[]; }
function getSemesters(branch: string) {
  return [...new Set(juDocs.filter(d => d.branch === branch).map(d => d.semester))].filter((s): s is number => s != null).sort((a, b) => a - b);
}
function getSubjects(branch: string, semester: number): string[] {
  return [...new Set(juDocs.filter(d => d.branch === branch && d.semester === semester).map(d => d.subject).filter((s): s is string => s !== null))].sort();
}

/* ------------------------------------------------------------------ */
/*  GitHub + Drive validation                                         */
/* ------------------------------------------------------------------ */

async function validateGithub(username: string): Promise<{ valid: boolean; message: string }> {
  if (!username.trim()) return { valid: false, message: "Required" };
  if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username.trim())) return { valid: false, message: "Invalid format" };
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username.trim())}`);
    if (res.status === 200) return { valid: true, message: "Verified" };
    if (res.status === 403) return { valid: true, message: "Rate limited — couldn't verify" };
    return { valid: false, message: "GitHub user not found" };
  } catch {
    return { valid: true, message: "Couldn't verify (offline?)" };
  }
}

async function checkDriveUrl(url: string): Promise<{ exists: boolean; message: string }> {
  if (!url.trim()) return { exists: false, message: "" };
  const id = url.match(/(?:\/d\/|id=)([\w-]{25,})/)?.[1];
  if (!id) return { exists: false, message: "Could not extract file ID" };

  // Try thumbnail first (fast, works for most uploaded files)
  try {
    const thumbnailOk = await new Promise<boolean>((resolve) => {
      const img = new Image();
      const timer = setTimeout(() => resolve(false), 4000);
      img.onload = () => { clearTimeout(timer); resolve(true); };
      img.onerror = () => { clearTimeout(timer); resolve(false); };
      img.src = `https://drive.google.com/thumbnail?id=${id}&sz=w50`;
    });
    if (thumbnailOk) return { exists: true, message: "Drive file reachable" };
  } catch {
    // Thumbnail failed — fall through to HEAD request
  }

  // Fallback: try HEAD request to the actual document (works for native Google Docs)
  try {
    const headRes = await fetch(url, { method: "HEAD", mode: "no-cors" });
    // no-cors HEAD always returns opaque (status 0), so we treat any response as "reachable"
    return { exists: true, message: "Document reachable (Google Docs)" };
  } catch {
    return { exists: false, message: "File not found or not accessible" };
  }
}

/* ------------------------------------------------------------------ */
/*  Bulk-parse helpers (from old automation/drive)                    */
/* ------------------------------------------------------------------ */

interface ParsedFile { fileName: string; url: string; fileId: string; googleType: string; ext: string; }

function parseLink(line: string): ParsedFile | null {
  const trimmed = line.trim(); if (!trimmed) return null;
  const parts = trimmed.split("\t");
  let fileName = parts[0]?.trim() || ""; let url = parts[1]?.trim() || "";
  if (!url) { const si = trimmed.lastIndexOf("http"); if (si > 0) { fileName = trimmed.slice(0, si).trim(); url = trimmed.slice(si).trim(); } else return null; }
  const fm = url.match(/\/file\/d\/([^/]+)\//); const dm = url.match(/\/document\/d\/([^/]+)\//);
  const sm = url.match(/\/spreadsheets\/d\/([^/]+)\//); const pm = url.match(/\/presentation\/d\/([^/]+)\//);
  const fileId = (fm || dm || sm || pm)?.[1]; if (!fileId) return null;
  const gt = fm ? "file" : dm ? "document" : sm ? "spreadsheet" : pm ? "presentation" : "unknown";
  return { fileName, url, fileId, googleType: gt, ext: fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "" };
}

function detectTypeFromName(name: string): string {
  const l = name.toLowerCase();
  if (l.includes("pyq") || l.includes("past year") || l.includes("question paper")) return "pyq";
  if (l.includes("handwritten") || l.includes("hand written")) return "handwritten";
  if (l.includes("assignment")) return "assignment";
  if (l.includes("lab") || l.includes("manual") || l.includes("practical")) return "lab-manual";
  if (l.includes("syllabus")) return "syllabus";
  if (l.includes("reference") || l.includes("book")) return "reference-book";
  return "";
}

function sanitizeSlug(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
}

const MEDIA_EXTS = new Set(["png","jpg","jpeg","gif","webp","svg","ico","mp4","mov","avi","mkv","webm"]);

interface BulkRow { id: number; title: string; url: string; detectedType: string; subject: string; branch: string; semester: string; }

let rowCounter = 0;

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function ContributePage() {
  const [mode, setMode] = useState<"single" | "bulk">("single");

  /* ---------- Single mode state ---------- */
  const [source, setSource] = useState<string>("jammu-university");
  const [isNewSource, setIsNewSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceDesc, setNewSourceDesc] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceThumbnail, setNewSourceThumbnail] = useState("");
  const [branch, setBranch] = useState(""); const [customBranch, setCustomBranch] = useState("");
  const [semester, setSemester] = useState<number | "">(""); const [customSemester, setCustomSemester] = useState("");
  const [subject, setSubject] = useState(""); const [customSubject, setCustomSubject] = useState("");
  const [title, setTitle] = useState(""); const [url, setUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [docType, setDocType] = useState("mixed"); const [contributor, setContributor] = useState("");
  const [bmode, setBmode] = useState<"dropdown"|"custom">("dropdown");
  const [semode, setSemode] = useState<"dropdown"|"custom">("dropdown");
  const [submode, setSubmode] = useState<"dropdown"|"custom">("dropdown");
  const [urlStatus, setUrlStatus] = useState<"idle"|"checking"|"valid"|"invalid">("idle");
  const [urlMsg, setUrlMsg] = useState(""); const [ghStatus, setGhStatus] = useState<"idle"|"checking"|"valid"|"invalid">("idle");
  const [ghMsg, setGhMsg] = useState(""); const [touched, setTouched] = useState<Record<string,boolean>>({});
  const urlTimer = useRef<ReturnType<typeof setTimeout> | null>(null); const ghTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------- Bulk mode state ---------- */
  const [bulkStep, setBulkStep] = useState<"username"|"paste"|"table"|"done">("username");
  const [bulkUser, setBulkUser] = useState(""); const [rawText, setRawText] = useState("");
  const [rows, setRows] = useState<BulkRow[]>([]); const [submitting, setSubmitting] = useState(false);
  const [bulkPrUrl, setBulkPrUrl] = useState(""); const [bulkError, setBulkError] = useState("");
  const [bulkConfirmed, setBulkConfirmed] = useState(false);
  const [bulkGhStatus, setBulkGhStatus] = useState<"idle"|"checking"|"valid"|"invalid">("idle");
  const [bulkGhMsg, setBulkGhMsg] = useState("");

  /* ---------- Shared submission state ---------- */
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [prUrl, setPrUrl] = useState(""); const [errorMsg, setErrorMsg] = useState("");

  /* ---------- Single mode computed ---------- */
  const branches = useMemo(getBranches, []);
  const semesters = useMemo(() => {
    const ab = bmode === "custom" ? customBranch : branch; if (!ab) return [];
    return getSemesters(ab);
  }, [branch, customBranch, bmode]);
  const subjects = useMemo(() => {
    const ab = bmode === "custom" ? customBranch : branch;
    const as = semode === "custom" ? Number(customSemester) : Number(semester);
    if (!ab || !as) return []; return getSubjects(ab, as);
  }, [branch, customBranch, bmode, semester, customSemester, semode]);
  const resolvedBranch = bmode === "custom" ? customBranch.trim() : branch;
  const resolvedSemester = semode === "custom" ? (customSemester ? Number(customSemester) : null) : (semester || null);
  const resolvedSubject = submode === "custom" ? customSubject.trim() : subject;


  /* ---------- Bulk mode computed ---------- */
  const parsedFiles = useMemo(() => {
    if (!rawText.trim()) return [];
    return rawText.split("\n").map(parseLink).filter((f): f is ParsedFile => f !== null && !MEDIA_EXTS.has(f.ext));
  }, [rawText]);

  const parsedRows = useMemo(() => parsedFiles.map(f => {
    const nameNoExt = f.fileName.replace(/\.[^/.]+$/, "").trim();
    return { id: ++rowCounter, title: nameNoExt, url: f.url, detectedType: detectTypeFromName(f.fileName), subject: "", branch: "", semester: "" };
  }), [parsedFiles]);

  /* ---------- Single: URL change ---------- */
  function handleUrlChange(val: string) {
    setUrl(val); if (urlTimer.current) clearTimeout(urlTimer.current);
    if (!val.trim()) { setUrlStatus("idle"); setUrlMsg(""); return; }
    const needsDrive = !isNewSource && source === "jammu-university";
    if (needsDrive) {
      if (!DRIVE_PATTERN.test(val.trim())) { setUrlStatus("invalid"); setUrlMsg("Must use a Google Drive link"); return; }
      setUrlStatus("checking"); setUrlMsg("Checking reachability...");
      urlTimer.current = setTimeout(async () => {
        const r = await checkDriveUrl(val); setUrlStatus(r.exists ? "valid" : "invalid"); setUrlMsg(r.message);
      }, 500);
    } else {
      // Non-Drive sources: basic URL check
      try { new URL(val.trim()); setUrlStatus("valid"); setUrlMsg("Valid URL"); }
      catch { setUrlStatus("invalid"); setUrlMsg("Invalid URL format"); }
    }
  }

  /* ---------- Single: GitHub validation ---------- */
  function handleGhChange(val: string) {
    setContributor(val); setGhStatus("idle"); setGhMsg("");
    if (ghTimer.current) clearTimeout(ghTimer.current);
    if (!val.trim()) return;
    ghTimer.current = setTimeout(async () => {
      setGhStatus("checking"); const r = await validateGithub(val);
      setGhStatus(r.valid ? "valid" : "invalid"); setGhMsg(r.message);
    }, 600);
  }

  /* ---------- Single: submit ---------- */
  const newSourceValid = isNewSource ? (newSourceName.trim() && newSourceUrl.trim()) : true;
  const juValid = !isNewSource && source === "jammu-university" ? (resolvedBranch && resolvedSemester && resolvedSubject) : true;
  const singleValid = title.trim() && url.trim() && urlStatus !== "invalid" && contributor.trim() && ghStatus !== "invalid" && juValid && newSourceValid;

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!singleValid) return;
    setStatus("loading"); setErrorMsg("");
    try {
      const res = await fetch("/api/contribute", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "single",
          source: isNewSource ? sanitizeSlug(newSourceName) : source,
          isNewSource,
          sourceName: isNewSource ? newSourceName.trim() : undefined,
          sourceDescription: isNewSource ? newSourceDesc.trim() : undefined,
          sourceUrl: isNewSource ? newSourceUrl.trim() : undefined,
          sourceThumbnailUrl: isNewSource ? newSourceThumbnail.trim() || undefined : undefined,
          title: title.trim(),
          url: url.trim(),
          thumbnailUrl: thumbnailUrl.trim() || undefined,
          type: docType,
          contributor: contributor.trim() || "anonymous",
          branch: resolvedBranch,
          semester: Number(resolvedSemester),
          subject: resolvedSubject,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus("error"); setErrorMsg(data.error || "Something went wrong."); return; }
      setStatus("success"); setPrUrl(data.prUrl);
    } catch { setStatus("error"); setErrorMsg("Network error."); }
  }

  /* ---------- Bulk: parse → table ---------- */
  function handleParse() {
    setRows(parsedRows); setBulkStep("table");
  }

  function updateRow(id: number, field: "subject" | "type" | "branch" | "semester", value: string) {
    const propMap: Record<string, string> = { type: "detectedType", subject: "subject", branch: "branch", semester: "semester" };
    const prop = propMap[field] || field;
    setRows(prev => prev.map(r => r.id === id ? { ...r, [prop]: value } : r));
  }

  function copyFromAbove(id: number) {
    setRows(prev => {
      const idx = prev.findIndex(r => r.id === id);
      if (idx <= 0) return prev;
      const above = prev[idx - 1];
      return prev.map((r, i) => i === idx ? { ...r, branch: above.branch, semester: above.semester, subject: above.subject, detectedType: above.detectedType } : r);
    });
  }

  function deleteRow(id: number) {
    setRows(prev => prev.filter(r => r.id !== id));
  }

  const bulkValid = rows.length > 0 && rows.every(r => r.subject.trim() && r.detectedType && r.branch && r.semester) && bulkConfirmed;

  /* ---------- Bulk: submit to API ---------- */
  async function handleBulkSubmit() {
    if (!bulkValid || submitting) return;
    setSubmitting(true); setBulkError("");
    try {
      const docs = rows.map(r => ({
        title: r.title,
        url: r.url,
        type: r.detectedType || "mixed",
        subject: r.subject.trim(),
        contributor: bulkUser,
        branch: r.branch,
        semester: Number(r.semester),
        degree: "btech",
      }));
      const res = await fetch("/api/contribute", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode:"bulk", contributor: bulkUser, docs }),
      });
      const data = await res.json();
      if (!res.ok) { setBulkError(data.error || "Something went wrong."); return; }
      setBulkPrUrl(data.prUrl); setBulkStep("done");
    } catch { setBulkError("Network error."); }
    finally { setSubmitting(false); }
  }

  function resetSingle() {
    if (urlTimer.current) clearTimeout(urlTimer.current); if (ghTimer.current) clearTimeout(ghTimer.current);
    setStatus("idle"); setPrUrl(""); setErrorMsg("");
    setSource("jammu-university");
    setIsNewSource(false); setNewSourceName(""); setNewSourceDesc(""); setNewSourceUrl(""); setNewSourceThumbnail("");
    setTitle(""); setUrl(""); setThumbnailUrl(""); setUrlStatus("idle"); setUrlMsg(""); setDocType("mixed");
    setContributor(""); setGhStatus("idle"); setGhMsg("");
    setBranch(""); setCustomBranch(""); setBmode("dropdown");
    setSemester(""); setCustomSemester(""); setSemode("dropdown");
    setSubject(""); setCustomSubject(""); setSubmode("dropdown");
    setTouched({});
  }

  function handleBulkGhChange(val: string) {
    setBulkUser(val); setBulkGhStatus("idle"); setBulkGhMsg("");
    if (ghTimer.current) clearTimeout(ghTimer.current);
    if (!val.trim()) return;
    ghTimer.current = setTimeout(async () => {
      setBulkGhStatus("checking"); const r = await validateGithub(val);
      setBulkGhStatus(r.valid ? "valid" : "invalid"); setBulkGhMsg(r.message);
    }, 600);
  }

  function resetBulk() { setBulkStep("username"); setBulkUser(""); setRawText(""); setRows([]); setBulkPrUrl(""); setBulkError(""); setBulkConfirmed(false); setBulkGhStatus("idle"); setBulkGhMsg(""); }

  function markTouched(f: string) { setTouched(t => ({ ...t, [f]: true })); }

  /* ---------- Single preview ---------- */
  const previewJson = useMemo(() => {
    if (!title.trim() || !url.trim() || !contributor.trim()) return null;
    if (source === "jammu-university" && (!resolvedBranch || !resolvedSemester || !resolvedSubject)) return null;
    const entry: Record<string, unknown> = { title: title.trim(), url: url.trim(), type: docType, contributor: contributor.trim() };
    if (thumbnailUrl.trim()) entry.thumbnailUrl = thumbnailUrl.trim();
    if (source !== "jammu-university") entry.description = docType;
    entry.uploadedAt = new Date().toISOString().split("T")[0];
    return JSON.stringify([entry], null, 2);
  }, [title, url, contributor, thumbnailUrl, docType, source, resolvedBranch, resolvedSemester, resolvedSubject]);

  /* ---------- Render ---------- */
  return (
    <main className="mx-auto max-w-4xl px-6 pb-16">
      <div className="pt-16 sm:pt-20">
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl">Contribute</h1>
        <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
          Add study materials to JU Learning. We&apos;ll open a pull request on GitHub automatically.
        </p>

        {/* Mode toggle */}
        <div className="mt-8 flex gap-0">
          <button onClick={() => setMode("single")} className={`px-8 py-3 text-base font-bold transition-all ${mode === "single" ? "bg-brand text-white" : "bg-surface text-muted-foreground hover:text-foreground"}`}>Single document</button>
          <button onClick={() => setMode("bulk")} className={`px-8 py-3 text-base font-bold transition-all ${mode === "bulk" ? "bg-brand text-white" : "bg-surface text-muted-foreground hover:text-foreground"}`}>Multiple documents</button>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  SINGLE MODE                                                  */}
      {/* ============================================================ */}
      {mode === "single" && status !== "success" && (
        <form onSubmit={handleSingleSubmit} className="mt-10 space-y-8">
          {/* Source selector */}
          <div className="mb-6">
            <p className="mb-4 text-sm font-semibold text-foreground">Source</p>
            <div className="flex flex-wrap gap-1">
              {AVAILABLE_SOURCES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setIsNewSource(false); setSource(s.id); }}
                  className={`px-6 py-3 text-sm font-bold transition-all ${
                    !isNewSource && source === s.id
                      ? "bg-brand text-white"
                      : "bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
              {/* New source button */}
              <button
                type="button"
                onClick={() => { setIsNewSource(true); setSource("__new__"); }}
                className={`px-6 py-3 text-sm font-bold transition-all ${
                  isNewSource
                    ? "bg-brand text-white"
                    : "bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                + New Source
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground/60">
              Need to contribute to a different platform?{" "}
              <button type="button" onClick={() => { setMode("single"); setIsNewSource(true); setSource("__new__"); }}
                className="font-semibold text-brand underline transition-colors hover:text-brand/80">
                Create a new source
              </button>
            </p>
          </div>

          {/* New source fields */}
          {isNewSource && (
            <div className="space-y-4 mb-6">
              <p className="mb-4 text-sm font-semibold text-foreground">New Source Details</p>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Source Name</label>
                  <input type="text" value={newSourceName} onChange={e => setNewSourceName(e.target.value)}
                    onBlur={() => markTouched("newSourceName")}
                    placeholder="e.g., MIT OCW"
                    className="w-full border-0 bg-surface px-4 py-3 text-base text-foreground placeholder-muted-foreground/40 outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30" />
                  {touched["newSourceName"] && !newSourceName.trim() && <p className="mt-1 text-xs text-red-500">Required</p>}
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Description</label>
                  <input type="text" value={newSourceDesc} onChange={e => setNewSourceDesc(e.target.value)}
                    placeholder="Briefly describe this source"
                    className="w-full border-0 bg-surface px-4 py-3 text-base text-foreground placeholder-muted-foreground/40 outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Website URL</label>
                  <input type="url" value={newSourceUrl} onChange={e => setNewSourceUrl(e.target.value)}
                    onBlur={() => markTouched("newSourceUrl")}
                    placeholder="https://..."
                    className="w-full border-0 bg-surface px-4 py-3 text-base text-foreground placeholder-muted-foreground/40 outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30" />
                  {touched["newSourceUrl"] && !newSourceUrl.trim() && <p className="mt-1 text-xs text-red-500">Required</p>}
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Thumbnail URL</label>
                  <input type="url" value={newSourceThumbnail} onChange={e => setNewSourceThumbnail(e.target.value)}
                    placeholder="https://.../logo.png"
                    className="w-full border-0 bg-surface px-4 py-3 text-base text-foreground placeholder-muted-foreground/40 outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30" />
                </div>
              </div>
            </div>
          )}

          {/* Branch → Semester → Subject (only for jammu-university) */}
          {!isNewSource && source === "jammu-university" && (
          <div>
            <p className="mb-4 text-sm font-semibold text-foreground">Where does this document belong?</p>
            <div className="grid grid-cols-3 gap-4">
              {[{ label:"1. Branch", val:branch, setVal:setBranch, mode:bmode, setMode:setBmode, custom:customBranch, setCustom:setCustomBranch, opts:branches, ph:"e.g., ECE", disabled:false, key:"branch" },
                { label:"2. Semester", val:semester, setVal:(v:any)=>setSemester(v), mode:semode, setMode:setSemode, custom:customSemester, setCustom:setCustomSemester, opts:semesters, ph:"e.g., 5", disabled:!resolvedBranch, key:"semester" },
                { label:"3. Subject", val:subject, setVal:setSubject, mode:submode, setMode:setSubmode, custom:customSubject, setCustom:setCustomSubject, opts:subjects, ph:"e.g., Machine Learning", disabled:!resolvedSemester, key:"subject" }
              ].map(f => (
                <div key={f.key}>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{f.label}</label>
                  {f.mode === "dropdown" ? (
                    <>
                      <select value={f.val as string} onChange={e => { if (e.target.value === CUSTOM_OPTION) { f.setMode("custom"); } else { f.setVal?.(e.target.value); } }}
                        onBlur={() => markTouched(f.key)} disabled={f.disabled}
                        className={`w-full border-0 bg-surface px-4 py-3 text-base outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30 ${f.val ? "text-foreground" : "text-muted-foreground/60"} ${f.disabled ? "opacity-40" : ""}`}>
                        <option value="">Select {f.key}</option>
                        {(f.opts as any[]).map(o => <option key={o} value={o}>{f.key === "semester" ? `Semester ${o}` : o}</option>)}
                        <option value={CUSTOM_OPTION}>—— Add custom {f.key} ——</option>
                      </select>
                      {touched[f.key] && !f.val && <p className="mt-1 text-xs text-red-500">Select a {f.key}</p>}
                    </>
                  ) : (
                    <div>
                      <input type={f.key === "semester" ? "number" : "text"} min={1} max={12} value={f.custom} onChange={e => f.setCustom(e.target.value)}
                        onBlur={() => markTouched(f.key)} placeholder={f.ph} autoFocus
                        className="w-full border-0 bg-surface px-4 py-3 text-base text-foreground placeholder-muted-foreground/40 outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30" />
                      <button type="button" onClick={() => { f.setMode("dropdown"); f.setCustom(""); }} className="mt-2 text-xs font-semibold text-muted-foreground/50 transition-colors hover:text-foreground">← Back to {f.key}s</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Document details */}
          <div>
            <p className="mb-4 text-sm font-semibold text-foreground">Document details</p>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} onBlur={() => markTouched("title")} placeholder="e.g., DBMS Unit 1 Notes"
                  className="w-full border-0 bg-surface px-4 py-3 text-base text-foreground placeholder-muted-foreground/40 outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30" />
                {touched.title && !title.trim() && <p className="mt-1 text-xs text-red-500">Required</p>}
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{!isNewSource && source === "jammu-university" ? "Drive URL" : "Document URL"}</label>
                <input type="url" value={url} onChange={e => handleUrlChange(e.target.value)} onBlur={() => markTouched("url")}
                  placeholder={!isNewSource && source === "jammu-university" ? "https://drive.google.com/file/d/..." : "https://..."}
                  className={`w-full border-0 bg-surface px-4 py-3 text-base text-foreground placeholder-muted-foreground/40 outline-none ring-1 transition-all focus:ring-2 ${touched.url && urlStatus === "invalid" ? "ring-red-300 focus:ring-red-400" : "ring-border/30 focus:ring-brand/30"}`} />
                <div className="mt-1 flex items-center gap-1.5">
                  {urlStatus === "checking" && <><svg className="h-3 w-3 animate-spin text-muted-foreground/50" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" className="opacity-75" /></svg><span className="text-xs text-muted-foreground/60">{urlMsg}</span></>}
                  {touched.url && urlStatus === "valid" && <span className="text-xs text-brand/80">{urlMsg}</span>}
                  {touched.url && urlStatus === "invalid" && <span className="text-xs text-red-500">{urlMsg}</span>}
                  {touched.url && urlStatus === "idle" && !url.trim() && <span className="text-xs text-red-500">Required</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Type</label>
                  <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full border-0 bg-surface px-4 py-3 text-base text-foreground outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30">
                    {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Thumbnail URL (optional)</label>
                  <input type="url" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)}
                    placeholder="https://drive.google.com/thumbnail?id=..."
                    className="w-full border-0 bg-surface px-4 py-3 text-base text-foreground placeholder-muted-foreground/40 outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Your GitHub Username</label>
                  <div className="relative">
                    <input type="text" value={contributor} onChange={e => handleGhChange(e.target.value)} onBlur={() => markTouched("contributor")}
                      placeholder="e.g., aryanbatras"
                      className={`w-full border-0 bg-surface px-4 py-3 pr-10 text-base text-foreground placeholder-muted-foreground/40 outline-none ring-1 transition-all focus:ring-2 ${touched.contributor && ghStatus === "invalid" ? "ring-red-300 focus:ring-red-400" : "ring-border/30 focus:ring-brand/30"}`} />
                    {ghStatus === "checking" && <span className="absolute right-3 top-1/2 -translate-y-1/2"><svg className="h-4 w-4 animate-spin text-muted-foreground/50" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" className="opacity-75" /></svg></span>}
                    {ghStatus === "valid" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-brand">✓</span>}
                    {ghStatus === "invalid" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-red-500">✗</span>}
                  </div>
                  {touched.contributor && contributor.trim() && ghStatus === "invalid" && <p className="mt-1 text-xs text-red-500">{ghMsg}</p>}
                  {touched.contributor && contributor.trim() && ghStatus === "valid" && <p className="mt-1 text-xs text-brand/80">{ghMsg}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          {previewJson && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Preview</p>
              <pre className="overflow-x-auto bg-surface p-4 text-xs leading-relaxed text-muted-foreground ring-1 ring-border/30">{previewJson}</pre>
            </div>
          )}

          {status === "error" && <div className="bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">{errorMsg}</div>}

          <button type="submit" disabled={!singleValid || status === "loading"}
            className={`w-full px-8 py-5 text-lg font-bold text-white transition-all ${status === "loading" ? "bg-muted-foreground/30 cursor-not-allowed" : singleValid ? "bg-brand hover:opacity-90 cursor-pointer" : "bg-muted-foreground/20 text-muted-foreground/50 cursor-not-allowed"}`}>
            {status === "loading" ? <span className="flex items-center justify-center gap-2"><svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" className="opacity-75" /></svg>Creating pull request...</span> : "Raise Pull Request"}
          </button>
        </form>
      )}

      {mode === "single" && status === "success" && (
        <div className="mt-12 bg-surface p-10 text-center">
          <p className="text-2xl font-bold text-foreground">Pull Request Created!</p>
          <p className="mt-3 text-sm text-muted-foreground">A maintainer will review and merge it.</p>
          <a href={prUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block bg-brand px-8 py-4 text-lg font-bold text-white transition-opacity hover:opacity-90">View PR on GitHub ↗</a>
          <button onClick={resetSingle} className="mt-4 block w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground">Submit another document</button>
        </div>
      )}

      {/* ============================================================ */}
      {/*  BULK MODE                                                    */}
      {/* ============================================================ */}
      {mode === "bulk" && bulkStep !== "done" && (
        <div className="mt-10">
          {/* Instructions */}
          <div className="bg-surface px-6 py-5 mb-8">
            <h2 className="text-lg font-bold text-foreground">How to contribute multiple documents</h2>
            <ol className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground list-decimal list-inside">
              <li><strong>Make your files publicly accessible</strong>. Create a folder in Google Drive, right-click → <strong>Share</strong> → <strong>Anyone with the link</strong> → <strong>Viewer</strong>. Drop your files in. <span className="text-amber-600/70">Important: just having a link is not enough — you must explicitly set the sharing to &quot;Anyone with the link&quot;.</span></li>
              <li><strong>Copy all links at once.</strong> Open the folder in <strong>List view</strong>. Install and click the <a href="https://chromewebstore.google.com/detail/Google%20Drive%20Link%20Getter/pcepfnopeaalfdibnbflpphaapbfoicl" target="_blank" rel="noopener noreferrer" className="text-brand underline">Drive Link Getter</a> extension to copy all file names and links as a list.</li>
              <li><strong>Configure and submit.</strong> Paste the links below, set the branch, semester, type and subject for each file, confirm the checkbox, and click submit. A pull request will be raised automatically — you can view it, track it, and see exactly how everything works.</li>
            </ol>
          </div>

          {bulkStep === "username" && (
            <div>
              <label className="block text-sm font-semibold text-foreground">Your GitHub Username</label>
              <p className="mt-1 text-sm text-muted-foreground">This will be used as the contributor for every document.</p>
              <div className="relative max-w-md">
                <input type="text" value={bulkUser} onChange={e => handleBulkGhChange(e.target.value)} placeholder="e.g., aryanbatras" autoFocus
                  className={`mt-3 w-full border-0 bg-surface px-5 py-4 pr-10 text-base text-foreground outline-none ring-1 transition-all focus:ring-2 ${bulkGhStatus === "invalid" ? "ring-red-300 focus:ring-red-400" : "ring-border/30 focus:ring-brand/20"}`} />
                {bulkGhStatus === "checking" && <span className="absolute right-4 top-1/2 -translate-y-1/2"><svg className="h-4 w-4 animate-spin text-muted-foreground/50" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" className="opacity-75" /></svg></span>}
                {bulkGhStatus === "valid" && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-brand">✓</span>}
                {bulkGhStatus === "invalid" && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-red-500">✗</span>}
              </div>
              {bulkUser.trim() && bulkGhStatus === "invalid" && <p className="mt-2 text-xs text-red-500">{bulkGhMsg}</p>}
              {bulkUser.trim() && bulkGhStatus === "valid" && <p className="mt-2 text-xs text-brand/80">{bulkGhMsg}</p>}
              {bulkGhStatus === "checking" && <p className="mt-2 text-xs text-muted-foreground/60">Verifying...</p>}
              <button onClick={() => bulkGhStatus !== "invalid" && bulkUser.trim() && setBulkStep("paste")} disabled={!bulkUser.trim() || bulkGhStatus === "invalid"}
                className="mt-6 bg-brand px-8 py-4 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed">Continue</button>
            </div>
          )}

          {bulkStep === "paste" && (
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Contributor: <span className="font-semibold text-foreground">{bulkUser}</span> · <button onClick={() => setBulkStep("username")} className="text-xs text-brand underline">change</button></p>
              <label className="mt-6 block text-sm font-semibold text-foreground">Paste your Drive links here</label>
              <textarea value={rawText} onChange={e => setRawText(e.target.value)} placeholder="Paste the tab-separated list from Google Drive Link Getter..." rows={8} autoFocus
                className="mt-2 w-full border-0 bg-surface px-5 py-4 text-sm text-foreground outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/20 resize-y" />
              {rawText.trim() && <p className="mt-4 text-sm text-muted-foreground">{parsedFiles.length} valid file{parsedFiles.length !== 1 ? "s" : ""} detected</p>}
              {parsedFiles.length > 0 && <button onClick={handleParse} className="mt-6 bg-brand px-8 py-4 text-base font-bold text-white transition-opacity hover:opacity-90">Set types & subjects →</button>}
            </div>
          )}

          {bulkStep === "table" && (
            <div>
              <p className="mb-4 text-sm text-muted-foreground">Contributor: <span className="font-semibold text-foreground">{bulkUser}</span> · <button onClick={() => setBulkStep("username")} className="text-xs text-brand underline">change</button> · <button onClick={() => { setBulkStep("paste"); setRows([]); }} className="text-xs text-brand underline">back to paste</button></p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/20 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                      <th className="px-2 py-3 font-normal w-8"></th>
                      <th className="px-2 py-3 font-normal">#</th>
                      <th className="px-2 py-3 font-normal">File</th>
                      <th className="px-2 py-3 font-normal min-w-[100px]">Branch</th>
                      <th className="px-2 py-3 font-normal min-w-[100px]">Sem</th>
                      <th className="px-2 py-3 font-normal min-w-[150px]">Subject</th>
                      <th className="px-2 py-3 font-normal min-w-[120px]">Type</th>
                      <th className="px-2 py-3 font-normal w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const semesters = row.branch ? getSemesters(row.branch) : [];
                      const subjects = row.branch && row.semester ? getSubjects(row.branch, Number(row.semester)) : [];
                      return (
                      <tr key={row.id} className="border-b border-border/10 transition-colors hover:bg-accent/30">
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <a href={row.url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
                              title="View document">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            </a>
                            <button onClick={() => deleteRow(row.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-red-50 hover:text-red-500"
                              title="Remove document">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-xs text-muted-foreground/50">{i + 1}</td>
                        <td className="px-2 py-2 max-w-[160px]"><p className="truncate font-medium text-foreground text-[11px]">{row.title}</p></td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <input type="text" value={row.branch} onChange={e => updateRow(row.id, "branch", e.target.value)}
                              placeholder="Br." list={`branches-${row.id}`}
                              className="w-full border-0 bg-surface px-2 py-2 text-[11px] text-foreground outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/20 placeholder:text-muted-foreground/40" />
                            <datalist id={`branches-${row.id}`}>
                              {branches.map(b => <option key={b} value={b} />)}
                            </datalist>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <input type="text" value={row.semester} onChange={e => updateRow(row.id, "semester", e.target.value)}
                            placeholder="Sem" list={`semesters-${row.id}`}
                            className="w-full border-0 bg-surface px-2 py-2 text-[11px] text-foreground outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/20 placeholder:text-muted-foreground/40" />
                          <datalist id={`semesters-${row.id}`}>
                            {semesters.map(s => <option key={s} value={String(s)} />)}
                          </datalist>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <input type="text" value={row.subject} onChange={e => updateRow(row.id, "subject", e.target.value)}
                              placeholder="Subject" list={`subjects-${row.id}`}
                              className="w-full border-0 bg-surface px-2 py-2 text-[11px] text-foreground outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/20 placeholder:text-muted-foreground/30" />
                            <datalist id={`subjects-${row.id}`}>
                              {subjects.map(s => <option key={s} value={s} />)}
                            </datalist>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <select value={row.detectedType} onChange={e => updateRow(row.id, "type", e.target.value)}
                            className={`w-full border-0 bg-surface px-2 py-2 text-[11px] outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/20 ${row.detectedType ? "text-foreground" : "text-muted-foreground/50"}`}>
                            <option value="" disabled>Type</option>
                            {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          {i > 0 && (
                            <button onClick={() => copyFromAbove(row.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground/40 transition-colors hover:bg-accent hover:text-brand"
                              title="Copy values from above row">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="16 3 21 3 21 8"/>
                                <line x1="4" y1="20" x2="21" y2="3"/>
                                <polyline points="21 16 21 21 16 21"/>
                                <line x1="15" y1="15" x2="21" y2="21"/>
                                <line x1="4" y1="4" x2="9" y2="9"/>
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {rows.length} file{rows.length !== 1 ? "s" : ""}
                {rows.filter(r => !r.branch).length > 0 && <span className="ml-2 text-muted-foreground/50">· {rows.filter(r => !r.branch).length} missing branch</span>}
                {rows.filter(r => !r.semester).length > 0 && <span className="ml-2 text-muted-foreground/50">· {rows.filter(r => !r.semester).length} missing semester</span>}
                {rows.filter(r => !r.subject.trim()).length > 0 && <span className="ml-2 text-muted-foreground/50">· {rows.filter(r => !r.subject.trim()).length} missing subject</span>}
              </p>
              {bulkError && <div className="mt-4 bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">{bulkError}</div>}

              {/* Confirmation checkbox */}
              <label className="mt-6 flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={bulkConfirmed} onChange={e => setBulkConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  I confirm that <strong>all my documents are publicly accessible</strong> and anyone with the link can view them. I have clicked the <strong>Share</strong> button and set the link sharing to <strong>&quot;Anyone with the link&quot;</strong> → <strong>Viewer</strong> for every file.
                </span>
              </label>

              <button onClick={handleBulkSubmit} disabled={!bulkValid || submitting}
                className={`mt-6 bg-brand px-8 py-4 text-base font-bold text-white transition-opacity ${(!bulkValid || submitting) ? "opacity-30 cursor-not-allowed" : "hover:opacity-90 cursor-pointer"}`}>
                {submitting ? "Creating pull request..." : `Submit ${rows.length} file${rows.length !== 1 ? "s" : ""}`}
              </button>
              {!bulkValid && <p className="mt-3 text-xs text-muted-foreground/50">Fill in branch, semester, type & subject for every file, and confirm the checkbox to continue.</p>}
              <p className="mt-4 text-xs text-muted-foreground/50 leading-relaxed">
                Once you click submit, a pull request will be created on GitHub. You can <strong>View PR on GitHub</strong> to see exactly what files were created, track the review process, and understand how everything works behind the scenes. A maintainer will review and merge it.
              </p>
            </div>
          )}
        </div>
      )}

      {mode === "bulk" && bulkStep === "done" && (
        <div className="mt-12 bg-surface p-10 text-center">
          <p className="text-3xl font-bold text-foreground">🎉 Congratulations!</p>
          <p className="mt-2 text-lg text-foreground">You&apos;ve made your first open source contribution!</p>
          <p className="mt-3 text-sm text-muted-foreground">{rows.length} document{rows.length !== 1 ? "s" : ""} submitted in a single PR.</p>
          <a href={bulkPrUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block bg-brand px-8 py-4 text-lg font-bold text-white transition-opacity hover:opacity-90">View PR on GitHub ↗</a>
          <div className="mt-6 flex items-center justify-center gap-2">
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(bulkPrUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#0A66C2] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              Share on LinkedIn
            </a>
          </div>
          <button onClick={resetBulk} className="mt-6 block w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground">Submit more documents</button>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground/50">
        By submitting, you agree that your document links will be publicly listed on JU Learning.
        Your files stay on your Drive — we only index the links.
      </p>
    </main>
  );
}
