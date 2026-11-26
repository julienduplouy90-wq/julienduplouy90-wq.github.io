/** Normalisation et validation des coordonnées (France pour le MVP, extensible par pays). */

export function normalizeEmail(email: string | null | undefined): string | null {
  const e = (email ?? "").trim().toLowerCase();
  return e.length ? e : null;
}

export function isValidEmail(email: string | null | undefined): boolean {
  const e = normalizeEmail(email);
  return !!e && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e) && e.length <= 254;
}

/** Normalise un numéro français au format national 0XXXXXXXXX. Retourne null si vide. */
export function normalizePhoneFR(phone: string | null | undefined): string | null {
  let p = (phone ?? "").replace(/[\s.\-()]/g, "");
  if (!p) return null;
  if (p.startsWith("+33")) p = "0" + p.slice(3);
  else if (p.startsWith("0033")) p = "0" + p.slice(4);
  return p;
}

export function isValidPhoneFR(phone: string | null | undefined): boolean {
  const p = normalizePhoneFR(phone);
  return !!p && /^0[1-9]\d{8}$/.test(p);
}

export function isValidPostalCodeFR(cp: string): boolean {
  return /^(?:0[1-9]|[1-8]\d|9[0-8]|2[AB])\d{3}$/i.test(cp.trim()) || /^\d{5}$/.test(cp.trim());
}

/** Un code postal est couvert s'il commence par l'un des codes de zone (département ou préfixe). */
export function isPostalCodeInZones(postalCode: string, zoneCodes: string[]): boolean {
  const cp = postalCode.trim();
  return zoneCodes.some((z) => z.length > 0 && cp.startsWith(z));
}

/** Clé de dédoublonnage : téléphone normalisé en priorité, sinon e-mail. */
export function dedupeKey(phone: string | null, email: string | null): string {
  const p = normalizePhoneFR(phone);
  if (p) return `p:${p}`;
  const e = normalizeEmail(email);
  if (e) return `e:${e}`;
  return "none";
}

const DISPOSABLE_DOMAINS = ["yopmail.com", "mailinator.com", "guerrillamail.com", "10minutemail.com", "trashmail.com", "tempmail.com"];

/** Signaux faibles d'inauthenticité : ne rejettent rien, alertent la validation humaine. */
export function authenticitySignals(input: { fullName: string; email: string | null; phone: string | null; description: string | null }): string[] {
  const s: string[] = [];
  const email = normalizeEmail(input.email);
  if (email && DISPOSABLE_DOMAINS.some((d) => email.endsWith("@" + d))) s.push("Adresse e-mail jetable");
  const phone = normalizePhoneFR(input.phone);
  if (phone && /^0(\d)\1{8}$/.test(phone)) s.push("Numéro de téléphone répétitif");
  if (phone && /^0123456789$/.test(phone)) s.push("Numéro de téléphone fictif probable");
  if (input.fullName.trim().length < 3) s.push("Nom très court");
  if (/(https?:\/\/|www\.)/i.test(input.description ?? "")) s.push("Lien dans la description");
  if (/(.)\1{6,}/.test(input.description ?? "")) s.push("Description répétitive");
  return s;
}
