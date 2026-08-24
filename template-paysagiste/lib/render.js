/* =====================================================================
   Générateur de pages : config client -> HTML statique.
   Aucune dépendance. Utilisé par build.js.
   ===================================================================== */
"use strict";

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function telHref(phone) {
  return "tel:" + String(phone || "").replace(/[^+\d]/g, "");
}

/* ---------- Icônes inline (traits fins, aucune image externe) ---------- */
const ICONS = {
  garden: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V9"/><path d="M12 9C12 5 9 3 5 3c0 4 3 6 7 6Z"/><path d="M12 13c0-3 2.5-5 6.5-5 0 3.5-2.5 5-6.5 5Z"/><path d="M5 21h14"/></svg>',
  terrace: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10h18M3 14h18M3 18h18"/><path d="M6 10V6l6-3 6 3v4"/></svg>',
  path: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21c3-6 1-12 3-18M17 21c-3-6-1-12-3-18"/><path d="M6 8h4M14 8h4M5 14h5M14 14h5"/></svg>',
  fence: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V7l2-3 2 3v14M15 21V7l2-3 2 3v14"/><path d="M3 11h18M3 17h18"/></svg>',
  plant: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21v-8"/><path d="M12 13c0-4-3-6-7-6 0 4 3 6 7 6Z"/><path d="M12 10c0-3.5 2.5-5.5 6-5.5 0 3.5-2.5 5.5-6 5.5Z"/><path d="M8 21h8"/></svg>',
  lawn: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21c0-4-1-7-2-8M9 21c0-5 0-9-1-12M13 21c0-4 1-8 2-10M18 21c0-3 1-6 3-7"/></svg>',
  water: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/></svg>',
  maintain: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.5 15.5M14.5 9.5 20 15"/></svg>',
  check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  phone: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/></svg>',
  shield: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>',
  map: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
  medal: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/></svg>',
};
function icon(name) { return ICONS[name] || ICONS.garden; }

/* ---------- Fragments communs ---------- */

