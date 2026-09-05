"use client";

// Le simulateur côté particulier : parcours en étapes, pensé mobile.
// 1. Type de projet  2. Questions  3. Photos  4. Estimation  5. Coordonnées
import { useState, useTransition } from "react";
import type { Question } from "@/lib/catalogue";
import { DELAIS } from "@/lib/catalogue";
import { formatEuros } from "@/lib/format";
import { compresserImage } from "@/lib/image";
import { creerSimulation, enregistrerLead } from "./actions";

type TypeAffiche = {
  id: string; libelle: string; emoji: string; description: string;
  estimable: boolean; questions: Question[];
};

type Props = {
  slug: string;
  entreprise: {
    nom: string;
    couleur: string;
    logo: string | null;
    telephone: string | null;
    zone: string | null;
  };
  types: TypeAffiche[];
};

type Ecran = "type" | "questions" | "photos" | "estimation" | "coordonnees" | "merci";

export function Simulateur({ slug, entreprise, types }: Props) {
  const [ecran, setEcran] = useState<Ecran>("type");
  const [type, setType] = useState<TypeAffiche | null>(null);
  const [reponses, setReponses] = useState<Record<string, string | number>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [simulationId, setSimulationId] = useState<number | null>(null);
  const [estimation, setEstimation] = useState<{ min: number; max: number; facteurs: string[] } | null>(null);
  const [lead, setLead] = useState({
    prenom: "", nom: "", email: "", telephone: "",
    codePostal: "", commune: "", delai: "des-que-possible", budgetMax: "",
  });
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const majLead = (champ: keyof typeof lead, valeur: string) =>
    setLead((prev) => ({ ...prev, [champ]: valeur }));

  // --- Navigation ---
  const choisirType = (t: TypeAffiche) => {
    setType(t);
    setErreur(null);
    // Pré-remplit les quantités avec leur valeur par défaut
    const initiales: Record<string, string | number> = {};
    for (const q of t.questions) if (q.type === "nombre") initiales[q.id] = q.defaut;
    setReponses(initiales);
    setEcran(t.questions.length > 0 ? "questions" : "photos");
  };

  const validerQuestions = () => {
    if (!type) return;
    for (const q of type.questions) {
      if (q.type === "choix" && !reponses[q.id]) {
        return setErreur("Merci de répondre à toutes les questions.");
      }
    }
    setErreur(null);
    setEcran("photos");
  };

  const lancerSimulation = () => {
    if (!type) return;
    setErreur(null);
    demarrer(async () => {
      const resultat = await creerSimulation(slug, type.id, reponses, photos);
      if ("erreur" in resultat) return setErreur(resultat.erreur);
      setSimulationId(resultat.simulationId);
      setEstimation(resultat.estimation);
      setEcran(resultat.estimation ? "estimation" : "coordonnees");
    });
  };

  const envoyerLead = () => {
    if (simulationId == null) return;
    setErreur(null);
    demarrer(async () => {
      const resultat = await enregistrerLead(simulationId, lead);
      if (resultat.erreur) return setErreur(resultat.erreur);
      setEcran("merci");
    });
  };

  const ajouterPhotos = async (fichiers: FileList | null) => {
    if (!fichiers) return;
    const nouvelles: string[] = [];
    for (const f of Array.from(fichiers).slice(0, 3 - photos.length)) {
      try { nouvelles.push(await compresserImage(f, 1200)); } catch { /* image illisible */ }
    }
    setPhotos((prev) => [...prev, ...nouvelles].slice(0, 3));
  };

  // --- Rendu ---
  const classeChamp = "mt-1 w-full rounded-lg border border-stone-300 px-3 py-3 text-base";
  const boutonPrincipal =
    "w-full rounded-xl px-5 py-4 text-lg font-semibold text-white shadow transition hover:brightness-110 disabled:opacity-50";

  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 py-6" style={{ ["--marque" as string]: entreprise.couleur }}>
      {/* En-tête white-label */}
      <header className="mb-6 flex items-center gap-3">
        {entreprise.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entreprise.logo} alt={entreprise.nom} className="h-12 max-w-[140px] object-contain" />
        ) : (
          <span className="text-2xl">🌿</span>
        )}
        <div>
          <p className="font-bold leading-tight">{entreprise.nom}</p>
          {entreprise.zone && <p className="text-xs text-stone-500">{entreprise.zone}</p>}
        </div>
      </header>

      {/* Écran 1 : type de projet */}
      {ecran === "type" && (
        <div>
          <h1 className="text-2xl font-bold">Quel projet souhaitez-vous réaliser ?</h1>
          <p className="mt-1 text-stone-600">Obtenez une estimation de budget en 2 minutes.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {types.map((t) => (
              <button key={t.id} type="button" onClick={() => choisirType(t)}
                className="rounded-xl border-2 border-stone-200 bg-white p-4 text-left transition hover:border-[var(--marque)] hover:shadow">
                <span className="text-3xl">{t.emoji}</span>
                <span className="mt-1 block font-semibold">{t.libelle}</span>
                <span className="block text-xs text-stone-500">{t.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Écran 2 : questions dynamiques */}
      {ecran === "questions" && type && (
        <div>
          <BoutonRetour onClick={() => setEcran("type")} />
          <h1 className="text-2xl font-bold">{type.emoji} {type.libelle}</h1>
          <div className="mt-5 space-y-5">
            {type.questions.map((q) =>
              q.type === "nombre" ? (
                <div key={q.id}>
                  <label className="font-medium" htmlFor={`q-${q.id}`}>{q.libelle}</label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      id={`q-${q.id}`} type="range" min={q.min} max={q.max}
                      value={Number(reponses[q.id] ?? q.defaut)}
                      onChange={(e) => setReponses({ ...reponses, [q.id]: Number(e.target.value) })}
                      className="flex-1 accent-[var(--marque)]"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number" inputMode="numeric" min={q.min} max={q.max}
                        value={String(reponses[q.id] ?? q.defaut)}
                        onChange={(e) => setReponses({ ...reponses, [q.id]: Number(e.target.value) })}
                        className="w-20 rounded-lg border border-stone-300 px-2 py-2 text-right text-base"
                      />
                      <span className="text-stone-500">{q.unite}</span>
                    </div>
                  </div>
                  {q.aide && <p className="text-xs text-stone-400">{q.aide}</p>}
                </div>
              ) : (
                <div key={q.id}>
                  <p className="font-medium">{q.libelle}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {q.options.map((o) => {
                      const choisi = reponses[q.id] === o.id;
                      return (
                        <button key={o.id} type="button"
                          onClick={() => setReponses({ ...reponses, [q.id]: o.id })}
                          className={`rounded-lg border-2 px-3 py-3 text-sm font-medium transition ${
                            choisi ? "border-[var(--marque)] bg-stone-50" : "border-stone-200 bg-white hover:border-stone-300"
                          }`}>
                          {o.libelle}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
          {erreur && <Erreur texte={erreur} />}
          <button type="button" onClick={validerQuestions}
            className={`mt-6 ${boutonPrincipal}`} style={{ background: "var(--marque)" }}>
            Continuer
          </button>
        </div>
      )}

      {/* Écran 3 : photos (optionnel) */}
      {ecran === "photos" && type && (
        <div>
          <BoutonRetour onClick={() => setEcran(type.questions.length > 0 ? "questions" : "type")} />
          <h1 className="text-2xl font-bold">Des photos de votre terrain ?</h1>
          <p className="mt-1 text-stone-600">
            Facultatif, mais très utile pour préparer une étude précise (3 max).
          </p>

          {!type.estimable && (
            <label className="mt-4 block">
              <span className="font-medium">Décrivez votre projet</span>
              <textarea
                rows={3}
                value={String(reponses.description ?? "")}
                onChange={(e) => setReponses({ ...reponses, description: e.target.value })}
                placeholder="Ex : création d'un bassin avec cascade…"
                className={classeChamp}
              />
            </label>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt={`Photo ${i + 1}`} className="aspect-square w-full rounded-lg object-cover" />
                <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                  aria-label="Retirer la photo"
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">✕</button>
              </div>
            ))}
            {photos.length < 3 && (
              <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-3xl text-stone-400 hover:border-[var(--marque)]">
                +
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => ajouterPhotos(e.target.files)} />
              </label>
            )}
          </div>

          {erreur && <Erreur texte={erreur} />}
          <button type="button" onClick={lancerSimulation} disabled={enCours}
            className={`mt-6 ${boutonPrincipal}`} style={{ background: "var(--marque)" }}>
            {enCours ? "Calcul en cours…" : type.estimable ? "Voir mon estimation →" : "Continuer →"}
          </button>
        </div>
      )}

      {/* Écran 4 : estimation */}
      {ecran === "estimation" && estimation && type && (
        <div className="text-center">
          <p className="text-stone-600">Votre projet {type.libelle.toLowerCase()} est estimé entre</p>
          <p className="mt-3 text-4xl font-extrabold tracking-tight" style={{ color: "var(--marque)" }}>
            {formatEuros(estimation.min)}
            <span className="text-stone-400"> et </span>
            {formatEuros(estimation.max)}
          </p>
          {estimation.facteurs.length > 0 && (
            <p className="mx-auto mt-4 max-w-sm text-sm text-stone-600">
              Cette fourchette tient compte de vos choix : {estimation.facteurs.join(", ")}.
            </p>
          )}
          <p className="mx-auto mt-4 max-w-sm rounded-lg bg-stone-100 px-4 py-3 text-xs text-stone-500">
            Cette estimation est indicative et ne constitue pas un devis. Une
            visite ou une étude du projet peut être nécessaire pour établir le
            tarif définitif.
          </p>
          <button type="button" onClick={() => setEcran("coordonnees")}
            className={`mt-6 ${boutonPrincipal}`} style={{ background: "var(--marque)" }}>
            Recevoir une étude précise de mon projet
          </button>
        </div>
      )}

      {/* Écran 5 : coordonnées */}
      {ecran === "coordonnees" && (
        <div>
          <BoutonRetour onClick={() => setEcran(estimation ? "estimation" : "photos")} />
          <h1 className="text-2xl font-bold">Dernière étape ✨</h1>
          <p className="mt-1 text-stone-600">
            {entreprise.nom} vous recontacte pour affiner votre projet.
          </p>
          <div className="mt-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-sm text-stone-600">Prénom *</span>
                <input type="text" value={lead.prenom} onChange={(e) => majLead("prenom", e.target.value)} className={classeChamp} /></label>
              <label className="block"><span className="text-sm text-stone-600">Nom *</span>
                <input type="text" value={lead.nom} onChange={(e) => majLead("nom", e.target.value)} className={classeChamp} /></label>
            </div>
            <label className="block"><span className="text-sm text-stone-600">Email *</span>
              <input type="email" inputMode="email" value={lead.email} onChange={(e) => majLead("email", e.target.value)} className={classeChamp} /></label>
            <label className="block"><span className="text-sm text-stone-600">Téléphone *</span>
              <input type="tel" inputMode="tel" value={lead.telephone} onChange={(e) => majLead("telephone", e.target.value)} className={classeChamp} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-sm text-stone-600">Code postal *</span>
                <input type="text" inputMode="numeric" maxLength={5} value={lead.codePostal} onChange={(e) => majLead("codePostal", e.target.value)} className={classeChamp} /></label>
              <label className="block"><span className="text-sm text-stone-600">Commune</span>
                <input type="text" value={lead.commune} onChange={(e) => majLead("commune", e.target.value)} className={classeChamp} /></label>
            </div>
            <label className="block"><span className="text-sm text-stone-600">Quand souhaitez-vous réaliser ce projet ?</span>
              <select value={lead.delai} onChange={(e) => majLead("delai", e.target.value)} className={classeChamp}>
                {DELAIS.map((d) => <option key={d.id} value={d.id}>{d.libelle}</option>)}
              </select></label>
            <label className="block"><span className="text-sm text-stone-600">Budget maximum envisagé (optionnel)</span>
              <input type="text" inputMode="numeric" value={lead.budgetMax} onChange={(e) => majLead("budgetMax", e.target.value)}
                placeholder="Ex : 10 000 €" className={classeChamp} /></label>
          </div>
          {erreur && <Erreur texte={erreur} />}
          <button type="button" onClick={envoyerLead} disabled={enCours}
            className={`mt-6 ${boutonPrincipal}`} style={{ background: "var(--marque)" }}>
            {enCours ? "Envoi…" : "Recevoir une étude précise de mon projet"}
          </button>
          <p className="mt-2 text-center text-xs text-stone-400">
            Vos coordonnées sont transmises uniquement à {entreprise.nom}.
          </p>
        </div>
      )}

      {/* Écran final */}
      {ecran === "merci" && (
        <div className="py-12 text-center">
          <p className="text-5xl">✅</p>
          <h1 className="mt-4 text-2xl font-bold">Demande envoyée !</h1>
          <p className="mx-auto mt-2 max-w-sm text-stone-600">
            {entreprise.nom} a bien reçu votre projet et vous recontacte
            rapidement pour une étude précise.
          </p>
          {entreprise.telephone && (
            <p className="mt-4 text-sm text-stone-500">
              Un renseignement ?{" "}
              <a href={`tel:${entreprise.telephone}`} className="font-semibold" style={{ color: "var(--marque)" }}>
                {entreprise.telephone}
              </a>
            </p>
          )}
        </div>
      )}

      {/* Mention discrète (désactivable plus tard selon l'abonnement) */}
      <footer className="mt-10 pb-4 text-center text-xs text-stone-300">
        Propulsé par Paysage Digital
      </footer>
    </div>
  );
}

function BoutonRetour({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mb-2 text-sm text-stone-500 hover:underline">
      ← Retour
    </button>
  );
}

function Erreur({ texte }: { texte: string }) {
  return (
    <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-red-700 ring-1 ring-red-200">{texte}</p>
  );
}
