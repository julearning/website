import { redirect } from "next/navigation";
import { getAllDegrees } from "@/data/documents";

export default function DegreeRedirect() {
  const degrees = getAllDegrees();
  const firstDegree = degrees[0];
  redirect(firstDegree ? `/${firstDegree.id}` : "/");
}
