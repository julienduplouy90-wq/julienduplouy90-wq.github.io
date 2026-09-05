import { entrepriseParSlug } from "@/lib/entreprise";
import { FormulaireReglages } from "./FormulaireReglages";

export const dynamic = "force-dynamic";

export default async function PageReglages({ params }: PageProps<"/e/[slug]/reglages">) {
  const { slug } = await params;
  const e = await entrepriseParSlug(slug);

  return (
    <FormulaireReglages
      slug={slug}
      initiales={{
        nom: e.nom,
        telephone: e.telephone ?? "",
        email: e.email ?? "",
        ville: e.ville ?? "",
        codePostal: e.codePostal ?? "",
        zone: e.zone ?? "",
        couleur: e.couleur,
        logo: e.logo,
        seuilPetit: e.seuilPetit,
        seuilFort: e.seuilFort,
      }}
    />
  );
}
