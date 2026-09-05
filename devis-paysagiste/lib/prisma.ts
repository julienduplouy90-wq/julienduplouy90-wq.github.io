// Client Prisma partagé pour toute l'application.
// En développement, Next.js recharge les modules à chaud : on stocke
// l'instance sur globalThis pour éviter d'ouvrir trop de connexions.
import path from "node:path";
import { PrismaClient } from "@/lib/generated/prisma/client";

// La CLI Prisma résout "file:./dev.db" par rapport au dossier prisma/,
// mais le client au runtime le résout par rapport à la racine du projet.
// On aligne les deux en reconstruisant un chemin absolu vers prisma/.
function urlBaseDeDonnees(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (url?.startsWith("file:") && !path.isAbsolute(url.slice(5))) {
    return "file:" + path.resolve(process.cwd(), "prisma", url.slice(5));
  }
  return url;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: urlBaseDeDonnees() });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
