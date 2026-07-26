"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Contributor } from "@/lib/contributors";
import { ContributorAvatar } from "@/components/ContributorLeaderboard";

interface Props {
  contributors: Contributor[];
}

export function ContributorCircle({ contributors }: Props) {
  // Build array of { angle, username, count } — evenly spaced around the circle
  const positioned = useMemo(() => {
    const total = contributors.length;
    if (total === 0) return [];

    // Radius scales with contributor count
    const radius = Math.min(80 + total * 18, 220);

    return contributors.map((c, i) => {
      const angle = (360 / total) * i;
      const rad = (angle * Math.PI) / 180;
      const x = Math.cos(rad) * radius;
      const y = Math.sin(rad) * radius;
      return { ...c, angle, x, y, radius };
    });
  }, [contributors]);

  // Avatar size: larger for fewer contributors
  const avatarSize = Math.min(48, Math.max(32, Math.floor(120 / contributors.length)));

  return (
    <section className="py-24">
      {/* Center text */}
      <div className="mx-auto text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground/40">
          Community
        </p>
        <h2 className="mx-auto mt-3 max-w-xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
          JU Learning is all of us
        </h2>
        <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
          {contributors.length} contributor{contributors.length !== 1 ? "s" : ""} ·{" "}
          {contributors.reduce((s, c) => s + c.count, 0)} documents and growing.
        </p>
      </div>

      {/* Avatar circle */}
      <div className="relative mt-16 flex items-center justify-center">
        {/* Circle visual container */}
        <div
          className="relative"
          style={{
            width: positioned.length > 0 ? (positioned[0]?.radius || 80) * 2 + avatarSize + 40 : 160,
            height: positioned.length > 0 ? (positioned[0]?.radius || 80) * 2 + avatarSize + 40 : 160,
          }}
        >
          {positioned.length === 0 && (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground/40">
              No contributors yet.
            </div>
          )}

          {/* Central hub dot */}
          <div
            className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/30"
          />

          {/* Positioned avatars */}
          {positioned.map((c) => (
            <div
              key={c.username}
              className="absolute"
              style={{
                left: `calc(50% + ${c.x}px - ${avatarSize / 2}px)`,
                top: `calc(50% + ${c.y}px - ${avatarSize / 2}px)`,
              }}
            >
              <ContributorAvatar username={c.username} size={avatarSize} />
            </div>
          ))}
        </div>
      </div>

      {/* Link to full leaderboard */}
      <div className="mt-10 text-center">
        <Link
          href="/contributors"
          className="inline-block px-6 py-3 text-sm font-medium text-foreground transition-all duration-200 hover:bg-accent"
        >
          View full leaderboard →
        </Link>
      </div>
    </section>
  );
}
