/* Devis Paysagiste — application 100 % navigateur.
   Les données restent sur l'appareil (localStorage) : aucun serveur.
   Vues : accueil, onboarding (tarifs), nouveau devis, liste, détail. */

"use strict";

/* ============================================================
   Bibliothèque de prix : prestations types avec fourchettes
   indicatives constatées en France (HT).
   ============================================================ */
const PRESTATIONS = [
  // Engazonnement
  { id: "gazon-plaque",   nom: "Pose de gazon en plaque",                    unite: "m²",      categorie: "Engazonnement",    prixMin: 15,   prixMax: 25 },
  { id: "gazon-semis",    nom: "Engazonnement par semis",                    unite: "m²",      categorie: "Engazonnement",    prixMin: 4,    prixMax: 9 },
  { id: "gazon-synth",    nom: "Pose de gazon synthétique",                  unite: "m²",      categorie: "Engazonnement",    prixMin: 40,   prixMax: 80 },
  // Taille / Entretien
  { id: "tonte",          nom: "Tonte de pelouse",                           unite: "m²",      categorie: "Taille/Entretien", prixMin: 0.15, prixMax: 0.45 },
  { id: "taille-haie",    nom: "Taille de haie",                             unite: "ml",      categorie: "Taille/Entretien", prixMin: 5,    prixMax: 12 },
  { id: "debrouss",       nom: "Débroussaillage",                            unite: "m²",      categorie: "Taille/Entretien", prixMin: 1,    prixMax: 3 },
  { id: "elagage",        nom: "Élagage d'arbre (petit sujet)",              unite: "unité",   categorie: "Taille/Entretien", prixMin: 80,   prixMax: 250 },
  // Clôture
  { id: "cloture-rigide", nom: "Pose de clôture rigide (panneaux)",          unite: "ml",      categorie: "Clôture",          prixMin: 70,   prixMax: 120 },
  { id: "grillage",       nom: "Pose de grillage souple",                    unite: "ml",      categorie: "Clôture",          prixMin: 30,   prixMax: 60 },
  { id: "portail",        nom: "Pose de portail (fourniture non comprise)",  unite: "forfait", categorie: "Clôture",          prixMin: 500,  prixMax: 1500 },
  // Terrasse
  { id: "terrasse-bois",  nom: "Terrasse en bois (lames + structure)",       unite: "m²",      categorie: "Terrasse",         prixMin: 80,   prixMax: 160 },
  { id: "terrasse-dalle", nom: "Terrasse en dalles / pierre",                unite: "m²",      categorie: "Terrasse",         prixMin: 60,   prixMax: 120 },
  { id: "paves",          nom: "Allée en pavés",                             unite: "m²",      categorie: "Terrasse",         prixMin: 40,   prixMax: 90 },
  // Plantation
  { id: "arbuste",        nom: "Plantation d'arbuste (fourniture comprise)", unite: "unité",   categorie: "Plantation",       prixMin: 15,   prixMax: 40 },
  { id: "arbre",          nom: "Plantation d'arbre (fourniture comprise)",   unite: "unité",   categorie: "Plantation",       prixMin: 80,   prixMax: 250 },
  { id: "paillage",       nom: "Pose de paillage",                           unite: "m²",      categorie: "Plantation",       prixMin: 5,    prixMax: 12 },
];

const CATEGORIES = [...new Set(PRESTATIONS.map((p) => p.categorie))];

/* ============================================================
   Stockage local (localStorage) — enveloppé en try/catch car
   certains navigateurs le bloquent en navigation privée.
   ============================================================ */
const CLE_PROFIL = "dp_profil";
const CLE_PRIX = "dp_prix";
const CLE_DEVIS = "dp_devis";

function lire(cle, defaut) {
  try {
    const brut = localStorage.getItem(cle);
    return brut ? JSON.parse(brut) : defaut;
  } catch { return defaut; }
}
function ecrire(cle, valeur) {
  try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch { /* stockage indisponible */ }
}

