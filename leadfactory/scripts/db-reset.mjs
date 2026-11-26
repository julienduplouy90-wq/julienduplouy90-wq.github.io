// Supprime la base locale PGlite (./.data/pglite). Arrêtez `npm run dev` avant.
// Au prochain démarrage : migrations + projet pilote (+ démo si SEED_DEMO != false).
import { rm } from "node:fs/promises";
await rm(new URL("../.data/pglite", import.meta.url), { recursive: true, force: true });
console.log("Base locale supprimée. Relancez `npm run dev`.");
