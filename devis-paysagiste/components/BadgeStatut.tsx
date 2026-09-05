// Petit badge coloré pour le statut d'un devis.
export function BadgeStatut({ statut }: { statut: string }) {
  const envoye = statut === "envoyé";
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        envoye ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
      }`}
    >
      {envoye ? "Envoyé" : "Brouillon"}
    </span>
  );
}
