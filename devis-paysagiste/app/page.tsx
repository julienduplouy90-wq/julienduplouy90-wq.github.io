import Link from "next/link";

// Landing du SaaS : une promesse, un CTA.
export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-4 py-4">
        <p className="mx-auto max-w-3xl text-lg font-bold text-green-800">
          🌿 Paysage Digital
        </p>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12 text-center">
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
          Ajoutez un simulateur de prix à votre site
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600">
          Vos visiteurs estiment leur projet en 2 minutes, vous recevez des
          demandes <strong>déjà qualifiées</strong> — avec budget, surface et
          coordonnées.
        </p>

        <div className="mx-auto mt-8 w-full max-w-sm">
          <Link
            href="/onboarding"
            className="block rounded-xl bg-green-700 px-6 py-4 text-lg font-semibold text-white shadow-lg hover:bg-green-800"
          >
            Créer mon simulateur gratuitement
          </Link>
          <p className="mt-3 text-sm text-stone-500">
            Prêt en moins de 10 minutes. Aucune carte bancaire.
          </p>
        </div>

        <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
          {[
            ["⚙️", "Configurez vos tarifs", "Vos prix, vos coefficients. Le simulateur calcule une fourchette, jamais un devis."],
            ["🔗", "Collez le widget", "Une ligne de code sur WordPress, Wix, Webflow ou Hostinger — ou un simple lien."],
            ["📥", "Recevez des prospects", "Chaque simulation terminée devient une fiche prospect qualifiée."],
          ].map(([emoji, titre, texte]) => (
            <div key={titre} className="rounded-xl bg-white p-5 shadow ring-1 ring-stone-200">
              <p className="text-2xl">{emoji}</p>
              <p className="mt-2 font-semibold">{titre}</p>
              <p className="mt-1 text-sm text-stone-600">{texte}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="px-4 py-6 text-center text-sm text-stone-400">
        Paysage Digital — simulateur d&apos;estimation pour entreprises de paysage
      </footer>
    </div>
  );
}
