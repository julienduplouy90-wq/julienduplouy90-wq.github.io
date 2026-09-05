// Génère le PDF d'un devis et le renvoie en téléchargement.
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { DevisPdf } from "@/lib/pdf/DevisPdf";

export const dynamic = "force-dynamic";

export async function GET(
  _requete: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum)) {
    return new Response("Identifiant invalide", { status: 400 });
  }

  const [devis, profil] = await Promise.all([
    prisma.devis.findUnique({ where: { id: idNum }, include: { lignes: true } }),
    prisma.profil.findFirst(),
  ]);
  if (!devis) return new Response("Devis introuvable", { status: 404 });

  const buffer = await renderToBuffer(
    <DevisPdf
      devis={{
        ...devis,
        entreprise: {
          // Zone en-tête « en dur » pour l'instant : personnalisable plus tard.
          nom: profil?.nomEntreprise || "Votre entreprise de paysagisme",
          ville: profil?.ville ?? "",
          codePostal: profil?.codePostal ?? "",
        },
      }}
    />
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      // Nom de fichier en ASCII simple (les en-têtes HTTP n'acceptent pas les accents).
      "Content-Disposition": `attachment; filename="devis-${devis.id}-${devis.nomClient
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9 -]/g, "")
        .trim()
        .replace(/ +/g, "-")
        .toLowerCase()}.pdf"`,
    },
  });
}
