import type { Metadata } from "next";
import type { SiteData } from "./load";

export function siteMetadata(s: NonNullable<SiteData>, path: string, title: string, description: string): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: s.url(path) },
    robots: s.indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { title, description, url: s.url(path), siteName: s.brand, locale: "fr_FR", type: "website" },
  };
}
