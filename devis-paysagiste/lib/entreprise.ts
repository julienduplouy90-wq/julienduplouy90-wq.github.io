// Chargement d'une entreprise par son slug (404 si inconnue).
// Utilisé par toutes les pages du dashboard et le simulateur public.
import { notFound } from "next/navigation";
import { prisma } from "./prisma";

export async function entrepriseParSlug(slug: string) {
  const entreprise = await prisma.entreprise.findUnique({
    where: { slug },
    include: { prestations: true },
  });
  if (!entreprise) notFound();
  return entreprise;
}
