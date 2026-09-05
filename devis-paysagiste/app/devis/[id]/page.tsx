import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatEuros } from "@/lib/format";
import { BadgeStatut } from "@/components/BadgeStatut";
import { changerStatut, supprimerDevis } from "./actions";

export const dynamic = "force-dynamic";

export default async function PageDetailDevis({ params }: PageProps<"/devis/[id]">) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) notFound();

  const devis = await prisma.devis.findUnique({
    where: { id: idNum },
    include: { lignes: true },
  });
  if (!devis) notFound();

  const statutCible = devis.statut === "envoyé" ? "brouillon" : "envoyé";

  return (
    <div className="space-y-5">
      <div>
        <Link href="/devis" className="text-sm text-stone-500 hover:underline">
          ← Retour à mes devis
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Devis n°{devis.id}</h1>
          <BadgeStatut statut={devis.statut} />
        </div>
        <p className="text-stone-600">Créé le {formatDate(devis.dateCreation)}</p>
      </div>

      <section className="rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
        <h2 className="font-semibold">{devis.nomClient}</h2>
        <p className="text-stone-600">{devis.adresseChantier}</p>
        {devis.notes && (
          <p className="mt-2 border-t border-stone-100 pt-2 text-sm text-stone-500">
            {devis.notes}
          </p>
        )}
      </section>

      {/* Tableau des prestations : scroll horizontal si écran étroit */}
      <section className="overflow-x-auto rounded-xl bg-white shadow ring-1 ring-stone-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-stone-500">
              <th className="px-4 py-2 font-medium">Prestation</th>
              <th className="px-2 py-2 text-right font-medium">Qté</th>
              <th className="px-2 py-2 text-right font-medium">P.U. HT</th>
              <th className="px-4 py-2 text-right font-medium">Sous-total</th>
            </tr>
          </thead>
          <tbody>
            {devis.lignes.map((l) => (
              <tr key={l.id} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-2">{l.nomPrestation}</td>
                <td className="whitespace-nowrap px-2 py-2 text-right">
                  {l.quantite.toLocaleString("fr-FR")} {l.unite}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-right">
                  {formatEuros(l.prixUnitaire)}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-right font-medium">
                  {formatEuros(l.sousTotal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right font-semibold">
                Total HT
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-lg font-bold">
                {formatEuros(devis.totalHT)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Actions */}
      <div className="grid gap-3">
        <a
          href={`/api/devis/${devis.id}/pdf`}
          className="block rounded-xl bg-green-700 px-5 py-4 text-center text-lg font-semibold text-white shadow hover:bg-green-800"
        >
          ⬇️ Télécharger en PDF
        </a>
        <form action={changerStatut}>
          <input type="hidden" name="id" value={devis.id} />
          <input type="hidden" name="statut" value={statutCible} />
          <button
            type="submit"
            className="w-full rounded-xl bg-white px-5 py-3 font-medium shadow ring-1 ring-stone-200 hover:bg-stone-100"
          >
            {devis.statut === "envoyé"
              ? "↩️ Repasser en brouillon"
              : "📤 Marquer comme envoyé"}
          </button>
        </form>
        <form action={supprimerDevis}>
          <input type="hidden" name="id" value={devis.id} />
          <button
            type="submit"
            className="w-full rounded-xl px-5 py-3 font-medium text-red-600 hover:bg-red-50"
          >
            🗑️ Supprimer ce devis
          </button>
        </form>
      </div>
    </div>
  );
}
