/* Simulateur de prix paysagiste — version statique « sans serveur ».
   - Sans configuration dans l'URL : écran de configuration (le paysagiste
     règle ses tarifs et obtient SON lien unique — toute sa config est
     encodée dans le lien, aucune base de données).
   - Avec configuration (#c=...) : simulateur white-label pour le
     particulier ; la demande part par EMAIL vers le paysagiste.
   Le calcul est 100 % déterministe : quantité × fourchette × coefficients. */

"use strict";

/* ============================================================
   Catalogue des types de projets (questions + coefficients)
   ============================================================ */
const CATALOGUE = [
  {
    id: "terrasse", libelle: "Terrasse", emoji: "🪵",
    description: "Bois, composite, pierre…", unite: "m²", base: { min: 80, max: 160 },
    questions: [
      { id: "surface", type: "nombre", libelle: "Surface approximative", unite: "m²", min: 5, max: 200, defaut: 20 },
      { id: "materiau", type: "choix", libelle: "Matériau souhaité", options: [
        { id: "bois", libelle: "Bois", coef: 1 },
        { id: "composite", libelle: "Composite", coef: 1.15 },
        { id: "pierre", libelle: "Pierre naturelle", coef: 1.35 },
        { id: "carrelage", libelle: "Carrelage", coef: 1.25 },
        { id: "nsp", libelle: "Je ne sais pas encore", coef: 1 },
      ]},
      { id: "terrain", type: "choix", libelle: "Votre terrain", options: [
        { id: "plat", libelle: "Plat", coef: 1 },
        { id: "leger", libelle: "Légèrement pentu", coef: 1.1 },
        { id: "fort", libelle: "Fortement pentu", coef: 1.25 },
      ]},
      { id: "acces", type: "choix", libelle: "Accès au chantier", options: [
        { id: "facile", libelle: "Facile", coef: 1 },
        { id: "moyen", libelle: "Moyen", coef: 1.1 },
        { id: "difficile", libelle: "Difficile", coef: 1.2 },
      ]},
    ],
  },
  {
    id: "cloture", libelle: "Clôture", emoji: "🚧",
    description: "Rigide, grillage, bois…", unite: "ml", base: { min: 70, max: 120 },
    questions: [
      { id: "longueur", type: "nombre", libelle: "Longueur approximative", unite: "ml", min: 5, max: 300, defaut: 30 },
      { id: "type", type: "choix", libelle: "Type de clôture", options: [
        { id: "rigide", libelle: "Panneaux rigides", coef: 1 },
        { id: "souple", libelle: "Grillage souple", coef: 0.5 },
        { id: "bois", libelle: "Bois / claustra", coef: 1.2 },
        { id: "alu", libelle: "Composite / alu", coef: 1.5 },
        { id: "nsp", libelle: "Je ne sais pas encore", coef: 1 },
      ]},
      { id: "hauteur", type: "choix", libelle: "Hauteur souhaitée", options: [
        { id: "h120", libelle: "≈ 1,20 m", coef: 0.9 },
        { id: "h150", libelle: "≈ 1,50 m", coef: 1 },
        { id: "h180", libelle: "≈ 1,80 m", coef: 1.15 },
        { id: "h200", libelle: "2 m et +", coef: 1.3 },
      ]},
      { id: "depose", type: "choix", libelle: "Clôture existante à déposer ?", options: [
        { id: "non", libelle: "Non", coef: 1 },
        { id: "oui", libelle: "Oui", coef: 1.15 },
      ]},
      { id: "acces", type: "choix", libelle: "Accès au chantier", options: [
        { id: "facile", libelle: "Facile", coef: 1 },
        { id: "moyen", libelle: "Moyen", coef: 1.1 },
        { id: "difficile", libelle: "Difficile", coef: 1.2 },
      ]},
    ],
  },
  {
    id: "allee", libelle: "Allée / cour", emoji: "🛤️",
    description: "Pavés, gravier, enrobé…", unite: "m²", base: { min: 40, max: 90 },
    questions: [
      { id: "surface", type: "nombre", libelle: "Surface approximative", unite: "m²", min: 5, max: 500, defaut: 50 },
      { id: "revetement", type: "choix", libelle: "Revêtement souhaité", options: [
        { id: "paves", libelle: "Pavés", coef: 1 },
        { id: "gravier", libelle: "Gravier stabilisé", coef: 0.55 },
        { id: "beton", libelle: "Béton / décoratif", coef: 0.9 },
        { id: "enrobe", libelle: "Enrobé", coef: 0.8 },
        { id: "nsp", libelle: "Je ne sais pas encore", coef: 1 },
      ]},
      { id: "acces", type: "choix", libelle: "Accès au chantier", options: [
        { id: "facile", libelle: "Facile", coef: 1 },
        { id: "moyen", libelle: "Moyen", coef: 1.1 },
        { id: "difficile", libelle: "Difficile", coef: 1.2 },
      ]},
    ],
  },
  {
    id: "engazonnement", libelle: "Engazonnement", emoji: "🌱",
    description: "Semis, plaque, synthétique…", unite: "m²", base: { min: 15, max: 25 },
    questions: [
      { id: "surface", type: "nombre", libelle: "Surface approximative", unite: "m²", min: 10, max: 2000, defaut: 100 },
      { id: "type", type: "choix", libelle: "Type de gazon", options: [
        { id: "plaque", libelle: "En plaque (immédiat)", coef: 1 },
        { id: "semis", libelle: "Semis (économique)", coef: 0.35 },
        { id: "synthetique", libelle: "Synthétique", coef: 3 },
        { id: "nsp", libelle: "Je ne sais pas encore", coef: 1 },
      ]},
      { id: "preparation", type: "choix", libelle: "État actuel du terrain", options: [
        { id: "pret", libelle: "Déjà préparé", coef: 1 },
        { id: "moyen", libelle: "À nettoyer / niveler", coef: 1.2 },
        { id: "complet", libelle: "Tout à refaire", coef: 1.4 },
      ]},
    ],
  },
  {
    id: "plantation", libelle: "Plantation / massif", emoji: "🌸",
    description: "Massifs, haies, arbres…", unite: "m²", base: { min: 30, max: 70 },
    questions: [
      { id: "surface", type: "nombre", libelle: "Surface à planter", unite: "m²", min: 2, max: 500, defaut: 20 },
      { id: "densite", type: "choix", libelle: "Style souhaité", options: [
        { id: "epure", libelle: "Épuré", coef: 0.8 },
        { id: "classique", libelle: "Classique", coef: 1 },
        { id: "dense", libelle: "Dense / luxuriant", coef: 1.35 },
      ]},
      { id: "paillage", type: "choix", libelle: "Paillage / finition", options: [
        { id: "non", libelle: "Sans", coef: 1 },
        { id: "oui", libelle: "Avec paillage", coef: 1.15 },
      ]},
    ],
  },
  {
    id: "amenagement", libelle: "Aménagement complet", emoji: "🏡",
    description: "Création ou refonte du jardin", unite: "m²", base: { min: 40, max: 90 },
    questions: [
      { id: "surface", type: "nombre", libelle: "Surface du jardin", unite: "m²", min: 20, max: 5000, defaut: 300 },
      { id: "niveau", type: "choix", libelle: "Niveau de prestation", options: [
        { id: "essentiel", libelle: "Essentiel", coef: 0.7 },
        { id: "confort", libelle: "Confort", coef: 1 },
        { id: "hdg", libelle: "Haut de gamme", coef: 1.6 },
      ]},
      { id: "etat", type: "choix", libelle: "État actuel", options: [
        { id: "neuf", libelle: "Terrain nu", coef: 1 },
        { id: "refonte", libelle: "Jardin à transformer", coef: 1.15 },
      ]},
    ],
  },
  {
    id: "arrosage", libelle: "Arrosage automatique", emoji: "💧",
    description: "Enterré ou goutte-à-goutte", unite: "m²", base: { min: 8, max: 15 },
    questions: [
      { id: "surface", type: "nombre", libelle: "Surface à arroser", unite: "m²", min: 20, max: 3000, defaut: 200 },
      { id: "type", type: "choix", libelle: "Type d'arrosage", options: [
        { id: "enterre", libelle: "Enterré (pelouse)", coef: 1 },
        { id: "goutte", libelle: "Goutte-à-goutte", coef: 0.7 },
        { id: "mixte", libelle: "Les deux", coef: 1.2 },
      ]},
    ],
  },
  {
    id: "autre", libelle: "Autre projet", emoji: "✏️",
    description: "Décrivez-nous votre idée", unite: null, base: null, questions: [],
  },
];

