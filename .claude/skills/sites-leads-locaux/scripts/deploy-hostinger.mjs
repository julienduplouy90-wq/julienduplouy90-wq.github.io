#!/usr/bin/env node
// Déploie des sites générés sur Hostinger via l'API developers.hostinger.com.
//
//   node scripts/deploy-hostinger.mjs --site sites/abri-piscine.json [--order 1009872677]
//   node scripts/deploy-hostinger.mjs --fleet sites/
//
// Pour chaque site : si "domain" vaut "auto", génère un sous-domaine gratuit *.hostingersite.com et l'écrit
// dans le JSON ; crée le site sur la commande Hostinger s'il n'existe pas ; (re)construit le site en --draft si
// l'éditeur est incomplet ; zippe dist/<domaine>/ ; l'envoie en TUS ; lance le déploiement statique.
// Jeton : HOSTINGER_API_TOKEN, ou injecté par le proxy en session cloud (lancer alors avec NODE_USE_ENV_PROXY=1).
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const API = "https://developers.hostinger.com/api/hosting/v1";
const TOKEN = process.env.HOSTINGER_API_TOKEN ?? "proxy-injected";
const OUT = resolve(opt("--out", "dist"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, path, body) {
  for (let i = 0; i < 6; i++) {
    const r = await fetch(API + path, {
      method,
      headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json", accept: "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if ((r.status === 409 || r.status === 429 || r.status >= 500) && i < 5) {
      await sleep(1000 * (+r.headers.get("retry-after") || 10));
      continue;
    }
    const text = await r.text();
    if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : {};
  }
}

const files = argv.includes("--fleet")
  ? (await readdir(resolve(opt("--fleet")))).filter((f) => f.endsWith(".json") && !f.startsWith("_")).map((f) => join(resolve(opt("--fleet")), f))
  : [resolve(opt("--site"))];

const orders = (await api("GET", "/orders")).data;
const orderId = +opt("--order", orders.find((o) => /business|cloud/.test(o.plan.name) && o.status === "active")?.id);
if (!orderId) throw new Error("Aucune commande Business/Cloud active : précisez --order");
const websites = async () => (await api("GET", "/websites?per_page=100")).data;

for (const file of files) {
  const site = JSON.parse(await readFile(file, "utf8"));
  if (!site.domain || site.domain === "auto") {
    site.domain = (await api("POST", "/domains/free-subdomains")).domain;
    await writeFile(file, JSON.stringify(site, null, 2) + "\n");
    console.log(`${site.niche} : sous-domaine ${site.domain}`);
  }
  let w = (await websites()).find((x) => x.domain === site.domain);
  if (!w) {
    await api("POST", `/orders/${orderId}/onboardings`, { domain: site.domain });
    for (let i = 0; i < 40; i++) {
      await sleep(12000);
      const s = (await api("GET", `/onboardings?domain=${encodeURIComponent(site.domain)}`)) ;
      const st = (Array.isArray(s) ? s : s.data ?? [])[0]?.status;
      if (st === "completed") break;
      if (st === "failed") throw new Error(`création du site ${site.domain} échouée`);
    }
    w = (await websites()).find((x) => x.domain === site.domain);
    console.log(`${site.domain} : site créé`);
  }

  // Build (brouillon noindex si l'éditeur est incomplet — normal sur un domaine provisoire).
  const buildArgs = [`${here}/build-site.mjs`, "--site", file, "--out", OUT];
  if (opt("--businesses")) buildArgs.push("--businesses", opt("--businesses"));
  try { execFileSync("node", buildArgs, { stdio: "inherit" }); }
  catch { execFileSync("node", [...buildArgs, "--draft"], { stdio: "inherit" }); }

  const zip = join(OUT, `${site.domain}.zip`);
  execFileSync("bash", ["-c", `cd "${join(OUT, site.domain)}" && rm -f "${zip}" && zip -qr "${zip}" .`]);
  const size = (await stat(zip)).size;

  const up = await api("POST", "/files/upload-urls", { username: w.username, domain: site.domain });
  const target = `${up.url.replace(/\/$/, "")}/site.zip?override=true`;
  const h = { "X-Auth": up.auth_key, "X-Auth-Rest": up.rest_auth_key, "Tus-Resumable": "1.0.0" };
  let r = await fetch(target, { method: "POST", headers: { ...h, "Upload-Length": String(size), "Upload-Offset": "0" } });
  if (r.status !== 201) throw new Error(`TUS create ${r.status} ${await r.text()}`);
  const buf = await readFile(zip);
  const CHUNK = 20 * 1024 * 1024;
  for (let off = 0; off < size; off += CHUNK) {
    r = await fetch(target, {
      method: "PATCH",
      headers: { ...h, "Upload-Offset": String(off), "Content-Type": "application/offset+octet-stream" },
      body: buf.subarray(off, Math.min(off + CHUNK, size)),
    });
    if (r.status !== 204 && r.status !== 200) throw new Error(`TUS patch ${r.status} ${await r.text()}`);
  }
  await api("POST", `/accounts/${w.username}/websites/${site.domain}/deploy`, { archive_path: "site.zip" });
  console.log(`✓ ${site.domain} déployé (${(size / 1e6).toFixed(1)} Mo) → https://${site.domain}/`);
}
