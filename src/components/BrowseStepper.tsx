"use client";

import { useState, useMemo } from "react";
import { documents } from "@/data/documents";
import type { Document } from "@/lib/types";
import { getThumbnailUrl } from "@/lib/types";
import { getReportUrl } from "@/lib/report";
import { PaginatedGrid } from "@/components/PaginatedGrid";
import { ResultCard } from "@/components/ResultCard";
import type { SearchResult } from "@/lib/search";

/** Only JU documents — other sources appear only via search */
const juDocs = documents.filter((d) => d.source === "jammu-university");

function getBranches(): string[] {
  return [...new Set(juDocs.map((d) => d.branch).filter(Boolean))].sort() as string[];
}

function getSemesters(branch: string): number[] {
  return [...new Set(juDocs.filter((d) => d.branch === branch).map((d) => d.semester))].filter((s): s is number => s != null).sort((a, b) => a - b);
}

function getSubjects(branch: string, semester: number): string[] {
  return [...new Set(juDocs.filter((d) => d.branch === branch && d.semester === semester).map((d) => d.subject).filter(Boolean))].sort();
}

function getDocs(branch: string, semester: number, subject: string): Document[] {
  return juDocs.filter((d) => d.branch === branch && d.semester === semester && d.subject === subject);
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-lg font-bold transition-all duration-200 ${
        active
          ? "bg-brand text-white"
          : "bg-surface text-foreground hover:bg-brand hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

export function BrowseStepper() {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const branches = useMemo(() => getBranches(), []);
  const semesters = useMemo(() => selectedBranch ? getSemesters(selectedBranch) : [], [selectedBranch]);
  const subjects = useMemo(() => selectedBranch && selectedSemester ? getSubjects(selectedBranch, selectedSemester) : [], [selectedBranch, selectedSemester]);
  const docs = useMemo(() => selectedBranch && selectedSemester && selectedSubject ? getDocs(selectedBranch, selectedSemester, selectedSubject) : [], [selectedBranch, selectedSemester, selectedSubject]);

  function handleBranchClick(branch: string) {
    if (branch === selectedBranch) {
      setSelectedBranch(null);
      setSelectedSemester(null);
      setSelectedSubject(null);
    } else {
      setSelectedBranch(branch);
      setSelectedSemester(null);
      setSelectedSubject(null);
    }
  }

  function handleSemesterClick(sem: number) {
    if (sem === selectedSemester) {
      setSelectedSemester(null);
      setSelectedSubject(null);
    } else {
      setSelectedSemester(sem);
      setSelectedSubject(null);
    }
  }

  function handleSubjectClick(subject: string) {
    if (subject === selectedSubject) {
      setSelectedSubject(null);
    } else {
      setSelectedSubject(subject);
    }
  }

  function handleReset() {
    setSelectedBranch(null);
    setSelectedSemester(null);
    setSelectedSubject(null);
  }

  const results: SearchResult[] = useMemo(() => docs.map((doc) => ({ doc, score: 0 })), [docs]);

  if (branches.length === 0) return null;

  return (
    <div className="w-full">
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground/60">
        {selectedBranch ? (
          <button onClick={handleReset} className="hover:text-foreground transition-colors">
            Browse
          </button>
        ) : (
          <span className="font-medium text-foreground">Browse</span>
        )}
        {selectedBranch && (
          <>
            <span>/</span>
            <span className="font-medium text-foreground">{selectedBranch}</span>
          </>
        )}
        {selectedSemester && (
          <>
            <span>/</span>
            <span className="font-medium text-foreground">Semester {selectedSemester}</span>
          </>
        )}
        {selectedSubject && (
          <>
            <span>/</span>
            <span className="font-medium text-foreground">{selectedSubject}</span>
          </>
        )}
      </div>

      {/* Step 1: Branches */}
      <div className="flex flex-wrap gap-3">
        {branches.map((branch) => (
          <Chip
            key={branch}
            label={branch}
            active={selectedBranch === branch}
            onClick={() => handleBranchClick(branch)}
          />
        ))}
      </div>

      {/* Step 2: Semesters */}
      {selectedBranch && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
            Select Semester
          </p>
          <div className="flex flex-wrap gap-3">
            {semesters.map((sem) => (
              <Chip
                key={sem}
                label={`Semester ${sem}`}
                active={selectedSemester === sem}
                onClick={() => handleSemesterClick(sem)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Subjects */}
      {selectedBranch && selectedSemester && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
            Select Subject
          </p>
          <div className="flex flex-wrap gap-3">
            {subjects.map((subject) => (
              <Chip
                key={subject}
                label={subject}
                active={selectedSubject === subject}
                onClick={() => handleSubjectClick(subject)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Documents */}
      {selectedBranch && selectedSemester && selectedSubject && (
        <div className="mt-6">
          {results.length > 0 ? (
            <PaginatedGrid
              items={results}
              renderItem={(result) => <ResultCard key={result.doc.id} result={result} />}
              itemsPerPage={9}
            />
          ) : (
            <p className="text-sm text-muted-foreground/60">No documents found for this subject.</p>
          )}
        </div>
      )}
    </div>
  );
}
