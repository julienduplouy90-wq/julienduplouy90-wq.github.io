import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paysage Digital — Simulateur de prix pour paysagistes",
  description:
    "Ajoutez un simulateur de prix à votre site et recevez des demandes de projets déjà qualifiées.",
};

// Layout racine minimal : chaque espace (landing, dashboard, simulateur)
// a sa propre mise en page.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-stone-50 text-stone-900">{children}</body>
    </html>
  );
}
