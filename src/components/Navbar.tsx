"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/pyq", label: "PYQs" },
  { href: "/handwritten", label: "Handwritten" },
  { href: "/digital-notes", label: "Digital Notes" },
  { href: "/branches", label: "Branches" },
  { href: "/subjects", label: "Subjects" },
  { href: "/degree", label: "Degree" },
  { href: "/contributors", label: "Contributors" },
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
              className={`rounded-none px-4 py-3 text-xl font-semibold transition-all duration-200 hover:bg-accent ${isPageActive(item.href)}`}
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://github.com/julearning"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 rounded-none px-4 py-3 text-xl font-semibold text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground"
          >
            GitHub
          </a>
          <ThemeToggle />
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
                className={`py-4 text-xl font-bold transition-opacity hover:opacity-60 ${
                  pathname.startsWith(item.href)
                    ? "text-brand"
                    : "text-foreground"
                }`}
              >
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
                GitHub
              </a>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

