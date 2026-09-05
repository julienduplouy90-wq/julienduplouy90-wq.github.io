// Seed manuel de la bibliothèque de prix (npx prisma db seed).
// La liste des prestations vit dans lib/prestations-defaut.ts, partagée
// avec l'auto-seed exécuté au premier chargement de l'app.
import { prisma } from "../lib/prisma";
import { PRESTATIONS_DEFAUT, seederPrestationsSiVide } from "../lib/prestations-defaut";

async function main() {
  const avant = await prisma.prestationType.count();
  await seederPrestationsSiVide();
  console.log(
    avant > 0
      ? `Bibliothèque déjà remplie (${avant} prestations), seed ignoré.`
      : `${PRESTATIONS_DEFAUT.length} prestations types créées.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
