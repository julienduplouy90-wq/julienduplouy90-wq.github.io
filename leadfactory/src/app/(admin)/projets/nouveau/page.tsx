import { Card, CardBody, PageHeader } from "@/components/ui";
import { ActionForm } from "@/components/admin/action-form";
import { ProjectFields } from "@/components/admin/project-fields";
import { createProject } from "@/lib/actions";

export const metadata = { title: "Nouveau projet" };

export default function NewProject() {
  return (
    <>
      <PageHeader title="Nouveau projet" description="Crée le projet, ses services (selon la niche) et un site en brouillon. Aucune publication." />
      <Card><CardBody><ActionForm action={createProject} submitLabel="Créer le projet"><ProjectFields /></ActionForm></CardBody></Card>
    </>
  );
}
