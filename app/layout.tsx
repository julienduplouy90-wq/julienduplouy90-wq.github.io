import type { Metadata } from "next";
import "./globals.css";

const title = "Tambouloup | Initiation aux pratiques chamaniques";
const description = "Un atelier d'initiation aux pratiques chamaniques au Mélilot, à Gerde.";

export const metadata: Metadata = {
  metadataBase: new URL("https://julienduplouy90-wq.github.io"),
  title,
  description,
  openGraph: {
    title,
    description: "Voyage chamanique, exploration des mondes et rencontre avec l'animal totem.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
