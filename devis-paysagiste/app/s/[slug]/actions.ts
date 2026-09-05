"use server";

// Actions du simulateur public :
// 1. creerSimulation — calcule la fourchette CÔTÉ SERVEUR à partir des
//    règles configurées par l'entreprise (jamais depuis le navigateur).
// 2. enregistrerLead — attache les coordonnées à la simulation.
import { prisma } from "@/lib/prisma";
import { typeProjet } from "@/lib/catalogue";
import { estimer, type Reponses } from "@/lib/moteur";
import type { ReglesTarifaires } from "@/lib/catalogue";

export type ResultatSimulation =
  | { erreur: string }
  | { simulationId: number; estimation: { min: number; max: number; facteurs: string[] } | null };

export async function creerSimulation(
  slug: string,
  idType: string,
  reponses: Reponses,
  photos: string[]
): Promise<ResultatSimulation> {
  const entreprise = await prisma.entreprise.findUnique({
    where: { slug },
    include: { prestations: true },
  });
  const type = typeProjet(idType);
  const prestation = entreprise?.prestations.find((p) => p.typeProjet === idType && p.active);
  if (!entreprise || !type || !prestation) {
    return { erreur: "Ce type de projet n'est pas disponible." };
  }

  // Validation basique des réponses attendues
  if (type.estimable) {
    for (const q of type.questions) {
      if (q.type === "nombre") {
        const n = Number(reponses[q.id]);
        if (!Number.isFinite(n) || n < q.min || n > q.max) {
          return { erreur: `Valeur invalide pour « ${q.libelle} ».` };
        }
      }
    }
  }

  // Photos : au plus 3, en data-URL raisonnables (compressées côté client)
  const photosValides = photos
    .filter((p) => typeof p === "string" && p.startsWith("data:image/") && p.length < 400_000)
    .slice(0, 3);

  // Estimation déterministe depuis les règles de L'ENTREPRISE
  const estimation = type.estimable
    ? estimer(idType, reponses, prestation.regles as ReglesTarifaires)
    : null;

  const simulation = await prisma.simulation.create({
    data: {
      entrepriseId: entreprise.id,
      typeProjet: idType,
      reponses,
      photos: photosValides,
      estimationMin: estimation?.min ?? null,
      estimationMax: estimation?.max ?? null,
    },
  });

  return { simulationId: simulation.id, estimation };
}

export type DonneesLead = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  codePostal: string;
  commune: string;
  delai: string;
  budgetMax: string; // texte libre, converti côté serveur
};

export type ResultatLead = { erreur?: string; ok?: boolean };

export async function enregistrerLead(
  simulationId: number,
  donnees: DonneesLead
): Promise<ResultatLead> {
  const simulation = await prisma.simulation.findUnique({
    where: { id: simulationId },
    include: { lead: true },
  });
  if (!simulation) return { erreur: "Simulation introuvable." };
  if (simulation.lead) return { ok: true }; // déjà enregistré (double clic)

  const prenom = donnees.prenom.trim();
  const nom = donnees.nom.trim();
  const email = donnees.email.trim();
  const telephone = donnees.telephone.trim();
  const codePostal = donnees.codePostal.trim();

  if (!prenom || !nom) return { erreur: "Merci d'indiquer votre prénom et votre nom." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { erreur: "Adresse email invalide." };
  if (telephone.replace(/\D/g, "").length < 9) return { erreur: "Numéro de téléphone invalide." };
  if (!/^\d{5}$/.test(codePostal)) return { erreur: "Le code postal doit comporter 5 chiffres." };

  const budgetMax = Number(donnees.budgetMax.replace(/[^\d.,]/g, "").replace(",", "."));

  await prisma.lead.create({
    data: {
      simulationId,
      entrepriseId: simulation.entrepriseId,
      prenom,
      nom,
      email,
      telephone,
      codePostal,
      commune: donnees.commune.trim() || null,
      delai: donnees.delai || "des-que-possible",
      budgetMax: Number.isFinite(budgetMax) && budgetMax > 0 ? budgetMax : null,
    },
  });

  return { ok: true };
}
