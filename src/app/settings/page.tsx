import type { Metadata } from "next";
import { SettingsPageClient } from "./SettingsPageClient";

export const metadata: Metadata = {
  title: "Preferences \u2014 JU Learning",
  description: "Set your degree, branch, and semester preferences.",
};

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-16 pt-16 sm:pt-20">
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
        Preferences
      </h1>
      <p className="mt-2 text-base text-muted-foreground sm:text-lg">
        Your degree, branch, and semester will be pre-selected on every page load.
      </p>
      <div className="mt-10">
        <SettingsPageClient />
      </div>
    </main>
  );
}