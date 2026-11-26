export type Choice = { value: string; label: string };

export type Question =
  | { id: string; kind: "choice"; label: string; help?: string; required: boolean; choices: Choice[] }
  | { id: string; kind: "number"; label: string; help?: string; required: boolean; min: number; max: number; unknownLabel?: string };

export type TimelineChoice = Choice & { actionable: "high" | "medium" | "low" };

export type NicheService = { slug: string; name: string; summary: string };

export type NicheDefinition = {
  key: string;
  name: string;
  locale: string;
  services: NicheService[];
  /** Valeur "autre / je ne sais pas" acceptée pour le type de projet. */
  otherServiceLabel: string;
  questions: Question[];
  timelines: TimelineChoice[];
  content: {
    heroTitle: (zone: string) => string;
    heroSubtitle: (zone: string) => string;
    howItWorks: { title: string; text: string }[];
    serviceBody: (serviceName: string, zone: string) => string[];
    faq: { q: string; a: string }[];
  };
};

/** Données éditeur nécessaires aux mentions légales — jamais inventées. */
export type PublisherInfo = {
  name?: string;
  legalForm?: string;
  siret?: string;
  address?: string;
  email?: string;
  director?: string;
  host?: string;
};
