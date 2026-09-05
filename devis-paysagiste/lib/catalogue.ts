// Catalogue des types de projets proposables par les entreprises :
// questions posées au particulier + règles tarifaires PAR DÉFAUT
// (fourchettes indicatives France, que chaque entreprise ajuste).
//
// Pour ajouter un type de projet ou une question : compléter ce fichier,
// tout le reste (simulateur, config des prix, moteur) suit automatiquement.

export type Option = {
  id: string;
  libelle: string;
  coefDefaut: number; // multiplicateur appliqué à la fourchette de base
};

export type Question =
  | {
      id: string;
      type: "nombre"; // quantité : surface, longueur…
      libelle: string;
      unite: string;
      min: number;
      max: number;
      defaut: number;
      aide?: string;
    }
  | {
      id: string;
      type: "choix";
      libelle: string;
      options: Option[];
    };

export type TypeProjet = {
  id: string;
  libelle: string;
  emoji: string;
  description: string; // sous-titre sur la carte du simulateur
  estimable: boolean; // false = pas de calcul (ex : "Autre"), lead direct
  unite?: string; // unité de la fourchette de base ("m²", "ml")
  baseDefaut?: { min: number; max: number }; // prix par unité par défaut
  questions: Question[];
};

export const CATALOGUE: TypeProjet[] = [
  {
    id: "terrasse",
    libelle: "Terrasse",
    emoji: "🪵",
    description: "Bois, composite, pierre, carrelage…",
    estimable: true,
    unite: "m²",
    baseDefaut: { min: 80, max: 160 },
    questions: [
      { id: "surface", type: "nombre", libelle: "Surface approximative", unite: "m²", min: 5, max: 200, defaut: 20 },
      {
        id: "materiau", type: "choix", libelle: "Matériau souhaité",
        options: [
          { id: "bois", libelle: "Bois", coefDefaut: 1 },
          { id: "composite", libelle: "Composite", coefDefaut: 1.15 },
          { id: "pierre", libelle: "Pierre naturelle", coefDefaut: 1.35 },
          { id: "carrelage", libelle: "Carrelage", coefDefaut: 1.25 },
          { id: "ne-sais-pas", libelle: "Je ne sais pas encore", coefDefaut: 1 },
        ],
      },
      {
        id: "terrain", type: "choix", libelle: "Votre terrain",
        options: [
          { id: "plat", libelle: "Plat", coefDefaut: 1 },
          { id: "leger", libelle: "Légèrement pentu", coefDefaut: 1.1 },
          { id: "fort", libelle: "Fortement pentu", coefDefaut: 1.25 },
        ],
      },
      {
        id: "acces", type: "choix", libelle: "Accès au chantier",
        options: [
          { id: "facile", libelle: "Facile", coefDefaut: 1 },
          { id: "moyen", libelle: "Moyen", coefDefaut: 1.1 },
          { id: "difficile", libelle: "Difficile", coefDefaut: 1.2 },
        ],
      },
    ],
  },
  {
    id: "cloture",
    libelle: "Clôture",
    emoji: "🚧",
    description: "Panneaux rigides, grillage, bois…",
    estimable: true,
    unite: "ml",
    baseDefaut: { min: 70, max: 120 },
    questions: [
      { id: "longueur", type: "nombre", libelle: "Longueur approximative", unite: "ml", min: 5, max: 300, defaut: 30 },
      {
        id: "type", type: "choix", libelle: "Type de clôture",
        options: [
          { id: "rigide", libelle: "Panneaux rigides", coefDefaut: 1 },
          { id: "souple", libelle: "Grillage souple", coefDefaut: 0.5 },
          { id: "bois", libelle: "Bois / claustra", coefDefaut: 1.2 },
          { id: "composite", libelle: "Composite / aluminium", coefDefaut: 1.5 },
          { id: "ne-sais-pas", libelle: "Je ne sais pas encore", coefDefaut: 1 },
        ],
      },
      {
        id: "hauteur", type: "choix", libelle: "Hauteur souhaitée",
        options: [
          { id: "h120", libelle: "≈ 1,20 m", coefDefaut: 0.9 },
          { id: "h150", libelle: "≈ 1,50 m", coefDefaut: 1 },
          { id: "h180", libelle: "≈ 1,80 m", coefDefaut: 1.15 },
          { id: "h200", libelle: "2 m et +", coefDefaut: 1.3 },
        ],
      },
      {
        id: "depose", type: "choix", libelle: "Une clôture existante à déposer ?",
        options: [
          { id: "non", libelle: "Non", coefDefaut: 1 },
          { id: "oui", libelle: "Oui", coefDefaut: 1.15 },
        ],
      },
      {
        id: "acces", type: "choix", libelle: "Accès au chantier",
        options: [
          { id: "facile", libelle: "Facile", coefDefaut: 1 },
          { id: "moyen", libelle: "Moyen", coefDefaut: 1.1 },
          { id: "difficile", libelle: "Difficile", coefDefaut: 1.2 },
        ],
      },
    ],
  },
  {
    id: "allee",
    libelle: "Allée / cour",
    emoji: "🛤️",
    description: "Pavés, gravier, béton, enrobé…",
    estimable: true,
    unite: "m²",
    baseDefaut: { min: 40, max: 90 },
    questions: [
      { id: "surface", type: "nombre", libelle: "Surface approximative", unite: "m²", min: 5, max: 500, defaut: 50 },
      {
        id: "revetement", type: "choix", libelle: "Revêtement souhaité",
        options: [
          { id: "paves", libelle: "Pavés", coefDefaut: 1 },
          { id: "gravier", libelle: "Gravier stabilisé", coefDefaut: 0.55 },
          { id: "beton", libelle: "Béton / béton décoratif", coefDefaut: 0.9 },
          { id: "enrobe", libelle: "Enrobé", coefDefaut: 0.8 },
          { id: "ne-sais-pas", libelle: "Je ne sais pas encore", coefDefaut: 1 },
        ],
      },
      {
        id: "acces", type: "choix", libelle: "Accès au chantier",
        options: [
          { id: "facile", libelle: "Facile", coefDefaut: 1 },
          { id: "moyen", libelle: "Moyen", coefDefaut: 1.1 },
          { id: "difficile", libelle: "Difficile", coefDefaut: 1.2 },
        ],
      },
    ],
  },
  {
    id: "engazonnement",
    libelle: "Engazonnement",
    emoji: "🌱",
    description: "Semis, gazon en plaque, synthétique…",
    estimable: true,
    unite: "m²",
    baseDefaut: { min: 15, max: 25 },
    questions: [
      { id: "surface", type: "nombre", libelle: "Surface approximative", unite: "m²", min: 10, max: 2000, defaut: 100 },
      {
        id: "type", type: "choix", libelle: "Type de gazon",
        options: [
          { id: "plaque", libelle: "Gazon en plaque (résultat immédiat)", coefDefaut: 1 },
          { id: "semis", libelle: "Semis (plus économique)", coefDefaut: 0.35 },
          { id: "synthetique", libelle: "Gazon synthétique", coefDefaut: 3 },
          { id: "ne-sais-pas", libelle: "Je ne sais pas encore", coefDefaut: 1 },
        ],
      },
      {
        id: "preparation", type: "choix", libelle: "État actuel du terrain",
        options: [
          { id: "pret", libelle: "Terrain déjà préparé", coefDefaut: 1 },
          { id: "moyen", libelle: "À nettoyer / niveler", coefDefaut: 1.2 },
          { id: "complet", libelle: "Tout à refaire", coefDefaut: 1.4 },
        ],
      },
      {
        id: "acces", type: "choix", libelle: "Accès au terrain",
        options: [
          { id: "facile", libelle: "Facile", coefDefaut: 1 },
          { id: "difficile", libelle: "Difficile", coefDefaut: 1.15 },
        ],
      },
    ],
  },
  {
    id: "plantation",
    libelle: "Plantation / massif",
    emoji: "🌸",
    description: "Massifs, haies, arbres, paillage…",
    estimable: true,
    unite: "m²",
    baseDefaut: { min: 30, max: 70 },
    questions: [
      { id: "surface", type: "nombre", libelle: "Surface à planter", unite: "m²", min: 2, max: 500, defaut: 20 },
      {
        id: "densite", type: "choix", libelle: "Style souhaité",
        options: [
          { id: "epure", libelle: "Épuré (quelques sujets)", coefDefaut: 0.8 },
          { id: "classique", libelle: "Classique", coefDefaut: 1 },
          { id: "dense", libelle: "Dense / luxuriant", coefDefaut: 1.35 },
        ],
      },
      {
        id: "paillage", type: "choix", libelle: "Paillage / finition",
        options: [
          { id: "non", libelle: "Sans", coefDefaut: 1 },
          { id: "oui", libelle: "Avec paillage", coefDefaut: 1.15 },
        ],
      },
    ],
  },
  {
    id: "amenagement",
    libelle: "Aménagement complet",
    emoji: "🏡",
    description: "Création ou refonte totale du jardin",
    estimable: true,
    unite: "m²",
    baseDefaut: { min: 40, max: 90 },
    questions: [
      { id: "surface", type: "nombre", libelle: "Surface du jardin", unite: "m²", min: 20, max: 5000, defaut: 300 },
      {
        id: "niveau", type: "choix", libelle: "Niveau de prestation",
        options: [
          { id: "essentiel", libelle: "Essentiel", coefDefaut: 0.7 },
          { id: "confort", libelle: "Confort", coefDefaut: 1 },
          { id: "haut-de-gamme", libelle: "Haut de gamme", coefDefaut: 1.6 },
        ],
      },
      {
        id: "etat", type: "choix", libelle: "État actuel",
        options: [
          { id: "neuf", libelle: "Terrain nu (construction neuve)", coefDefaut: 1 },
          { id: "refonte", libelle: "Jardin existant à transformer", coefDefaut: 1.15 },
        ],
      },
    ],
  },
  {
    id: "arrosage",
    libelle: "Arrosage automatique",
    emoji: "💧",
    description: "Enterré ou goutte-à-goutte",
    estimable: true,
    unite: "m²",
    baseDefaut: { min: 8, max: 15 },
    questions: [
      { id: "surface", type: "nombre", libelle: "Surface à arroser", unite: "m²", min: 20, max: 3000, defaut: 200 },
      {
        id: "type", type: "choix", libelle: "Type d'arrosage",
        options: [
          { id: "enterre", libelle: "Enterré (pelouse)", coefDefaut: 1 },
          { id: "goutte", libelle: "Goutte-à-goutte (massifs)", coefDefaut: 0.7 },
          { id: "mixte", libelle: "Les deux", coefDefaut: 1.2 },
        ],
      },
    ],
  },
  {
    id: "autre",
    libelle: "Autre projet",
    emoji: "✏️",
    description: "Décrivez-nous votre idée",
    estimable: false, // pas de fourchette : demande directe
    questions: [],
  },
];

export function typeProjet(id: string): TypeProjet | undefined {
  return CATALOGUE.find((t) => t.id === id);
}

// Règles tarifaires par défaut d'un type (copiées chez l'entreprise à
// l'activation, puis modifiables par elle).
export function reglesDefaut(t: TypeProjet): ReglesTarifaires {
  const coefficients: Record<string, Record<string, number>> = {};
  for (const q of t.questions) {
    if (q.type === "choix") {
      coefficients[q.id] = Object.fromEntries(q.options.map((o) => [o.id, o.coefDefaut]));
    }
  }
  return { base: t.baseDefaut ?? { min: 0, max: 0 }, coefficients };
}

// Structure des règles stockées en JSON sur EntreprisePrestation.regles
export type ReglesTarifaires = {
  base: { min: number; max: number }; // prix par unité (€ HT)
  coefficients: Record<string, Record<string, number>>; // question → option → coef
};

export const DELAIS = [
  { id: "des-que-possible", libelle: "Dès que possible" },
  { id: "1-3-mois", libelle: "Dans 1 à 3 mois" },
  { id: "3-6-mois", libelle: "Dans 3 à 6 mois" },
  { id: "plus-tard", libelle: "Plus tard / je me renseigne" },
];
