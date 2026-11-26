import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: { default: "LeadFactory", template: "%s · LeadFactory" }, robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0b1120" }, { color: "#f8fafc" }] };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
