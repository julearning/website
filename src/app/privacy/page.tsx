import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Privacy Policy — JU Learning",
  description: "Privacy Policy for JU Learning — open source study materials platform.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-16">
      <div className="pt-12 sm:pt-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground/60">Last updated: July 2026</p>
      </div>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-2 text-base font-semibold text-foreground">1. Information We Collect</h2>
          <p>JU Learning is a static website that does not collect, store, or process any personal data. We do not use cookies, tracking scripts, or analytics services.</p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-2 text-base font-semibold text-foreground">2. Third-Party Services</h2>
          <p>The website may link to third-party services (Google Drive, GitHub) for document storage and source code. These services have their own privacy policies. JU Learning has no control over their data practices.</p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-2 text-base font-semibold text-foreground">3. GitHub Contributions</h2>
          <p>When you contribute to the JU Learning metadata repository via GitHub, your GitHub username and contributions are public in accordance with GitHub's terms of service.</p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-2 text-base font-semibold text-foreground">4. Data Security</h2>
          <p>Since JU Learning does not collect any user data, there is no user data to secure. The website is served over HTTPS to ensure secure connections.</p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-2 text-base font-semibold text-foreground">5. Changes to This Policy</h2>
          <p>This privacy policy may be updated infrequently. Any changes will be reflected on this page.</p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-2 text-base font-semibold text-foreground">6. Contact</h2>
          <p>For questions about this policy, please open an issue on the <a href="https://github.com/julearning/metadata" target="_blank" rel="noopener noreferrer" className="text-brand underline">GitHub repository</a>.</p>
        </section>
      </div>
    </div>
  );
}
