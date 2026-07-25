import { Heart } from "lucide-react";
import { GitHubIcon } from "@/components/github-icon";

export function Footer() {
  return (
    <footer className="border-t border-zinc-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
        <p className="text-xs text-zinc-400">
          JU Learning &mdash; Open source study materials for university students.
        </p>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-red-400" /> by students
          </span>
          <a
            href="https://github.com/JU-Learning/julearning"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 transition-colors hover:text-zinc-700"
          >
            <GitHubIcon className="h-3 w-3" />
            Contribute
          </a>
        </div>
      </div>
    </footer>
  );
}