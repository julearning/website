"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";

import { getAllDegrees } from "@/data/documents";
import { hasPreferences } from "@/lib/preferences";

function getDegreeItems() {
  return getAllDegrees();
}

// Note: /automation/drive was merged into /contribute and deleted

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [degreesOpen, setDegreesOpen] = useState(false);
  const [savedPrefsExist, setSavedPrefsExist] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setDegreesOpen(false);
  }, [pathname]);

  // Check if preferences exist (for the indicator dot)
  useEffect(() => {
    setSavedPrefsExist(hasPreferences());
    const handler = () => setSavedPrefsExist(hasPreferences());
    window.addEventListener("julearning-preferences-changed", handler);
    return () => window.removeEventListener("julearning-preferences-changed", handler);
  }, []);

  // Close degree dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDegreesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const degreeItems = getDegreeItems();
  const isDegreeActive = degreeItems.some((d) => pathname.startsWith(`/${d.id}`));

  const isPageActive = (href: string) =>
    pathname.startsWith(href)
      ? "text-foreground font-semibold"
      : "text-muted-foreground hover:text-foreground";

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="border-b border-border/10 relative">
      {/* GitHub overlay — fixed top-right, outside the normal flow */}
      <a
        href="https://github.com/julearning"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center transition-all duration-300 hover:scale-110"
        aria-label="JU Learning on GitHub"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-muted-foreground/60 transition-all duration-300 hover:text-foreground">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      </a>

      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7 md:py-10">
        {/* Mobile hamburger — left side */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? (
            <X className="h-8 w-8 text-foreground" />
          ) : (
            <Menu className="h-8 w-8 text-foreground" />
          )}
        </button>

        {/* Logo — left on desktop, centered-ish on mobile */}
        <Link
          href="/"
          className="text-3xl font-extrabold tracking-tight text-foreground transition-opacity hover:opacity-70 md:text-4xl"
        >
          JU Learning
        </Link>

        {/* Desktop nav — right side */}
        <nav className="hidden items-center gap-0 lg:flex">
          {/* Degrees dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDegreesOpen(!degreesOpen)}
              className={`flex items-center gap-1 rounded-none px-4 py-3 text-xl font-semibold transition-all duration-200 hover:bg-accent ${
                isDegreeActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Degrees
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  degreesOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {degreesOpen && (
              <div className="absolute right-0 top-full z-50 min-w-[200px] border border-border/10 bg-surface shadow-xl">
                {degreeItems.map((degree) => (
                  <Link
                    key={degree.id}
                    href={`/${degree.id}`}
                    onClick={() => setDegreesOpen(false)}
                    className={`block px-5 py-3 text-base font-medium transition-colors duration-200 hover:bg-accent ${
                      pathname.startsWith(`/${degree.id}`)
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {degree.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/sources"
            className={`flex items-center gap-1.5 rounded-none px-4 py-3 text-xl font-semibold transition-all duration-200 hover:bg-accent ${isPageActive("/sources")}`}
          >
            Sources
          </Link>
          <Link
            href="/contribute"
            className={`flex items-center gap-1.5 rounded-none px-4 py-3 text-xl font-semibold transition-all duration-200 hover:bg-accent ${isPageActive("/contribute")}`}
          >
            Contribute
          </Link>
          <Link
            href="/settings"
            className={`flex items-center gap-1.5 rounded-none px-4 py-3 text-xl font-semibold transition-all duration-200 hover:bg-accent ${isPageActive("/settings")}`}
          >
            Preferences
            {savedPrefsExist && (
              <span className="h-2 w-2 bg-brand" />
            )}
          </Link>
        </nav>

        {/* Spacer for mobile to keep logo centered */}
        <div className="w-8 lg:hidden" />
      </div>

      {/* Mobile menu — full width, below header */}
      {menuOpen && (
        <div className="border-t border-border/10 lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-6 py-4">
            {degreeItems.map((item) => (
              <Link
                key={item.id}
                href={`/${item.id}`}
                onClick={closeMenu}
                className={`flex items-center gap-2 py-5 text-2xl font-bold transition-opacity hover:opacity-60 ${
                  pathname.startsWith(`/${item.id}`)
                    ? "text-brand"
                    : "text-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
            <div className="my-4 h-px bg-border/10" />
            <Link
              href="/sources"
              onClick={closeMenu}
              className="flex items-center gap-2 py-5 text-2xl font-bold text-foreground transition-opacity hover:opacity-60"
            >
              Sources
            </Link>
            <Link
              href="/contribute"
              onClick={closeMenu}
              className="flex items-center gap-2 py-5 text-2xl font-bold text-foreground transition-opacity hover:opacity-60"
            >
              Contribute
            </Link>
            <div className="my-4 h-px bg-border/10" />
            <div className="flex items-center justify-between py-4">
              <Link
                href="/settings"
                onClick={closeMenu}
                className="flex items-center gap-2 text-2xl font-bold text-foreground transition-opacity hover:opacity-60"
              >
                Preferences
                {savedPrefsExist && (
                  <span className="h-2 w-2 bg-brand" />
                )}
              </Link>
              <a
                href="https://github.com/julearning"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
                className="text-2xl font-bold text-foreground transition-opacity hover:opacity-60"
              >
                GitHub ↗
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
