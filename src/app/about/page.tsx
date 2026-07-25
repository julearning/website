import Link from "next/link";
import { BookOpen, Heart, ExternalLink } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
            <span className="text-xs font-bold text-black">JU</span>
          </div>
          <span className="text-sm font-bold text-white">JU Learning</span>
        </Link>
        <Link href="/browse" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Browse</Link>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-24">
        <p className="text-xs font-medium tracking-widest text-amber-500 uppercase mb-3">About</p>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Open source study<br />
          <span className="text-zinc-500">materials.</span>
        </h1>

        <div className="mt-16 space-y-16">
          <section>
            <h2 className="text-lg font-semibold text-white">What is this?</h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400 max-w-xl">
              JU Learning is a community-driven platform for sharing study materials. Instead of
              scattered WhatsApp groups or outdated drives, it provides a single searchable interface
              for notes, PYQs, lab manuals, and assignments.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">How it works</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                { n: "01", t: "Search", d: "Type a subject or topic. Filter by branch, semester, and type." },
                { n: "02", t: "Find", d: "Browse results with details — file size, type, and upload date." },
                { n: "03", t: "Download", d: "Open the document directly from cloud storage." },
              ].map((s) => (
                <div key={s.n} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="text-xs font-bold text-amber-500">{s.n}</div>
                  <h3 className="mt-2 text-sm font-semibold text-white">{s.t}</h3>
                  <p className="mt-1.5 text-xs text-zinc-500">{s.d}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-3">
              <Heart className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-white">Contribute</h2>
            </div>
            <p className="text-sm text-zinc-400">
              Open source and maintained by volunteers. Add documents, fix links, or improve the codebase.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="https://github.com/JU-Learning/julearning" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-amber-400">
                <ExternalLink className="h-4 w-4" />
                View on GitHub
              </a>
              <Link href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white hover:border-zinc-700">
                <BookOpen className="h-4 w-4" />
                Browse notes
              </Link>
            </div>
          </section>
        </div>
      </div>

      <footer className="border-t border-zinc-800 py-6 text-center text-xs text-zinc-600">
        Made with <Heart className="inline h-3 w-3 text-red-500" /> by students
      </footer>
    </div>
  );
}
