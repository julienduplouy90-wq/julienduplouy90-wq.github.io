import { Button, Select } from "@/components/ui";
import { PERIODS, type Period } from "@/lib/utils";
import { nicheOptions } from "@/lib/sites/niches";

/** Filtres en GET : fonctionnent sans JavaScript et l'URL reste partageable. */
export function FilterBar({ period, projectId, niche, projects, showNiche = true }: {
  period: Period; projectId?: string; niche?: string; projects: { id: string; name: string }[]; showNiche?: boolean;
}) {
  return (
    <form method="get" className="mb-6 flex flex-wrap items-end gap-2" aria-label="Filtres">
      <label className="flex flex-col text-xs text-muted-foreground">Période
        <Select name="period" defaultValue={period} className="mt-1 w-36" options={Object.entries(PERIODS).map(([value, label]) => ({ value, label }))} />
      </label>
      <label className="flex flex-col text-xs text-muted-foreground">Projet
        <Select name="project" defaultValue={projectId ?? ""} className="mt-1 w-60" options={[{ value: "", label: "Tous les projets" }, ...projects.map((p) => ({ value: p.id, label: p.name }))]} />
      </label>
      {showNiche && (
        <label className="flex flex-col text-xs text-muted-foreground">Niche
          <Select name="niche" defaultValue={niche ?? ""} className="mt-1 w-56" options={[{ value: "", label: "Toutes les niches" }, ...nicheOptions]} />
        </label>
      )}
      <Button type="submit" variant="secondary">Appliquer</Button>
    </form>
  );
}
