"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
      className={`rounded-none px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
        active
          ? "bg-brand text-white"
          : "bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const degrees = useMemo(() => getAllDegrees(), []);

  // Local draft state (not applied until Save)
  const [draftDegree, setDraftDegree] = useState<string | null>(null);
  const [draftBranch, setDraftBranch] = useState<string | null>(null);
  const [draftSemester, setDraftSemester] = useState<number | null>(null);

  // Load saved prefs when panel opens
  useEffect(() => {
    if (open) {
      const prefs = loadPreferences();
      setDraftDegree(prefs.degree);
      setDraftBranch(prefs.branch);
      setDraftSemester(prefs.semester);
    }
  }, [open]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Delay so the click that opened it doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open, onClose]);

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
    // Dispatch a custom event so SearchHero can react
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("julearning-preferences-changed"));
    }
    onClose();
  }

  function handleClear() {
    clearPreferences();
    setDraftDegree(null);
    setDraftBranch(null);
    setDraftSemester(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("julearning-preferences-changed"));
    }
    onClose();
  }

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right border border-border/10 bg-surface shadow-2xl"
    >
      <div className="border-b border-border/10 px-5 py-4">
        <h3 className="text-sm font-bold text-foreground">Saved Preferences</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground/60">
          Your degree, branch, and semester will be pre-selected on every page
          load.
        </p>
      </div>

      <div className="px-5 py-4">
        {/* Degree */}
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
            Degree
          </p>
          <div className="flex flex-wrap gap-1.5">
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
          <div className="mb-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
              Branch
            </p>
            <div className="flex flex-wrap gap-1.5">
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
          <div className="mb-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
              Semester
            </p>
            <div className="flex flex-wrap gap-1.5">
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
          <p className="text-[11px] text-muted-foreground/40 italic">
            Select a degree to get started.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-border/10 px-5 py-3">
        <button
          onClick={handleClear}
          className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground/50 transition-colors hover:text-foreground"
        >
          Clear saved
        </button>
        <button
          onClick={handleSave}
          disabled={!draftDegree}
          className="bg-brand px-5 py-1.5 text-xs font-bold text-white transition-all duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Save preferences
        </button>
      </div>
    </div>
  );
}
