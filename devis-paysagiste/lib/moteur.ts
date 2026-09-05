// Moteur d'estimation — PUR (aucune dépendance à l'UI ni à la base).
// Fourchette = quantité × prix de base (min/max) × produit des coefficients
// correspondant aux réponses, arrondie proprement.
//
// Les règles viennent de l'entreprise (EntreprisePrestation.regles) ;
// toute option sans coefficient configuré retombe sur 1 (neutre).

import { typeProjet, type ReglesTarifaires } from "./catalogue";

export type Reponses = Record<string, string | number>;

export type Estimation = {
  min: number;
  max: number;
  // Libellés des choix qui influencent le prix (affichés au particulier)
  facteurs: string[];
};

export function estimer(
  idType: string,
  reponses: Reponses,
  regles: ReglesTarifaires
): Estimation | null {
  const type = typeProjet(idType);
  if (!type || !type.estimable) return null;

  // 1. Quantité : la première question "nombre" du type (surface, longueur…)
  const questionQuantite = type.questions.find((q) => q.type === "nombre");
  if (!questionQuantite) return null;
  const quantite = Number(reponses[questionQuantite.id]);
  if (!Number.isFinite(quantite) || quantite <= 0) return null;

  // 2. Produit des coefficients des réponses aux questions à choix
  let coef = 1;
  const facteurs: string[] = [];
  for (const q of type.questions) {
    if (q.type !== "choix") continue;
    const choix = String(reponses[q.id] ?? "");
    const option = q.options.find((o) => o.id === choix);
    if (!option) continue;
    const c = regles.coefficients?.[q.id]?.[option.id] ?? option.coefDefaut ?? 1;
    coef *= c;
    if (c !== 1) facteurs.push(option.libelle.toLowerCase());
  }

  // 3. Fourchette, arrondie à la centaine (à la dizaine sous 1 000 €)
  const brutMin = quantite * regles.base.min * coef;
  const brutMax = quantite * regles.base.max * coef;
  return {
    min: arrondir(brutMin),
    max: arrondir(brutMax),
    facteurs,
  };
}

function arrondir(montant: number): number {
  const pas = montant < 1000 ? 10 : 100;
  return Math.round(montant / pas) * pas;
}

// Qualification d'un lead selon les seuils de l'entreprise
// (sur l'estimation haute, ou le budget déclaré si pas d'estimation).
export type Qualification = "fort" | "standard" | "petit" | "inconnu";

export function qualifier(
  estimationMax: number | null | undefined,
  seuilPetit: number,
  seuilFort: number
): Qualification {
  if (estimationMax == null) return "inconnu";
  if (estimationMax >= seuilFort) return "fort";
  if (estimationMax < seuilPetit) return "petit";
  return "standard";
}
