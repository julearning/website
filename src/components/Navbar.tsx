"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Users } from "lucide-react";

const NAV_ITEMS: Array<{ href: string; label: string; icon?: React.ReactNode }> = [
  { href: "/contribute", label: "Contribute" },
  { href: "/sources", label: "Sources" },
  { href: "/contributors", label: "Contributors", icon: <Users className="h-4 w-4" /> },
];

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isPageActive = (href: string) =>
    pathname.startsWith(href)
      ? "text-foreground font-semibold"
      : "text-muted-foreground hover:text-foreground";

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="border-b border-border/10">
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
        {/* Logo — big and bold */}
        <Link
          href="/"
          className="text-3xl font-extrabold tracking-tight text-foreground transition-opacity hover:opacity-70 md:text-4xl"
        >
          JU Learning
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-1.5 rounded-none px-4 py-3 text-xl font-semibold transition-all duration-200 hover:bg-accent ${isPageActive(item.href)}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-border/10 lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-6 py-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMenu}
                className={`flex items-center gap-2 py-4 text-xl font-bold transition-opacity hover:opacity-60 ${
                  pathname.startsWith(item.href)
                    ? "text-brand"
                    : "text-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            <div className="my-4 h-px bg-border/10" />
            <div className="flex items-center justify-between py-4">
              <a
                href="https://github.com/julearning"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
                className="text-xl font-bold text-foreground transition-opacity hover:opacity-60"
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

