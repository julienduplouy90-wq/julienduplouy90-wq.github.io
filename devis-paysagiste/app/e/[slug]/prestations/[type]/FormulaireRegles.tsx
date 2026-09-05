"use client";

// Édition des règles tarifaires d'un type de projet, avec un aperçu
// de fourchette recalculé en direct sur un exemple.
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { TypeProjet, ReglesTarifaires } from "@/lib/catalogue";
import { estimer } from "@/lib/moteur";
import { formatEuros } from "@/lib/format";
import { enregistrerRegles } from "../actions";

type Props = { slug: string; type: TypeProjet; regles: ReglesTarifaires };

export function FormulaireRegles({ slug, type, regles: initiales }: Props) {
  // Tout est manipulé en texte pour une saisie fluide, converti à l'envoi.
  const [baseMin, setBaseMin] = useState(String(initiales.base.min));
  const [baseMax, setBaseMax] = useState(String(initiales.base.max));
  const [coefs, setCoefs] = useState<Record<string, Record<string, string>>>(() => {
    const c: Record<string, Record<string, string>> = {};
    for (const q of type.questions) {
      if (q.type !== "choix") continue;
      c[q.id] = {};
      for (const o of q.options) {
        c[q.id][o.id] = String(initiales.coefficients?.[q.id]?.[o.id] ?? o.coefDefaut);
      }
    }
    return c;
  });
  const [message, setMessage] = useState<{ erreur?: string; ok?: boolean } | null>(null);
  const [enCours, demarrer] = useTransition();

  const enNombre = (s: string) => Number(String(s).replace(",", "."));

  const reglesActuelles = (): ReglesTarifaires => ({
    base: { min: enNombre(baseMin), max: enNombre(baseMax) },
    coefficients: Object.fromEntries(
      Object.entries(coefs).map(([q, options]) => [
        q,
        Object.fromEntries(Object.entries(options).map(([o, v]) => [o, enNombre(v)])),
      ])
    ),
  });

  // Aperçu : estimation d'un projet « standard » (quantité par défaut,
  // première option de chaque question).
  const apercu = useMemo(() => {
    const reponses: Record<string, string | number> = {};
    for (const q of type.questions) {
      reponses[q.id] = q.type === "nombre" ? q.defaut : q.options[0].id;
    }
    return { reponses, estimation: estimer(type.id, reponses, reglesActuelles()) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseMin, baseMax, coefs, type]);

  const questionQuantite = type.questions.find((q) => q.type === "nombre");

  const enregistrer = () => {
    setMessage(null);
    demarrer(async () => {
      const resultat = await enregistrerRegles(slug, type.id, reglesActuelles());
      setMessage(resultat);
    });
  };

  return (
    <div className="space-y-5 pb-28">
      <div>
        <Link href={`/e/${slug}/prestations`} className="text-sm text-stone-500 hover:underline">
          ← Prestations
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{type.emoji} {type.libelle} — vos prix</h1>
      </div>

      {/* Fourchette de base */}
      <section className="rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
        <h2 className="font-semibold">Prix de base (HT, pose comprise)</h2>
        <p className="text-sm text-stone-500">
          La fourchette par {type.unite} pour un chantier simple, avant coefficients.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span>de</span>
          <input type="number" min="0" inputMode="decimal" value={baseMin}
            onChange={(e) => setBaseMin(e.target.value)}
            className="w-24 rounded-lg border border-stone-300 px-3 py-2 text-base" />
          <span>à</span>
          <input type="number" min="0" inputMode="decimal" value={baseMax}
            onChange={(e) => setBaseMax(e.target.value)}
            className="w-24 rounded-lg border border-stone-300 px-3 py-2 text-base" />
          <span className="text-stone-500">€ / {type.unite}</span>
        </div>
      </section>

      {/* Coefficients par question à choix */}
      {type.questions.filter((q) => q.type === "choix").map((q) => (
        <section key={q.id} className="rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
          <h2 className="font-semibold">{q.libelle}</h2>
          <p className="text-sm text-stone-500">
            Coefficient appliqué au prix (1 = neutre, 1,2 = +20 %, 0,8 = −20 %).
          </p>
          <div className="mt-3 space-y-2">
            {q.options.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3">
                <span>{o.libelle}</span>
                <div className="flex items-center gap-2">
                  <span className="text-stone-400">×</span>
                  <input
                    type="number" step="0.05" min="0.05" max="10" inputMode="decimal"
                    value={coefs[q.id][o.id]}
                    onChange={(e) =>
                      setCoefs({ ...coefs, [q.id]: { ...coefs[q.id], [o.id]: e.target.value } })
                    }
                    className="w-20 rounded-lg border border-stone-300 px-2 py-2 text-right text-base"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Aperçu en direct */}
      <section className="rounded-xl bg-green-50 p-4 ring-1 ring-green-200">
        <h2 className="font-semibold">Aperçu</h2>
        <p className="text-sm text-stone-600">
          Exemple : {questionQuantite && `${questionQuantite.defaut} ${questionQuantite.unite}`}, options standard →{" "}
          {apercu.estimation ? (
            <strong>
              {formatEuros(apercu.estimation.min)} – {formatEuros(apercu.estimation.max)}
            </strong>
          ) : (
            "fourchette indisponible (vérifiez vos valeurs)"
          )}
        </p>
      </section>

      {message?.erreur && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700 ring-1 ring-red-200">{message.erreur}</p>
      )}
      {message?.ok && (
        <p className="rounded-lg bg-green-100 px-4 py-3 text-green-800 ring-1 ring-green-200">
          ✓ Prix enregistrés — votre simulateur est à jour.
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white p-3">
        <button
          type="button"
          onClick={enregistrer}
          disabled={enCours}
          className="mx-auto block w-full max-w-4xl rounded-xl bg-green-700 px-5 py-4 text-lg font-semibold text-white shadow hover:bg-green-800 disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : "Enregistrer mes prix"}
        </button>
      </div>
    </div>
  );
}
