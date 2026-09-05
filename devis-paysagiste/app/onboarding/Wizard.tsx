"use client";

// Wizard de création du simulateur :
// 1. Votre entreprise  2. Vos prestations  3. Vos prix  4. Personnalisation
import { useState, useTransition } from "react";
import { CATALOGUE } from "@/lib/catalogue";
import { creerEntreprise } from "./actions";
import { compresserImage } from "@/lib/image";

const ETAPES = ["Votre entreprise", "Vos prestations", "Vos prix", "Personnalisation"];

export function Wizard() {
  const [etape, setEtape] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  // Étape 1 — infos entreprise
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [ville, setVille] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [zone, setZone] = useState("");

  // Étape 2 — types de projets activés
  const [actifs, setActifs] = useState<Set<string>>(
    new Set(["terrasse", "cloture", "engazonnement"])
  );

  // Étape 3 — fourchette de base par type (pré-remplie avec les défauts)
  const [prix, setPrix] = useState<Record<string, { min: string; max: string }>>(
    Object.fromEntries(
      CATALOGUE.filter((t) => t.estimable).map((t) => [
        t.id,
        { min: String(t.baseDefaut!.min), max: String(t.baseDefaut!.max) },
      ])
    )
  );

  // Étape 4 — branding
  const [couleur, setCouleur] = useState("#166534");
  const [logo, setLogo] = useState<string | null>(null);

  const basculer = (id: string) => {
    setActifs((prev) => {
      const suivant = new Set(prev);
      if (suivant.has(id)) suivant.delete(id);
      else suivant.add(id);
      return suivant;
    });
  };

  const valider = () => {
    setErreur(null);
    if (etape === 0 && !nom.trim()) return setErreur("Le nom de l'entreprise est obligatoire.");
    if (etape === 1 && actifs.size === 0) return setErreur("Activez au moins un type de projet.");
    if (etape < 3) return setEtape(etape + 1);

    // Dernière étape : envoi
    demarrer(async () => {
      const enNombre = (s: string) => Number(s.replace(",", "."));
      const resultat = await creerEntreprise({
        nom, telephone, email, ville, codePostal, zone, couleur, logo,
        prestations: [...actifs].map((id) => ({
          typeProjet: id,
          base: { min: enNombre(prix[id]?.min ?? "0"), max: enNombre(prix[id]?.max ?? "0") },
        })),
      });
      if (resultat?.erreur) setErreur(resultat.erreur);
    });
  };

  const typesEstimables = CATALOGUE.filter((t) => actifs.has(t.id) && t.estimable);

  return (
    <div className="mx-auto max-w-xl px-4 py-8 pb-32">
      {/* Barre de progression */}
      <p className="text-sm font-medium text-green-700">
        Étape {etape + 1} / {ETAPES.length}
      </p>
      <div className="mt-2 flex gap-1">
        {ETAPES.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= etape ? "bg-green-600" : "bg-stone-200"}`} />
        ))}
      </div>
      <h1 className="mt-4 text-2xl font-bold">{ETAPES[etape]}</h1>

      {/* Étape 1 : entreprise */}
      {etape === 0 && (
        <div className="mt-6 space-y-4">
          <Champ libelle="Nom de l'entreprise *" valeur={nom} onChange={setNom} placeholder="Ex : Au Jardin Vert" />
          <div className="grid grid-cols-2 gap-3">
            <Champ libelle="Ville" valeur={ville} onChange={setVille} placeholder="Ex : Pau" />
            <Champ libelle="Code postal" valeur={codePostal} onChange={setCodePostal} placeholder="64000" />
          </div>
          <Champ libelle="Téléphone" valeur={telephone} onChange={setTelephone} placeholder="06 12 34 56 78" />
          <Champ libelle="Email" valeur={email} onChange={setEmail} placeholder="contact@monentreprise.fr" />
          <Champ libelle="Zone d'intervention" valeur={zone} onChange={setZone} placeholder="Ex : Pau et 30 km alentour" />
        </div>
      )}

      {/* Étape 2 : prestations */}
      {etape === 1 && (
        <div className="mt-6">
          <p className="text-stone-600">Quels types de projets réalisez-vous ?</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {CATALOGUE.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => basculer(t.id)}
                className={`rounded-xl border-2 p-4 text-left transition ${
                  actifs.has(t.id)
                    ? "border-green-600 bg-green-50"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <span className="text-2xl">{t.emoji}</span>
                <span className="mt-1 block font-semibold">{t.libelle}</span>
                <span className="block text-xs text-stone-500">{t.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Étape 3 : prix de base */}
      {etape === 2 && (
        <div className="mt-6 space-y-4">
          <p className="text-stone-600">
            Votre fourchette de prix par {""}
            <strong>unité</strong> pour chaque projet (HT, pose comprise).
            Les valeurs proposées sont des moyennes France — ajustez selon vos
            tarifs. Vous pourrez affiner les coefficients (matériaux, accès…)
            ensuite.
          </p>
          {typesEstimables.map((t) => (
            <div key={t.id} className="rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
              <p className="font-semibold">{t.emoji} {t.libelle}</p>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span>de</span>
                <input
                  type="number" min="0" inputMode="decimal"
                  value={prix[t.id].min}
                  onChange={(e) => setPrix({ ...prix, [t.id]: { ...prix[t.id], min: e.target.value } })}
                  className="w-24 rounded-lg border border-stone-300 px-3 py-2 text-base"
                />
                <span>à</span>
                <input
                  type="number" min="0" inputMode="decimal"
                  value={prix[t.id].max}
                  onChange={(e) => setPrix({ ...prix, [t.id]: { ...prix[t.id], max: e.target.value } })}
                  className="w-24 rounded-lg border border-stone-300 px-3 py-2 text-base"
                />
                <span className="text-stone-500">€ / {t.unite}</span>
              </div>
            </div>
          ))}
          {actifs.has("autre") && (
            <p className="text-sm text-stone-500">
              « Autre projet » n&apos;a pas de tarif : le visiteur décrit son idée et
              vous laisse directement ses coordonnées.
            </p>
          )}
        </div>
      )}

      {/* Étape 4 : personnalisation */}
      {etape === 3 && (
        <div className="mt-6 space-y-5">
          <p className="text-stone-600">
            Le simulateur portera vos couleurs : vos clients auront
            l&apos;impression d&apos;utiliser <strong>votre</strong> outil.
          </p>
          <div>
            <span className="text-sm text-stone-600">Couleur principale</span>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="color"
                value={couleur}
                onChange={(e) => setCouleur(e.target.value)}
                className="h-12 w-20 cursor-pointer rounded-lg border border-stone-300"
              />
              <span className="text-sm text-stone-500">{couleur}</span>
            </div>
          </div>
          <div>
            <span className="text-sm text-stone-600">Logo (optionnel)</span>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const fichier = e.target.files?.[0];
                if (fichier) setLogo(await compresserImage(fichier, 300));
              }}
              className="mt-1 block w-full text-sm"
            />
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="Aperçu du logo" className="mt-2 h-16 rounded-lg bg-white object-contain p-1 ring-1 ring-stone-200" />
            )}
          </div>
        </div>
      )}

      {erreur && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-red-700 ring-1 ring-red-200">{erreur}</p>
      )}

      {/* Navigation */}
      <div className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white p-3">
        <div className="mx-auto flex max-w-xl gap-3">
          {etape > 0 && (
            <button
              type="button"
              onClick={() => setEtape(etape - 1)}
              className="rounded-xl px-5 py-4 font-medium text-stone-600 hover:bg-stone-100"
            >
              ← Retour
            </button>
          )}
          <button
            type="button"
            onClick={valider}
            disabled={enCours}
            className="flex-1 rounded-xl bg-green-700 px-5 py-4 text-lg font-semibold text-white shadow hover:bg-green-800 disabled:opacity-50"
          >
            {enCours ? "Création…" : etape < 3 ? "Continuer" : "Créer mon simulateur 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Champ({
  libelle, valeur, onChange, placeholder,
}: {
  libelle: string; valeur: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-stone-600">{libelle}</span>
      <input
        type="text"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-3 text-base"
      />
    </label>
  );
}
