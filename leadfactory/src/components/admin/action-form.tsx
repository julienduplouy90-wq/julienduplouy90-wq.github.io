"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button, Notice } from "@/components/ui";
import type { ActionState } from "@/lib/actions";

type Action = (state: ActionState, fd: FormData) => Promise<ActionState>;

export function SubmitButton({ children, variant }: { children: ReactNode; variant?: "primary" | "secondary" | "danger" }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant={variant} disabled={pending}>{pending ? "Enregistrement…" : children}</Button>;
}

/** Formulaire relié à une action serveur avec retour d'état (succès / erreurs de validation). */
export function ActionForm({ action, children, submitLabel, className, encType }: { action: Action; children: ReactNode; submitLabel: string; className?: string; encType?: string }) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className} encType={encType}>
      {children}
      {state && (
        <Notice tone={state.ok ? "success" : "danger"} className="mt-4">
          <p className="font-medium">{state.message}</p>
          {state.errors && state.errors.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-xs">{state.errors.slice(0, 30).map((e) => <li key={e}>{e}</li>)}</ul>
          )}
        </Notice>
      )}
      <div className="mt-5"><SubmitButton>{submitLabel}</SubmitButton></div>
    </form>
  );
}

/** Bouton d'action destructive avec confirmation navigateur. */
export function ConfirmButton({ message, children, variant = "danger" }: { message: string; children: ReactNode; variant?: "danger" | "secondary" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {children}
    </Button>
  );
}
