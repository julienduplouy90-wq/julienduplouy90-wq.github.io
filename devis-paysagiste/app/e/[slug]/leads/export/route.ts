// Export CSV des prospects d'une entreprise — prêt à coller dans un
// Google Sheet (séparateur ";", BOM UTF-8 pour les accents).
import { prisma } from "@/lib/prisma";
import { typeProjet, DELAIS } from "@/lib/catalogue";
import { qualifier } from "@/lib/moteur";

export const dynamic = "force-dynamic";

function csv(valeur: string | number | null | undefined): string {
  const s = valeur == null ? "" : String(valeur);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const LIBELLES_QUALIF = { fort: "Forte valeur", standard: "Standard", petit: "Petit projet", inconnu: "À qualifier" };

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const entreprise = await prisma.entreprise.findUnique({ where: { slug } });
  if (!entreprise) return new Response("Introuvable", { status: 404 });

  const leads = await prisma.lead.findMany({
    where: { entrepriseId: entreprise.id },
    orderBy: { creeLe: "desc" },
    include: { simulation: true },
  });

  const lignes = [
    ["date", "prenom", "nom", "email", "telephone", "code_postal", "commune",
      "type_projet", "details", "estimation_min", "estimation_max",
      "budget_max_client", "delai", "qualification"].join(";"),
    ...leads.map((l) => {
      const type = typeProjet(l.simulation.typeProjet);
      const reponses = l.simulation.reponses as Record<string, string | number>;
      // Résumé lisible des réponses : "Surface: 30 m² · Matériau: Composite"
      const details = (type?.questions ?? [])
        .map((q) => {
          const v = reponses[q.id];
          if (v == null || v === "") return null;
          if (q.type === "nombre") return `${q.libelle}: ${v} ${q.unite}`;
          return `${q.libelle}: ${q.options.find((o) => o.id === v)?.libelle ?? v}`;
        })
        .filter(Boolean)
        .join(" · ");
      return [
        csv(l.creeLe.toLocaleDateString("fr-FR")),
        csv(l.prenom), csv(l.nom), csv(l.email), csv(l.telephone),
        csv(l.codePostal), csv(l.commune),
        csv(type?.libelle ?? l.simulation.typeProjet),
        csv(details),
        csv(l.simulation.estimationMin), csv(l.simulation.estimationMax),
        csv(l.budgetMax),
        csv(DELAIS.find((d) => d.id === l.delai)?.libelle ?? l.delai),
        csv(LIBELLES_QUALIF[qualifier(l.simulation.estimationMax, entreprise.seuilPetit, entreprise.seuilFort)]),
      ].join(";");
    }),
  ];

  return new Response("﻿" + lignes.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prospects-${slug}.csv"`,
    },
  });
}
