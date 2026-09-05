import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatEuros } from "@/lib/format";
import { BadgeStatut } from "@/components/BadgeStatut";

export const dynamic = "force-dynamic";

export default async function PageListeDevis() {
  const devis = await prisma.devis.findMany({
    orderBy: { dateCreation: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes devis</h1>
        <Link
          href="/nouveau-devis"
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-800"
        >
          + Nouveau
        </Link>
      </div>

      {devis.length === 0 ? (
        <p className="rounded-xl bg-white px-4 py-8 text-center text-stone-500 shadow ring-1 ring-stone-200">
          Aucun devis pour l&apos;instant.
          <br />
          <Link href="/nouveau-devis" className="font-medium text-green-700 underline">
            Créer votre premier devis
          </Link>
        </p>
      ) : (
        <ul className="divide-y divide-stone-200 rounded-xl bg-white shadow ring-1 ring-stone-200">
          {devis.map((d) => (
            <li key={d.id}>
              <Link
                href={`/devis/${d.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-stone-50"
              >
                <div>
                  <span className="font-medium">{d.nomClient}</span>
                  <span className="block text-sm text-stone-500">
                    {formatDate(d.dateCreation)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <BadgeStatut statut={d.statut} />
                  <span className="font-semibold">{formatEuros(d.totalHT)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