const chargerProfil = () => lire(CLE_PROFIL, null);
const chargerPrix = () => lire(CLE_PRIX, {});       // { idPrestation: prix }
const chargerDevis = () => lire(CLE_DEVIS, []);     // tableau de devis

/* ============================================================
   Helpers
   ============================================================ */
const euros = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
// Le PDF (police Helvetica) ne connaît pas les espaces insécables français.
const eurosPdf = (n) => euros(n).replace(/[  ]/g, " ");
const dateFr = (iso) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const enNombre = (texte) => Number(String(texte).replace(",", "."));
const arrondi = (n) => Math.round(n * 100) / 100;

// Échappe le HTML des données saisies (noms de clients, etc.).
function esc(texte) {
  const div = document.createElement("div");
  div.textContent = String(texte ?? "");
  return div.innerHTML;
}

function fourchette(p) {
  return `${euros(p.prixMin)} – ${euros(p.prixMax)} / ${p.unite}`;
}

const app = document.getElementById("app");

/* ============================================================
   Routeur : la vue dépend du hash (#accueil, #nouveau, #devis/3…)
   ============================================================ */
function router() {
  const hash = location.hash.replace(/^#/, "") || "accueil";
  const profil = chargerProfil();

  // Premier lancement : tout passe par le questionnaire.
  if (!profil && hash !== "onboarding") {
    location.hash = "onboarding";
    return;
  }

  const detail = hash.match(/^devis\/(\d+)$/);
  if (hash === "onboarding") vueOnboarding();
  else if (hash === "nouveau") vueNouveauDevis();
  else if (hash === "devis") vueListeDevis();
  else if (detail) vueDetailDevis(Number(detail[1]));
  else if (hash === "tarifs") vueTarifs();
  else vueAccueil();

  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", router);

/* ============================================================
   Vue : accueil
   ============================================================ */
function vueAccueil() {
  const profil = chargerProfil();
  const derniers = chargerDevis().slice(0, 3);

  app.innerHTML = `
    <h1>Bonjour${profil.nomEntreprise ? " " + esc(profil.nomEntreprise) : ""} 👋</h1>
    <p class="sous-titre">${esc(profil.ville)} (${esc(profil.codePostal)})</p>
    <div class="pile-boutons">
      <a href="#nouveau" class="bouton bouton-vert">➕ Créer un devis</a>
      <a href="#devis" class="bouton bouton-blanc">📋 Mes devis</a>
      <a href="#tarifs" class="bouton bouton-blanc">🏷️ Mes tarifs</a>
    </div>
    ${derniers.length ? `
      <h2 style="margin-top:24px">Derniers devis</h2>
      <ul class="liste">${derniers.map(ligneListeDevis).join("")}</ul>` : ""}
  `;
}

function ligneListeDevis(d) {
  return `
    <li><a class="ligne-liste" href="#devis/${d.id}">
      <span>
        <span>${esc(d.nomClient)}</span>
        <span class="detail-doux" style="display:block">${dateFr(d.dateCreation)}</span>
      </span>
      <span style="display:flex;align-items:center;gap:12px">
        <span class="badge ${d.statut === "envoyé" ? "badge-envoye" : "badge-brouillon"}">${d.statut === "envoyé" ? "Envoyé" : "Brouillon"}</span>
        <span class="montant">${euros(d.totalHT)}</span>
      </span>
    </a></li>`;
}

/* ============================================================
   Vue : onboarding / modification des tarifs
   ============================================================ */
function vueOnboarding() {
  const profil = chargerProfil();
  const prix = chargerPrix();
  const deja = profil !== null;

  const sectionsPrix = CATEGORIES.map((cat) => `
    <section class="carte">
      <h2>${cat}</h2>
      ${PRESTATIONS.filter((p) => p.categorie === cat).map((p) => `
        <label>
          <span><strong>${p.nom}</strong></span>
          <span class="fourchette" style="display:block">Fourchette indicative : ${fourchette(p)}</span>
          <span class="champ-prix">
            <input type="number" step="0.01" min="0" id="prix-${p.id}"
                   value="${prix[p.id] ?? ""}" placeholder="Votre prix">
            <span>€ / ${p.unite}</span>
          </span>
        </label>`).join("")}
    </section>`).join("");

  app.innerHTML = `
    <h1>${deja ? "Mes tarifs" : "Bienvenue ! 🌿"}</h1>
    <p class="sous-titre">${deja
      ? "Modifiez vos informations et vos prix ci-dessous."
      : "Avant de créer votre premier devis, dites-nous où vous travaillez et vos prix habituels. Les fourchettes affichées sont des prix moyens constatés en France — à vous d'ajuster."}</p>

    <section class="carte">
      <h2>Votre entreprise</h2>
      <label><span class="etiquette">Nom de l'entreprise (optionnel)</span>
        <input type="text" id="ch-entreprise" value="${esc(profil?.nomEntreprise ?? "")}" placeholder="Ex : Au Jardin Vert"></label>
      <div class="deux-colonnes">
        <label><span class="etiquette">Ville *</span>
          <input type="text" id="ch-ville" value="${esc(profil?.ville ?? "")}" placeholder="Ex : Besançon"></label>
        <label><span class="etiquette">Code postal *</span>
          <input type="text" id="ch-cp" inputmode="numeric" maxlength="5" value="${esc(profil?.codePostal ?? "")}" placeholder="Ex : 25000"></label>
      </div>
    </section>

    <section class="carte">
      <h2>Deux questions rapides</h2>
      <label><span class="etiquette">Utilisez-vous déjà un logiciel pour générer ou chiffrer vos devis ? Si oui, lequel ?</span>
        <input type="text" id="ch-logiciel" value="${esc(profil?.logicielActuel ?? "")}" placeholder="Ex : Excel, Obat, Tolteck… (vide = aucun)"></label>
      <fieldset style="border:none;margin:0;padding:0">
        <legend class="etiquette">Laisseriez-vous un prospect obtenir une fourchette de prix directement depuis votre site, avant même de vous contacter ?</legend>
        <div class="choix-groupe">
          ${[["oui", "Oui"], ["peut-etre", "Peut-être"], ["non", "Non"]].map(([v, t]) => `
            <label class="choix"><input type="radio" name="estimation" value="${v}"
              ${profil?.estimationPublique === v ? "checked" : ""}>${t}</label>`).join("")}
        </div>
      </fieldset>
    </section>

    ${sectionsPrix}

    <p class="info">Un prix laissé vide = prestation que vous ne proposez pas (modifiable plus tard depuis « Mes tarifs »). Vos données restent sur cet appareil.</p>
    <div id="zone-erreur"></div>

    <div class="barre-basse"><div class="barre-basse-interieur">
      <button class="bouton bouton-vert" id="btn-enregistrer">Enregistrer mes tarifs</button>
    </div></div>
  `;

  document.getElementById("btn-enregistrer").addEventListener("click", () => {
    const ville = document.getElementById("ch-ville").value.trim();
    const cp = document.getElementById("ch-cp").value.trim();

    if (!ville || !cp) return montrerErreur("Merci d'indiquer votre ville et votre code postal.");
    if (!/^\d{5}$/.test(cp)) return montrerErreur("Le code postal doit comporter 5 chiffres.");

    // Récupère les prix saisis (vide = prestation non proposée).
    const nouveauxPrix = {};
    for (const p of PRESTATIONS) {
      const brut = document.getElementById(`prix-${p.id}`).value;
      if (brut.trim() === "") continue;
      const valeur = enNombre(brut);
      if (!Number.isFinite(valeur) || valeur <= 0) {
        return montrerErreur(`Prix invalide pour « ${p.nom} ».`);
      }
      nouveauxPrix[p.id] = valeur;
    }
    if (Object.keys(nouveauxPrix).length === 0) {
      return montrerErreur("Merci de renseigner au moins un prix.");
    }

    ecrire(CLE_PROFIL, {
      nomEntreprise: document.getElementById("ch-entreprise").value.trim(),
      ville,
      codePostal: cp,
      logicielActuel: document.getElementById("ch-logiciel").value.trim(),
      estimationPublique: document.querySelector('input[name="estimation"]:checked')?.value ?? "",
    });
    ecrire(CLE_PRIX, nouveauxPrix);
    location.hash = "accueil";
    router(); // au cas où le hash était déjà #accueil
  });
}

function montrerErreur(message) {
  const zone = document.getElementById("zone-erreur");
  if (zone) {
    zone.innerHTML = `<p class="erreur">${esc(message)}</p>`;
    zone.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

/* ============================================================
   Vue : nouveau devis
   ============================================================ */
function vueNouveauDevis() {
  const prix = chargerPrix();
  // Seules les prestations avec un prix défini sont proposées.
  const disponibles = PRESTATIONS.filter((p) => prix[p.id] != null);

  if (disponibles.length === 0) {
    app.innerHTML = `
      <h1>Nouveau devis</h1>
      <p class="erreur">Aucun prix défini. <a href="#tarifs">Renseignez d'abord vos tarifs</a>.</p>`;
    return;
  }

  // Lignes en cours de saisie : { prestationId, quantite (texte) }
  const lignes = [{ prestationId: "", quantite: "" }];

  const optionsSelect = () => CATEGORIES
    .filter((cat) => disponibles.some((p) => p.categorie === cat))
    .map((cat) => `<optgroup label="${cat}">
      ${disponibles.filter((p) => p.categorie === cat).map((p) =>
        `<option value="${p.id}">${p.nom} (${euros(prix[p.id])}/${p.unite})</option>`).join("")}
    </optgroup>`).join("");

  app.innerHTML = `
    <h1>Nouveau devis</h1>
    <section class="carte">
      <h2>Client</h2>
      <label><span class="etiquette">Nom du client *</span>
        <input type="text" id="ch-client" placeholder="Ex : M. et Mme Martin"></label>
      <label><span class="etiquette">Adresse du chantier *</span>
        <input type="text" id="ch-adresse" placeholder="Ex : 12 rue des Lilas, 25000 Besançon"></label>
    </section>

    <h2>Prestations</h2>
    <div id="zone-lignes"></div>
    <button type="button" class="bouton-ajout" id="btn-ajout-ligne">+ Ajouter une prestation</button>

    <section class="carte" style="margin-top:16px">
      <label><span class="etiquette">Notes (optionnel)</span>
        <textarea id="ch-notes" rows="2" placeholder="Ex : accès difficile, prévoir évacuation des déchets…"></textarea></label>
    </section>

    <div id="zone-erreur"></div>

    <div class="barre-basse"><div class="barre-basse-interieur">
      <div><span class="total-libelle">Total HT</span><span class="total-valeur" id="total-ht">0,00 €</span></div>
      <button class="bouton bouton-vert" id="btn-enregistrer-devis">Enregistrer le devis</button>
    </div></div>
  `;

  const zoneLignes = document.getElementById("zone-lignes");

  const sousTotal = (l) => {
    const p = disponibles.find((x) => x.id === l.prestationId);
    const q = enNombre(l.quantite);
    if (!p || !Number.isFinite(q) || q <= 0) return null;
    return arrondi(q * prix[p.id]);
  };

  function majTotal() {
    const total = lignes.reduce((somme, l) => somme + (sousTotal(l) ?? 0), 0);
    document.getElementById("total-ht").textContent = euros(total);
  }

  // (Re)dessine toutes les lignes de saisie.
  function dessinerLignes() {
    zoneLignes.innerHTML = lignes.map((l, i) => {
      const p = disponibles.find((x) => x.id === l.prestationId);
      const st = sousTotal(l);
      return `
        <div class="carte ligne-prestation" data-index="${i}">
          <select data-role="prestation">
            <option value="">— Choisir une prestation —</option>
            ${optionsSelect()}
          </select>
          <div class="rangee">
            <input type="text" inputmode="decimal" data-role="quantite"
                   value="${esc(l.quantite)}" placeholder="Quantité">
            <span>${p ? p.unite : ""}</span>
            <span class="sous-total">${st != null ? euros(st) : ""}</span>
            <button type="button" class="bouton-suppr" data-role="supprimer" aria-label="Supprimer la ligne">✕</button>
          </div>
        </div>`;
    }).join("");

    // Restaure la sélection des <select> (innerHTML ne garde pas la valeur).
    zoneLignes.querySelectorAll(".ligne-prestation").forEach((bloc) => {
      const i = Number(bloc.dataset.index);
      bloc.querySelector('[data-role="prestation"]').value = lignes[i].prestationId;
    });
    majTotal();
  }

  // Délégation d'événements : une seule écoute pour toutes les lignes.
  zoneLignes.addEventListener("change", (e) => {
    const bloc = e.target.closest(".ligne-prestation");
    if (!bloc) return;
    const i = Number(bloc.dataset.index);
    if (e.target.dataset.role === "prestation") {
      lignes[i].prestationId = e.target.value;
      dessinerLignes();
    }
  });
  zoneLignes.addEventListener("input", (e) => {
    const bloc = e.target.closest(".ligne-prestation");
    if (!bloc) return;
    const i = Number(bloc.dataset.index);
    if (e.target.dataset.role === "quantite") {
      lignes[i].quantite = e.target.value;
      // Met à jour le sous-total de la ligne sans tout redessiner (le champ garde le focus).
      const st = sousTotal(lignes[i]);
      bloc.querySelector(".sous-total").textContent = st != null ? euros(st) : "";
      majTotal();
    }
  });
  zoneLignes.addEventListener("click", (e) => {
    if (e.target.dataset.role === "supprimer") {
      const i = Number(e.target.closest(".ligne-prestation").dataset.index);
      lignes.splice(i, 1);
      if (lignes.length === 0) lignes.push({ prestationId: "", quantite: "" });
      dessinerLignes();
    }
  });

  document.getElementById("btn-ajout-ligne").addEventListener("click", () => {
    lignes.push({ prestationId: "", quantite: "" });
    dessinerLignes();
  });

  document.getElementById("btn-enregistrer-devis").addEventListener("click", () => {
    const nomClient = document.getElementById("ch-client").value.trim();
    const adresse = document.getElementById("ch-adresse").value.trim();
    // Ignore les lignes complètement vides.
    const remplies = lignes.filter((l) => l.prestationId !== "" || l.quantite.trim() !== "");

    if (!nomClient) return montrerErreur("Merci d'indiquer le nom du client.");
    if (!adresse) return montrerErreur("Merci d'indiquer l'adresse du chantier.");
    if (remplies.length === 0) return montrerErreur("Ajoutez au moins une prestation.");
    for (const l of remplies) {
      if (!l.prestationId) return montrerErreur("Chaque ligne doit avoir une prestation sélectionnée.");
      const q = enNombre(l.quantite);
      if (!Number.isFinite(q) || q <= 0) return montrerErreur("Chaque ligne doit avoir une quantité supérieure à zéro.");
    }

    // Prix et noms COPIÉS au moment de la création : l'historique reste
    // juste même si les tarifs changent ensuite.
    const lignesDevis = remplies.map((l) => {
      const p = PRESTATIONS.find((x) => x.id === l.prestationId);
      const q = enNombre(l.quantite);
      return {
        prestationId: p.id, nomPrestation: p.nom, unite: p.unite,
        quantite: q, prixUnitaire: prix[p.id], sousTotal: arrondi(q * prix[p.id]),
      };
    });

    const tous = chargerDevis();
    const nouveau = {
      id: tous.reduce((max, d) => Math.max(max, d.id), 0) + 1,
      nomClient, adresseChantier: adresse,
      notes: document.getElementById("ch-notes").value.trim(),
      dateCreation: new Date().toISOString(),
      statut: "brouillon",
      totalHT: arrondi(lignesDevis.reduce((s, l) => s + l.sousTotal, 0)),
      lignes: lignesDevis,
    };
    ecrire(CLE_DEVIS, [nouveau, ...tous]);
    location.hash = `devis/${nouveau.id}`;
  });

  dessinerLignes();
}

/* ============================================================
   Vue : liste des devis
   ============================================================ */
function vueListeDevis() {
  const tous = chargerDevis();
  app.innerHTML = `
    <div class="entete-page">
      <h1>Mes devis</h1>
      <a href="#nouveau" class="bouton-petit bouton-vert" style="background:var(--vert);color:#fff">+ Nouveau</a>
    </div>
    ${tous.length === 0
      ? `<div class="carte" style="text-align:center;color:var(--texte-doux)">
           Aucun devis pour l'instant.<br>
           <a href="#nouveau" style="color:var(--vert);font-weight:500">Créer votre premier devis</a>
         </div>`
      : `<ul class="liste">${tous.map(ligneListeDevis).join("")}</ul>`}
  `;
}

/* ============================================================
   Vue : détail d'un devis
   ============================================================ */
function vueDetailDevis(id) {
  const devis = chargerDevis().find((d) => d.id === id);
  if (!devis) { location.hash = "devis"; return; }

  const envoye = devis.statut === "envoyé";

  app.innerHTML = `
    <a href="#devis" class="lien-retour">← Retour à mes devis</a>
    <div class="entete-page" style="margin-top:4px">
      <h1>Devis n°${devis.id}
        <span class="badge ${envoye ? "badge-envoye" : "badge-brouillon"}">${envoye ? "Envoyé" : "Brouillon"}</span>
      </h1>
    </div>
    <p class="sous-titre">Créé le ${dateFr(devis.dateCreation)}</p>

    <section class="carte">
      <strong>${esc(devis.nomClient)}</strong>
      <div class="detail-doux">${esc(devis.adresseChantier)}</div>
      ${devis.notes ? `<div class="detail-doux" style="margin-top:8px;border-top:1px solid #f5f5f4;padding-top:8px">${esc(devis.notes)}</div>` : ""}
    </section>

    <section class="carte conteneur-tableau">
      <table>
        <thead><tr><th>Prestation</th><th class="num">Qté</th><th class="num">P.U. HT</th><th class="num">Sous-total</th></tr></thead>
        <tbody>
          ${devis.lignes.map((l) => `
            <tr>
              <td>${esc(l.nomPrestation)}</td>
              <td class="num">${l.quantite.toLocaleString("fr-FR")} ${l.unite}</td>
              <td class="num">${euros(l.prixUnitaire)}</td>
              <td class="num montant">${euros(l.sousTotal)}</td>
            </tr>`).join("")}
        </tbody>
        <tfoot><tr>
          <td colspan="3" class="num total-tableau">Total HT</td>
          <td class="num total-tableau">${euros(devis.totalHT)}</td>
        </tr></tfoot>
      </table>
    </section>

    <div class="pile-boutons">
      <button class="bouton bouton-vert" id="btn-pdf">⬇️ Télécharger en PDF</button>
      <button class="bouton bouton-blanc" id="btn-statut">${envoye ? "↩️ Repasser en brouillon" : "📤 Marquer comme envoyé"}</button>
      <button class="bouton bouton-rouge" id="btn-supprimer">🗑️ Supprimer ce devis</button>
    </div>
  `;

  document.getElementById("btn-pdf").addEventListener("click", () => telechargerPdf(devis));

  document.getElementById("btn-statut").addEventListener("click", () => {
    const tous = chargerDevis();
    const cible = tous.find((d) => d.id === id);
    cible.statut = envoye ? "brouillon" : "envoyé";
    ecrire(CLE_DEVIS, tous);
    vueDetailDevis(id);
  });

  document.getElementById("btn-supprimer").addEventListener("click", () => {
    if (!confirm("Supprimer définitivement ce devis ?")) return;
    ecrire(CLE_DEVIS, chargerDevis().filter((d) => d.id !== id));
    location.hash = "devis";
  });
}

/* ============================================================
   Vue : mes tarifs (lecture) + export CSV
   ============================================================ */
function vueTarifs() {
  const prix = chargerPrix();
  app.innerHTML = `
    <div class="entete-page">
      <h1>Mes tarifs</h1>
      <div class="groupe-boutons-entete">
        <button class="bouton-petit bouton-blanc" id="btn-csv" style="border:1px solid #e7e5e4;background:#fff">⬇️ Export CSV</button>
        <a href="#onboarding" class="bouton-petit" style="background:var(--vert);color:#fff">✏️ Modifier</a>
      </div>
    </div>
    ${CATEGORIES.map((cat) => `
      <h2 style="margin-top:16px">${cat}</h2>
      <ul class="liste">
        ${PRESTATIONS.filter((p) => p.categorie === cat).map((p) => `
          <li><div class="ligne-liste">
            <span>
              <span>${p.nom}</span>
              <span class="detail-doux" style="display:block">Indicatif : ${fourchette(p)}</span>
            </span>
            <span class="montant">${prix[p.id] != null ? `${euros(prix[p.id])} / ${p.unite}` : "—"}</span>
          </div></li>`).join("")}
      </ul>`).join("")}
  `;
  document.getElementById("btn-csv").addEventListener("click", exporterCsv);
}

// Export CSV des tarifs + réponses découverte, format prêt pour Google Sheets
// (séparateur ";", BOM UTF-8 pour les accents dans Excel).
function exporterCsv() {
  const profil = chargerProfil() ?? {};
  const prix = chargerPrix();
  const champ = (v) => {
    const s = v == null ? "" : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lignes = [
    ["ville", "code_postal", "entreprise", "logiciel_actuel", "estimation_publique", "categorie", "prestation", "unite", "prix_unitaire_ht", "fourchette_min", "fourchette_max"].join(";"),
    ...PRESTATIONS.map((p) => [
      champ(profil.ville), champ(profil.codePostal), champ(profil.nomEntreprise),
      champ(profil.logicielActuel), champ(profil.estimationPublique),
      champ(p.categorie), champ(p.nom), champ(p.unite),
      champ(prix[p.id]), champ(p.prixMin), champ(p.prixMax),
    ].join(";")),
  ];
  const blob = new Blob(["﻿" + lignes.join("\n")], { type: "text/csv;charset=utf-8" });
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(blob);
  lien.download = "tarifs-paysagiste.csv";
  lien.click();
  URL.revokeObjectURL(lien.href);
}

/* ============================================================
   PDF du devis (jsPDF + autotable, embarqués en local)
   ============================================================ */
function telechargerPdf(devis) {
  const profil = chargerProfil() ?? {};
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const VERT = [45, 106, 79];
  const GRIS_CLAIR = [244, 244, 242];
  const GRIS_TEXTE = [102, 102, 102];
  const MARGE = 40;
  const largeurPage = doc.internal.pageSize.getWidth();

  // --- En-tête : entreprise à gauche, DEVIS à droite ---
  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...VERT);
  doc.text(profil.nomEntreprise || "Votre entreprise de paysagisme", MARGE, 60);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...GRIS_TEXTE);
  doc.text(`${profil.codePostal ?? ""} ${profil.ville ?? ""}`.trim(), MARGE, 76);

  doc.setFont("helvetica", "bold").setFontSize(22).setTextColor(26, 26, 26);
  doc.text("DEVIS", largeurPage - MARGE, 60, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...GRIS_TEXTE);
  doc.text(`N° ${String(devis.id).padStart(4, "0")}`, largeurPage - MARGE, 76, { align: "right" });
  doc.text(`Le ${dateFr(devis.dateCreation)}`, largeurPage - MARGE, 90, { align: "right" });

  doc.setDrawColor(...VERT).setLineWidth(2);
  doc.line(MARGE, 105, largeurPage - MARGE, 105);

  // --- Bloc client (encadré gris, à droite) ---
  const largeurBloc = 230;
  const xBloc = largeurPage - MARGE - largeurBloc;
  doc.setFillColor(...GRIS_CLAIR);
  doc.roundedRect(xBloc, 125, largeurBloc, 70, 6, 6, "F");
  doc.setFontSize(8).setTextColor(...GRIS_TEXTE);
  doc.text("CLIENT", xBloc + 12, 142);
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(26, 26, 26);
  doc.text(devis.nomClient, xBloc + 12, 160);
  doc.setFont("helvetica", "normal").setFontSize(9);
  doc.text(doc.splitTextToSize(devis.adresseChantier, largeurBloc - 24), xBloc + 12, 175);

  // --- Tableau des prestations ---
  doc.autoTable({
    startY: 220,
    margin: { left: MARGE, right: MARGE },
    head: [["Prestation", "Quantité", "P.U. HT", "Total HT"]],
    body: devis.lignes.map((l) => [
      l.nomPrestation,
      `${l.quantite.toLocaleString("fr-FR")} ${l.unite}`,
      eurosPdf(l.prixUnitaire),
      eurosPdf(l.sousTotal),
    ]),
    styles: { font: "helvetica", fontSize: 10, cellPadding: 7 },
    headStyles: { fillColor: VERT, textColor: 255, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    alternateRowStyles: { fillColor: [250, 250, 249] },
  });

  // --- Total HT (cadre vert, à droite) ---
  let y = doc.lastAutoTable.finalY + 20;
  const texteTotal = `TOTAL HT    ${eurosPdf(devis.totalHT)}`;
  doc.setFont("helvetica", "bold").setFontSize(13);
  const largeurTotal = doc.getTextWidth(texteTotal) + 36;
  doc.setFillColor(...VERT);
  doc.roundedRect(largeurPage - MARGE - largeurTotal, y, largeurTotal, 34, 6, 6, "F");
  doc.setTextColor(255);
  doc.text(texteTotal, largeurPage - MARGE - 18, y + 22, { align: "right" });

  // --- Notes éventuelles ---
  if (devis.notes) {
    y += 60;
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...GRIS_TEXTE);
    doc.text(doc.splitTextToSize(`Remarques : ${devis.notes}`, largeurPage - 2 * MARGE), MARGE, y);
  }

  // --- Mentions légales en pied de page ---
  const basPage = doc.internal.pageSize.getHeight() - 45;
  doc.setDrawColor(229, 229, 229).setLineWidth(0.5);
  doc.line(MARGE, basPage - 12, largeurPage - MARGE, basPage - 12);
  doc.setFontSize(7).setTextColor(...GRIS_TEXTE);
  doc.text("Devis valable 30 jours à compter de sa date d'émission. TVA non applicable sur ce document (montants exprimés hors taxes).", largeurPage / 2, basPage, { align: "center" });
  doc.text("Bon pour accord — date et signature du client précédées de la mention « Bon pour accord ».", largeurPage / 2, basPage + 11, { align: "center" });

  // Nom de fichier en ASCII simple.
  const nomFichier = `devis-${devis.id}-${devis.nomClient.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9 -]/g, "").trim().replace(/ +/g, "-").toLowerCase()}.pdf`;
  doc.save(nomFichier);
}

/* Démarrage */
router();
