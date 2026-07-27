import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  documents,
  getAllDegrees,
  getBranchesByDegree,
  getSemestersByBranch,
  getDocumentCount,
} from "@/data/documents";
import { slugify, deslugifyDegree } from "@/lib/slugs";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export function generateStaticParams() {
  const degrees = getAllDegrees();
  return degrees.map((d) => ({ degree: d.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ degree: string }>;
}): Promise<Metadata> {
  const { degree: degreeSlug } = await params;
  const degreeName = deslugifyDegree(degreeSlug);
  const degrees = getAllDegrees();
  const degree = degrees.find((d) => d.id === degreeSlug);
  if (!degree) return { title: "Not Found" };
  const branches = getBranchesByDegree(degreeSlug);
  const total = getDocumentCount(degreeSlug);
  return {
    title: `${degree.fullName} (${degree.name}) — JU Learning`,
    description: `Browse ${total} study materials for ${degree.fullName}. ${branches.length} branches available.`,
  };
}

export default async function DegreePage({
  params,
}: {
  params: Promise<{ degree: string }>;
}) {
  const { degree: degreeSlug } = await params;
  const degrees = getAllDegrees();
  const degree = degrees.find((d) => d.id === degreeSlug);
  if (!degree) notFound();

  const branches = getBranchesByDegree(degreeSlug);

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16">
      <div className="pt-16 sm:pt-20">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: degree.name },
          ]}
        />
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {degree.fullName} ({degree.name})
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {degree.description}
          </p>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-3">
        {branches.map((branch) => {
          const name = branch;
          const semesters = getSemestersByBranch(degreeSlug, branch);
          const docCount = getDocumentCount(degreeSlug, branch);

          return (
            <Link
              key={branch}
              href={`/${degreeSlug}/${slugify(branch)}`}
              className="group bg-white p-8 transition-all duration-300 hover:bg-brand"
            >
              <h2 className="text-2xl font-bold text-foreground transition-colors duration-300 group-hover:text-white">
                {name}
              </h2>
              <p className="mt-3 text-base text-muted-foreground transition-colors duration-300 group-hover:text-white/80">
                {docCount} documents · {semesters.length} semesters
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
