import type { NicheDefinition } from "../types";
import { assainissement } from "./assainissement";

/** Registre des niches disponibles. Ajouter une niche = ajouter un fichier ici (voir docs/ARCHITECTURE.md). */
export const NICHES: Record<string, NicheDefinition> = { [assainissement.key]: assainissement };

export function getNiche(key: string): NicheDefinition {
  const n = NICHES[key];
  if (!n) throw new Error(`Niche inconnue : ${key}`);
  return n;
}

export const nicheOptions = Object.values(NICHES).map((n) => ({ value: n.key, label: n.name }));
