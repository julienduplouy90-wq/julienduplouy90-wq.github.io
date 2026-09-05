// Bibliothèque de prix par défaut : prestations types de paysagisme avec
// des fourchettes indicatives constatées en France (HT). Le prix exact
// (prixUnitaire) est choisi par le paysagiste à l'onboarding.
// Utilisée par le seed manuel ET par l'auto-seed au premier démarrage.
import { prisma } from "./prisma";

export const PRESTATIONS_DEFAUT = [
  // Engazonnement
  { nom: "Pose de gazon en plaque", unite: "m²", categorie: "Engazonnement", prixMin: 15, prixMax: 25 },
  { nom: "Engazonnement par semis", unite: "m²", categorie: "Engazonnement", prixMin: 4, prixMax: 9 },
  { nom: "Pose de gazon synthétique", unite: "m²", categorie: "Engazonnement", prixMin: 40, prixMax: 80 },

  // Taille / Entretien
  { nom: "Tonte de pelouse", unite: "m²", categorie: "Taille/Entretien", prixMin: 0.15, prixMax: 0.45 },
  { nom: "Taille de haie", unite: "ml", categorie: "Taille/Entretien", prixMin: 5, prixMax: 12 },
  { nom: "Débroussaillage", unite: "m²", categorie: "Taille/Entretien", prixMin: 1, prixMax: 3 },
  { nom: "Élagage d'arbre (petit sujet)", unite: "unité", categorie: "Taille/Entretien", prixMin: 80, prixMax: 250 },

  // Clôture
  { nom: "Pose de clôture rigide (panneaux)", unite: "ml", categorie: "Clôture", prixMin: 70, prixMax: 120 },
  { nom: "Pose de grillage souple", unite: "ml", categorie: "Clôture", prixMin: 30, prixMax: 60 },
  { nom: "Pose de portail (fourniture non comprise)", unite: "forfait", categorie: "Clôture", prixMin: 500, prixMax: 1500 },

  // Terrasse
  { nom: "Terrasse en bois (lames + structure)", unite: "m²", categorie: "Terrasse", prixMin: 80, prixMax: 160 },
  { nom: "Terrasse en dalles / pierre", unite: "m²", categorie: "Terrasse", prixMin: 60, prixMax: 120 },
  { nom: "Allée en pavés", unite: "m²", categorie: "Terrasse", prixMin: 40, prixMax: 90 },

  // Plantation
  { nom: "Plantation d'arbuste (fourniture comprise)", unite: "unité", categorie: "Plantation", prixMin: 15, prixMax: 40 },
  { nom: "Plantation d'arbre (fourniture comprise)", unite: "unité", categorie: "Plantation", prixMin: 80, prixMax: 250 },
  { nom: "Pose de paillage", unite: "m²", categorie: "Plantation", prixMin: 5, prixMax: 12 },
];

// Remplit la bibliothèque si elle est vide (idempotent). Appelé au
// chargement de l'onboarding : une base fraîchement déployée (Vercel)
// est ainsi utilisable sans aucune commande manuelle.
export async function seederPrestationsSiVide(): Promise<void> {
  const existantes = await prisma.prestationType.count();
  if (existantes === 0) {
    await prisma.prestationType.createMany({ data: PRESTATIONS_DEFAUT });
  }
}
