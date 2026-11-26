import Link from "next/link";
import { cn } from "@/lib/utils";

/** Filtres sous forme de pastilles-liens : un clic, pas de bouton « Appliquer ». */
export function Chips({ items, active }: { items: { href: string; label: string; key: string }[]; active: string }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {items.map((i) => (
        <Link key={i.key} href={i.href} aria-current={i.key === active ? "true" : undefined}
          className={cn("rounded-full border px-3 py-1 text-xs whitespace-nowrap transition",
            i.key === active ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground")}>
          {i.label}
        </Link>
      ))}
    </div>
  );
}
