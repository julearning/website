"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { GitHubIcon } from "@/components/github-icon";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-zinc-900 transition-colors hover:text-blue-600"
        >
          <BookOpen className="h-4 w-4 text-blue-600" />
          <span>JU Learning</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/browse"
            className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Browse
          </Link>
          <Link
            href="/about"
            className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            About
          </Link>
          <a
            href="https://github.com/JU-Learning/julearning"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            <GitHubIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
