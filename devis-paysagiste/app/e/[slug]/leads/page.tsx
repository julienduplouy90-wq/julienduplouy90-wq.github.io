import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { entrepriseParSlug } from "@/lib/entreprise";
import { formatDate, formatEuros } from "@/lib/format";
import { typeProjet } from "@/lib/catalogue";
import { qualifier } from "@/lib/moteur";
import { BadgeQualification } from "@/components/BadgeQualification";

export const dynamic = "force-dynamic";

export default async function PageLeads({ params }: PageProps<"/e/[slug]/leads">) {
  const { slug } = await params;
  const entreprise = await entrepriseParSlug(slug);
  const leads = await prisma.lead.findMany({
    where: { entrepriseId: entreprise.id },
    orderBy: { creeLe: "desc" },
    include: { simulation: true },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Prospects</h1>
        {leads.length > 0 && (
          <a
            href={`/e/${slug}/leads/export`}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium shadow ring-1 ring-stone-200 hover:bg-stone-100"
          >
            ⬇️ Export CSV (pour Google Sheets)
          </a>
        )}
      </div>
      {leads.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-stone-500 shadow ring-1 ring-stone-200">
          <p>Pas encore de prospect.</p>
          <p className="mt-1 text-sm">
            Vos prospects apparaîtront ici dès qu&apos;un visiteur terminera une
            simulation sur votre site.{" "}
            <Link href={`/e/${slug}/installer`} className="font-medium text-green-700 underline">
              Installer le simulateur →
            </Link>
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-stone-100 rounded-xl bg-white shadow ring-1 ring-stone-200">
          {leads.map((l) => (
            <li key={l.id}>
              <Link href={`/e/${slug}/leads/${l.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-stone-50">
                <span className="min-w-0">
                  <span className="font-medium">{l.prenom} {l.nom}</span>
                  <span className="block truncate text-sm text-stone-500">
                    {typeProjet(l.simulation.typeProjet)?.libelle ?? l.simulation.typeProjet}
                    {" · "}{l.codePostal}{l.commune ? ` ${l.commune}` : ""}
                    {" · "}{formatDate(l.creeLe)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <BadgeQualification
                    qualification={qualifier(l.simulation.estimationMax, entreprise.seuilPetit, entreprise.seuilFort)}
                  />
                  {l.simulation.estimationMin != null && (
                    <span className="hidden font-semibold sm:block">
                      {formatEuros(l.simulation.estimationMin)} – {formatEuros(l.simulation.estimationMax!)}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
