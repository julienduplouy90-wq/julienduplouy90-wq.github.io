import Link from "next/link";
import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-5xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function Cta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-12 items-center justify-center rounded-lg bg-emerald-700 px-6 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-emerald-700">
      {children}
    </Link>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  // Échappement de "<" pour empêcher toute injection de balise dans le script.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function Missing({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-amber-100 px-1 text-amber-900">[{children} — à compléter avant publication]</mark>;
}
