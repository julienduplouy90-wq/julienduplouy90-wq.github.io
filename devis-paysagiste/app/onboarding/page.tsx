import { prisma } from "@/lib/prisma";
import { seederPrestationsSiVide } from "@/lib/prestations-defaut";
import { FormulaireOnboarding } from "./FormulaireOnboarding";

export const dynamic = "force-dynamic";

// Questionnaire de démarrage : localisation + questions découverte +
// prix exacts du paysagiste, guidés par les fourchettes indicatives.
// Sert aussi de page « Modifier mes tarifs » (formulaire pré-rempli).
export default async function PageOnboarding() {
  // Base fraîchement déployée : on remplit la bibliothèque par défaut.
  await seederPrestationsSiVide();

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
              logicielActuel: profil.logicielActuel ?? "",
              estimationPublique: profil.estimationPublique ?? "",
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
