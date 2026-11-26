import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/domain/labels";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-3.5 transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "border bg-card hover:bg-muted",
  ghost: "hover:bg-muted",
  danger: "bg-danger text-white hover:opacity-90",
};

export function Button({ variant = "primary", className, ...p }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cn(buttonBase, variants[variant], className)} {...p} />;
}

export function ButtonLink({ variant = "primary", className, ...p }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(buttonBase, variants[variant], className)} {...p} />;
}

export function Card({ className, ...p }: ComponentProps<"div">) {
  return <div className={cn("rounded-xl border bg-card shadow-sm", className)} {...p} />;
}
export function CardHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function CardBody({ className, ...p }: ComponentProps<"div">) {
  return <div className={cn("p-5", className)} {...p} />;
}

const tones: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/10 text-danger",
};
export function Badge({ tone = "neutral", className, ...p }: ComponentProps<"span"> & { tone?: Tone }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", tones[tone], className)} {...p} />;
}

const field = "w-full rounded-md border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus-visible:outline-2";
export function Input({ className, ...p }: ComponentProps<"input">) {
  return <input className={cn(field, "h-9", className)} {...p} />;
}
export function Textarea({ className, ...p }: ComponentProps<"textarea">) {
  return <textarea className={cn(field, "min-h-20", className)} {...p} />;
}
export function Select({ className, options, ...p }: ComponentProps<"select"> & { options: { value: string; label: string }[] }) {
  return (
    <select className={cn(field, "h-9", className)} {...p}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            {head.map((h, i) => (
              <th key={i} className="px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}
export function Td({ className, ...p }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-2.5 align-top", className)} {...p} />;
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "success" | "danger" }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular", tone === "success" && "text-success", tone === "danger" && "text-danger")}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function Notice({ tone = "info", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <div className={cn("rounded-lg px-4 py-3 text-sm", tones[tone], className)}>{children}</div>;
}

/** Module non développé : affichage explicite, sans bouton trompeur. */
export function FutureModule({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="border-dashed">
      <CardBody>
        <Badge>Module futur — non disponible dans le MVP</Badge>
        <h2 className="mt-3 font-semibold">{title}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {items.map((i) => <li key={i}>{i}</li>)}
        </ul>
      </CardBody>
    </Card>
  );
}
