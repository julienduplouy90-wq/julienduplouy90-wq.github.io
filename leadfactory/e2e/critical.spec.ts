import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("le tableau de bord affiche les indicateurs et la bannière démo", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Vue d'ensemble" })).toBeVisible();
  await expect(page.getByText("Prospects reçus").first()).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Données de démonstration" })).toBeVisible();
});

test("un particulier dépose une demande sur le site pilote, visible dans le back-office", async ({ page }, info) => {
  const name = `Visiteur Test ${info.project.name}`;
  await page.goto("/s/assainissement-dordogne/devis");
  const next = page.getByRole("button", { name: "Continuer" });
  await page.getByLabel("Installation de micro-station d'épuration").check();
  await next.click();
  await page.getByLabel("Code postal").fill("24000");
  await page.getByLabel("Commune").fill("Commune test");
  await next.click();
  await page.getByLabel("Maison – résidence principale").check();
  await next.click();
  await page.getByLabel("Nombre de pièces principales").fill("4");
  await next.click();
  await page.getByLabel("Ancienne fosse septique").check();
  await next.click();
  await page.getByLabel("Oui – installation non conforme").check();
  await next.click();
  await page.getByLabel("Dans les 3 mois").check();
  await next.click();
  await page.getByLabel("Nom et prénom").fill(name);
  await page.getByLabel("Téléphone").fill(info.project.name === "mobile" ? "0600000077" : "0600000078");
  await page.getByLabel("Précisions sur votre projet (facultatif)").fill("Remplacement envisagé suite au contrôle (test automatisé).");
  await next.click();
  // Le consentement est obligatoire
  await page.getByRole("button", { name: "Envoyer ma demande" }).click();
  await expect(page.getByText("Votre accord est nécessaire")).toBeVisible();
  await page.waitForTimeout(4200); // délai anti-robot minimal
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Envoyer ma demande" }).click();
  await expect(page.getByText("Merci, votre demande est enregistrée.")).toBeVisible();

  await page.goto("/prospects?q=" + encodeURIComponent(name));
  await page.getByRole("link", { name }).click();
  await expect(page.getByText(/Score : \d+ \/ 100/)).toBeVisible();
  await page.getByRole("button", { name: "Qualifier" }).click();
  await expect(page.getByText("Qualifié").first()).toBeVisible();
});

test("la double attribution est impossible et la transmission reste manuelle", async ({ page }) => {
  await page.goto("/distribution");
  // File d'attente : prospects démo qualifiés (Lot-et-Garonne) servis par les partenaires démo actifs.
  const first = page.locator("table").first().getByRole("link", { name: /Client Démo/ }).first();
  await first.click();
  await page.getByRole("button", { name: "Attribuer" }).first().click();
  await expect(page.getByRole("button", { name: "Marquer comme transmis" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Attribuer" })).toHaveCount(0);
  await expect(page.getByText("LeadFactory n'envoie rien")).toBeAttached();
});

test("le robots.txt bloque l'indexation d'un site non publié", async ({ request }) => {
  const r = await request.get("/s/assainissement-dordogne/robots.txt");
  expect(await r.text()).toContain("Disallow: /");
});
