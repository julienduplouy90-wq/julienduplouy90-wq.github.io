import Link from "next/link";
import { Card, CardBody } from "@/components/ui";
import { ActionForm } from "@/components/admin/action-form";
import { ProjectFields } from "@/components/admin/project-fields";
import { createProject } from "@/lib/actions";

export const metadata = { title: "Nouveau site" };

export default function NewSite() {
  return (
    <>
      <Link href="/sites" className="text-sm text-muted-foreground hover:text-foreground">← Mes sites</Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Nouveau site</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">Choisissez une activité et une zone : les pages, services et le formulaire sont créés automatiquement, en brouillon.</p>
      <Card><CardBody><ActionForm action={createProject} submitLabel="Créer le site"><ProjectFields /></ActionForm></CardBody></Card>
    </>
  );
}
