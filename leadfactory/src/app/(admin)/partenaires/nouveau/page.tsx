import { Card, CardBody, PageHeader } from "@/components/ui";
import { ActionForm } from "@/components/admin/action-form";
import { PartnerFields } from "@/components/admin/partner-fields";
import { savePartner } from "@/lib/actions";
import { listProjects } from "@/lib/repo/queries";
import { assainissement } from "@/lib/sites/niches/assainissement";

export const metadata = { title: "Nouveau partenaire" };

export default async function NewPartner() {
  const projects = await listProjects();
  return (
    <>
      <PageHeader title="Nouveau partenaire" />
      <Card><CardBody>
        <ActionForm action={savePartner.bind(null, null)} submitLabel="Créer le partenaire">
          <PartnerFields services={assainissement.services} projects={projects} />
        </ActionForm>
      </CardBody></Card>
    </>
  );
}
