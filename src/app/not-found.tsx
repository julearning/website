import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-900">
        <Search className="h-8 w-8 text-zinc-500" />
      </div>
      <h1 className="text-4xl font-bold text-white">404</h1>
      <p className="mt-4 text-sm text-zinc-500">This page doesn&apos;t exist.</p>
      <div className="mt-10 flex gap-3">
        <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Go home
        </Link>
        <Link href="/browse" className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
          Browse branches
        </Link>
      </div>
    </div>
  );
}
