"use client";

import Link from "next/link";

export function Navbar() {
  return (
    <header className="py-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-foreground transition-opacity hover:opacity-70"
        >
          JU Learning
        </Link>

        <a
          href="https://github.com/julearning/metadata"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
