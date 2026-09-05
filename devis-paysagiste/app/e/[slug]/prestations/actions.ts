"use server";

// Actions sur les prestations d'une entreprise : activer/désactiver un
// type de projet, enregistrer les règles tarifaires.
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CATALOGUE, reglesDefaut, type ReglesTarifaires } from "@/lib/catalogue";

export async function basculerPrestation(formData: FormData) {
  const slug = String(formData.get("slug"));
  const idType = String(formData.get("typeProjet"));
  const type = CATALOGUE.find((t) => t.id === idType);
  const entreprise = await prisma.entreprise.findUnique({ where: { slug } });
  if (!type || !entreprise) return;

  const existante = await prisma.entreprisePrestation.findUnique({
    where: { entrepriseId_typeProjet: { entrepriseId: entreprise.id, typeProjet: idType } },
  });

  if (existante) {
    await prisma.entreprisePrestation.update({
      where: { id: existante.id },
      data: { active: !existante.active },
    });
  } else {
    // Première activation : on part des règles par défaut du catalogue.
    await prisma.entreprisePrestation.create({
      data: {
        entrepriseId: entreprise.id,
        typeProjet: idType,
        active: true,
        regles: reglesDefaut(type),
      },
    });
  }
  revalidatePath(`/e/${slug}/prestations`);
}

export type ResultatRegles = { erreur?: string; ok?: boolean };

export async function enregistrerRegles(
  slug: string,
  idType: string,
  regles: ReglesTarifaires
): Promise<ResultatRegles> {
  const type = CATALOGUE.find((t) => t.id === idType);
  const entreprise = await prisma.entreprise.findUnique({ where: { slug } });
  if (!type || !entreprise) return { erreur: "Prestation introuvable." };

  // Validation de la fourchette de base
  const { min, max } = regles.base;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min) {
    return { erreur: "Fourchette invalide : le minimum doit être > 0 et le maximum ≥ minimum." };
  }
  // Validation des coefficients (chaque valeur entre 0.05 et 10)
  const propres: ReglesTarifaires = { base: { min, max }, coefficients: {} };
  for (const q of type.questions) {
    if (q.type !== "choix") continue;
    propres.coefficients[q.id] = {};
    for (const o of q.options) {
      const c = Number(regles.coefficients?.[q.id]?.[o.id]);
      if (!Number.isFinite(c) || c < 0.05 || c > 10) {
        return { erreur: `Coefficient invalide pour « ${o.libelle} » (entre 0,05 et 10).` };
      }
      propres.coefficients[q.id][o.id] = c;
    }
  }

  await prisma.entreprisePrestation.update({
    where: { entrepriseId_typeProjet: { entrepriseId: entreprise.id, typeProjet: idType } },
    data: { regles: propres },
  });
  revalidatePath(`/e/${slug}/prestations`);
  return { ok: true };
}
