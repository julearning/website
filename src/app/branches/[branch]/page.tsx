import { redirect } from "next/navigation";
import { slugify } from "@/lib/slugs";
import { documents } from "@/data/documents";

export default async function BranchRedirect({
  params,
}: {
  params: Promise<{ branch: string }>;
}) {
  const { branch } = await params;
  const mappedBranch = branch.toUpperCase();
  // Look up degree from document data — nothing hardcoded
  const doc = documents.find((d) => d.branch === mappedBranch);
  if (!doc || !doc.degree) redirect("/");
  redirect(`/${slugify(doc.degree)}/${slugify(mappedBranch)}`);
}
