#!/usr/bin/env node
/* =====================================================================
   Build : génère dist/<client>/ à partir de clients/<client>/config.json
   Usage :
     node build.js atelier-paysage     -> construit un client
     node build.js --all               -> construit tous les clients
   Aucune dépendance externe.
   ===================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");
const render = require("./lib/render.js");

const ROOT = __dirname;
const CLIENTS_DIR = path.join(ROOT, "clients");
const DIST_DIR = path.join(ROOT, "dist");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function buildClient(slug) {
  const configPath = path.join(CLIENTS_DIR, slug, "config.json");
  if (!fs.existsSync(configPath)) {
    console.error(`✗ Client introuvable : ${slug} (${configPath})`);
    process.exitCode = 1;
    return;
  }
  const c = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const out = path.join(DIST_DIR, slug);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  // Pages générées
  fs.writeFileSync(path.join(out, "index.html"), render.renderIndex(c));
  fs.writeFileSync(path.join(out, "mentions-legales.html"), render.renderLegal(c));
  fs.writeFileSync(path.join(out, "confidentialite.html"), render.renderPrivacy(c));
  fs.writeFileSync(path.join(out, "404.html"), render.render404(c));
  fs.writeFileSync(path.join(out, "robots.txt"), render.renderRobots(c));
  fs.writeFileSync(path.join(out, "sitemap.xml"), render.renderSitemap(c));
  fs.writeFileSync(path.join(out, ".htaccess"), render.renderHtaccess());
  fs.writeFileSync(path.join(out, "favicon.svg"), render.renderFavicon(c));
  fs.writeFileSync(path.join(out, "config.js"), render.renderRuntimeConfig(c));

  // Assets partagés + API
  copyDir(path.join(ROOT, "assets"), path.join(out, "assets"));
  copyDir(path.join(ROOT, "api"), path.join(out, "api"));

  // Images spécifiques au client : clients/<slug>/img/ écrase les placeholders
  const clientImg = path.join(CLIENTS_DIR, slug, "img");
  if (fs.existsSync(clientImg)) copyDir(clientImg, path.join(out, "assets", "img", "client"));

  console.log(`✓ ${slug} -> dist/${slug}/ (${c.demoMode ? "MODE DÉMO" : "MODE LIVE"})`);
}

const arg = process.argv[2];
if (!arg || arg === "--all") {
  const all = fs.readdirSync(CLIENTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory()).map((e) => e.name);
  if (!all.length) { console.error("Aucun client dans clients/."); process.exit(1); }
  all.forEach(buildClient);
} else {
  buildClient(arg);
}
