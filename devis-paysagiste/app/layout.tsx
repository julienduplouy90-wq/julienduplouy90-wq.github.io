import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Devis Paysagiste",
  description: "Générateur de devis pour paysagistes",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        {/* En-tête simple, pensé mobile d'abord */}
        <header className="bg-green-800 text-white">
          <nav className="mx-auto max-w-3xl flex items-center gap-1 px-3 py-2 overflow-x-auto">
            <Link href="/" className="font-bold text-lg whitespace-nowrap mr-2">
              🌿 Devis Paysagiste
            </Link>
            <Link
              href="/nouveau-devis"
              className="rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap hover:bg-green-700"
            >
              + Nouveau devis
            </Link>
            <Link
              href="/devis"
              className="rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap hover:bg-green-700"
            >
              Mes devis
            </Link>
            <Link
              href="/prestations"
              className="rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap hover:bg-green-700"
            >
              Mes tarifs
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-4">
          {children}
        </main>
      </body>
    </html>
  );
}
