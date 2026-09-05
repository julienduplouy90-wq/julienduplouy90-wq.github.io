import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormulaireDevis } from "./FormulaireDevis";

export const dynamic = "force-dynamic";

export default async function PageNouveauDevis() {
  const profil = await prisma.profil.findFirst();
  if (!profil?.onboardingTermine) redirect("/onboarding");

  // Seules les prestations avec un prix défini sont proposées.
  const prestations = await prisma.prestationType.findMany({
    where: { prixUnitaire: { not: null } },
    orderBy: [{ categorie: "asc" }, { nom: "asc" }],
  });

  return (
    <FormulaireDevis
      prestations={prestations.map((p) => ({
        id: p.id,
        nom: p.nom,
        unite: p.unite,
        categorie: p.categorie,
        prixUnitaire: p.prixUnitaire!,
      }))}
    />
  );
}
