"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname.startsWith(path)
      ? "text-foreground font-medium"
      : "text-muted-foreground hover:text-foreground";

  return (
    <header className="py-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-foreground transition-opacity hover:opacity-70"
        >
          JU Learning
        </Link>

        <nav className="flex items-center gap-5">
          <Link href="/branches" className={`text-sm transition-colors ${isActive("/branches")}`}>
            Branches
          </Link>
          <Link href="/degree" className={`text-sm transition-colors ${isActive("/degree")}`}>
            Degree
          </Link>
          <a
            href="https://github.com/julearning"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
