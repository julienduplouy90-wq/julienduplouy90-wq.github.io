"use server";

// Création d'un devis : valide les données puis enregistre le devis
// et ses lignes. Les prix/noms sont COPIÉS depuis la bibliothèque au
// moment de la création (historique préservé si les tarifs changent).
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type LigneSaisie = { prestationTypeId: number; quantite: number };
export type EtatDevis = { erreur?: string };

export async function creerDevis(
  donnees: {
    nomClient: string;
    adresseChantier: string;
    notes: string;
    lignes: LigneSaisie[];
  }
): Promise<EtatDevis> {
  const nomClient = donnees.nomClient.trim();
  const adresseChantier = donnees.adresseChantier.trim();

  if (!nomClient) return { erreur: "Merci d'indiquer le nom du client." };
  if (!adresseChantier) return { erreur: "Merci d'indiquer l'adresse du chantier." };
  if (donnees.lignes.length === 0) {
    return { erreur: "Ajoutez au moins une prestation au devis." };
  }
  for (const l of donnees.lignes) {
    if (!Number.isFinite(l.quantite) || l.quantite <= 0) {
      return { erreur: "Chaque ligne doit avoir une quantité supérieure à zéro." };
    }
  }

  // Recharge les prestations côté serveur : on ne fait pas confiance
  // aux prix envoyés par le navigateur.
  const ids = donnees.lignes.map((l) => l.prestationTypeId);
  const prestations = await prisma.prestationType.findMany({
    where: { id: { in: ids } },
  });
  const parId = new Map(prestations.map((p) => [p.id, p]));

  const lignes = [];
  for (const l of donnees.lignes) {
    const p = parId.get(l.prestationTypeId);
    if (!p) return { erreur: "Une prestation sélectionnée n'existe plus." };
    if (p.prixUnitaire == null) {
      return { erreur: `Pas de prix défini pour « ${p.nom} » — remplissez-le dans Mes tarifs.` };
    }
    lignes.push({
      prestationTypeId: p.id,
      nomPrestation: p.nom,
      unite: p.unite,
      quantite: l.quantite,
      prixUnitaire: p.prixUnitaire,
      sousTotal: Math.round(l.quantite * p.prixUnitaire * 100) / 100,
    });
  }

  const totalHT = Math.round(lignes.reduce((somme, l) => somme + l.sousTotal, 0) * 100) / 100;

  const devis = await prisma.devis.create({
    data: {
      nomClient,
      adresseChantier,
      notes: donnees.notes.trim() || null,
      totalHT,
      lignes: { create: lignes },
    },
  });

  revalidatePath("/devis");
  revalidatePath("/");
  redirect(`/devis/${devis.id}`);
}
