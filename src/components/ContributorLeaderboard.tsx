"use client";

import { useState } from "react";
import type { Contributor } from "@/lib/contributors";

interface Props {
  contributors: Contributor[];
}

function AvatarImg({ username, size = 40 }: { username: string; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="flex items-center justify-center bg-accent text-xs font-bold text-muted-foreground"
        style={{ width: size, height: size }}
      >
        {username.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={`https://github.com/${username}.png?size=${size * 2}`}
      alt={username}
      className="transition-opacity duration-200 hover:opacity-80"
      style={{ width: size, height: size }}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function ContributorLeaderboard({ contributors }: Props) {
  if (contributors.length === 0) return null;

  const maxCount = contributors[0].count;

  return (
    <div className="w-full">
      {/* Header row */}
      <div className="mb-8 hidden grid-cols-[40px_1fr_auto] gap-4 border-b border-border/20 px-1 pb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground/50 lg:grid">
        <span />
        <span>Contributor</span>
        <span>Documents</span>
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {contributors.map((c, i) => {
          const barWidth = maxCount > 0 ? (c.count / maxCount) * 100 : 0;
          const isTop3 = i < 3;

          return (
            <a
              key={c.username}
              href={`https://github.com/${c.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative grid grid-cols-[40px_1fr_auto] items-center gap-4 px-1 py-3 transition-all duration-200 hover:bg-accent"
            >
              {/* Rank badge for top 3 */}
              {isTop3 && (
                <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center bg-brand text-[10px] font-bold text-white">
                  {i + 1}
                </span>
              )}

              {/* Avatar */}
              <AvatarImg username={c.username} size={40} />

              {/* Name + bar */}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-brand">
                  {c.username}
                </p>
                {/* Progress bar */}
                <div className="mt-1.5 h-1 w-full bg-accent">
                  <div
                    className="h-full bg-brand/60 transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>

              {/* Count */}
              <span className="text-right text-sm font-mono font-medium text-muted-foreground tabular-nums">
                {c.count}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function ContributorAvatar({ username, size = 32 }: { username: string; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="flex items-center justify-center bg-accent text-xs font-bold text-muted-foreground"
        style={{ width: size, height: size }}
      >
        {username.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <a
      href={`https://github.com/${username}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block transition-transform duration-200 hover:scale-110"
      title={username}
    >
      <img
        src={`https://github.com/${username}.png?size=${size * 2}`}
        alt={username}
        className=""
        style={{ width: size, height: size }}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </a>
  );
}
