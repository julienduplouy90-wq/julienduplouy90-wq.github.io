"use client";

// Réglages : identité, personnalisation du simulateur (white-label),
// seuils de qualification des prospects.
import { useState, useTransition } from "react";
import { enregistrerReglages, type ResultatReglages } from "./actions";
import { compresserImage } from "@/lib/image";

type Initiales = {
  nom: string; telephone: string; email: string; ville: string;
  codePostal: string; zone: string; couleur: string; logo: string | null;
  seuilPetit: number; seuilFort: number;
};

export function FormulaireReglages({ slug, initiales }: { slug: string; initiales: Initiales }) {
  const [v, setV] = useState(initiales);
  const [logoModifie, setLogoModifie] = useState(false);
  const [message, setMessage] = useState<ResultatReglages | null>(null);
  const [enCours, demarrer] = useTransition();

  const maj = (champ: keyof Initiales, valeur: string | number | null) =>
    setV((prev) => ({ ...prev, [champ]: valeur }));

  const enregistrer = () => {
    setMessage(null);
    demarrer(async () => {
      const resultat = await enregistrerReglages(slug, {
        nom: v.nom, telephone: v.telephone, email: v.email, ville: v.ville,
        codePostal: v.codePostal, zone: v.zone, couleur: v.couleur,
        logo: logoModifie ? (v.logo ?? "") : null,
        seuilPetit: Number(v.seuilPetit), seuilFort: Number(v.seuilFort),
      });
      setMessage(resultat);
    });
  };

  return (
    <div className="space-y-5 pb-28">
      <h1 className="text-2xl font-bold">Réglages</h1>

      <section className="space-y-3 rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
        <h2 className="font-semibold">Votre entreprise</h2>
        <Champ libelle="Nom commercial *" valeur={v.nom} onChange={(x) => maj("nom", x)} />
        <div className="grid grid-cols-2 gap-3">
          <Champ libelle="Ville" valeur={v.ville} onChange={(x) => maj("ville", x)} />
          <Champ libelle="Code postal" valeur={v.codePostal} onChange={(x) => maj("codePostal", x)} />
        </div>
        <Champ libelle="Téléphone" valeur={v.telephone} onChange={(x) => maj("telephone", x)} />
        <Champ libelle="Email" valeur={v.email} onChange={(x) => maj("email", x)} />
        <Champ libelle="Zone d'intervention" valeur={v.zone} onChange={(x) => maj("zone", x)}
          aide="Affichée aux visiteurs, ex : « Pau et 30 km alentour »" />
      </section>

      <section className="space-y-3 rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
        <h2 className="font-semibold">Apparence du simulateur</h2>
        <div>
          <span className="text-sm text-stone-600">Couleur principale</span>
          <div className="mt-1 flex items-center gap-3">
            <input type="color" value={v.couleur} onChange={(e) => maj("couleur", e.target.value)}
              className="h-12 w-20 cursor-pointer rounded-lg border border-stone-300" />
            <span className="text-sm text-stone-500">{v.couleur}</span>
          </div>
        </div>
        <div>
          <span className="text-sm text-stone-600">Logo</span>
          {v.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v.logo} alt="Logo actuel" className="mt-2 h-16 rounded-lg bg-white object-contain p-1 ring-1 ring-stone-200" />
          )}
          <div className="mt-2 flex items-center gap-3">
            <input
              type="file" accept="image/*" className="block w-full text-sm"
              onChange={async (e) => {
                const fichier = e.target.files?.[0];
                if (fichier) { maj("logo", await compresserImage(fichier, 300)); setLogoModifie(true); }
              }}
            />
            {v.logo && (
              <button type="button" className="text-sm text-red-600 hover:underline"
                onClick={() => { maj("logo", null); setLogoModifie(true); }}>
                Supprimer
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
        <h2 className="font-semibold">Qualification des prospects</h2>
        <p className="text-sm text-stone-600">
          Basée sur l&apos;estimation haute du projet.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>Petit projet en dessous de</span>
          <input type="number" min="0" value={v.seuilPetit}
            onChange={(e) => maj("seuilPetit", e.target.value === "" ? 0 : Number(e.target.value))}
            className="w-28 rounded-lg border border-stone-300 px-3 py-2 text-base" />
          <span>€ — forte valeur au-dessus de</span>
          <input type="number" min="0" value={v.seuilFort}
            onChange={(e) => maj("seuilFort", e.target.value === "" ? 0 : Number(e.target.value))}
            className="w-28 rounded-lg border border-stone-300 px-3 py-2 text-base" />
          <span>€</span>
        </div>
      </section>

      {message?.erreur && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700 ring-1 ring-red-200">{message.erreur}</p>
      )}
      {message?.ok && (
        <p className="rounded-lg bg-green-100 px-4 py-3 text-green-800 ring-1 ring-green-200">✓ Réglages enregistrés.</p>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white p-3">
        <button type="button" onClick={enregistrer} disabled={enCours}
          className="mx-auto block w-full max-w-4xl rounded-xl bg-green-700 px-5 py-4 text-lg font-semibold text-white shadow hover:bg-green-800 disabled:opacity-50">
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

function Champ({ libelle, valeur, onChange, aide }: {
  libelle: string; valeur: string; onChange: (v: string) => void; aide?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-stone-600">{libelle}</span>
      <input type="text" value={valeur} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-3 text-base" />
      {aide && <span className="text-xs text-stone-400">{aide}</span>}
    </label>
  );
}
