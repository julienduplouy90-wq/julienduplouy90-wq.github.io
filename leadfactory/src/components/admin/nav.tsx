"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ICONS: Record<string, string> = {
  overview: "M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z",
  projects: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  sites: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm-9 9h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z",
  leads: "M4 4h16v12H5.2L4 17.2zm4 5h8m-8 3h5",
  partners: "M16 11a4 4 0 1 0-8 0m-5 9a7 7 0 0 1 18 0M12 7a3 3 0 1 0 0-.01",
  distribution: "M5 12h14m-4-4 4 4-4 4M5 6h6m-6 12h6",
  finances: "M4 19V5m0 14h16M8 15l3-4 3 2 4-6",
  automations: "M13 3 4 14h7l-1 7 9-11h-7z",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z",
};

export const NAV = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: "overview" },
  { href: "/projets", label: "Projets", icon: "projects" },
  { href: "/sites", label: "Sites", icon: "sites" },
  { href: "/prospects", label: "Prospects", icon: "leads" },
  { href: "/partenaires", label: "Partenaires", icon: "partners" },
  { href: "/distribution", label: "Distribution", icon: "distribution" },
  { href: "/finances", label: "Finances", icon: "finances" },
  { href: "/automatisations", label: "Automatisations", icon: "automations", future: true },
  { href: "/parametres", label: "Paramètres", icon: "settings" },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5" aria-label="Navigation principale">
      {NAV.map((n) => {
        const active = pathname === n.href || pathname.startsWith(n.href + "/");
        return (
          <Link key={n.href} href={n.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
            className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={ICONS[n.icon]} />
            </svg>
            <span className="flex-1">{n.label}</span>
            {n.future && <span className="rounded bg-muted px-1.5 text-[10px] text-muted-foreground">futur</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  return (
    <details className="group relative lg:hidden">
      <summary className="flex h-9 cursor-pointer list-none items-center rounded-md border bg-card px-3 text-sm [&::-webkit-details-marker]:hidden">
        Menu
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border bg-card p-2 shadow-lg">
        <NavLinks onNavigate={() => document.querySelectorAll("details[open]").forEach((d) => d.removeAttribute("open"))} />
      </div>
    </details>
  );
}