const DELAIS = [
  ["des-que-possible", "Dès que possible"],
  ["1-3-mois", "Dans 1 à 3 mois"],
  ["3-6-mois", "Dans 3 à 6 mois"],
  ["plus-tard", "Plus tard / je me renseigne"],
];

/* ============================================================
   Moteur d'estimation (déterministe)
   ============================================================ */
function estimer(type, reponses, baseEntreprise) {
  if (!type.base) return null;
  const base = baseEntreprise ?? type.base;
  const qNombre = type.questions.find((q) => q.type === "nombre");
  const quantite = Number(reponses[qNombre.id]);
  if (!Number.isFinite(quantite) || quantite <= 0) return null;

  let coef = 1;
  const facteurs = [];
  for (const q of type.questions) {
    if (q.type !== "choix") continue;
    const option = q.options.find((o) => o.id === reponses[q.id]);
    if (!option) continue;
    coef *= option.coef;
    if (option.coef !== 1) facteurs.push(option.libelle.toLowerCase());
  }
  const arrondir = (m) => { const pas = m < 1000 ? 10 : 100; return Math.round(m / pas) * pas; };
  return { min: arrondir(quantite * base.min * coef), max: arrondir(quantite * base.max * coef), facteurs };
}

/* ============================================================
   Helpers
   ============================================================ */
