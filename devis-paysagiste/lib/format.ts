// Petits helpers de formatage (euros, dates) utilisés partout.

const euros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function formatEuros(montant: number): string {
  return euros.format(montant);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Fourchette indicative, ex : "15 € – 25 € / m²"
export function formatFourchette(min: number, max: number, unite: string): string {
  return `${euros.format(min)} – ${euros.format(max)} / ${unite}`;
}
