"use server";

// Enregistrement du questionnaire de démarrage :
// - le profil (entreprise, localisation)
// - le prix exact choisi pour chaque prestation
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type EtatOnboarding = { erreur?: string };

export async function enregistrerOnboarding(
  _etatPrecedent: EtatOnboarding,
  formData: FormData
): Promise<EtatOnboarding> {
  const nomEntreprise = String(formData.get("nomEntreprise") ?? "").trim();
  const ville = String(formData.get("ville") ?? "").trim();
  const codePostal = String(formData.get("codePostal") ?? "").trim();

  if (!ville || !codePostal) {
    return { erreur: "Merci d'indiquer votre ville et votre code postal." };
  }
  if (!/^\d{5}$/.test(codePostal)) {
    return { erreur: "Le code postal doit comporter 5 chiffres." };
  }

  // Récupère les prix saisis : un champ "prix-<id>" par prestation.
  const prestations = await prisma.prestationType.findMany();
  const prix: { id: number; valeur: number }[] = [];
  for (const p of prestations) {
    const brut = String(formData.get(`prix-${p.id}`) ?? "").replace(",", ".");
    if (brut.trim() === "") continue; // prestation non proposée : prix laissé vide
    const valeur = Number(brut);
    if (!Number.isFinite(valeur) || valeur <= 0) {
      return { erreur: `Prix invalide pour « ${p.nom} ».` };
    }
    prix.push({ id: p.id, valeur });
  }

  if (prix.length === 0) {
    return { erreur: "Merci de renseigner au moins un prix." };
  }

  // Tout est valide : on enregistre profil + prix d'un coup.
  await prisma.$transaction([
    prisma.profil.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        nomEntreprise: nomEntreprise || null,
        ville,
        codePostal,
        onboardingTermine: true,
      },
      update: {
        nomEntreprise: nomEntreprise || null,
        ville,
        codePostal,
        onboardingTermine: true,
      },
    }),
    ...prix.map(({ id, valeur }) =>
      prisma.prestationType.update({
        where: { id },
        data: { prixUnitaire: valeur },
      })
    ),
  ]);

  revalidatePath("/");
  revalidatePath("/prestations");
  redirect("/");
}
