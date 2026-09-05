"use server";

// Mise à jour des réglages de l'entreprise (identité, branding, seuils).
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type DonneesReglages = {
  nom: string;
  telephone: string;
  email: string;
  ville: string;
  codePostal: string;
  zone: string;
  couleur: string;
  logo: string | null; // null = inchangé, "" = supprimer
  seuilPetit: number;
  seuilFort: number;
};

export type ResultatReglages = { erreur?: string; ok?: boolean };

export async function enregistrerReglages(
  slug: string,
  donnees: DonneesReglages
): Promise<ResultatReglages> {
  const entreprise = await prisma.entreprise.findUnique({ where: { slug } });
  if (!entreprise) return { erreur: "Entreprise introuvable." };
  if (!donnees.nom.trim()) return { erreur: "Le nom de l'entreprise est obligatoire." };
  const { seuilPetit, seuilFort } = donnees;
  if (!Number.isFinite(seuilPetit) || !Number.isFinite(seuilFort) || seuilPetit < 0 || seuilFort <= seuilPetit) {
    return { erreur: "Seuils invalides : le seuil « forte valeur » doit être supérieur au seuil « petit projet »." };
  }

  await prisma.entreprise.update({
    where: { id: entreprise.id },
    data: {
      nom: donnees.nom.trim(),
      telephone: donnees.telephone.trim() || null,
      email: donnees.email.trim() || null,
      ville: donnees.ville.trim() || null,
      codePostal: donnees.codePostal.trim() || null,
      zone: donnees.zone.trim() || null,
      couleur: /^#[0-9a-fA-F]{6}$/.test(donnees.couleur) ? donnees.couleur : entreprise.couleur,
      ...(donnees.logo === null
        ? {}
        : { logo: donnees.logo && donnees.logo.length < 200_000 ? donnees.logo : null }),
      seuilPetit: Math.round(seuilPetit),
      seuilFort: Math.round(seuilFort),
    },
  });

  revalidatePath(`/e/${slug}`, "layout");
  return { ok: true };
}
