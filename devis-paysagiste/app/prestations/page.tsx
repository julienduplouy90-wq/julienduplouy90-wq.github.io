import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatEuros, formatFourchette } from "@/lib/format";

export const dynamic = "force-dynamic";

// Bibliothèque de prix en lecture : le prix du paysagiste + la fourchette
// indicative. La modification passe par le formulaire d'onboarding réutilisé.
export default async function PagePrestations() {
  const prestations = await prisma.prestationType.findMany({
    orderBy: [{ categorie: "asc" }, { nom: "asc" }],
  });
  const categories = [...new Set(prestations.map((p) => p.categorie))];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Mes tarifs</h1>
        <div className="flex gap-2">
          <a
            href="/api/export-tarifs"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium shadow ring-1 ring-stone-200 hover:bg-stone-100"
          >
            ⬇️ Export CSV
          </a>
          <Link
            href="/onboarding"
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-800"
          >
            ✏️ Modifier
          </Link>
        </div>
      </div>

      {categories.map((categorie) => (
        <section key={categorie}>
          <h2 className="mb-2 text-lg font-semibold">{categorie}</h2>
          <ul className="divide-y divide-stone-200 rounded-xl bg-white shadow ring-1 ring-stone-200">
            {prestations
              .filter((p) => p.categorie === categorie)
              .map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <span className="font-medium">{p.nom}</span>
                    <span className="block text-sm text-stone-500">
                      Indicatif : {formatFourchette(p.prixMin, p.prixMax, p.unite)}
                    </span>
                  </div>
                  <span className="whitespace-nowrap font-semibold">
                    {p.prixUnitaire != null
                      ? `${formatEuros(p.prixUnitaire)} / ${p.unite}`
                      : "—"}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
