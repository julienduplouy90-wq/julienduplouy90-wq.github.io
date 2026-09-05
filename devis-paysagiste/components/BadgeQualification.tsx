// Badge de qualification d'un prospect selon les seuils de l'entreprise.
import type { Qualification } from "@/lib/moteur";

const STYLES: Record<Qualification, { texte: string; classes: string }> = {
  fort: { texte: "Forte valeur", classes: "bg-emerald-100 text-emerald-800" },
  standard: { texte: "Standard", classes: "bg-blue-100 text-blue-800" },
  petit: { texte: "Petit projet", classes: "bg-stone-200 text-stone-700" },
  inconnu: { texte: "À qualifier", classes: "bg-amber-100 text-amber-800" },
};

export function BadgeQualification({ qualification }: { qualification: Qualification }) {
  const s = STYLES[qualification];
  return (
    <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${s.classes}`}>
      {s.texte}
    </span>
  );
}
