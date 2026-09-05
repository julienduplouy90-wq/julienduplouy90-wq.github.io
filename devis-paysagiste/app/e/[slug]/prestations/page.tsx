import Link from "next/link";
import { entrepriseParSlug } from "@/lib/entreprise";
import { CATALOGUE } from "@/lib/catalogue";
import { basculerPrestation } from "./actions";

export const dynamic = "force-dynamic";

// Liste des types de projets : activer/désactiver + accéder aux prix.
export default async function PagePrestations({ params }: PageProps<"/e/[slug]/prestations">) {
  const { slug } = await params;
  const entreprise = await entrepriseParSlug(slug);
  const parType = new Map(entreprise.prestations.map((p) => [p.typeProjet, p]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Prestations & prix</h1>
        <p className="text-stone-600">
          Activez les projets que vous proposez, puis réglez vos tarifs pour chacun.
        </p>
      </div>

      <ul className="space-y-3">
        {CATALOGUE.map((t) => {
          const prestation = parType.get(t.id);
          const active = prestation?.active ?? false;
          return (
            <li key={t.id} className={`flex items-center gap-4 rounded-xl bg-white p-4 shadow ring-1 ring-stone-200 ${active ? "" : "opacity-60"}`}>
              <span className="text-3xl">{t.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{t.libelle}</p>
                <p className="truncate text-sm text-stone-500">{t.description}</p>
              </div>
              {active && t.estimable && (
                <Link
                  href={`/e/${slug}/prestations/${t.id}`}
                  className="rounded-lg bg-stone-100 px-4 py-2 text-sm font-medium hover:bg-stone-200"
                >
                  Régler les prix
                </Link>
              )}
              <form action={basculerPrestation}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="typeProjet" value={t.id} />
                <button
                  type="submit"
                  aria-label={active ? `Désactiver ${t.libelle}` : `Activer ${t.libelle}`}
                  className={`relative h-8 w-14 rounded-full transition ${active ? "bg-green-600" : "bg-stone-300"}`}
                >
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${active ? "left-7" : "left-1"}`} />
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
