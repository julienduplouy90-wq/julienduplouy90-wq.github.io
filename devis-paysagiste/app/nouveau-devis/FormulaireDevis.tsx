"use client";

// Formulaire de création de devis : infos client + lignes de prestations
// avec calcul du sous-total et du total HT en temps réel.
import { useState, useTransition } from "react";
import { creerDevis } from "./actions";
import { formatEuros } from "@/lib/format";

type Prestation = {
  id: number;
  nom: string;
  unite: string;
  categorie: string;
  prixUnitaire: number;
};

type Ligne = {
  cle: number; // clé React stable pour la liste
  prestationTypeId: number | null;
  quantite: string; // gardé en texte pour une saisie fluide ("2,5")
};

let prochaineCle = 1;

export function FormulaireDevis({ prestations }: { prestations: Prestation[] }) {
  const [nomClient, setNomClient] = useState("");
  const [adresseChantier, setAdresseChantier] = useState("");
  const [notes, setNotes] = useState("");
  const [lignes, setLignes] = useState<Ligne[]>([
    { cle: prochaineCle++, prestationTypeId: null, quantite: "" },
  ]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrerTransition] = useTransition();

  const parId = new Map(prestations.map((p) => [p.id, p]));
  const categories = [...new Set(prestations.map((p) => p.categorie))];

  // Convertit "2,5" → 2.5 ; NaN si invalide.
  const enNombre = (texte: string) => Number(texte.replace(",", "."));

  const sousTotal = (l: Ligne): number | null => {
    if (l.prestationTypeId == null) return null;
    const p = parId.get(l.prestationTypeId);
    const q = enNombre(l.quantite);
    if (!p || !Number.isFinite(q) || q <= 0) return null;
    return Math.round(q * p.prixUnitaire * 100) / 100;
  };

  const totalHT = lignes.reduce((somme, l) => somme + (sousTotal(l) ?? 0), 0);

  const modifierLigne = (cle: number, changement: Partial<Ligne>) => {
    setLignes((prev) => prev.map((l) => (l.cle === cle ? { ...l, ...changement } : l)));
  };

  const envoyer = () => {
    setErreur(null);
    // Ignore les lignes complètement vides (ex : ligne ajoutée par erreur).
    const lignesRemplies = lignes.filter(
      (l) => l.prestationTypeId != null || l.quantite.trim() !== ""
    );
    // Validation côté client pour un retour immédiat.
    if (!nomClient.trim()) return setErreur("Merci d'indiquer le nom du client.");
    if (!adresseChantier.trim()) return setErreur("Merci d'indiquer l'adresse du chantier.");
    if (lignesRemplies.length === 0) return setErreur("Ajoutez au moins une prestation.");
    for (const l of lignesRemplies) {
      if (l.prestationTypeId == null) return setErreur("Chaque ligne doit avoir une prestation sélectionnée.");
      const q = enNombre(l.quantite);
      if (!Number.isFinite(q) || q <= 0) return setErreur("Chaque ligne doit avoir une quantité supérieure à zéro.");
    }

    demarrerTransition(async () => {
      const resultat = await creerDevis({
        nomClient,
        adresseChantier,
        notes,
        lignes: lignesRemplies.map((l) => ({
          prestationTypeId: l.prestationTypeId!,
          quantite: enNombre(l.quantite),
        })),
      });
      // En cas de succès l'action redirige ; on n'arrive ici que sur erreur.
      if (resultat?.erreur) setErreur(resultat.erreur);
    });
  };

  return (
    <div className="space-y-6 pb-28">
      <h1 className="text-2xl font-bold">Nouveau devis</h1>

      {/* Infos client */}
      <section className="space-y-3 rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
        <h2 className="font-semibold">Client</h2>
        <label className="block">
          <span className="text-sm text-stone-600">Nom du client *</span>
          <input
            type="text"
            value={nomClient}
            onChange={(e) => setNomClient(e.target.value)}
            placeholder="Ex : M. et Mme Martin"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-3 text-base"
          />
        </label>
        <label className="block">
          <span className="text-sm text-stone-600">Adresse du chantier *</span>
          <input
            type="text"
            value={adresseChantier}
            onChange={(e) => setAdresseChantier(e.target.value)}
            placeholder="Ex : 12 rue des Lilas, 25000 Besançon"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-3 text-base"
          />
        </label>
      </section>

      {/* Lignes de prestations */}
      <section className="space-y-3">
        <h2 className="font-semibold">Prestations</h2>
        {lignes.map((l) => {
          const p = l.prestationTypeId != null ? parId.get(l.prestationTypeId) : undefined;
          const st = sousTotal(l);
          return (
            <div key={l.cle} className="space-y-2 rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
              <select
                value={l.prestationTypeId ?? ""}
                onChange={(e) =>
                  modifierLigne(l.cle, {
                    prestationTypeId: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-base"
              >
                <option value="">— Choisir une prestation —</option>
                {categories.map((cat) => (
                  <optgroup key={cat} label={cat}>
                    {prestations
                      .filter((pr) => pr.categorie === cat)
                      .map((pr) => (
                        <option key={pr.id} value={pr.id}>
                          {pr.nom} ({formatEuros(pr.prixUnitaire)}/{pr.unite})
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={l.quantite}
                  onChange={(e) => modifierLigne(l.cle, { quantite: e.target.value })}
                  placeholder="Quantité"
                  className="w-28 rounded-lg border border-stone-300 px-3 py-3 text-base"
                />
                <span className="text-stone-600">{p ? p.unite : ""}</span>
                <span className="ml-auto font-semibold">
                  {st != null ? formatEuros(st) : ""}
                </span>
                <button
                  type="button"
                  onClick={() => setLignes((prev) => prev.filter((x) => x.cle !== l.cle))}
                  aria-label="Supprimer la ligne"
                  className="rounded-lg px-3 py-2 text-red-600 hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() =>
            setLignes((prev) => [
              ...prev,
              { cle: prochaineCle++, prestationTypeId: null, quantite: "" },
            ])
          }
          className="w-full rounded-xl border-2 border-dashed border-stone-300 px-4 py-3 font-medium text-stone-600 hover:border-green-600 hover:text-green-700"
        >
          + Ajouter une prestation
        </button>
      </section>

      {/* Notes libres */}
      <section className="rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
        <label className="block">
          <span className="text-sm text-stone-600">Notes (optionnel)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ex : accès difficile, prévoir évacuation des déchets…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-3 text-base"
          />
        </label>
      </section>

      {erreur && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700 ring-1 ring-red-200">
          {erreur}
        </p>
      )}

      {/* Total + bouton d'enregistrement fixés en bas (mobile-friendly) */}
      <div className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white p-3">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <div>
            <span className="block text-sm text-stone-500">Total HT</span>
            <span className="text-xl font-bold">{formatEuros(totalHT)}</span>
          </div>
          <button
            type="button"
            onClick={envoyer}
            disabled={enCours}
            className="flex-1 rounded-xl bg-green-700 px-5 py-4 text-lg font-semibold text-white shadow hover:bg-green-800 disabled:opacity-50"
          >
            {enCours ? "Enregistrement…" : "Enregistrer le devis"}
          </button>
        </div>
      </div>
    </div>
  );
}
