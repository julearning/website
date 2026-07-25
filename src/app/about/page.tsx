import Link from "next/link";
import { BookOpen, Heart, ExternalLink } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="font-heading text-xs font-medium tracking-widest text-brand uppercase mb-3">About</p>
        <h1 className="font-heading text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl">
          Open source study materials.
        </h1>

        <div className="mt-12 space-y-12">
          <section>
            <h2 className="font-heading text-base font-semibold text-foreground">What is this?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-xl">
              JU Learning is a community-driven platform for sharing study materials. Instead of
              scattered WhatsApp groups or outdated drives, it provides a single searchable interface
              for notes, PYQs, lab manuals, and assignments.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-base font-semibold text-foreground">How it works</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { n: "01", t: "Search", d: "Type a subject or topic. Filter by branch, semester, and type." },
                { n: "02", t: "Find", d: "Browse results with file details, type, and upload date." },
                { n: "03", t: "Download", d: "Open the document directly from cloud storage." },
              ].map((s) => (
                <div key={s.n} className="rounded-2xl bg-surface p-5 transition-all hover:bg-surface-elevated">
                  <div className="text-xs font-bold text-brand">{s.n}</div>
                  <h3 className="mt-2 text-sm font-semibold text-foreground">{s.t}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground">{s.d}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-brand-muted p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-3">
              <Heart className="h-5 w-5 text-brand" />
              <h2 className="font-heading text-base font-semibold text-foreground">Contribute</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Open source and maintained by volunteers. Add documents, fix links, or improve the codebase.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="https://github.com/julearning/metadata" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-brand-hover">
                <ExternalLink className="h-4 w-4" />
                GitHub
              </a>
              <Link href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                <BookOpen className="h-4 w-4" />
                Browse notes
              </Link>
            </div>
          </section>
        </div>
      </div>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground/40">
        Made with <Heart className="inline h-3 w-3 text-destructive" /> by students
      </footer>
    </div>
  );
}
