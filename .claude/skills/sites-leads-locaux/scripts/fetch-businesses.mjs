#!/usr/bin/env node
// Récupère les entreprises Google Maps d'une niche, ville par ville, via l'API DataForSEO
// (Google Maps SERP, mode live) et écrit data/businesses/<niche>/<insee>.json.
// Ces fichiers alimentent le bloc « annuaire » + le JSON-LD ItemList/LocalBusiness des pages villes.
//
// Identifiants : variables d'environnement DATAFORSEO_LOGIN et DATAFORSEO_PASSWORD (jamais dans un fichier commité).
// Usage : node scripts/fetch-businesses.mjs --niche pompe-a-chaleur [--min-pop 20000] [--limit 200] [--depts 69,01]
//
// Autres sources (CrazySERP, SEOSpoint, export Outscraper…) : écrire les mêmes fichiers au format
// [{ "name", "address", "website", "rating", "reviews", "lat", "lon" }] suffit, build-site.mjs ne lit que ça.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);

const nicheSlug = opt("--niche");
const minPop = +opt("--min-pop", 20000);
const limit = +opt("--limit", 100);
const depts = opt("--depts") ? new Set(opt("--depts").split(",")) : null;
const outDir = resolve(opt("--out", `${here}/../data/businesses`), nicheSlug ?? "");
const { DATAFORSEO_LOGIN: login, DATAFORSEO_PASSWORD: password } = process.env;

if (!nicheSlug) throw new Error("--niche requis");
if (!login || !password) throw new Error("DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD absents de l'environnement");

const { niches } = JSON.parse(await readFile(`${here}/niches.json`, "utf8"));
const niche = niches.find((n) => n.slug === nicheSlug);
if (!niche) throw new Error(`niche inconnue : ${nicheSlug}`);
const geo = JSON.parse(await readFile(`${here}/../data/geo-fr.json`, "utf8"));
const cities = geo.cities
  .filter((c) => c.pop >= minPop && (!depts || depts.has(c.dept)))
  .sort((a, b) => b.pop - a.pop)
  .slice(0, limit);

await mkdir(outDir, { recursive: true });
const auth = "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
let done = 0, skipped = 0;

for (const c of cities) {
  const file = join(outDir, `${c.insee}.json`);
  if (existsSync(file)) { skipped++; continue; } // cache : on ne repaie jamais une ville déjà récupérée
  const res = await fetch("https://api.dataforseo.com/v3/serp/google/maps/live/advanced", {
    method: "POST",
    headers: { authorization: auth, "content-type": "application/json" },
    body: JSON.stringify([{
      keyword: `${niche.keyword} ${c.name}`,
      language_code: "fr",
      location_coordinate: `${c.lat},${c.lon},13z`,
      depth: 20,
    }]),
  });
  const json = await res.json();
  const items = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  const list = items
    .filter((i) => i.type === "maps_search" && i.title)
    .map((i) => ({
      name: i.title,
      address: i.address ?? "",
      website: i.url ?? "",
      rating: i.rating?.value ?? null,
      reviews: i.rating?.votes_count ?? 0,
      category: i.category ?? "",
      lat: i.latitude ?? null,
      lon: i.longitude ?? null,
    }));
  await writeFile(file, JSON.stringify(list, null, 1));
  done++;
  console.log(`${c.name} : ${list.length} entreprises`);
}
console.log(`Terminé : ${done} villes récupérées, ${skipped} déjà en cache → ${outDir}`);