const euros = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
function esc(t) { const d = document.createElement("div"); d.textContent = String(t ?? ""); return d.innerHTML; }

// Config ↔ lien : JSON → UTF-8 → base64 (dans le hash, jamais envoyé au serveur)
function encoderConfig(config) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(config))));
}
function decoderConfig(chaine) {
  try {
    const octets = Uint8Array.from(atob(chaine), (c) => c.charCodeAt(0));
    const config = JSON.parse(new TextDecoder().decode(octets));
    return config && config.email ? config : null;
  } catch { return null; }
}

const app = document.getElementById("app");

/* ============================================================
   Aiguillage : configurateur ou simulateur
   ============================================================ */
function demarrer() {
  const h = location.hash.match(/^#c=(.+)$/);
  const config = h ? decoderConfig(h[1]) : null;
  if (config) vueSimulateur(config);
  else vueConfigurateur();
}
window.addEventListener("hashchange", demarrer);

/* ============================================================
   ÉCRAN PAYSAGISTE : configuration → lien unique
   ============================================================ */
function vueConfigurateur() {
  document.documentElement.style.setProperty("--marque", "#166534");
  app.innerHTML = `
    <h1>🌿 Créez votre simulateur de prix</h1>
    <p class="sous-titre">Réglez vos tarifs, obtenez votre lien : vos visiteurs
      estiment leur projet et leur demande arrive directement dans votre boîte mail.</p>

    <section class="carte">
      <h2>Votre entreprise</h2>
      <label><span class="etiquette">Nom de l'entreprise *</span>
        <input type="text" id="cfg-nom" placeholder="Ex : Au Jardin Vert"></label>
      <label><span class="etiquette">Email où recevoir les demandes *</span>
        <input type="email" id="cfg-email" placeholder="contact@monentreprise.fr"></label>
      <label><span class="etiquette">Téléphone (affiché aux visiteurs)</span>
        <input type="tel" id="cfg-tel" placeholder="06 12 34 56 78"></label>
      <label><span class="etiquette">Zone d'intervention</span>
        <input type="text" id="cfg-zone" placeholder="Ex : Pau et 30 km alentour"></label>
      <label><span class="etiquette">Couleur principale</span>
        <input type="color" id="cfg-couleur" value="#166534" style="width:80px;height:44px;padding:4px"></label>
    </section>

    <section class="carte">
      <h2>Vos prestations et tarifs</h2>
      <p class="info">Activez vos types de projets et ajustez la fourchette de prix
        par unité (HT, pose comprise). Les valeurs proposées sont des moyennes France.</p>
      <div id="cfg-types">
        ${CATALOGUE.map((t) => `
          <div class="interrupteur">
            <input type="checkbox" id="actif-${t.id}" ${["terrasse","cloture","engazonnement"].includes(t.id) ? "checked" : ""}>
            <div class="grandir">
              <label for="actif-${t.id}" style="margin:0;font-weight:600">${t.emoji} ${t.libelle}</label>
              ${t.base ? `
                <div class="ligne-prix">
                  de <input type="number" min="0" step="0.5" id="min-${t.id}" value="${t.base.min}">
                  à <input type="number" min="0" step="0.5" id="max-${t.id}" value="${t.base.max}">
                  <span class="info">€ / ${t.unite}</span>
                </div>` : `<span class="info">Demande libre (le visiteur décrit son projet)</span>`}
            </div>
          </div>`).join("")}
      </div>
    </section>

    <div id="zone-erreur"></div>
    <button class="bouton" id="btn-generer">Générer mon lien 🚀</button>
    <div id="zone-resultat"></div>
    <p class="pied">Propulsé par Paysage Digital</p>
  `;

  document.getElementById("btn-generer").addEventListener("click", () => {
    const nom = document.getElementById("cfg-nom").value.trim();
    const email = document.getElementById("cfg-email").value.trim();
    const zoneErreur = document.getElementById("zone-erreur");
    zoneErreur.innerHTML = "";

    if (!nom) return zoneErreur.innerHTML = `<p class="erreur">Indiquez le nom de votre entreprise.</p>`;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return zoneErreur.innerHTML = `<p class="erreur">Indiquez un email valide : c'est là que les demandes arriveront.</p>`;

    const types = {};
    for (const t of CATALOGUE) {
      if (!document.getElementById(`actif-${t.id}`).checked) continue;
      if (t.base) {
        const min = Number(document.getElementById(`min-${t.id}`).value);
        const max = Number(document.getElementById(`max-${t.id}`).value);
        if (!(min > 0) || !(max >= min))
          return zoneErreur.innerHTML = `<p class="erreur">Fourchette invalide pour « ${t.libelle} » (min > 0 et max ≥ min).</p>`;
        types[t.id] = { min, max };
      } else {
        types[t.id] = true;
      }
    }
    if (Object.keys(types).length === 0)
      return zoneErreur.innerHTML = `<p class="erreur">Activez au moins un type de projet.</p>`;

    const config = {
      v: 1, nom, email,
      tel: document.getElementById("cfg-tel").value.trim(),
      zone: document.getElementById("cfg-zone").value.trim(),
      couleur: document.getElementById("cfg-couleur").value,
      types,
    };
    const lien = `${location.origin}${location.pathname}#c=${encoderConfig(config)}`;
    const iframe = `<iframe src="${lien}" style="width:100%;min-height:700px;border:0;border-radius:12px" title="Estimer mon projet" loading="lazy"></iframe>`;

    document.getElementById("zone-resultat").innerHTML = `
      <section class="carte" style="border-color:var(--marque)">
        <h2>✅ Votre simulateur est prêt !</h2>
        <p class="info"><strong>Votre lien unique</strong> (gardez-le précieusement — il contient toute votre configuration) :</p>
        <div class="bloc-code">${esc(lien)}</div>
        <a class="bouton" href="${esc(lien)}" target="_blank">▶ Tester mon simulateur</a>
        <button class="bouton bouton-secondaire" id="btn-copier-lien">Copier le lien</button>
        <p class="info" style="margin-top:16px"><strong>Pour l'intégrer sur votre site</strong>
          (WordPress : bloc HTML personnalisé · Wix/Hostinger : élément « Code d'intégration » · Webflow : Embed) :</p>
        <div class="bloc-code">${esc(iframe)}</div>
        <button class="bouton bouton-secondaire" id="btn-copier-iframe">Copier le code</button>
      </section>`;
    document.getElementById("btn-copier-lien").addEventListener("click", (e) =>
      copier(lien, e.target, "Copier le lien"));
    document.getElementById("btn-copier-iframe").addEventListener("click", (e) =>
      copier(iframe, e.target, "Copier le code"));
    document.getElementById("zone-resultat").scrollIntoView({ behavior: "smooth" });
  });
}

async function copier(texte, bouton, libelle) {
  try {
    await navigator.clipboard.writeText(texte);
    bouton.textContent = "✓ Copié !";
    setTimeout(() => (bouton.textContent = libelle), 2000);
  } catch { /* presse-papier indisponible */ }
}

/* ============================================================
   ÉCRAN PARTICULIER : le simulateur white-label
   ============================================================ */
function vueSimulateur(config) {
  document.documentElement.style.setProperty("--marque",
    /^#[0-9a-fA-F]{6}$/.test(config.couleur) ? config.couleur : "#166534");

  const typesActifs = CATALOGUE.filter((t) => config.types[t.id]);
  const etat = { ecran: "type", type: null, reponses: {}, estimation: null };

  const entete = `
    <div class="entete-marque">
      <span style="font-size:26px">🌿</span>
      <div>
        <div class="nom">${esc(config.nom)}</div>
        ${config.zone ? `<div class="zone">${esc(config.zone)}</div>` : ""}
      </div>
    </div>`;
  const pied = `<p class="pied">Propulsé par Paysage Digital</p>`;
  const avertissement = `
    <div class="avertissement">Cette estimation est indicative et ne constitue pas
    un devis. Une visite ou une étude du projet peut être nécessaire pour établir
    le tarif définitif.</div>`;

  function dessiner() {
    if (etat.ecran === "type") {
      app.innerHTML = `${entete}
        <h1>Quel projet souhaitez-vous réaliser ?</h1>
        <p class="sous-titre">Obtenez une estimation de budget en 2 minutes.</p>
        <div class="grille-types">
          ${typesActifs.map((t) => `
            <button class="carte-type" data-type="${t.id}">
              <span class="emoji">${t.emoji}</span>
              <span class="titre">${t.libelle}</span>
              <span class="desc">${t.description}</span>
            </button>`).join("")}
        </div>${pied}`;
      app.querySelectorAll(".carte-type").forEach((b) =>
        b.addEventListener("click", () => {
          etat.type = CATALOGUE.find((t) => t.id === b.dataset.type);
          etat.reponses = {};
          for (const q of etat.type.questions) if (q.type === "nombre") etat.reponses[q.id] = q.defaut;
          etat.ecran = etat.type.questions.length ? "questions" : "coordonnees";
          dessiner();
        }));

    } else if (etat.ecran === "questions") {
      const t = etat.type;
      app.innerHTML = `${entete}
        <button class="lien-retour" id="btn-retour">← Retour</button>
        <h1>${t.emoji} ${t.libelle}</h1>
        <div style="margin-top:16px">
          ${t.questions.map((q) => q.type === "nombre" ? `
            <div class="question">
              <span class="libelle">${q.libelle}</span>
              <div class="rangee-nombre">
                <input type="range" min="${q.min}" max="${q.max}" value="${etat.reponses[q.id]}" data-q="${q.id}" data-role="curseur">
                <input type="number" min="${q.min}" max="${q.max}" value="${etat.reponses[q.id]}" data-q="${q.id}" data-role="nombre">
                <span class="info">${q.unite}</span>
              </div>
            </div>` : `
            <div class="question">
              <span class="libelle">${q.libelle}</span>
              <div class="grille-options">
                ${q.options.map((o) => `
                  <button class="option ${etat.reponses[q.id] === o.id ? "choisie" : ""}"
                          data-q="${q.id}" data-o="${o.id}">${o.libelle}</button>`).join("")}
              </div>
            </div>`).join("")}
        </div>
        <div id="zone-erreur"></div>
        <button class="bouton" id="btn-continuer">Voir mon estimation →</button>${pied}`;

      document.getElementById("btn-retour").addEventListener("click", () => { etat.ecran = "type"; dessiner(); });
      // Curseur et champ nombre synchronisés
      app.querySelectorAll('[data-role="curseur"], [data-role="nombre"]').forEach((champ) =>
        champ.addEventListener("input", () => {
          etat.reponses[champ.dataset.q] = Number(champ.value);
          app.querySelectorAll(`[data-q="${champ.dataset.q}"]`).forEach((autre) => {
            if (autre !== champ) autre.value = champ.value;
          });
        }));
      app.querySelectorAll(".option").forEach((b) =>
        b.addEventListener("click", () => {
          etat.reponses[b.dataset.q] = b.dataset.o;
          app.querySelectorAll(`.option[data-q="${b.dataset.q}"]`).forEach((x) => x.classList.remove("choisie"));
          b.classList.add("choisie");
        }));
      document.getElementById("btn-continuer").addEventListener("click", () => {
        for (const q of t.questions) {
          if (q.type === "choix" && !etat.reponses[q.id]) {
            document.getElementById("zone-erreur").innerHTML =
              `<p class="erreur">Merci de répondre à toutes les questions.</p>`;
            return;
          }
        }
        etat.estimation = estimer(t, etat.reponses, config.types[t.id]);
        etat.ecran = etat.estimation ? "estimation" : "coordonnees";
        dessiner();
      });

    } else if (etat.ecran === "estimation") {
      const e = etat.estimation;
      app.innerHTML = `${entete}
        <div class="bloc-estimation">
          <p class="sous-titre">Votre projet ${etat.type.libelle.toLowerCase()} est estimé entre</p>
          <p class="fourchette">${euros(e.min)} <span class="et">et</span> ${euros(e.max)}</p>
          ${e.facteurs.length ? `<p class="info">Cette fourchette tient compte de vos choix : ${e.facteurs.join(", ")}.</p>` : ""}
          ${avertissement}
          <button class="bouton" id="btn-suite">Recevoir une étude précise de mon projet</button>
        </div>${pied}`;
      document.getElementById("btn-suite").addEventListener("click", () => { etat.ecran = "coordonnees"; dessiner(); });

    } else if (etat.ecran === "coordonnees") {
      const libre = !etat.type.base;
      app.innerHTML = `${entete}
        <button class="lien-retour" id="btn-retour">← Retour</button>
        <h1>Dernière étape ✨</h1>
        <p class="sous-titre">${esc(config.nom)} vous recontacte pour affiner votre projet.</p>
        ${libre ? `
          <label><span class="etiquette">Décrivez votre projet *</span>
            <textarea id="ch-description" rows="3" placeholder="Ex : création d'un bassin avec cascade…"></textarea></label>` : ""}
        <div class="deux-col">
          <label><span class="etiquette">Prénom *</span><input type="text" id="ch-prenom"></label>
          <label><span class="etiquette">Nom *</span><input type="text" id="ch-nom"></label>
        </div>
        <label><span class="etiquette">Téléphone *</span><input type="tel" id="ch-tel"></label>
        <div class="deux-col">
          <label><span class="etiquette">Code postal *</span><input type="text" id="ch-cp" inputmode="numeric" maxlength="5"></label>
          <label><span class="etiquette">Commune</span><input type="text" id="ch-commune"></label>
        </div>
        <label><span class="etiquette">Quand souhaitez-vous réaliser ce projet ?</span>
          <select id="ch-delai">${DELAIS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></label>
        <label><span class="etiquette">Budget maximum envisagé (optionnel)</span>
          <input type="text" id="ch-budget" inputmode="numeric" placeholder="Ex : 10 000 €"></label>
        <div id="zone-erreur"></div>
        <button class="bouton" id="btn-envoyer">Recevoir une étude précise de mon projet</button>
        <p class="info" style="text-align:center;margin-top:8px">
          Votre messagerie s'ouvrira avec votre demande prête à envoyer —
          vous pourrez y joindre des photos de votre terrain. 📷</p>${pied}`;

      document.getElementById("btn-retour").addEventListener("click", () => {
        etat.ecran = etat.estimation ? "estimation" : (etat.type.questions.length ? "questions" : "type");
        dessiner();
      });
      document.getElementById("btn-envoyer").addEventListener("click", () => {
        const valeur = (id) => document.getElementById(id)?.value.trim() ?? "";
        const zoneErreur = document.getElementById("zone-erreur");
        const prenom = valeur("ch-prenom"), nom = valeur("ch-nom"), tel = valeur("ch-tel"), cp = valeur("ch-cp");
        if (libre && !valeur("ch-description")) return zoneErreur.innerHTML = `<p class="erreur">Décrivez votre projet en quelques mots.</p>`;
        if (!prenom || !nom) return zoneErreur.innerHTML = `<p class="erreur">Merci d'indiquer votre prénom et votre nom.</p>`;
        if (tel.replace(/\D/g, "").length < 9) return zoneErreur.innerHTML = `<p class="erreur">Numéro de téléphone invalide.</p>`;
        if (!/^\d{5}$/.test(cp)) return zoneErreur.innerHTML = `<p class="erreur">Le code postal doit comporter 5 chiffres.</p>`;

        // Récapitulatif → email prérempli vers le paysagiste
        const lignes = [
          `Nouvelle demande via votre simulateur`,
          ``,
          `PROJET : ${etat.type.libelle}`,
          ...(libre ? [`Description : ${valeur("ch-description")}`] : etat.type.questions.map((q) => {
            const v = etat.reponses[q.id];
            if (q.type === "nombre") return `${q.libelle} : ${v} ${q.unite}`;
            return `${q.libelle} : ${q.options.find((o) => o.id === v)?.libelle ?? v}`;
          })),
          ...(etat.estimation ? [``, `ESTIMATION AFFICHÉE : ${euros(etat.estimation.min)} – ${euros(etat.estimation.max)}`] : []),
          ``,
          `CONTACT`,
          `${prenom} ${nom}`,
          `Téléphone : ${tel}`,
          `Localisation : ${cp}${valeur("ch-commune") ? " " + valeur("ch-commune") : ""}`,
          `Délai : ${DELAIS.find(([v]) => v === valeur("ch-delai"))?.[1] ?? ""}`,
          ...(valeur("ch-budget") ? [`Budget max indiqué : ${valeur("ch-budget")}`] : []),
          ``,
          `(Vous pouvez joindre des photos de votre terrain à cet email.)`,
        ];
        const mailto = `mailto:${config.email}` +
          `?subject=${encodeURIComponent(`Demande de projet ${etat.type.libelle} — ${prenom} ${nom}`)}` +
          `&body=${encodeURIComponent(lignes.join("\n"))}`;
        etat.recap = lignes.join("\n");
        etat.ecran = "merci";
        dessiner();
        location.href = mailto; // ouvre la messagerie du visiteur
      });

    } else if (etat.ecran === "merci") {
      app.innerHTML = `${entete}
        <div class="bloc-estimation">
          <p style="font-size:44px;margin:0">📨</p>
          <h1>Plus qu'un clic !</h1>
          <p class="sous-titre">Votre messagerie s'est ouverte avec votre demande prête —
            appuyez sur <strong>Envoyer</strong> pour la transmettre à ${esc(config.nom)}.
            Pensez à y joindre des photos de votre terrain. 📷</p>
          <button class="bouton bouton-secondaire" id="btn-copier-recap">Ma messagerie ne s'est pas ouverte — copier ma demande</button>
          ${config.tel ? `<p class="info" style="margin-top:16px">Ou appelez directement :
            <a href="tel:${esc(config.tel)}" style="color:var(--marque);font-weight:700">${esc(config.tel)}</a></p>` : ""}
        </div>${pied}`;
      document.getElementById("btn-copier-recap").addEventListener("click", (e) =>
        copier(`${etat.recap}\n\nÀ envoyer à : ${config.email}`, e.target, "Copier ma demande"));
    }
    window.scrollTo(0, 0);
  }

  dessiner();
}

demarrer();
