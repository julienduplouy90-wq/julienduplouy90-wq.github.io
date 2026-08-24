#!/usr/bin/env node
/* =====================================================================
   Assistant de création d'un nouveau client :
     npm run create-client
   Pose 5 questions, clone la config de démonstration avec les
   réponses, et construit le site. Prêt en moins de 10 minutes.
   ===================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");

const ROOT = __dirname;
/* Lecture robuste : fonctionne au clavier ET avec une entrée pipée
   (les lignes reçues entre deux questions sont mises en file). */
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
const pending = [];
const waiting = [];
let stdinClosed = false;
rl.on("line", (l) => { const w = waiting.shift(); if (w) w(l); else pending.push(l); });
rl.on("close", () => { stdinClosed = true; waiting.splice(0).forEach((w) => w("")); });
function readLine() {
  return new Promise((res) => {
    if (pending.length) return res(pending.shift());
    if (stdinClosed) return res("");
    waiting.push(res);
  });
}
async function ask(q, def) {
  process.stdout.write(q + (def ? ` [${def}]` : "") + " : ");
  const a = (await readLine()).trim();
  if (!process.stdin.isTTY) process.stdout.write(a + "\n");
  return a || def || "";
}

function slugify(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

(async function main() {
  console.log("\n— Nouveau client paysagiste —\n");
  const name = await ask("Nom de l'entreprise");
  if (!name) { console.error("Le nom est obligatoire."); process.exit(1); }
  const city = await ask("Ville principale", "Pau");
  const phone = await ask("Téléphone", "05 00 00 00 00");
  const email = await ask("Email", "contact@exemple.fr");
  const color = await ask("Couleur principale (hex)", "#1e4230");
  rl.close();

  const slug = slugify(name);
  const dir = path.join(ROOT, "clients", slug);
  if (fs.existsSync(dir)) { console.error(`✗ clients/${slug} existe déjà.`); process.exit(1); }

  // Base : la config de démonstration, avec les infos du prospect.
  const base = JSON.parse(fs.readFileSync(path.join(ROOT, "clients", "atelier-paysage", "config.json"), "utf8"));
  Object.assign(base, {
    slug,
    demoMode: true, // toujours en démo à la création ; passer à false après signature
    name,
    legalName: `${name} — maquette de démonstration`,
    logoText: name,
    phone,
    email,
    city,
    domain: `https://demo-${slug}.exemple`, // TODO: remplacer par le vrai domaine
    interventionAreas: [city].concat(base.interventionAreas.filter((a) => a !== city).slice(0, 7)),
    primaryColor: color,
  });
  // Adapter les villes des projets d'exemple à la ville du prospect
  base.projects = base.projects.map((p, i) => Object.assign({}, p, { city: i % 2 === 0 ? city : p.city }));
  base.faq = base.faq.map((f) => Object.assign({}, f, {
    a: f.a.split("Pau").join(city),
  }));

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify(base, null, 2));
  fs.mkdirSync(path.join(dir, "img"), { recursive: true });

  console.log(`\n✓ clients/${slug}/config.json créé (mode démo).`);
  execSync(`node ${path.join(ROOT, "build.js")} ${slug}`, { stdio: "inherit" });
  console.log(`\nMaquette prête : dist/${slug}/index.html`);
  console.log("Pour affiner : éditez clients/" + slug + "/config.json puis relancez `npm run build " + slug + "`.\n");
})();
