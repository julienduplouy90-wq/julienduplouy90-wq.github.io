import { entrepriseParSlug } from "@/lib/entreprise";
import { Installation } from "./Installation";

export const dynamic = "force-dynamic";

// « Installer mon simulateur » : aperçu, code à copier, instructions
// par plateforme, lien public.
export default async function PageInstaller({ params, searchParams }: PageProps<"/e/[slug]/installer">) {
  const { slug } = await params;
  const { bienvenue } = await searchParams;
  await entrepriseParSlug(slug); // 404 si slug inconnu

  return <Installation slug={slug} bienvenue={bienvenue === "1"} />;
}
