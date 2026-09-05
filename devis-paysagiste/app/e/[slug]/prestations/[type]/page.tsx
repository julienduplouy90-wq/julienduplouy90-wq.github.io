import { notFound } from "next/navigation";
import { entrepriseParSlug } from "@/lib/entreprise";
import { typeProjet, type ReglesTarifaires } from "@/lib/catalogue";
import { FormulaireRegles } from "./FormulaireRegles";

export const dynamic = "force-dynamic";

// Configuration des règles tarifaires d'un type de projet :
// fourchette de base + coefficients par option.
export default async function PageRegles({ params }: PageProps<"/e/[slug]/prestations/[type]">) {
  const { slug, type: idType } = await params;
  const entreprise = await entrepriseParSlug(slug);
  const type = typeProjet(idType);
  const prestation = entreprise.prestations.find((p) => p.typeProjet === idType);
  if (!type || !type.estimable || !prestation) notFound();

  return (
    <FormulaireRegles
      slug={slug}
      type={type}
      regles={prestation.regles as ReglesTarifaires}
    />
  );
}
