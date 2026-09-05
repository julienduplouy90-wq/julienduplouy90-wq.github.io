"use client";

// Page d'installation : le widget est une iframe (fiable partout),
// avec un bouton copier et des instructions par plateforme.
import { useState, useSyncExternalStore } from "react";

// L'URL publique dépend du domaine où le SaaS est déployé : on la lit
// côté navigateur ("" pendant le rendu serveur).
const lireOrigine = () => window.location.origin;
const aucunAbonnement = () => () => {};

export function Installation({ slug, bienvenue }: { slug: string; bienvenue: boolean }) {
  const origine = useSyncExternalStore(aucunAbonnement, lireOrigine, () => "");

  const urlSimulateur = `${origine}/s/${slug}`;
  const codeIframe = `<iframe src="${urlSimulateur}" style="width:100%;min-height:700px;border:0;border-radius:12px" title="Estimer mon projet" loading="lazy"></iframe>`;

  const [copie, setCopie] = useState<string | null>(null);
  const copier = async (texte: string, cle: string) => {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(cle);
      setTimeout(() => setCopie(null), 2000);
    } catch { /* presse-papier indisponible */ }
  };

  const plateformes = [
    { nom: "WordPress", etapes: "Ouvrez la page où placer le simulateur → ajoutez un bloc « HTML personnalisé » → collez le code → Publier." },
    { nom: "Wix", etapes: "Ajouter des éléments → Intégrer du code → « Intégrer HTML » → collez le code dans la fenêtre → ajustez la taille du cadre." },
    { nom: "Webflow", etapes: "Glissez un élément « Embed » sur votre page → collez le code → Publier." },
    { nom: "Hostinger", etapes: "Dans l'éditeur de site : Ajouter un élément → « Code d'intégration » (Embed code) → collez le code → Mettre à jour le site." },
  ];
  const [ouverte, setOuverte] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {bienvenue && (
        <div className="rounded-xl bg-green-50 p-4 ring-1 ring-green-200">
          <p className="font-semibold">🎉 Votre simulateur est créé !</p>
          <p className="text-sm text-stone-600">
            <strong>Gardez précieusement l&apos;adresse de cette page</strong> : c&apos;est
            votre espace de gestion. Dernière étape : testez votre simulateur
            ci-dessous, puis installez-le sur votre site.
          </p>
        </div>
      )}

      <h1 className="text-2xl font-bold">Installer mon simulateur</h1>

      {/* Lien public : tester + partager */}
      <section className="rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
        <h2 className="font-semibold">1. Testez-le</h2>
        <p className="text-sm text-stone-600">
          Votre simulateur est déjà en ligne — utilisable même sans site
          internet (partagez ce lien sur Facebook, Google Business, etc.).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            href={urlSimulateur || "#"}
            target="_blank"
            className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white shadow hover:bg-green-800"
          >
            ▶ Ouvrir mon simulateur
          </a>
          <button
            type="button"
            onClick={() => copier(urlSimulateur, "lien")}
            className="rounded-xl bg-stone-100 px-5 py-3 font-medium hover:bg-stone-200"
          >
            {copie === "lien" ? "✓ Copié !" : "Copier le lien"}
          </button>
        </div>
        <p className="mt-2 break-all font-mono text-xs text-stone-400">{urlSimulateur}</p>
      </section>

      {/* Code à coller */}
      <section className="rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
        <h2 className="font-semibold">2. Collez ce code sur votre site</h2>
        <p className="text-sm text-stone-600">
          Une seule ligne à coller à l&apos;endroit où le simulateur doit apparaître.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-stone-900 p-4 text-xs text-stone-100">{codeIframe}</pre>
        <button
          type="button"
          onClick={() => copier(codeIframe, "code")}
          className="mt-3 w-full rounded-xl bg-green-700 px-5 py-3 font-semibold text-white shadow hover:bg-green-800 sm:w-auto"
        >
          {copie === "code" ? "✓ Code copié !" : "📋 Copier le code"}
        </button>
      </section>

      {/* Instructions par plateforme */}
      <section className="rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
        <h2 className="font-semibold">3. Selon votre site</h2>
        <div className="mt-2 divide-y divide-stone-100">
          {plateformes.map((p) => (
            <div key={p.nom}>
              <button
                type="button"
                onClick={() => setOuverte(ouverte === p.nom ? null : p.nom)}
                className="flex w-full items-center justify-between py-3 text-left font-medium"
              >
                {p.nom}
                <span className="text-stone-400">{ouverte === p.nom ? "−" : "+"}</span>
              </button>
              {ouverte === p.nom && (
                <p className="pb-3 text-sm text-stone-600">{p.etapes}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Aperçu intégré */}
      <section>
        <h2 className="mb-2 font-semibold">Aperçu (tel que vos visiteurs le verront)</h2>
        {origine && (
          <iframe
            src={urlSimulateur}
            title="Aperçu du simulateur"
            className="h-[700px] w-full rounded-xl border-0 bg-white shadow ring-1 ring-stone-200"
          />
        )}
      </section>
    </div>
  );
}
