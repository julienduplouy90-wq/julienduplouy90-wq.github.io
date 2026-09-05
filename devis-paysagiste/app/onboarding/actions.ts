"use server";

// Création d'une entreprise depuis le wizard d'onboarding :
// infos + branding + prestations activées avec leurs règles par défaut,
// éventuellement ajustées (prix de base min/max saisis).
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATALOGUE, reglesDefaut } from "@/lib/catalogue";

export type DonneesOnboarding = {
  nom: string;
  telephone: string;
  email: string;
  ville: string;
  codePostal: string;
  zone: string;
  couleur: string;
  logo: string | null; // data-URL compressée côté client, ou null
  prestations: {
    typeProjet: string;
    base: { min: number; max: number };
  }[];
};

export type ResultatOnboarding = { erreur?: string };

// Slug lisible + suffixe aléatoire : sert d'URL publique du simulateur
// et de « clé » du dashboard (pas d'authentification en phase de test).
function genererSlug(nom: string): string {
  const base = nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30) || "entreprise";
  const suffixe = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffixe}`;
}

export async function creerEntreprise(
  donnees: DonneesOnboarding
): Promise<ResultatOnboarding> {
  const nom = donnees.nom.trim();
  if (!nom) return { erreur: "Merci d'indiquer le nom de votre entreprise." };
  if (donnees.prestations.length === 0) {
    return { erreur: "Activez au moins un type de projet." };
  }

  // Valide les prestations et construit leurs règles.
  const prestations = [];
  for (const p of donnees.prestations) {
    const type = CATALOGUE.find((t) => t.id === p.typeProjet);
    if (!type) continue;
    const regles = reglesDefaut(type);
    if (type.estimable) {
      const { min, max } = p.base;
      if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min) {
        return { erreur: `Fourchette de prix invalide pour « ${type.libelle} » (min > 0 et max ≥ min).` };
      }
      regles.base = { min, max };
    }
    prestations.push({ typeProjet: type.id, active: true, regles });
  }

  // Logo : on limite la taille pour ne pas gonfler la base.
  const logo = donnees.logo && donnees.logo.length < 200_000 ? donnees.logo : null;

  const entreprise = await prisma.entreprise.create({
    data: {
      slug: genererSlug(nom),
      nom,
      telephone: donnees.telephone.trim() || null,
      email: donnees.email.trim() || null,
      ville: donnees.ville.trim() || null,
      codePostal: donnees.codePostal.trim() || null,
      zone: donnees.zone.trim() || null,
      couleur: /^#[0-9a-fA-F]{6}$/.test(donnees.couleur) ? donnees.couleur : "#166534",
      logo,
      prestations: { create: prestations },
    },
  });

  redirect(`/e/${entreprise.slug}/installer?bienvenue=1`);
}
