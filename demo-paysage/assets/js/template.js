/* =====================================================================
   Template paysagiste — comportements partagés.
   Le contenu (services, réalisations, FAQ…) est généré dans le HTML au
   build pour le SEO ; ce fichier ne gère que l'interactif.
   window.CLIENT_CONFIG est injecté par build.js (config.js du client).
   ===================================================================== */
(function () {
  "use strict";

  var CFG = window.CLIENT_CONFIG || {};
  var DEMO = !!CFG.demoMode;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =========================================================
     ANALYTICS — abstraction sans service externe.
     Événements poussés dans window.dataLayer ; brancher GA4 ou
     Plausible plus tard sans toucher au reste du code.
     ========================================================= */
  window.dataLayer = window.dataLayer || [];
  function track(eventName, props) {
    window.dataLayer.push(Object.assign({ event: eventName }, props || {}));
    if (CFG.debugAnalytics && window.console) console.info("[analytics]", eventName, props || {});
  }
  window.siteTrack = track;

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-track]");
    if (el) track(el.getAttribute("data-track"));
    var tel = e.target.closest('a[href^="tel:"]');
    if (tel) track("phone_click");
    var mail = e.target.closest('a[href^="mailto:"]');
    if (mail) track("email_click");
    var proj = e.target.closest(".project");
    if (proj) track("project_click", { project: proj.getAttribute("data-title") || "" });
    var route = e.target.closest("[data-directions]");
    if (route) track("directions_click");
  });

  /* =========================================================
     APPARITIONS AU SCROLL
     ========================================================= */
  var revealEls = document.querySelectorAll(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* =========================================================
     FILTRES RÉALISATIONS
     ========================================================= */
  var filterBar = document.querySelector(".filters");
  if (filterBar) {
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter");
      if (!btn) return;
      var cat = btn.getAttribute("data-filter");
      filterBar.querySelectorAll(".filter").forEach(function (f) {
        f.setAttribute("aria-pressed", f === btn ? "true" : "false");
      });
      document.querySelectorAll(".project").forEach(function (p) {
        var match = cat === "all" || p.getAttribute("data-category") === cat;
        p.classList.toggle("is-hidden", !match);
      });
      track("projects_filter", { category: cat });
    });
  }

  /* =========================================================
     AVANT / APRÈS — curseur de comparaison
     ========================================================= */
  document.querySelectorAll(".ba").forEach(function (ba) {
    var range = ba.querySelector(".ba__range");
    if (!range) return;
    function update() { ba.style.setProperty("--ba-pos", range.value + "%"); }
    range.addEventListener("input", update);
    update();
  });

  /* =========================================================
     FORMULAIRE DE DEVIS MULTI-ÉTAPES
     ========================================================= */
  var form = document.getElementById("quote-form");
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll(".qstep"));
  var fill = form.querySelector(".quote-progress__fill");
  var label = form.querySelector(".quote-progress__label");
  var backBtn = form.querySelector(".quote-back");
  var nextBtn = form.querySelector(".quote-next");
  var current = 0;
  var started = false;
  var STORAGE_KEY = "quote-draft-" + (CFG.slug || "site");

  /* ---- Données du lead (objet normalisé) ---- */
  var lead = {
    firstName: "", lastName: "", email: "", phone: "",
    projectType: null, city: "", postalCode: "",
    surface: null, budget: null, timeframe: null,
    description: "", photos: [],
    source: "website", createdAt: null,
  };

  /* ---- Sauvegarde locale du brouillon (hors photos) ---- */
  function saveDraft() {
    try {
      var copy = Object.assign({}, lead, { photos: [] });
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lead: copy, step: current }));
    } catch (e) { /* stockage indisponible : on continue sans */ }
  }
  function loadDraft() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && saved.lead) Object.assign(lead, saved.lead, { photos: [] });
    } catch (e) { /* brouillon illisible : on repart de zéro */ }
  }
  function clearDraft() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  function stepName(i) { return steps[i] ? steps[i].getAttribute("data-step") : null; }

  function render() {
    steps.forEach(function (s, i) { s.classList.toggle("is-active", i === current); });
    var total = steps.length;
    var pct = Math.round(((current + 1) / total) * 100);
    if (fill) fill.style.width = pct + "%";
    if (label) {
      label.textContent = current === total - 1
        ? "Demande complète"
        : "Étape " + (current + 1) + " sur " + (total - 1);
    }
    if (backBtn) backBtn.hidden = current === 0 || current === total - 1;
    if (nextBtn) {
      nextBtn.hidden = current === total - 1;
      nextBtn.textContent = current === total - 2 ? "Envoyer ma demande" : "Continuer";
    }
    var q = steps[current].querySelector(".qstep__q");
    if (q) { q.setAttribute("tabindex", "-1"); if (started) q.focus({ preventScroll: true }); }
  }

  function showError(stepEl, msg) {
    var err = stepEl.querySelector(".qerror");
    if (err) { err.textContent = msg; err.classList.add("is-visible"); }
  }
  function hideError(stepEl) {
    var err = stepEl.querySelector(".qerror");
    if (err) err.classList.remove("is-visible");
  }

  /* ---- Validation par étape ---- */
  function validateStep() {
    var name = stepName(current);
    var stepEl = steps[current];
    hideError(stepEl);

    if (name === "projet" && !lead.projectType) {
      showError(stepEl, "Choisissez le type de projet pour continuer.");
      return false;
    }
    if (name === "lieu") {
      var city = form.querySelector("#q-ville");
      if (city && !city.value.trim()) {
        showError(stepEl, "Indiquez au moins la commune du projet.");
        city.focus();
        return false;
      }
    }
    if (name === "coordonnees") {
      var first = form.querySelector("#q-prenom");
      var last = form.querySelector("#q-nom");
      var tel = form.querySelector("#q-tel");
      var email = form.querySelector("#q-email");
      if (last && !last.value.trim() && first && !first.value.trim()) {
        showError(stepEl, "Indiquez votre nom pour que l'on sache à qui répondre.");
        (first || last).focus();
        return false;
      }
      var hasTel = tel && tel.value.trim().length >= 6;
      var hasMail = email && /.+@.+\..+/.test(email.value.trim());
      if (!hasTel && !hasMail) {
        showError(stepEl, "Un téléphone ou un email est nécessaire pour vous recontacter.");
        (tel || email).focus();
        return false;
      }
    }
    return true;
  }

  /* ---- Collecte des champs de l'étape courante ---- */
  function collect() {
    var name = stepName(current);
    if (name === "lieu") {
      lead.city = val("#q-ville");
      lead.postalCode = val("#q-cp");
    }
    if (name === "description") lead.description = val("#q-desc");
    if (name === "coordonnees") {
      lead.firstName = val("#q-prenom");
      lead.lastName = val("#q-nom");
      lead.phone = val("#q-tel");
      lead.email = val("#q-email");
    }
  }
  function val(sel) { var el = form.querySelector(sel); return el ? el.value.trim() : ""; }

  function goTo(i, opts) {
    if (!started) { started = true; track("quote_start"); }
    current = Math.max(0, Math.min(steps.length - 1, i));
    if (!(opts && opts.silent)) track("quote_step", { step: stepName(current) });
    saveDraft();
    render();
  }

  /* ---- Choix par boutons (auto-avance) ---- */
  var CHOICE_KEYS = { projet: "projectType", surface: "surface", budget: "budget", delai: "timeframe" };
  form.addEventListener("click", function (e) {
    var choice = e.target.closest(".choice");
    if (!choice) return;
    var group = choice.closest("[data-answer]");
    if (!group) return;
    var key = CHOICE_KEYS[group.getAttribute("data-answer")];
    group.querySelectorAll(".choice").forEach(function (c) {
      c.setAttribute("aria-pressed", c === choice ? "true" : "false");
    });
    if (key) lead[key] = choice.getAttribute("data-value") || choice.textContent.trim();
    hideError(steps[current]);
    window.setTimeout(function () { goTo(current + 1); }, reduceMotion ? 0 : 220);
  });

  if (nextBtn) nextBtn.addEventListener("click", function () {
    collect();
    if (!validateStep()) return;
    if (current === steps.length - 2) { submit(); return; }
    goTo(current + 1);
  });
  if (backBtn) backBtn.addEventListener("click", function () { collect(); goTo(current - 1, { silent: true }); });

  /* ---- Photos : préviews locales, suppression avant envoi ----
     L'upload réel vers un stockage est volontairement derrière
     l'abstraction submitLead — voir TODO dans api/lead.php. */
  var photoInput = form.querySelector("#q-photos");
  var photoGrid = form.querySelector(".photo-grid");
  var addTile = form.querySelector(".photo-add");
  var MAX_PHOTOS = 6;

  function refreshPhotoTiles() {
    photoGrid.querySelectorAll(".photo-tile").forEach(function (t) { t.remove(); });
    lead.photos.forEach(function (p, idx) {
      var tile = document.createElement("div");
      tile.className = "photo-tile";
      var img = document.createElement("img");
      img.alt = "Photo ajoutée " + (idx + 1) + " (aperçu local)";
      img.src = p.dataUrl;
      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "photo-tile__remove";
      rm.setAttribute("aria-label", "Retirer cette photo");
      rm.textContent = "✕";
      rm.addEventListener("click", function () {
        lead.photos.splice(idx, 1);
        refreshPhotoTiles();
      });
      tile.appendChild(img);
      tile.appendChild(rm);
      photoGrid.insertBefore(tile, addTile);
    });
    addTile.hidden = lead.photos.length >= MAX_PHOTOS;
  }

  if (photoInput) {
    photoInput.addEventListener("change", function () {
      Array.prototype.slice.call(photoInput.files || []).forEach(function (file) {
        if (!/^image\//.test(file.type)) return;
        if (lead.photos.length >= MAX_PHOTOS) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
          lead.photos.push({ name: file.name, size: file.size, type: file.type, dataUrl: ev.target.result });
          refreshPhotoTiles();
        };
        reader.readAsDataURL(file);
      });
      photoInput.value = "";
    });
  }

  /* =========================================================
     ENVOI — abstraction submitLead.
     MODE DEMO : rien ne part nulle part, simple simulation.
     MODE LIVE : POST JSON vers l'endpoint serveur configuré
     (api/lead.php), qui garde les clés API côté serveur.
     ========================================================= */
  function buildLead() {
    collect();
    lead.createdAt = new Date().toISOString();
    lead.source = "website:" + (CFG.slug || "");
    return lead;
  }

  function submitLead(theLead) {
    if (DEMO) {
      // Démonstration : aucune transmission, aucune conservation.
      return Promise.resolve({ ok: true, demo: true });
    }
    var endpoint = (CFG.integrations && CFG.integrations.leadEndpoint) || "api/lead.php";
    var payload = Object.assign({}, theLead, {
      // Les photos partent en métadonnées uniquement pour l'instant.
      // TODO: upload réel des fichiers quand le stockage sera choisi
      // (multipart vers lead.php ou stockage dédié).
      photos: theLead.photos.map(function (p) { return { name: p.name, size: p.size, type: p.type }; }),
      photoCount: theLead.photos.length,
    });
    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }
  window.submitLead = submitLead;

  function submit() {
    var theLead = buildLead();
    if (nextBtn) { nextBtn.disabled = true; nextBtn.textContent = "Envoi en cours…"; }
    submitLead(theLead)
      .then(function () {
        track("quote_complete", { projectType: theLead.projectType || "" });
        fillRecap(theLead);
        clearDraft();
        goTo(steps.length - 1);
      })
      .catch(function () {
        showError(steps[current], "L'envoi a échoué. Réessayez, ou appelez-nous directement.");
        track("quote_error");
      })
      .finally(function () {
        if (nextBtn) { nextBtn.disabled = false; nextBtn.textContent = "Envoyer ma demande"; }
      });
  }

  function fillRecap(theLead) {
    var map = {
      "recap-projet": theLead.projectType || "—",
      "recap-lieu": [theLead.city, theLead.postalCode].filter(Boolean).join(" — ") || "—",
      "recap-surface": theLead.surface || "—",
      "recap-budget": theLead.budget || "—",
      "recap-delai": theLead.timeframe || "—",
      "recap-photos": theLead.photos.length
        ? theLead.photos.length + (theLead.photos.length > 1 ? " photos" : " photo")
        : "Aucune",
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = map[id];
    });
  }

  var restart = form.querySelector(".quote-restart");
  if (restart) restart.addEventListener("click", function () {
    clearDraft();
    lead.photos = [];
    refreshPhotoTiles();
    goTo(0, { silent: true });
  });

  /* ---- Restauration d'un brouillon éventuel ---- */
  loadDraft();
  ["projet", "surface", "budget", "delai"].forEach(function (groupName) {
    var key = CHOICE_KEYS[groupName];
    if (!lead[key]) return;
    var group = form.querySelector('[data-answer="' + groupName + '"]');
    if (!group) return;
    group.querySelectorAll(".choice").forEach(function (c) {
      c.setAttribute("aria-pressed", c.getAttribute("data-value") === lead[key] ? "true" : "false");
    });
  });
  if (lead.city) setVal("#q-ville", lead.city);
  if (lead.postalCode) setVal("#q-cp", lead.postalCode);
  if (lead.description) setVal("#q-desc", lead.description);
  if (lead.firstName) setVal("#q-prenom", lead.firstName);
  if (lead.lastName) setVal("#q-nom", lead.lastName);
  if (lead.phone) setVal("#q-tel", lead.phone);
  if (lead.email) setVal("#q-email", lead.email);
  function setVal(sel, v) { var el = form.querySelector(sel); if (el) el.value = v; }

  render();
})();
