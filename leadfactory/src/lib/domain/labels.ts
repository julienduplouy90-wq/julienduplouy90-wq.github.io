export const PARTNER_STATUSES: Record<string, string> = {
  to_contact: "À contacter",
  contacted: "Contacté",
  followed_up: "Relancé",
  interested: "Intéressé",
  negotiating: "En négociation",
  active: "Partenaire actif",
  refused: "Refus",
  inactive: "Inactif",
  opted_out: "Opposition à la prospection",
};

export const LEAD_STATUSES: Record<string, string> = {
  new: "Nouveau",
  qualified: "Qualifié",
  rejected: "Rejeté",
  assigned: "Attribué",
  sent: "Transmis",
  sold: "Vendu",
  refused_by_partner: "Refusé par le partenaire",
};

export const ASSIGNMENT_STATUSES: Record<string, string> = {
  validated: "Validée (à transmettre)",
  sent: "Transmise",
  accepted: "Acceptée",
  refused: "Refusée",
  cancelled: "Annulée",
};

export const BILLING_STATUSES: Record<string, string> = {
  forecast: "Prévisionnel",
  invoiced: "Facturé",
  paid: "Encaissé",
  not_billable: "Non facturable",
};

export const PROJECT_STATUSES: Record<string, string> = {
  draft: "Brouillon",
  active: "Actif",
  paused: "En pause",
  archived: "Archivé",
};

export const SITE_STATUSES: Record<string, string> = {
  draft: "Brouillon",
  preview: "Prévisualisation",
  published: "Publié",
};

export const EXPENSE_CATEGORIES: Record<string, string> = {
  ads: "Publicité",
  domain: "Domaines",
  hosting: "Hébergement",
  api: "API",
  other: "Autres",
};

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export const LEAD_TONES: Record<string, Tone> = {
  new: "info", qualified: "success", rejected: "danger", assigned: "warning", sent: "info", sold: "success", refused_by_partner: "danger",
};
export const PARTNER_TONES: Record<string, Tone> = {
  to_contact: "neutral", contacted: "info", followed_up: "info", interested: "warning", negotiating: "warning",
  active: "success", refused: "danger", inactive: "neutral", opted_out: "danger",
};
