"use client";

import { useState, useMemo } from "react";
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

/** Only JU documents for the branch/semester/subject dropdowns */
const juDocs = documents.filter((d) => d.source === "jammu-university");

export default function ContributePage() {
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState<number | "">("");
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [docType, setDocType] = useState("mixed");
  const [contributor, setContributor] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [prUrl, setPrUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Compute dropdown options from JU documents
  const branches = useMemo(() => {
    return [...new Set(juDocs.map((d) => d.branch).filter(Boolean))].sort() as string[];
  }, []);

  const semesters = useMemo(() => {
    if (!branch) return [];
    return [...new Set(juDocs.filter((d) => d.branch === branch).map((d) => d.semester))].filter((s): s is number => s != null).sort((a, b) => a - b);
  }, [branch]);

  const subjects = useMemo(() => {
    if (!branch || !semester) return [];
    return [...new Set(juDocs.filter((d) => d.branch === branch && d.semester === semester).map((d) => d.subject).filter(Boolean))].sort();
  }, [branch, semester]);

  // Preview the JSON that will be created
  const previewJson = useMemo(() => {
    if (!title || !url) return null;
    return JSON.stringify([{
      title: title.trim(),
      url: url.trim(),
      type: docType,
      contributor: contributor.trim() || undefined,
      uploadedAt: new Date().toISOString().split("T")[0],
    }], null, 2);
  }, [title, url, docType, contributor]);

  const canSubmit = title.trim() && url.trim() && branch && semester && subject;

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
          branch,
          semester: Number(semester),
          subject,
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
    setStatus("idle");
    setPrUrl("");
    setErrorMsg("");
    setTitle("");
    setUrl("");
    setDocType("mixed");
    setContributor("");
    setBranch("");
    setSemester("");
    setSubject("");
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
                <select
                  value={branch}
                  onChange={(e) => { setBranch(e.target.value); setSemester(""); setSubject(""); }}
                  className="w-full border-0 bg-surface px-4 py-3 text-base text-foreground outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30"
                >
                  <option value="">Select branch</option>
                  {branches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Semester */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  2. Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => { setSemester(e.target.value ? Number(e.target.value) : ""); setSubject(""); }}
                  disabled={!branch}
                  className={`w-full border-0 bg-surface px-4 py-3 text-base outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30 ${
                    semester ? "text-foreground" : "text-muted-foreground/60"
                  } ${!branch ? "opacity-40" : ""}`}
                >
                  <option value="">Select semester</option>
                  {semesters.map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  3. Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={!semester}
                  className={`w-full border-0 bg-surface px-4 py-3 text-base outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30 ${
                    subject ? "text-foreground" : "text-muted-foreground/60"
                  } ${!semester ? "opacity-40" : ""}`}
                >
                  <option value="">Select subject</option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
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
                  placeholder="e.g., DBMS Unit 1 Notes"
                  className="w-full border-0 bg-surface px-4 py-3 text-base text-foreground placeholder-muted-foreground/40 outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30"
                />
              </div>

              {/* Drive URL */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Drive URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full border-0 bg-surface px-4 py-3 text-base text-foreground placeholder-muted-foreground/40 outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30"
                />
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
                  <input
                    type="text"
                    value={contributor}
                    onChange={(e) => setContributor(e.target.value)}
                    placeholder="e.g., aryanbatras"
                    className="w-full border-0 bg-surface px-4 py-3 text-base text-foreground placeholder-muted-foreground/40 outline-none ring-1 ring-border/30 transition-all focus:ring-2 focus:ring-brand/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* JSON Preview */}
          {previewJson && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                Preview (this JSON will be added to the metadata repo)
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
