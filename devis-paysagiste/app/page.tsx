import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatEuros } from "@/lib/format";

// Page lue en base à chaque requête (pas de cache statique).
export const dynamic = "force-dynamic";

export default async function Accueil() {
  // Premier lancement : pas de profil → on passe par le questionnaire.
  const profil = await prisma.profil.findFirst();
  if (!profil?.onboardingTermine) {
    redirect("/onboarding");
  }

  const derniersDevis = await prisma.devis.findMany({
    orderBy: { dateCreation: "desc" },
    take: 3,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Bonjour{profil.nomEntreprise ? ` ${profil.nomEntreprise}` : ""} 👋
        </h1>
        <p className="text-stone-600">
          {profil.ville} ({profil.codePostal})
        </p>
      </div>

      {/* Gros boutons, faciles à viser sur chantier */}
      <div className="grid gap-3">
        <Link
          href="/nouveau-devis"
          className="block rounded-xl bg-green-700 px-5 py-4 text-center text-lg font-semibold text-white shadow hover:bg-green-800"
        >
          ➕ Créer un devis
        </Link>
        <Link
          href="/devis"
          className="block rounded-xl bg-white px-5 py-4 text-center text-lg font-semibold shadow ring-1 ring-stone-200 hover:bg-stone-100"
        >
          📋 Mes devis
        </Link>
        <Link
          href="/prestations"
          className="block rounded-xl bg-white px-5 py-4 text-center text-lg font-semibold shadow ring-1 ring-stone-200 hover:bg-stone-100"
        >
          🏷️ Mes tarifs
        </Link>
      </div>

      {derniersDevis.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Derniers devis</h2>
          <ul className="divide-y divide-stone-200 rounded-xl bg-white shadow ring-1 ring-stone-200">
            {derniersDevis.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/devis/${d.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-stone-50"
                >
                  <span>
                    <span className="font-medium">{d.nomClient}</span>
                    <span className="block text-sm text-stone-500">
                      {formatDate(d.dateCreation)}
                    </span>
                  </span>
                  <span className="font-semibold">{formatEuros(d.totalHT)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
