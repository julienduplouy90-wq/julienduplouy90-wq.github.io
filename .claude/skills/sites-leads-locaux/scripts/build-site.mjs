#!/usr/bin/env node
// Génère un site de leads local en HTML statique (accueil → départements → villes) prêt pour Hostinger.
//
// Usage :
//   node scripts/build-site.mjs --site sites/pompe-a-chaleur.json [--out dist] [--draft]
//   node scripts/build-site.mjs --fleet sites/            (construit tous les *.json du dossier)
//
// Options :
//   --geo <fichier>         données géo (défaut data/geo-fr.json, créé par fetch-geo.mjs)
//   --businesses <dossier>  listings d'entreprises par commune ({insee}.json, créés par fetch-businesses.mjs)
//   --draft                 autorise des mentions légales incomplètes (site en noindex, jamais à publier)
import { readFile, writeFile, mkdir, rm, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { slugify, esc, pick, hash, km, fmtInt, inDept } from "./lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const flag = (k) => argv.includes(k);

const GEO = resolve(opt("--geo", `${here}/../data/geo-fr.json`));
const BUSINESSES = opt("--businesses") ? resolve(opt("--businesses")) : null;
const OUT = resolve(opt("--out", "dist"));
const DRAFT = flag("--draft");

if (!existsSync(GEO)) {
  console.error(`Données géo absentes (${GEO}). Lancez d'abord : node ${here}/fetch-geo.mjs`);
  process.exit(1);
}
const geo = JSON.parse(await readFile(GEO, "utf8"));
const { niches } = JSON.parse(await readFile(`${here}/niches.json`, "utf8"));

const siteFiles = flag("--fleet")
  ? (await readdir(resolve(opt("--fleet")))).filter((f) => f.endsWith(".json")).map((f) => join(resolve(opt("--fleet")), f))
  : [resolve(opt("--site"))];
if (!opt("--site") && !flag("--fleet")) {
  console.error("Indiquez --site <fichier.json> ou --fleet <dossier>.");
  process.exit(1);
}

let failures = 0;
for (const f of siteFiles) {
  try {
    await buildSite(JSON.parse(await readFile(f, "utf8")), f);
  } catch (e) {
    failures++;
    console.error(`✗ ${basename(f)} : ${e.message}`);
  }
}
process.exit(failures ? 1 : 0);

// ---------------------------------------------------------------------------------------------

async function buildSite(site, file) {
  const niche = niches.find((n) => n.slug === site.niche);
  if (!niche) throw new Error(`niche inconnue « ${site.niche} » (voir scripts/niches.json)`);
  if (!site.domain) throw new Error("champ domain manquant");

  const REQUIRED = ["name", "address", "email", "director", "host"];
  const pub = site.publisher ?? {};
  const missing = REQUIRED.filter((k) => !pub[k]).concat(pub.siret || pub.rna ? [] : ["siret"]);
  if (missing.length && !DRAFT)
    throw new Error(`mentions légales incomplètes (${missing.join(", ")}). Complétez publisher ou relancez avec --draft.`);
  const noindex = DRAFT && missing.length > 0;

  const base = `https://${site.domain}`;
  const kw = niche.keyword;
  const kwSlug = slugify(site.urlKeyword ?? kw);
  const brand = site.brand ?? `Devis ${niche.name}`;
  const minPop = site.minPop ?? 5000;
  const deptFilter = site.depts && !site.depts.includes("*") ? new Set(site.depts) : null;
  const hue = site.hue ?? [212, 152, 24, 268, 340, 190, 30, 120][hash(site.domain) % 8];

  // --- Sélection géographique ---------------------------------------------------------------
  const departments = geo.departments.filter((d) => (deptFilter ? deptFilter.has(d.code) : true));
  const deptByCode = new Map(departments.map((d) => [d.code, d]));
  const cities = geo.cities
    .filter((c) => deptByCode.has(c.dept) && c.pop >= minPop)
    .sort((a, b) => b.pop - a.pop);
  if (!cities.length) throw new Error("aucune commune sélectionnée (minPop trop haut ?)");

  const used = new Set();
  for (const c of cities) {
    let s = `${kwSlug}-${c.slug}-${c.cp || c.dept}`;
    if (used.has(s)) s = `${s}-${c.insee}`;
    used.add(s);
    c.path = `/${s}/`;
  }
  for (const d of departments) d.path = `/${kwSlug}-${d.slug}-${d.code.toLowerCase()}/`;

  const byDept = new Map();
  for (const c of cities) (byDept.get(c.dept) ?? byDept.set(c.dept, []).get(c.dept)).push(c);
  const top20 = cities.slice(0, 20);
  // 10 villes les plus proches (grille pour rester rapide sur plusieurs milliers de pages).
  const CELL = 0.25;
  const grid = new Map();
  for (const c of cities) {
    const k = `${Math.floor(c.lon / CELL)}:${Math.floor(c.lat / CELL)}`;
    (grid.get(k) ?? grid.set(k, []).get(k)).push(c);
  }
  function nearest(c, n = 10) {
    const x = Math.floor(c.lon / CELL), y = Math.floor(c.lat / CELL);
    for (let r = 1; r <= 8; r++) {
      const cand = [];
      for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) cand.push(...(grid.get(`${x + dx}:${y + dy}`) ?? []));
      if (cand.length > n + 1 || r === 8)
        return cand.filter((o) => o !== c).map((o) => ({ ...o, d: km(c, o) })).sort((a, b) => a.d - b.d).slice(0, n);
    }
  }

  const dir = join(OUT, site.domain);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const urls = [];
  const write = async (path, html) => {
    const p = join(dir, path, path.endsWith(".html") ? "" : "index.html");
    await mkdir(dirname(p), { recursive: true });
    await writeFile(p, html);
    if (!/^\/(merci|mentions-legales|confidentialite)\//.test(path) && !path.endsWith(".html")) urls.push(path);
  };

  // --- Gabarits --------------------------------------------------------------------------------
  const ctx = { site, niche, brand, base, hue, noindex, kw };

  const services = niche.services;
  const consentTarget = site.consentRecipients ?? "une à trois entreprises partenaires intervenant dans mon secteur";

  const form = (zone, city) => `
<form class="lead" method="post" action="/lead.php" data-lead>
  <p class="lead-title">Votre demande de devis — gratuite et sans engagement</p>
  <label>Votre projet
    <select name="service" required>
      <option value="">Choisir…</option>
      ${services.map((s) => `<option>${esc(s)}</option>`).join("")}
      <option>Autre / je ne sais pas encore</option>
    </select></label>
  <div class="row">
    <label>Code postal<input name="cp" inputmode="numeric" pattern="\\d{5}" maxlength="5" required value="${esc(city?.cp ?? "")}"></label>
    <label>Commune<input name="ville" maxlength="120" required value="${esc(city?.name ?? "")}"></label>
  </div>
  <label>Délai souhaité
    <select name="delai" required>
      <option value="">Choisir…</option><option>Dès que possible</option><option>Dans les 3 mois</option>
      <option>Dans les 6 mois</option><option>Dans l'année</option><option>Simple renseignement</option>
    </select></label>
  <label>Nom<input name="nom" autocomplete="name" maxlength="120" required></label>
  <div class="row">
    <label>Téléphone<input name="tel" type="tel" autocomplete="tel" maxlength="20"></label>
    <label>E-mail<input name="email" type="email" autocomplete="email" maxlength="254"></label>
  </div>
  <label>Votre projet en quelques mots (facultatif)<textarea name="message" rows="3" maxlength="2000"></textarea></label>
  <label class="hp" aria-hidden="true">Site web<input name="website" tabindex="-1" autocomplete="off"></label>
  <input type="hidden" name="started" value="">
  <input type="hidden" name="page" value="">
  <label class="consent"><input type="checkbox" name="consent" value="1" required>
    J'accepte que ma demande et mes coordonnées soient transmises à ${esc(consentTarget)}, afin d'être recontacté(e) au sujet de ce projet uniquement.
    <a href="/confidentialite/">Confidentialité</a></label>
  <button type="submit">Recevoir mon devis ${esc(zone ? zone : "")}</button>
  <p class="small">Téléphone ou e-mail : au moins l'un des deux. Aucun démarchage : seules les entreprises indiquées vous recontactent.</p>
</form>`;

  const linkList = (title, items) =>
    items.length
      ? `<section class="links"><h2>${esc(title)}</h2><ul>${items
          .map((i) => `<li><a href="${i.path}">${esc(i.label ?? i.name)}</a></li>`)
          .join("")}</ul></section>`
      : "";

  const args3 = `
<ul class="args">
  <li><strong>Gratuit et sans engagement</strong><span>Vous décrivez votre projet, vous restez libre de donner suite.</span></li>
  <li><strong>Des professionnels de votre secteur</strong><span>Votre demande est orientée vers une entreprise qui intervient près de chez vous.</span></li>
  <li><strong>Vos données protégées</strong><span>Transmises uniquement avec votre accord, jamais revendues à des centres d'appels.</span></li>
</ul>`;

  const faq = (zone, seed) => {
    const qs = [
      [`Comment obtenir un devis ${kw} ${zone} ?`, `Remplissez le formulaire en haut de page : type de projet, commune et délai. Votre demande est relue puis transmise, avec votre accord, à ${consentTarget}, qui vous recontacte pour établir un devis.`],
      [`Quel est le prix d'un projet de ${kw} ?`, `Il dépend de votre logement, de la solution retenue et des contraintes du chantier. Seul un professionnel qui a étudié votre projet peut vous donner un prix fiable : c'est l'objet du devis, gratuit. Comparer plusieurs devis reste la meilleure façon de juger.`],
      [`La demande de devis est-elle payante ?`, `Non. Le service est gratuit pour vous et ne vous engage à rien.`],
      [`Sous quel délai serai-je recontacté ?`, `Cela dépend de la disponibilité des entreprises de votre secteur. Nous ne promettons pas de délai précis ; si personne ne vous a recontacté, écrivez-nous.`],
      [`Que deviennent mes coordonnées ?`, `Elles ne sont transmises qu'aux entreprises mentionnées dans le formulaire, uniquement pour ce projet. Vous pouvez demander leur suppression à tout moment (voir la page Confidentialité).`],
      [`Les aides financières sont-elles possibles ?`, `Certaines aides publiques existent selon les travaux et votre situation, mais leurs conditions évoluent. Renseignez-vous sur france-renov.gouv.fr et auprès du professionnel qui établit votre devis.`],
    ];
    const rot = hash(seed) % qs.length;
    const list = [...qs.slice(rot), ...qs.slice(0, rot)].slice(0, 5);
    return {
      html: `<section class="faq"><h2>Questions fréquentes</h2>${list.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</section>`,
      ld: { "@type": "FAQPage", mainEntity: list.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    };
  };

  const servicesBlock = (zone) =>
    `<section class="services"><h2>${esc(niche.name)} ${esc(zone)} : les projets les plus demandés</h2><ul>${services
      .map((s) => `<li>${esc(s)}</li>`)
      .join("")}</ul></section>`;

  async function businessesFor(c) {
    if (!BUSINESSES || !c) return [];
    const f = join(BUSINESSES, niche.slug, `${c.insee}.json`);
    if (!existsSync(f)) return [];
    return JSON.parse(await readFile(f, "utf8")).slice(0, site.maxBusinesses ?? 12);
  }
  const businessesBlock = (list, zone) =>
    list.length
      ? `<section class="biz"><h2>Entreprises de ${esc(kw)} ${esc(zone)}</h2>
<p class="small">Annuaire indicatif établi à partir de données publiques (Google Maps). Ces entreprises ne sont pas partenaires de ce site
et ne reçoivent pas nécessairement les demandes envoyées via le formulaire. Une entreprise souhaitant être retirée peut nous écrire.</p>
<ul>${list
          .map(
            (b) =>
              `<li><strong>${esc(b.name)}</strong>${b.address ? `<span>${esc(b.address)}</span>` : ""}${
                b.rating ? `<span>Note Google : ${esc(b.rating)}/5 (${esc(b.reviews ?? 0)} avis)</span>` : ""
              }</li>`,
          )
          .join("")}</ul></section>`
      : "";
  const businessesLd = (list, url) =>
    list.length
      ? {
          "@type": "ItemList",
          name: `Entreprises de ${kw}`,
          url,
          itemListElement: list.map((b, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "LocalBusiness",
              name: b.name,
              ...(b.address ? { address: b.address } : {}),
              ...(b.website ? { url: b.website } : {}),
              ...(b.lat ? { geo: { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lon } } : {}),
            },
          })),
        }
      : null;

  const breadcrumbLd = (items) => ({
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: base + it.path })),
  });

  // --- Accueil ---------------------------------------------------------------------------------
  {
    const f = faq("près de chez vous", site.domain);
    await write("/", page(ctx, {
      path: "/",
      title: `${niche.name} : devis gratuit près de chez vous | ${brand}`,
      description: `Demandez gratuitement un devis ${kw} : votre demande est transmise à une entreprise de votre secteur. ${departments.length} départements couverts.`,
      h1: `${niche.name} : votre devis gratuit, partout ${deptFilter && departments.length === 1 ? inDept(departments[0].code, departments[0].name) : "en France"}`,
      lead: `Décrivez votre projet en deux minutes. Nous l'orientons vers une entreprise de ${kw} qui intervient près de chez vous.`,
      form: form(),
      aside: args3, body: [servicesBlock("près de chez vous"), linkList(`${niche.name} : les grandes villes`, top20), linkList(`${niche.name} par département`, departments.map((d) => ({ path: d.path, label: `${d.name} (${d.code})` }))), f.html].join(""),
      ld: [f.ld, { "@type": "WebSite", name: brand, url: base + "/" }],
    }));
  }

  // --- Départements ----------------------------------------------------------------------------
  for (const d of departments) {
    const own = byDept.get(d.code) ?? [];
    const zone = inDept(d.code, d.name);
    const f = faq(zone, d.code + site.domain);
    const intro = pick([
      `Vous avez un projet de ${kw} ${zone} ? Déposez votre demande : elle est orientée vers une entreprise qui intervient dans votre commune.`,
      `${niche.name} ${zone} : comparez les devis de professionnels de votre secteur, gratuitement et sans engagement.`,
      `Particuliers ${zone}, obtenez un devis ${kw} adapté à votre logement en décrivant votre projet en quelques minutes.`,
    ], d.code + site.domain);
    await write(d.path, page(ctx, {
      path: d.path,
      title: `${niche.name} ${zone} (${d.code}) : devis gratuit | ${brand}`,
      description: `${intro.slice(0, 150)}`,
      h1: `${niche.name} ${zone} (${d.code})`,
      lead: intro,
      form: form(`(${d.code})`),
      crumbs: [{ name: "Accueil", path: "/" }, { name: d.name, path: d.path }],
      aside: args3,
      body: [
        servicesBlock(zone),
        `<section class="local"><h2>Notre couverture ${esc(zone)}</h2><p>Le département ${esc(d.name)} compte environ ${fmtInt(d.pop)} habitants (données INSEE).
Les demandes sont acceptées dans toutes ses communes, y compris celles qui ne sont pas listées ci-dessous.</p></section>`,
        linkList(`${niche.name} : principales villes ${zone}`, own.slice(0, site.deptCityLinks ?? 60)),
        linkList("Départements voisins", d.neighbours.map((c) => deptByCode.get(c)).filter(Boolean).map((n) => ({ path: n.path, label: `${niche.name} ${inDept(n.code, n.name)}` }))),
        linkList(`${niche.name} : les grandes villes de France`, top20),
        f.html,
      ].join(""),
      ld: [f.ld, breadcrumbLd([{ name: "Accueil", path: "/" }, { name: d.name, path: d.path }]), serviceLd(ctx, `${niche.name} ${zone}`, { "@type": "AdministrativeArea", name: d.name })],
    }));
  }

  // --- Villes ----------------------------------------------------------------------------------
  let n = 0;
  for (const c of cities) {
    const d = deptByCode.get(c.dept);
    const zone = `à ${c.name}`;
    const near = nearest(c);
    const biz = await businessesFor(c);
    const f = faq(zone, c.insee + site.domain);
    const seed = c.insee + site.domain;
    const intro = pick([
      `Vous cherchez un professionnel de ${kw} à ${c.name} ? Décrivez votre projet : il est transmis à une entreprise qui intervient à ${c.name} et dans les environs.`,
      `${niche.name} à ${c.name} (${c.cp}) : recevez un devis gratuit d'une entreprise de votre secteur, sans engagement.`,
      `Habitants de ${c.name}, obtenez un devis ${kw} en deux minutes : nous orientons votre demande vers un professionnel local.`,
      `Un projet de ${kw} à ${c.name} ? Gagnez du temps : une seule demande, et une entreprise du secteur vous recontacte.`,
    ], seed);
    const closest = near.slice(0, 3);
    const local = `${c.name} (${c.cp}) compte ${fmtInt(c.pop)} habitants (INSEE) et se situe ${inDept(d.code, d.name)}.
Nous recevons aussi des demandes de ${kw} dans les communes proches : ${closest.map((o) => `${o.name} (${Math.round(o.d)} km)`).join(", ")}.
${pick([
  "Plus votre description est précise (type de logement, surface, contraintes d'accès), plus l'entreprise pourra vous répondre rapidement.",
  "Indiquez vos contraintes dès la demande (accès, calendrier, budget envisagé) : le professionnel pourra préparer un devis pertinent.",
  "Conseil : demandez toujours un devis détaillé et écrit, et vérifiez les assurances et qualifications de l'entreprise retenue.",
], seed + "c")}`;
    const crumbs = [{ name: "Accueil", path: "/" }, { name: d.name, path: d.path }, { name: c.name, path: c.path }];
    await write(c.path, page(ctx, {
      path: c.path,
      title: `${niche.name} à ${c.name} (${c.cp}) : devis gratuit | ${brand}`,
      description: intro.slice(0, 155),
      h1: `${niche.name} à ${c.name}`,
      lead: intro,
      form: form(`à ${c.name}`, c),
      crumbs,
      aside: args3,
      body: [
        servicesBlock(zone),
        `<section class="local"><h2>${esc(niche.name)} à ${esc(c.name)} et alentours</h2><p>${esc(local)}</p></section>`,
        businessesBlock(biz, zone),
        linkList(`${niche.name} à proximité de ${c.name}`, near),
        linkList(`${niche.name} : autres villes ${inDept(d.code, d.name)}`, (byDept.get(c.dept) ?? []).filter((o) => o !== c).slice(0, 20)),
        `<p class="up"><a href="${d.path}">← ${esc(niche.name)} ${esc(inDept(d.code, d.name))}</a></p>`,
        linkList(`${niche.name} : les grandes villes de France`, top20.filter((o) => o !== c)),
        f.html,
      ].join(""),
      ld: [f.ld, breadcrumbLd(crumbs), serviceLd(ctx, `${niche.name} à ${c.name}`, { "@type": "City", name: c.name, address: { "@type": "PostalAddress", postalCode: c.cp, addressLocality: c.name, addressCountry: "FR" } }), businessesLd(biz, base + c.path)].filter(Boolean),
    }));
    n++;
  }

  // --- Pages fixes, PHP, fichiers techniques -------------------------------------------------
  await write("/mentions-legales/", page(ctx, { path: "/mentions-legales/", title: `Mentions légales | ${brand}`, h1: "Mentions légales", body: legalHtml(site, pub, missing), noindexPage: true }));
  await write("/confidentialite/", page(ctx, { path: "/confidentialite/", title: `Confidentialité | ${brand}`, h1: "Politique de confidentialité", body: privacyHtml(site, pub, consentTarget), noindexPage: true }));
  await write("/merci/", page(ctx, { path: "/merci/", title: `Demande envoyée | ${brand}`, h1: "Merci, votre demande est bien envoyée", lead: "Elle va être relue puis transmise à une entreprise de votre secteur, qui vous recontactera au sujet de votre projet.", body: `<p><a href="/">Retour à l'accueil</a></p>`, noindexPage: true }));
  await writeFile(join(dir, "404.html"), page(ctx, { path: "/404", title: `Page introuvable | ${brand}`, h1: "Page introuvable", body: `<p><a href="/">Retour à l'accueil</a></p>`, noindexPage: true }));
  await writeFile(join(dir, "style.css"), css(hue));
  await writeFile(join(dir, "form.js"), formJs());
  await writeFile(join(dir, "lead.php"), leadPhp(site, niche, brand));
  await writeFile(join(dir, ".htaccess"), htaccess(site.domain));
  await writeFile(join(dir, "robots.txt"), noindex ? "User-agent: *\nDisallow: /\n" : `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
  await writeSitemaps(dir, base, urls);

  console.log(`✓ ${site.domain} — niche ${niche.slug} : 1 accueil, ${departments.length} départements, ${n} villes${noindex ? " (BROUILLON noindex)" : ""} → ${dir}`);
}

function serviceLd({ niche, brand, base }, name, areaServed) {
  return { "@type": "Service", name, serviceType: niche.name, areaServed, provider: { "@type": "Organization", name: brand, url: base + "/" } };
}

function page({ site, brand, base, noindex }, { path, title, description, h1, lead, form = "", aside = "", body = "", crumbs, ld = [], noindexPage }) {
  const robots = noindex || noindexPage ? `<meta name="robots" content="noindex,follow">` : "";
  const graph = ld.length ? `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": ld }).replace(/</g, "\\u003c")}</script>` : "";
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>${description ? `<meta name="description" content="${esc(description)}">` : ""}
<link rel="canonical" href="${base}${path === "/404" ? "/" : path}">${robots}
<link rel="stylesheet" href="/style.css">${site.analyticsSnippet ?? ""}${graph}
</head><body>
<header class="top"><a class="brand" href="/">${esc(brand)}</a><a class="cta" href="#devis">Devis gratuit</a></header>
${crumbs ? `<nav class="crumbs" aria-label="Fil d'Ariane">${crumbs.map((c, i) => (i === crumbs.length - 1 ? `<span>${esc(c.name)}</span>` : `<a href="${c.path}">${esc(c.name)}</a>`)).join(" › ")}</nav>` : ""}
<main>
<section class="hero"><div><h1>${esc(h1)}</h1>${lead ? `<p class="sub">${esc(lead)}</p>` : ""}${aside}</div>${form ? `<div id="devis">${form}</div>` : ""}</section>
${body}
</main>
<footer><p>${esc(brand)} — service gratuit de mise en relation entre particuliers et professionnels. Nous ne réalisons pas les travaux.</p>
<p><a href="/mentions-legales/">Mentions légales</a> · <a href="/confidentialite/">Confidentialité</a></p></footer>
<script src="/form.js" defer></script>
</body></html>`;
}

function legalHtml(site, p, missing) {
  const v = (k, label) => `<p><strong>${label} :</strong> ${p[k] ? esc(p[k]) : `<mark>[À COMPLÉTER]</mark>`}</p>`;
  return `<section class="legal">
${missing.length ? `<p><mark>Brouillon : informations manquantes (${missing.join(", ")}). Ne pas publier en l'état.</mark></p>` : ""}
<h2>Éditeur du site</h2>${v("name", "Raison sociale ou nom")}${v("legalForm", "Forme juridique")}${p.rna ? v("rna", "RNA") : v("siret", "SIRET")}${v("address", "Adresse")}${v("email", "Contact")}${v("director", "Directeur de la publication")}
<h2>Hébergeur</h2>${v("host", "Hébergeur")}
<h2>Activité</h2><p>${esc(site.domain)} est un service de mise en relation : il collecte des demandes de devis de particuliers et les transmet, avec leur accord, à des professionnels. L'éditeur peut être rémunéré par ces professionnels. Il ne réalise aucun travaux et n'est pas partie aux contrats conclus.</p>
<h2>Annuaires d'entreprises</h2><p>Les listes d'entreprises affichées proviennent de données publiques. Elles ne constituent ni une recommandation ni un partenariat. Toute entreprise peut demander son retrait à l'adresse ci-dessus.</p>
</section>`;
}

function privacyHtml(site, p, target) {
  return `<section class="legal">
<p><strong>Responsable du traitement :</strong> ${esc(p.name ?? "[À COMPLÉTER]")}, ${esc(p.email ?? "")}</p>
<p><strong>Données collectées :</strong> nom, commune, code postal, téléphone et/ou e-mail, description du projet, date et page d'envoi.</p>
<p><strong>Finalité et base légale :</strong> traiter votre demande de devis et la transmettre à ${esc(target)}, sur la base de votre consentement (case à cocher), que vous pouvez retirer à tout moment.</p>
<p><strong>Destinataires :</strong> l'éditeur et les seules entreprises auxquelles votre demande est transmise. Aucune revente à des tiers ni à des centres d'appels.</p>
<p><strong>Durée de conservation :</strong> ${esc(site.retention ?? "12 mois à compter de la demande, puis suppression")}.</p>
<p><strong>Vos droits :</strong> accès, rectification, effacement, opposition, limitation, en écrivant à ${esc(p.email ?? "[À COMPLÉTER]")}. Vous pouvez saisir la CNIL (cnil.fr).</p>
<p><strong>Cookies :</strong> ce site ne dépose pas de cookie publicitaire${site.analyticsSnippet ? " ; une mesure d'audience est utilisée (voir le bandeau le cas échéant)" : ""}.</p>
<p><strong>Démarchage :</strong> vous pouvez vous inscrire gratuitement sur Bloctel (bloctel.gouv.fr).</p>
</section>`;
}

function css(h) {
  return `:root{--a:hsl(${h} 70% 38%);--a2:hsl(${h} 70% 95%);--t:#1c2430;--m:#5b6573;--b:#e3e7ec;--bg:#fff}
*{box-sizing:border-box}body{margin:0;font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:var(--t);background:var(--bg)}
a{color:var(--a)}main{max-width:1100px;margin:0 auto;padding:0 16px 48px}
.top{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--b);position:sticky;top:0;background:#fff;z-index:5}
.brand{font-weight:700;text-decoration:none;color:var(--t)}.cta{background:var(--a);color:#fff;padding:8px 14px;border-radius:8px;text-decoration:none;font-weight:600}
.crumbs{max-width:1100px;margin:0 auto;padding:10px 16px;font-size:14px;color:var(--m)}
.hero{display:grid;gap:28px;grid-template-columns:1fr;padding:24px 0}@media(min-width:900px){.hero{grid-template-columns:1.1fr .9fr;align-items:start;padding:40px 0}}
h1{font-size:clamp(28px,4vw,42px);line-height:1.15;margin:0 0 12px}.sub{font-size:18px;color:var(--m)}
.lead{background:var(--a2);border:1px solid var(--b);border-radius:14px;padding:18px;display:grid;gap:10px}
.lead-title{font-weight:700;margin:0}.lead label{display:grid;gap:4px;font-size:14px;font-weight:600}
.lead input,.lead select,.lead textarea{font:inherit;padding:10px;border:1px solid #c9d0d8;border-radius:8px;background:#fff;width:100%}
.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.consent{display:flex!important;gap:8px;align-items:flex-start;font-weight:400!important}
.consent input{width:auto;margin-top:4px}.lead button{background:var(--a);color:#fff;border:0;border-radius:10px;padding:14px;font:inherit;font-weight:700;cursor:pointer}
.hp{position:absolute;left:-9999px}.small{font-size:13px;color:var(--m)}
.args{list-style:none;padding:0;margin:24px 0 0;display:grid;gap:12px}
.args li{border:1px solid var(--b);border-radius:12px;padding:14px;display:grid;gap:4px}.args span{color:var(--m);font-size:15px}
section{margin:32px 0}h2{font-size:22px}.services ul{columns:2;padding-left:18px}
.links ul{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:8px}.links a{display:inline-block;padding:6px 10px;border:1px solid var(--b);border-radius:20px;text-decoration:none;font-size:14px}
.biz ul{list-style:none;padding:0;display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}.biz li{border:1px solid var(--b);border-radius:10px;padding:12px;display:grid;gap:2px}.biz span{font-size:14px;color:var(--m)}
details{border-bottom:1px solid var(--b);padding:12px 0}summary{font-weight:600;cursor:pointer}
footer{border-top:1px solid var(--b);padding:24px 16px;text-align:center;font-size:14px;color:var(--m)}mark{background:#fff3b0}
`;
}

function formJs() {
  return `document.querySelectorAll("form[data-lead]").forEach(function(f){
  f.started.value=Date.now();f.page.value=location.pathname;
  f.addEventListener("submit",function(e){if(!f.tel.value.trim()&&!f.email.value.trim()){e.preventDefault();alert("Indiquez un téléphone ou un e-mail.");}});
});`;
}

function htaccess(domain) {
  return `Options -Indexes
ErrorDocument 404 /404.html
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_URI} !/$
RewriteCond %{REQUEST_FILENAME}/ -d
RewriteRule ^(.*)$ /$1/ [L,R=301]
<FilesMatch "\\.(csv|json|log)$">
  Require all denied
</FilesMatch>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 30 days"
  ExpiresByType application/javascript "access plus 30 days"
</IfModule>
`;
}

function leadPhp(site, niche, brand) {
  const cfg = {
    domain: site.domain,
    brand,
    niche: niche.name,
    notify: site.leadEmail ?? site.publisher?.email ?? "",
    webhook: site.leadWebhook ?? "",
  };
  return `<?php
// Réception des demandes de devis — généré par le skill sites-leads-locaux. Ne pas éditer à la main.
declare(strict_types=1);
$CFG = json_decode('${JSON.stringify(cfg).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}', true);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }
$v = fn($k, $max = 200) => mb_substr(trim(strip_tags((string)($_POST[$k] ?? ''))), 0, $max);
$back = fn() => header('Location: /merci/', true, 303);

// Anti-robots : champ piège rempli ou envoi en moins de 4 s => on fait semblant d'accepter.
$started = (int)($_POST['started'] ?? 0);
if ($v('website') !== '' || ($started > 0 && (microtime(true) * 1000 - $started) < 4000)) { $back(); exit; }

$data = [
  'date' => date('c'), 'site' => $CFG['domain'], 'niche' => $CFG['niche'],
  'service' => $v('service'), 'cp' => $v('cp', 5), 'ville' => $v('ville', 120), 'delai' => $v('delai'),
  'nom' => $v('nom', 120), 'tel' => preg_replace('/[^0-9+ ]/', '', $v('tel', 20)), 'email' => $v('email', 254),
  'message' => $v('message', 2000), 'page' => $v('page', 300), 'consent' => ($_POST['consent'] ?? '') === '1' ? 'oui' : 'non',
];
$telOk = preg_match('/^(?:\\+33\\s?|0)[1-9](?:\\s?\\d{2}){4}$/', $data['tel']) === 1;
$mailOk = filter_var($data['email'], FILTER_VALIDATE_EMAIL) !== false;
if (!preg_match('/^\\d{5}$/', $data['cp']) || $data['nom'] === '' || $data['consent'] !== 'oui' || (!$telOk && !$mailOk)) {
  http_response_code(422);
  echo '<!doctype html><meta charset="utf-8"><p>Certaines informations sont manquantes ou invalides (code postal, nom, téléphone ou e-mail, accord de transmission). <a href="javascript:history.back()">Revenir au formulaire</a></p>';
  exit;
}

// Limite : 5 demandes par heure et par adresse IP (hachée, jamais stockée en clair).
$ipHash = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . $CFG['domain']);
$rl = sys_get_temp_dir() . '/lead_' . substr($ipHash, 0, 32);
$hits = array_filter(explode(',', @file_get_contents($rl) ?: ''), fn($t) => (int)$t > time() - 3600);
if (count($hits) >= 5) { http_response_code(429); echo 'Trop de demandes, merci de réessayer plus tard.'; exit; }
$hits[] = time(); @file_put_contents($rl, implode(',', $hits));

// Stockage hors de la racine web si possible (../leads-private), sinon dossier protégé.
$dir = dirname(__DIR__) . '/leads-private';
if (!is_dir($dir) && !@mkdir($dir, 0700, true)) { $dir = __DIR__ . '/_leads'; @mkdir($dir, 0700, true); @file_put_contents("$dir/.htaccess", "Require all denied\\n"); }
$file = "$dir/" . preg_replace('/[^a-z0-9.-]/', '', $CFG['domain']) . '.csv';
$new = !file_exists($file);
$fh = fopen($file, 'a');
if ($fh) { if ($new) fputcsv($fh, array_keys($data)); fputcsv($fh, array_values($data)); fclose($fh); }

if ($CFG['notify'] !== '') {
  $body = '';
  foreach ($data as $k => $val) $body .= ucfirst($k) . ' : ' . $val . "\\n";
  @mail($CFG['notify'], '=?UTF-8?B?' . base64_encode('Nouveau lead ' . $CFG['niche'] . ' — ' . $data['ville']) . '?=', $body,
    "From: leads@{$CFG['domain']}\\r\\nContent-Type: text/plain; charset=UTF-8" . ($mailOk ? "\\r\\nReply-To: {$data['email']}" : ''));
}
if ($CFG['webhook'] !== '' && function_exists('curl_init')) {
  $ch = curl_init($CFG['webhook']);
  curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($data), CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_TIMEOUT => 5, CURLOPT_RETURNTRANSFER => true]);
  curl_exec($ch); curl_close($ch);
}
$back();
`;
}

async function writeSitemaps(dir, base, urls) {
  const today = new Date().toISOString().slice(0, 10);
  const chunk = 40000;
  const files = [];
  for (let i = 0; i < urls.length; i += chunk) {
    const name = `sitemap-${i / chunk + 1}.xml`;
    files.push(name);
    await writeFile(join(dir, name), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.slice(i, i + chunk).map((u) => `<url><loc>${base}${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`);
  }
  await writeFile(join(dir, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files.map((f) => `<sitemap><loc>${base}/${f}</loc><lastmod>${today}</lastmod></sitemap>`).join("\n")}\n</sitemapindex>\n`);
}
