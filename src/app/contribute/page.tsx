"use client";

import { useState, useMemo, useRef } from "react";
import { documents } from "@/data/documents";

const TYPES = [
  { id: "handwritten", label: "Handwritten Notes" },
  { id: "digital", label: "Digital Notes" },
  { id: "pyq", label: "Previous Year Questions" },
  { id: "assignment", label: "Assignment" },
  { id: "lab-manual", label: "Lab Manual" },
  { id: "syllabus", label: "Syllabus" },
  { id: "reference-book", label: "Reference Book" },
  { id: "mixed", label: "Mixed / Other" },
];

/** Pattern for Google Drive file/doc links */
const DRIVE_PATTERN = /^(https?:\/\/)?(drive\.google\.com\/(file|document|presentation|spreadsheets)\/d\/|docs\.google\.com\/(document|presentation|spreadsheets)\/d\/)/i;

/** Only JU documents for the branch/semester/subject dropdowns */
const juDocs = documents.filter((d) => d.source === "jammu-university");

/** "Add custom..." sentinel value */
const CUSTOM_OPTION = "__custom__";

/**
 * Validates a GitHub username by calling the public API.
 * Returns { valid, message }.
 */
async function validateGithub(username: string): Promise<{ valid: boolean; message: string }> {
  if (!username.trim()) return { valid: false, message: "Required" };
  if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username.trim())) {
    return { valid: false, message: "Not a valid GitHub username format" };
  }
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username.trim())}`);
    if (res.status === 200) return { valid: true, message: "Verified" };
    if (res.status === 403) return { valid: true, message: "Rate limited — couldn't verify" }; // pass through
    return { valid: false, message: "GitHub user not found" };
  } catch {
    return { valid: true, message: "Couldn't verify (offline?)" }; // pass through on network error
  }
}

/**
 * Returns a validation error string, or null if valid.
 */
function validateDriveUrl(url: string): string | null {
  if (!url.trim()) return null;
  if (!DRIVE_PATTERN.test(url.trim())) {
    return "Must be a Google Drive or Docs link";
  }
  return null;
}

export default function ContributePage() {
  // Field values
  const [branch, setBranch] = useState("");
  const [customBranch, setCustomBranch] = useState("");
  const [semester, setSemester] = useState<number | "">("");
  const [customSemester, setCustomSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [docType, setDocType] = useState("mixed");
  const [contributor, setContributor] = useState("");

  // Mode toggles (dropdown vs custom text)
  const [branchMode, setBranchMode] = useState<"dropdown" | "custom">("dropdown");
  const [semesterMode, setSemesterMode] = useState<"dropdown" | "custom">("dropdown");
  const [subjectMode, setSubjectMode] = useState<"dropdown" | "custom">("dropdown");

  // Validation state
  const [urlError, setUrlError] = useState<string | null>(null);
  const [ghStatus, setGhStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [ghMessage, setGhMessage] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Submission state
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [prUrl, setPrUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const ghTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute dropdown options from JU documents
  const branches = useMemo(() => {
    return [...new Set(juDocs.map((d) => d.branch).filter(Boolean))].sort() as string[];
  }, []);

  const semesters = useMemo(() => {
    if (!branch && branchMode !== "custom") return [];
    const activeBranch = branchMode === "custom" ? customBranch : branch;
    if (!activeBranch) return [];
    return [...new Set(juDocs.filter((d) => d.branch === activeBranch).map((d) => d.semester))].filter((s): s is number => s != null).sort((a, b) => a - b);
  }, [branch, customBranch, branchMode]);

  const subjects = useMemo(() => {
    const activeBranch = branchMode === "custom" ? customBranch : branch;
    const activeSemester = semesterMode === "custom" ? Number(customSemester) : semester;
    if (!activeBranch || !activeSemester) return [];
    return [...new Set(juDocs.filter((d) => d.branch === activeBranch && d.semester === activeSemester).map((d) => d.subject).filter(Boolean))].sort();
  }, [branch, customBranch, branchMode, semester, customSemester, semesterMode]);

  // Resolved values for the final display & submit
  const resolvedBranch = branchMode === "custom" ? customBranch.trim() : branch;
  const resolvedSemester = semesterMode === "custom" ? (customSemester ? Number(customSemester) : null) : (semester || null);
  const resolvedSubject = subjectMode === "custom" ? customSubject.trim() : subject;

  // Validate Drive URL on change with debounce
  const urlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleUrlChange(val: string) {
    setUrl(val);
    if (urlTimer.current) clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => {
      setUrlError(validateDriveUrl(val));
    }, 400);
  }

  // Validate GitHub username on change with debounce
  function handleGhChange(val: string) {
    setContributor(val);
    setGhStatus("idle");
    setGhMessage("");
    if (ghTimer.current) clearTimeout(ghTimer.current);
    if (!val.trim()) return;
    ghTimer.current = setTimeout(async () => {
      setGhStatus("checking");
      const result = await validateGithub(val);
      setGhStatus(result.valid ? "valid" : "invalid");
      setGhMessage(result.message);
    }, 600);
  }

  // Preview JSON
  const previewJson = useMemo(() => {
    if (!title.trim() || !url.trim() || !resolvedBranch || !resolvedSemester || !resolvedSubject) return null;
    return JSON.stringify([{
      title: title.trim(),
      url: url.trim(),
      type: docType,
      contributor: contributor.trim() || undefined,
      uploadedAt: new Date().toISOString().split("T")[0],
    }], null, 2);
  }, [title, url, docType, contributor, resolvedBranch, resolvedSemester, resolvedSubject]);

  const canSubmit =
    title.trim()
    && url.trim()
    && !urlError
    && resolvedBranch
    && resolvedSemester
    && resolvedSubject
    && ghStatus !== "invalid";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim(),
          type: docType,
          contributor: contributor.trim() || "anonymous",
          branch: resolvedBranch,
          semester: Number(resolvedSemester),
          subject: resolvedSubject,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong. Try again later.");
        return;
      }

      setStatus("success");
      setPrUrl(data.prUrl);
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Check your connection and try again.");
    }
  }

  function handleReset() {
    if (urlTimer.current) clearTimeout(urlTimer.current);
    if (ghTimer.current) clearTimeout(ghTimer.current);
    setStatus("idle");
    setPrUrl("");
    setErrorMsg("");
    setTitle("");
    setUrl("");
    setUrlError(null);
    setDocType("mixed");
    setContributor("");
    setGhStatus("idle");
    setGhMessage("");
    setBranch("");
    setCustomBranch("");
    setBranchMode("dropdown");
    setSemester("");
    setCustomSemester("");
    setSemesterMode("dropdown");
    setSubject("");
    setCustomSubject("");
    setSubjectMode("dropdown");
    setTouched({});
  }

  // Blur handler to mark fields as touched
  function markTouched(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pb-16">
      <div className="pt-16 sm:pt-20">
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl">
          Contribute
        </h1>
        <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
          Add a study material to JU Learning in one click. Fill the form and we&apos;ll open a pull request on GitHub.
        </p>
      </div>

      {status === "success" ? (
        <div className="mt-12">
          <div className="bg-surface p-10 text-center">
            <p className="text-2xl font-bold text-foreground">Pull Request Created!</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Your document has been submitted. A maintainer will review and merge it.
            </p>
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block bg-brand px-8 py-4 text-lg font-bold text-white transition-opacity hover:opacity-90"
            >
              View PR on GitHub ↗
            </a>
            <button
              onClick={handleReset}
              className="mt-4 block w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Submit another document
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-12 space-y-8">
          {/* Branch → Semester → Subject step selects */}
          <div>
            <p className="mb-4 text-sm font-semibold text-foreground">Where does this document belong?</p>
            <div className="grid grid-cols-3 gap-4">
              {/* Branch */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  1. Branch
                </label>
                {branchMode === "dropdown" ? (
                  <>
                    <select
                      value={branch}
                      onChange={(e) => {
                        if (e.target.value === CUSTOM_OPTION) {
                          setBranchMode("custom");
                          setSemester("");
                          setSubject("");
                        } else {
                          setBranch(e.target.value);
                          setSemester("");
                          setSubject("");
                        }
                      }}
                      onBlur={() => markTouched("branch")}
                      className="w-full border-0 bg-surface px-4 py-3 text-base text-foreground outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30"
                    >
                      <option value="">Select branch</option>
                      {branches.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                      <option value={CUSTOM_OPTION}>—— Add custom branch ——</option>
                    </select>
                    {touched.branch && !branch && (
                      <p className="mt-1 text-xs text-red-500">Select a branch</p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customBranch}
                      onChange={(e) => setCustomBranch(e.target.value)}
                      onBlur={() => markTouched("branch")}
                      placeholder="e.g., ECE"
                      className="flex-1 border-0 bg-surface px-4 py-3 text-base text-foreground placeholder-muted-foreground/40 outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => { setBranchMode("dropdown"); setCustomBranch(""); }}
                      className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>

              {/* Semester */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  2. Semester
                </label>
                {semesterMode === "dropdown" ? (
                  <>
                    <select
                      value={semester}
                      onChange={(e) => {
                        if (e.target.value === CUSTOM_OPTION) {
                          setSemesterMode("custom");
                          setSubject("");
                        } else {
                          setSemester(e.target.value ? Number(e.target.value) : "");
                          setSubject("");
                        }
                      }}
                      onBlur={() => markTouched("semester")}
                      disabled={!resolvedBranch}
                      className={`w-full border-0 bg-surface px-4 py-3 text-base outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30 ${
                        semester ? "text-foreground" : "text-muted-foreground/60"
                      } ${!resolvedBranch ? "opacity-40" : ""}`}
                    >
                      <option value="">Select semester</option>
                      {semesters.map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                      <option value={CUSTOM_OPTION}>—— Add custom semester ——</option>
                    </select>
                    {touched.semester && !semester && (
                      <p className="mt-1 text-xs text-red-500">Select a semester</p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={customSemester}
                      onChange={(e) => setCustomSemester(e.target.value)}
                      onBlur={() => markTouched("semester")}
                      placeholder="e.g., 5"
                      className="flex-1 border-0 bg-surface px-4 py-3 text-base text-foreground placeholder-muted-foreground/40 outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => { setSemesterMode("dropdown"); setCustomSemester(""); }}
                      className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  3. Subject
                </label>
                {subjectMode === "dropdown" ? (
                  <>
                    <select
                      value={subject}
                      onChange={(e) => {
                        if (e.target.value === CUSTOM_OPTION) {
                          setSubjectMode("custom");
                        } else {
                          setSubject(e.target.value);
                        }
                      }}
                      onBlur={() => markTouched("subject")}
                      disabled={!resolvedSemester}
                      className={`w-full border-0 bg-surface px-4 py-3 text-base outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30 ${
                        subject ? "text-foreground" : "text-muted-foreground/60"
                      } ${!resolvedSemester ? "opacity-40" : ""}`}
                    >
                      <option value="">Select subject</option>
                      {subjects.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value={CUSTOM_OPTION}>—— Add custom subject ——</option>
                    </select>
                    {touched.subject && !subject && (
                      <p className="mt-1 text-xs text-red-500">Select a subject</p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      onBlur={() => markTouched("subject")}
                      placeholder="e.g., Machine Learning"
                      className="flex-1 border-0 bg-surface px-4 py-3 text-base text-foreground placeholder-muted-foreground/40 outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => { setSubjectMode("dropdown"); setCustomSubject(""); }}
                      className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Document details */}
          <div>
            <p className="mb-4 text-sm font-semibold text-foreground">Document details</p>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => markTouched("title")}
                  placeholder="e.g., DBMS Unit 1 Notes"
                  className="w-full border-0 bg-surface px-4 py-3 text-base text-foreground placeholder-muted-foreground/40 outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30"
                />
                {touched.title && !title.trim() && (
                  <p className="mt-1 text-xs text-red-500">Required</p>
                )}
              </div>

              {/* Drive URL */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Drive URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  onBlur={() => markTouched("url")}
                  placeholder="https://drive.google.com/file/d/..."
                  className={`w-full border-0 bg-surface px-4 py-3 text-base text-foreground placeholder-muted-foreground/40 outline-none ring-1 transition-all focus:ring-2 ${
                    touched.url && urlError
                      ? "ring-red-300 focus:ring-red-400"
                      : "ring-border/30 focus:ring-brand/30"
                  }`}
                />
                {touched.url && urlError && (
                  <p className="mt-1 text-xs text-red-500">{urlError}</p>
                )}
                {touched.url && url.trim() && !urlError && (
                  <p className="mt-1 text-xs text-green-600">Valid Google Drive link format</p>
                )}
              </div>

              {/* Type + Contributor side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Type
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full border-0 bg-surface px-4 py-3 text-base text-foreground outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30"
                  >
                    {TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Your GitHub Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={contributor}
                      onChange={(e) => handleGhChange(e.target.value)}
                      onBlur={() => markTouched("contributor")}
                      placeholder="e.g., aryanbatras"
                      className={`w-full border-0 bg-surface px-4 py-3 pr-10 text-base text-foreground placeholder-muted-foreground/40 outline-none ring-1 transition-all focus:ring-2 ${
                        touched.contributor && ghStatus === "invalid"
                          ? "ring-red-300 focus:ring-red-400"
                          : "ring-border/30 focus:ring-brand/30"
                      }`}
                    />
                    {ghStatus === "checking" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="h-4 w-4 animate-spin text-muted-foreground/50" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                          <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" className="opacity-75" />
                        </svg>
                      </span>
                    )}
                    {ghStatus === "valid" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm">✓</span>
                    )}
                    {ghStatus === "invalid" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-sm">✗</span>
                    )}
                  </div>
                  {touched.contributor && contributor.trim() && ghStatus === "invalid" && (
                    <p className="mt-1 text-xs text-red-500">{ghMessage}</p>
                  )}
                  {touched.contributor && contributor.trim() && ghStatus === "valid" && (
                    <p className="mt-1 text-xs text-green-600">{ghMessage}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* JSON Preview */}
          {previewJson && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                Preview — file will be created at{" "}
                <code className="text-foreground/70">
                  jammu-university/btech/{resolvedBranch.toLowerCase().replace(/[^a-z0-9]/g, "")}/semester-{resolvedSemester}/{resolvedSubject.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}/{resolvedSubject.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-{(contributor.trim() || "anonymous").toLowerCase().replace(/[^a-z0-9-]/g, "")}.json
                </code>
              </p>
              <pre className="overflow-x-auto bg-surface p-4 text-xs leading-relaxed text-muted-foreground ring-1 ring-border/30">
                {previewJson}
              </pre>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || status === "loading"}
            className={`w-full px-8 py-5 text-lg font-bold text-white transition-all ${
              status === "loading"
                ? "bg-muted-foreground/30 cursor-not-allowed"
                : canSubmit
                  ? "bg-brand hover:opacity-90 cursor-pointer"
                  : "bg-muted-foreground/20 text-muted-foreground/50 cursor-not-allowed"
            }`}
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" className="opacity-75" />
                </svg>
                Creating pull request...
              </span>
            ) : (
              "Raise Pull Request"
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground/50">
            By submitting, you agree that your document link will be publicly listed on JU Learning.
            Your file stays on your Drive — we only index the link.
          </p>
        </form>
      )}
    </main>
  );
}
