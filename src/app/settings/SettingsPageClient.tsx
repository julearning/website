"use client";

import { useState, useMemo, useEffect } from "react";
import {
  getAllDegrees,
  getBranchesByDegree,
  getSemestersByBranch,
} from "@/lib/hierarchy";
import {
  loadPreferences,
  savePreferences,
  clearPreferences,
} from "@/lib/preferences";

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-none px-4 py-2 text-sm font-semibold transition-all duration-150 ${
        active
          ? "bg-brand text-white"
          : "bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

export function SettingsPageClient() {
  const degrees = useMemo(() => getAllDegrees(), []);

  const [draftDegree, setDraftDegree] = useState<string | null>(null);
  const [draftBranch, setDraftBranch] = useState<string | null>(null);
  const [draftSemester, setDraftSemester] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  // Load saved prefs on mount
  useEffect(() => {
    const prefs = loadPreferences();
    setDraftDegree(prefs.degree);
    setDraftBranch(prefs.branch);
    setDraftSemester(prefs.semester);
  }, []);

  const branches = useMemo(
    () => (draftDegree ? getBranchesByDegree(draftDegree) : []),
    [draftDegree],
  );
  const semesters = useMemo(
    () =>
      draftDegree && draftBranch
        ? getSemestersByBranch(draftDegree, draftBranch)
        : [],
    [draftDegree, draftBranch],
  );

  function handleSave() {
    savePreferences({
      degree: draftDegree,
      branch: draftBranch,
      semester: draftSemester,
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("julearning-preferences-changed"));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleClear() {
    clearPreferences();
    setDraftDegree(null);
    setDraftBranch(null);
    setDraftSemester(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("julearning-preferences-changed"));
    }
  }

  return (
    <div className="space-y-8">
      {/* Degree */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
          Degree
        </p>
        <div className="flex flex-wrap gap-2">
          {degrees.map((deg) => (
            <Chip
              key={deg.id}
              label={deg.name}
              active={draftDegree === deg.id}
              onClick={() => {
                setDraftDegree(deg.id);
                setDraftBranch(null);
                setDraftSemester(null);
              }}
            />
          ))}
        </div>
      </div>

      {/* Branch */}
      {draftDegree && branches.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
            Branch
          </p>
          <div className="flex flex-wrap gap-2">
            {branches.map((b) => (
              <Chip
                key={b}
                label={b}
                active={draftBranch === b}
                onClick={() => {
                  setDraftBranch(b);
                  setDraftSemester(null);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Semester */}
      {draftBranch && semesters.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
            Semester
          </p>
          <div className="flex flex-wrap gap-2">
            {semesters.map((s) => (
              <Chip
                key={s}
                label={`Sem ${s}`}
                active={draftSemester === s}
                onClick={() => setDraftSemester(s)}
              />
            ))}
          </div>
        </div>
      )}

      {/* No selection hint */}
      {!draftDegree && (
        <p className="text-sm text-muted-foreground/40 italic">
          Select a degree to get started.
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={handleSave}
          disabled={!draftDegree}
          className="bg-brand px-8 py-3 text-sm font-bold text-white transition-all duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {saved ? "Saved!" : "Save preferences"}
        </button>
        <button
          onClick={handleClear}
          className="px-6 py-3 text-sm font-medium text-muted-foreground/50 transition-colors hover:text-foreground"
        >
          Clear saved
        </button>
      </div>
    </div>
  );
}