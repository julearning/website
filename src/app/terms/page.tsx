import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Terms of Service — JU Learning",
  description: "Terms of Service for JU Learning — open source study materials platform.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-16">
      <div className="pt-12 sm:pt-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Terms of Service" }]} />
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground/60">Last updated: July 2026</p>
      </div>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-2 text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p>By accessing JU Learning, you agree to these terms. If you do not agree, do not use the platform.</p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-2 text-base font-semibold text-foreground">2. Open Source Content</h2>
          <p>All study materials on JU Learning are contributed by volunteers and are provided as-is. The platform does not guarantee the accuracy, completeness, or relevance of any material.</p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-2 text-base font-semibold text-foreground">3. User Contributions</h2>
          <p>Contributors retain ownership of their submitted materials. By submitting a document through a pull request, you grant JU Learning permission to display and distribute the material on the platform.</p>
          <p className="mt-2">You must not submit copyrighted material without permission from the copyright holder.</p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-2 text-base font-semibold text-foreground">4. Limitation of Liability</h2>
          <p>JU Learning is provided free of charge and without warranty. The platform and its maintainers are not liable for any damages arising from the use of the platform or its content.</p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-2 text-base font-semibold text-foreground">5. Changes to Terms</h2>
          <p>These terms may be updated at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-2 text-base font-semibold text-foreground">6. Contact</h2>
          <p>For questions about these terms, please open an issue on the <a href="https://github.com/julearning/metadata" target="_blank" rel="noopener noreferrer" className="text-brand underline">GitHub repository</a>.</p>
        </section>
      </div>
    </div>
  );
}
