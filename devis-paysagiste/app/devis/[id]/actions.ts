"use server";

// Actions sur un devis existant : changer le statut, supprimer.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function changerStatut(formData: FormData) {
  const id = Number(formData.get("id"));
  const statut = String(formData.get("statut"));
  if (!Number.isInteger(id) || !["brouillon", "envoyé"].includes(statut)) return;

  await prisma.devis.update({ where: { id }, data: { statut } });
  revalidatePath(`/devis/${id}`);
  revalidatePath("/devis");
}

export async function supprimerDevis(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  // Les lignes sont supprimées en cascade (voir schema.prisma).
  await prisma.devis.delete({ where: { id } });
  revalidatePath("/devis");
  redirect("/devis");
}