function headBlock(c, { title, description, path = "", noindex = false }) {
  const canonical = String(c.domain || "").replace(/\/$/, "") + "/" + path;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${noindex ? '<meta name="robots" content="noindex">' : ""}
  <link rel="canonical" href="${esc(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/template.css">
  <style>:root{--brand:${esc(c.primaryColor || "#1e4230")};--accent:${esc(c.secondaryColor || "#b06f3a")};}</style>
  ${localBusinessSchema(c, noindex)}
</head>
<body>`;
}

function localBusinessSchema(c, skip) {
  // Pas de données structurées en mode démo : on n'envoie jamais à Google
  // des informations d'entreprise fictives présentées comme réelles.
  if (c.demoMode || skip) return "";
  const schema = {
    "@context": "https://schema.org",
    "@type": "LandscapingBusiness",
    name: c.name,
    telephone: c.phone,
    email: c.email,
    url: c.domain,
    address: {
      "@type": "PostalAddress",
      streetAddress: c.address,
      addressLocality: c.city,
      postalCode: c.postalCode,
      addressCountry: "FR",
    },
    areaServed: (c.interventionAreas || []).map((a) => ({ "@type": "City", name: a })),
    makesOffer: (c.services || []).map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.title, description: s.description },
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

function demoBanner(c) {
  if (!c.demoMode) return "";
  return `<div class="demo-banner"><strong>Site de démonstration</strong> — entreprise et contenus fictifs, présentés pour illustrer le rendu final.</div>`;
}

function initials(name) {
  return String(name || "").split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function header(c, { home = true } = {}) {
  const link = (hash) => (home ? hash : "index.html" + hash);
  return `
  <a class="skip-link" href="#main">Aller au contenu</a>
  ${demoBanner(c)}
  <header class="site-header">
    <div class="wrap site-header__inner">
      <a class="brand" href="${home ? "#" : "index.html"}" aria-label="${esc(c.name)} — retour à l'accueil">
        <span class="brand__mark" aria-hidden="true">${esc(initials(c.name))}</span>
        <span>
          <span class="brand__name">${esc(c.name)}</span>
          <span class="brand__tag">${esc(c.tagline)}</span>
        </span>
      </a>
      <nav class="site-nav" aria-label="Navigation principale">
        <a href="${link("#realisations")}">Réalisations</a>
        <a href="${link("#services")}">Services</a>
        <a href="${link("#processus")}">Notre approche</a>
        <a href="${link("#avis")}">Avis</a>
        <a href="${link("#faq")}">Questions</a>
      </nav>
      <a class="header-phone" href="${telHref(c.phone)}">${ICONS.phone} ${esc(c.phone)}</a>
      <a class="btn btn--primary btn--sm header-cta" href="${link("#devis")}" data-track="cta_header">Décrire mon projet</a>
    </div>
  </header>
  <div class="mobile-bar" role="navigation" aria-label="Actions rapides">
    <a class="mobile-bar__call" href="${telHref(c.phone)}" aria-label="Appeler ${esc(c.name)}">${ICONS.phone}</a>
    <a class="mobile-bar__cta" href="${link("#devis")}" data-track="cta_mobile_bar">Demander un devis</a>
  </div>`;
}

function footer(c) {
  const areas = (c.interventionAreas || []).slice(0, 6).map(esc).join(", ");
  return `
  <footer class="site-footer">
    <div class="wrap">
      <div class="site-footer__grid">
        <div>
          <a class="brand" href="#" style="margin-bottom:10px;">
            <span class="brand__mark" aria-hidden="true">${esc(initials(c.name))}</span>
            <span><span class="brand__name">${esc(c.name)}</span></span>
          </a>
          <p class="small" style="max-width:30em;">${esc(c.tagline)} — ${esc(c.city)} et ses environs.</p>
        </div>
        <div>
          <h4>Contact</h4>
          <ul>
            <li><a href="${telHref(c.phone)}">${esc(c.phone)}</a></li>
            <li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>
            <li>${esc(c.city)} (${esc(c.postalCode)})</li>
          </ul>
        </div>
        <div>
          <h4>Le site</h4>
          <ul>
            <li><a href="#realisations">Réalisations</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#devis">Demander un devis</a></li>
          </ul>
        </div>
        <div>
          <h4>Informations</h4>
          <ul>
            <li><a href="mentions-legales.html">Mentions légales</a></li>
            <li><a href="confidentialite.html">Confidentialité</a></li>
          </ul>
        </div>
      </div>
      <p class="site-footer__legal">
        ${c.demoMode ? "Site de démonstration — entreprise fictive, aucune donnée réelle. " : ""}
        Zone d'intervention : ${areas}${(c.interventionAreas || []).length > 6 ? "…" : ""}.
      </p>
    </div>
  </footer>
  <script src="config.js"></script>
  <script src="assets/js/template.js" defer></script>
</body>
</html>`;
}

/* ---------- Sections de la page d'accueil ---------- */

function hero(c) {
  return `
  <section class="hero">
    <div class="hero__media" aria-hidden="true">
      <img src="assets/img/placeholders/hero.svg" alt="" width="1600" height="900" fetchpriority="high">
    </div>
    <div class="wrap">
      <div class="hero__inner">
        <span class="overline">${esc(c.tagline)}</span>
        <h1>Transformons votre extérieur en un lieu qui vous ressemble.</h1>
        <p class="lead">Création de jardins, terrasses et aménagements extérieurs à ${esc(c.city)} et dans les environs. Un travail soigné, des matériaux durables, un interlocuteur unique.</p>
        <div class="hero__ctas">
          <a class="btn btn--primary" href="#devis" data-track="cta_hero">Décrire mon projet</a>
          <a class="btn btn--light" href="#realisations" data-track="cta_hero_projects">Voir nos réalisations</a>
        </div>
        <a class="hero__phone" href="${telHref(c.phone)}">${ICONS.phone}
          <span>${esc(c.phone)} <small>Réponse rapide aux heures ouvrées</small></span>
        </a>
      </div>
    </div>
  </section>`;
}

function trustStrip(c) {
  const items = [];
  if (c.yearsExperience) items.push({ icon: "medal", strong: c.yearsExperience + " ans d'expérience", text: "dans l'aménagement extérieur" });
  if (c.trust && c.trust.insurancePro) items.push({ icon: "shield", strong: "Assurance professionnelle", text: c.trust.decennale ? "et garantie décennale" : "responsabilité civile pro" });
  items.push({ icon: "map", strong: c.city + " et alentours", text: (c.interventionAreas || []).slice(1, 4).join(", ") || "intervention locale" });
  items.push({ icon: "check", strong: "Devis gratuit", text: "étude de votre projet sans engagement" });
  if (c.trust && c.trust.qualipaysage) items.push({ icon: "medal", strong: "Qualipaysage", text: "entreprise qualifiée" });
  if (c.trust && c.trust.unep) items.push({ icon: "medal", strong: "Membre UNEP", text: "Union nationale des entreprises du paysage" });
  return `
  <div class="trust-strip">
    <div class="wrap trust-strip__inner">
      ${items.slice(0, 4).map((i) => `
      <div class="trust-item">${icon(i.icon)}<span><strong>${esc(i.strong)}</strong>${esc(i.text)}</span></div>`).join("")}
    </div>
  </div>`;
}

function projectsSection(c) {
  const cats = c.projectCategories || [{ id: "all", label: "Tout" }];
  return `
  <section class="section" id="realisations" aria-labelledby="realisations-title">
    <div class="wrap">
      <div class="section-head reveal">
        <span class="overline">Réalisations</span>
        <h2 id="realisations-title">Nos aménagements parlent pour nous.</h2>
        <p class="lead">Faites glisser le curseur sur chaque photo pour comparer l'avant et l'après.${c.demoMode ? " (Images d'illustration — les photos des vrais chantiers prendront leur place.)" : ""}</p>
      </div>
      <div class="filters reveal" role="group" aria-label="Filtrer les réalisations">
        ${cats.map((cat, i) => `<button type="button" class="filter" data-filter="${esc(cat.id)}" aria-pressed="${i === 0 ? "true" : "false"}">${esc(cat.label)}</button>`).join("")}
      </div>
      <div class="projects">
        ${(c.projects || []).map((p) => `
        <article class="project reveal" data-category="${esc(p.category)}" data-title="${esc(p.title)}">
          <div class="project__media">
            <div class="ba">
              <div class="ba__after"><img src="${esc(p.afterImage)}" alt="Après travaux — ${esc(p.title)}" loading="lazy" width="800" height="600"></div>
              <div class="ba__before"><img src="${esc(p.beforeImage)}" alt="Avant travaux — ${esc(p.title)}" loading="lazy" width="800" height="600"></div>
              <span class="ba__handle" aria-hidden="true"></span>
              <span class="ba__tag ba__tag--before">Avant</span>
              <span class="ba__tag ba__tag--after">Après</span>
              <input class="ba__range" type="range" min="0" max="100" value="50" aria-label="Comparer avant et après pour ${esc(p.title)}">
            </div>
          </div>
          <div class="project__body">
            <p class="project__meta"><span class="cat">${esc(catLabel(c, p.category))}</span><span>${esc(p.city)}</span>${p.surface ? `<span>${esc(p.surface)}</span>` : ""}</p>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.description)}</p>
          </div>
        </article>`).join("")}
      </div>
    </div>
  </section>`;
}

function catLabel(c, id) {
  const f = (c.projectCategories || []).find((x) => x.id === id);
  return f ? f.label : id;
}

function servicesSection(c) {
  return `
  <section class="section section--tint" id="services" aria-labelledby="services-title">
    <div class="wrap">
      <div class="section-head reveal">
        <span class="overline">Services</span>
        <h2 id="services-title">Tout votre extérieur, un seul interlocuteur.</h2>
        <p class="lead">De la conception aux finitions, nous prenons en charge l'ensemble de votre aménagement.</p>
      </div>
      <div class="services">
        ${(c.services || []).map((s) => `
        <div class="service reveal">
          <span class="service__icon" aria-hidden="true">${icon(s.icon)}</span>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.description)}</p>
        </div>`).join("")}
      </div>
    </div>
  </section>`;
}

function whySection(c) {
  return `
  <section class="section" id="pourquoi" aria-labelledby="pourquoi-title">
    <div class="wrap">
      <div class="section-head reveal">
        <span class="overline">Pourquoi nous</span>
        <h2 id="pourquoi-title">Un chantier bien mené, du premier échange à la dernière finition.</h2>
      </div>
      <div class="why">
        <div class="why-item reveal">${ICONS.check}<div><strong>Une écoute réelle de votre projet</strong><p>Nous partons de vos usages — recevoir, jouer, jardiner, vous détendre — avant de parler matériaux.</p></div></div>
        <div class="why-item reveal">${ICONS.check}<div><strong>Des devis clairs et détaillés</strong><p>Chaque poste est expliqué. Vous savez ce que vous payez, et pourquoi.</p></div></div>
        <div class="why-item reveal">${ICONS.check}<div><strong>Des matériaux et végétaux adaptés</strong><p>Choisis pour votre sol, votre exposition et votre budget — pas pour la photo du catalogue.</p></div></div>
        <div class="why-item reveal">${ICONS.check}<div><strong>Un chantier propre et tenu</strong><p>Dates annoncées, terrain respecté, nettoyage en fin de chantier. Vos voisins ne nous détesteront pas.</p></div></div>
      </div>
    </div>
  </section>`;
}

function processSection(c) {
  return `
  <section class="section section--tint" id="processus" aria-labelledby="processus-title">
    <div class="wrap">
      <div class="section-head reveal">
        <span class="overline">Comment ça se passe</span>
        <h2 id="processus-title">Votre projet, étape par étape.</h2>
      </div>
      <ol class="process reveal">
        <li><strong>Vous décrivez votre projet</strong><p>En quelques minutes, via le formulaire ci-dessous ou par téléphone. Photos bienvenues.</p></li>
        <li><strong>Nous étudions votre demande</strong><p>Type de travaux, terrain, budget : nous vérifions que nous pouvons bien vous répondre.</p></li>
        <li><strong>Nous échangeons, et visitons si nécessaire</strong><p>Un appel pour préciser, puis une visite sur place quand le projet le demande.</p></li>
        <li><strong>Vous recevez votre proposition</strong><p>Un devis détaillé et expliqué, avec un calendrier réaliste.</p></li>
        <li><strong>Nous réalisons votre aménagement</strong><p>Chantier planifié, tenu et livré propre — et nous restons joignables ensuite.</p></li>
      </ol>
    </div>
  </section>`;
}

function quoteSection(c) {
  const f = c.form || {};
  const choiceBtn = (value, extra = "") => `<button type="button" class="choice" data-value="${esc(value)}" aria-pressed="false">${extra}${esc(value)}</button>`;
  return `
  <section class="section" id="devis" aria-labelledby="devis-title">
    <div class="wrap">
      <div class="section-head section-head--center reveal">
        ${c.demoMode ? `<p><span class="demo-note">Démonstration — aucune donnée n'est envoyée ni conservée</span></p>` : ""}
        <span class="overline">Devis gratuit</span>
        <h2 id="devis-title">Décrivez-nous votre projet.</h2>
        <p class="lead">Quelques questions, deux minutes montre en main. Plus votre demande est précise, plus notre première réponse le sera aussi.</p>
      </div>

      <div class="quote-shell reveal" id="quote-form">
        <div class="quote-shell__bar">
          <span class="quote-shell__brand"><span class="dot" aria-hidden="true"></span> ${esc(c.name)}</span>
          <span>Demande de devis</span>
        </div>
        <div class="quote-progress">
          <div class="quote-progress__track"><span class="quote-progress__fill"></span></div>
          <p class="quote-progress__label" aria-live="polite">Étape 1 sur 8</p>
        </div>

        <div class="quote-body">
          <div class="qstep is-active" data-step="projet">
            <p class="qstep__q">Quel est votre projet&nbsp;?</p>
            <p class="qstep__why">Choisissez ce qui s'en rapproche le plus.</p>
            <div class="choice-grid" data-answer="projet">
              ${(f.projectTypes || []).map((t) => `<button type="button" class="choice" data-value="${esc(t.label)}" aria-pressed="false"><span class="choice__emoji" aria-hidden="true">${esc(t.emoji || "")}</span> ${esc(t.label)}</button>`).join("")}
            </div>
            <p class="qerror" role="alert"></p>
          </div>

          <div class="qstep" data-step="lieu">
            <p class="qstep__q">Où se situe votre projet&nbsp;?</p>
            <p class="qstep__why">Pour vérifier que vous êtes bien dans notre zone d'intervention.</p>
            <div class="qfield"><label for="q-ville">Commune</label><input id="q-ville" type="text" autocomplete="address-level2" placeholder="${esc(c.city)}"></div>
            <div class="qfield"><label for="q-cp">Code postal</label><input id="q-cp" type="text" inputmode="numeric" autocomplete="postal-code" placeholder="${esc(c.postalCode)}"></div>
            <p class="qerror" role="alert"></p>
          </div>

          <div class="qstep" data-step="surface">
            <p class="qstep__q">Quelle surface, approximativement&nbsp;?</p>
            <p class="qstep__why">Une estimation suffit — cela nous donne l'échelle du chantier.</p>
            <div class="choice-grid choice-grid--2" data-answer="surface">
              ${(f.surfaceRanges || []).map((v) => choiceBtn(v)).join("")}
            </div>
            <p class="qerror" role="alert"></p>
          </div>

          <div class="qstep" data-step="budget">
            <p class="qstep__q">Quel budget envisagez-vous&nbsp;?</p>
            <p class="qstep__why">Cela nous permet de vous orienter vers une solution cohérente avec votre projet.</p>
            <div class="choice-grid choice-grid--2" data-answer="budget">
              ${(f.budgetRanges || []).map((v) => choiceBtn(v)).join("")}
            </div>
            <p class="qerror" role="alert"></p>
          </div>

          <div class="qstep" data-step="delai">
            <p class="qstep__q">Quand souhaitez-vous commencer&nbsp;?</p>
            <p class="qstep__why">Pour intégrer votre projet dans notre planning de chantiers.</p>
            <div class="choice-grid" data-answer="delai">
              ${(f.timeframes || []).map((v) => choiceBtn(v)).join("")}
            </div>
            <p class="qerror" role="alert"></p>
          </div>

          <div class="qstep" data-step="description">
            <p class="qstep__q">Décrivez-nous votre projet.</p>
            <p class="qstep__why">Vos envies, les contraintes du terrain, ce qui existe déjà… tout est utile.</p>
            <div class="qfield"><label for="q-desc">Votre description</label><textarea id="q-desc" placeholder="Ex. : nous aimerions une terrasse d'environ 30 m² côté sud, avec quelques plantations pour l'ombre…"></textarea></div>
            <p class="qerror" role="alert"></p>
          </div>

          <div class="qstep" data-step="photos">
            <p class="qstep__q">Ajoutez quelques photos</p>
            <p class="qstep__why">Facultatif, mais très utile : l'état actuel du terrain nous aide à préparer un premier avis précis.</p>
            <div class="photo-grid">
              <label class="photo-add" for="q-photos"><span>＋<br>Ajouter<br>une photo</span><input id="q-photos" type="file" accept="image/*" multiple hidden></label>
            </div>
            <p class="photo-note">${c.demoMode ? "Démonstration : vos photos restent dans votre navigateur et ne sont envoyées nulle part." : "Vos photos ne sont utilisées que pour étudier votre demande."}</p>
            <p class="qerror" role="alert"></p>
          </div>

          <div class="qstep" data-step="coordonnees">
            <p class="qstep__q">Vos coordonnées</p>
            <p class="qstep__why">Pour vous répondre — rien d'autre. Pas de démarchage, pas de revente de données.</p>
            <div class="qfield"><label for="q-prenom">Prénom</label><input id="q-prenom" type="text" autocomplete="given-name"></div>
            <div class="qfield"><label for="q-nom">Nom</label><input id="q-nom" type="text" autocomplete="family-name"></div>
            <div class="qfield"><label for="q-tel">Téléphone</label><input id="q-tel" type="tel" autocomplete="tel"></div>
            <div class="qfield"><label for="q-email">Email</label><input id="q-email" type="email" autocomplete="email"></div>
            <p class="qerror" role="alert"></p>
          </div>

          <div class="qstep" data-step="confirmation">
            <div class="quote-done">
              <span class="quote-done__check" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
              <h3>${c.demoMode ? "Voilà — côté client, la demande est partie." : "Merci, votre demande est bien envoyée."}</h3>
              <p>${c.demoMode ? "En mode réel, vous recevriez cette demande immédiatement, avec tous les détails ci-dessous." : "Nous l'étudions et revenons vers vous rapidement. Si votre projet le demande, nous conviendrons d'une visite."}</p>
              <dl class="quote-done__recap">
                <dt>Projet</dt><dd id="recap-projet">—</dd>
                <dt>Lieu</dt><dd id="recap-lieu">—</dd>
                <dt>Surface</dt><dd id="recap-surface">—</dd>
                <dt>Budget</dt><dd id="recap-budget">—</dd>
                <dt>Début</dt><dd id="recap-delai">—</dd>
                <dt>Photos</dt><dd id="recap-photos">—</dd>
              </dl>
              <p><button type="button" class="quote-restart">${c.demoMode ? "Recommencer la démonstration" : "Envoyer une autre demande"}</button></p>
            </div>
          </div>
        </div>

        <div class="quote-nav">
          <button type="button" class="quote-back" hidden>← Retour</button>
          <button type="button" class="btn btn--primary btn--sm quote-next">Continuer</button>
        </div>
      </div>
    </div>
  </section>`;
}

function areasSection(c) {
  return `
  <section class="section section--tint" id="zones" aria-labelledby="zones-title">
    <div class="wrap">
      <div class="section-head reveal">
        <span class="overline">Zone d'intervention</span>
        <h2 id="zones-title">Nous intervenons à ${esc(c.city)} et aux alentours.</h2>
        <p class="lead">Votre commune n'apparaît pas&nbsp;? Demandez-nous — selon le projet, nous élargissons volontiers.</p>
      </div>
      <div class="areas reveal">
        ${(c.interventionAreas || []).map((a) => `<span class="area">${esc(a)}</span>`).join("")}
      </div>
    </div>
  </section>`;
}

function reviewsSection(c) {
  const r = c.reviews || { mode: "empty", items: [] };
  let body;
  if (r.mode === "live" && r.items && r.items.length) {
    body = `<div class="reviews">${r.items.map((it) => `
      <article class="review reveal">
        <p class="review__stars" aria-label="${esc(it.rating)} étoiles sur 5">${"★".repeat(it.rating || 5)}</p>
        <p>${esc(it.text)}</p>
        <footer>${esc(it.author)}</footer>
      </article>`).join("")}</div>`;
  } else if (r.mode === "example" && r.items && r.items.length) {
    body = `<div class="reviews">${r.items.map((it) => `
      <article class="review reveal">
        <span class="review__example-tag">Exemple</span>
        <p class="review__stars" aria-hidden="true">${"★".repeat(it.rating || 5)}</p>
        <p>${esc(it.text)}</p>
        <footer>${esc(it.author)}</footer>
      </article>`).join("")}
      <p class="small muted" style="grid-column:1/-1;margin:4px 0 0;">Cartes d'exemple illustrant l'emplacement — les vrais avis Google du client apparaîtront ici.</p></div>`;
  } else {
    body = `<div class="reviews-empty reveal"><p style="margin:0;">Vos avis clients apparaîtront ici.</p></div>`;
  }
  const cta = c.googleBusinessUrl
    ? `<p style="margin-top:22px;"><a class="btn btn--ghost btn--sm" href="${esc(c.googleBusinessUrl)}" rel="noopener" target="_blank">Voir tous nos avis Google</a></p>` : "";
  return `
  <section class="section" id="avis" aria-labelledby="avis-title">
    <div class="wrap">
      <div class="section-head reveal">
        <span class="overline">Avis clients</span>
        <h2 id="avis-title">Ce que nos clients retiennent.</h2>
      </div>
      ${body}
      ${cta}
    </div>
  </section>`;
}

function faqSection(c) {
  return `
  <section class="section section--tint" id="faq" aria-labelledby="faq-title">
    <div class="wrap">
      <div class="section-head section-head--center reveal">
        <span class="overline">Questions fréquentes</span>
        <h2 id="faq-title">Vous vous posez sûrement ces questions.</h2>
      </div>
      <div class="faq reveal">
        ${(c.faq || []).map((f) => `
        <details>
          <summary>${esc(f.q)}</summary>
          <div class="faq__a"><p>${esc(f.a)}</p></div>
        </details>`).join("")}
      </div>
    </div>
  </section>`;
}

function finalCta(c) {
  return `
  <section class="section section--dark final-cta" id="contact" aria-labelledby="contact-title">
    <div class="wrap">
      <h2 id="contact-title" class="reveal">Et si on parlait de votre projet&nbsp;?</h2>
      <p class="lead reveal">Décrivez-le en deux minutes, ou appelez-nous directement — nous vous dirons simplement ce qui est possible.</p>
      <div class="final-cta__actions reveal">
        <a class="btn btn--light" href="#devis" data-track="cta_final">Décrire mon projet</a>
        <a class="btn btn--ghost" style="color:#fff;border-color:rgba(255,255,255,0.35);" href="${telHref(c.phone)}">${ICONS.phone} ${esc(c.phone)}</a>
      </div>
    </div>
  </section>`;
}

/* ---------- Pages ---------- */

function renderIndex(c) {
  const title = `Paysagiste à ${c.city} | ${c.name}`;
  const description = `${c.name} — ${(c.tagline || "").toLowerCase()} à ${c.city} : jardins, terrasses, clôtures, allées, plantations. Devis gratuit et détaillé.`;
  return [
    headBlock(c, { title, description, noindex: !!c.demoMode }),
    header(c),
    '<main id="main">',
    hero(c),
    trustStrip(c),
    projectsSection(c),
    servicesSection(c),
    whySection(c),
    processSection(c),
    quoteSection(c),
    areasSection(c),
    reviewsSection(c),
    faqSection(c),
    finalCta(c),
    "</main>",
    footer(c),
  ].join("\n");
}

function legalShell(c, title, inner) {
  return [
    headBlock(c, { title: `${title} | ${c.name}`, description: title, path: "", noindex: true }),
    header(c, { home: false }),
    `<main class="legal-page">${inner}</main>`,
    footer(c),
  ].join("\n");
}

function renderLegal(c) {
  const L = c.legal || {};
  const todo = (v, label) => (String(v).startsWith("TODO") ? `<em>[${label} — à compléter]</em>` : esc(v));
  return legalShell(c, "Mentions légales", `
    <h1>Mentions légales</h1>
    ${c.demoMode ? '<p class="todo"><strong>Site de démonstration.</strong> Les informations ci-dessous sont volontairement incomplètes : elles seront renseignées avec les données réelles du client à la mise en ligne.</p>' : ""}
    <h2>Éditeur du site</h2>
    <p>${esc(c.legalName || c.name)}<br>
    Statut juridique : ${todo(L.status, "statut")}<br>
    SIRET : ${todo(L.siret, "SIRET")}<br>
    Adresse : ${esc(c.address)}, ${esc(c.postalCode)} ${esc(c.city)}<br>
    Téléphone : ${esc(c.phone)}<br>
    Email : ${esc(c.email)}</p>
    <h2>Directeur de la publication</h2>
    <p>${todo(L.director, "directeur de la publication")}</p>
    <h2>Hébergement</h2>
    <p>${todo(L.hostName, "hébergeur")}<br>${todo(L.hostAddress, "adresse de l'hébergeur")}</p>
    <h2>Propriété intellectuelle</h2>
    <p>L'ensemble des contenus de ce site (textes, photographies, éléments graphiques) est protégé par le droit de la propriété intellectuelle. Toute reproduction sans autorisation préalable est interdite.</p>
    <h2>Données personnelles</h2>
    <p>Voir la <a href="confidentialite.html">politique de confidentialité</a>.</p>`);
}

function renderPrivacy(c) {
  return legalShell(c, "Politique de confidentialité", `
    <h1>Politique de confidentialité</h1>
    ${c.demoMode ? '<p class="todo"><strong>Site de démonstration.</strong> Le formulaire ne transmet et ne conserve aucune donnée : tout reste dans votre navigateur.</p>' : ""}
    <h2>Données collectées par le formulaire de devis</h2>
    <p>${c.demoMode
      ? "Sur cette démonstration, aucune donnée n'est transmise ni conservée."
      : `Les informations saisies dans le formulaire (identité, coordonnées, description du projet, photos) sont transmises uniquement à ${esc(c.name)} pour étudier votre demande de devis et vous répondre. Elles ne sont ni revendues ni transmises à des tiers à des fins commerciales.`}</p>
    <h2>Durée de conservation</h2>
    <p>${c.demoMode ? "Sans objet en démonstration." : "Les demandes sont conservées le temps du traitement commercial, puis archivées ou supprimées. <!-- TODO: préciser la durée exacte retenue par le client -->"}</p>
    <h2>Cookies et mesure d'audience</h2>
    <p>Ce site ne dépose pas de cookies et n'utilise aucun outil de mesure d'audience nécessitant un consentement. Les polices de caractères sont chargées depuis Google Fonts (requête technique vers les serveurs de Google).</p>
    <h2>Vos droits</h2>
    <p>Conformément au RGPD, vous disposez de droits d'accès, de rectification et de suppression des données vous concernant. Contact : <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>.</p>`);
}

