// Client Prisma partagé pour toute l'application.
// En développement, Next.js recharge les modules à chaud : on stocke
// l'instance sur globalThis pour éviter d'ouvrir trop de connexions.
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
