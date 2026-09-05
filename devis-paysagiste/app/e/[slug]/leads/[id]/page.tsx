import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { entrepriseParSlug } from "@/lib/entreprise";
import { formatDate, formatEuros } from "@/lib/format";
import { typeProjet, DELAIS } from "@/lib/catalogue";
import { qualifier } from "@/lib/moteur";
import { BadgeQualification } from "@/components/BadgeQualification";

export const dynamic = "force-dynamic";

// Fiche prospect : tout ce qu'il faut pour rappeler le client bien préparé.
export default async function PageLead({ params }: PageProps<"/e/[slug]/leads/[id]">) {
  const { slug, id } = await params;
  const entreprise = await entrepriseParSlug(slug);
  const lead = await prisma.lead.findFirst({
    where: { id: Number(id), entrepriseId: entreprise.id },
    include: { simulation: true },
  });
  if (!lead) notFound();

  const type = typeProjet(lead.simulation.typeProjet);
  const reponses = lead.simulation.reponses as Record<string, string | number>;
  const photos = (lead.simulation.photos as string[]) ?? [];

  // Traduit les réponses techniques en libellés lisibles.
  const detailsProjet = (type?.questions ?? []).flatMap((q) => {
    const valeur = reponses[q.id];
    if (valeur == null || valeur === "") return [];
    if (q.type === "nombre") return [[q.libelle, `${valeur} ${q.unite}`]];
    const option = q.options.find((o) => o.id === valeur);
    return [[q.libelle, option?.libelle ?? String(valeur)]];
  });
  if (typeof reponses.description === "string" && reponses.description) {
    detailsProjet.push(["Description", reponses.description]);
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/e/${slug}/leads`} className="text-sm text-stone-500 hover:underline">← Prospects</Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{lead.prenom} {lead.nom}</h1>
          <BadgeQualification
            qualification={qualifier(lead.simulation.estimationMax, entreprise.seuilPetit, entreprise.seuilFort)}
          />
        </div>
        <p className="text-stone-600">Demande reçue le {formatDate(lead.creeLe)}</p>
      </div>

      {/* Contact : cliquable pour appeler/écrire directement */}
      <section className="rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
        <h2 className="mb-2 font-semibold">Contact</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <a href={`tel:${lead.telephone}`} className="rounded-lg bg-green-700 px-4 py-3 text-center font-semibold text-white hover:bg-green-800">
            📞 {lead.telephone}
          </a>
          <a href={`mailto:${lead.email}`} className="rounded-lg bg-stone-100 px-4 py-3 text-center font-medium hover:bg-stone-200">
            ✉️ {lead.email}
          </a>
        </div>
        <p className="mt-2 text-sm text-stone-600">
          📍 {lead.codePostal}{lead.commune ? ` ${lead.commune}` : ""}
          {" · "}⏱️ {DELAIS.find((d) => d.id === lead.delai)?.libelle ?? lead.delai}
        </p>
      </section>

      {/* Budget */}
      <section className="rounded-xl bg-green-50 p-4 ring-1 ring-green-200">
        <h2 className="font-semibold">Budget</h2>
        <p className="mt-1">
          {lead.simulation.estimationMin != null ? (
            <>Estimation du simulateur :{" "}
              <strong>{formatEuros(lead.simulation.estimationMin)} – {formatEuros(lead.simulation.estimationMax!)}</strong></>
          ) : (
            "Pas d'estimation (projet libre)."
          )}
        </p>
        {lead.budgetMax != null && (
          <p className="text-sm text-stone-600">
            Budget maximum indiqué par le client : <strong>{formatEuros(lead.budgetMax)}</strong>
          </p>
        )}
      </section>

      {/* Projet */}
      <section className="rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
        <h2 className="mb-2 font-semibold">
          {type ? `${type.emoji} ${type.libelle}` : lead.simulation.typeProjet}
        </h2>
        <dl className="space-y-1 text-sm">
          {detailsProjet.map(([libelle, valeur]) => (
            <div key={libelle} className="flex justify-between gap-4">
              <dt className="text-stone-500">{libelle}</dt>
              <dd className="text-right font-medium">{valeur}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Photos */}
      {photos.length > 0 && (
        <section className="rounded-xl bg-white p-4 shadow ring-1 ring-stone-200">
          <h2 className="mb-2 font-semibold">Photos du terrain ({photos.length})</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={p} alt={`Photo ${i + 1}`} className="aspect-square w-full rounded-lg object-cover" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
