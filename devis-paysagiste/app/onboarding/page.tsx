import { prisma } from "@/lib/prisma";
import { FormulaireOnboarding } from "./FormulaireOnboarding";

export const dynamic = "force-dynamic";

// Questionnaire de démarrage : localisation + prix exacts du paysagiste,
// guidés par les fourchettes indicatives. Sert aussi de page
// « Modifier mes tarifs » ensuite (le formulaire est pré-rempli).
export default async function PageOnboarding() {
  const [profil, prestations] = await Promise.all([
    prisma.profil.findFirst(),
    prisma.prestationType.findMany({ orderBy: [{ categorie: "asc" }, { nom: "asc" }] }),
  ]);

  return (
    <FormulaireOnboarding
      profil={
        profil
          ? {
              nomEntreprise: profil.nomEntreprise ?? "",
              ville: profil.ville,
              codePostal: profil.codePostal,
            }
          : null
      }
      prestations={prestations.map((p) => ({
        id: p.id,
        nom: p.nom,
        unite: p.unite,
        categorie: p.categorie,
        prixMin: p.prixMin,
        prixMax: p.prixMax,
        prixUnitaire: p.prixUnitaire,
      }))}
    />
  );
}
