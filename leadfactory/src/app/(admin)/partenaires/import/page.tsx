import { Card, CardBody, Field, Input, Notice, PageHeader, Textarea } from "@/components/ui";
import { ActionForm } from "@/components/admin/action-form";
import { importPartners } from "@/lib/actions";

export const metadata = { title: "Importer des partenaires" };

const EXAMPLE = `Entreprise;Contact;E-mail;Téléphone;Site;Adresse;Départements;Services;Prix;Capacité;Statut;Source;Date de vérification;Notes
Société Exemple (fictive);Prénom Nom;contact@example.com;05 00 00 00 00;https://example.com;1 rue Exemple 24000 Ville;24;micro-station|rehabilitation;50;5;Contacté;Site officiel de l'entreprise;15/11/2026;`;

export default function ImportPartners() {
  return (
    <>
      <PageHeader title="Importer des partenaires (CSV)" description="Séparateur ; ou , — en-têtes en français reconnus automatiquement. Les doublons (nom ou e-mail) sont ignorés." />
      <Notice tone="warning" className="mb-6">
        N&apos;importez que des coordonnées professionnelles issues de sources autorisées, et renseignez la colonne « Source ». Le fichier n&apos;est pas conservé.
      </Notice>
      <Card><CardBody>
        <ActionForm action={importPartners} submitLabel="Importer" encType="multipart/form-data">
          <div className="space-y-4">
            <Field label="Fichier CSV (1 Mo max)"><Input type="file" name="file" accept=".csv,text/csv" /></Field>
            <Field label="…ou collez le contenu CSV" hint="Colonnes reconnues : Entreprise (obligatoire), Contact, E-mail, Téléphone, Site, Adresse, Zone, Départements, Services (slugs séparés par |), Prix, Capacité, Statut, Source, Date de vérification, Notes.">
              <Textarea name="csv" rows={8} className="font-mono text-xs" placeholder={EXAMPLE} />
            </Field>
          </div>
        </ActionForm>
      </CardBody></Card>
    </>
  );
}
