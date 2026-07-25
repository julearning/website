"use client";

import { motion } from "framer-motion";
import { FileText, File, Presentation, Download, BadgeCheck, Flag } from "lucide-react";
import type { Document } from "@/lib/types";
import { formatFileSize, formatDate } from "@/lib/types";
import { buildReportIssueUrl } from "@/lib/utils";

interface DocumentCardProps {
  document: Document;
  index?: number;
}

function getFileIcon(type: string) {
  switch (type) {
    case "pdf": return <FileText className="h-4 w-4 text-amber-400" />;
    case "docx": return <File className="h-4 w-4 text-blue-400" />;
    case "pptx": return <Presentation className="h-4 w-4 text-orange-400" />;
    default: return <File className="h-4 w-4 text-zinc-500" />;
  }
}

const tagLabels: Record<string, string> = {
  notes: "Notes", pyq: "PYQ", assignment: "Assignment",
  "lab-manual": "Lab", syllabus: "Syllabus", handwritten: "Handwritten",
  typed: "Typed", "reference-book": "Reference", "project-report": "Project",
};

export function DocumentCard({ document: doc, index = 0 }: DocumentCardProps) {
  const reportUrl = buildReportIssueUrl({ id: doc.id, title: doc.title, url: doc.url });

  return (
    <motion.a
      href={doc.url} target="_blank" rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="group relative block rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800">
          {getFileIcon(doc.fileType)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-snug text-white group-hover:text-amber-400 transition-colors">
              {doc.title}
            </h3>
            {doc.verified && <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
          </div>

          {doc.description && (
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 line-clamp-2">{doc.description}</p>
          )}

          {/* Tags */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
              {doc.branch} S{doc.semester}
            </span>
            <span className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
              {doc.subject.length > 25 ? doc.subject.slice(0, 25) + "..." : doc.subject}
            </span>
            {doc.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                {tagLabels[tag] || tag}
              </span>
            ))}
          </div>

          {/* Meta */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-zinc-600">
            <span>{formatFileSize(doc.fileSize)}</span>
            <span className="uppercase">{doc.fileType}</span>
            <span>{formatDate(doc.uploadedAt)}</span>
            {doc.downloads && (
              <span className="flex items-center gap-1"><Download className="h-3 w-3" />{doc.downloads}</span>
            )}
          </div>
        </div>
      </div>

      {/* Report button */}
      <a href={reportUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-600 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10"
        title="Report broken link">
        <Flag className="h-3.5 w-3.5" />
      </a>
    </motion.a>
  );
}
