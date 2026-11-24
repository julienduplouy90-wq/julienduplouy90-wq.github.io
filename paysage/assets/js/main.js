/* =============================================================
   Site Julien Duplouy — interactions
   - Valeurs de config.js injectées dans la page (data-cfg)
   - Démonstration du formulaire (paysagiste / chauffagiste)
     100 % dans le navigateur : rien n'est envoyé ni enregistré
   - Animations d'apparition, en-tête, événements analytics
   Fonctionne aussi sur les pages légales (éléments absents = ignoré).
   ============================================================= */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  window.dataLayer = window.dataLayer || [];
  function track(name) {
    window.dataLayer.push({ event: name });
    if (CFG.debugAnalytics) console.log("[analytics]", name);
  }

  /* ---------- Config ---------- */
  document.querySelectorAll("[data-cfg]").forEach(function (el) {
    var v = CFG[el.getAttribute("data-cfg")];
    if (v) el.textContent = v;
  });
  if (CFG.contactEmail) {
    document.querySelectorAll("[data-mailto]").forEach(function (a) {
      a.href = "mailto:" + CFG.contactEmail + "?subject=" + encodeURIComponent("Ma version gratuite");
    });
  }
  if (CFG.bookingUrl) {
    document.querySelectorAll("[data-booking]").forEach(function (a) {
      a.href = CFG.bookingUrl; a.hidden = false; a.target = "_blank"; a.rel = "noopener";
    });
  }
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  document.querySelectorAll("[data-track]").forEach(function (el) {
    el.addEventListener("click", function () { track(el.getAttribute("data-track")); });
  });

  /* ---------- Header ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  var scrolled75 = false;
  window.addEventListener("scroll", function () {
    if (scrolled75) return;
    var h = document.documentElement;
    if ((h.scrollTop + h.clientHeight) / h.scrollHeight > 0.75) { scrolled75 = true; track("scroll_75"); }
  }, { passive: true });

  /* ---------- Démonstration ---------- */
  var body = document.getElementById("demo-body");
  if (!body) return;

  var METIERS = {
    paysagiste: {
      company: "Votre entreprise de paysage",
      example: { name: "Thomas Martin", city: "Lescar", cp: "64230", phone: "06 12 34 56 78", email: "thomas.martin@exemple.fr" },
      steps: [
        { key: "projet", label: "Projet", q: "Quel est votre projet ?", help: "Choisissez ce qui s'en rapproche le plus.",
          options: ["Création complète d'un jardin", "Terrasse", "Clôture", "Allée", "Engazonnement", "Entretien", "Autre"] },
        { key: "lieu", label: "Lieu", type: "lieu", q: "Où se situe le projet ?", help: "Pour vérifier que vous êtes dans la zone d'intervention." },
        { key: "surface", label: "Surface", q: "Quelle surface, à peu près ?", help: "Une estimation suffit.",
          options: ["Moins de 50 m²", "50 à 150 m²", "150 à 300 m²", "300 à 1 000 m²", "Plus de 1 000 m²", "Je ne sais pas"] },
        { key: "budget", label: "Budget", q: "Quel budget envisagez-vous ?", help: "Une fourchette, pour orienter la proposition.",
          options: ["Moins de 2 000 €", "2 000 à 5 000 €", "5 000 à 10 000 €", "10 000 à 20 000 €", "20 000 € et plus", "Je ne sais pas encore"] },
        { key: "delai", label: "Délai", q: "Quand souhaitez-vous faire les travaux ?", help: "Cela aide à planifier les chantiers.",
          options: ["Dès que possible", "Dans moins de 3 mois", "Dans 3 à 6 mois", "Plus tard, je me renseigne"] },
        { key: "photos", label: "Photos", type: "photos", q: "Ajoutez quelques photos du terrain", help: "Facultatif, mais cela permet un premier avis bien plus précis." },
        { key: "contact", label: "Contact", type: "contact", q: "Vos coordonnées", help: "Pour que l'entreprise puisse vous rappeler. Utilisez des données fictives." }
      ]
    },
    chauffagiste: {
      company: "Votre entreprise de chauffage",
      example: { name: "Sophie Bernard", city: "Tarbes", cp: "65000", phone: "06 98 76 54 32", email: "sophie.bernard@exemple.fr" },
      steps: [
        { key: "besoin", label: "Besoin", q: "De quoi avez-vous besoin ?", help: "Choisissez ce qui correspond le mieux.",
          options: ["Une panne", "Un entretien", "Remplacer ma chaudière", "Installer une pompe à chaleur", "Climatisation", "Autre"] },
        { key: "appareil", label: "Appareil", q: "Quel est votre équipement ?", help: "Si vous ne savez pas, aucun problème.",
          options: ["Chaudière gaz", "Chaudière fioul", "Poêle ou chaudière à granulés", "Pompe à chaleur", "Climatisation", "Je ne sais pas"] },
        { key: "urgence", label: "Urgence", q: "C'est urgent ?", help: "Pour savoir qui rappeler en premier.",
          options: ["Oui, je n'ai plus de chauffage ou d'eau chaude", "Dans la semaine", "Pas pressé"] },
        { key: "lieu", label: "Lieu", type: "lieu", q: "Où se trouve le logement ?", help: "Pour vérifier que vous êtes dans la zone d'intervention." },
        { key: "photos", label: "Photos", type: "photos", q: "Une photo de l'appareil ou de la plaque", help: "Facultatif, mais cela aide à prévoir la bonne pièce." },
        { key: "rappel", label: "Rappel", q: "Quand préférez-vous être rappelé ?", help: "L'entreprise essaiera de respecter ce moment.",
          options: ["Le matin", "Entre midi et deux", "L'après-midi", "En fin de journée"] },
        { key: "contact", label: "Contact", type: "contact", q: "Vos coordonnées", help: "Pour que l'entreprise puisse vous rappeler. Utilisez des données fictives." }
      ]
    }
  };

  var EXAMPLE_ANSWERS = {
    paysagiste: { projet: "Terrasse", surface: "50 à 150 m²", budget: "5 000 à 10 000 €", delai: "Dans moins de 3 mois", photos: "3 photos jointes" },
    chauffagiste: { besoin: "Une panne", appareil: "Chaudière gaz", urgence: "Oui, je n'ai plus de chauffage ou d'eau chaude", photos: "1 photo jointe", rappel: "Le matin" }
  };

  var metier = "paysagiste", step = 0, answers = {}, started = false;
  var elStep = document.getElementById("demo-step");
  var elBar = document.getElementById("demo-bar");
  var elNext = document.getElementById("demo-next");
  var elBack = document.getElementById("demo-back");
  var elMail = document.getElementById("demo-mail");
  var elCompany = document.getElementById("demo-company");

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function current() { return METIERS[metier]; }

  function isValid(s) {
    var a = answers[s.key];
    if (s.type === "photos") return true;
    if (s.type === "lieu") return a && (a.cp || a.city);
    if (s.type === "contact") return a && a.name && (a.phone || a.email);
    return !!a;
  }

  function render() {
    var steps = current().steps;
    elCompany.textContent = current().company;
    if (step >= steps.length) { renderDone(); renderMail(); return; }
    var s = steps[step];
    elStep.textContent = "Étape " + (step + 1) + " sur " + steps.length;
    elBar.style.width = Math.round((step / steps.length) * 100) + "%";
    var html = '<div class="q">' + esc(s.q) + '</div><p class="q-help">' + esc(s.help) + "</p>";

    if (s.options) {
      html += '<div class="choices">' + s.options.map(function (o) {
        return '<button type="button" class="choice" aria-pressed="' + (answers[s.key] === o) + '" data-v="' + esc(o) + '">' + esc(o) + "</button>";
      }).join("") + "</div>";
    } else if (s.type === "lieu") {
      var l = answers.lieu || {};
      html += '<div class="fields"><label>Code postal<input inputmode="numeric" maxlength="5" data-f="cp" value="' + esc(l.cp || "") + '" placeholder="64000"></label>' +
              '<label>Commune<input data-f="city" value="' + esc(l.city || "") + '" placeholder="Pau"></label></div>';
    } else if (s.type === "photos") {
      var n = answers.photos ? parseInt(answers.photos, 10) : 0;
      html += '<button type="button" class="photo-drop' + (n ? " is-added" : "") + '" id="photo-add">' +
              (n ? "✓ " + n + " photo" + (n > 1 ? "s" : "") + " ajoutée" + (n > 1 ? "s" : "") + " (exemple)" : "＋ Ajouter une photo d'exemple") + "</button>";
    } else if (s.type === "contact") {
      var c = answers.contact || {};
      html += '<div class="fields"><label>Nom<input data-f="name" value="' + esc(c.name || "") + '" autocomplete="off"></label>' +
              '<label>Téléphone<input inputmode="tel" data-f="phone" value="' + esc(c.phone || "") + '" autocomplete="off"></label>' +
              '<label>E-mail<input type="email" data-f="email" value="' + esc(c.email || "") + '" autocomplete="off"></label></div>';
    }
    body.innerHTML = html;

    body.querySelectorAll(".choice").forEach(function (b) {
      b.addEventListener("click", function () {
        answers[s.key] = b.getAttribute("data-v");
        markStart();
        render(); renderMail();
        setTimeout(function () { if (step < current().steps.length) { step++; render(); } }, 220);
      });
    });
    body.querySelectorAll("input[data-f]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var obj = answers[s.key] || {};
        obj[inp.getAttribute("data-f")] = inp.value.trim();
        answers[s.key] = obj;
        markStart();
        elNext.disabled = !isValid(s);
        renderMail();
      });
    });
    var add = document.getElementById("photo-add");
    if (add) add.addEventListener("click", function () {
      var n = answers.photos ? parseInt(answers.photos, 10) : 0;
      n = Math.min(n + 1, 4);
      answers.photos = n + " photo" + (n > 1 ? "s" : "") + " jointe" + (n > 1 ? "s" : "");
      markStart(); render(); renderMail();
    });

    elBack.disabled = step === 0;
    elBack.style.visibility = step === 0 ? "hidden" : "visible";
    elNext.hidden = false;
    elNext.disabled = !isValid(s);
    elNext.textContent = step === steps.length - 1 ? "Envoyer ma demande" : "Continuer";
  }

  function renderDone() {
    elStep.textContent = "Demande envoyée";
    elBar.style.width = "100%";
    body.innerHTML = '<div class="done"><div class="done__check" aria-hidden="true">✓</div>' +
      '<div class="q">C\'est tout pour le client.</div>' +
      '<p class="q-help">Moins de deux minutes, et sa demande est bien plus précise qu\'un simple message. ' +
      'Regardez l\'e-mail que vous recevez.</p>' +
      '<p style="margin-top:20px"><button type="button" class="btn btn--ghost btn--sm" id="demo-restart">Recommencer</button></p></div>';
    document.getElementById("demo-restart").addEventListener("click", reset);
    elBack.style.visibility = "hidden";
    elNext.hidden = true;
    track("demo_complete");
  }

  function renderMail() {
    var m = current(), ex = m.example, def = EXAMPLE_ANSWERS[metier];
    var c = answers.contact || {}, l = answers.lieu || {};
    var name = c.name || ex.name;
    var short = name.split(" ")[0] + (name.split(" ")[1] ? " " + name.split(" ")[1].charAt(0) + "." : "");
    var place = ((l.city || ex.city) + " " + (l.cp || ex.cp)).trim();
    var rows = [];
    m.steps.forEach(function (s) {
      if (s.type === "contact") return;
      if (s.type === "lieu") { rows.push(["Lieu", place]); return; }
      rows.push([s.label, answers[s.key] || def[s.key] || "Aucune"]);
    });
    var typed = c.name || c.phone || c.email;
    rows.push(["Téléphone", c.phone || (typed ? "Non renseigné" : ex.phone)]);
    rows.push(["E-mail", c.email || (typed ? "Non renseigné" : ex.email)]);
    var urgent = metier === "chauffagiste" && /Oui/.test(answers.urgence || def.urgence);
    elMail.innerHTML =
      '<div class="mail__from">Formulaire de votre site · à l\'instant</div>' +
      '<div class="mail__subject">' + (urgent ? "🔴 Urgent · " : "") + "Nouvelle demande de devis — " + esc(short) + "</div>" +
      "<dl>" + rows.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>";
  }

  function markStart() { if (!started) { started = true; track("demo_start"); } }

  function reset() { step = 0; answers = {}; started = false; render(); renderMail(); }

  elNext.addEventListener("click", function () {
    var s = current().steps[step];
    if (s && isValid(s)) { step++; render(); renderMail(); }
  });
  elBack.addEventListener("click", function () { if (step > 0) { step--; render(); } });

  document.querySelectorAll("[data-metier]").forEach(function (b) {
    b.addEventListener("click", function () {
      metier = b.getAttribute("data-metier");
      document.querySelectorAll("[data-metier]").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
      track("demo_switch_" + metier);
      reset();
    });
  });

  // Lien direct vers la démo chauffagiste : julienduplouy.fr/#chauffagiste
  if (location.hash === "#chauffagiste") {
    var btn = document.querySelector('[data-metier="chauffagiste"]');
    if (btn) { btn.click(); setTimeout(function () { document.getElementById("demo").scrollIntoView(); }, 50); }
  }

  render(); renderMail();
})();
