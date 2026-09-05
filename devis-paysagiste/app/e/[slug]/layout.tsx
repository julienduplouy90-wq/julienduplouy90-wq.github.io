import Link from "next/link";
import { entrepriseParSlug } from "@/lib/entreprise";

export const dynamic = "force-dynamic";

// Layout du dashboard : en-tête + navigation en 4 espaces.
export default async function LayoutDashboard({
  children,
  params,
}: LayoutProps<"/e/[slug]">) {
  const { slug } = await params;
  const entreprise = await entrepriseParSlug(slug);

  const liens = [
    { href: `/e/${slug}`, libelle: "Vue d'ensemble" },
    { href: `/e/${slug}/leads`, libelle: "Prospects" },
    { href: `/e/${slug}/prestations`, libelle: "Prestations & prix" },
    { href: `/e/${slug}/installer`, libelle: "Installer" },
    { href: `/e/${slug}/reglages`, libelle: "Réglages" },
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 pt-4">
          <p className="text-lg font-bold">🌿 {entreprise.nom}</p>
          <nav className="-mb-px mt-2 flex gap-1 overflow-x-auto">
            {liens.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              >
                {l.libelle}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
