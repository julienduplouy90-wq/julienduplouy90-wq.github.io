"use client";

// Formulaire du questionnaire de démarrage (client, pour l'état d'envoi).
// Chaque prestation affiche sa fourchette indicative et un champ pour
// le prix exact du paysagiste. Un prix laissé vide = prestation non proposée.
import { useActionState } from "react";
import { enregistrerOnboarding, type EtatOnboarding } from "./actions";
import { formatFourchette } from "@/lib/format";

type Prestation = {
  id: number;
  nom: string;
  unite: string;
  categorie: string;
  prixMin: number;
  prixMax: number;
  prixUnitaire: number | null;
};

type Props = {
  profil: {
    nomEntreprise: string;
    ville: string;
    codePostal: string;
    logicielActuel: string;
    estimationPublique: string;
  } | null;
  prestations: Prestation[];
};

export function FormulaireOnboarding({ profil, prestations }: Props) {
  const [etat, action, enCours] = useActionState<EtatOnboarding, FormData>(
    enregistrerOnboarding,
    {}
  );

  // Regroupe les prestations par catégorie pour l'affichage.
  const categories = [...new Set(prestations.map((p) => p.categorie))];
  const dejaConfigure = profil !== null;

  return (
    <form action={action} className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold">
          {dejaConfigure ? "Mes tarifs" : "Bienvenue ! 🌿"}
        </h1>
        <p className="mt-1 text-stone-600">
          {dejaConfigure
            ? "Modifiez vos informations et vos prix ci-dessous."
            : "Avant de créer votre premier devis, dites-nous où vous travaillez et vos prix habituels. Les fourchettes affichées sont des prix moyens constatés en France — à vous d'ajuster."}
        </p>
      </div>

      {/* Infos entreprise / localisation */}
      <section className="space-y-3 rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
        <h2 className="font-semibold">Votre entreprise</h2>
        <label className="block">
          <span className="text-sm text-stone-600">Nom de l&apos;entreprise (optionnel)</span>
          <input
            type="text"
            name="nomEntreprise"
            defaultValue={profil?.nomEntreprise ?? ""}
            placeholder="Ex : Au Jardin Vert"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-3 text-base"
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-stone-600">Ville *</span>
            <input
              type="text"
              name="ville"
              required
              defaultValue={profil?.ville ?? ""}
              placeholder="Ex : Besançon"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-3 text-base"
            />
          </label>
          <label className="block">
            <span className="text-sm text-stone-600">Code postal *</span>
            <input
              type="text"
              name="codePostal"
              required
              inputMode="numeric"
              pattern="\d{5}"
              maxLength={5}
              defaultValue={profil?.codePostal ?? ""}
              placeholder="Ex : 25000"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-3 text-base"
            />
          </label>
        </div>
      </section>

      {/* Questions découverte : deux questions courtes pour comprendre
          les habitudes du paysagiste (optionnelles) */}
      <section className="space-y-4 rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
        <h2 className="font-semibold">Deux questions rapides</h2>
        <label className="block">
          <span className="text-sm text-stone-600">
            Utilisez-vous déjà un logiciel pour générer ou chiffrer vos devis ?
            Si oui, lequel ?
          </span>
          <input
            type="text"
            name="logicielActuel"
            defaultValue={profil?.logicielActuel ?? ""}
            placeholder="Ex : Excel, Obat, Tolteck… (vide = aucun)"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-3 text-base"
          />
        </label>
        <fieldset>
          <legend className="text-sm text-stone-600">
            Laisseriez-vous un prospect obtenir une fourchette de prix
            directement depuis votre site, avant même de vous contacter ?
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { valeur: "oui", texte: "Oui" },
              { valeur: "peut-etre", texte: "Peut-être" },
              { valeur: "non", texte: "Non" },
            ].map((choix) => (
              <label
                key={choix.valeur}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 px-4 py-3 has-[:checked]:border-green-700 has-[:checked]:bg-green-50"
              >
                <input
                  type="radio"
                  name="estimationPublique"
                  value={choix.valeur}
                  defaultChecked={profil?.estimationPublique === choix.valeur}
                  className="accent-green-700"
                />
                {choix.texte}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      {/* Prix par catégorie */}
      {categories.map((categorie) => (
        <section
          key={categorie}
          className="rounded-xl bg-white p-4 shadow ring-1 ring-stone-200"
        >
          <h2 className="mb-3 font-semibold">{categorie}</h2>
          <div className="space-y-4">
            {prestations
              .filter((p) => p.categorie === categorie)
              .map((p) => (
                <label key={p.id} className="block">
                  <span className="font-medium">{p.nom}</span>
                  <span className="block text-sm text-stone-500">
                    Fourchette indicative : {formatFourchette(p.prixMin, p.prixMax, p.unite)}
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      name={`prix-${p.id}`}
                      step="0.01"
                      min="0"
                      defaultValue={p.prixUnitaire ?? ""}
                      placeholder="Votre prix"
                      className="w-32 rounded-lg border border-stone-300 px-3 py-3 text-base"
                    />
                    <span className="text-stone-600">€ / {p.unite}</span>
                  </div>
                </label>
              ))}
          </div>
        </section>
      ))}

      <p className="text-sm text-stone-500">
        Un prix laissé vide = prestation que vous ne proposez pas (vous pourrez
        toujours la remplir plus tard depuis « Mes tarifs »).
      </p>

      {etat.erreur && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700 ring-1 ring-red-200">
          {etat.erreur}
        </p>
      )}

      {/* Bouton fixé en bas : toujours accessible sur mobile */}
      <div className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white p-3">
        <button
          type="submit"
          disabled={enCours}
          className="mx-auto block w-full max-w-3xl rounded-xl bg-green-700 px-5 py-4 text-lg font-semibold text-white shadow hover:bg-green-800 disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : "Enregistrer mes tarifs"}
        </button>
      </div>
    </form>
  );
}
