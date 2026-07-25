"use client";

import { Flag } from "lucide-react";
import type { Document } from "@/lib/types";
import { buildReportIssueUrl } from "@/lib/utils";

interface ReportButtonProps {
  document: Document;
  className?: string;
}

export function ReportButton({ document: doc, className = "" }: ReportButtonProps) {
  const issueUrl = buildReportIssueUrl({
    id: doc.id,
    title: doc.title,
    url: doc.url,
  });

  return (
    <a
      href={issueUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 ${className}`}
      title="Report broken link"
      onClick={(e) => e.stopPropagation()}
    >
      <Flag className="h-3.5 w-3.5" />
    </a>
  );
}
