#!/usr/bin/env node
// Télécharge les communes et départements français (API officielle geo.api.gouv.fr, données INSEE)
// et prépare data/geo-fr.json : communes + slugs + départements limitrophes.
// Usage : node scripts/fetch-geo.mjs [--out data/geo-fr.json]
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { slugify } from "./lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const out = resolve(args.includes("--out") ? args[args.indexOf("--out") + 1] : `${here}/../data/geo-fr.json`);

async function get(url, tries = 5) {
  for (let i = 1; i <= tries; i++) {
    try {
      const r = await fetch(url, { headers: { accept: "application/json" } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (i === tries) throw e;
      console.warn(`  échec (${e.message}), nouvel essai ${i + 1}/${tries}…`);
      await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
}

console.log("Départements…");
const depts = await get("https://geo.api.gouv.fr/departements?fields=nom,code,codeRegion");
console.log("Communes (≈ 35 000, quelques secondes)…");
const communes = await get(
  "https://geo.api.gouv.fr/communes?fields=nom,code,population,centre,codeDepartement,codesPostaux&format=json",
);

const cities = communes
  .filter((c) => c.centre && c.codeDepartement)
  .map((c) => ({
    insee: c.code,
    name: c.nom,
    slug: slugify(c.nom),
    dept: c.codeDepartement,
    pop: c.population ?? 0,
    cp: (c.codesPostaux ?? [])[0] ?? "",
    lon: +c.centre.coordinates[0].toFixed(4),
    lat: +c.centre.coordinates[1].toFixed(4),
  }));

// Départements limitrophes : deux départements sont voisins si des communes des deux
// tombent dans des cases voisines d'une grille de 0,06° (~5 km).
const CELL = 0.06;
const grid = new Map();
for (const c of cities) {
  const k = `${Math.floor(c.lon / CELL)}:${Math.floor(c.lat / CELL)}`;
  if (!grid.has(k)) grid.set(k, new Set());
  grid.get(k).add(c.dept);
}
const adj = new Map(depts.map((d) => [d.code, new Set()]));
for (const [k, set] of grid) {
  const [x, y] = k.split(":").map(Number);
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++) {
      const other = grid.get(`${x + dx}:${y + dy}`);
      if (!other) continue;
      for (const a of set) for (const b of other) if (a !== b) adj.get(a)?.add(b);
    }
}

const departments = depts.map((d) => {
  const own = cities.filter((c) => c.dept === d.code);
  return {
    code: d.code,
    name: d.nom,
    slug: slugify(d.nom),
    region: d.codeRegion,
    pop: own.reduce((s, c) => s + c.pop, 0),
    neighbours: [...(adj.get(d.code) ?? [])].sort(),
  };
});

await mkdir(dirname(out), { recursive: true });
await writeFile(out, JSON.stringify({ source: "geo.api.gouv.fr", fetchedAt: new Date().toISOString(), departments, cities }));
console.log(`OK : ${departments.length} départements, ${cities.length} communes → ${out}`);
