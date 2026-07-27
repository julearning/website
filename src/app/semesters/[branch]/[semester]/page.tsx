import { redirect } from "next/navigation";
import { slugify, parseSemesterSlug } from "@/lib/slugs";
import { documents } from "@/data/documents";

export default async function SemesterRedirect({
  params,
}: {
  params: Promise<{ branch: string; semester: string }>;
}) {
  const { branch, semester } = await params;
  const mappedBranch = branch.toUpperCase();
  const sem = parseSemesterSlug(semester) || parseInt(semester);
  if (isNaN(sem)) redirect("/");
  // Look up degree from data
  const doc = documents.find((d) => d.branch === mappedBranch);
  if (!doc || !doc.degree) redirect("/");
  redirect(`/${slugify(doc.degree)}/${slugify(mappedBranch)}/sem-${sem}`);
}
