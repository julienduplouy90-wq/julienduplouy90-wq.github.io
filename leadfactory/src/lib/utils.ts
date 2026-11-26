import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d: Date | string | null | undefined, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", opts).format(typeof d === "string" ? new Date(d) : d);
}

export const PERIODS = { "7d": "7 jours", "30d": "30 jours", "90d": "90 jours", "12m": "12 mois", all: "Tout" } as const;
export type Period = keyof typeof PERIODS;

export function parsePeriod(v: unknown): Period {
  return typeof v === "string" && v in PERIODS ? (v as Period) : "90d";
}

export function periodStart(p: Period, now = new Date()): Date | null {
  const days = { "7d": 7, "30d": 30, "90d": 90, "12m": 365, all: null }[p];
  return days === null ? null : new Date(now.getTime() - days * 86400000);
}

export function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}
