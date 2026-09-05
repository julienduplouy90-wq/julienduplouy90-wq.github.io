// Export CSV des tarifs saisis à l'onboarding, avec la zone (ville, CP).
// Pensé pour être collé tel quel dans un Google Sheet de suivi des prix
// par zone géographique.
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Échappe une valeur CSV (guillemets doublés si besoin).
function csv(valeur: string | number | null): string {
  const s = valeur == null ? "" : String(valeur);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const [profil, prestations] = await Promise.all([
    prisma.profil.findFirst(),
    prisma.prestationType.findMany({ orderBy: [{ categorie: "asc" }, { nom: "asc" }] }),
  ]);

  const lignes = [
    // Séparateur ";" : c'est ce qu'Excel/Sheets attendent en locale française.
    ["ville", "code_postal", "entreprise", "categorie", "prestation", "unite", "prix_unitaire_ht", "fourchette_min", "fourchette_max"].join(";"),
    ...prestations.map((p) =>
      [
        csv(profil?.ville ?? ""),
        csv(profil?.codePostal ?? ""),
        csv(profil?.nomEntreprise ?? ""),
        csv(p.categorie),
        csv(p.nom),
        csv(p.unite),
        csv(p.prixUnitaire),
        csv(p.prixMin),
        csv(p.prixMax),
      ].join(";")
    ),
  ];

  // BOM UTF-8 pour qu'Excel affiche bien les accents.
  return new Response("﻿" + lignes.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tarifs-paysagiste.csv"',
    },
  });
}