function render404(c) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page introuvable | ${esc(c.name)}</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
:root{--brand:${esc(c.primaryColor || "#1e4230")};}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:32px 20px;background:#f7f5ef;color:#1d2622;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.65;text-align:center}
.mark{width:52px;height:52px;border-radius:14px;background:var(--brand);display:grid;place-items:center;margin:0 auto 24px;color:#fff;font-weight:700;font-size:1.2rem}
h1{font-family:Georgia,serif;font-weight:600;font-size:clamp(1.6rem,5vw,2.2rem);margin:0 0 12px}
p{color:#57635c;margin:0 0 26px}
a.btn{display:inline-block;background:var(--brand);color:#fff;text-decoration:none;border-radius:999px;padding:14px 26px;font-weight:600}
</style>
</head>
<body><div>
<div class="mark">${esc(initials(c.name))}</div>
<h1>Cette page n'existe pas.</h1>
<p>Le lien suivi est peut-être ancien, ou l'adresse comporte une erreur.</p>
<a class="btn" href="/">Retour à l'accueil</a>
</div></body></html>`;
}

function renderRobots(c) {
  const base = String(c.domain || "").replace(/\/$/, "");
  if (c.demoMode) {
    return `# Site de démonstration : non indexé.\nUser-agent: *\nDisallow: /\n`;
  }
  return `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`;
}

function renderSitemap(c) {
  const base = String(c.domain || "").replace(/\/$/, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${esc(base)}/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>
</urlset>\n`;
}

function renderHtaccess() {
  return `ErrorDocument 404 /404.html
Options -Indexes
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on
  RewriteCond %{HTTP:X-Forwarded-Proto} !https
  RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]
  RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
  RewriteRule ^(.*)$ https://%1/$1 [R=301,L]
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME}\\.html -f
  RewriteRule ^(.+?)/?$ $1.html [L]
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css text/xml application/javascript application/json image/svg+xml
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 6 months"
  ExpiresByType image/jpeg "access plus 6 months"
  ExpiresByType image/png "access plus 6 months"
  ExpiresByType image/webp "access plus 6 months"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
AddDefaultCharset UTF-8
`;
}

function renderFavicon(c) {
  const letters = initials(c.name);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="${esc(c.primaryColor || "#1e4230")}"/>
<text x="32" y="42" font-family="Georgia, serif" font-size="26" font-weight="700" fill="#f6f4ee" text-anchor="middle">${esc(letters)}</text>
</svg>\n`;
}

/* config.js embarqué : uniquement ce dont le runtime a besoin */
function renderRuntimeConfig(c) {
  const runtime = {
    slug: c.slug,
    demoMode: !!c.demoMode,
    name: c.name,
    phone: c.phone,
    email: c.email,
    integrations: c.integrations || {},
    debugAnalytics: false,
  };
  return "window.CLIENT_CONFIG = " + JSON.stringify(runtime, null, 2) + ";\n";
}

module.exports = {
  renderIndex, renderLegal, renderPrivacy, render404,
  renderRobots, renderSitemap, renderHtaccess, renderFavicon, renderRuntimeConfig,
};
