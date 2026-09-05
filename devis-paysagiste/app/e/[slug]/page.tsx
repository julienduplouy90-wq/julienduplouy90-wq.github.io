import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { entrepriseParSlug } from "@/lib/entreprise";
import { formatEuros, formatDate } from "@/lib/format";
import { typeProjet } from "@/lib/catalogue";
import { BadgeQualification } from "@/components/BadgeQualification";
import { qualifier } from "@/lib/moteur";

export const dynamic = "force-dynamic";

// Vue d'ensemble : les 4 chiffres qui comptent + derniers prospects.
export default async function VueEnsemble({ params }: PageProps<"/e/[slug]">) {
  const { slug } = await params;
  const entreprise = await entrepriseParSlug(slug);

  const [nbSimulations, nbLeads, simulationsEstimees, derniersLeads] = await Promise.all([
    prisma.simulation.count({ where: { entrepriseId: entreprise.id } }),
    prisma.lead.count({ where: { entrepriseId: entreprise.id } }),
    prisma.simulation.findMany({
      where: { entrepriseId: entreprise.id, estimationMax: { not: null } },
      select: { estimationMin: true, estimationMax: true },
    }),
    prisma.lead.findMany({
      where: { entrepriseId: entreprise.id },
      orderBy: { creeLe: "desc" },
      take: 5,
      include: { simulation: true },
    }),
  ]);

  const taux = nbSimulations > 0 ? Math.round((nbLeads / nbSimulations) * 100) : 0;
  const budgetMoyen =
    simulationsEstimees.length > 0
      ? simulationsEstimees.reduce((s, x) => s + (x.estimationMin! + x.estimationMax!) / 2, 0) /
        simulationsEstimees.length
      : null;

  const tuiles = [
    { libelle: "Simulations", valeur: String(nbSimulations) },
    { libelle: "Prospects reçus", valeur: String(nbLeads) },
    { libelle: "Simulation → prospect", valeur: `${taux} %` },
    { libelle: "Budget moyen estimé", valeur: budgetMoyen != null ? formatEuros(Math.round(budgetMoyen)) : "—" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vue d&apos;ensemble</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tuiles.map((t) => (
          <div key={t.libelle} className="rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
            <p className="text-sm text-stone-500">{t.libelle}</p>
            <p className="mt-1 text-2xl font-bold">{t.valeur}</p>
          </div>
        ))}
      </div>

      {nbSimulations === 0 ? (
        <div className="rounded-xl bg-green-50 p-6 text-center ring-1 ring-green-200">
          <p className="font-semibold">Votre simulateur est prêt 🎉</p>
          <p className="mt-1 text-stone-600">
            Il ne reste qu&apos;à l&apos;installer sur votre site pour recevoir vos
            premières demandes.
          </p>
          <Link
            href={`/e/${slug}/installer`}
            className="mt-4 inline-block rounded-xl bg-green-700 px-6 py-3 font-semibold text-white shadow hover:bg-green-800"
          >
            Installer mon simulateur
          </Link>
        </div>
      ) : (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Derniers prospects</h2>
            <Link href={`/e/${slug}/leads`} className="text-sm font-medium text-green-700 hover:underline">
              Tout voir →
            </Link>
          </div>
          {derniersLeads.length === 0 ? (
            <p className="rounded-xl bg-white p-6 text-center text-stone-500 shadow ring-1 ring-stone-200">
              Des simulations ont eu lieu, mais personne n&apos;a encore laissé ses
              coordonnées.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100 rounded-xl bg-white shadow ring-1 ring-stone-200">
              {derniersLeads.map((l) => (
                <li key={l.id}>
                  <Link href={`/e/${slug}/leads/${l.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-stone-50">
                    <span>
                      <span className="font-medium">{l.prenom} {l.nom}</span>
                      <span className="block text-sm text-stone-500">
                        {typeProjet(l.simulation.typeProjet)?.libelle ?? l.simulation.typeProjet} · {formatDate(l.creeLe)}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <BadgeQualification
                        qualification={qualifier(l.simulation.estimationMax, entreprise.seuilPetit, entreprise.seuilFort)}
                      />
                      {l.simulation.estimationMax != null && (
                        <span className="font-semibold">{formatEuros(l.simulation.estimationMax)}</span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
