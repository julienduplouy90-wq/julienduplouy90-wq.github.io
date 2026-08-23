/* =============================================================
   Comportements du site : branding, analytics, animations,
   démonstration interactive du formulaire de devis.
   Aucune donnée n'est envoyée à un serveur : tout reste
   dans le navigateur du visiteur.
   ============================================================= */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};

  /* ---------- Branding centralisé ---------- */
  document.querySelectorAll("[data-brand]").forEach(function (el) {
    el.textContent = CFG.brandName || el.textContent;
  });
  document.querySelectorAll("[data-brand-tagline]").forEach(function (el) {
    el.textContent = CFG.brandTagline || el.textContent;
  });
  document.querySelectorAll("[data-contact-mailto]").forEach(function (el) {
    if (CFG.contactEmail) {
      el.setAttribute(
        "href",
        "mailto:" + CFG.contactEmail + "?subject=" +
          encodeURIComponent("Découvrir le système — " + (CFG.brandTagline || ""))
      );
    }
  });
  document.querySelectorAll("[data-booking-link]").forEach(function (el) {
    if (CFG.bookingUrl) {
      el.setAttribute("href", CFG.bookingUrl);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    }
    // sinon : le lien garde son href mailto par défaut.
  });

  /* ---------- Analytics (architecture, sans service externe) ----------
     Tous les événements partent dans window.dataLayer.
     Pour brancher un outil plus tard :
       - GA4  : charger gtag.js, les push dataLayer sont déjà compatibles.
       - Plausible : s'abonner ici et appeler window.plausible(event, {props}).
  ------------------------------------------------------------------- */
  window.dataLayer = window.dataLayer || [];
  function track(eventName, props) {
    var payload = Object.assign({ event: eventName }, props || {});
    window.dataLayer.push(payload);
    if (CFG.debugAnalytics && window.console) {
      console.info("[analytics]", eventName, props || {});
    }
  }
  window.siteTrack = track;

  // Clics traqués de façon déclarative : <a data-track="cta_hero">
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-track]");
    if (el) track(el.getAttribute("data-track"));
  });

  // Scroll important (75 % de la page vue une fois)
  var scrollSent = false;
  function onScroll() {
    if (scrollSent) return;
    var h = document.documentElement;
    var ratio = (h.scrollTop + window.innerHeight) / h.scrollHeight;
    if (ratio > 0.75) {
      scrollSent = true;
      track("scroll_75");
      window.removeEventListener("scroll", onScroll);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Animations d'apparition ---------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Démonstration : formulaire de devis ---------- */
  var demo = document.getElementById("demo-form");
  if (!demo) return;

  var steps = Array.prototype.slice.call(demo.querySelectorAll(".demo-step"));
  var fill = demo.querySelector(".demo-progress__fill");
  var label = demo.querySelector(".demo-progress__label");
  var backBtn = demo.querySelector(".demo-back");
  var nextBtn = demo.querySelector(".demo-next");
  var current = 0;
  var started = false;
  var completed = false;

  // Réponses de la démo (rien ne quitte le navigateur)
  var answers = {
    projet: null,
    lieu: "",
    surface: null,
    budget: null,
    delai: null,
    photos: 0,
    nom: "",
    tel: "",
    email: "",
  };

  function stepName(i) {
    return steps[i] ? steps[i].getAttribute("data-step") : null;
  }

  function render() {
    steps.forEach(function (s, i) {
      s.classList.toggle("is-active", i === current);
    });
    var total = steps.length;
    var pct = Math.round(((current + 1) / total) * 100);
    if (fill) fill.style.width = pct + "%";
    if (label) {
      label.textContent =
        current === total - 1
          ? "Demande complète"
          : "Étape " + (current + 1) + " sur " + (total - 1);
    }
    if (backBtn) backBtn.hidden = current === 0 || current === total - 1;
    if (nextBtn) {
      nextBtn.hidden = current === total - 1;
      nextBtn.textContent = current === total - 2 ? "Voir le résultat" : "Continuer";
    }
    // focus sur la question pour l'accessibilité
    var q = steps[current].querySelector(".demo-step__q");
    if (q) q.setAttribute("tabindex", "-1");
    if (q && started) q.focus({ preventScroll: true });
  }

  function goTo(i) {
    if (!started) {
      started = true;
      track("demo_start");
    }
    current = Math.max(0, Math.min(steps.length - 1, i));
    if (current === steps.length - 1 && !completed) {
      completed = true;
      buildRecap();
      track("demo_complete");
    }
    render();
  }

  // Choix par boutons (projet, surface, budget, délai)
  demo.addEventListener("click", function (e) {
    var choice = e.target.closest(".choice");
    if (!choice) return;
    var group = choice.closest("[data-answer]");
    if (!group) return;
    var key = group.getAttribute("data-answer");
    group.querySelectorAll(".choice").forEach(function (c) {
      c.setAttribute("aria-pressed", c === choice ? "true" : "false");
    });
    answers[key] = choice.getAttribute("data-value") || choice.textContent.trim();
    // avance automatiquement après un choix (petite pause pour voir la sélection)
    window.setTimeout(function () { goTo(current + 1); }, reduceMotion ? 0 : 220);
  });

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      collectFields();
      goTo(current + 1);
    });
  }
  if (backBtn) {
    backBtn.addEventListener("click", function () { goTo(current - 1); });
  }

  function collectFields() {
    var name = stepName(current);
    if (name === "lieu") {
      var cp = demo.querySelector("#demo-cp");
      var ville = demo.querySelector("#demo-ville");
      answers.lieu = [ville && ville.value.trim(), cp && cp.value.trim()]
        .filter(Boolean).join(" — ");
    }
    if (name === "coordonnees") {
      var nom = demo.querySelector("#demo-nom");
      var tel = demo.querySelector("#demo-tel");
      var email = demo.querySelector("#demo-email");
      answers.nom = nom ? nom.value.trim() : "";
      answers.tel = tel ? tel.value.trim() : "";
      answers.email = email ? email.value.trim() : "";
    }
  }

  // Coordonnées fictives en un clic (évite de saisir de vraies données)
  var fictiveBtn = demo.querySelector("#demo-fictive");
  if (fictiveBtn) {
    fictiveBtn.addEventListener("click", function () {
      var nom = demo.querySelector("#demo-nom");
      var tel = demo.querySelector("#demo-tel");
      var email = demo.querySelector("#demo-email");
      if (nom) nom.value = "Thomas Martin";
      if (tel) tel.value = "06 12 34 56 78";
      if (email) email.value = "thomas.martin@exemple.fr";
    });
  }

  /* Photos : prévisualisation locale uniquement (FileReader),
     ou vignettes d'exemple. Aucun envoi nulle part. */
  var photoInput = demo.querySelector("#demo-photos");
  var photoGrid = demo.querySelector(".photo-grid");
  var addTile = demo.querySelector(".photo-add");
  var sampleBtn = demo.querySelector("#demo-sample-photos");
  var MAX_PHOTOS = 6;

  function addPhotoTile(node) {
    if (answers.photos >= MAX_PHOTOS) return;
    photoGrid.insertBefore(node, addTile);
    answers.photos += 1;
    if (answers.photos >= MAX_PHOTOS) addTile.hidden = true;
  }

  if (photoInput) {
    photoInput.addEventListener("change", function () {
      Array.prototype.slice.call(photoInput.files || []).forEach(function (file) {
        if (!/^image\//.test(file.type)) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
          var tile = document.createElement("div");
          tile.className = "photo-tile";
          var img = document.createElement("img");
          img.alt = "Photo ajoutée (aperçu local)";
          img.src = ev.target.result;
          tile.appendChild(img);
          addPhotoTile(tile);
        };
        reader.readAsDataURL(file);
      });
      photoInput.value = "";
    });
  }
  if (sampleBtn) {
    sampleBtn.addEventListener("click", function () {
      var labels = ["Jardin actuel", "Accès terrain", "Inspiration", "Croquis"];
      var tile = document.createElement("div");
      tile.className = "photo-tile photo-tile--sample";
      tile.textContent = labels[answers.photos % labels.length];
      addPhotoTile(tile);
    });
  }

  /* Récapitulatif : ce que recevrait le paysagiste,
     construit à partir des réponses de la démo. */
  function buildRecap() {
    var map = {
      "recap-nom": answers.nom || "Thomas Martin",
      "recap-lieu": answers.lieu || "Pau — 64000",
      "recap-projet": answers.projet || "Aménagement complet",
      "recap-surface": answers.surface || "Environ 180 m²",
      "recap-budget": answers.budget || "10 000 – 20 000 €",
      "recap-delai": answers.delai || "Dans moins de 3 mois",
      "recap-photos": answers.photos > 0
        ? answers.photos + (answers.photos > 1 ? " photos jointes" : " photo jointe")
        : "Aucune photo (exemple : 4 photos)",
      "recap-tel": answers.tel || "06 12 34 56 78",
      "recap-email": answers.email || "thomas.martin@exemple.fr",
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = map[id];
    });
  }

  // Bouton "recommencer la démo"
  var restartBtn = demo.querySelector("#demo-restart");
  if (restartBtn) {
    restartBtn.addEventListener("click", function () {
      current = 0;
      completed = false;
      render();
    });
  }

  render();
})();
