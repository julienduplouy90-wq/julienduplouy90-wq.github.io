"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Choice, NicheService, Question, TimelineChoice } from "@/lib/sites/types";

type Props = {
  siteSlug: string;
  zoneLabel: string;
  services: NicheService[];
  otherServiceLabel: string;
  questions: Question[];
  timelines: TimelineChoice[];
  consentText: string;
  consentVersion: string;
  privacyHref: string;
  initialService?: string;
};

type State = {
  serviceSlug: string; postalCode: string; city: string; answers: Record<string, string | number | null>;
  timeline: string; fullName: string; phone: string; email: string; description: string; consent: boolean; website: string;
};

const input = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30";

function Options({ name, value, options, onChange }: { name: string; value: string; options: Choice[]; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => (
        <label key={o.value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition ${value === o.value ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600" : "border-slate-300 hover:border-slate-400"}`}>
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="size-4 accent-emerald-700" />
          {o.label}
        </label>
      ))}
    </div>
  );
}

export function LeadForm(p: Props) {
  const [state, setState] = useState<State>({
    serviceSlug: p.services.some((s) => s.slug === p.initialService) ? p.initialService! : "", postalCode: "", city: "",
    answers: Object.fromEntries(p.questions.map((q) => [q.id, q.kind === "number" ? null : ""])),
    timeline: "", fullName: "", phone: "", email: "", description: "", consent: false, website: "",
  });
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const startedAt = useRef<number>(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { startedAt.current = Date.now(); }, []);
  useEffect(() => { if (step > 0) heading.current?.focus(); }, [step]);

  const set = <K extends keyof State>(k: K, v: State[K]) => setState((s) => ({ ...s, [k]: v }));
  const setAnswer = (id: string, v: string | number | null) => setState((s) => ({ ...s, answers: { ...s.answers, [id]: v } }));

  type Step = { title: string; body: ReactNode; valid: () => string | null };
  const steps: Step[] = [
    {
      title: "Quelle est la nature de votre projet ?",
      body: <Options name="service" value={state.serviceSlug} onChange={(v) => set("serviceSlug", v)}
        options={[...p.services.map((s) => ({ value: s.slug, label: s.name })), { value: "other", label: p.otherServiceLabel }]} />,
      valid: () => (state.serviceSlug ? null : "Choisissez une option."),
    },
    {
      title: "Où se situe le projet ?",
      body: (
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <label className="text-sm font-medium">Code postal
            <input className={input} inputMode="numeric" autoComplete="postal-code" maxLength={5} value={state.postalCode} onChange={(e) => set("postalCode", e.target.value.replace(/\D/g, ""))} />
          </label>
          <label className="text-sm font-medium">Commune
            <input className={input} autoComplete="address-level2" value={state.city} onChange={(e) => set("city", e.target.value)} />
          </label>
        </div>
      ),
      valid: () => (!/^\d{5}$/.test(state.postalCode) ? "Indiquez un code postal à 5 chiffres." : state.city.trim() ? null : "Indiquez la commune."),
    },
    ...p.questions.map((q): Step => ({
      title: q.label + (q.required ? "" : " (facultatif)"),
      body: (
        <div>
          {q.help && <p className="mb-3 text-sm text-slate-500">{q.help}</p>}
          {q.kind === "choice" ? (
            <Options name={q.id} value={String(state.answers[q.id] ?? "")} options={q.choices} onChange={(v) => setAnswer(q.id, v)} />
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <input aria-label={q.label} type="number" min={q.min} max={q.max} className={`${input} w-32`} value={state.answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value === "" ? null : Number(e.target.value))} />
              {q.unknownLabel && <button type="button" className="text-sm text-emerald-800 underline" onClick={() => { setAnswer(q.id, null); setStep((s) => s + 1); }}>{q.unknownLabel}</button>}
            </div>
          )}
        </div>
      ),
      valid: () => {
        const v = state.answers[q.id];
        if (q.kind === "number") return v === null || (Number.isInteger(v) && (v as number) >= q.min && (v as number) <= q.max) ? null : `Nombre entre ${q.min} et ${q.max}.`;
        return !q.required || v ? null : "Choisissez une option.";
      },
    })),
    {
      title: "Quel est votre délai envisagé ?",
      body: <Options name="timeline" value={state.timeline} options={p.timelines} onChange={(v) => set("timeline", v)} />,
      valid: () => (state.timeline ? null : "Choisissez une option."),
    },
    {
      title: "Vos coordonnées",
      body: (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2">Nom et prénom
            <input className={input} autoComplete="name" value={state.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </label>
          <label className="text-sm font-medium">Téléphone
            <input className={input} type="tel" autoComplete="tel" value={state.phone} onChange={(e) => set("phone", e.target.value)} />
            {fieldErrors.phone && <span className="text-xs text-red-700">{fieldErrors.phone}</span>}
          </label>
          <label className="text-sm font-medium">E-mail
            <input className={input} type="email" autoComplete="email" value={state.email} onChange={(e) => set("email", e.target.value)} />
            {fieldErrors.email && <span className="text-xs text-red-700">{fieldErrors.email}</span>}
          </label>
          <label className="text-sm font-medium sm:col-span-2">Précisions sur votre projet (facultatif)
            <textarea className={`${input} min-h-28`} maxLength={2000} value={state.description} onChange={(e) => set("description", e.target.value)}
              placeholder="Contexte, contraintes, accès au terrain…" />
          </label>
          <p className="text-xs text-slate-500 sm:col-span-2">Indiquez au moins un téléphone ou un e-mail. Ne communiquez pas d&apos;informations sensibles.</p>
        </div>
      ),
      valid: () => {
        if (state.fullName.trim().length < 2) return "Indiquez votre nom.";
        if (!state.phone.trim() && !state.email.trim()) return "Indiquez un téléphone ou un e-mail.";
        return null;
      },
    },
    {
      title: "Transmission de votre demande",
      body: (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Votre demande sera relue, puis transmise à <strong>une seule</strong> entreprise partenaire intervenant en {p.zoneLabel}, si une entreprise est disponible.
            Nous ne garantissons ni devis, ni prix, ni délai.
          </p>
          <label className="flex gap-3 rounded-lg border border-slate-300 p-4 text-sm">
            <input type="checkbox" checked={state.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-emerald-700" />
            <span>{p.consentText} <a href={p.privacyHref} target="_blank" className="text-emerald-800 underline">Politique de confidentialité</a></span>
          </label>
        </div>
      ),
      valid: () => (state.consent ? null : "Votre accord est nécessaire pour que nous puissions transmettre votre demande."),
    },
  ];

  const current = steps[step]!;
  const last = step === steps.length - 1;

  async function next() {
    const msg = current.valid();
    setError(msg);
    if (msg) return;
    if (!last) { setStep(step + 1); return; }
    setStatus("sending");
    setFieldErrors({});
    try {
      const res = await fetch("/api/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...state, siteSlug: p.siteSlug, consentVersion: p.consentVersion, startedAt: startedAt.current }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: Record<string, string> };
      if (res.ok && data.ok) { setStatus("done"); return; }
      setStatus("idle");
      setError(data.error ?? "Une erreur est survenue. Merci de réessayer.");
      if (data.fields) {
        setFieldErrors(data.fields);
        if (data.fields.phone || data.fields.email || data.fields.fullName) setStep(steps.length - 2);
      }
    } catch {
      setStatus("idle");
      setError("Connexion impossible. Vérifiez votre réseau et réessayez.");
    }
  }

  if (status === "done") {
    return (
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8">
        <h2 className="text-2xl font-semibold text-emerald-900">Merci, votre demande est enregistrée.</h2>
        <p className="mt-3 text-emerald-950">
          Elle va être relue. Si une entreprise partenaire intervient dans votre secteur, votre demande lui sera transmise et elle pourra vous recontacter.
          Vous pouvez demander la suppression de vos données à tout moment.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void next(); }} noValidate className="rounded-2xl border border-slate-200 p-5 shadow-sm sm:p-8">
      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-500"><span>Étape {step + 1} sur {steps.length}</span><span>{Math.round(((step + 1) / steps.length) * 100)} %</span></div>
        <div className="mt-2 h-1.5 rounded-full bg-slate-100" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1} aria-label="Progression">
          <div className="h-1.5 rounded-full bg-emerald-600 transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
      </div>
      <fieldset>
        <legend className="sr-only">{current.title}</legend>
        <h2 ref={heading} tabIndex={-1} className="mb-5 text-xl font-semibold outline-none">{current.title}</h2>
        {current.body}
      </fieldset>
      {/* Pot de miel : invisible pour les humains, rempli par les robots. */}
      <div aria-hidden className="absolute left-[-10000px] h-px w-px overflow-hidden">
        <label>Site web<input tabIndex={-1} autoComplete="off" value={state.website} onChange={(e) => set("website", e.target.value)} /></label>
      </div>
      <p aria-live="polite" className="mt-4 min-h-5 text-sm text-red-700">{error}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        {step > 0 ? <button type="button" onClick={() => { setError(null); setStep(step - 1); }} className="h-11 rounded-lg px-4 text-sm font-medium text-slate-600 hover:bg-slate-100">← Retour</button> : <span />}
        <button type="submit" disabled={status === "sending"} className="h-12 rounded-lg bg-emerald-700 px-6 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
          {last ? (status === "sending" ? "Envoi…" : "Envoyer ma demande") : "Continuer"}
        </button>
      </div>
    </form>
  );
}
