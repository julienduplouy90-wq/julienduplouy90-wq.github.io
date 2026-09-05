import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CATALOGUE } from "@/lib/catalogue";
import { Simulateur } from "./Simulateur";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/s/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const entreprise = await prisma.entreprise.findUnique({ where: { slug } });
  return {
    title: entreprise ? `Estimer mon projet — ${entreprise.nom}` : "Simulateur",
    robots: { index: false }, // le simulateur vit sur le site du paysagiste
  };
}

// Simulateur public white-label : le particulier a l'impression
// d'utiliser l'outil DU paysagiste. Conçu pour être intégré en iframe.
export default async function PageSimulateur({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  const entreprise = await prisma.entreprise.findUnique({
    where: { slug },
    include: { prestations: { where: { active: true } } },
  });
  if (!entreprise) notFound();

  // Types de projets actifs, dans l'ordre du catalogue
  const typesActifs = CATALOGUE.filter((t) =>
    entreprise.prestations.some((p) => p.typeProjet === t.id)
  ).map((t) => ({ id: t.id, libelle: t.libelle, emoji: t.emoji, description: t.description, estimable: t.estimable, questions: t.questions }));

  return (
    <Simulateur
      slug={slug}
      entreprise={{
        nom: entreprise.nom,
        couleur: entreprise.couleur,
        logo: entreprise.logo,
        telephone: entreprise.telephone,
        zone: entreprise.zone,
      }}
      types={typesActifs}
    />
  );
}
