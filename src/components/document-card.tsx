"use client";

import { FileText, File, Presentation, Image, Download, ExternalLink, BadgeCheck } from "lucide-react";
import type { Document } from "@/lib/types";
import { formatFileSize, formatDate } from "@/lib/types";
import { ReportButton } from "./report-button";

interface DocumentCardProps {
  document: Document;
  highlight?: string;
}

function getFileIcon(fileType: string) {
  switch (fileType) {
    case "pdf":
      return <FileText className="h-4 w-4 text-red-500" />;
    case "docx":
      return <File className="h-4 w-4 text-blue-500" />;
    case "pptx":
      return <Presentation className="h-4 w-4 text-orange-500" />;
    case "image":
      return <Image className="h-4 w-4 text-purple-500" />;
    default:
      return <File className="h-4 w-4 text-zinc-500" />;
  }
}

export function DocumentCard({ document: doc, highlight }: DocumentCardProps) {
  const tagLabels: Record<string, string> = {
    notes: "Notes",
    pyq: "PYQ",
    assignment: "Assignment",
    "lab-manual": "Lab Manual",
    syllabus: "Syllabus",
    handwritten: "Handwritten",
    typed: "Typed",
    "reference-book": "Ref Book",
    "project-report": "Project",
  };

  return (
    <div className="group relative rounded-xl border border-zinc-200/60 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-sm sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* File type icon */}
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-50 ring-1 ring-zinc-200">
          {getFileIcon(doc.fileType)}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium leading-snug text-zinc-900 group-hover:text-blue-600 transition-colors">
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="after:absolute after:inset-0 after:rounded-xl"
              >
                {doc.title}
              </a>
            </h3>
            {doc.verified && (
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            )}
          </div>

          {doc.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
              {doc.description}
            </p>
          )}

          {/* Tags row */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 ring-1 ring-inset ring-blue-200/50">
              {doc.branch} S{doc.semester}
            </span>
            <span className="inline-flex items-center rounded-md bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 ring-1 ring-inset ring-zinc-200/50">
              {doc.subject}
            </span>
            {doc.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 ring-1 ring-inset ring-zinc-200/50"
              >
                {tagLabels[tag] || tag}
              </span>
            ))}
          </div>

          {/* Meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-400">
            <span>{formatFileSize(doc.fileSize)}</span>
            <span>{doc.fileType.toUpperCase()}</span>
            <span>{formatDate(doc.uploadedAt)}</span>
            {doc.downloads && <span>{doc.downloads} downloads</span>}
          </div>
        </div>
      </div>

      {/* Action buttons (appear on hover) */}
      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
          title="Open file"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <ReportButton document={doc} />
      </div>
    </div>
  );
}
