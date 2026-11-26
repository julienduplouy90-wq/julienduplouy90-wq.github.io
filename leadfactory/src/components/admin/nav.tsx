"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: string };
type SpaceKey = "leads" | "sites";

const ICONS: Record<string, string> = {
  home: "M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  leads: "M4 4h16v12H5.2L4 17.2zm4 5h8m-8 3h5",
  partners: "M16 11a4 4 0 1 0-8 0m-5 9a7 7 0 0 1 18 0M12 7a3 3 0 1 0 0-.01",
  money: "M4 19V5m0 14h16M8 15l3-4 3 2 4-6",
  sites: "M3 5h18v14H3zm0 4h18M7 7h.01M10 7h.01",
  plus: "M12 5v14M5 12h14",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 12h2m12 0h2M12 4v2m0 12v2M6.3 6.3l1.4 1.4m8.6 8.6 1.4 1.4m0-11.4-1.4 1.4m-8.6 8.6-1.4 1.4",
};

export const SPACES: Record<SpaceKey, { label: string; hint: string; home: string; items: Item[] }> = {
  leads: {
    label: "Leads", hint: "Demandes, partenaires, argent", home: "/leads",
    items: [
      { href: "/leads", label: "Accueil", icon: "home" },
      { href: "/prospects", label: "Prospects", icon: "leads" },
      { href: "/partenaires", label: "Partenaires", icon: "partners" },
      { href: "/finances", label: "Finances", icon: "money" },
    ],
  },
  sites: {
    label: "Sites", hint: "Création et réglages des sites", home: "/sites",
    items: [
      { href: "/sites", label: "Mes sites", icon: "sites" },
      { href: "/sites/nouveau", label: "Nouveau site", icon: "plus" },
    ],
  },
};

export function spaceOf(pathname: string): SpaceKey | null {
  if (pathname.startsWith("/sites")) return "sites";
  if (pathname.startsWith("/reglages")) return null;
  return "leads";
}

/** Élément actif = préfixe le plus long correspondant au chemin courant. */
function activeHref(pathname: string, items: Item[]) {
  return items.filter((i) => pathname === i.href || pathname.startsWith(i.href + "/")).sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

const ACCENT: Record<SpaceKey, { on: string; soft: string }> = {
  leads: { on: "bg-indigo-600 text-white", soft: "bg-indigo-600/10 text-indigo-600 dark:text-indigo-300" },
  sites: { on: "bg-emerald-600 text-white", soft: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300" },
};

function Icon({ name, className = "size-4" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0", className)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[name]} />
    </svg>
  );
}

/** Sélecteur des deux espaces : toujours visible, couleur propre à chaque espace. */
export function SpaceSwitch({ compact = false }: { compact?: boolean }) {
  const current = spaceOf(usePathname());
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Espace">
      {(Object.keys(SPACES) as SpaceKey[]).map((k) => (
        <Link key={k} href={SPACES[k].home} role="tab" aria-selected={current === k}
          className={cn("rounded-md px-3 text-center font-medium transition", compact ? "py-1 text-sm" : "py-2 text-sm",
            current === k ? ACCENT[k].on + " shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          {SPACES[k].label}
        </Link>
      ))}
    </div>
  );
}

export function SideNav() {
  const pathname = usePathname();
  const space = spaceOf(pathname);
  const items = space ? SPACES[space].items : [];
  const active = activeHref(pathname, items);
  return (
    <>
      <SpaceSwitch />
      {space && <p className="mt-3 px-2.5 text-xs text-muted-foreground">{SPACES[space].hint}</p>}
      <nav className="mt-2 space-y-0.5" aria-label="Navigation">
        {items.map((n) => (
          <Link key={n.href} href={n.href} aria-current={active === n.href ? "page" : undefined}
            className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              active === n.href ? ACCENT[space!].soft + " font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <Icon name={n.icon} />{n.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

export function SettingsLink() {
  const on = usePathname().startsWith("/reglages");
  return (
    <Link href="/reglages" className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm", on ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted")}>
      <Icon name="settings" />Réglages
    </Link>
  );
}

/** Barre d'onglets mobile : les entrées de l'espace courant + Réglages. */
export function BottomTabs() {
  const pathname = usePathname();
  const space = spaceOf(pathname) ?? "leads";
  const items = [...SPACES[space].items, { href: "/reglages", label: "Réglages", icon: "settings" }];
  const active = activeHref(pathname, items);
  return (
    <nav aria-label="Navigation" className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="flex">
        {items.map((n) => (
          <li key={n.href} className="flex-1">
            <Link href={n.href} aria-current={active === n.href ? "page" : undefined}
              className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px]", active === n.href ? (space === "sites" ? "text-emerald-600" : "text-indigo-600") + " font-medium" : "text-muted-foreground")}>
              <Icon name={n.icon} className="size-5" />{n.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
