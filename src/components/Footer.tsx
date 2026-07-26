import Link from "next/link";

export function Footer() {
  return (
    <footer>
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-70"
            >
              JU Learning
            </Link>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Open source study materials for B.Tech students. Free access to
              notes, PYQs, and more.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Browse
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/branches"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Branches
                </Link>
              </li>
              <li>
                <Link
                  href="/degree"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Degrees
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Search
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Branches
            </h3>
            <ul className="mt-3 space-y-2">
              {(["cse", "ece", "ee", "me", "ce"] as const).map((slug) => (
                <li key={slug}>
                  <Link
                    href={`/branches/${slug}`}
                    className="text-sm capitalize text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {slug.toUpperCase()}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Meta */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              About
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="https://github.com/julearning"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  GitHub Organization
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/julearning/metadata"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contribute
                </a>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
