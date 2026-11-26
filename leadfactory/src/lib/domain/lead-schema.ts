import { z } from "zod";
import type { NicheDefinition } from "@/lib/sites/types";
import { isValidEmail, isValidPhoneFR } from "./contact";

export const OTHER_SERVICE = "other";

/** Construit le schéma Zod du formulaire public à partir de la définition de niche. */
export function buildLeadSchema(niche: NicheDefinition) {
  const answers: Record<string, z.ZodType> = {};
  for (const q of niche.questions) {
    if (q.kind === "choice") {
      const e = z.enum(q.choices.map((c) => c.value) as [string, ...string[]]);
      answers[q.id] = q.required ? e : e.nullable().optional();
    } else {
      const n = z.number().int().min(q.min).max(q.max).nullable();
      answers[q.id] = q.required ? n : n.optional();
    }
  }
  return z
    .object({
      siteSlug: z.string().min(1).max(100),
      serviceSlug: z.enum([OTHER_SERVICE, ...niche.services.map((s) => s.slug)] as [string, ...string[]]),
      postalCode: z.string().trim().regex(/^\d{5}$/, "Code postal à 5 chiffres"),
      city: z.string().trim().min(1, "Commune requise").max(120),
      answers: z.object(answers),
      timeline: z.enum(niche.timelines.map((t) => t.value) as [string, ...string[]]),
      fullName: z.string().trim().min(2, "Nom requis").max(120),
      email: z.string().trim().max(254).optional().default(""),
      phone: z.string().trim().max(30).optional().default(""),
      description: z.string().trim().max(2000).optional().default(""),
      consent: z.literal(true, { error: "L'autorisation de transmission est nécessaire pour traiter votre demande" }),
      consentVersion: z.string().min(1).max(60),
      // Anti-spam : champ piège (doit rester vide) et horodatage de début de saisie.
      website: z.string().max(0).optional().default(""),
      startedAt: z.number().int().positive(),
    })
    .refine((d) => isValidPhoneFR(d.phone) || isValidEmail(d.email), {
      message: "Indiquez un téléphone ou un e-mail valide",
      path: ["phone"],
    })
    .refine((d) => d.email === "" || isValidEmail(d.email), { message: "E-mail invalide", path: ["email"] })
    .refine((d) => d.phone === "" || isValidPhoneFR(d.phone), { message: "Téléphone invalide", path: ["phone"] });
}

export type LeadSubmission = z.infer<ReturnType<typeof buildLeadSchema>>;

export const projectInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug : minuscules, chiffres et tirets").max(80),
  niche: z.string().min(1),
  country: z.string().length(2).default("FR"),
  currency: z.string().length(3).default("EUR"),
  zoneLabel: z.string().trim().min(2).max(120),
  zoneCodes: z.array(z.string().regex(/^[0-9AB]{2,5}$/i)).min(1, "Au moins un code de zone"),
  domain: z.string().trim().max(253).nullable(),
  status: z.enum(["draft", "active", "paused", "archived"]),
  targetPriceCents: z.number().int().nonnegative(),
  budgetCents: z.number().int().nonnegative(),
  freeLeadsPerPartner: z.number().int().min(0).max(20),
  objectives: z.string().trim().max(2000).nullable(),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

export const expenseInputSchema = z.object({
  projectId: z.uuid().nullable(),
  category: z.enum(["ads", "domain", "hosting", "api", "other"]),
  label: z.string().trim().min(2).max(200),
  amountCents: z.number().int().positive(),
  spentOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
